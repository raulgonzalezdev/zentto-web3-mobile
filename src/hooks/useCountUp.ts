// Animación count-up de un número (saldo). Sube suavemente de 0 (o del valor
// anterior) al objetivo con easing. Respeta prefers-reduced-motion (salta al
// final). Devuelve el valor intermedio formateado por `format`.

import { useEffect, useRef, useState } from 'react';

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

function reducedMotion(): boolean {
  try {
    return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
  } catch {
    return false;
  }
}

/**
 * @param target  valor numérico objetivo (saldo real).
 * @param active  si false, no anima (p.ej. mientras carga) y muestra 0.
 * @param duration ms de la animación.
 */
export function useCountUp(target: number, active = true, duration = 900): number {
  const [value, setValue] = useState(0);
  const fromRef = useRef(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!active) {
      setValue(0);
      fromRef.current = 0;
      return;
    }
    if (!Number.isFinite(target)) {
      setValue(0);
      return;
    }
    if (reducedMotion()) {
      setValue(target);
      fromRef.current = target;
      return;
    }

    const from = fromRef.current;
    const delta = target - from;
    if (delta === 0) {
      setValue(target);
      return;
    }

    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = easeOutCubic(t);
      setValue(from + delta * eased);
      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        fromRef.current = target;
      }
    };
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      fromRef.current = target; // próxima animación parte del último objetivo
    };
  }, [target, active, duration]);

  return value;
}
