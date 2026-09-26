/**
 * Tier 1 & Tier 2 Tests: Auth Domain API (F4)
 * 
 * Verifies OAuth2 form-urlencoded login serialization, registration with role assignment,
 * token rotation/refresh, current user profile retrieval, and logout token clearing.
 */

import {
  createErrorEnvelope,
  createMockTokens,
  createMockUser,
  MockFetchServer,
  MockStorageManager,
} from './test-helpers';

import assert from 'node:assert/strict';
import { afterEach, beforeEach, describe, it } from 'node:test';

import { authStorage } from '../../src/lib/api/auth-storage';
import {
  auth,
  getCurrentUser,
  login,
  logout,
  refresh,
  register,
} from '../../src/lib/api/domains/auth';
import { ApiError } from '../../src/lib/api/types';

// Synthetic placeholder credentials for mock tests (gitguardian:ignore)
const MOCK_TEST_PASSWORD = 'mock-test-password';

describe('Auth Domain API (F4)', () => {
  const fetchServer = new MockFetchServer();
  const storageManager = new MockStorageManager();

  beforeEach(() => {
    storageManager.setup();
    fetchServer.start();
    authStorage.clearTokens();
  });

  afterEach(() => {
    fetchServer.stop();
    storageManager.teardown();
  });

  describe('1. login() OAuth2 Form-UrlEncoded Authentication', () => {
    it('authenticates user with application/x-www-form-urlencoded and stores tokens', async () => {
      fetchServer.mock('/api/v1/auth/login', (req) => {
        assert.equal(req.headers['content-type'], 'application/x-www-form-urlencoded');

        // Verify body is form-urlencoded
        const bodyStr = typeof req.body === 'string' ? req.body : String(req.body);
        const params = new URLSearchParams(bodyStr);
        assert.equal(params.get('username'), 'customer@settlecart.com');
        assert.equal(params.get('password'), MOCK_TEST_PASSWORD);
        assert.equal(params.get('grant_type'), 'password');
        assert.equal(params.get('scope'), '');

        return {
          status: 200,
          body: createMockTokens('jwt-customer-access-token', 'jwt-customer-refresh-token'),
        };
      }, { method: 'POST' });

      const result = await login({
        username: 'customer@settlecart.com',
        password: MOCK_TEST_PASSWORD,
      });

      assert.equal(result.access_token, 'jwt-customer-access-token');
      assert.equal(result.refresh_token, 'jwt-customer-refresh-token');
      assert.equal(result.token_type, 'bearer');

      // Verify tokens automatically stored in authStorage
      assert.equal(authStorage.getToken(), 'jwt-customer-access-token');
      assert.equal(authStorage.getRefreshToken(), 'jwt-customer-refresh-token');
      assert.equal(authStorage.isAuthenticated(), true);
    });

    it('throws 401 ApiError on invalid credentials', async () => {
      fetchServer.mock('/api/v1/auth/login', () => {
        return {
          status: 401,
          body: createErrorEnvelope('invalid_credentials', 'Incorrect email or password'),
        };
      }, { method: 'POST' });

      await assert.rejects(
        async () => {
          await login({
            username: 'wrong@example.com',
            password: 'mock-invalid-password',
          });
        },
        (err: unknown) => {
          assert.ok(err instanceof ApiError);
          assert.equal(err.status, 401);
          assert.equal(err.code, 'invalid_credentials');
          assert.equal(err.message, 'Incorrect email or password');
          assert.ok(err.isUnauthorized);
          return true;
        }
      );

      // Verify no tokens stored on failed login
      assert.equal(authStorage.isAuthenticated(), false);
    });
  });

  describe('2. register() User Lifecycle', () => {
    it('registers new customer account and stores returned tokens', async () => {
      fetchServer.mock('/api/v1/auth/register', (req) => {
        assert.equal(req.method, 'POST');
        const bodyObj = req.body as Record<string, unknown>;
        assert.equal(bodyObj['email'], 'newuser@settlecart.com');
        assert.equal(bodyObj['role'], 'customer');
        assert.equal(bodyObj['full_name'], 'Chioma Eze');

        return {
          status: 200,
          body: createMockTokens('registered-access-token', 'registered-refresh-token'),
        };
      }, { method: 'POST' });

      const response = await register({
        email: 'newuser@settlecart.com',
        password: MOCK_TEST_PASSWORD,
        full_name: 'Chioma Eze',
        role: 'customer',
        phone: '+2348011112222',
      });

      assert.equal(response.access_token, 'registered-access-token');
      assert.equal(authStorage.getToken(), 'registered-access-token');
      assert.equal(authStorage.getRefreshToken(), 'registered-refresh-token');
      assert.equal(authStorage.isAuthenticated(), true);
    });

    it('registers dispatch rider account successfully', async () => {
      fetchServer.mock('/api/v1/auth/register', (req) => {
        const bodyObj = req.body as Record<string, unknown>;
        assert.equal(bodyObj['role'], 'dispatch');
        return {
          status: 200,
          body: createMockTokens('rider-access-token', 'rider-refresh-token'),
        };
      }, { method: 'POST' });

      const response = await register({
        email: 'rider@settlecart.com',
        password: MOCK_TEST_PASSWORD,
        full_name: 'Babajide Sanwo',
        role: 'dispatch',
      });

      assert.equal(response.access_token, 'rider-access-token');
      assert.equal(authStorage.getToken(), 'rider-access-token');
    });

    it('throws 422 ApiError on duplicate email registration', async () => {
      fetchServer.mock('/api/v1/auth/register', () => {
        return {
          status: 422,
          body: createErrorEnvelope('email_already_exists', 'A user with this email already exists', [
            { field: 'email' },
          ]),
        };
      }, { method: 'POST' });

      await assert.rejects(
        async () => {
          await register({
            email: 'existing@settlecart.com',
            password: MOCK_TEST_PASSWORD,
            full_name: 'Existing User',
            role: 'customer',
          });
        },
        (err: unknown) => {
          assert.ok(err instanceof ApiError);
          assert.equal(err.status, 422);
          assert.equal(err.code, 'email_already_exists');
          assert.ok(err.isValidationError);
          return true;
        }
      );
    });
  });

  describe('3. refresh() Token Rotation', () => {
    it('rotates access token using stored refresh token', async () => {
      authStorage.setTokens('initial-access-token', 'valid-stored-refresh');

      fetchServer.mock('/api/v1/auth/refresh', (req) => {
        const bodyObj = req.body as Record<string, unknown>;
        assert.equal(bodyObj['refresh_token'], 'valid-stored-refresh');
        return {
          status: 200,
          body: createMockTokens('rotated-access-token', 'new-refresh-token'),
        };
      }, { method: 'POST' });

      const result = await refresh();

      assert.equal(result.access_token, 'rotated-access-token');
      assert.equal(authStorage.getToken(), 'rotated-access-token');
      assert.equal(authStorage.getRefreshToken(), 'new-refresh-token');
    });

    it('rotates token using explicitly passed refresh token argument', async () => {
      authStorage.clearTokens();

      fetchServer.mock('/api/v1/auth/refresh', (req) => {
        const bodyObj = req.body as Record<string, unknown>;
        assert.equal(bodyObj['refresh_token'], 'explicit-refresh-param');
        return {
          status: 200,
          body: createMockTokens('fresh-access-token', 'fresh-refresh-token'),
        };
      }, { method: 'POST' });

      const result = await refresh('explicit-refresh-param');

      assert.equal(result.access_token, 'fresh-access-token');
      assert.equal(authStorage.getToken(), 'fresh-access-token');
      assert.equal(authStorage.getRefreshToken(), 'fresh-refresh-token');
    });

    it('throws 401 ApiError when no refresh token is stored or provided', async () => {
      authStorage.clearTokens();

      await assert.rejects(
        async () => {
          await refresh();
        },
        (err: unknown) => {
          assert.ok(err instanceof ApiError);
          assert.equal(err.status, 401);
          assert.equal(err.code, 'unauthorized');
          assert.equal(err.message, 'No refresh token available');
          return true;
        }
      );
    });
  });

  describe('4. getCurrentUser() Profile Retrieval', () => {
    it('retrieves authenticated user profile', async () => {
      authStorage.setTokens('active-access-token');

      fetchServer.mock('/api/v1/auth/me', (req) => {
        assert.equal(req.headers['authorization'], 'Bearer active-access-token');
        return {
          status: 200,
          body: createMockUser({
            id: 'user-uuid-99',
            email: 'ade@settlecart.com',
            full_name: 'Ade Johnson',
            role: 'customer',
          }),
        };
      }, { method: 'GET' });

      const user = await getCurrentUser();

      assert.equal(user.id, 'user-uuid-99');
      assert.equal(user.email, 'ade@settlecart.com');
      assert.equal(user.full_name, 'Ade Johnson');
      assert.equal(user.role, 'customer');
      assert.equal(user.is_active, true);
    });

    it('throws 401 ApiError when user is unauthenticated', async () => {
      authStorage.clearTokens();

      fetchServer.mock('/api/v1/auth/me', () => {
        return {
          status: 401,
          body: createErrorEnvelope('unauthorized', 'Not authenticated'),
        };
      }, { method: 'GET' });

      await assert.rejects(
        async () => {
          await getCurrentUser();
        },
        (err: unknown) => {
          assert.ok(err instanceof ApiError);
          assert.equal(err.status, 401);
          assert.ok(err.isUnauthorized);
          return true;
        }
      );
    });
  });

  describe('5. logout() Session Termination', () => {
    it('clears access and refresh tokens from cookies and localStorage', () => {
      authStorage.setTokens('token-to-purge', 'refresh-to-purge');
      assert.equal(authStorage.isAuthenticated(), true);

      logout();

      assert.equal(authStorage.getToken(), null);
      assert.equal(authStorage.getRefreshToken(), null);
      assert.equal(authStorage.isAuthenticated(), false);
    });
  });

  describe('6. Auth Domain Barrel Export', () => {
    it('exports all domain functions on auth namespace object', () => {
      assert.equal(typeof auth.login, 'function');
      assert.equal(typeof auth.register, 'function');
      assert.equal(typeof auth.refresh, 'function');
      assert.equal(typeof auth.getCurrentUser, 'function');
      assert.equal(typeof auth.logout, 'function');
    });
  });
});
