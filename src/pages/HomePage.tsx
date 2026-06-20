import { useState } from 'react';
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
} from '@ionic/react';
import { useHistory } from 'react-router-dom';
import {
  paperPlaneOutline,
  qrCodeOutline,
  walletOutline,
  closeCircleOutline,
  refreshOutline,
} from 'ionicons/icons';
import ZenttoHeader from '../components/ZenttoHeader';
import { useLinkedAddress } from '../hooks/useWallet';
import { useEvmAddress, useEvmInfo, isEvmUnavailable, isValidAddress } from '../hooks/useEvm';
import { pickEth, pickUsdc } from '../api/evm';
import { useAuth } from '../auth/AuthContext';

function shorten(addr: string): string {
  return addr.length > 12 ? `${addr.slice(0, 6)}…${addr.slice(-4)}` : addr;
}

export default function HomePage() {
  const history = useHistory();
  const { user } = useAuth();
  const { address, link, unlink } = useLinkedAddress();
  const [draft, setDraft] = useState('');
  const [draftError, setDraftError] = useState<string | null>(null);

  const info = useEvmInfo();
  const bal = useEvmAddress(address);

  const eth = pickEth(bal.data);
  const usdc = pickUsdc(bal.data);
  const evmDown = info.isError && isEvmUnavailable(info.error);

  function handleLink() {
    if (!isValidAddress(draft)) {
      setDraftError('Address EVM inválida (formato 0x + 40 hex).');
      return;
    }
    setDraftError(null);
    link(draft.trim());
    setDraft('');
  }

  return (
    <IonPage>
      <ZenttoHeader title="Inicio" />
      <IonContent className="zt-page" fullscreen>
        <IonRefresher
          slot="fixed"
          onIonRefresh={async (e) => {
            await Promise.all([info.refetch(), bal.refetch()]);
            e.detail.complete();
          }}
        >
          <IonRefresherContent />
        </IonRefresher>

        <div className="zt-screen">
          {/* Tarjeta de saldo */}
          <div className="zt-balance-card">
            <span className="zt-chip-net">
              <span className={`zt-dot${evmDown ? ' off' : ''}`} />
              {evmDown
                ? 'Red no disponible'
                : info.data
                  ? `${info.data.network ?? 'Sepolia'}${
                      info.data.blockNumber ? ` · bloque ${info.data.blockNumber}` : ''
                    }`
                  : 'Conectando a la red…'}
            </span>
            <div className="zt-balance-label">Saldo disponible</div>
            <div className="zt-balance-amount">
              {address && bal.isLoading ? (
                <IonSpinner name="dots" />
              ) : usdc != null ? (
                `$${formatAmount(usdc)}`
              ) : (
                '$0.00'
              )}
            </div>
            <div className="zt-balance-sub">
              {address
                ? `${user?.displayName || user?.email || 'Mi cuenta'} · ${shorten(address)}`
                : user?.displayName || user?.email || 'Mi cuenta'}
            </div>

            <div className="zt-actions">
              <IonButton color="light" onClick={() => history.push('/send')}>
                <IonIcon slot="start" icon={paperPlaneOutline} />
                Enviar
              </IonButton>
              <IonButton color="secondary" onClick={() => history.push('/receive')}>
                <IonIcon slot="start" icon={qrCodeOutline} />
                Recibir
              </IonButton>
            </div>
          </div>

          {/* Vincular address para ver saldo real de testnet */}
          {!address ? (
            <div className="zt-card">
              <h3>Conecta tu wallet de prueba</h3>
              <p className="zt-muted">
                Pega una address EVM (Sepolia testnet) para ver su saldo real de ETH y USDC. La
                address es pública: no es una llave privada y no se guarda de forma permanente.
              </p>
              <IonItem
                lines="none"
                style={{ '--background': 'var(--zt-card-2)', borderRadius: 12, marginTop: 10 }}
              >
                <IonInput
                  value={draft}
                  onIonInput={(e) => setDraft(e.detail.value ?? '')}
                  placeholder="0x…"
                  className="zt-mono"
                />
              </IonItem>
              {draftError && (
                <p className="zt-muted" style={{ color: 'var(--zt-danger)' }}>
                  {draftError}
                </p>
              )}
              <IonButton expand="block" style={{ marginTop: 12 }} onClick={handleLink}>
                <IonIcon slot="start" icon={walletOutline} />
                Vincular address
              </IonButton>
            </div>
          ) : (
            <div className="zt-card">
              <div className="zt-row">
                <h3 style={{ margin: 0 }}>Activos</h3>
                <IonButton fill="clear" size="small" onClick={() => bal.refetch()}>
                  <IonIcon slot="icon-only" icon={refreshOutline} />
                </IonButton>
              </div>

              {bal.isError ? (
                <p className="zt-muted" style={{ color: 'var(--zt-warning)' }}>
                  {isEvmUnavailable(bal.error)
                    ? 'El endpoint /evm/address aún no está disponible en el backend. Se mostrará el saldo cuando esté activo.'
                    : 'No se pudo leer el saldo on-chain.'}
                </p>
              ) : (
                <>
                  <div className="zt-row">
                    <div className="zt-token">
                      <div className="zt-token-badge">$</div>
                      <div>
                        <div>USDC</div>
                        <div className="zt-muted">USD Coin</div>
                      </div>
                    </div>
                    <strong>{bal.isLoading ? '…' : formatAmount(usdc)}</strong>
                  </div>
                  <div className="zt-row">
                    <div className="zt-token">
                      <div className="zt-token-badge">Ξ</div>
                      <div>
                        <div>ETH</div>
                        <div className="zt-muted">Sepolia testnet</div>
                      </div>
                    </div>
                    <strong>{bal.isLoading ? '…' : formatAmount(eth, 6)}</strong>
                  </div>
                </>
              )}

              <IonButton
                fill="clear"
                color="medium"
                size="small"
                style={{ marginTop: 6 }}
                onClick={unlink}
              >
                <IonIcon slot="start" icon={closeCircleOutline} />
                Desvincular
              </IonButton>
            </div>
          )}
        </div>
      </IonContent>
    </IonPage>
  );
}

function formatAmount(v: string | null | undefined, maxFrac = 2): string {
  if (v == null || v === '') return '0.00';
  const n = Number(v);
  if (Number.isNaN(n)) return v;
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: maxFrac });
}
