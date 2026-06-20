import { useState } from 'react';
import {
  IonButton,
  IonContent,
  IonIcon,
  IonInput,
  IonItem,
  IonPage,
  IonSpinner,
} from '@ionic/react';
import {
  searchOutline,
  checkmarkCircle,
  closeCircle,
  timeOutline,
  swapHorizontalOutline,
} from 'ionicons/icons';
import ZenttoHeader from '../components/ZenttoHeader';
import { useEvmTx, isEvmUnavailable, isValidTxHash } from '../hooks/useEvm';

export default function MovementsPage() {
  const [hash, setHash] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [draftError, setDraftError] = useState<string | null>(null);

  const tx = useEvmTx(hash);

  function search() {
    if (!isValidTxHash(draft)) {
      setDraftError('Hash inválido (0x + 64 hex).');
      return;
    }
    setDraftError(null);
    setHash(draft.trim());
  }

  const status = (tx.data?.status ?? '').toLowerCase();
  const statusIcon =
    status === 'success'
      ? checkmarkCircle
      : status === 'failed'
        ? closeCircle
        : timeOutline;
  const statusColor =
    status === 'success' ? 'var(--zt-success)' : status === 'failed' ? 'var(--zt-danger)' : 'var(--zt-warning)';

  return (
    <IonPage>
      <ZenttoHeader title="Movimientos" />
      <IonContent className="zt-page" fullscreen>
        <div className="zt-screen">
          <p className="zt-muted">
            Consulta el estado on-chain de una transacción por su hash (Sepolia testnet).
          </p>

          <IonItem className="zt-card" lines="none">
            <IonInput
              label="Hash de transacción"
              labelPlacement="stacked"
              value={draft}
              onIonInput={(e) => setDraft(e.detail.value ?? '')}
              placeholder="0x…"
              className="zt-mono"
            />
          </IonItem>
          {draftError && (
            <p className="zt-muted" style={{ color: 'var(--zt-danger)', margin: '6px 4px' }}>
              {draftError}
            </p>
          )}

          <IonButton expand="block" style={{ marginTop: 12 }} onClick={search} disabled={!draft}>
            <IonIcon slot="start" icon={searchOutline} />
            Consultar
          </IonButton>

          {hash && (
            <div className="zt-card">
              {tx.isLoading ? (
                <div style={{ textAlign: 'center', padding: 20 }}>
                  <IonSpinner name="crescent" />
                </div>
              ) : tx.isError ? (
                <p className="zt-muted" style={{ color: 'var(--zt-warning)' }}>
                  {isEvmUnavailable(tx.error)
                    ? 'El endpoint /evm/tx aún no está disponible en el backend.'
                    : 'No se pudo consultar la transacción.'}
                </p>
              ) : tx.data ? (
                <>
                  <div className="zt-row">
                    <span className="zt-muted">Estado</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: statusColor }}>
                      <IonIcon icon={statusIcon} />
                      <strong>{tx.data.status ?? 'pendiente'}</strong>
                    </span>
                  </div>
                  {tx.data.blockNumber != null && (
                    <div className="zt-row">
                      <span className="zt-muted">Bloque</span>
                      <span>{tx.data.blockNumber}</span>
                    </div>
                  )}
                  {tx.data.from && (
                    <div className="zt-row">
                      <span className="zt-muted">De</span>
                      <span className="zt-mono">{tx.data.from}</span>
                    </div>
                  )}
                  {tx.data.to && (
                    <div className="zt-row">
                      <span className="zt-muted">Para</span>
                      <span className="zt-mono">{tx.data.to}</span>
                    </div>
                  )}
                  {tx.data.value != null && (
                    <div className="zt-row">
                      <span className="zt-muted">Valor</span>
                      <span>{String(tx.data.value)}</span>
                    </div>
                  )}
                </>
              ) : null}
            </div>
          )}

          {!hash && (
            <div className="zt-empty">
              <IonIcon icon={swapHorizontalOutline} />
              <p>Pega un hash para ver el detalle de la transacción.</p>
            </div>
          )}
        </div>
      </IonContent>
    </IonPage>
  );
}
