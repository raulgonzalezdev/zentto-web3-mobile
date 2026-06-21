import { apiFetch } from './client';
import type { CreatePaymentMethodInput, PaymentMethod } from './types';

// Métodos de cobro del usuario (Pago Móvil / cuenta bancaria). Se adjuntan a las
// ofertas P2P para que la contraparte copie los datos sin errores. Todos auth.

export async function fetchPaymentMethods(): Promise<PaymentMethod[]> {
  return apiFetch<PaymentMethod[]>('/me/payment-methods');
}

export async function createPaymentMethod(
  input: CreatePaymentMethodInput,
): Promise<PaymentMethod> {
  return apiFetch<PaymentMethod>('/me/payment-methods', {
    method: 'POST',
    body: input,
  });
}

export async function deletePaymentMethod(id: string): Promise<{ ok: boolean }> {
  return apiFetch<{ ok: boolean }>(`/me/payment-methods/${id}`, { method: 'DELETE' });
}
