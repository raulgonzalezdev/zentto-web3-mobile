import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { App } from '@capacitor/app';
import { isBiometricEnabled, isPinSet } from '../lib/pinLock';

interface LockState {
  /** Hay un PIN configurado (el candado de app está activo). */
  pinEnabled: boolean;
  /** La huella está activada para desbloquear. */
  biometricEnabled: boolean;
  /** La app está bloqueada y exige PIN/huella. */
  locked: boolean;
  /** Relee la config (tras crear/borrar PIN o togglear huella). */
  refreshLock: () => Promise<void>;
  /** Marca como desbloqueada (lo llama la pantalla de bloqueo al validar). */
  unlock: () => void;
  /** Fuerza el bloqueo (ej. botón "bloquear ahora"). */
  lock: () => void;
}

const LockCtx = createContext<LockState | undefined>(undefined);

export const LockProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [pinEnabled, setPinEnabled] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [locked, setLocked] = useState(false);
  const [ready, setReady] = useState(false);
  const pinEnabledRef = useRef(false);
  // Momento en que la app pasó a segundo plano. Solo re-bloqueamos si estuvo
  // fuera más que la ventana de gracia: así, salir 10s a copiar el OTP de Google
  // Authenticator (o el propio prompt de huella) NO re-bloquea ni crea ciclos.
  const pausedAtRef = useRef(Date.now());
  const GRACE_MS = 30_000;

  const refreshLock = useCallback(async () => {
    const [pin, bio] = await Promise.all([isPinSet(), isBiometricEnabled()]);
    setPinEnabled(pin);
    setBiometricEnabled(bio);
    pinEnabledRef.current = pin;
  }, []);

  // Config inicial: si hay PIN, arrancamos bloqueados. A PRUEBA DE FALLOS:
  // `ready` SIEMPRE termina en true (aunque el storage falle o cuelgue) para no
  // dejar la app en pantalla negra. Timeout de seguridad de 2s.
  useEffect(() => {
    let done = false;
    const finish = (pin: boolean, bio: boolean) => {
      if (done) return;
      done = true;
      setPinEnabled(pin);
      setBiometricEnabled(bio);
      pinEnabledRef.current = pin;
      setLocked(pin);
      setReady(true);
    };
    Promise.all([isPinSet(), isBiometricEnabled()])
      .then(([pin, bio]) => finish(pin, bio))
      .catch(() => finish(false, false));
    const t = setTimeout(() => finish(false, false), 2000);
    return () => clearTimeout(t);
  }, []);

  // Re-bloqueo con PERIODO DE GRACIA: registra el momento de pausa y, al volver,
  // solo re-bloquea si estuvo en segundo plano > 30s. Evita el ciclo huella↔PIN
  // (el prompt de huella dispara pause/resume al instante) y no interrumpe ir a
  // buscar un código OTP.
  useEffect(() => {
    let pauseH: { remove: () => void } | undefined;
    let resumeH: { remove: () => void } | undefined;
    (async () => {
      try {
        pauseH = await App.addListener('pause', () => {
          pausedAtRef.current = Date.now();
        });
        resumeH = await App.addListener('resume', () => {
          if (pinEnabledRef.current && Date.now() - pausedAtRef.current > GRACE_MS) {
            setLocked(true);
          }
        });
      } catch {
        /* en web el plugin App puede no emitir estos eventos; no es crítico */
      }
    })();
    return () => {
      pauseH?.remove();
      resumeH?.remove();
    };
  }, []);

  const unlock = useCallback(() => setLocked(false), []);
  const lock = useCallback(() => {
    if (pinEnabledRef.current) setLocked(true);
  }, []);

  if (!ready) return null;

  return (
    <LockCtx.Provider
      value={{ pinEnabled, biometricEnabled, locked, refreshLock, unlock, lock }}
    >
      {children}
    </LockCtx.Provider>
  );
};

export function useLock(): LockState {
  const ctx = useContext(LockCtx);
  if (!ctx) throw new Error('useLock debe usarse dentro de <LockProvider>');
  return ctx;
}
