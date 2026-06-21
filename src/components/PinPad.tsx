import { IonIcon } from '@ionic/react';
import { backspaceOutline, fingerPrintOutline } from 'ionicons/icons';
import { tapLight } from '../lib/haptics';

/**
 * Teclado numérico para PIN. `length` muestra los puntos llenos según `value`.
 * Opcional botón de biometría a la izquierda del 0.
 */
export default function PinPad({
  value,
  max = 6,
  dots = 6,
  onChange,
  onBiometric,
  showBiometric = false,
}: {
  value: string;
  max?: number;
  dots?: number;
  onChange: (next: string) => void;
  onBiometric?: () => void;
  showBiometric?: boolean;
}) {
  function press(d: string) {
    if (value.length >= max) return;
    tapLight();
    onChange(value + d);
  }
  function back() {
    tapLight();
    onChange(value.slice(0, -1));
  }

  return (
    <div className="zt-pin">
      <div className="zt-pin-dots">
        {Array.from({ length: dots }).map((_, i) => (
          <span key={i} className={`zt-pin-dot${i < value.length ? ' on' : ''}`} />
        ))}
      </div>
      <div className="zt-pin-grid">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((d) => (
          <button key={d} type="button" className="zt-pin-key" onClick={() => press(d)}>
            {d}
          </button>
        ))}
        {showBiometric && onBiometric ? (
          <button type="button" className="zt-pin-key zt-pin-key-aux" onClick={onBiometric} aria-label="Usar huella">
            <IonIcon icon={fingerPrintOutline} />
          </button>
        ) : (
          <span className="zt-pin-key zt-pin-key-empty" />
        )}
        <button type="button" className="zt-pin-key" onClick={() => press('0')}>
          0
        </button>
        <button type="button" className="zt-pin-key zt-pin-key-aux" onClick={back} aria-label="Borrar">
          <IonIcon icon={backspaceOutline} />
        </button>
      </div>
    </div>
  );
}
