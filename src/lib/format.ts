// Helpers de formato compartidos. Los montos del ledger son strings decimales.

/** Formatea un monto decimal (string|number) con separadores de miles. */
export function formatAmount(v: string | number | null | undefined, maxFrac = 2): string {
  if (v == null || v === '') return '0.00';
  const n = typeof v === 'number' ? v : Number(v);
  if (Number.isNaN(n)) return String(v);
  return n.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: maxFrac,
  });
}

/** Acorta una address EVM 0x1234…abcd. */
export function shortenAddress(addr: string): string {
  return addr.length > 12 ? `${addr.slice(0, 6)}…${addr.slice(-4)}` : addr;
}

/**
 * Fecha (ISO o epoch) a una sola línea estilo neobanco: "20 jun · 7:43 p. m.".
 * Pensada para `white-space:nowrap` — nunca se parte carácter por carácter.
 */
export function formatDate(value: string | number | null | undefined): string {
  if (value == null || value === '') return '';
  const d = typeof value === 'number' ? new Date(value) : new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  const day = d.toLocaleDateString('es', { day: 'numeric', month: 'short' });
  const time = d.toLocaleTimeString('es', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
  // "20 sept" → "20 sep" (mes corto sin punto extra) y une con separador medio.
  return `${day.replace('.', '')} · ${time}`;
}

/** Etiqueta + color para un estado de pago. */
export function paymentStatusMeta(status: string): { label: string; color: string } {
  const s = (status || '').toLowerCase();
  if (s === 'completed' || s === 'success' || s === 'confirmed')
    return { label: 'Completado', color: 'var(--zt-success)' };
  if (s === 'failed' || s === 'error' || s === 'rejected')
    return { label: 'Fallido', color: 'var(--zt-danger)' };
  if (s === 'reversed' || s === 'refunded')
    return { label: 'Revertido', color: 'var(--zt-text-dim)' };
  return { label: status || 'Pendiente', color: 'var(--zt-warning)' };
}
