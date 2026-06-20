import {
  IonButton,
  IonContent,
  IonIcon,
  IonPage,
} from '@ionic/react';
import {
  logOutOutline,
  mailOutline,
  personCircleOutline,
  shieldCheckmarkOutline,
  shieldOutline,
  fingerPrintOutline,
  chevronForwardOutline,
} from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import ZenttoHeader from '../components/ZenttoHeader';
import { useAuth } from '../auth/AuthContext';
import { useKycStatus } from '../hooks/useKyc';
import type { KycStatus } from '../api/types';

const KYC_LABEL: Record<string, { label: string; color: string }> = {
  not_started: { label: 'Sin verificar', color: 'var(--zt-text-dim)' },
  pending: { label: 'En progreso', color: 'var(--zt-warning)' },
  in_review: { label: 'En revisión', color: 'var(--zt-warning)' },
  approved: { label: 'Verificada', color: 'var(--zt-success)' },
  rejected: { label: 'Rechazada', color: 'var(--zt-danger)' },
};

function kycLabel(status: KycStatus) {
  return KYC_LABEL[status] ?? KYC_LABEL.not_started;
}

export default function ProfilePage() {
  const history = useHistory();
  const { user, signOut } = useAuth();
  const kyc = useKycStatus();

  const kStatus = kyc.data?.status ?? 'not_started';
  const k = kycLabel(kStatus);
  const kycPending = kStatus !== 'approved';

  return (
    <IonPage>
      <ZenttoHeader title="Perfil" showProfile={false} />
      <IonContent className="zt-page" fullscreen>
        <div className="zt-screen">
          <div style={{ textAlign: 'center', marginTop: 20 }}>
            <IonIcon
              icon={personCircleOutline}
              style={{ fontSize: 88, color: 'var(--zt-indigo)' }}
            />
            <h2 style={{ margin: '8px 0 2px' }}>{user?.displayName || 'Mi cuenta'}</h2>
            <p className="zt-muted">{user?.email}</p>
          </div>

          {/* Banner KYC si no está aprobado */}
          {kycPending && (
            <div className="zt-banner">
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <IonIcon icon={fingerPrintOutline} />
                Verifica tu identidad para operar sin límites.
              </span>
              <IonButton
                fill="clear"
                size="small"
                style={{ marginTop: 6 }}
                onClick={() => history.push('/kyc')}
              >
                Verificar ahora
              </IonButton>
            </div>
          )}

          <div className="zt-card">
            <div className="zt-row">
              <span className="zt-token">
                <IonIcon icon={mailOutline} />
                <span>Correo</span>
              </span>
              <span className="zt-muted">{user?.email}</span>
            </div>

            {/* Verificar identidad (KYC) */}
            <button
              type="button"
              className="zt-row"
              onClick={() => history.push('/kyc')}
              style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
            >
              <span className="zt-token">
                <IonIcon icon={fingerPrintOutline} style={{ color: 'var(--zt-indigo)' }} />
                <span>Verificar identidad</span>
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: k.color }}>
                {k.label}
                <IonIcon icon={chevronForwardOutline} style={{ color: 'var(--zt-text-dim)' }} />
              </span>
            </button>

            {/* Seguridad / 2FA */}
            <button
              type="button"
              className="zt-row"
              onClick={() => history.push('/security')}
              style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
            >
              <span className="zt-token">
                <IonIcon
                  icon={user?.totpEnabled ? shieldCheckmarkOutline : shieldOutline}
                  style={{ color: user?.totpEnabled ? 'var(--zt-success)' : 'var(--zt-text-dim)' }}
                />
                <span>Seguridad · 2FA</span>
              </span>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  color: user?.totpEnabled ? 'var(--zt-success)' : 'var(--zt-text-dim)',
                }}
              >
                {user?.totpEnabled ? 'Activa' : 'Inactiva'}
                <IonIcon icon={chevronForwardOutline} style={{ color: 'var(--zt-text-dim)' }} />
              </span>
            </button>
          </div>

          <IonButton
            expand="block"
            color="danger"
            fill="outline"
            style={{ marginTop: 18 }}
            onClick={signOut}
          >
            <IonIcon slot="start" icon={logOutOutline} />
            Cerrar sesión
          </IonButton>
        </div>
      </IonContent>
    </IonPage>
  );
}
