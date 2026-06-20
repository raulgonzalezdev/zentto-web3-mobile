# Zentto Web3 — App móvil de usuarios (neobanco cripto)

App móvil para los **usuarios finales** del neobanco cripto Zentto (modelo Kontigo/Meru).
El frontend web (`zentto-web3-frontend`) es el **backoffice** (operadores); ESTA app es la
de los clientes.

## Stack
- **Ionic React + Capacitor** (estándar Zentto: web skills + wrap nativo Android/iOS).
- TypeScript. Corre en navegador con `ionic serve` (dev) y empaqueta con Capacitor.
- Auth contra el **mismo backend** (`http://localhost:4100/api`): cookies httpOnly + CSRF + 2FA.
  - Usa `credentials: 'include'` + header `x-csrf-token` (cookie `zw3_csrf`) en mutaciones.
  - En navegador (dev) funciona directo. Para nativo se documentará el manejo de cookies
    vía `CapacitorHttp` (follow-up).

## Backend (mismo contrato que el backoffice)
Ver `D:\DatqBoxWorkspace\zentto-web3-frontend\API_CONTRACT.md` para auth + endpoints.
Cadena real (testnet) — nuevos endpoints públicos:
- `GET /api/evm/info` → red conectada + último bloque.
- `GET /api/evm/address/:address` → saldo real nativo (ETH) + USDC de una address.
- `GET /api/evm/tx/:hash` → estado de una transacción on-chain.

## Pantallas (mobile-first, gestos, bottom tabs)
1. **Onboarding / Login / Registro / 2FA** (igual que el backoffice, contra /api/auth).
2. **Inicio (Saldo)**: saldo en USD/USDT del usuario. Para esta fase, demo con saldo real de
   testnet: input/almacén de una address EVM y muestra su balance real vía `/evm/address`.
   Tarjeta grande tipo "cuenta", accesos a Enviar / Recibir.
3. **Enviar**: a otra address (por ahora muestra el flujo; la firma/custodia real es follow-up).
4. **Recibir / Depositar**: muestra la address (QR) para recibir.
5. **Movimientos**: historial (estado de tx por hash vía `/evm/tx`).
6. **Perfil**: datos del usuario, 2FA, logout.

## Estética
Look Zentto moderno, oscuro por defecto, acento indigo/cyan (como el backoffice). Limpio,
tipo app de banco/cripto (Kontigo, Meru, Cashea). Bottom tab navigation.

## Reglas
- NUNCA tokens en localStorage (auth por cookies httpOnly del backend).
- Sin datos mock: todo contra la API real (auth + /evm).
- Capacitor config lista (`capacitor.config.ts`, appId `net.zentto.web3app`), pero NO hace falta
  compilar nativo (requiere Android Studio/Xcode) — dejarlo documentado.
- No inicializar git (lo hace el agente principal).
