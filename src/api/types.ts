export interface User {
  id: string;
  email: string;
  displayName?: string | null;
  totpEnabled: boolean;
}

export interface LoginResult {
  mfaRequired: boolean;
  mfaToken?: string;
  user?: User;
}

// ── EVM (endpoints públicos que leen Sepolia testnet real) ──
// Nota: el backend desplegado puede no exponerlos todavía (404).
// La app maneja ese caso de forma graceful (ver hooks).

export interface EvmInfo {
  network?: string;
  chainId?: number;
  blockNumber?: number;
  connected?: boolean;
  // Campos defensivos por si el contrato varía:
  [k: string]: unknown;
}

export interface EvmTokenBalance {
  symbol: string;
  balance: string; // formateado en unidades humanas
  decimals?: number;
  raw?: string;
}

export interface EvmAddressBalance {
  address: string;
  // ETH nativo
  eth?: string;
  native?: string;
  // USDC y otros tokens
  usdc?: string;
  tokens?: EvmTokenBalance[];
  [k: string]: unknown;
}

export interface EvmTx {
  hash: string;
  status?: string; // 'success' | 'failed' | 'pending'
  blockNumber?: number | null;
  from?: string;
  to?: string;
  value?: string;
  confirmations?: number;
  found?: boolean;
  [k: string]: unknown;
}
