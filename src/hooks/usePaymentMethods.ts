import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createPaymentMethod,
  deletePaymentMethod,
  fetchPaymentMethods,
} from '../api/paymentMethods';
import type { CreatePaymentMethodInput, PaymentMethod } from '../api/types';

const KEY = ['me', 'payment-methods'];

export function usePaymentMethods() {
  return useQuery<PaymentMethod[]>({
    queryKey: KEY,
    queryFn: fetchPaymentMethods,
    retry: false,
  });
}

export function useCreatePaymentMethod() {
  const qc = useQueryClient();
  return useMutation<PaymentMethod, Error, CreatePaymentMethodInput>({
    mutationFn: createPaymentMethod,
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeletePaymentMethod() {
  const qc = useQueryClient();
  return useMutation<{ ok: boolean }, Error, string>({
    mutationFn: deletePaymentMethod,
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
