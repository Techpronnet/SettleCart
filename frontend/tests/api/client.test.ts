/**
 * Tier 1 & Tier 2 Tests: Client, Middleware, Auth Storage & Error Handling
 * 
 * Verifies base URL normalization, URL deduplication, Authorization header injection,
 * AppException error envelope parsing, 401 token refresh mutex, request body replay,
 * and isomorphic authStorage behaviors.
 */

import {
  createErrorEnvelope,
  createMockTask,
  createMockTokens,
  MockFetchServer,
  MockStorageManager,
} from './test-helpers';

import assert from 'node:assert/strict';
import { afterEach, beforeEach, describe, it } from 'node:test';

import { authStorage } from '../../src/lib/api/auth-storage';
import {
  client,
  getBaseUrl,
} from '../../src/lib/api/client';
import { ApiError } from '../../src/lib/api/types';

describe('openapi-fetch Client & Middleware (F3)', () => {
  const fetchServer = new MockFetchServer();
  const storageManager = new MockStorageManager();
  const originalEnv = process.env.NEXT_PUBLIC_API_URL;

  beforeEach(() => {
    storageManager.setup();
    fetchServer.start();
    authStorage.clearTokens();
    delete process.env.NEXT_PUBLIC_API_URL;
  });

  afterEach(() => {
    fetchServer.stop();
    storageManager.teardown();
    if (originalEnv !== undefined) {
      process.env.NEXT_PUBLIC_API_URL = originalEnv;
    } else {
      delete process.env.NEXT_PUBLIC_API_URL;
    }
  });

  describe('1. Base URL Resolution & Normalization', () => {
    it('returns origin-only base URL by default (schema paths carry /api/v1)', () => {
      delete process.env.NEXT_PUBLIC_API_URL;
      assert.equal(getBaseUrl(), 'http://localhost:8000');
    });

    it('strips trailing slashes and the /api/v1 suffix from environment base URL', () => {
      process.env.NEXT_PUBLIC_API_URL = 'https://api.settlecart.com/api/v1///';
      assert.equal(getBaseUrl(), 'https://api.settlecart.com');
    });

    it('leaves a bare origin base URL untouched', () => {
      process.env.NEXT_PUBLIC_API_URL = 'https://staging.settlecart.com';
      assert.equal(getBaseUrl(), 'https://staging.settlecart.com');
    });

    it('deduplicates repeated /api/v1 prefixes in onRequest middleware', async () => {
      fetchServer.mock('/api/v1/stores/public', () => {
        return {
          status: 200,
          body: { items: [], total: 0, page: 1, size: 20 },
        };
      });

      // openapi-fetch will combine base URL http://localhost:8000/api/v1 with /api/v1/stores/public
      // resulting in http://localhost:8000/api/v1/api/v1/stores/public before middleware normalization
      await client.GET('/api/v1/stores/public');

      const requests = fetchServer.getRequests();
      assert.equal(requests.length, 1);
      assert.ok(
        !requests[0].url.includes('/api/v1/api/v1'),
        `Expected URL to not contain duplicate /api/v1/api/v1, got: ${requests[0].url}`
      );
      assert.ok(requests[0].url.includes('/api/v1/stores/public'));
    });
  });

  describe('2. Authorization Header Injection', () => {
    it('injects Bearer token into Authorization header when token exists', async () => {
      authStorage.setTokens('valid-jwt-token-abc');

      fetchServer.mock('/api/v1/auth/me', () => {
        return {
          status: 200,
          body: {
            id: 'u-1',
            email: 'test@settlecart.com',
            full_name: 'Test',
            role: 'customer',
            is_active: true,
            is_verified: true,
            created_at: '2026-09-25T00:00:00Z',
          },
        };
      });

      await client.GET('/api/v1/auth/me');

      const requests = fetchServer.getRequests();
      assert.equal(requests.length, 1);
      assert.equal(requests[0].headers['authorization'], 'Bearer valid-jwt-token-abc');
    });

    it('does not inject Authorization header when authStorage has no token', async () => {
      authStorage.clearTokens();

      fetchServer.mock('/api/v1/stores/public', () => {
        return {
          status: 200,
          body: { items: [], total: 0, page: 1, size: 20 },
        };
      });

      await client.GET('/api/v1/stores/public');

      const requests = fetchServer.getRequests();
      assert.equal(requests.length, 1);
      assert.equal(requests[0].headers['authorization'], undefined);
    });

    it('preserves existing custom Authorization header if explicitly provided', async () => {
      authStorage.setTokens('storage-token');

      fetchServer.mock('/api/v1/stores/public', () => {
        return {
          status: 200,
          body: { items: [], total: 0, page: 1, size: 20 },
        };
      });

      await client.GET('/api/v1/stores/public', {
        headers: {
          Authorization: 'Bearer explicit-override-token',
        },
      });

      const requests = fetchServer.getRequests();
      assert.equal(requests.length, 1);
      assert.equal(requests[0].headers['authorization'], 'Bearer explicit-override-token');
    });

    it('exempts public endpoints from automatic Authorization header injection', async () => {
      authStorage.setTokens('should-not-attach-to-public');

      fetchServer.mock('/api/v1/auth/login', () => {
        return {
          status: 200,
          body: createMockTokens(),
        };
      });

      await client.POST('/api/v1/auth/login', {
        body: {
          username: 'user@example.com',
          password: 'mock-test-password',
          scope: '',
        },
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      const requests = fetchServer.getRequests();
      assert.equal(requests.length, 1);
      assert.equal(requests[0].headers['authorization'], undefined);
    });
  });

  describe('3. Error Envelope Parsing & ApiError Class', () => {
    it('parses structured AppException envelope and throws ApiError', async () => {
      fetchServer.mock('/api/v1/stores/store-999', () => {
        return {
          status: 404,
          body: createErrorEnvelope('not_found', 'Store not found', [{ field: 'store_id' }]),
        };
      });

      await assert.rejects(
        async () => {
          await client.GET('/api/v1/stores/{store_id}', {
            params: { path: { store_id: 'store-999' } },
          });
        },
        (err: unknown) => {
          assert.ok(err instanceof ApiError);
          assert.equal(err.status, 404);
          assert.equal(err.code, 'not_found');
          assert.equal(err.message, 'Store not found');
          assert.ok(err.isNotFound);
          assert.deepEqual(err.details, [{ field: 'store_id' }]);
          return true;
        }
      );
    });

    it('verifies all ApiError status helper flags', () => {
      const err401 = new ApiError(401, 'unauthorized', 'Auth required');
      assert.ok(err401.isUnauthorized);
      assert.ok(!err401.isForbidden);

      const err403 = new ApiError(403, 'forbidden', 'Access denied');
      assert.ok(err403.isForbidden);

      const err404 = new ApiError(404, 'not_found', 'Missing resource');
      assert.ok(err404.isNotFound);

      const err422 = new ApiError(422, 'validation_error', 'Invalid fields', [{ loc: ['body', 'email'] }]);
      assert.ok(err422.isValidationError);

      const err429 = new ApiError(429, 'rate_limit_exceeded', 'Slow down');
      assert.ok(err429.isRateLimited);
    });

    it('handles non-JSON HTTP errors gracefully', async () => {
      fetchServer.mock('/api/v1/stores/public', () => {
        return new Response('<html>502 Bad Gateway</html>', {
          status: 502,
          statusText: 'Bad Gateway',
          headers: { 'Content-Type': 'text/html' },
        });
      });

      await assert.rejects(
        async () => {
          await client.GET('/api/v1/stores/public');
        },
        (err: unknown) => {
          assert.ok(err instanceof ApiError);
          assert.equal(err.status, 502);
          assert.equal(err.code, 'http_error');
          assert.ok(err.message.includes('Bad Gateway') || err.message.includes('502'));
          return true;
        }
      );
    });

    it('handles JSON error responses missing standard error envelope', async () => {
      fetchServer.mock('/api/v1/stores/public', () => {
        return {
          status: 500,
          body: { raw_message: 'Database connection failed' },
        };
      });

      await assert.rejects(
        async () => {
          await client.GET('/api/v1/stores/public');
        },
        (err: unknown) => {
          assert.ok(err instanceof ApiError);
          assert.equal(err.status, 500);
          assert.equal(err.code, 'http_error');
          return true;
        }
      );
    });
  });

  describe('4. 401 Refresh Mutex & Concurrent Replay', () => {
    it('executes single refresh call and replays requests when 401 occurs', async () => {
      authStorage.setTokens('expired-access-token', 'valid-refresh-token');

      let protectedCalls = 0;
      let refreshCalls = 0;

      fetchServer.mock('/api/v1/auth/refresh', () => {
        refreshCalls++;
        return {
          status: 200,
          body: {
            access_token: 'fresh-new-access-token',
            refresh_token: 'valid-refresh-token',
            token_type: 'bearer',
          },
        };
      });

      fetchServer.mock('/api/v1/auth/me', (req) => {
        protectedCalls++;
        if (req.headers['authorization'] === 'Bearer expired-access-token') {
          return {
            status: 401,
            body: createErrorEnvelope('unauthorized', 'Token expired'),
          };
        }
        if (req.headers['authorization'] === 'Bearer fresh-new-access-token') {
          return {
            status: 200,
            body: {
              id: 'u-1',
              email: 'rider@settlecart.com',
              full_name: 'Test Rider',
              role: 'dispatch',
              is_active: true,
              is_verified: true,
              created_at: '2026-09-25T00:00:00Z',
            },
          };
        }
        return { status: 401, body: createErrorEnvelope('unauthorized', 'Invalid token') };
      });

      const { data } = await client.GET('/api/v1/auth/me');

      assert.equal(refreshCalls, 1, 'Expected exactly one refresh call');
      assert.equal(protectedCalls, 2, 'Expected initial 401 call and successful retried call');
      assert.equal(data?.email, 'rider@settlecart.com');
      assert.equal(authStorage.getToken(), 'fresh-new-access-token');
    });

    it('synchronizes multiple concurrent 401 requests through single refresh mutex', async () => {
      authStorage.setTokens('expired-access-token', 'valid-refresh-token');

      let refreshCalls = 0;

      fetchServer.mock('/api/v1/auth/refresh', async () => {
        refreshCalls++;
        // Small delay to ensure concurrent requests pile up during refresh
        await new Promise((resolve) => setTimeout(resolve, 30));
        return {
          status: 200,
          body: {
            access_token: 'fresh-shared-token',
            refresh_token: 'valid-refresh-token',
            token_type: 'bearer',
          },
        };
      });

      fetchServer.mock('/api/v1/auth/me', (req) => {
        if (req.headers['authorization'] === 'Bearer fresh-shared-token') {
          return {
            status: 200,
            body: {
              id: 'u-1',
              email: 'concurrent@settlecart.com',
              full_name: 'Concurrent User',
              role: 'customer',
              is_active: true,
              is_verified: true,
              created_at: '2026-09-25T00:00:00Z',
            },
          };
        }
        return { status: 401, body: createErrorEnvelope('unauthorized', 'Expired') };
      });

      // Fire 3 simultaneous requests
      const [res1, res2, res3] = await Promise.all([
        client.GET('/api/v1/auth/me'),
        client.GET('/api/v1/auth/me'),
        client.GET('/api/v1/auth/me'),
      ]);

      assert.equal(refreshCalls, 1, 'Mutex must allow only 1 refresh execution for concurrent requests');
      assert.equal(res1.data?.email, 'concurrent@settlecart.com');
      assert.equal(res2.data?.email, 'concurrent@settlecart.com');
      assert.equal(res3.data?.email, 'concurrent@settlecart.com');
    });

    it('buffers and replays POST request body on 401 retry', async () => {
      authStorage.setTokens('expired-token', 'valid-refresh-token');

      fetchServer.mock('/api/v1/auth/refresh', () => {
        return {
          status: 200,
          body: {
            access_token: 'refreshed-token',
            refresh_token: 'valid-refresh-token',
            token_type: 'bearer',
          },
        };
      });

      let postAttempts = 0;
      let lastReceivedBody: unknown = null;

      fetchServer.mock('/api/v1/dispatch/tasks/task-retry/verify-delivery', (req) => {
        postAttempts++;
        if (req.headers['authorization'] === 'Bearer expired-token') {
          return { status: 401, body: createErrorEnvelope('unauthorized', 'Expired') };
        }
        if (req.headers['authorization'] === 'Bearer refreshed-token') {
          lastReceivedBody = req.body;
          return {
            status: 200,
            body: createMockTask({ id: 'task-retry', status: 'delivered' }),
          };
        }
        return { status: 401, body: createErrorEnvelope('unauthorized', 'Invalid') };
      }, { method: 'POST' });

      const { data } = await client.POST('/api/v1/dispatch/tasks/{task_id}/verify-delivery', {
        params: { path: { task_id: 'task-retry' } },
        body: { code: '847291' },
      });

      assert.equal(postAttempts, 2);
      assert.equal(data?.status, 'delivered');
      assert.equal(authStorage.getToken(), 'refreshed-token');
      assert.deepEqual(lastReceivedBody, { code: '847291' });
    });

    it('clears tokens and throws 401 when refresh endpoint rejects with 401', async () => {
      authStorage.setTokens('expired-access', 'revoked-refresh');

      fetchServer.mock('/api/v1/auth/refresh', () => {
        return {
          status: 401,
          body: createErrorEnvelope('unauthorized', 'Refresh token expired or invalid'),
        };
      });

      fetchServer.mock('/api/v1/auth/me', () => {
        return { status: 401, body: createErrorEnvelope('unauthorized', 'Token expired') };
      });

      await assert.rejects(
        async () => {
          await client.GET('/api/v1/auth/me');
        },
        (err: unknown) => {
          assert.ok(err instanceof ApiError);
          assert.equal(err.status, 401);
          assert.equal(err.code, 'unauthorized');
          return true;
        }
      );

      assert.equal(authStorage.getToken(), null);
      assert.equal(authStorage.getRefreshToken(), null);
    });

    it('clears tokens and throws 401 immediately without calling refresh when no refresh token is stored', async () => {
      authStorage.setTokens('expired-access-only'); // no refresh token

      let refreshCalled = false;
      fetchServer.mock('/api/v1/auth/refresh', () => {
        refreshCalled = true;
        return { status: 200, body: createMockTokens() };
      });

      fetchServer.mock('/api/v1/auth/me', () => {
        return { status: 401, body: createErrorEnvelope('unauthorized', 'Token expired') };
      });

      await assert.rejects(
        async () => {
          await client.GET('/api/v1/auth/me');
        },
        (err: unknown) => {
          assert.ok(err instanceof ApiError);
          assert.equal(err.status, 401);
          return true;
        }
      );

      assert.equal(refreshCalled, false, 'Refresh endpoint should not be called when refresh token is absent');
      assert.equal(authStorage.getToken(), null);
    });
  });

  describe('5. AuthStorage Cookie & LocalStorage Operations', () => {
    it('sets and retrieves access and refresh tokens synchronously', () => {
      authStorage.setTokens('acc-token-1', 'ref-token-1');
      assert.equal(authStorage.getToken(), 'acc-token-1');
      assert.equal(authStorage.getRefreshToken(), 'ref-token-1');
      assert.equal(authStorage.isAuthenticated(), true);

      // Verify cookie
      assert.equal(storageManager.getCookie('settlecart_access_token'), 'acc-token-1');
      assert.equal(storageManager.getCookie('settlecart_refresh_token'), 'ref-token-1');

      // Verify localStorage
      assert.equal(storageManager.getLocalStorageItem('settlecart_access_token'), 'acc-token-1');
      assert.equal(storageManager.getLocalStorageItem('settlecart_refresh_token'), 'ref-token-1');
    });

    it('clears both tokens and updates isAuthenticated', () => {
      authStorage.setTokens('token-to-clear', 'refresh-to-clear');
      assert.equal(authStorage.isAuthenticated(), true);

      authStorage.clearTokens();
      assert.equal(authStorage.getToken(), null);
      assert.equal(authStorage.getRefreshToken(), null);
      assert.equal(authStorage.isAuthenticated(), false);
      assert.equal(storageManager.getCookie('settlecart_access_token'), undefined);
      assert.equal(storageManager.getLocalStorageItem('settlecart_access_token'), null);
    });

    it('sets access token without refresh token when refresh token is omitted', () => {
      authStorage.setTokens('access-only-token');
      assert.equal(authStorage.getToken(), 'access-only-token');
      assert.equal(authStorage.getRefreshToken(), null);
      assert.equal(authStorage.isAuthenticated(), true);
    });

    it('handles SSR environments gracefully when window and document are undefined', () => {
      storageManager.teardown(); // window and document are now undefined
      assert.equal(authStorage.getToken(), null);
      assert.equal(authStorage.getRefreshToken(), null);
      assert.equal(authStorage.isAuthenticated(), false);

      // setTokens and clearTokens should not throw
      assert.doesNotThrow(() => {
        authStorage.setTokens('ssr-token');
        authStorage.clearTokens();
      });
    });
  });

  describe('6. Client Typed HTTP Method Exports', () => {
    it('exports all standard HTTP method helper functions', () => {
      assert.equal(typeof client.GET, 'function');
      assert.equal(typeof client.POST, 'function');
      assert.equal(typeof client.PUT, 'function');
      assert.equal(typeof client.PATCH, 'function');
      assert.equal(typeof client.DELETE, 'function');
    });
  });
});
