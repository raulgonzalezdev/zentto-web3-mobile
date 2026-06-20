# Zentto Web3 — App móvil de usuarios

Neobanco cripto (modelo Kontigo/Meru) para los **usuarios finales**. El web frontend
(`zentto-web3-frontend`) es el backoffice de operadores; **esta** es la app de clientes.

Construida con **Ionic React + Capacitor + TypeScript (Vite)**. Corre en navegador para dev y
se empaqueta nativo (Android/iOS) con Capacitor.

## Stack

- Ionic React (`@ionic/react`, `@ionic/react-router`) + React 18.
- Capacitor 6 (`@capacitor/core`, `@capacitor/android`, `@capacitor/ios`, `@capacitor/cli`).
- `@tanstack/react-query` para datos remotos.
- `qrcode` para el QR de la pantalla Recibir.
- Vite como bundler.

`capacitor.config.ts`: `appId = net.zentto.web3app`, `appName = "Zentto"`.

## Requisitos

- Node 18+ (probado con Node 22) y npm.
- El **backend Zentto Web3** corriendo en `http://localhost:4100` (auth + endpoints `/api/evm/*`).

## Correr en desarrollo (navegador)

```bash
npm install
cp .env.example .env       # ya incluido; ajusta VITE_API_BASE si hace falta
npm run dev                # Vite en http://localhost:3200
```

Abre `http://localhost:3200`. Verás Onboarding/Login. Con el backend en `:4100` puedes
registrarte, iniciar sesión (incluido reto 2FA si la cuenta lo tiene), y navegar las pantallas.

> El backend ya tiene CORS con credenciales. Como Vite corre en `:3200` (no `:3100`), si el
> backend restringe orígenes puede que las cookies no se sienten en navegador. En ese caso, corre
> el front en `:3100` (`npm run dev -- --port 3100`) o agrega `:3200` a la allowlist CORS del
> backend. Ver "Supuestos" abajo.

## Build de producción (web)

```bash
npm run build      # tsc --noEmit + vite build → dist/
npm run preview    # sirve dist/ en :3200
```

## Capacitor (nativo — opcional, NO necesario para probar)

Compilar nativo requiere **Android Studio** (Android) y **Xcode** (iOS), que no están en este
entorno. Pasos cuando se quiera empaquetar:

```bash
npm run build
npx cap add android      # o: npm run cap:add:android
npx cap add ios          # requiere macOS + Xcode
npx cap sync
npx cap open android     # abre Android Studio
```

Las carpetas `android/` e `ios/` están en `.gitignore` (se regeneran con `cap add`).

### Cookies httpOnly en nativo (follow-up)

En navegador, `fetch` con `credentials:'include'` maneja las cookies httpOnly del backend de
forma transparente. En **WebView nativo** el manejo de cookies cross-origin es menos fiable; la
ruta recomendada es migrar el cliente API a **`@capacitor/preferences` + `CapacitorHttp`** (o el
plugin `@capacitor-community/http`), que respeta cookies del sistema. Esto queda como follow-up:
el código del cliente (`src/api/client.ts`) está aislado para sustituir solo la capa de transporte.

## Estructura

```
src/
  api/
    client.ts        # fetch con credentials:'include', CSRF double-submit, auto-refresh 401
    auth.ts          # login / register / 2fa / me / logout
    evm.ts           # /evm/info, /evm/address/:address, /evm/tx/:hash + normalizadores
    types.ts         # tipos User / EVM
  auth/
    AuthContext.tsx  # estado de sesión; sondeo inicial de /auth/me (retryOnAuth:false)
  components/
    QrCode.tsx       # QR en canvas (lib qrcode)
    ZenttoHeader.tsx
  hooks/
    useEvm.ts        # react-query para los 3 endpoints EVM + validadores address/hash
    useWallet.ts     # address EVM vinculada (sessionStorage, NO llaves privadas)
  pages/
    LoginPage.tsx · RegisterPage.tsx
    HomePage.tsx     # tarjeta de saldo + vincular address + activos reales
    SendPage.tsx · ReceivePage.tsx · MovementsPage.tsx · ProfilePage.tsx
  theme/zentto.css   # tema oscuro indigo/cyan + overrides Ionic
  App.tsx            # router + bottom tabs (auth-gated)
  main.tsx           # bootstrap Ionic + react-query + AuthProvider
capacitor.config.ts · vite.config.ts · index.html
```

## Pantallas

1. **Login / Registro / 2FA** — contra `/api/auth/*`, cookies httpOnly.
2. **Inicio (Saldo)** — tarjeta de cuenta; vincula una address EVM y muestra su saldo real de
   testnet (ETH + USDC) vía `/api/evm/address/:address`. Botones Enviar / Recibir.
3. **Enviar** — formulario de transferencia (vista previa del flujo; firma/custodia = follow-up).
4. **Recibir** — address con **QR** + copiar.
5. **Movimientos** — estado de tx por hash vía `/api/evm/tx/:hash`.
6. **Perfil** — datos de `/api/auth/me`, estado 2FA, logout.

## Seguridad

- **NUNCA** se guardan tokens en localStorage. La sesión vive en cookies httpOnly del backend
  (`zw3_access`, `zw3_refresh`); el CSRF (`zw3_csrf`) se lee y se reenvía como `x-csrf-token` en
  mutaciones.
- La address EVM vinculada es **pública** y se guarda solo en `sessionStorage` (no persiste entre
  cierres). Las **llaves privadas nunca se manejan en esta app**.

## Supuestos / Follow-up

- **Endpoints `/api/evm/*`:** al construir esta app, el backend en `:4100` respondía `404` a
  `/api/evm/info`, `/api/evm/address/:address` y `/api/evm/tx/:hash` (auth y `/api/chain` sí
  funcionan). La app llama a esos endpoints según el contrato del SPEC y maneja el 404 de forma
  graceful (muestra "endpoint no disponible" sin romper). Cuando el backend los exponga, los
  saldos reales de Sepolia aparecen sin cambios en el front. Los normalizadores en `api/evm.ts`
  toleran varias formas de respuesta (`eth`/`native`, `usdc`/`tokens[]`).
- **CORS / puerto:** el contrato dice que el backend permite `http://localhost:3100`. Esta app
  corre en `:3200` por defecto. Si las cookies no se sientan, usar `:3100` o ampliar la allowlist
  CORS del backend.
- **Enviar (firma on-chain):** la pantalla Enviar arma el flujo pero no firma/difunde; la
  custodia y firma reales son follow-up del backend.
- **Gestión 2FA in-app:** el login con 2FA funciona; el setup/enable/disable desde la app queda
  como follow-up (hoy se hace desde el web).
- **Nativo:** no se compiló Android/iOS (requiere Android Studio/Xcode). Documentado arriba.
```
