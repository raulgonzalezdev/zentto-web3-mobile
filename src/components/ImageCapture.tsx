import { useRef } from 'react';
import { IonButton, IonIcon } from '@ionic/react';
import { cameraOutline, imageOutline, closeCircle } from 'ionicons/icons';
import {
  fileToCaptured,
  revokePreview,
  tryNativeCamera,
  type CapturedImage,
} from '../lib/capture';

interface Props {
  label: string;
  hint?: string;
  required?: boolean;
  value: CapturedImage | null;
  onChange: (img: CapturedImage | null) => void;
}

/**
 * Captura una imagen para KYC. Usa la cámara nativa de Capacitor si está
 * disponible (Camera.getPhoto); si no, cae al <input type="file" capture> web.
 */
export default function ImageCapture({ label, hint, required, value, onChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      revokePreview(value);
      onChange(fileToCaptured(file));
    }
    // Permite re-seleccionar el mismo archivo.
    e.target.value = '';
  }

  async function takePhoto() {
    const native = await tryNativeCamera('camera');
    if (native) {
      revokePreview(value);
      onChange(native);
      return;
    }
    // Fallback web: abre cámara/galería con el input file.
    inputRef.current?.click();
  }

  function clear() {
    revokePreview(value);
    onChange(null);
  }

  return (
    <div className="zt-card" style={{ marginTop: 12 }}>
      <div className="zt-row" style={{ borderBottom: 'none', padding: '0 0 8px' }}>
        <h3 style={{ margin: 0 }}>
          {label}
          {required ? <span style={{ color: 'var(--zt-danger)' }}> *</span> : null}
        </h3>
        {value && (
          <button
            type="button"
            onClick={clear}
            aria-label="Quitar imagen"
            style={{ background: 'none', border: 'none', color: 'var(--zt-text-dim)' }}
          >
            <IonIcon icon={closeCircle} style={{ fontSize: 22 }} />
          </button>
        )}
      </div>

      {hint && (
        <p className="zt-muted" style={{ margin: '0 0 10px' }}>
          {hint}
        </p>
      )}

      {value ? (
        <img
          src={value.previewUrl}
          alt={label}
          style={{
            width: '100%',
            maxHeight: 220,
            objectFit: 'cover',
            borderRadius: 12,
            border: '1px solid var(--zt-border)',
          }}
        />
      ) : (
        <div
          style={{
            display: 'grid',
            placeItems: 'center',
            height: 120,
            borderRadius: 12,
            border: '1px dashed var(--zt-border)',
            color: 'var(--zt-text-dim)',
          }}
        >
          <IonIcon icon={imageOutline} style={{ fontSize: 36 }} />
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 12 }}>
        <IonButton fill="outline" size="small" onClick={takePhoto}>
          <IonIcon slot="start" icon={cameraOutline} />
          Cámara
        </IonButton>
        <IonButton fill="clear" size="small" onClick={() => inputRef.current?.click()}>
          <IonIcon slot="start" icon={imageOutline} />
          Archivo
        </IonButton>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={onFile}
        style={{ display: 'none' }}
      />
    </div>
  );
}
