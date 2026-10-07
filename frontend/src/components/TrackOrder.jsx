import { useEffect, useState } from 'react';
import OrderPass from './OrderPass.jsx';
import { CloseIcon, WaIcon } from './Icons.jsx';
import { useLang } from '../i18n/LanguageContext.jsx';
import { formatRupees } from '../lib/cart.js';
import { trackOrder } from '../lib/orders.js';
import { waLink } from '../lib/whatsapp.js';

const PHONE_KEY = 'f8h_checkout_details';

function savedPhone() {
  try {
    return JSON.parse(localStorage.getItem(PHONE_KEY) || '{}').phone || '';
  } catch {
    return '';
  }
}

// The steps a customer sees, depending on how they get their order
function stepsFor(order) {
  const pickup = order.fulfilment?.type === 'pickup';
  return pickup
    ? [['new', 'trackPlaced'], ['confirmed', 'trackConfirmed'], ['ready', 'trackReadyPickup'], ['delivered', 'trackCollected']]
    : [['new', 'trackPlaced'], ['confirmed', 'trackConfirmed'], ['ready', 'trackReady'], ['out_for_delivery', 'trackOnTheWay'], ['delivered', 'trackDelivered']];
}

function formatWhen(iso, lang) {
  return new Date(iso).toLocaleString(lang === 'as' ? 'as-IN' : 'en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });
}

export default function TrackOrder({ open, initialOrderId = '', onClose }) {
  const { t, lang } = useLang();
  const [orderId, setOrderId] = useState(initialOrderId);
  const [phone, setPhone] = useState(savedPhone);
  const [order, setOrder] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open) setOrderId((current) => initialOrderId || current);
  }, [open, initialOrderId]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (event) => { if (event.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  async function handleSubmit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      setOrder(await trackOrder(orderId.trim().toUpperCase(), phone.trim()));
    } catch (err) {
      setOrder(null);
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  const steps = order ? stepsFor(order) : [];
  const reachedAt = Object.fromEntries((order?.statusHistory || []).map((h) => [h.status, h.at]));
  const currentIndex = order ? steps.findIndex(([status]) => status === order.status) : -1;
  // A status the timeline doesn't show (e.g. "ready" skipped) counts as reaching everything before it
  const progress = order
    ? Math.max(currentIndex, ...steps.map(([status], i) => (reachedAt[status] ? i : -1)))
    : -1;
  const cancelled = order?.status === 'cancelled';

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="trackTitle" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal track">
        <button className="modal-close" aria-label={t('closeModal')} type="button" onClick={onClose}><CloseIcon /></button>
        <div className="track-body">
          <h2 id="trackTitle">{t('trackTitle')}</h2>
          <p className="track-sub">{t('trackSub')}</p>

          <form className="track-form" onSubmit={handleSubmit}>
            <label className="field">
              <span>{t('trackOrderNo')}</span>
              <input
                value={orderId}
                onChange={(e) => setOrderId(e.target.value.toUpperCase())}
                placeholder="F8H-261007-A1B2C3"
                autoCapitalize="characters"
                spellCheck={false}
                required
              />
            </label>
            <label className="field">
              <span>{t('fieldPhone')}</span>
              <div className="field-prefix">
                <em>+91</em>
                <input
                  type="tel"
                  inputMode="numeric"
                  maxLength={10}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                  required
                />
              </div>
            </label>
            <button type="submit" className="btn-primary btn-lg" disabled={busy}>{busy ? t('trackLooking') : t('trackButton')}</button>
          </form>
          {error && <p className="checkout-error" role="alert">{error}</p>}

          {order && (
            <div className="track-result">
              <div className="track-head">
                <div>
                  <span className="track-label">{t('orderNumber')}</span>
                  <strong>{order.id}</strong>
                </div>
                <span className={`track-badge${cancelled ? ' is-cancelled' : order.status === 'delivered' ? ' is-done' : ''}`}>
                  {cancelled ? t('trackCancelled') : t(steps[Math.max(progress, 0)][1])}
                </span>
              </div>

              {cancelled ? (
                <p className="track-cancelled">{t('trackCancelledBody')}</p>
              ) : (
                <ol className="track-steps">
                  {steps.map(([status, label], i) => (
                    <li key={status} className={i < progress ? 'done' : i === progress ? 'current' : ''}>
                      <span className="track-dot" aria-hidden="true" />
                      <span className="track-step-text">
                        <strong>{t(label)}</strong>
                        {reachedAt[status] && <small>{formatWhen(reachedAt[status], lang)}</small>}
                      </span>
                    </li>
                  ))}
                </ol>
              )}

              <ul className="track-items">
                {order.items.map((item) => (
                  <li key={`${item.id}-${item.options?.fabric}-${item.options?.chaise}`}>
                    <img src={item.img} alt="" />
                    <span>{item.name} × {item.qty}</span>
                    <b>{formatRupees(item.lineTotal)}</b>
                  </li>
                ))}
                {order.discount && (
                  <li className="track-discount"><span>{t('couponDiscount', { code: order.discount.code })}</span><b>−{formatRupees(order.discount.amount)}</b></li>
                )}
                <li className="track-total"><span>{t('subtotal')}</span><b>{order.totalLabel}</b></li>
              </ul>

              {!cancelled && order.status !== 'delivered' && <OrderPass order={order} />}

              <a className="btn-wa btn-block" href={waLink(t('trackWa', { id: order.id }))} target="_blank" rel="noopener noreferrer">
                <WaIcon size={16} /> {t('trackHelp')}
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
