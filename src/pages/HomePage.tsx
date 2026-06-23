import {
  IonButton,
  IonContent,
  IonIcon,
  IonPage,
  IonRefresher,
  IonRefresherContent,
} from '@ionic/react';
import { useRef, useState } from 'react';
import { useHistory } from 'react-router-dom';
import {
  paperPlaneOutline,
  qrCodeOutline,
  swapHorizontalOutline,
  addCircleOutline,
  walletOutline,
  cardOutline,
  trendingUpOutline,
  cashOutline,
  lockClosedOutline,
} from 'ionicons/icons';
import ZenttoHeader from '../components/ZenttoHeader';
import { BalanceSkeleton, ListSkeleton } from '../components/Skeletons';
import { useEvmInfo, isEvmUnavailable } from '../hooks/useEvm';
import { useAccountBalance, usePayments } from '../hooks/usePayments';
import { useAuth } from '../auth/AuthContext';
import { useCountUp } from '../hooks/useCountUp';
import { formatAmount, formatDate, paymentTypeLabel } from '../lib/format';
import { tapLight } from '../lib/haptics';
import type { AccountBalance, Payment } from '../api/types';

// Asset principal mostrado en grande. Si no hay saldo aún, se usa USDT.
const PRIMARY_ASSET = 'USDT';
function assetSymbol(asset: string): string {
  return asset?.toUpperCase() === 'USDC' ? '$' : '₮';
}

export default function HomePage() {
  const history = useHistory();
  const { user } = useAuth();

  const info = useEvmInfo();
  const balance = useAccountBalance();

  const balances: AccountBalance[] = balance.data ?? [];
  const primary =
    balances.find((b) => b.asset?.toUpperCase() === PRIMARY_ASSET) ?? balances[0];
  const others = balances.filter((b) => b !== primary);

  const loadingBalance = balance.isLoading && !balance.data;
  const primaryAmount = Number(primary?.available ?? 0);
  // Count-up del saldo: anima al objetivo cuando ya tenemos datos.
  const animated = useCountUp(primaryAmount, !loadingBalance && !!primary);

  const evmDown = info.isError && isEvmUnavailable(info.error);
  const netLabel = evmDown
    ? 'Red no disponible'
    : info.data
      ? `${(info.data.chainName as string) ?? info.data.network ?? 'Sepolia'}${
          info.data.blockNumber ? ` · bloque ${info.data.blockNumber}` : ''
        }`
      : 'Conectando a la red…';

  function go(path: string) {
    tapLight();
    history.push(path);
  }

  return (
    <IonPage>
      <ZenttoHeader title="Inicio" />
      <IonContent className="zt-page" fullscreen>
        <IonRefresher
          slot="fixed"
          onIonRefresh={async (e) => {
            tapLight();
            await Promise.all([balance.refetch(), info.refetch()]);
            e.detail.complete();
          }}
        >
          <IonRefresherContent />
        </IonRefresher>

        <div className="zt-screen">
          {/* Carrusel de cuentas/productos — saldo real + próximos productos */}
          <AccountsCarousel
            primary={primary}
            others={others}
            loadingBalance={loadingBalance}
            animated={animated}
            netLabel={netLabel}
            evmDown={evmDown}
            owner={user?.displayName || user?.email || 'Mi cuenta'}
            onRecharge={() => go('/recharge')}
          />

          {/* Acciones rápidas (compartidas) */}
          <div className="zt-quick zt-quick-bar">
            <button className="zt-quick-item" type="button" onClick={() => go('/send')}>
              <span className="zt-quick-ic"><IonIcon icon={paperPlaneOutline} /></span>
              <span className="zt-quick-label">Enviar</span>
            </button>
            <button className="zt-quick-item" type="button" onClick={() => go('/receive')}>
              <span className="zt-quick-ic"><IonIcon icon={qrCodeOutline} /></span>
              <span className="zt-quick-label">Recibir</span>
            </button>
            <button className="zt-quick-item" type="button" onClick={() => go('/movements')}>
              <span className="zt-quick-ic"><IonIcon icon={swapHorizontalOutline} /></span>
              <span className="zt-quick-label">Historial</span>
            </button>
            <button className="zt-quick-item" type="button" onClick={() => go('/recharge')}>
              <span className="zt-quick-ic"><IonIcon icon={addCircleOutline} /></span>
              <span className="zt-quick-label">Recargar</span>
            </button>
          </div>

          {/* Lista de activos del ledger */}
          <div className="zt-section-head">
            <h3>Mis activos</h3>
            <span className="zt-muted">disponible</span>
          </div>

          {loadingBalance ? (
            <ListSkeleton rows={2} />
          ) : balance.isError ? (
            <div className="zt-card zt-enter">
              <p className="zt-muted" style={{ color: 'var(--zt-danger)', margin: 0 }}>
                No se pudo cargar tu saldo. Desliza hacia abajo para reintentar.
              </p>
            </div>
          ) : balances.length === 0 ? (
            <div className="zt-card zt-enter">
              <div className="zt-empty" style={{ padding: '24px 8px' }}>
                <IonIcon icon={walletOutline} />
                <p>Aún no tienes saldo. Toca "Recargar" para ingresar dinero y empezar.</p>
                <IonButton
                  size="small"
                  fill="outline"
                  style={{ marginTop: 12 }}
                  onClick={() => go('/recharge')}
                >
                  <IonIcon slot="start" icon={addCircleOutline} />
                  Recargar
                </IonButton>
              </div>
            </div>
          ) : (
            <div className="zt-card zt-stagger">
              {primary && <AssetRow b={primary} />}
              {others.map((b) => (
                <AssetRow key={b.asset} b={b} />
              ))}
            </div>
          )}

          {/* Movimientos recientes — listado embebido */}
          <RecentMovements onSeeAll={() => go('/movements')} />
        </div>
      </IonContent>
    </IonPage>
  );
}

interface CarouselProps {
  primary?: AccountBalance;
  others: AccountBalance[];
  loadingBalance: boolean;
  animated: number;
  netLabel: string;
  evmDown: boolean;
  owner: string;
  onRecharge: () => void;
}

const SOON_PRODUCTS = [
  { key: 'card', title: 'Tarjeta Zentto', desc: 'Paga en cualquier comercio', icon: cardOutline },
  { key: 'save', title: 'Ahorro en dólares', desc: 'Guarda y protege tu dinero', icon: cashOutline },
  { key: 'yield', title: 'Rendimiento', desc: 'Haz crecer tu saldo', icon: trendingUpOutline },
];

/** Carrusel deslizable de cuentas (saldo real) + productos próximos, con dots. */
function AccountsCarousel({
  primary,
  others,
  loadingBalance,
  animated,
  netLabel,
  evmDown,
  owner,
  onRecharge,
}: CarouselProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const total = 1 + others.length + SOON_PRODUCTS.length;

  const onScroll = () => {
    const el = ref.current;
    if (!el) return;
    const cardW = el.scrollWidth / total;
    setActive(Math.min(total - 1, Math.max(0, Math.round(el.scrollLeft / cardW))));
  };

  return (
    <div className="zt-acct-wrap zt-enter">
      <div className="zt-acct-carousel" ref={ref} onScroll={onScroll}>
        {/* Saldo principal (real) */}
        <div className="zt-acct-card zt-balance-card">
          <span className="zt-chip-net">
            <span className={`zt-dot${evmDown ? ' off' : ''}`} />
            {netLabel}
          </span>
          <div className="zt-balance-label">
            {primary ? `${primary.asset} disponible` : 'Saldo disponible'}
          </div>
          <div className="zt-balance-amount">
            {loadingBalance ? (
              <BalanceSkeleton />
            ) : primary ? (
              `${assetSymbol(primary.asset)}${formatAmount(animated)}`
            ) : (
              '₮0.00'
            )}
          </div>
          <div className="zt-balance-sub">{owner}</div>
          {!primary && !loadingBalance && (
            <IonButton size="small" fill="outline" style={{ marginTop: 12 }} onClick={onRecharge}>
              <IonIcon slot="start" icon={addCircleOutline} />
              Recargar
            </IonButton>
          )}
        </div>

        {/* Otros activos (reales) */}
        {others.map((b) => (
          <div className="zt-acct-card zt-balance-card alt" key={b.asset}>
            <span className="zt-chip-net">
              <span className="zt-dot" />
              {b.asset}
            </span>
            <div className="zt-balance-label">{b.asset} disponible</div>
            <div className="zt-balance-amount">
              {assetSymbol(b.asset)}
              {formatAmount(b.available)}
            </div>
            <div className="zt-balance-sub">
              {Number(b.held) > 0 ? `Retenido ${formatAmount(b.held)}` : 'Stablecoin'}
            </div>
          </div>
        ))}

        {/* Productos próximos */}
        {SOON_PRODUCTS.map((p) => (
          <div className="zt-acct-card zt-acct-soon" key={p.key}>
            <span className="zt-soon-badge">
              <IonIcon icon={lockClosedOutline} /> Próximamente
            </span>
            <div className="zt-soon-ic">
              <IonIcon icon={p.icon} />
            </div>
            <div className="zt-soon-title">{p.title}</div>
            <div className="zt-soon-desc">{p.desc}</div>
          </div>
        ))}
      </div>

      <div className="zt-acct-dots">
        {Array.from({ length: total }).map((_, i) => (
          <span key={i} className={`zt-acct-dot${i === active ? ' on' : ''}`} />
        ))}
      </div>
    </div>
  );
}

function AssetRow({ b }: { b: AccountBalance }) {
  const held = Number(b.held);
  return (
    <div className="zt-row">
      <div className="zt-token">
        <div className="zt-token-badge">{assetSymbol(b.asset)}</div>
        <div>
          <div>{b.asset}</div>
          <div className="zt-muted">
            {held > 0 ? `Retenido ${formatAmount(b.held)}` : 'Stablecoin'}
          </div>
        </div>
      </div>
      <strong>{formatAmount(b.available)}</strong>
    </div>
  );
}

const INFLOW = new Set(['receive', 'deposit', 'credit', 'recharge']);

/** Listado embebido de los últimos movimientos en Inicio (+ enlace a todo). */
function RecentMovements({ onSeeAll }: { onSeeAll: () => void }) {
  const payments = usePayments();
  const recent = (payments.data ?? []).slice(0, 5);

  return (
    <>
      <div className="zt-section-head" style={{ marginTop: 18 }}>
        <h3>Movimientos recientes</h3>
        <button
          type="button"
          className="zt-link"
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--zt-indigo)' }}
          onClick={onSeeAll}
        >
          Ver todo
        </button>
      </div>

      {payments.isLoading && !payments.data ? (
        <div className="zt-card zt-stagger">
          <ListSkeleton rows={3} />
        </div>
      ) : recent.length === 0 ? (
        <div className="zt-card zt-enter">
          <div className="zt-empty" style={{ padding: '20px 8px' }}>
            <IonIcon icon={swapHorizontalOutline} />
            <p>Aún no tienes movimientos. Recarga o recibe para empezar.</p>
          </div>
        </div>
      ) : (
        <div className="zt-card zt-stagger">
          {recent.map((p: Payment) => {
            const inflow = INFLOW.has((p.type || '').toLowerCase());
            return (
              <div className="zt-row" key={p.id} role="button" onClick={onSeeAll} style={{ cursor: 'pointer' }}>
                <div className="zt-token">
                  <div className="zt-token-badge" style={{ color: inflow ? 'var(--zt-success)' : 'var(--zt-text-dim)' }}>
                    {inflow ? '↓' : '↑'}
                  </div>
                  <div>
                    <div>{paymentTypeLabel(p.type)}</div>
                    <div className="zt-muted" style={{ fontSize: 12 }}>{formatDate(p.createdAt)}</div>
                  </div>
                </div>
                <strong style={{ color: inflow ? 'var(--zt-success)' : 'var(--zt-text)' }}>
                  {inflow ? '+' : '−'}
                  {formatAmount(p.amount)} {p.asset}
                </strong>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
