---
layout: default
title: Build & deploy
---

# Build & deploy

## Requisitos

- **Node 18+** (probado con Node 22) y npm.
- Backend [`zentto-web3`](https://github.com/raulgonzalezdev/zentto-web3) corriendo
  (default `http://localhost:4100/api`).
- Para nativo: **Android Studio** (Android) y/o **Xcode + macOS** (iOS).

## Desarrollo (web)

```bash
npm install
cp .env.example .env        # ajusta VITE_API_BASE si tu backend no está en :4100
npm run dev                 # Vite en http://localhost:3200 (--host)
```

> Si las cookies httpOnly no se sientan por CORS, corre el front en el origen que el backend
> tenga en la allowlist (p. ej. `npm run dev -- --port 3100`) o amplía la allowlist del backend.

## Scripts

| Script | Acción |
|--------|--------|
| `npm run dev` | Vite dev server `:3200` |
| `npm run build` | `tsc --noEmit` + `vite build` → `dist/` |
| `npm run preview` | Sirve `dist/` en `:3200` |
| `npm run lint` | ESLint sobre `src/` |
| `npm run cap:sync` | `cap sync` |
| `npm run cap:add:android` / `:ios` | Añade la plataforma nativa |

## Build web (producción)

```bash
npm run build      # → dist/
npm run preview    # verifica el bundle servido en :3200
```

## Build nativo Android

```bash
npm run build
npx cap add android          # o: npm run cap:add:android (solo la primera vez)
npx cap sync                 # copia dist/ + plugins al proyecto Android
npx cap open android         # abre Android Studio
```

En Android Studio: **Build → Build Bundle(s)/APK(s)** (APK de prueba) o **Generate Signed
Bundle/APK** (AAB firmado para Google Play).

- `applicationId = net.zentto.web3app`
- `minSdk 22`, `compileSdk 34`, `targetSdk 34`, `versionName "1.0"` (`versionCode 1`)
- Permisos declarados: `INTERNET`, `CAMERA` (captura KYC); `uses-feature camera` no requerida.

## Build nativo iOS

Requiere **macOS + Xcode**:

```bash
npm run build
npx cap add ios
npx cap sync
npx cap open ios             # abre Xcode → Archive → distribuir a App Store / TestFlight
```

## Notas de despliegue a tiendas

- Tras cualquier cambio web, ejecutar `npm run build && npx cap sync` antes de compilar nativo.
- Subir el **versionCode/versionName** (Android) y el **build number** (iOS) en cada release.
- Configurar firma: keystore (Android) / certificados y perfiles de aprovisionamiento (iOS).
- KYC requiere el permiso de cámara: el manifest Android ya lo declara; en iOS añadir
  `NSCameraUsageDescription` al `Info.plist` al generar el proyecto.

## Documentación (este sitio)

Publicado con **GitHub Pages** (Jekyll, tema Cayman) desde `main` → carpeta `/docs`.
