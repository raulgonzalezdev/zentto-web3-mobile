// Almacenamiento persistente local (no sesión / no tokens de auth).
// Usa @capacitor/preferences en nativo y localStorage en web.
// NUNCA guardamos aquí tokens de sesión: eso vive en cookies httpOnly del backend.
// Solo: hash del PIN, flags de seguridad (biometría on/off, lock habilitado).
//
// Import ESTÁTICO del plugin: los plugins de Capacitor se registran al importar y
// NO lanzan en web (solo fallan al LLAMAR un método en plataforma no soportada,
// lo cual evitamos con Capacitor.isNativePlatform()). El import dinámico con
// specifier VARIABLE no lo empaquetaba Vite → el plugin nunca se registraba.

import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';

function useNativePrefs(): boolean {
  return Capacitor.isNativePlatform();
}

export async function storageGet(key: string): Promise<string | null> {
  if (useNativePrefs()) {
    try {
      const { value } = await Preferences.get({ key });
      return value;
    } catch {
      /* cae a localStorage */
    }
  }
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

export async function storageSet(key: string, value: string): Promise<void> {
  if (useNativePrefs()) {
    try {
      await Preferences.set({ key, value });
      return;
    } catch {
      /* cae a localStorage */
    }
  }
  try {
    localStorage.setItem(key, value);
  } catch {
    /* sin storage: no-op */
  }
}

export async function storageRemove(key: string): Promise<void> {
  if (useNativePrefs()) {
    try {
      await Preferences.remove({ key });
    } catch {
      /* sigue limpiando localStorage */
    }
  }
  try {
    localStorage.removeItem(key);
  } catch {
    /* no-op */
  }
}
