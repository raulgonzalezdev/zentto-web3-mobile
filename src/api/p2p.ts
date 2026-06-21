import { apiFetch, newIdempotencyKey } from './client';
import type {
  CreateP2pOrderInput,
  P2pOrder,
  P2pSide,
  P2pTrade,
} from './types';

// Mercado P2P (compra/venta de cripto contra fiat VES) sobre el ledger del neobanco.
// Las ofertas de VENTA escrowan el cripto del maker; el vendedor libera al confirmar
// que recibió el fiat off-platform. Todos los endpoints requieren auth.

/** Order book: ofertas abiertas. `side` filtra por el lado del maker. */
export async function fetchP2pOrders(opts: {
  side?: P2pSide;
  asset?: string;
} = {}): Promise<P2pOrder[]> {
  const qs = new URLSearchParams();
  if (opts.side) qs.set('side', opts.side);
  if (opts.asset) qs.set('asset', opts.asset);
  const q = qs.toString();
  return apiFetch<P2pOrder[]>(`/p2p/orders${q ? `?${q}` : ''}`);
}

/** Mis ofertas publicadas. */
export async function fetchMyP2pOrders(): Promise<P2pOrder[]> {
  return apiFetch<P2pOrder[]>('/p2p/orders/mine');
}

/** Publica una oferta. Vender escrowa tu cripto de inmediato. */
export async function createP2pOrder(input: CreateP2pOrderInput): Promise<P2pOrder> {
  return apiFetch<P2pOrder>('/p2p/orders', {
    method: 'POST',
    body: input,
    idempotencyKey: newIdempotencyKey(),
  });
}

/** Cancela una oferta propia (libera el escrow). */
export async function cancelP2pOrder(id: string): Promise<{ ok: boolean }> {
  return apiFetch<{ ok: boolean }>(`/p2p/orders/${id}/cancel`, { method: 'POST' });
}

/** Toma una oferta → crea el trade. Idempotente (mueve/escrowa saldo). */
export async function takeP2pOrder(id: string): Promise<P2pTrade> {
  return apiFetch<P2pTrade>(`/p2p/orders/${id}/take`, {
    method: 'POST',
    idempotencyKey: newIdempotencyKey(),
  });
}

/** Mis trades (como comprador o vendedor). */
export async function fetchP2pTrades(): Promise<P2pTrade[]> {
  return apiFetch<P2pTrade[]>('/p2p/trades');
}

/** El VENDEDOR confirma fiat recibido → libera el cripto al comprador. */
export async function confirmP2pTrade(id: string): Promise<{ ok: boolean }> {
  return apiFetch<{ ok: boolean }>(`/p2p/trades/${id}/confirm`, { method: 'POST' });
}

/** Cancela un trade pendiente (libera el escrow). */
export async function cancelP2pTrade(id: string): Promise<{ ok: boolean }> {
  return apiFetch<{ ok: boolean }>(`/p2p/trades/${id}/cancel`, { method: 'POST' });
}
