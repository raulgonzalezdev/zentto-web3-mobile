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

  // Al reanudar la app (volver del background), re-bloquear si hay PIN.
  useEffect(() => {
    let handle: { remove: () => void } | undefined;
    (async () => {
      try {
        const h = await App.addListener('resume', () => {
          if (pinEnabledRef.current) setLocked(true);
        });
        handle = h;
      } catch {
        /* en web el plugin App puede no emitir resume; no es crítico */
      }
    })();
    return () => {
      handle?.remove();
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
