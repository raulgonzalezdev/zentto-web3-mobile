// Haptics nativos (vibración sutil al tacto) vía @capacitor/haptics.
// Import ESTÁTICO: el plugin se registra al importar y NO lanza en web; solo
// fallaría al LLAMAR un método en plataforma no soportada, lo cual evitamos con
// isNativePlatform(). Todas las funciones son no-op en web y nunca lanzan.

import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';

function native(): boolean {
  return Capacitor.isNativePlatform();
}

/** Toque ligero — botones primarios, tabs, items de lista, teclas del PIN. */
export function tapLight(): void {
  if (!native()) return;
  void Haptics.impact({ style: ImpactStyle.Light }).catch(() => {});
}

/** Toque medio — acciones con más peso (abrir modales, tomar oferta). */
export function tapMedium(): void {
  if (!native()) return;
  void Haptics.impact({ style: ImpactStyle.Medium }).catch(() => {});
}

/** Vibración de éxito — tras transferir / retirar / crear oferta / confirmar trade. */
export function notifySuccess(): void {
  if (!native()) return;
  void Haptics.notification({ type: NotificationType.Success }).catch(() => {});
}

/** Vibración de error — tras un fallo de operación o PIN incorrecto. */
export function notifyError(): void {
  if (!native()) return;
  void Haptics.notification({ type: NotificationType.Error }).catch(() => {});
}

/** Vibración de aviso — validaciones intermedias (PIN no coincide, etc.). */
export function notifyWarning(): void {
  if (!native()) return;
  void Haptics.notification({ type: NotificationType.Warning }).catch(() => {});
}

/** Selección — cambio de segmento / pestaña. */
export function selection(): void {
  if (!native()) return;
  void Haptics.selectionChanged().catch(() => {});
}
