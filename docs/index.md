---
layout: default
title: Visión general
---

# Zentto Web3 — App móvil

**El centro de tu dinero digital.** App móvil de usuario final del servicio cripto
**custodial** de Zentto: enviar y recibir dinero, recargar saldo (depósito on-chain o fiat),
y comprar/vender dólares digitales (USDT/USDC) contra bolívares (VES) por un mercado P2P —
todo desde el teléfono, con verificación de identidad (KYC) y 2FA.

Construida con **Ionic React + Capacitor 6 + TypeScript (Vite)**. Consume el backend
[`zentto-web3`](https://github.com/raulgonzalezdev/zentto-web3). El saldo del usuario vive en
un **ledger** del backend (modelo custodial estilo Kontigo/Meru); las **claves privadas nunca
se manejan en esta app**.

## Documentación

| Sección | Contenido |
|---------|-----------|
| [Arquitectura](./arquitectura) | Stack, plugins nativos, auth, candado de app, estructura |
| [Pantallas y flujos](./pantallas) | Mapa de pantallas, navegación y flujos de usuario |
| [Integración con la API](./api) | Cliente HTTP y endpoints consumidos del backend |
| [Build & deploy](./build) | Setup local, build web y empaquetado Android/iOS |

## Lugar en el ecosistema

| Repo | Rol |
|------|-----|
| [`zentto-web3`](https://github.com/raulgonzalezdev/zentto-web3) | Backend custodial (API que consume esta app) — NestJS |
| [`zentto-web3-frontend`](https://github.com/raulgonzalezdev/zentto-web3-frontend) | Backoffice de operadores (web) — Next.js |
| **`zentto-web3-mobile`** (este) | App de usuario final — Ionic React + Capacitor |
| [`zentto-kyc`](https://github.com/zentto-erp/zentto-kyc) | Servicio KYC self-hosted multi-tenant |

Esta app y el backoffice consumen el **mismo backend** y comparten el contrato de auth
(cookies httpOnly + CSRF + 2FA TOTP). El backoffice es para operadores y árbitros de
disputas; esta es para clientes.

## Qué puede hacer un usuario

- Registrarse e iniciar sesión (con 2FA opcional).
- Ver su saldo y su historial de movimientos.
- Enviar dinero a otro usuario por email (transferencia interna en el ledger).
- Recibir dinero (dirección / QR) y recargar (depósito on-chain multi-red o fiat).
- Comprar/vender USDT/USDC contra VES en el mercado **P2P** (con escrow, chat, evidencias de
  pago, extensión de tiempo y disputas).
- Verificar su identidad (**KYC**: documento + selfie, Didit hospedado o captura nativa).
- Proteger la app con **PIN + huella/Face ID** y activar **2FA (Google Authenticator)**.
- Registrar métodos de cobro (Pago Móvil / cuenta bancaria) para las operaciones P2P.
