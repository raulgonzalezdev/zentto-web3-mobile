import { apiFetch } from './client';
import type { EvmAddressBalance, EvmInfo, EvmTx } from './types';

// Endpoints públicos que leen la blockchain real de Sepolia.
// Si el backend aún no los expone (404), los hooks lo manejan como "no disponible".

export async function fetchEvmInfo(): Promise<EvmInfo> {
  return apiFetch<EvmInfo>('/evm/info');
}

export async function fetchEvmAddress(address: string): Promise<EvmAddressBalance> {
  return apiFetch<EvmAddressBalance>(`/evm/address/${encodeURIComponent(address)}`);
}

export async function fetchEvmTx(hash: string): Promise<EvmTx> {
  return apiFetch<EvmTx>(`/evm/tx/${encodeURIComponent(hash)}`);
}

// Normalizadores: el contrato exacto puede variar; extraemos ETH/USDC de varias formas.
export function pickEth(b: EvmAddressBalance | undefined): string | null {
  if (!b) return null;
  if (typeof b.eth === 'string') return b.eth;
  if (typeof b.native === 'string') return b.native;
  const t = b.tokens?.find((x) => x.symbol?.toUpperCase() === 'ETH');
  return t?.balance ?? null;
}

export function pickUsdc(b: EvmAddressBalance | undefined): string | null {
  if (!b) return null;
  if (typeof b.usdc === 'string') return b.usdc;
  const t = b.tokens?.find((x) => x.symbol?.toUpperCase() === 'USDC');
  return t?.balance ?? null;
}
