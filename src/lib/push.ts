// Notificaciones push (FCM/APNs) vía @capacitor/push-notifications.
// Import ESTÁTICO; no-op en web. Scaffold completo y TOLERANTE A FALLOS:
//   - Si falta la config nativa de Firebase (google-services.json en Android),
//     registerForPush() NO lanza: hace try/catch + log y la app sigue normal.
//   - Para ACTIVAR push en producción hay que añadir el proyecto Firebase y el
//     archivo google-services.json a android/app/ (ver informe / README).
//
// NOTA: este helper NO envía el token a ningún endpoint todavía (no tocamos la
// capa de API). Cuando exista un endpoint de registro de dispositivos, llamarlo
// desde onToken().

import { Capacitor } from '@capacitor/core';
import {
  PushNotifications,
  type Token,
  type PushNotificationSchema,
  type ActionPerformed,
} from '@capacitor/push-notifications';

let registered = false;

/** Callback opcional para que la app reciba el token (p.ej. mandarlo al backend). */
type PushCallbacks = {
  onToken?: (token: string) => void;
  onReceived?: (notification: PushNotificationSchema) => void;
  onAction?: (action: ActionPerformed) => void;
};

/**
 * Pide permiso, registra el dispositivo y engancha los listeners de push.
 * Seguro de llamar varias veces (idempotente). Nunca lanza.
 * Llamar tras un login exitoso.
 */
export async function registerForPush(cb: PushCallbacks = {}): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  if (registered) return;
  registered = true;

  try {
    // 1) Permiso del sistema.
    let perm = await PushNotifications.checkPermissions();
    if (perm.receive === 'prompt' || perm.receive === 'prompt-with-rationale') {
      perm = await PushNotifications.requestPermissions();
    }
    if (perm.receive !== 'granted') {
      registered = false; // permite reintentar más tarde si el usuario lo concede
      return;
    }

    // 2) Listeners (token, registro fallido, recibido, acción).
    await PushNotifications.addListener('registration', (token: Token) => {
      // eslint-disable-next-line no-console
      console.info('[push] token recibido');
      cb.onToken?.(token.value);
    });

    await PushNotifications.addListener('registrationError', (err) => {
      // Falta google-services.json o config FCM: lo logueamos sin romper la app.
      // eslint-disable-next-line no-console
      console.warn('[push] registro fallido (¿falta google-services.json / FCM?):', err);
    });

    await PushNotifications.addListener('pushNotificationReceived', (n) => {
      cb.onReceived?.(n);
    });

    await PushNotifications.addListener('pushNotificationActionPerformed', (a) => {
      cb.onAction?.(a);
    });

    // 3) Registro en FCM/APNs (dispara 'registration' o 'registrationError').
    await PushNotifications.register();
  } catch (err) {
    // Cualquier fallo (config faltante incluida) NO debe romper el arranque.
    // eslint-disable-next-line no-console
    console.warn('[push] no se pudo inicializar:', err);
    registered = false;
  }
}
