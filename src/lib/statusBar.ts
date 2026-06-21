// Status bar nativa (Android/iOS) vía @capacitor/status-bar.
// Import ESTÁTICO; no-op en web. Estilo oscuro (texto claro) con fondo igual al
// header de la app para que no haya un corte de color al tope de la pantalla.

import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';

const BG = '#0b0e1a'; // var(--zt-bg) — mismo tono que el fondo/superficie superior.

/** Configura la status bar al arrancar la app. Seguro en web (no-op). */
export async function setupStatusBar(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  try {
    // Contenido NO superpuesto: la WebView arranca debajo de la status bar.
    await StatusBar.setOverlaysWebView({ overlay: false });
    // Texto/íconos claros sobre fondo oscuro.
    await StatusBar.setStyle({ style: Style.Dark });
    // Color de fondo de la barra (solo Android).
    if (Capacitor.getPlatform() === 'android') {
      await StatusBar.setBackgroundColor({ color: BG });
    }
  } catch {
    /* plugin no disponible: no-op */
  }
}
