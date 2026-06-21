// Compartir nativo vía @capacitor/share, con fallback a Web Share API y, en su
// defecto, copiar al portapapeles. Import ESTÁTICO; seguro en web.

import { Capacitor } from '@capacitor/core';
import { Share } from '@capacitor/share';
import { copyText } from './clipboard';

export interface ShareInput {
  title?: string;
  text?: string;
  url?: string;
  /** Título del diálogo del sistema (Android). */
  dialogTitle?: string;
}

/**
 * Comparte texto/URL. Devuelve:
 *  - 'shared'  → se abrió la hoja de compartir nativa o Web Share.
 *  - 'copied'  → sin share disponible; se copió al portapapeles como respaldo.
 *  - 'failed'  → no se pudo hacer nada.
 * Nunca lanza.
 */
export async function shareOrCopy(input: ShareInput): Promise<'shared' | 'copied' | 'failed'> {
  const payload = input.text ?? input.url ?? '';

  // 1) Plugin nativo de Capacitor.
  if (Capacitor.isNativePlatform()) {
    try {
      const canShare = await Share.canShare();
      if (canShare.value) {
        await Share.share({
          title: input.title,
          text: input.text,
          url: input.url,
          dialogTitle: input.dialogTitle ?? input.title,
        });
        return 'shared';
      }
    } catch {
      /* usuario canceló o no disponible: cae al fallback */
    }
  }

  // 2) Web Share API (navegadores móviles).
  try {
    const navShare = (navigator as Navigator & { share?: (d: ShareData) => Promise<void> }).share;
    if (typeof navShare === 'function') {
      await navShare.call(navigator, { title: input.title, text: input.text, url: input.url });
      return 'shared';
    }
  } catch {
    /* cancelado o no soportado */
  }

  // 3) Respaldo: copiar al portapapeles.
  if (payload && (await copyText(payload))) return 'copied';
  return 'failed';
}
