import {
  IonButton,
  IonContent,
  IonIcon,
  IonPage,
  useIonToast,
} from '@ionic/react';
import {
  copyOutline,
  qrCodeOutline,
  openOutline,
  downloadOutline,
  shareSocialOutline,
} from 'ionicons/icons';
import ZenttoHeader from '../components/ZenttoHeader';
import QrCode from '../components/QrCode';
import { CardSkeleton, ListSkeleton } from '../components/Skeletons';
import { useDepositInfo, useDeposits } from '../hooks/usePayments';
import { useAuth } from '../auth/AuthContext';
import { formatAmount } from '../lib/format';
import { shareOrCopy } from '../lib/share';
import { tapLight, notifySuccess } from '../lib/haptics';
import type { ChainDeposit } from '../api/types';

function shortHash(h?: string): string {
  if (!h) return '';
  return h.length > 14 ? `${h.slice(0, 8)}…${h.slice(-6)}` : h;
}

export default function ReceivePage() {
  const { user } = useAuth();
  const [present] = useIonToast();
  const depositInfo = useDepositInfo();
  const deposits = useDeposits();

  async function copyText(text: string, label: string) {
    tapLight();
    try {
      await navigator.clipboard.writeText(text);
      notifySuccess();
      present({ message: `${label} copiado`, duration: 1400, color: 'success' });
    } catch {
      present({ message: 'No se pudo copiar', duration: 1400, color: 'danger' });
    }
  }

  async function share(text: string, title: string) {
    tapLight();
    const r = await shareOrCopy({ title, text, dialogTitle: title });
    if (r === 'copied') {
      notifySuccess();
      present({ message: 'Copiado al portapapeles', duration: 1400, color: 'success' });
    } else if (r === 'failed') {
      present({ message: 'No se pudo compartir', duration: 1400, color: 'danger' });
    }
  }

  const info = depositInfo.data;
  const items: ChainDeposit[] = deposits.data ?? [];

  return (
    <IonPage>
      <ZenttoHeader title="Recibir" />
      <IonContent className="zt-page" fullscreen>
        <div className="zt-screen">
          <div
            className="zt-banner"
            style={{
              background: 'rgba(99,102,241,0.12)',
              borderColor: 'rgba(99,102,241,0.35)',
              color: '#c7d2fe',
            }}
          >
            Envía USDC de testnet (Sepolia) a esta dirección. El indexer detecta el depósito
            on-chain y acredita tu saldo automáticamente.
          </div>

          {/* Transferencia interna por email (instantánea) */}
          {user?.email && (
            <div className="zt-card">
              <h3>Recibir de otro usuario Zentto</h3>
              <p className="zt-muted" style={{ margin: '2px 0 8px' }}>
                Comparte tu email: la transferencia llega al instante.
              </p>
              <p className="zt-mono">{user.email}</p>
              <div style={{ display: 'flex', gap: 8 }}>
                <IonButton
                  expand="block"
                  fill="outline"
                  style={{ flex: 1 }}
                  onClick={() => copyText(user.email, 'Email')}
                >
                  <IonIcon slot="start" icon={copyOutline} />
                  Copiar
                </IonButton>
                <IonButton
                  expand="block"
                  fill="outline"
                  style={{ flex: 1 }}
                  onClick={() => share(user.email, 'Mi correo Zentto')}
                >
                  <IonIcon slot="start" icon={shareSocialOutline} />
                  Compartir
                </IonButton>
              </div>
            </div>
          )}

          {/* Dirección de depósito on-chain real */}
          {depositInfo.isLoading ? (
            <CardSkeleton lines={3} />
          ) : depositInfo.isError || !info ? (
            <div className="zt-empty">
              <IonIcon icon={qrCodeOutline} />
              <p>No se pudo obtener tu dirección de depósito. Inténtalo más tarde.</p>
              <IonButton onClick={() => depositInfo.refetch()}>Reintentar</IonButton>
            </div>
          ) : (
            <>
              <p className="zt-muted" style={{ textAlign: 'center', marginTop: 18 }}>
                Tu dirección de depósito en {info.chainName}
              </p>
              <div className="zt-qr-wrap">
                <QrCode value={info.address} size={220} />
              </div>
              <div className="zt-card">
                <h3>Dirección de depósito ({info.asset} · USDC)</h3>
                <p className="zt-mono">{info.address}</p>
                <div style={{ display: 'flex', gap: 8 }}>
                  <IonButton
                    expand="block"
                    fill="outline"
                    style={{ flex: 1 }}
                    onClick={() => copyText(info.address, 'Dirección')}
                  >
                    <IonIcon slot="start" icon={copyOutline} />
                    Copiar
                  </IonButton>
                  <IonButton
                    expand="block"
                    fill="outline"
                    style={{ flex: 1 }}
                    onClick={() =>
                      share(info.address, `Mi dirección de depósito (${info.asset} · ${info.chainName})`)
                    }
                  >
                    <IonIcon slot="start" icon={shareSocialOutline} />
                    Compartir
                  </IonButton>
                </div>
                <IonButton
                  expand="block"
                  fill="clear"
                  href={info.explorerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <IonIcon slot="start" icon={openOutline} />
                  Ver en el explorador
                </IonButton>
              </div>
            </>
          )}

          {/* Historial de depósitos on-chain detectados */}
          <div className="zt-card">
            <div className="zt-row" style={{ borderBottom: 'none', paddingBottom: 4 }}>
              <h3 style={{ margin: 0 }}>Depósitos detectados</h3>
              <span className="zt-muted">on-chain</span>
            </div>

            {deposits.isLoading && !deposits.data ? (
              <div style={{ padding: '4px 0' }}>
                <ListSkeleton rows={2} />
              </div>
            ) : items.length === 0 ? (
              <div className="zt-empty" style={{ padding: '24px 8px' }}>
                <IonIcon icon={downloadOutline} />
                <p>Aún no hay depósitos. Envía USDC de testnet a tu dirección.</p>
              </div>
            ) : (
              items.map((d) => (
                <div className="zt-row" key={`${d.txHash}-${d.id}`}>
                  <div className="zt-token">
                    <div className="zt-token-badge">$</div>
                    <div>
                      <div>
                        {formatAmount(d.amount)} {d.asset}
                      </div>
                      <div className="zt-muted">{shortHash(d.txHash)}</div>
                    </div>
                  </div>
                  <span
                    className="zt-status-chip"
                    style={{ color: d.paymentId ? 'var(--zt-success)' : 'var(--zt-warning)' }}
                  >
                    {d.paymentId ? 'Acreditado' : 'Detectado'}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
}
