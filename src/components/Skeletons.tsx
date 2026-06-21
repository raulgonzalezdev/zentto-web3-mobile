// Placeholders con forma del contenido real (estilo Binance/Meru) usando
// IonSkeletonText con shimmer animado. Reutilizables en todas las pantallas.

import { IonSkeletonText } from '@ionic/react';

/** Fila de transacción/activo: ícono circular + dos líneas + monto a la derecha. */
export function RowSkeleton() {
  return (
    <div className="zt-tx">
      <IonSkeletonText animated className="zt-sk-circle" />
      <div className="zt-tx-main">
        <IonSkeletonText animated style={{ width: '62%', height: 13, borderRadius: 6 }} />
        <IonSkeletonText animated style={{ width: '40%', height: 11, borderRadius: 6, marginTop: 6 }} />
      </div>
      <div className="zt-tx-right" style={{ alignItems: 'flex-end' }}>
        <IonSkeletonText animated style={{ width: 64, height: 13, borderRadius: 6 }} />
        <IonSkeletonText animated style={{ width: 44, height: 14, borderRadius: 999 }} />
      </div>
    </div>
  );
}

/** N filas de skeleton dentro de una tarjeta. */
export function ListSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="zt-card" style={{ padding: '4px 16px' }}>
      {Array.from({ length: rows }).map((_, i) => (
        <RowSkeleton key={i} />
      ))}
    </div>
  );
}

/** Skeleton de tarjeta genérica (KYC/2FA/método): título + líneas. */
export function CardSkeleton({ lines = 2 }: { lines?: number }) {
  return (
    <div className="zt-card">
      <IonSkeletonText animated style={{ width: '50%', height: 16, borderRadius: 6 }} />
      {Array.from({ length: lines }).map((_, i) => (
        <IonSkeletonText
          key={i}
          animated
          style={{ width: i === lines - 1 ? '70%' : '92%', height: 12, borderRadius: 6, marginTop: 10 }}
        />
      ))}
    </div>
  );
}

/** Skeleton del monto grande del saldo (hero del Home). */
export function BalanceSkeleton() {
  return (
    <IonSkeletonText
      animated
      style={{
        width: 180,
        height: 38,
        borderRadius: 10,
        margin: '6px 0 2px',
        '--background': 'rgba(255,255,255,0.18)',
        '--background-rgb': '255,255,255',
      } as React.CSSProperties}
    />
  );
}
