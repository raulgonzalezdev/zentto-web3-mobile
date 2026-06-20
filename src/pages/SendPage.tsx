import { useState } from 'react';
import {
  IonButton,
  IonContent,
  IonIcon,
  IonInput,
  IonItem,
  IonPage,
} from '@ionic/react';
import { informationCircleOutline, paperPlaneOutline } from 'ionicons/icons';
import ZenttoHeader from '../components/ZenttoHeader';
import { useLinkedAddress } from '../hooks/useWallet';
import { isValidAddress } from '../hooks/useEvm';

export default function SendPage() {
  const { address } = useLinkedAddress();
  const [to, setTo] = useState('');
  const [amount, setAmount] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const validTo = isValidAddress(to);
  const validAmount = Number(amount) > 0;

  return (
    <IonPage>
      <ZenttoHeader title="Enviar" />
      <IonContent className="zt-page" fullscreen>
        <div className="zt-screen">
          <div className="zt-banner">
            <IonIcon icon={informationCircleOutline} style={{ verticalAlign: '-2px', marginRight: 6 }} />
            Demo: este flujo arma la transferencia. La firma y la custodia real (signing on-chain)
            quedan como follow-up del backend.
          </div>

          <div className="zt-card">
            <h3>Desde</h3>
            <p className="zt-mono zt-muted">{address ?? 'Vincula una address en Inicio'}</p>
          </div>

          <IonItem
            className="zt-card"
            lines="none"
            style={{ '--background': 'var(--zt-card)' }}
          >
            <IonInput
              label="Destinatario"
              labelPlacement="stacked"
              value={to}
              onIonInput={(e) => setTo(e.detail.value ?? '')}
              placeholder="0x…"
              className="zt-mono"
            />
          </IonItem>
          {to && !validTo && (
            <p className="zt-muted" style={{ color: 'var(--zt-danger)', margin: '6px 4px' }}>
              Address EVM inválida.
            </p>
          )}

          <IonItem className="zt-card" lines="none">
            <IonInput
              label="Monto (USDC)"
              labelPlacement="stacked"
              type="number"
              inputmode="decimal"
              value={amount}
              onIonInput={(e) => setAmount(e.detail.value ?? '')}
              placeholder="0.00"
            />
          </IonItem>

          <IonButton
            expand="block"
            style={{ marginTop: 18 }}
            disabled={!validTo || !validAmount || !address}
            onClick={() => setSubmitted(true)}
          >
            <IonIcon slot="start" icon={paperPlaneOutline} />
            Revisar envío
          </IonButton>

          {submitted && (
            <div className="zt-card" style={{ borderColor: 'var(--zt-indigo)' }}>
              <h3>Resumen</h3>
              <div className="zt-row">
                <span className="zt-muted">Para</span>
                <span className="zt-mono">{to}</span>
              </div>
              <div className="zt-row">
                <span className="zt-muted">Monto</span>
                <strong>{Number(amount).toFixed(2)} USDC</strong>
              </div>
              <p className="zt-muted" style={{ marginTop: 10 }}>
                En producción aquí se firmaría la transacción con la llave custodiada por Zentto y
                se difundiría a la red. Por ahora es una vista previa del flujo.
              </p>
            </div>
          )}
        </div>
      </IonContent>
    </IonPage>
  );
}
