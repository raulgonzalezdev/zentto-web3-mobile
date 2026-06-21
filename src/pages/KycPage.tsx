import { useEffect, useRef, useState } from 'react';
import {
  IonButton,
  IonContent,
  IonIcon,
  IonInput,
  IonItem,
  IonPage,
  IonRefresher,
  IonRefresherContent,
  IonSpinner,
  useIonToast,
} from '@ionic/react';
import { Browser } from '@capacitor/browser';
import { App } from '@capacitor/app';
import {
  shieldCheckmarkOutline,
  checkmarkCircle,
  closeCircle,
  timeOutline,
  documentTextOutline,
  chevronDownOutline,
  refreshOutline,
} from 'ionicons/icons';
import ZenttoHeader from '../components/ZenttoHeader';
import ImageCapture from '../components/ImageCapture';
import {
  useKycStatus,
  useVerifyDocuments,
  useCreateKycSession,
  useRefreshKycStatus,
} from '../hooks/useKyc';
import { tapLight, notifySuccess, notifyError, notifyWarning } from '../lib/haptics';
import { ApiError } from '../api/client';
import type { CapturedImage } from '../lib/capture';
import type { KycStatus } from '../api/types';

const STATUS_META: Record<
  string,
  { label: string; color: string; icon: string; msg: string }
> = {
  not_started: {
    label: 'Sin iniciar',
    color: 'var(--zt-text-dim)',
    icon: documentTextOutline,
    msg: 'Aún no has verificado tu identidad. Inicia la verificación para empezar.',
  },
  pending: {
    label: 'Pendiente',
    color: 'var(--zt-warning)',
    icon: timeOutline,
    msg: 'Tu verificación está en proceso; desliza hacia abajo para actualizar.',
  },
  in_review: {
    label: 'En revisión',
    color: 'var(--zt-warning)',
    icon: timeOutline,
    msg: 'Tu verificación está en proceso; desliza hacia abajo para actualizar.',
  },
  approved: {
    label: 'Aprobada',
    color: 'var(--zt-success)',
    icon: checkmarkCircle,
    msg: 'Tu identidad está verificada. Ya puedes operar sin límites de KYC.',
  },
  rejected: {
    label: 'Rechazada',
    color: 'var(--zt-danger)',
    icon: closeCircle,
    msg: 'Tu verificación fue rechazada. Revisa el motivo y vuelve a intentarlo.',
  },
};

function meta(status: KycStatus) {
  return STATUS_META[status] ?? STATUS_META.not_started;
}

export default function KycPage() {
  const [present] = useIonToast();
  const statusQ = useKycStatus();
  const sessionMut = useCreateKycSession();
  const verifyMut = useVerifyDocuments();
  const refreshKyc = useRefreshKycStatus();

  const [fullName, setFullName] = useState('');
  const [showManual, setShowManual] = useState(false);

  const [front, setFront] = useState<CapturedImage | null>(null);
  const [back, setBack] = useState<CapturedImage | null>(null);
  const [selfie, setSelfie] = useState<CapturedImage | null>(null);

  // Mientras una sesión de Didit esté abierta, queremos re-consultar el estado
  // cuando el usuario vuelve a la app (cierre del browser o re-enfoque).
  const sessionOpen = useRef(false);

  const status = statusQ.data?.status ?? 'not_started';
  const m = meta(status);
  const isApproved = status === 'approved';
  const isRejected = status === 'rejected';
  const inProgress = status === 'pending' || status === 'in_review';
  const canSubmitManual = !!front && !verifyMut.isPending && !isApproved;

  // Re-consulta el estado al volver del browser hospedado de Didit. El webhook
  // de Didit ya habrá actualizado /kyc/status; aquí solo refrescamos la query.
  useEffect(() => {
    let browserH: { remove: () => void } | undefined;
    let resumeH: { remove: () => void } | undefined;

    const syncIfReturning = () => {
      if (!sessionOpen.current) return;
      sessionOpen.current = false;
      void refreshKyc();
    };

    void (async () => {
      browserH = await Browser.addListener('browserFinished', syncIfReturning);
      resumeH = await App.addListener('resume', syncIfReturning);
    })();

    return () => {
      browserH?.remove();
      resumeH?.remove();
    };
  }, [refreshKyc]);

  async function startSession() {
    tapLight();
    try {
      const session = await sessionMut.mutateAsync(fullName.trim() || undefined);
      if (!session.redirectUrl) {
        notifyError();
        present({ message: 'No se recibió la URL de verificación', duration: 2400, color: 'danger' });
        return;
      }
      sessionOpen.current = true;
      await Browser.open({ url: session.redirectUrl });
    } catch (err) {
      notifyError();
      const msg = err instanceof ApiError ? err.message : 'No se pudo iniciar la verificación';
      present({ message: msg, duration: 2600, color: 'danger' });
    }
  }

  async function submitManual() {
    if (!front) {
      notifyWarning();
      present({ message: 'El documento (frente) es obligatorio', duration: 1800, color: 'warning' });
      return;
    }
    tapLight();
    try {
      const res = await verifyMut.mutateAsync({
        front: front.blob,
        back: back?.blob ?? null,
        selfie: selfie?.blob ?? null,
        fullName: fullName.trim() || undefined,
      });
      const rm = meta(res.status);
      if (res.status === 'approved') notifySuccess();
      else if (res.status === 'rejected') notifyError();
      else notifyWarning();
      present({
        message: `Verificación: ${rm.label}`,
        duration: 2200,
        color:
          res.status === 'approved'
            ? 'success'
            : res.status === 'rejected'
              ? 'danger'
              : 'warning',
      });
    } catch (err) {
      notifyError();
      const msg = err instanceof ApiError ? err.message : 'No se pudo enviar la verificación';
      present({ message: msg, duration: 2600, color: 'danger' });
    }
  }

  const sessionPending = sessionMut.isPending;

  return (
    <IonPage>
      <ZenttoHeader title="Verificar identidad" />
      <IonContent className="zt-page" fullscreen>
        <IonRefresher
          slot="fixed"
          onIonRefresh={async (e) => {
            await statusQ.refetch();
            e.detail.complete();
          }}
        >
          <IonRefresherContent />
        </IonRefresher>
        <div className="zt-screen">
          {/* Estado actual */}
          <div className="zt-card" style={{ marginTop: 8 }}>
            <div className="zt-row" style={{ borderBottom: 'none' }}>
              <span className="zt-token">
                <IonIcon icon={shieldCheckmarkOutline} style={{ color: 'var(--zt-indigo)' }} />
                <span>Estado KYC</span>
              </span>
              {statusQ.isLoading ? (
                <IonSpinner name="dots" />
              ) : (
                <span className="zt-status-chip" style={{ color: m.color }}>
                  <IonIcon icon={m.icon} style={{ marginRight: 4 }} />
                  {m.label}
                </span>
              )}
            </div>
            <p className="zt-muted" style={{ margin: '6px 0 0' }}>
              {isApproved ? '✅ ' : ''}
              {m.msg}
            </p>
            {isRejected && statusQ.data?.decisionReason && (
              <p className="zt-muted" style={{ color: 'var(--zt-danger)', margin: '6px 0 0' }}>
                Motivo: {statusQ.data.decisionReason}
              </p>
            )}
            {statusQ.data?.amlMatch && (
              <p className="zt-muted" style={{ color: 'var(--zt-warning)', margin: '6px 0 0' }}>
                Coincidencia en screening AML: revisión manual requerida.
              </p>
            )}
          </div>

          {isApproved ? (
            <div
              className="zt-banner"
              style={{
                background: 'rgba(52,211,153,0.12)',
                borderColor: 'rgba(52,211,153,0.35)',
                color: '#a7f3d0',
              }}
            >
              ✅ Tu identidad ya está verificada. No necesitas hacer nada más.
            </div>
          ) : (
            <>
              {inProgress ? (
                <>
                  <div
                    className="zt-banner"
                    style={{
                      background: 'rgba(251,191,36,0.10)',
                      borderColor: 'rgba(251,191,36,0.30)',
                      color: 'var(--zt-warning)',
                    }}
                  >
                    Tu verificación está en proceso; desliza hacia abajo para actualizar.
                  </div>
                  <IonButton
                    expand="block"
                    fill="outline"
                    style={{ marginTop: 12 }}
                    onClick={() => statusQ.refetch()}
                  >
                    <IonIcon slot="start" icon={refreshOutline} />
                    Actualizar estado
                  </IonButton>
                </>
              ) : (
                <>
                  <p className="zt-muted" style={{ marginTop: 16 }}>
                    Verifica tu identidad en unos minutos. Te pediremos tu documento y una selfie con
                    detección de vida; todo se hace en una pantalla segura guiada.
                  </p>

                  <IonItem className="zt-card" lines="none" style={{ marginTop: 12 }}>
                    <IonInput
                      label="Nombre completo (opcional)"
                      labelPlacement="stacked"
                      value={fullName}
                      onIonInput={(e) => setFullName(e.detail.value ?? '')}
                      placeholder="Como aparece en tu documento"
                    />
                  </IonItem>

                  <IonButton
                    expand="block"
                    style={{ marginTop: 18 }}
                    disabled={sessionPending}
                    onClick={startSession}
                  >
                    <IonIcon slot="start" icon={shieldCheckmarkOutline} />
                    {sessionPending ? 'Abriendo…' : isRejected ? 'Reintentar verificación' : 'Verificar mi identidad'}
                  </IonButton>
                </>
              )}

              {/* Opción secundaria: captura manual */}
              <button
                type="button"
                className="zt-link-row"
                onClick={() => setShowManual((v) => !v)}
                style={{
                  marginTop: 18,
                  background: 'none',
                  border: 'none',
                  color: 'var(--zt-text-dim)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: 0,
                  cursor: 'pointer',
                  font: 'inherit',
                }}
              >
                <IonIcon
                  icon={chevronDownOutline}
                  style={{
                    transition: 'transform .2s',
                    transform: showManual ? 'rotate(180deg)' : 'none',
                  }}
                />
                ¿Problemas con la cámara de Didit? Subir documentos manualmente
              </button>

              {showManual && (
                <div style={{ marginTop: 12 }}>
                  <p className="zt-muted">
                    Captura tu documento de identidad. El dorso y la selfie son opcionales pero
                    mejoran la verificación (liveness + face match).
                  </p>

                  <ImageCapture
                    label="Documento (frente)"
                    required
                    hint="Foto nítida del frente de tu cédula/pasaporte."
                    value={front}
                    onChange={setFront}
                  />
                  <ImageCapture
                    label="Documento (dorso)"
                    hint="Opcional — reverso del documento."
                    value={back}
                    onChange={setBack}
                  />
                  <ImageCapture
                    label="Selfie"
                    hint="Opcional — habilita prueba de vida y comparación facial."
                    value={selfie}
                    onChange={setSelfie}
                  />

                  <IonButton
                    expand="block"
                    fill="outline"
                    style={{ marginTop: 14 }}
                    disabled={!canSubmitManual}
                    onClick={submitManual}
                  >
                    <IonIcon slot="start" icon={documentTextOutline} />
                    {verifyMut.isPending ? 'Verificando…' : 'Enviar documentos'}
                  </IonButton>
                </div>
              )}
            </>
          )}
        </div>
      </IonContent>
    </IonPage>
  );
}
