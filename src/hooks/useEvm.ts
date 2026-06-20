import { useQuery } from '@tanstack/react-query';
import { fetchEvmAddress, fetchEvmInfo, fetchEvmTx } from '../api/evm';
import { ApiError } from '../api/client';

// Detecta si un endpoint /evm/* no está disponible en el backend (404) para mostrar
// un mensaje claro en vez de un error genérico.
export function isEvmUnavailable(err: unknown): boolean {
  return err instanceof ApiError && (err.status === 404 || err.status === 0);
}

export function useEvmInfo() {
  return useQuery({
    queryKey: ['evm', 'info'],
    queryFn: fetchEvmInfo,
    staleTime: 30_000,
    retry: false,
  });
}

const ADDRESS_RE = /^0x[a-fA-F0-9]{40}$/;

export function isValidAddress(addr: string): boolean {
  return ADDRESS_RE.test(addr.trim());
}

export function useEvmAddress(address: string | null) {
  return useQuery({
    queryKey: ['evm', 'address', address],
    queryFn: () => fetchEvmAddress(address as string),
    enabled: !!address && isValidAddress(address),
    staleTime: 15_000,
    retry: false,
  });
}

const HASH_RE = /^0x[a-fA-F0-9]{64}$/;

export function isValidTxHash(hash: string): boolean {
  return HASH_RE.test(hash.trim());
}

export function useEvmTx(hash: string | null) {
  return useQuery({
    queryKey: ['evm', 'tx', hash],
    queryFn: () => fetchEvmTx(hash as string),
    enabled: !!hash && isValidTxHash(hash),
    retry: false,
  });
}
