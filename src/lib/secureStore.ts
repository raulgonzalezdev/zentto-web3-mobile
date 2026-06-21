// Almacenamiento SEGURO para datos sensibles (hash + salt del PIN).
// En nativo usa capacitor-secure-storage-plugin (Android Keystore / iOS Keychain);
// si el Keystore falla, cae a @capacitor/preferences. En web cae a localStorage.
// El PIN NUNCA se guarda en claro: aquí solo viven su hash SHA-256 y el salt.
//
// Import ESTÁTICO; los plugins no lanzan al importar (solo al llamar en
// plataforma no soportada, lo cual guardamos con isNativePlatform()).

import { Capacitor } from '@capacitor/core';
import { SecureStoragePlugin } from 'capacitor-secure-storage-plugin';
import { storageGet, storageSet, storageRemove } from './storage';

function native(): boolean {
  return Capacitor.isNativePlatform();
}

export async function secureGet(key: string): Promise<string | null> {
  if (native()) {
    try {
      const { value } = await SecureStoragePlugin.get({ key });
      return value ?? null;
    } catch {
      // No existe la clave o el Keystore no está disponible → cae a Preferences.
      return storageGet(key);
    }
  }
  return storageGet(key);
}

export async function secureSet(key: string, value: string): Promise<void> {
  if (native()) {
    try {
      await SecureStoragePlugin.set({ key, value });
      // Limpia cualquier copia previa en el storage no seguro.
      await storageRemove(key).catch(() => {});
      return;
    } catch {
      /* Keystore no disponible → Preferences */
    }
  }
  await storageSet(key, value);
}

export async function secureRemove(key: string): Promise<void> {
  if (native()) {
    try {
      await SecureStoragePlugin.remove({ key });
    } catch {
      /* sigue limpiando el storage no seguro */
    }
  }
  await storageRemove(key);
}
