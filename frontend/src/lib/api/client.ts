/**
 * SettleCart Centralized openapi-fetch API Client
 * 
 * Provides a strongly-typed HTTP client configured with:
 * - Dynamic base URL resolution (NEXT_PUBLIC_API_URL or local default)
 * - Automatic Authorization header injection from auth-storage
 * - Transparent 401 token refresh with concurrency mutex and retry guard
 * - Automatic AppException error envelope parsing and typed ApiError throwing
 */

import createFetchClient, { type Middleware } from 'openapi-fetch';
import { authStorage } from './auth-storage';
import type { paths } from './schema';
import { ApiError } from './types';

export const DEFAULT_API_URL = 'http://localhost:8000/api/v1';

/**
 * Returns the normalized API base URL (origin only, no trailing slash).
 * The generated schema paths already include the `/api/v1` prefix, so the
 * base must NOT include it — otherwise requests are built with a doubled
 * `/api/v1/api/v1` prefix.
 *
 * When the frontend is served over HTTPS (e.g. on Vercel production), browsers
 * strictly forbid cross-origin requests to insecure HTTP backends (Mixed Content).
 * In that scenario, or when NEXT_PUBLIC_API_URL is unset/relative, an empty base
 * URL is returned so calls route to same-origin `/api/v1/...` and are proxied
 * securely via Next.js rewrites to the EC2 backend.
 */
export function getBaseUrl(): string {
  const envUrl = (process.env.NEXT_PUBLIC_API_URL || '').trim();

  // In the browser:
  if (typeof window !== 'undefined') {
    // If the frontend is loaded over HTTPS and the API URL is insecure HTTP,
    // the browser blocks it as Mixed Content. Fall back to same-origin rewrite.
    if (window.location.protocol === 'https:' && envUrl.startsWith('http://')) {
      return '';
    }
    // If no explicit API URL is set, also route through Next.js rewrites proxy.
    if (!envUrl) {
      return '';
    }
    return envUrl.replace(/\/+$/, '').replace(/\/api\/v1$/, '');
  }

  // On the server (SSR / Node.js runtime):
  // Global fetch in Node.js requires an absolute URL.
  const serverUrl =
    process.env.BACKEND_API_INTERNAL_URL ||
    process.env.BACKEND_INTERNAL_URL ||
    envUrl ||
    DEFAULT_API_URL;

  return serverUrl.replace(/\/+$/, '').replace(/\/api\/v1$/, '');
}

const PUBLIC_PATHS = [
  '/api/v1/auth/login',
  '/api/v1/auth/register',
  '/api/v1/auth/refresh',
];

function isPublicEndpoint(schemaPath: string, url: string): boolean {
  return PUBLIC_PATHS.some((path) => schemaPath === path || url.includes(path));
}

// Module-level mutex to avoid race conditions when multiple concurrent requests trigger 401
let refreshMutexPromise: Promise<string | null> | null = null;

async function executeTokenRefresh(baseUrl: string): Promise<string | null> {
  if (refreshMutexPromise) {
    return refreshMutexPromise;
  }

  refreshMutexPromise = (async () => {
    try {
      const refreshToken = authStorage.getRefreshToken();
      if (!refreshToken) {
        authStorage.clearTokens();
        return null;
      }

      let normalizedBase = baseUrl.replace(/\/+$/, '');
      if (typeof window !== 'undefined' && window.location.protocol === 'https:' && normalizedBase.startsWith('http://')) {
        normalizedBase = '';
      }
      const refreshUrl = normalizedBase.endsWith('/api/v1')
        ? `${normalizedBase}/auth/refresh`
        : `${normalizedBase}/api/v1/auth/refresh`;

      const response = await fetch(refreshUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });

      if (!response.ok) {
        authStorage.clearTokens();
        return null;
      }

      const data = await response.json();
      if (data && data.access_token) {
        authStorage.setTokens(data.access_token, data.refresh_token || refreshToken);
        return data.access_token;
      }

      authStorage.clearTokens();
      return null;
    } catch {
      authStorage.clearTokens();
      return null;
    } finally {
      refreshMutexPromise = null;
    }
  })();

  return refreshMutexPromise;
}

// Map to buffer request bodies in memory for possible 401 retry
const requestBodyBuffers = new Map<string, ArrayBuffer>();

const authMiddleware: Middleware = {
  async onRequest({ request, schemaPath, id }) {
    let currentRequest = request;

    // Buffer non-GET/HEAD request body for potential retry after 401
    let bufferedBody: ArrayBuffer | null = null;
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      try {
        const clone = request.clone();
        const buffer = await clone.arrayBuffer();
        if (buffer.byteLength > 0) {
          bufferedBody = buffer;
          requestBodyBuffers.set(id, buffer);
        }
      } catch {
        // Body buffering error fallback
      }
    }

    // Guard against Mixed Content: if the page is HTTPS but the request is HTTP,
    // rewrite the URL to same-origin HTTPS so Next.js rewrites proxy it.
    if (
      typeof window !== 'undefined' &&
      window.location.protocol === 'https:' &&
      currentRequest.url.startsWith('http://')
    ) {
      try {
        const parsed = new URL(currentRequest.url);
        const secureUrl = `${window.location.origin}${parsed.pathname}${parsed.search}`;
        const init: RequestInit = {
          method: currentRequest.method,
          headers: new Headers(currentRequest.headers),
        };
        if (bufferedBody) {
          init.body = bufferedBody;
          (init as Record<string, unknown>).duplex = 'half';
        }
        currentRequest = new Request(secureUrl, init);
      } catch {
        // Fallback: keep currentRequest
      }
    }

    // Deduplicate /api/v1 if baseUrl and schemaPath both included it.
    // Rebuild explicitly with the buffered bytes: re-wrapping via
    // `new Request(url, request)` drops the body in some browsers.
    if (currentRequest.url.includes('/api/v1/api/v1')) {
      const fixedUrl = currentRequest.url.replace('/api/v1/api/v1', '/api/v1');
      const init: RequestInit = {
        method: currentRequest.method,
        headers: new Headers(currentRequest.headers),
      };
      if (bufferedBody) {
        init.body = bufferedBody;
        (init as Record<string, unknown>).duplex = 'half';
      }
      currentRequest = new Request(fixedUrl, init);
    }

    // Attach Authorization header if token exists and not already provided or public
    if (!currentRequest.headers.has('Authorization') && !isPublicEndpoint(schemaPath, currentRequest.url)) {
      const token = authStorage.getToken();
      if (token) {
        currentRequest.headers.set('Authorization', `Bearer ${token}`);
      }
    }

    return currentRequest;
  },

  async onResponse({ request, response, schemaPath, options, id }) {
    const bufferedBody = requestBodyBuffers.get(id);
    requestBodyBuffers.delete(id);

    if (response.ok) {
      return response;
    }

    const is401 = response.status === 401;
    const isRefresh = schemaPath.includes('/auth/refresh') || request.url.includes('/auth/refresh');
    const isLogin = schemaPath.includes('/auth/login') || request.url.includes('/auth/login');
    const isRetried = request.headers.get('x-settlecart-retry') === 'true';

    // 401 Refresh & Retry Mutex
    if (is401 && !isRefresh && !isLogin && !isRetried) {
      const refreshToken = authStorage.getRefreshToken();
      if (refreshToken) {
        const newAccessToken = await executeTokenRefresh(options.baseUrl);
        if (newAccessToken) {
          // Construct retry request with fresh access token and retry prevention header
          const retryHeaders = new Headers(request.headers);
          retryHeaders.set('Authorization', `Bearer ${newAccessToken}`);
          retryHeaders.set('x-settlecart-retry', 'true');

          const retryInit: RequestInit = {
            method: request.method,
            headers: retryHeaders,
          };

          if (bufferedBody && request.method !== 'GET' && request.method !== 'HEAD') {
            retryInit.body = bufferedBody;
            (retryInit as Record<string, unknown>).duplex = 'half';
          }

          const retryRequest = new Request(request.url, retryInit);
          const retryResponse = await (options.fetch || fetch)(retryRequest);

          if (retryResponse.ok) {
            return retryResponse;
          }

          // If retry failed, fall through to error extraction with retryResponse
          response = retryResponse;
        } else {
          authStorage.clearTokens();
          throw new ApiError(401, 'unauthorized', 'Session expired. Please log in again.');
        }
      } else {
        authStorage.clearTokens();
      }
    }

    // Parse AppException error envelope: { error: { code, message, details } }
    let errorJson: Record<string, unknown> | null = null;
    try {
      const cloned = response.clone();
      errorJson = await cloned.json();
    } catch {
      // Non-JSON response
    }

    if (errorJson && typeof errorJson === 'object' && errorJson.error && typeof errorJson.error === 'object') {
      const errorObj = errorJson.error as { code?: string; message?: string; details?: unknown };
      throw new ApiError(
        response.status,
        errorObj.code || (response.status === 401 ? 'unauthorized' : 'api_error'),
        errorObj.message || response.statusText || 'An error occurred',
        errorObj.details
      );
    }

    throw new ApiError(
      response.status,
      response.status === 401 ? 'unauthorized' : 'http_error',
      response.statusText || `Request failed with status ${response.status}`,
      errorJson
    );
  },
};

/**
 * The typed openapi-fetch client instance.
 */
export const client = createFetchClient<paths>({
  baseUrl: getBaseUrl(),
});

client.use(authMiddleware);

/**
 * Convenient alias for client.
 */
export const api = client;

/**
 * Strongly-typed HTTP method shortcuts.
 */
export const {
  GET,
  POST,
  PUT,
  PATCH,
  DELETE,
} = client;

export default client;
