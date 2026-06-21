import { useMemo, useState } from 'react';
import {
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonInput,
  IonItem,
  IonLabel,
  IonModal,
  IonSegment,
  IonSegmentButton,
  IonSelect,
  IonSelectOption,
  IonTitle,
  IonToolbar,
  useIonToast,
} from '@ionic/react';
import { closeOutline } from 'ionicons/icons';
import { useAccountBalance } from '../hooks/usePayments';
import { useCreateP2pOrder } from '../hooks/useP2p';
import { usePaymentMethods } from '../hooks/usePaymentMethods';
import { paymentMethodToText } from '../lib/paymentMethod';
import { formatAmount, formatVes } from '../lib/format';
import { ApiError } from '../api/client';
import type { P2pSide } from '../api/types';

const ASSETS = ['USDT', 'USDC'];
const DECIMAL_RE = /^\d+(\.\d+)?$/;

/**
 * Modal para publicar una oferta P2P. Vender escrowa tu cripto; el método de pago
 * se elige de los guardados (o texto libre) y se manda como texto legible para que
 * la contraparte lo copie.
 */
export default function PublishOfferModal({
  isOpen,
  onDismiss,
  onPublished,
}: {
  isOpen: boolean;
  onDismiss: () => void;
  onPublished: () => void;
}) {
  const [present] = useIonToast();
  const createMut = useCreateP2pOrder();
  const methods = usePaymentMethods();
  const balance = useAccountBalance();

  const [side, setSide] = useState<P2pSide>('sell');
  const [asset, setAsset] = useState('USDT');
  const [amount, setAmount] = useState('');
  const [priceVes, setPriceVes] = useState('');
  const [methodId, setMethodId] = useState<string>('');
  const [customMethod, setCustomMethod] = useState('');

  const balances = balance.data ?? [];
  const assetBal = balances.find((b) => b.asset?.toUpperCase() === asset);
  const available = Number(assetBal?.available ?? '0');

  const amountNum = Number(amount);
  const priceNum = Number(priceVes);

  const validAmount = DECIMAL_RE.test(amount.trim()) && amountNum > 0;
  const validPrice = DECIMAL_RE.test(priceVes.trim()) && priceNum > 0;
  // Vender escrowa: el monto no puede superar el disponible.
  const overBalance = side === 'sell' && amountNum > available;

  const selectedMethod = useMemo(
    () => (methods.data ?? []).find((m) => m.id === methodId),
    [methods.data, methodId],
  );

  const paymentMethodText =
    methodId === '__custom__'
      ? customMethod.trim()
      : selectedMethod
        ? paymentMethodToText(selectedMethod)
        : '';

  const total = amountNum > 0 && priceNum > 0 ? amountNum * priceNum : 0;
  const canPublish = validAmount && validPrice && !overBalance && !createMut.isPending;

  function reset() {
    setAmount('');
    setPriceVes('');
    setMethodId('');
    setCustomMethod('');
  }

  async function handlePublish() {
    if (!canPublish) return;
    try {
      await createMut.mutateAsync({
        side,
        asset,
        amount: amount.trim(),
        priceVes: priceVes.trim(),
        paymentMethod: paymentMethodText || undefined,
      });
      present({ message: 'Oferta publicada', duration: 1600, color: 'success' });
      reset();
      onPublished();
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'No se pudo publicar la oferta';
      present({ message: msg, duration: 2600, color: 'danger' });
    }
  }

  return (
    <IonModal isOpen={isOpen} onDidDismiss={onDismiss} className="zt-modal">
      <IonHeader className="zt-header">
        <IonToolbar>
          <IonTitle>Publicar oferta</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={onDismiss} aria-label="Cerrar">
              <IonIcon slot="icon-only" icon={closeOutline} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent className="zt-page">
        <div className="zt-screen">
          <IonSegment value={side} onIonChange={(e) => setSide((e.detail.value as P2pSide) ?? 'sell')}>
            <IonSegmentButton value="sell">
              <IonLabel>Vender</IonLabel>
            </IonSegmentButton>
            <IonSegmentButton value="buy">
              <IonLabel>Comprar</IonLabel>
            </IonSegmentButton>
          </IonSegment>

          <p className="zt-muted" style={{ marginTop: 12 }}>
            {side === 'sell'
              ? 'Vendes cripto a cambio de bolívares. Tu cripto queda retenido hasta cerrar el trade.'
              : 'Compras cripto pagando bolívares. La contraparte retiene su cripto.'}
          </p>

          <IonItem className="zt-card" lines="none">
            <IonSelect
              label="Activo"
              labelPlacement="stacked"
              value={asset}
              onIonChange={(e) => setAsset(e.detail.value)}
              interface="action-sheet"
            >
              {ASSETS.map((a) => (
                <IonSelectOption key={a} value={a}>
                  {a}
                </IonSelectOption>
              ))}
            </IonSelect>
          </IonItem>

          <IonItem className="zt-card" lines="none">
            <IonInput
              label={`Cantidad (${asset})`}
              labelPlacement="stacked"
              type="number"
              inputmode="decimal"
              value={amount}
              onIonInput={(e) => setAmount(e.detail.value ?? '')}
              placeholder="0.00"
            />
          </IonItem>
          {side === 'sell' && (
            <div className="zt-row" style={{ borderBottom: 'none', padding: '6px 4px 0' }}>
              <span className="zt-muted">Disponible</span>
              <button
                type="button"
                className="zt-link"
                style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                onClick={() => setAmount(assetBal?.available ?? '')}
              >
                {formatAmount(assetBal?.available ?? '0', 6)} {asset}
              </button>
            </div>
          )}
          {overBalance && (
            <p className="zt-muted" style={{ color: 'var(--zt-danger)', margin: '6px 4px' }}>
              El monto supera tu saldo disponible.
            </p>
          )}

          <IonItem className="zt-card" lines="none">
            <IonInput
              label="Precio por unidad (Bs.)"
              labelPlacement="stacked"
              type="number"
              inputmode="decimal"
              value={priceVes}
              onIonInput={(e) => setPriceVes(e.detail.value ?? '')}
              placeholder="0.00"
            />
          </IonItem>

          <IonItem className="zt-card" lines="none">
            <IonSelect
              label="Método de pago"
              labelPlacement="stacked"
              value={methodId}
              onIonChange={(e) => setMethodId(e.detail.value)}
              interface="action-sheet"
              placeholder="Selecciona"
            >
              {(methods.data ?? []).map((m) => (
                <IonSelectOption key={m.id} value={m.id}>
                  {m.label}
                </IonSelectOption>
              ))}
              <IonSelectOption value="__custom__">Otro (escribir)</IonSelectOption>
            </IonSelect>
          </IonItem>

          {methodId === '__custom__' && (
            <IonItem className="zt-card" lines="none">
              <IonInput
                label="Descripción del pago"
                labelPlacement="stacked"
                value={customMethod}
                onIonInput={(e) => setCustomMethod(e.detail.value ?? '')}
                placeholder="Ej: Pago Móvil 0414… BDV"
              />
            </IonItem>
          )}

          {selectedMethod && methodId !== '__custom__' && (
            <div className="zt-card">
              <h3>La contraparte verá</h3>
              <p className="zt-mono">{paymentMethodToText(selectedMethod)}</p>
            </div>
          )}

          {total > 0 && (
            <div className="zt-row" style={{ marginTop: 8 }}>
              <span className="zt-muted">Total de la oferta</span>
              <strong>{formatVes(total)}</strong>
            </div>
          )}

          <IonButton expand="block" style={{ marginTop: 14 }} disabled={!canPublish} onClick={handlePublish}>
            {createMut.isPending ? 'Publicando…' : 'Publicar oferta'}
          </IonButton>
        </div>
      </IonContent>
    </IonModal>
  );
}
