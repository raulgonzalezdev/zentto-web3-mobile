---
layout: default
title: Arquitectura
---

# Arquitectura de la app

## Stack

- **Ionic React** `@ionic/react` 8 + `@ionic/react-router` 8 sobre **React 18**, modo oscuro
  forzado (`palettes/dark.always.css`), `mode: 'md'`.
- **Capacitor 6** — wrap nativo Android/iOS del WebView; `appId = net.zentto.web3app`.
- **TanStack React Query 5** — fetch, cache e invalidación de datos remotos.
- **Vite 5** + **TypeScript 5**.
- `qrcode` — QR de Recibir y de configuración 2FA.

## Bootstrap (`main.tsx`)

```
setupIonicReact → providers anidados:
  QueryClientProvider          (React Query, retry:1, sin refetch on focus)
    AuthProvider               (sesión: sondea /auth/me al arrancar)
      LockProvider             (candado de app: PIN + biometría)
        App                    (router + bottom tabs)
```

Al iniciar se configura la status bar y se oculta el splash (solo en plataforma nativa).

## Estado de sesión y enrutado (`App.tsx`)

`App` decide qué renderizar según `useAuth()` y `useLock()`:

1. **Cargando** → spinner a pantalla completa.
2. **Bloqueada** (`locked`) → `LockScreen` (overlay PIN/huella encima de todo).
3. **Sin sesión** (`!user`) → rutas de auth: `/login`, `/register`, `/legal/:slug`.
4. **Con sesión** → `IonTabs` con bottom tabbar (Inicio · Enviar · Recibir · P2P · Historial)
   + `SettingsMenu` (drawer lateral) y todas las rutas internas.

## Plugins nativos de Capacitor

| Plugin | Uso |
|--------|-----|
| `@capacitor/app` | Eventos `pause`/`resume` → auto-bloqueo por inactividad |
| `@capacitor/browser` | Abre la sesión hospedada de KYC (Didit) |
| `@capacitor/local-notifications` | Aviso local al recibir dinero (sin Firebase) |
| `@capacitor/preferences` + `capacitor-secure-storage-plugin` | Config local segura |
| `capacitor-native-biometric` | Desbloqueo por huella / Face ID |
| `@capacitor/clipboard` · `@capacitor/share` | Copiar/compartir direcciones y datos de pago |
| `@capacitor/haptics` | Feedback táctil |
| `@capacitor/keyboard` · `@capacitor/status-bar` · `@capacitor/splash-screen` | UX nativa |

La cámara para KYC se usa con `getUserMedia` dentro del WebView (permiso `CAMERA` en el
manifest Android).

## Autenticación

Cliente HTTP propio en `src/api/client.ts` (`apiFetch`):

- `credentials: 'include'` → cookies httpOnly del backend (`zw3_access`, `zw3_refresh`).
- **CSRF double-submit**: en mutaciones envía header `x-csrf-token` con el valor de la cookie
  `zw3_csrf` (sembrada vía `/auth/csrf` si falta).
- **Auto-refresh**: ante un `401`, hace `POST /auth/refresh` **una sola vez** y reintenta
  (excepto en el sondeo inicial de `/auth/me`, `retryOnAuth:false`).
- **Idempotencia**: las mutaciones que mueven saldo (transfer, withdraw, take P2P, credit)
  envían `Idempotency-Key` (UUID por intento).

> Nunca se guardan tokens en `localStorage`. La sesión vive en cookies httpOnly del backend.

### Step-up TOTP

Operaciones sensibles (retiro on-chain, confirmar liberación de un trade P2P) exigen un
código TOTP de 6 dígitos (Google Authenticator). El hook `useStepUp` lo gestiona.

## Candado de app (`LockContext`)

- PIN propio de la app (`pinLock` + `secureStore`) + desbloqueo biométrico opcional.
- Re-bloqueo al volver de segundo plano **solo si** estuvo fuera más de 30s (ventana de gracia
  para ir a copiar un OTP o aceptar el prompt de huella sin ciclos).
- A prueba de fallos: el arranque siempre termina (timeout 2s) para no dejar pantalla negra.

## Estructura de carpetas

```
src/
  api/        client.ts (fetch + CSRF + refresh) · auth · payments · p2p · kyc
              security · paymentMethods · users · evm · types
  auth/       AuthContext.tsx · LockContext.tsx
  components/ LockScreen · PinPad · CameraCaptureModal · ImageCapture · QrCode
              SettingsMenu · PublishOfferModal · TransactionDetailModal · StatusChip · Skeletons · ZenttoHeader
  hooks/      useEvm · useP2p · useKyc · usePayments · usePaymentMethods · useSecurity
              useUsers · useWallet · useStepUp · useIncomingNotifications · useCountUp
  lib/        biometric · pinLock · secureStore · notifications · push · haptics · clipboard
              share · browser · capture · fees · format · paymentMethod · venezuelanBanks · statusBar · storage · legalContent
  pages/      (15 pantallas, ver «Pantallas y flujos»)
  theme/      zentto.css
  App.tsx · main.tsx
```
