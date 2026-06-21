// Biometría (huella / Face ID) vía capacitor-native-biometric, con carga dinámica
// y detección de plataforma para no romper el build web (igual que la cámara KYC).
// En navegador o sin hardware, isBiometricAvailable() devuelve false.

type BiometricModule = {
  NativeBiometric?: {
    isAvailable: (o?: { useFallback: boolean }) => Promise<{ isAvailable: boolean; biometryType: number }>;
    verifyIdentity: (o?: {
      reason?: string;
      title?: string;
      subtitle?: string;
      description?: string;
      negativeButtonText?: string;
      useFallback?: boolean;
    }) => Promise<void>;
  };
};

let modPromise: Promise<BiometricModule | null> | null = null;

function isNativePlatform(): boolean {
  // Capacitor expone window.Capacitor.isNativePlatform() en runtime.
  const cap = (globalThis as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor;
  return typeof cap?.isNativePlatform === 'function' ? cap.isNativePlatform() : false;
}

async function loadModule(): Promise<BiometricModule | null> {
  if (!isNativePlatform()) return null;
  if (!modPromise) {
    modPromise = (async () => {
      try {
        const specifier = 'capacitor-native-biometric';
        return (await import(/* @vite-ignore */ specifier).catch(() => null)) as BiometricModule | null;
      } catch {
        return null;
      }
    })();
  }
  return modPromise;
}

/** ¿El dispositivo tiene biometría disponible y enrolada? Falso en web. */
export async function isBiometricAvailable(): Promise<boolean> {
  const mod = await loadModule();
  if (!mod?.NativeBiometric) return false;
  try {
    const res = await mod.NativeBiometric.isAvailable({ useFallback: false });
    return !!res.isAvailable;
  } catch {
    return false;
  }
}

/** Lanza el prompt biométrico. Devuelve true si el usuario se autenticó. */
export async function verifyBiometric(reason = 'Desbloquea Zentto'): Promise<boolean> {
  const mod = await loadModule();
  if (!mod?.NativeBiometric) return false;
  try {
    await mod.NativeBiometric.verifyIdentity({
      reason,
      title: 'Zentto',
      subtitle: 'Verifica tu identidad',
      description: reason,
      negativeButtonText: 'Usar PIN',
      useFallback: false,
    });
    return true;
  } catch {
    return false;
  }
}
