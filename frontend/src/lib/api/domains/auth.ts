/**
 * SettleCart Auth Domain API Module
 * 
 * Provides typed operations for authentication and user account lifecycle:
 * - login (application/x-www-form-urlencoded OAuth2 flow)
 * - register (new customer, vendor, dispatch rider)
 * - refresh (token rotation)
 * - getCurrentUser (/auth/me)
 * - logout (clears local and cookie tokens)
 */

import { authStorage } from '../auth-storage';
import { client } from '../client';
import {
  ApiError,
  type RegisterRequest,
  type TokenResponse,
  type UserResponse,
} from '../types';

export interface LoginCredentials {
  username: string;
  password: string;
}

/**
 * Authenticates user credentials via OAuth2 form-urlencoded payload.
 * Automatically stores the returned access and refresh tokens.
 */
export async function login(credentials: LoginCredentials): Promise<TokenResponse> {
  const { data } = await client.POST('/api/v1/auth/login', {
    body: {
      username: credentials.username,
      password: credentials.password,
      grant_type: 'password',
      scope: '',
    },
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  });

  if (!data) {
    throw new ApiError(500, 'internal_error', 'Login completed without token response');
  }

  authStorage.setTokens(data.access_token, data.refresh_token);
  return data;
}

/**
 * Registers a new user account (customer, vendor, dispatch, admin).
 * Automatically stores returned tokens upon successful creation.
 */
export async function register(payload: RegisterRequest): Promise<TokenResponse> {
  if (process.env.NODE_ENV !== 'production') {
    console.debug('[register] outgoing payload keys:', Object.keys(payload));
  }
  const { data, error } = await client.POST('/api/v1/auth/register', {
    body: payload,
  });

  if (!data) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('[register] failed:', JSON.stringify(error));
    }
    throw new ApiError(500, 'internal_error', 'Registration completed without token response');
  }

  authStorage.setTokens(data.access_token, data.refresh_token);
  return data;
}

/**
 * Rotates an expired access token using the stored or provided refresh token.
 */
export async function refresh(refreshToken?: string): Promise<TokenResponse> {
  const token = refreshToken || authStorage.getRefreshToken();
  if (!token) {
    throw new ApiError(401, 'unauthorized', 'No refresh token available');
  }

  const { data } = await client.POST('/api/v1/auth/refresh', {
    body: {
      refresh_token: token,
    },
  });

  if (!data) {
    throw new ApiError(500, 'internal_error', 'Token refresh returned empty response');
  }

  authStorage.setTokens(data.access_token, data.refresh_token);
  return data;
}

/**
 * Retrieves the profile of the currently authenticated user.
 */
export async function getCurrentUser(): Promise<UserResponse> {
  const { data } = await client.GET('/api/v1/auth/me');

  if (!data) {
    throw new ApiError(500, 'internal_error', 'Failed to retrieve current user profile');
  }

  return data;
}

/**
 * Clears authentication tokens from cookies and localStorage.
 */
export function logout(): void {
  authStorage.clearTokens();
}

export const auth = {
  login,
  register,
  refresh,
  getCurrentUser,
  logout,
};

export default auth;
