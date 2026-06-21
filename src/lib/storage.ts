// Almacenamiento persistente local (no sesión / no tokens de auth).
// Usa @capacitor/Preferences en nativo (carga dinámica) y localStorage en web.
// NUNCA guardamos aquí tokens de sesión: eso vive en cookies httpOnly del backend.
// Solo: hash del PIN, flags de seguridad (biometría on/off, lock habilitado).

type PrefsModule = {
  Preferences?: {
    get: (o: { key: string }) => Promise<{ value: string | null }>;
    set: (o: { key: string; value: string }) => Promise<void>;
    remove: (o: { key: string }) => Promise<void>;
  };
};

let prefsPromise: Promise<PrefsModule['Preferences'] | null> | null = null;

async function getPrefs(): Promise<PrefsModule['Preferences'] | null> {
  if (!prefsPromise) {
    prefsPromise = (async () => {
      try {
        const specifier = '@capacitor/preferences';
        const mod = (await import(/* @vite-ignore */ specifier).catch(() => null)) as PrefsModule | null;
        return mod?.Preferences ?? null;
      } catch {
        return null;
      }
    })();
  }
  return prefsPromise;
}

export async function storageGet(key: string): Promise<string | null> {
  const prefs = await getPrefs();
  if (prefs) {
    try {
      const { value } = await prefs.get({ key });
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
  const prefs = await getPrefs();
  if (prefs) {
    try {
      await prefs.set({ key, value });
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
  const prefs = await getPrefs();
  if (prefs) {
    try {
      await prefs.remove({ key });
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
