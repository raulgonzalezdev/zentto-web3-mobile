---
layout: default
title: Integración con la API
---

# Integración con la API `zentto-web3`

Toda la comunicación pasa por el cliente HTTP propio `src/api/client.ts` (`apiFetch`).

## Configuración

| Variable | Default | Descripción |
|----------|---------|-------------|
| `VITE_API_BASE` | `http://localhost:4100/api` | URL base del backend (incluye `/api`) |

## Comportamiento del cliente

- `credentials: 'include'` → envía/recibe cookies httpOnly (`zw3_access`, `zw3_refresh`).
- **CSRF**: en `POST/PUT/PATCH/DELETE` añade header `x-csrf-token` (cookie `zw3_csrf`, sembrada
  con `/auth/csrf` si falta).
- **Auto-refresh**: ante `401`, hace `POST /auth/refresh` una vez y reintenta.
- **Idempotencia**: mutaciones que mueven saldo envían `Idempotency-Key` (UUID por intento).
- **Multipart**: para subir imágenes (KYC, evidencias) usa `FormData` sin fijar `Content-Type`.

## Endpoints consumidos por módulo

### `auth.ts` — sesión
`GET /auth/me` · `POST /auth/login` · `POST /auth/login/2fa` · `POST /auth/register` ·
`POST /auth/logout` · `GET /auth/csrf` · `POST /auth/refresh`

### `security.ts` — 2FA
`POST /auth/2fa/setup` · `POST /auth/2fa/enable`

### `payments.ts` — ledger y custodia
`GET /accounts/balance` · `GET /accounts/deposit-address` · `GET /accounts/deposits` ·
`GET /payments` · `GET /payments/:id` · `POST /payments/transfer` · `POST /payments/credit` ·
`POST /payments/withdraw` · `GET /networks` · `GET /fees` ·
`GET|POST|DELETE /me/withdraw-addresses`

### `p2p.ts` — mercado P2P
`GET /p2p/orders` · `GET /p2p/orders/mine` · `POST /p2p/orders` ·
`POST /p2p/orders/:id/{take,cancel}` · `GET /p2p/trades` · `GET /p2p/trades/:id` ·
`POST /p2p/trades/:id/{paid,confirm,extend,dispute,cancel}` ·
`GET|POST /p2p/trades/:id/messages` · `GET /p2p/market`

### `kyc.ts` — verificación de identidad
`GET /kyc/status` · `POST /kyc/session` (Didit hospedado) ·
`POST /kyc/verify-documents` (captura nativa, multipart)

### `paymentMethods.ts` — métodos de cobro
`GET|POST|DELETE /me/payment-methods`

### `users.ts` — usuarios
`GET /users/search?q=` · `PATCH /users/me`

### `evm.ts` — lectura blockchain (Explorar)
`GET /evm/info` · `GET /evm/address/:address` · `GET /evm/tx/:hash`

Los normalizadores de `evm.ts` toleran varias formas de respuesta (`eth`/`native`,
`usdc`/`tokens[]`) y los hooks manejan el `404` de forma graceful si el backend aún no los
expone.

## Seguridad de credenciales

- Sin tokens en `localStorage`: la sesión vive en cookies httpOnly del backend.
- La address EVM vinculada en «Explorar» es **pública** y vive solo en `sessionStorage`.
- Las **claves privadas nunca se manejan en esta app** (modelo custodial: las custodia el
  backend).
