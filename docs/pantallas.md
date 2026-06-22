---
layout: default
title: Pantallas y flujos
---

# Pantallas y flujos

## Navegación

- **Bottom tabs** (sesión iniciada): Inicio · Enviar · Recibir · P2P · Historial.
- **Drawer lateral** (`SettingsMenu`): KYC, seguridad de la cuenta y de la app, métodos de
  cobro, perfil, legales, logout.
- **Auth gate**: sin sesión → solo `/login`, `/register`, `/legal/:slug`. Con PIN activo, un
  `LockScreen` exige PIN/huella antes de mostrar nada.

## Mapa de pantallas

| Ruta | Pantalla | Propósito |
|------|----------|-----------|
| `/login` | LoginPage | Email + password; reto 2FA si la cuenta lo tiene |
| `/register` | RegisterPage | Alta de cuenta |
| `/home` | HomePage | Saldo del ledger + accesos Enviar/Recibir/Recargar + historial embebido (pull-to-refresh) |
| `/send` | SendPage | Transferencia a otro usuario por email (buscador de destinatarios) |
| `/receive` | ReceivePage | Dirección / QR para recibir + compartir |
| `/recharge` | RechargePage | Recargar: depósito on-chain multi-red o pago fiat |
| `/movements` | MovementsPage | Historial del ledger + detalle por transacción |
| `/p2p` | P2pPage | Mercado P2P: order book comprar/vender USDT/USDC vs VES |
| `/p2p/trade/:id` | TradeDetailPage | Detalle del trade: escrow, chat, evidencias, disputa, extensión de tiempo |
| `/explore` | ExplorePage | Lectura blockchain: saldo por address / estado de tx por hash |
| `/profile` | ProfilePage | Perfil, edición nombre/teléfono, estado 2FA, logout |
| `/kyc` | KycPage | Verificación de identidad (documento + selfie) |
| `/security` | SecurityPage | Configurar 2FA (TOTP / Google Authenticator) |
| `/app-security` | AppSecurityPage | Candado de app: PIN + biometría |
| `/payment-methods` | PaymentMethodsPage | Métodos de cobro (Pago Móvil / cuenta bancaria) |
| `/legal/:slug` | LegalPage | Documentos legales |

## Flujos de usuario

### Onboarding y sesión
1. `RegisterPage` (alta) o `LoginPage`.
2. Si la cuenta tiene 2FA, el login pide el código TOTP (`/auth/login/2fa`).
3. Sesión por cookies httpOnly; al volver a abrir la app, `AuthContext` revalida con `/auth/me`.

### KYC (verificación de identidad)
1. `KycPage` consulta `/kyc/status`.
2. **Flujo principal** — sesión hospedada de Didit: `POST /kyc/session` → la app abre la
   `redirectUrl` (`@capacitor/browser`); el usuario hace documento + selfie con óvalo +
   liveness en Didit. El webhook actualiza el estado solo.
3. **Flujo nativo** — captura en la app: el usuario elige tipo de documento, captura
   frente/dorso/selfie con guía visual (`CameraCaptureModal`) y envía a `/kyc/verify-documents`
   (multipart). Permite reenviar mientras está en revisión.

### Recargar (depósito)
1. `RechargePage` ofrece depósito cripto on-chain (multi-red) o pago fiat.
2. Para cripto: `/accounts/deposit-address` da la dirección (y memo en redes tipo Stellar);
   el backend detecta el depósito on-chain y acredita el ledger.

### Enviar (transferencia interna)
1. `SendPage` busca al destinatario por email (`/users/search`).
2. `POST /payments/transfer` mueve saldo en el ledger (idempotente; 2FA si aplica).

### Retiro on-chain
1. Retiro a una wallet externa vía `POST /payments/withdraw` — **requiere TOTP**.
2. Soporta guardar la dirección como favorita (`/me/withdraw-addresses`).

### P2P (comprar/vender)
1. `P2pPage` muestra el order book (`/p2p/orders`) y el precio de referencia USDT/VES con banda
   anti-especulación (`/p2p/market`).
2. Publicar oferta (`PublishOfferModal` → `/p2p/orders`): **vender escrowa** el cripto del maker
   de inmediato.
3. Tomar una oferta (`/p2p/orders/:id/take`) crea un **trade** → `TradeDetailPage`:
   - El comprador marca pagado (`/paid`) tras transferir el fiat off-platform.
   - El vendedor confirma recibido (`/confirm`, **requiere TOTP**) → libera el cripto.
   - Chat con mensajes y evidencias de pago (`/messages`), extender tiempo (`/extend`, máx 2),
     **disputa** (`/dispute`, la resuelve un árbitro del backoffice) o cancelar.

### Seguridad
- **2FA** (`SecurityPage`): `/auth/2fa/setup` (QR) → `/auth/2fa/enable` (primer código).
- **Candado de app** (`AppSecurityPage`): crear PIN + activar huella/Face ID.

### Notificaciones
`useIncomingNotifications` vigila el historial y dispara una **notificación local** cuando
detecta dinero entrante con la app abierta (sin Firebase). Push en segundo plano queda como
follow-up (requiere FCM).
