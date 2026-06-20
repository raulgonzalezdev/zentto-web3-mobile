import { apiFetch } from './client';
import type { TotpSetup } from './types';

// 2FA con Google Authenticator (TOTP). Necesario para retirar on-chain.

/** Inicia la configuración: devuelve QR (data URL) + otpauth + secret. */
export async function setupTotp(): Promise<TotpSetup> {
  return apiFetch<TotpSetup>('/auth/2fa/setup', { method: 'POST' });
}

/** Activa el 2FA verificando el primer código de 6 dígitos. */
export async function enableTotp(code: string): Promise<{ ok: boolean }> {
  return apiFetch<{ ok: boolean }>('/auth/2fa/enable', {
    method: 'POST',
    body: { code },
  });
}
