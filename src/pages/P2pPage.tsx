import { useMemo, useState } from 'react';
import {
  IonButton,
  IonContent,
  IonIcon,
  IonPage,
  IonSegment,
  IonSegmentButton,
  IonLabel,
  IonSpinner,
  useIonToast,
} from '@ionic/react';
import {
  addCircleOutline,
  swapHorizontalOutline,
  copyOutline,
  closeCircleOutline,
  checkmarkCircleOutline,
  storefrontOutline,
} from 'ionicons/icons';
import ZenttoHeader from '../components/ZenttoHeader';
import PublishOfferModal from '../components/PublishOfferModal';
import {
  useCancelP2pOrder,
  useCancelP2pTrade,
  useConfirmP2pTrade,
  useMyP2pOrders,
  useP2pOrders,
  useP2pTrades,
  useTakeP2pOrder,
} from '../hooks/useP2p';
import { useAuth } from '../auth/AuthContext';
import { ApiError } from '../api/client';
import { formatAmount, formatDate, formatVes, shortenAddress } from '../lib/format';
import { copyText } from '../lib/clipboard';
import type { P2pOrder, P2pSide, P2pTrade } from '../api/types';

type Tab = 'book' | 'mine' | 'trades';

const ORDER_STATUS: Record<string, { label: string; color: string }> = {
  open: { label: 'Abierta', color: 'var(--zt-success)' },
  taken: { label: 'Tomada', color: 'var(--zt-warning)' },
  cancelled: { label: 'Cancelada', color: 'var(--zt-text-dim)' },
};

const TRADE_STATUS: Record<string, { label: string; color: string }> = {
  pending: { label: 'Pendiente', color: 'var(--zt-warning)' },
  completed: { label: 'Completado', color: 'var(--zt-success)' },
  cancelled: { label: 'Cancelado', color: 'var(--zt-text-dim)' },
};

export default function P2pPage() {
  const [present] = useIonToast();
  const { user } = useAuth();

  const [tab, setTab] = useState<Tab>('book');
  // En el libro elijo qué quiero hacer YO: comprar muestra ofertas de venta y viceversa.
  const [intent, setIntent] = useState<'buy' | 'sell'>('buy');
  const [showPublish, setShowPublish] = useState(false);

  // Para comprar cripto, miro las ofertas de venta (side=sell); para vender, las de compra.
  const oppositeSide: P2pSide = intent === 'buy' ? 'sell' : 'buy';

  const book = useP2pOrders({ side: oppositeSide });
  const mine = useMyP2pOrders();
  const trades = useP2pTrades();

  const takeMut = useTakeP2pOrder();
  const cancelOrderMut = useCancelP2pOrder();
  const confirmTradeMut = useConfirmP2pTrade();
  const cancelTradeMut = useCancelP2pTrade();

  const offers = useMemo(
    () => (book.data ?? []).filter((o) => o.makerUserId !== user?.id),
    [book.data, user?.id],
  );

  async function copy(text: string, label = 'Dato copiado') {
    const ok = await copyText(text);
    present({ message: ok ? label : 'No se pudo copiar', duration: 1200, color: ok ? 'success' : 'danger' });
  }

  function errMsg(err: unknown, fallback: string) {
    return err instanceof ApiError ? err.message : fallback;
  }

  async function onTake(order: P2pOrder) {
    try {
      await takeMut.mutateAsync(order.id);
      present({ message: 'Oferta tomada. Revisa "Mis trades".', duration: 2000, color: 'success' });
      setTab('trades');
    } catch (err) {
      present({ message: errMsg(err, 'No se pudo tomar la oferta'), duration: 2400, color: 'danger' });
    }
  }

  async function onCancelOrder(id: string) {
    try {
      await cancelOrderMut.mutateAsync(id);
      present({ message: 'Oferta cancelada', duration: 1600, color: 'success' });
    } catch (err) {
      present({ message: errMsg(err, 'No se pudo cancelar'), duration: 2200, color: 'danger' });
    }
  }

  async function onConfirmTrade(id: string) {
    try {
      await confirmTradeMut.mutateAsync(id);
      present({ message: 'Pago confirmado. Cripto liberado.', duration: 2000, color: 'success' });
    } catch (err) {
      present({ message: errMsg(err, 'No se pudo confirmar'), duration: 2400, color: 'danger' });
    }
  }

  async function onCancelTrade(id: string) {
    try {
      await cancelTradeMut.mutateAsync(id);
      present({ message: 'Trade cancelado', duration: 1600, color: 'success' });
    } catch (err) {
      present({ message: errMsg(err, 'No se pudo cancelar el trade'), duration: 2200, color: 'danger' });
    }
  }

  return (
    <IonPage>
      <ZenttoHeader title="P2P" />
      <IonContent className="zt-page" fullscreen>
        <div className="zt-screen">
          <IonSegment value={tab} onIonChange={(e) => setTab((e.detail.value as Tab) ?? 'book')}>
            <IonSegmentButton value="book">
              <IonLabel>Mercado</IonLabel>
            </IonSegmentButton>
            <IonSegmentButton value="mine">
              <IonLabel>Mis órdenes</IonLabel>
            </IonSegmentButton>
            <IonSegmentButton value="trades">
              <IonLabel>Mis trades</IonLabel>
            </IonSegmentButton>
          </IonSegment>

          {/* ─────────────── Mercado (order book) ─────────────── */}
          {tab === 'book' && (
            <>
              <div style={{ marginTop: 14 }}>
                <IonSegment
                  value={intent}
                  onIonChange={(e) => setIntent((e.detail.value as 'buy' | 'sell') ?? 'buy')}
                >
                  <IonSegmentButton value="buy">
                    <IonLabel>Comprar</IonLabel>
                  </IonSegmentButton>
                  <IonSegmentButton value="sell">
                    <IonLabel>Vender</IonLabel>
                  </IonSegmentButton>
                </IonSegment>
              </div>

              <IonButton expand="block" fill="outline" style={{ marginTop: 14 }} onClick={() => setShowPublish(true)}>
                <IonIcon slot="start" icon={addCircleOutline} />
                Publicar oferta
              </IonButton>

              <p className="zt-muted" style={{ marginTop: 12 }}>
                {intent === 'buy'
                  ? 'Ofertas de usuarios que venden cripto. Toma una para comprar.'
                  : 'Ofertas de usuarios que compran cripto. Toma una para vender.'}
              </p>

              {book.isLoading && !book.data ? (
                <div style={{ textAlign: 'center', padding: 28 }}>
                  <IonSpinner name="crescent" />
                </div>
              ) : offers.length === 0 ? (
                <div className="zt-empty">
                  <IonIcon icon={storefrontOutline} />
                  <p>No hay ofertas {intent === 'buy' ? 'de venta' : 'de compra'} por ahora.</p>
                </div>
              ) : (
                offers.map((o) => (
                  <P2pOrderCard
                    key={o.id}
                    order={o}
                    intent={intent}
                    onCopyMethod={(t) => copy(t, 'Datos de pago copiados')}
                    onTake={() => onTake(o)}
                    taking={takeMut.isPending}
                  />
                ))
              )}
            </>
          )}

          {/* ─────────────── Mis órdenes ─────────────── */}
          {tab === 'mine' && (
            <>
              <IonButton expand="block" style={{ marginTop: 14 }} onClick={() => setShowPublish(true)}>
                <IonIcon slot="start" icon={addCircleOutline} />
                Publicar oferta
              </IonButton>

              {mine.isLoading && !mine.data ? (
                <div style={{ textAlign: 'center', padding: 28 }}>
                  <IonSpinner name="crescent" />
                </div>
              ) : (mine.data ?? []).length === 0 ? (
                <div className="zt-empty">
                  <IonIcon icon={swapHorizontalOutline} />
                  <p>No tienes ofertas publicadas.</p>
                </div>
              ) : (
                (mine.data ?? []).map((o) => {
                  const st = ORDER_STATUS[o.status] ?? { label: o.status, color: 'var(--zt-text-dim)' };
                  return (
                    <div className="zt-card" key={o.id}>
                      <div className="zt-row" style={{ borderBottom: 'none' }}>
                        <span className="zt-token">
                          <span
                            className="zt-status-chip"
                            style={{ color: o.side === 'sell' ? 'var(--zt-danger)' : 'var(--zt-success)' }}
                          >
                            {o.side === 'sell' ? 'Vendo' : 'Compro'}
                          </span>
                          <strong>
                            {formatAmount(o.amount, 6)} {o.asset}
                          </strong>
                        </span>
                        <span className="zt-status-chip" style={{ color: st.color }}>
                          {st.label}
                        </span>
                      </div>
                      <div className="zt-row">
                        <span className="zt-muted">Precio</span>
                        <span>{formatVes(o.priceVes)} / {o.asset}</span>
                      </div>
                      {o.paymentMethod && (
                        <div className="zt-row">
                          <span className="zt-muted">Pago</span>
                          <span style={{ textAlign: 'right' }}>{o.paymentMethod}</span>
                        </div>
                      )}
                      <div className="zt-row" style={{ borderBottom: 'none' }}>
                        <span className="zt-muted">{formatDate(o.createdAt)}</span>
                        {o.status === 'open' && (
                          <IonButton
                            fill="clear"
                            size="small"
                            color="danger"
                            disabled={cancelOrderMut.isPending}
                            onClick={() => onCancelOrder(o.id)}
                          >
                            <IonIcon slot="start" icon={closeCircleOutline} />
                            Cancelar
                          </IonButton>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </>
          )}

          {/* ─────────────── Mis trades ─────────────── */}
          {tab === 'trades' && (
            <>
              {trades.isLoading && !trades.data ? (
                <div style={{ textAlign: 'center', padding: 28 }}>
                  <IonSpinner name="crescent" />
                </div>
              ) : (trades.data ?? []).length === 0 ? (
                <div className="zt-empty">
                  <IonIcon icon={swapHorizontalOutline} />
                  <p>No tienes trades todavía.</p>
                </div>
              ) : (
                (trades.data ?? []).map((t) => (
                  <P2pTradeCard
                    key={t.id}
                    trade={t}
                    isSeller={t.sellerUserId === user?.id}
                    confirming={confirmTradeMut.isPending}
                    cancelling={cancelTradeMut.isPending}
                    onConfirm={() => onConfirmTrade(t.id)}
                    onCancel={() => onCancelTrade(t.id)}
                  />
                ))
              )}
            </>
          )}
        </div>

        <PublishOfferModal
          isOpen={showPublish}
          onDismiss={() => setShowPublish(false)}
          onPublished={() => {
            setShowPublish(false);
            setTab('mine');
          }}
        />
      </IonContent>
    </IonPage>
  );
}

function P2pOrderCard({
  order,
  intent,
  onCopyMethod,
  onTake,
  taking,
}: {
  order: P2pOrder;
  intent: 'buy' | 'sell';
  onCopyMethod: (text: string) => void;
  onTake: () => void;
  taking: boolean;
}) {
  const total = Number(order.amount) * Number(order.priceVes);
  return (
    <div className="zt-card">
      <div className="zt-row" style={{ borderBottom: 'none' }}>
        <span className="zt-token">
          <span className="zt-token-badge">{order.asset.slice(0, 4)}</span>
          <span>
            <strong style={{ display: 'block' }}>
              {formatAmount(order.amount, 6)} {order.asset}
            </strong>
            <span className="zt-muted">{order.makerEmail || shortenAddress(order.makerUserId)}</span>
          </span>
        </span>
        <span style={{ textAlign: 'right' }}>
          <strong style={{ display: 'block' }}>{formatVes(order.priceVes)}</strong>
          <span className="zt-muted">por {order.asset}</span>
        </span>
      </div>
      <div className="zt-row">
        <span className="zt-muted">Total estimado</span>
        <span>{formatVes(total)}</span>
      </div>
      {order.paymentMethod && (
        <div className="zt-row">
          <span className="zt-muted">Pago</span>
          <button
            type="button"
            className="zt-link"
            style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}
            onClick={() => onCopyMethod(order.paymentMethod as string)}
          >
            {order.paymentMethod}
            <IonIcon icon={copyOutline} />
          </button>
        </div>
      )}
      <IonButton expand="block" style={{ marginTop: 8 }} disabled={taking} onClick={onTake}>
        {taking ? 'Procesando…' : intent === 'buy' ? 'Comprar' : 'Vender'}
      </IonButton>
    </div>
  );
}

function P2pTradeCard({
  trade,
  isSeller,
  confirming,
  cancelling,
  onConfirm,
  onCancel,
}: {
  trade: P2pTrade;
  isSeller: boolean;
  confirming: boolean;
  cancelling: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const st = TRADE_STATUS[trade.status] ?? { label: trade.status, color: 'var(--zt-text-dim)' };
  const total = Number(trade.amount) * Number(trade.priceVes);
  return (
    <div className="zt-card">
      <div className="zt-row" style={{ borderBottom: 'none' }}>
        <span className="zt-token">
          <span
            className="zt-status-chip"
            style={{ color: isSeller ? 'var(--zt-danger)' : 'var(--zt-success)' }}
          >
            {isSeller ? 'Vendes' : 'Compras'}
          </span>
          <strong>
            {formatAmount(trade.amount, 6)} {trade.asset}
          </strong>
        </span>
        <span className="zt-status-chip" style={{ color: st.color }}>
          {st.label}
        </span>
      </div>
      <div className="zt-row">
        <span className="zt-muted">Precio</span>
        <span>{formatVes(trade.priceVes)} / {trade.asset}</span>
      </div>
      <div className="zt-row">
        <span className="zt-muted">Total</span>
        <span>{formatVes(total)}</span>
      </div>
      <div className="zt-row" style={{ borderBottom: 'none' }}>
        <span className="zt-muted">{formatDate(trade.createdAt)}</span>
        {trade.status === 'pending' && (
          <span style={{ display: 'flex', gap: 6 }}>
            <IonButton
              fill="clear"
              size="small"
              color="medium"
              disabled={cancelling}
              onClick={onCancel}
            >
              Cancelar
            </IonButton>
            {isSeller && (
              <IonButton size="small" disabled={confirming} onClick={onConfirm}>
                <IonIcon slot="start" icon={checkmarkCircleOutline} />
                Confirmar pago
              </IonButton>
            )}
          </span>
        )}
      </div>
      {trade.status === 'pending' && !isSeller && (
        <p className="zt-muted" style={{ margin: '4px 0 0' }}>
          Paga el fiat al vendedor por el método acordado. Cuando confirme, recibirás el cripto.
        </p>
      )}
    </div>
  );
}
