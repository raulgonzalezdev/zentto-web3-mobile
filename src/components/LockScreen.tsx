import { useCallback, useEffect, useState } from 'react';
import { IonButton, IonContent, IonPage } from '@ionic/react';
import PinPad from './PinPad';
import { useLock } from '../auth/LockContext';
import { isBiometricAvailable, verifyBiometric } from '../lib/biometric';
import { verifyPin } from '../lib/pinLock';

/**
 * Pantalla de bloqueo: exige PIN (con opción de huella si el usuario la activó).
 * Se muestra como overlay a pantalla completa cuando la app está bloqueada.
 */
export default function LockScreen() {
  const { biometricEnabled, unlock } = useLock();
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const [bioReady, setBioReady] = useState(false);

  // ¿El hardware soporta huella y el usuario la activó?
  useEffect(() => {
    (async () => {
      if (!biometricEnabled) return;
      setBioReady(await isBiometricAvailable());
    })();
  }, [biometricEnabled]);

  const tryBiometric = useCallback(async () => {
    const ok = await verifyBiometric('Desbloquea Zentto con tu huella');
    if (ok) unlock();
  }, [unlock]);

  // Auto-lanzar el prompt de huella al abrir, si está disponible.
  useEffect(() => {
    if (bioReady) void tryBiometric();
  }, [bioReady, tryBiometric]);

  // Verificar el PIN cuando alcanza ≥4 dígitos al completar.
  async function onChange(next: string) {
    setError(false);
    setPin(next);
    if (next.length >= 4) {
      const ok = await verifyPin(next);
      if (ok) {
        unlock();
      } else if (next.length >= 6) {
        // longitud máxima sin acierto → limpiar y marcar error
        setError(true);
        setPin('');
      }
    }
  }

  return (
    <IonPage>
      <IonContent className="zt-page" fullscreen>
        <div className="zt-lock">
          <div className="zt-brand" style={{ marginTop: 40 }}>
            <div className="zt-logo">Z</div>
            <h1>Zentto</h1>
            <p>Ingresa tu PIN para continuar</p>
          </div>

          {error && (
            <p className="zt-muted" style={{ color: 'var(--zt-danger)', textAlign: 'center' }}>
              PIN incorrecto. Intenta de nuevo.
            </p>
          )}

          <PinPad
            value={pin}
            onChange={onChange}
            showBiometric={bioReady}
            onBiometric={tryBiometric}
          />

          {bioReady && (
            <IonButton fill="clear" expand="block" onClick={tryBiometric} style={{ marginTop: 8 }}>
              Desbloquear con huella
            </IonButton>
          )}
        </div>
      </IonContent>
    </IonPage>
  );
}
