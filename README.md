# Zentto Web3 — App móvil

> El centro de tu dinero digital. App móvil de usuario final para enviar, recibir,
> recargar y comprar/vender dólares digitales (USDT/USDC) desde el teléfono.

App móvil **Ionic React + Capacitor** para los usuarios finales del servicio cripto
custodial de Zentto. Consume la API del backend [`zentto-web3`](https://github.com/raulgonzalezdev/zentto-web3)
(modelo custodial estilo Kontigo/Meru/Binance P2P): el saldo del usuario vive en un
**ledger** del backend, no en la blockchain — las claves privadas **nunca** se manejan en
esta app.

## Lugar en el ecosistema

| Repo | Rol | Stack |
|------|-----|-------|
| [`zentto-web3`](https://github.com/raulgonzalezdev/zentto-web3) | Backend custodial (API que consume esta app) | NestJS |
| [`zentto-web3-frontend`](https://github.com/raulgonzalezdev/zentto-web3-frontend) | Backoffice de operadores (web) | Next.js |
| **`zentto-web3-mobile`** (este) | App de **usuario final** | Ionic React + Capacitor |
| [`zentto-kyc`](https://github.com/zentto-erp/zentto-kyc) | Servicio KYC self-hosted multi-tenant ([kyc.zentto.net](https://kyc.zentto.net)) | Express + FastAPI |

Esta app y el backoffice consumen el **mismo backend** y comparten contrato de auth
(cookies httpOnly + CSRF + 2FA TOTP). El backoffice es para operadores/árbitros; esta es
para clientes.

## Stack

- **Ionic React** `@ionic/react` 8 + `@ionic/react-router` 8 (React 18, modo oscuro forzado).
- **Capacitor 6** (`@capacitor/core`, `android`, `ios`, `cli`).
- **TanStack React Query 5** para datos remotos y cache.
- **Vite 5** como bundler · **TypeScript 5**.
- `qrcode` para los QR de Recibir / 2FA.

`capacitor.config.ts`: `appId = net.zentto.web3app`, `appName = "Zentto"`, `webDir = dist`.

### Plugins nativos de Capacitor

| Plugin | Uso en la app |
|--------|---------------|
| `@capacitor/app` | Ciclo de vida (pause/resume) para el auto-bloqueo de la app |
| `@capacitor/browser` | Abre la sesión hospedada de KYC (Didit) en el navegador del sistema |
| `@capacitor/local-notifications` | Avisa cuando llega dinero (notificación local, sin Firebase) |
| `@capacitor/preferences` / `capacitor-secure-storage-plugin` | Almacenamiento local seguro (config de candado, address vinculada) |
| `capacitor-native-biometric` | Desbloqueo por huella / Face ID |
| `@capacitor/clipboard` · `@capacitor/share` | Copiar/compartir direcciones y datos de pago |
| `@capacitor/haptics` | Feedback táctil en navegación y acciones |
| `@capacitor/keyboard` · `@capacitor/status-bar` · `@capacitor/splash-screen` | UX nativa (teclado, barra de estado, splash) |

La cámara nativa para captura de documentos/selfie en KYC se usa vía la Web API
`getUserMedia` dentro del WebView (permiso `CAMERA` declarado en el manifest Android).

## Features / pantallas reales

Navegación principal por **bottom tabs** (Inicio · Enviar · Recibir · P2P · Historial) +
un **drawer lateral** de configuración. Rutas con sesión protegidas por `AuthContext`; si
hay PIN configurado, un **LockScreen** a pantalla completa exige PIN/huella antes de entrar.

| Ruta | Pantalla | Propósito |
|------|----------|-----------|
| `/login` | LoginPage | Inicio de sesión (email + password, con reto 2FA si aplica) |
| `/register` | RegisterPage | Alta de cuenta |
| `/home` | HomePage | Tarjeta de saldo del ledger + accesos Enviar/Recibir/Recargar + historial embebido |
| `/send` | SendPage | Transferencia a otro usuario por email (buscador) sobre el ledger |
| `/receive` | ReceivePage | Dirección/QR para recibir + compartir |
| `/recharge` | RechargePage | Recargar saldo: depósito on-chain multi-red o pago fiat |
| `/movements` | MovementsPage | Historial de movimientos del ledger + detalle por transacción |
| `/p2p` | P2pPage | Mercado P2P: comprar/vender USDT/USDC contra VES (order book) |
| `/p2p/trade/:id` | TradeDetailPage | Detalle de un trade: escrow, chat, evidencias de pago, disputas, extensión de tiempo |
| `/explore` | ExplorePage | Consulta de saldo on-chain / estado de transacción por hash (lectura blockchain) |
| `/profile` | ProfilePage | Perfil del usuario, edición de nombre/teléfono, estado 2FA, logout |
| `/kyc` | KycPage | Verificación de identidad (documento + selfie) — Didit hospedado o captura nativa |
| `/security` | SecurityPage | Configurar 2FA (TOTP / Google Authenticator) |
| `/app-security` | AppSecurityPage | Candado de la app: PIN + desbloqueo biométrico |
| `/payment-methods` | PaymentMethodsPage | Métodos de cobro (Pago Móvil / cuenta bancaria) para P2P |
| `/legal/:slug` | LegalPage | Documentos legales (términos, privacidad…) |

Funcionalidades transversales:

- **Auth** cookies httpOnly + CSRF double-submit + auto-refresh ante 401 + **2FA TOTP**.
- **Candado de app**: PIN propio + biometría, con re-bloqueo por inactividad (gracia 30s).
- **Notificaciones locales** al detectar dinero entrante mientras la app está abierta.
- **Step-up TOTP** (segundo factor) en operaciones sensibles: retiro on-chain, confirmar trade P2P.
- **Idempotencia**: las mutaciones que mueven saldo envían `Idempotency-Key` por intento.

## Integración con el backend `zentto-web3`

Cliente HTTP propio en `src/api/client.ts` (`apiFetch`): `credentials:'include'`, header
`x-csrf-token` (cookie `zw3_csrf`) en mutaciones, auto `POST /auth/refresh` una vez ante 401.
URL base configurable por `VITE_API_BASE` (default `http://localhost:4100/api`).

| Módulo (`src/api/`) | Endpoints consumidos |
|---------------------|----------------------|
| `auth.ts` | `/auth/me`, `/auth/login`, `/auth/login/2fa`, `/auth/register`, `/auth/logout`, `/auth/csrf`, `/auth/refresh` |
| `payments.ts` | `/accounts/balance`, `/accounts/deposit-address`, `/accounts/deposits`, `/payments`, `/payments/transfer`, `/payments/credit`, `/payments/withdraw`, `/networks`, `/fees`, `/me/withdraw-addresses` |
| `p2p.ts` | `/p2p/orders`, `/p2p/orders/mine`, `/p2p/orders/:id/{take,cancel}`, `/p2p/trades`, `/p2p/trades/:id/{paid,confirm,extend,dispute,cancel,messages}`, `/p2p/market` |
| `kyc.ts` | `/kyc/status`, `/kyc/session` (Didit hospedado), `/kyc/verify-documents` (captura nativa) |
| `security.ts` | `/auth/2fa/setup`, `/auth/2fa/enable` |
| `paymentMethods.ts` | `/me/payment-methods` (CRUD) |
| `users.ts` | `/users/search`, `/users/me` |
| `evm.ts` | `/evm/info`, `/evm/address/:address`, `/evm/tx/:hash` (lectura blockchain — Explorar) |

> Nota de seguridad: nunca se guardan tokens en `localStorage`. La sesión vive en cookies
> httpOnly del backend (`zw3_access`, `zw3_refresh`); el CSRF (`zw3_csrf`) se reenvía como
> header. La address EVM vinculada (Explorar) es pública y vive solo en `sessionStorage`.

## Requisitos

- **Node 18+** (probado con Node 22) y npm.
- Backend [`zentto-web3`](https://github.com/raulgonzalezdev/zentto-web3) corriendo (por
  defecto `http://localhost:4100/api`).
- Para compilar nativo: **Android Studio** (Android) y/o **Xcode + macOS** (iOS).

## Setup local (web / desarrollo)

```bash
npm install
cp .env.example .env        # ajusta VITE_API_BASE si tu backend no está en :4100
npm run dev                 # Vite en http://localhost:3200 (--host)
```

Abre `http://localhost:3200`. Con el backend arriba puedes registrarte, iniciar sesión
(incluido reto 2FA) y navegar todas las pantallas.

### Variables de entorno

| Variable | Default | Descripción |
|----------|---------|-------------|
| `VITE_API_BASE` | `http://localhost:4100/api` | URL base del backend (incluye `/api`) |

## Scripts

| Script | Acción |
|--------|--------|
| `npm run dev` | Vite dev server en `:3200` (`--host`) |
| `npm run build` | `tsc --noEmit` + `vite build` → `dist/` |
| `npm run preview` | Sirve `dist/` en `:3200` |
| `npm run lint` | ESLint sobre `src/` |
| `npm run cap:sync` | `cap sync` (copia web + plugins a las plataformas nativas) |
| `npm run cap:add:android` / `:ios` | Añade la plataforma nativa |

## Build nativo (Android / iOS)

```bash
npm run build
npx cap add android          # o: npm run cap:add:android
npx cap sync
npx cap open android         # abre Android Studio → Build APK/AAB
```

iOS requiere macOS + Xcode (`npx cap add ios` && `npx cap open ios`).

- **Android**: `applicationId = net.zentto.web3app`, `minSdk 22`, `target/compile SDK 34`,
  `versionName "1.0"`. Permisos: `INTERNET`, `CAMERA` (KYC). Las carpetas `android/`/`ios/`
  están en `.gitignore` (se regeneran con `cap add` / `cap sync`).

## Estructura

```
src/
  api/        client.ts (fetch+CSRF+refresh) · auth · payments · p2p · kyc · security
              paymentMethods · users · evm · types
  auth/       AuthContext.tsx (sesión) · LockContext.tsx (candado PIN/biometría)
  components/ LockScreen · PinPad · CameraCaptureModal · ImageCapture · QrCode
              SettingsMenu · PublishOfferModal · TransactionDetailModal · StatusChip · Skeletons · ZenttoHeader
  hooks/      useEvm · useP2p · useKyc · usePayments · usePaymentMethods · useSecurity
              useUsers · useWallet · useStepUp · useIncomingNotifications · useCountUp
  lib/        biometric · pinLock · secureStore · notifications · push · haptics · clipboard
              share · browser · capture · fees · format · paymentMethod · venezuelanBanks · statusBar · storage · legalContent
  pages/      Login · Register · Home · Send · Receive · Recharge · Movements
              P2p · TradeDetail · Explore · Profile · Kyc · Security · AppSecurity · PaymentMethods · Legal
  theme/      zentto.css (oscuro indigo/cyan + overrides Ionic)
  App.tsx     router + bottom tabs (auth-gated) · main.tsx bootstrap
capacitor.config.ts · vite.config.ts · index.html · android/
```

## Documentación

Documentación técnica y de uso (arquitectura, mapa de pantallas, flujos de
onboarding/KYC/depósito/transferencia/retiro/P2P, integración con el backend y guía de
build): **GitHub Pages** del repo (carpeta `docs/`).
