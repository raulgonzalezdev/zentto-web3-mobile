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

// ── Ledger del neobanco (saldo y movimientos reales del usuario) ──

/** Saldo del usuario por asset. amount es string decimal. */
export interface AccountBalance {
  asset: string; // USDT, USDC, …
  balance: string; // total
  held: string; // retenido (en tránsito / bloqueos)
  available: string; // disponible para mover
  [k: string]: unknown;
}

export type PaymentStatus =
  | 'pending'
  | 'completed'
  | 'failed'
  | 'reversed'
  | string;

export type PaymentType =
  | 'transfer'
  | 'credit'
  | 'debit'
  | 'deposit'
  | 'withdrawal'
  | string;

/** Un movimiento del ledger. */
export interface Payment {
  id: string;
  type: PaymentType; // transfer, credit, debit, …
  asset: string;
  amount: string; // string decimal
  status: PaymentStatus;
  counterparty?: string | null; // email u otro identificador
  createdAt: number | string; // ISO UTC o epoch
  [k: string]: unknown;
}

export interface TransferInput {
  toEmail: string;
  asset: string;
  amount: string;
}

export interface CreditInput {
  asset: string;
  amount: string;
}

// ── KYC (verificación de identidad — flujo standalone síncrono Didit) ──

export type KycStatus =
  | 'not_started'
  | 'pending'
  | 'in_review'
  | 'approved'
  | 'rejected'
  | string;

export interface KycStatusView {
  id?: string;
  status: KycStatus;
  provider?: string;
  mrzValid?: boolean;
  amlMatch?: boolean;
  decisionReason?: string | null;
  [k: string]: unknown;
}

export interface KycVerifyResult {
  id: string;
  status: KycStatus;
  provider: string;
  amlMatch?: boolean;
  [k: string]: unknown;
}

// ── 2FA (Google Authenticator / TOTP) ──

export interface TotpSetup {
  otpauthUrl: string;
  qrDataUrl: string; // data URL PNG del QR
  secret: string; // fallback manual
}

// ── Custodia: depósito on-chain ──

export interface DepositInfo {
  network: string;
  chainName: string;
  address: string;
  asset: string;
  token: string;
  explorerUrl: string;
  note: string;
  [k: string]: unknown;
}

export interface ChainDeposit {
  id: string;
  network: string;
  txHash: string;
  asset: string;
  toAddress: string;
  amount: string;
  blockNumber: string;
  paymentId?: string | null;
  createdAt: string | number;
  [k: string]: unknown;
}

// ── Retiro on-chain ──

export interface WithdrawInput {
  asset: string; // 'USDC'
  amount: string;
  toAddress: string; // 0x… 40 hex
  totpCode: string; // 6 dígitos
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
