import { useCallback, useEffect, useState } from 'react';

// Address EVM "vinculada" por el usuario para ver su saldo de testnet real.
// Se guarda SOLO en memoria de la sesión (no es una llave privada, es una address pública).
// Decisión: usamos sessionStorage (no localStorage) para que no persista entre cierres,
// alineado con la regla de no persistir material sensible. Las llaves privadas NUNCA se tocan aquí.

const KEY = 'zw3.linkedAddress';

let memoryAddress: string | null =
  typeof sessionStorage !== 'undefined' ? sessionStorage.getItem(KEY) : null;

const listeners = new Set<(v: string | null) => void>();

function setGlobal(v: string | null) {
  memoryAddress = v;
  try {
    if (v) sessionStorage.setItem(KEY, v);
    else sessionStorage.removeItem(KEY);
  } catch {
    /* sessionStorage no disponible: queda solo en memoria */
  }
  listeners.forEach((l) => l(v));
}

export function useLinkedAddress() {
  const [address, setAddress] = useState<string | null>(memoryAddress);

  useEffect(() => {
    const l = (v: string | null) => setAddress(v);
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  }, []);

  const link = useCallback((addr: string) => setGlobal(addr.trim()), []);
  const unlink = useCallback(() => setGlobal(null), []);

  return { address, link, unlink };
}
