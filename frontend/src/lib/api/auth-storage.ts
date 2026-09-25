/**
 * SettleCart Isomorphic Auth Storage Manager
 * 
 * Provides an SSR-safe token management abstraction that transparently synchronizes
 * access and refresh tokens between cookies (for SSR / HTTP transport) and localStorage
 * (for fast client-side lookup and persistence).
 * 
 * Safe for Next.js Server Components, Edge runtimes, and client-side browser execution.
 */

export const ACCESS_TOKEN_KEY = 'settlecart_access_token';
export const REFRESH_TOKEN_KEY = 'settlecart_refresh_token';

// 7 days in seconds for access token cookie
const ACCESS_TOKEN_MAX_AGE = 7 * 24 * 60 * 60;
// 30 days in seconds for refresh token cookie
const REFRESH_TOKEN_MAX_AGE = 30 * 24 * 60 * 60;

function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof document !== 'undefined';
}

function parseCookie(cookieString: string, name: string): string | null {
  if (!cookieString) return null;
  const match = cookieString.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

function writeCookie(name: string, value: string, maxAgeSeconds: number): void {
  if (!isBrowser()) return;
  const isSecure = window.location?.protocol === 'https:';
  const secureFlag = isSecure ? '; Secure' : '';
  document.cookie = `${name}=${encodeURIComponent(value)}; Path=/; Max-Age=${maxAgeSeconds}; SameSite=Lax${secureFlag}`;
}

function removeCookie(name: string): void {
  if (!isBrowser()) return;
  const isSecure = window.location?.protocol === 'https:';
  const secureFlag = isSecure ? '; Secure' : '';
  document.cookie = `${name}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Max-Age=0; SameSite=Lax${secureFlag}`;
}

export interface AuthStorage {
  getToken(): string | null;
  getRefreshToken(): string | null;
  setTokens(accessToken: string, refreshToken?: string): void;
  clearTokens(): void;
  isAuthenticated(): boolean;
}

export const authStorage: AuthStorage = {
  /**
   * Retrieves the current access token.
   * Checks browser cookies first, falling back to localStorage.
   * Returns null in SSR environments or if no token is stored.
   */
  getToken(): string | null {
    if (!isBrowser()) {
      return null;
    }

    try {
      // 1. Try reading from cookie
      const cookieToken = parseCookie(document.cookie, ACCESS_TOKEN_KEY);
      if (cookieToken) {
        return cookieToken;
      }

      // 2. Fallback to localStorage
      if (window.localStorage) {
        return window.localStorage.getItem(ACCESS_TOKEN_KEY);
      }
    } catch {
      // Catch storage quota or security exceptions in sandboxed iframes
      return null;
    }

    return null;
  },

  /**
   * Retrieves the current refresh token.
   * Checks browser cookies first, falling back to localStorage.
   * Returns null in SSR environments or if no refresh token is stored.
   */
  getRefreshToken(): string | null {
    if (!isBrowser()) {
      return null;
    }

    try {
      // 1. Try reading from cookie
      const cookieToken = parseCookie(document.cookie, REFRESH_TOKEN_KEY);
      if (cookieToken) {
        return cookieToken;
      }

      // 2. Fallback to localStorage
      if (window.localStorage) {
        return window.localStorage.getItem(REFRESH_TOKEN_KEY);
      }
    } catch {
      return null;
    }

    return null;
  },

  /**
   * Persists access and optional refresh tokens into cookies and localStorage.
   * No-op in SSR environments.
   */
  setTokens(accessToken: string, refreshToken?: string): void {
    if (!isBrowser()) {
      return;
    }

    try {
      // Set access token cookie and localStorage
      writeCookie(ACCESS_TOKEN_KEY, accessToken, ACCESS_TOKEN_MAX_AGE);
      if (window.localStorage) {
        window.localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
      }

      // Set refresh token if provided
      if (refreshToken) {
        writeCookie(REFRESH_TOKEN_KEY, refreshToken, REFRESH_TOKEN_MAX_AGE);
        if (window.localStorage) {
          window.localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
        }
      }
    } catch {
      // Ignore localStorage write failures (e.g., storage quota exceeded)
    }
  },

  /**
   * Clears both access and refresh tokens from cookies and localStorage.
   * No-op in SSR environments.
   */
  clearTokens(): void {
    if (!isBrowser()) {
      return;
    }

    try {
      removeCookie(ACCESS_TOKEN_KEY);
      removeCookie(REFRESH_TOKEN_KEY);

      if (window.localStorage) {
        window.localStorage.removeItem(ACCESS_TOKEN_KEY);
        window.localStorage.removeItem(REFRESH_TOKEN_KEY);
      }
    } catch {
      // Ignore storage cleanup failures
    }
  },

  /**
   * Checks if an access token exists.
   */
  isAuthenticated(): boolean {
    return Boolean(this.getToken());
  },
};

export default authStorage;
