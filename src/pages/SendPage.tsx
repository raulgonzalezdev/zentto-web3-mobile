import { useMemo, useState } from 'react';
import {
  IonButton,
  IonContent,
  IonIcon,
  IonInput,
  IonItem,
  IonPage,
  IonSegment,
  IonSegmentButton,
  IonLabel,
  IonSelect,
  IonSelectOption,
  IonSpinner,
  useIonToast,
} from '@ionic/react';
import { useHistory } from 'react-router-dom';
import {
  paperPlaneOutline,
  checkmarkCircle,
  walletOutline,
  exitOutline,
  shieldOutline,
} from 'ionicons/icons';
import ZenttoHeader from '../components/ZenttoHeader';
import { useAccountBalance, useTransfer, useWithdraw } from '../hooks/usePayments';
import { useAuth } from '../auth/AuthContext';
import { ApiError } from '../api/client';
import { formatAmount } from '../lib/format';
import { tapLight, selection, notifySuccess, notifyError } from '../lib/haptics';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const EVM_ADDR_RE = /^0x[0-9a-fA-F]{40}$/;
const TOTP_RE = /^\d{6}$/;

type Mode = 'transfer' | 'withdraw';

export default function SendPage() {
  const history = useHistory();
  const [present] = useIonToast();
  const { user } = useAuth();

  const balance = useAccountBalance();
  const transferMut = useTransfer();
  const withdrawMut = useWithdraw();

  const balances = useMemo(() => balance.data ?? [], [balance.data]);
  const assets = balances.map((b) => b.asset);

  const [mode, setMode] = useState<Mode>('transfer');

  // Transferencia interna
  const [toEmail, setToEmail] = useState('');
  const [asset, setAsset] = useState<string>('');
  const [amount, setAmount] = useState('');
  const [done, setDone] = useState<{ to: string; asset: string; amount: string } | null>(null);

  // Retiro on-chain (USDC)
  const [toAddress, setToAddress] = useState('');
  const [wAmount, setWAmount] = useState('');
  const [totp, setTotp] = useState('');
  const [wDone, setWDone] = useState(false);

  const effectiveAsset = asset || assets[0] || '';
  const selectedBal = balances.find((b) => b.asset === effectiveAsset);
  const available = Number(selectedBal?.available ?? '0');

  // Saldo USDC para retiros
  const usdcBal = balances.find((b) => b.asset?.toUpperCase() === 'USDC');
  const usdcAvailable = Number(usdcBal?.available ?? '0');

  // Validación transferencia
  const validEmail = EMAIL_RE.test(toEmail.trim());
  const amountNum = Number(amount);
  const validAmount = amountNum > 0 && amountNum <= available;
  const overBalance = amountNum > 0 && amountNum > available;
  const canTransfer = validEmail && validAmount && !!effectiveAsset && !transferMut.isPending;

  // Validación retiro
  const validAddr = EVM_ADDR_RE.test(toAddress.trim());
  const wAmountNum = Number(wAmount);
  const validWAmount = wAmountNum > 0 && wAmountNum <= usdcAvailable;
  const overWBalance = wAmountNum > 0 && wAmountNum > usdcAvailable;
  const validTotp = TOTP_RE.test(totp.trim());
  const canWithdraw =
    validAddr && validWAmount && validTotp && !!user?.totpEnabled && !withdrawMut.isPending;

  async function handleSend() {
    if (!canTransfer) return;
    tapLight();
    try {
      await transferMut.mutateAsync({
        toEmail: toEmail.trim(),
        asset: effectiveAsset,
        amount: amount.trim(),
      });
      setDone({ to: toEmail.trim(), asset: effectiveAsset, amount: amount.trim() });
      notifySuccess();
      present({ message: 'Transferencia enviada', duration: 1600, color: 'success' });
      setToEmail('');
      setAmount('');
    } catch (err) {
      notifyError();
      const msg = err instanceof ApiError ? err.message : 'No se pudo completar la transferencia';
      present({ message: msg, duration: 2200, color: 'danger' });
    }
  }

  async function handleWithdraw() {
    if (!user?.totpEnabled) {
      present({ message: 'Activa el 2FA para retirar', duration: 2000, color: 'warning' });
      history.push('/security');
      return;
    }
    if (!canWithdraw) return;
    tapLight();
    try {
      await withdrawMut.mutateAsync({
        asset: 'USDC',
        amount: wAmount.trim(),
        toAddress: toAddress.trim(),
        totpCode: totp.trim(),
      });
      setWDone(true);
      notifySuccess();
      present({ message: 'Retiro en proceso', duration: 1800, color: 'success' });
      setWAmount('');
      setTotp('');
    } catch (err) {
      notifyError();
      const msg = err instanceof ApiError ? err.message : 'No se pudo completar el retiro';
      present({ message: msg, duration: 2600, color: 'danger' });
    }
  }

  return (
    <IonPage>
      <ZenttoHeader title="Enviar" />
      <IonContent className="zt-page" fullscreen>
        <div className="zt-screen">
          <IonSegment
            value={mode}
            onIonChange={(e) => {
              selection();
              setMode((e.detail.value as Mode) ?? 'transfer');
            }}
          >
            <IonSegmentButton value="transfer">
              <IonLabel>Transferir</IonLabel>
            </IonSegmentButton>
            <IonSegmentButton value="withdraw">
              <IonLabel>Retirar</IonLabel>
            </IonSegmentButton>
          </IonSegment>

          {balance.isLoading && !balance.data ? (
            <div style={{ textAlign: 'center', padding: 28 }}>
              <IonSpinner name="crescent" />
            </div>
          ) : mode === 'transfer' ? (
            // ───────────────────────── Transferencia interna ─────────────────────────
            balances.length === 0 ? (
              <div className="zt-empty">
                <IonIcon icon={walletOutline} />
                <p>No tienes saldo para enviar. Obtén saldo de prueba en Inicio.</p>
                <IonButton onClick={() => history.push('/home')}>Ir a Inicio</IonButton>
              </div>
            ) : (
              <>
                <p className="zt-muted" style={{ marginTop: 12 }}>
                  Envía saldo a otro usuario de Zentto por su email. La operación se registra en el
                  ledger de inmediato.
                </p>

                <IonItem className="zt-card" lines="none">
                  <IonInput
                    label="Email del destinatario"
                    labelPlacement="stacked"
                    type="email"
                    inputmode="email"
                    autocapitalize="off"
                    value={toEmail}
                    onIonInput={(e) => setToEmail(e.detail.value ?? '')}
                    placeholder="usuario@correo.com"
                  />
                </IonItem>
                {toEmail && !validEmail && (
                  <p className="zt-muted" style={{ color: 'var(--zt-danger)', margin: '6px 4px' }}>
                    Email inválido.
                  </p>
                )}

                <IonItem className="zt-card" lines="none">
                  <IonSelect
                    label="Activo"
                    labelPlacement="stacked"
                    value={effectiveAsset}
                    onIonChange={(e) => setAsset(e.detail.value)}
                    interface="action-sheet"
                  >
                    {assets.map((a) => (
                      <IonSelectOption key={a} value={a}>
                        {a}
                      </IonSelectOption>
                    ))}
                  </IonSelect>
                </IonItem>

                <IonItem className="zt-card" lines="none">
                  <IonInput
                    label={`Monto (${effectiveAsset || '—'})`}
                    labelPlacement="stacked"
                    type="number"
                    inputmode="decimal"
                    value={amount}
                    onIonInput={(e) => setAmount(e.detail.value ?? '')}
                    placeholder="0.00"
                  />
                </IonItem>
                <div className="zt-row" style={{ borderBottom: 'none', padding: '6px 4px 0' }}>
                  <span className="zt-muted">Disponible</span>
                  <button
                    type="button"
                    className="zt-link"
                    style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                    onClick={() => setAmount(selectedBal?.available ?? '')}
                  >
                    {formatAmount(selectedBal?.available)} {effectiveAsset}
                  </button>
                </div>
                {overBalance && (
                  <p className="zt-muted" style={{ color: 'var(--zt-danger)', margin: '6px 4px' }}>
                    El monto supera tu saldo disponible.
                  </p>
                )}

                <IonButton
                  expand="block"
                  style={{ marginTop: 18 }}
                  disabled={!canTransfer}
                  onClick={handleSend}
                >
                  <IonIcon slot="start" icon={paperPlaneOutline} />
                  {transferMut.isPending ? 'Enviando…' : 'Enviar'}
                </IonButton>

                {done && (
                  <div className="zt-card" style={{ borderColor: 'var(--zt-success)' }}>
                    <div className="zt-row" style={{ borderBottom: 'none' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--zt-success)' }}>
                        <IonIcon icon={checkmarkCircle} />
                        <strong>Transferencia enviada</strong>
                      </span>
                    </div>
                    <div className="zt-row">
                      <span className="zt-muted">Para</span>
                      <span>{done.to}</span>
                    </div>
                    <div className="zt-row">
                      <span className="zt-muted">Monto</span>
                      <strong>
                        {formatAmount(done.amount)} {done.asset}
                      </strong>
                    </div>
                    <IonButton
                      fill="clear"
                      size="small"
                      style={{ marginTop: 6 }}
                      onClick={() => history.push('/movements')}
                    >
                      Ver en movimientos
                    </IonButton>
                  </div>
                )}
              </>
            )
          ) : (
            // ───────────────────────── Retiro on-chain ─────────────────────────
            <>
              <p className="zt-muted" style={{ marginTop: 12 }}>
                Retira USDC a una wallet externa (Sepolia testnet). Requiere verificación 2FA con
                Google Authenticator.
              </p>

              {!user?.totpEnabled && (
                <div className="zt-banner">
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    <IonIcon icon={shieldOutline} />
                    Necesitas activar el 2FA para poder retirar.
                  </span>
                  <IonButton
                    fill="clear"
                    size="small"
                    style={{ marginTop: 6 }}
                    onClick={() => history.push('/security')}
                  >
                    Activar 2FA
                  </IonButton>
                </div>
              )}

              <IonItem className="zt-card" lines="none">
                <IonInput
                  label="Dirección de destino (0x…)"
                  labelPlacement="stacked"
                  autocapitalize="off"
                  value={toAddress}
                  onIonInput={(e) => setToAddress((e.detail.value ?? '').trim())}
                  placeholder="0x0000000000000000000000000000000000000000"
                />
              </IonItem>
              {toAddress && !validAddr && (
                <p className="zt-muted" style={{ color: 'var(--zt-danger)', margin: '6px 4px' }}>
                  Dirección EVM inválida (0x + 40 hex).
                </p>
              )}

              <IonItem className="zt-card" lines="none">
                <IonInput
                  label="Monto (USDC)"
                  labelPlacement="stacked"
                  type="number"
                  inputmode="decimal"
                  value={wAmount}
                  onIonInput={(e) => setWAmount(e.detail.value ?? '')}
                  placeholder="0.00"
                />
              </IonItem>
              <div className="zt-row" style={{ borderBottom: 'none', padding: '6px 4px 0' }}>
                <span className="zt-muted">Disponible</span>
                <button
                  type="button"
                  className="zt-link"
                  style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                  onClick={() => setWAmount(usdcBal?.available ?? '')}
                >
                  {formatAmount(usdcBal?.available ?? '0')} USDC
                </button>
              </div>
              {overWBalance && (
                <p className="zt-muted" style={{ color: 'var(--zt-danger)', margin: '6px 4px' }}>
                  El monto supera tu saldo USDC disponible.
                </p>
              )}

              <IonItem className="zt-card" lines="none">
                <IonInput
                  label="Código 2FA (Google Authenticator)"
                  labelPlacement="stacked"
                  type="number"
                  inputmode="numeric"
                  maxlength={6}
                  value={totp}
                  onIonInput={(e) => setTotp((e.detail.value ?? '').replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                />
              </IonItem>

              <IonButton
                expand="block"
                style={{ marginTop: 18 }}
                disabled={!canWithdraw}
                onClick={handleWithdraw}
              >
                <IonIcon slot="start" icon={exitOutline} />
                {withdrawMut.isPending ? 'Procesando…' : 'Retirar'}
              </IonButton>

              {wDone && (
                <div className="zt-card" style={{ borderColor: 'var(--zt-success)' }}>
                  <div className="zt-row" style={{ borderBottom: 'none' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--zt-success)' }}>
                      <IonIcon icon={checkmarkCircle} />
                      <strong>Retiro en proceso</strong>
                    </span>
                  </div>
                  <p className="zt-muted" style={{ margin: '6px 0 0' }}>
                    Tu retiro se está procesando on-chain. El saldo se actualizará al confirmarse.
                  </p>
                  <IonButton
                    fill="clear"
                    size="small"
                    style={{ marginTop: 6 }}
                    onClick={() => history.push('/movements')}
                  >
                    Ver en movimientos
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
