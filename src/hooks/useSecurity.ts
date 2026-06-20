import { useMutation } from '@tanstack/react-query';
import { enableTotp, setupTotp } from '../api/security';
import type { TotpSetup } from '../api/types';

/** Inicia configuración de 2FA (devuelve QR + secret). */
export function useSetupTotp() {
  return useMutation<TotpSetup, Error, void>({
    mutationFn: setupTotp,
  });
}

/** Activa el 2FA con el primer código de 6 dígitos. */
export function useEnableTotp() {
  return useMutation<{ ok: boolean }, Error, string>({
    mutationFn: (code: string) => enableTotp(code),
  });
}
