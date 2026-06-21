// Bloqueo por PIN local de la app. El PIN NUNCA se guarda en claro: se almacena su
// hash SHA-256 (con salt por instalación) en almacenamiento SEGURO (Android
// Keystore / iOS Keychain vía capacitor-secure-storage-plugin), con fallback a
// @capacitor/preferences o localStorage. Esto NO es auth de backend — es un
// candado de la app encima de la sesión.

import { storageGet, storageRemove, storageSet } from './storage';
import { secureGet, secureRemove, secureSet } from './secureStore';

const K_HASH = 'zt_pin_hash';
const K_SALT = 'zt_pin_salt';
const K_BIO = 'zt_pin_biometric'; // '1' si el usuario activó huella

function toHex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function randomSalt(): string {
  const arr = new Uint8Array(16);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(arr);
  } else {
    for (let i = 0; i < arr.length; i++) arr[i] = Math.floor(Math.random() * 256);
  }
  return toHex(arr.buffer);
}

async function hashPin(pin: string, salt: string): Promise<string> {
  const data = new TextEncoder().encode(`${salt}:${pin}`);
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const digest = await crypto.subtle.digest('SHA-256', data);
    return toHex(digest);
  }
  // Fallback no criptográfico (entornos sin SubtleCrypto). Mejor que texto plano.
  let h = 0;
  const s = `${salt}:${pin}`;
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  return `fallback_${(h >>> 0).toString(16)}`;
}

// Migración: lee del storage seguro; si no hay (instalación previa al Keystore),
// cae al storage normal y migra el valor al seguro de forma transparente.
async function readSecretWithMigration(key: string): Promise<string | null> {
  const secure = await secureGet(key);
  if (secure) return secure;
  const legacy = await storageGet(key);
  if (legacy) {
    await secureSet(key, legacy).catch(() => {});
    await storageRemove(key).catch(() => {});
    return legacy;
  }
  return null;
}

/** ¿Hay un PIN configurado? */
export async function isPinSet(): Promise<boolean> {
  return !!(await readSecretWithMigration(K_HASH));
}

/** Crea o reemplaza el PIN (4-6 dígitos). */
export async function setPin(pin: string): Promise<void> {
  const salt = randomSalt();
  const hash = await hashPin(pin, salt);
  await secureSet(K_SALT, salt);
  await secureSet(K_HASH, hash);
}

/** Verifica el PIN ingresado contra el hash guardado. */
export async function verifyPin(pin: string): Promise<boolean> {
  const [hash, salt] = await Promise.all([
    readSecretWithMigration(K_HASH),
    readSecretWithMigration(K_SALT),
  ]);
  if (!hash || !salt) return false;
  const candidate = await hashPin(pin, salt);
  return candidate === hash;
}

/** Desactiva el bloqueo: borra PIN, salt y flag de biometría. */
export async function clearPin(): Promise<void> {
  await Promise.all([
    secureRemove(K_HASH),
    secureRemove(K_SALT),
    storageRemove(K_HASH),
    storageRemove(K_SALT),
    storageRemove(K_BIO),
  ]);
}

/** ¿El usuario activó la huella como método de desbloqueo? */
export async function isBiometricEnabled(): Promise<boolean> {
  return (await storageGet(K_BIO)) === '1';
}

/** Activa/desactiva la huella para el desbloqueo. */
export async function setBiometricEnabled(on: boolean): Promise<void> {
  if (on) await storageSet(K_BIO, '1');
  else await storageRemove(K_BIO);
}

/** Valida formato de PIN: 4 a 6 dígitos. */
export function isValidPinFormat(pin: string): boolean {
  return /^\d{4,6}$/.test(pin);
}
