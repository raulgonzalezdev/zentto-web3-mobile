import { useEffect, useState } from 'react';
import {
  IonButton,
  IonCheckbox,
  IonContent,
  IonIcon,
  IonInput,
  IonItem,
  IonNote,
  IonPage,
  IonSpinner,
  IonText,
} from '@ionic/react';
import { eyeOffOutline, eyeOutline } from 'ionicons/icons';
import { Preferences } from '@capacitor/preferences';
import { Link } from 'react-router-dom';
import { login, loginTwoFactor } from '../api/auth';
import { useAuth } from '../auth/AuthContext';
import { ApiError } from '../api/client';
import { hideKeyboard } from '../lib/keyboard';

export default function LoginPage() {
  const { setUser } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [code, setCode] = useState('');
  const [mfaToken, setMfaToken] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [remember, setRemember] = useState(false);

  useEffect(() => {
    (async () => {
      const r = (await Preferences.get({ key: 'zt_remember' })).value === '1';
      setRemember(r);
      const em = (await Preferences.get({ key: 'zt_email' })).value;
      if (em) setEmail(em);
      if (r) {
        const pw = (await Preferences.get({ key: 'zt_pass' })).value;
        if (pw) setPassword(pw);
      }
    })();
  }, []);

  async function handleLogin() {
    hideKeyboard();
    setError(null);
    setBusy(true);
    try {
      const res = await login(email.trim(), password);
      await Preferences.set({ key: 'zt_email', value: email.trim() });
      await Preferences.set({ key: 'zt_remember', value: remember ? '1' : '0' });
      if (remember) {
        await Preferences.set({ key: 'zt_pass', value: password });
      } else {
        await Preferences.remove({ key: 'zt_pass' });
      }
      if (res.mfaRequired && res.mfaToken) {
        setMfaToken(res.mfaToken);
      } else if (res.user) {
        setUser(res.user);
      }
    } catch (err) {
      setError(err instanceof ApiError ? humanize(err) : 'No se pudo iniciar sesión.');
    } finally {
      setBusy(false);
    }
  }

  async function handle2fa() {
    if (!mfaToken) return;
    hideKeyboard();
    setError(null);
    setBusy(true);
    try {
      const { user } = await loginTwoFactor(mfaToken, code.trim());
      setUser(user);
    } catch (err) {
      setError(err instanceof ApiError ? humanize(err) : 'Código inválido.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <IonPage>
      <IonContent className="zt-page" fullscreen>
        <div className="zt-screen zt-noscale">
          <div className="zt-brand zt-enter">
            <div className="zt-logo">Z</div>
            <h1>Zentto</h1>
            <p>El centro de tu dinero digital. Dólares con respaldo real.</p>
          </div>

          {!mfaToken ? (
            <>
              <IonItem className="zt-card" lines="none" style={{ marginTop: 8 }}>
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
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onIonInput={(e) => setPassword(e.detail.value ?? '')}
                  onKeyDown={(e) => e.key === 'Enter' && email && password && handleLogin()}
                  placeholder="Tu contraseña"
                >
                  <IonIcon
                    slot="end"
                    icon={showPass ? eyeOffOutline : eyeOutline}
                    onClick={() => setShowPass((s) => !s)}
                    style={{ color: 'var(--zt-text-dim)', cursor: 'pointer' }}
                  />
                </IonInput>
              </IonItem>

              <IonItem className="zt-remember" lines="none">
                <IonCheckbox
                  checked={remember}
                  onIonChange={(e) => setRemember(e.detail.checked)}
                  labelPlacement="end"
                >
                  Recordar usuario y clave
                </IonCheckbox>
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
                onClick={handleLogin}
              >
                {busy ? <IonSpinner name="crescent" /> : 'Entrar'}
              </IonButton>

              <IonText className="zt-muted" style={{ display: 'block', textAlign: 'center', marginTop: 18 }}>
                ¿No tienes cuenta? <Link className="zt-link" to="/register">Crear cuenta</Link>
              </IonText>
            </>
          ) : (
            <>
              <div className="zt-banner">
                Verificación en dos pasos activa. Ingresa el código de tu app de autenticación.
              </div>
              <IonItem className="zt-card" lines="none">
                <IonInput
                  label="Código 2FA"
                  labelPlacement="stacked"
                  inputmode="numeric"
                  maxlength={6}
                  value={code}
                  onIonInput={(e) => setCode(e.detail.value ?? '')}
                  onKeyDown={(e) => e.key === 'Enter' && code.length >= 6 && handle2fa()}
                  placeholder="Código de 6 dígitos"
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
                disabled={busy || code.length < 6}
                onClick={handle2fa}
              >
                {busy ? <IonSpinner name="crescent" /> : 'Verificar'}
              </IonButton>
              <IonButton
                expand="block"
                fill="clear"
                color="medium"
                onClick={() => {
                  setMfaToken(null);
                  setCode('');
                  setError(null);
                }}
              >
                Volver
              </IonButton>
            </>
          )}
        </div>
      </IonContent>
    </IonPage>
  );
}

function humanize(err: ApiError): string {
  if (err.status === 401) return 'Correo o contraseña incorrectos.';
  if (err.status === 0) return 'Sin conexión con el servidor. ¿Está corriendo el backend en :4100?';
  return err.message || 'No se pudo iniciar sesión.';
}
