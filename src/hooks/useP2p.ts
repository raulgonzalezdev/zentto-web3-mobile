import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  cancelP2pOrder,
  cancelP2pTrade,
  confirmP2pTrade,
  createP2pOrder,
  fetchMyP2pOrders,
  fetchP2pOrders,
  fetchP2pTrades,
  takeP2pOrder,
} from '../api/p2p';
import type {
  CreateP2pOrderInput,
  P2pOrder,
  P2pSide,
  P2pTrade,
} from '../api/types';

const ORDERS_KEY = ['p2p', 'orders'];
const MY_ORDERS_KEY = ['p2p', 'orders', 'mine'];
const TRADES_KEY = ['p2p', 'trades'];
const BALANCE_KEY = ['accounts', 'balance'];
const PAYMENTS_KEY = ['payments'];

/** Order book público: ofertas abiertas filtradas por lado/asset. */
export function useP2pOrders(filter: { side?: P2pSide; asset?: string }) {
  return useQuery<P2pOrder[]>({
    queryKey: [...ORDERS_KEY, filter.side ?? '', filter.asset ?? ''],
    queryFn: () => fetchP2pOrders(filter),
    refetchInterval: 12_000,
    retry: false,
  });
}

export function useMyP2pOrders() {
  return useQuery<P2pOrder[]>({
    queryKey: MY_ORDERS_KEY,
    queryFn: fetchMyP2pOrders,
    refetchInterval: 15_000,
    retry: false,
  });
}

export function useP2pTrades() {
  return useQuery<P2pTrade[]>({
    queryKey: TRADES_KEY,
    queryFn: fetchP2pTrades,
    refetchInterval: 12_000,
    retry: false,
  });
}

/** Invalida todo lo que cambia tras operar en P2P (saldo, historial, libro, trades). */
function useInvalidateP2p() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: ORDERS_KEY });
    qc.invalidateQueries({ queryKey: MY_ORDERS_KEY });
    qc.invalidateQueries({ queryKey: TRADES_KEY });
    qc.invalidateQueries({ queryKey: BALANCE_KEY });
    qc.invalidateQueries({ queryKey: PAYMENTS_KEY });
  };
}

export function useCreateP2pOrder() {
  const invalidate = useInvalidateP2p();
  return useMutation<P2pOrder, Error, CreateP2pOrderInput>({
    mutationFn: createP2pOrder,
    onSuccess: invalidate,
  });
}

export function useCancelP2pOrder() {
  const invalidate = useInvalidateP2p();
  return useMutation<{ ok: boolean }, Error, string>({
    mutationFn: cancelP2pOrder,
    onSuccess: invalidate,
  });
}

export function useTakeP2pOrder() {
  const invalidate = useInvalidateP2p();
  return useMutation<P2pTrade, Error, string>({
    mutationFn: takeP2pOrder,
    onSuccess: invalidate,
  });
}

export function useConfirmP2pTrade() {
  const invalidate = useInvalidateP2p();
  return useMutation<{ ok: boolean }, Error, string>({
    mutationFn: confirmP2pTrade,
    onSuccess: invalidate,
  });
}

export function useCancelP2pTrade() {
  const invalidate = useInvalidateP2p();
  return useMutation<{ ok: boolean }, Error, string>({
    mutationFn: cancelP2pTrade,
    onSuccess: invalidate,
  });
}
