import { apiFetch } from './client';
import type { LoginResult, User } from './types';

export async function fetchMe(): Promise<User> {
  const { user } = await apiFetch<{ user: User }>('/auth/me', {
    retryOnAuth: false, // sondeo inicial: no dispara refresh
  });
  return user;
}

export async function login(email: string, password: string): Promise<LoginResult> {
  return apiFetch<LoginResult>('/auth/login', {
    method: 'POST',
    body: { email, password },
  });
}

export async function loginTwoFactor(mfaToken: string, code: string): Promise<{ user: User }> {
  return apiFetch<{ user: User }>('/auth/login/2fa', {
    method: 'POST',
    body: { mfaToken, code },
  });
}

export async function register(
  email: string,
  password: string,
  displayName?: string,
): Promise<{ user: User }> {
  return apiFetch<{ user: User }>('/auth/register', {
    method: 'POST',
    body: { email, password, displayName },
  });
}

export async function logout(): Promise<void> {
  await apiFetch('/auth/logout', { method: 'POST' });
}
