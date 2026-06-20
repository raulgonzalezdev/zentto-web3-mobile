import {
  IonButton,
  IonContent,
  IonIcon,
  IonPage,
  useIonToast,
} from '@ionic/react';
import { copyOutline, qrCodeOutline } from 'ionicons/icons';
import ZenttoHeader from '../components/ZenttoHeader';
import QrCode from '../components/QrCode';
import { useLinkedAddress } from '../hooks/useWallet';
import { useHistory } from 'react-router-dom';

export default function ReceivePage() {
  const { address } = useLinkedAddress();
  const history = useHistory();
  const [present] = useIonToast();

  async function copy() {
    if (!address) return;
    try {
      await navigator.clipboard.writeText(address);
      present({ message: 'Address copiada', duration: 1400, color: 'success' });
    } catch {
      present({ message: 'No se pudo copiar', duration: 1400, color: 'danger' });
    }
  }

  return (
    <IonPage>
      <ZenttoHeader title="Recibir" />
      <IonContent className="zt-page" fullscreen>
        <div className="zt-screen">
          {address ? (
            <>
              <p className="zt-muted" style={{ textAlign: 'center' }}>
                Comparte este QR o tu address para recibir ETH / USDC en Sepolia testnet.
              </p>
              <div className="zt-qr-wrap">
                <QrCode value={address} size={220} />
              </div>
              <div className="zt-card">
                <h3>Tu address</h3>
                <p className="zt-mono">{address}</p>
                <IonButton expand="block" fill="outline" onClick={copy}>
                  <IonIcon slot="start" icon={copyOutline} />
                  Copiar address
                </IonButton>
              </div>
            </>
          ) : (
            <div className="zt-empty">
              <IonIcon icon={qrCodeOutline} />
              <p>Aún no has vinculado una address.</p>
              <IonButton onClick={() => history.push('/home')}>Ir a Inicio</IonButton>
            </div>
          )}
        </div>
      </IonContent>
    </IonPage>
  );
}
