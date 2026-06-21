import { useState } from 'react';
import {
  IonButton,
  IonContent,
  IonInput,
  IonItem,
  IonNote,
  IonPage,
  IonSpinner,
  IonText,
} from '@ionic/react';
import { Link } from 'react-router-dom';
import { register } from '../api/auth';
import { useAuth } from '../auth/AuthContext';
import { ApiError } from '../api/client';

export default function RegisterPage() {
  const { setUser } = useAuth();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleRegister() {
    setError(null);
    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.');
      return;
    }
    setBusy(true);
    try {
      const { user } = await register(email.trim(), password, displayName.trim() || undefined);
      setUser(user);
    } catch (err) {
      setError(err instanceof ApiError ? humanize(err) : 'No se pudo crear la cuenta.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <IonPage>
      <IonContent className="zt-page" fullscreen>
        <div className="zt-screen">
          <div className="zt-brand">
            <div className="zt-logo">Z</div>
            <h1>Crear cuenta</h1>
            <p>Únete a Zentto en menos de un minuto.</p>
          </div>

          <IonItem className="zt-card" lines="none" style={{ marginTop: 8 }}>
            <IonInput
              label="Nombre"
              labelPlacement="stacked"
              value={displayName}
              onIonInput={(e) => setDisplayName(e.detail.value ?? '')}
              placeholder="Tu nombre"
            />
          </IonItem>
          <IonItem className="zt-card" lines="none">
            <IonInput
              label="Correo"
              labelPlacement="stacked"
              type="email"
              inputmode="email"
              autocomplete="email"
              value={email}
              onIonInput={(e) => setEmail(e.detail.value ?? '')}
              placeholder="tucorreo@dominio.com"
            />
          </IonItem>
          <IonItem className="zt-card" lines="none">
            <IonInput
              label="Contraseña"
              labelPlacement="stacked"
              type="password"
              value={password}
              onIonInput={(e) => setPassword(e.detail.value ?? '')}
              placeholder="Mínimo 8 caracteres"
            />
          </IonItem>

          {error && (
            <IonNote color="danger" style={{ display: 'block', margin: '12px 4px' }}>
              {error}
            </IonNote>
          )}

          <IonButton
            expand="block"
            style={{ marginTop: 18 }}
            disabled={busy || !email || !password}
            onClick={handleRegister}
          >
            {busy ? <IonSpinner name="crescent" /> : 'Crear cuenta'}
          </IonButton>

          <IonText className="zt-muted" style={{ display: 'block', textAlign: 'center', marginTop: 14, fontSize: 12 }}>
            Al registrarte aceptas los{' '}
            <Link className="zt-link" to="/legal/terminos">Términos</Link>,{' '}
            <Link className="zt-link" to="/legal/privacidad">Privacidad</Link> y el{' '}
            <Link className="zt-link" to="/legal/responsabilidad">Aviso de Responsabilidad</Link>.
          </IonText>

          <IonText className="zt-muted" style={{ display: 'block', textAlign: 'center', marginTop: 14 }}>
            ¿Ya tienes cuenta? <Link className="zt-link" to="/login">Iniciar sesión</Link>
          </IonText>
        </div>
      </IonContent>
    </IonPage>
  );
}

function humanize(err: ApiError): string {
  if (err.status === 409) return 'Ese correo ya está registrado.';
  if (err.status === 0) return 'Sin conexión con el servidor. ¿Está corriendo el backend en :4100?';
  return err.message || 'No se pudo crear la cuenta.';
}
