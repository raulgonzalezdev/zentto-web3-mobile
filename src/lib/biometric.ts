// Biometría (huella / Face ID) vía capacitor-native-biometric.
// Import ESTÁTICO: los plugins de Capacitor se registran al importar y NO lanzan
// en web (solo fallan al LLAMAR un método en plataforma no soportada, lo cual
// evitamos con isNativePlatform()). El import dinámico con specifier variable NO
// lo empaquetaba Vite → el plugin nunca se registraba ("no disponible").

import { Capacitor } from '@capacitor/core';
import { NativeBiometric } from 'capacitor-native-biometric';

function isNativePlatform(): boolean {
  return Capacitor.isNativePlatform();
}

/** ¿El dispositivo tiene biometría disponible y enrolada? Falso en web. */
export async function isBiometricAvailable(): Promise<boolean> {
  if (!isNativePlatform()) return false;
  try {
    const res = await NativeBiometric.isAvailable({ useFallback: false });
    return !!res.isAvailable;
  } catch {
    return false;
  }
}

/** Lanza el prompt biométrico. Devuelve true si el usuario se autenticó. */
export async function verifyBiometric(reason = 'Desbloquea Zentto'): Promise<boolean> {
  if (!isNativePlatform()) return false;
  try {
    await NativeBiometric.verifyIdentity({
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
