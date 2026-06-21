import { useEffect, useState } from 'react';
import {
  IonButton,
  IonContent,
  IonIcon,
  IonItem,
  IonLabel,
  IonPage,
  IonSpinner,
  IonToggle,
  useIonToast,
} from '@ionic/react';
import {
  fingerPrintOutline,
  lockClosedOutline,
  lockOpenOutline,
} from 'ionicons/icons';
import ZenttoHeader from '../components/ZenttoHeader';
import PinPad from '../components/PinPad';
import { useLock } from '../auth/LockContext';
import { isBiometricAvailable, verifyBiometric } from '../lib/biometric';
import { notifySuccess, notifyError, notifyWarning } from '../lib/haptics';
import {
  clearPin,
  isValidPinFormat,
  setBiometricEnabled,
  setPin,
} from '../lib/pinLock';

type Step = 'idle' | 'create' | 'confirm';

/**
 * Configuración del candado de la app: crear/cambiar/desactivar PIN y togglear huella.
 * (Distinto del 2FA del backend, que protege retiros — eso está en /security.)
 */
export default function AppSecurityPage() {
  const [present] = useIonToast();
  const { pinEnabled, biometricEnabled, refreshLock } = useLock();

  const [bioAvailable, setBioAvailable] = useState(false);
  const [checking, setChecking] = useState(true);

  const [step, setStep] = useState<Step>('idle');
  const [first, setFirst] = useState('');
  const [pin, setPinValue] = useState('');

  useEffect(() => {
    (async () => {
      setBioAvailable(await isBiometricAvailable());
      setChecking(false);
    })();
  }, []);

  function startCreate() {
    setFirst('');
    setPinValue('');
    setStep('create');
  }

  function onCreateChange(next: string) {
    // Esperamos a que el usuario decida cuántos dígitos (4-6) y confirme con "Continuar".
    setPinValue(next);
  }

  function continueToConfirm() {
    if (!isValidPinFormat(pin)) {
      present({ message: 'El PIN debe tener 4 a 6 dígitos', duration: 1800, color: 'warning' });
      return;
    }
    setFirst(pin);
    setPinValue('');
    setStep('confirm');
  }

  async function onConfirmChange(next: string) {
    setPinValue(next);
    if (next.length === first.length) {
      if (next === first) {
        await setPin(next);
        await refreshLock();
        notifySuccess();
        present({ message: 'PIN configurado', duration: 1600, color: 'success' });
        setStep('idle');
        setPinValue('');
        setFirst('');
      } else {
        notifyError();
        present({ message: 'Los PIN no coinciden', duration: 1800, color: 'danger' });
        setPinValue('');
      }
    }
  }

  async function disablePin() {
    await clearPin();
    await refreshLock();
    notifySuccess();
    present({ message: 'PIN desactivado', duration: 1600, color: 'success' });
  }

  async function toggleBiometric(on: boolean) {
    if (on) {
      if (!pinEnabled) {
        notifyWarning();
        present({ message: 'Primero crea un PIN', duration: 1800, color: 'warning' });
        return;
      }
      const ok = await verifyBiometric('Confirma tu huella para activarla');
      if (!ok) {
        notifyError();
        present({ message: 'No se pudo verificar la huella', duration: 1800, color: 'danger' });
        return;
      }
    }
    await setBiometricEnabled(on);
    await refreshLock();
    notifySuccess();
    present({ message: on ? 'Huella activada' : 'Huella desactivada', duration: 1400, color: 'success' });
  }

  return (
    <IonPage>
      <ZenttoHeader title="Bloqueo de la app" showProfile={false} />
      <IonContent className="zt-page" fullscreen>
        <div className="zt-screen">
          {checking ? (
            <div style={{ textAlign: 'center', padding: 28 }}>
              <IonSpinner name="crescent" />
            </div>
          ) : step === 'idle' ? (
            <>
              <div className="zt-card" style={{ marginTop: 8 }}>
                <div className="zt-row" style={{ borderBottom: 'none' }}>
                  <span className="zt-token">
                    <IonIcon
                      icon={pinEnabled ? lockClosedOutline : lockOpenOutline}
                      style={{ color: pinEnabled ? 'var(--zt-success)' : 'var(--zt-text-dim)' }}
                    />
                    <span>PIN de acceso</span>
                  </span>
                  <span style={{ color: pinEnabled ? 'var(--zt-success)' : 'var(--zt-text-dim)' }}>
                    {pinEnabled ? 'Activo' : 'Inactivo'}
                  </span>
                </div>
                <p className="zt-muted" style={{ margin: '6px 0 0' }}>
                  Protege la app con un PIN de 4 a 6 dígitos. Se pedirá al abrir o reanudar la app.
                  El PIN se guarda cifrado solo en este dispositivo.
                </p>
              </div>

              <IonButton expand="block" style={{ marginTop: 12 }} onClick={startCreate}>
                <IonIcon slot="start" icon={lockClosedOutline} />
                {pinEnabled ? 'Cambiar PIN' : 'Crear PIN'}
              </IonButton>

              {pinEnabled && (
                <IonButton expand="block" fill="outline" color="danger" style={{ marginTop: 10 }} onClick={disablePin}>
                  <IonIcon slot="start" icon={lockOpenOutline} />
                  Desactivar PIN
                </IonButton>
              )}

              <div className="zt-card">
                <IonItem lines="none" style={{ '--background': 'transparent' } as React.CSSProperties}>
                  <IonIcon slot="start" icon={fingerPrintOutline} style={{ color: 'var(--zt-cyan)' }} />
                  <IonLabel>
                    <strong>Desbloqueo con huella</strong>
                    <p className="zt-muted" style={{ margin: '2px 0 0' }}>
                      {bioAvailable
                        ? 'Usa tu huella para desbloquear (con PIN de respaldo).'
                        : 'No disponible en este dispositivo.'}
                    </p>
                  </IonLabel>
                  <IonToggle
                    slot="end"
                    checked={biometricEnabled}
                    disabled={!bioAvailable || !pinEnabled}
                    onIonChange={(e) => void toggleBiometric(e.detail.checked)}
                  />
                </IonItem>
              </div>
            </>
          ) : step === 'create' ? (
            <>
              <div className="zt-brand" style={{ margin: '24px 0 12px' }}>
                <h1 style={{ fontSize: 20 }}>Crea tu PIN</h1>
                <p>Elige 4 a 6 dígitos</p>
              </div>
              <PinPad value={pin} onChange={onCreateChange} />
              <IonButton
                expand="block"
                style={{ marginTop: 12 }}
                disabled={!isValidPinFormat(pin)}
                onClick={continueToConfirm}
              >
                Continuar
              </IonButton>
              <IonButton expand="block" fill="clear" color="medium" onClick={() => setStep('idle')}>
                Cancelar
              </IonButton>
            </>
          ) : (
            <>
              <div className="zt-brand" style={{ margin: '24px 0 12px' }}>
                <h1 style={{ fontSize: 20 }}>Confirma tu PIN</h1>
                <p>Ingrésalo de nuevo</p>
              </div>
              <PinPad value={pin} max={first.length} dots={first.length} onChange={onConfirmChange} />
              <IonButton expand="block" fill="clear" color="medium" onClick={() => setStep('create')}>
                Volver
              </IonButton>
            </>
          )}
        </div>
      </IonContent>
    </IonPage>
  );
}
