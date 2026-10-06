import { useEffect, useRef, useState } from 'react';
import { CloseIcon, WaIcon } from './Icons.jsx';
import { lineOptionsLabel } from './CartDrawer.jsx';
import { useLang } from '../i18n/LanguageContext.jsx';
import { formatRupees } from '../lib/cart.js';
import { fetchStoreConfig, loadRazorpay, placeOrder, reportPaymentFailed, verifyPayment } from '../lib/orders.js';
import { waLink } from '../lib/whatsapp.js';

const DETAILS_KEY = 'f8h_checkout_details';

const SHOWROOMS = [
  { value: 'Maligaon', key: 'showroomMaligaon' },
  { value: 'Paschim Boragaon', key: 'showroomBoragaon' },
];

const EMPTY_DETAILS = { name: '', phone: '', email: '', address: '', pincode: '', notes: '' };

function readDetails() {
  try {
    return { ...EMPTY_DETAILS, ...JSON.parse(localStorage.getItem(DETAILS_KEY) || '{}'), notes: '' };
  } catch {
    return EMPTY_DETAILS;
  }
}

function saveDetails(details) {
  try {
    const { notes, ...rest } = details;
    localStorage.setItem(DETAILS_KEY, JSON.stringify(rest));
  } catch {
    // Not critical — the form just won't be pre-filled next time
  }
}

export default function Checkout({ open, lines, total, onClose, onComplete }) {
  const { t, localize } = useLang();
  const [details, setDetails] = useState(readDetails);
  const [fulfilment, setFulfilment] = useState('delivery');
  const [showroom, setShowroom] = useState(SHOWROOMS[0].value);
  const [method, setMethod] = useState('offline');
  const [razorpayAvailable, setRazorpayAvailable] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [placed, setPlaced] = useState(null); // { order, waMessage }
  const pendingRef = useRef(null); // reuse an unpaid Razorpay order when the customer retries

  useEffect(() => {
    if (!open) return;
    setError('');
    fetchStoreConfig()
      .then((config) => {
        const available = Boolean(config.razorpay);
        setRazorpayAvailable(available);
        if (available) setMethod((m) => (m === 'offline' ? 'razorpay' : m));
      })
      .catch(() => setRazorpayAvailable(false));
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (event) => {
      if (event.key === 'Escape' && !busy) handleClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  if (!open) return null;

  function handleClose() {
    if (placed) {
      setPlaced(null);
      pendingRef.current = null;
    }
    onClose();
  }

  function update(field) {
    return (e) => setDetails((prev) => ({ ...prev, [field]: e.target.value }));
  }

  function buildWaMessage(order, paymentLabel) {
    const itemLines = lines
      .map((line) => {
        const opts = lineOptionsLabel(line, t);
        return `• ${localize(line.product).name}${opts ? ` (${opts})` : ''} × ${line.qty} — ${formatRupees(line.product.priceNum * line.qty)}`;
      })
      .join('\n');
    const where = fulfilment === 'pickup'
      ? t('waPickupFrom', { showroom })
      : t('waDeliverTo', { address: `${details.address.trim()}, ${details.pincode.trim()}` });
    return t('waOrderPlaced', {
      id: order.id,
      lines: itemLines,
      total: order.totalLabel,
      name: details.name.trim(),
      phone: details.phone.trim(),
      fulfilment: where,
      payment: paymentLabel,
    });
  }

  function finish(order, paymentLabel) {
    saveDetails(details);
    setPlaced({ order, waMessage: buildWaMessage(order, paymentLabel) });
    pendingRef.current = null;
    setBusy(false);
    onComplete();
  }

  async function payWithRazorpay(pending) {
    const Razorpay = await loadRazorpay();
    const { order, accessToken, razorpay } = pending;
    const brand = getComputedStyle(document.documentElement).getPropertyValue('--brand-sage').trim() || '#2E3B2B';

    const checkout = new Razorpay({
      key: razorpay.keyId,
      amount: razorpay.amount,
      currency: razorpay.currency,
      order_id: razorpay.orderId,
      name: 'Furniture8home',
      description: `Order ${order.id}`,
      prefill: { name: details.name.trim(), contact: details.phone.trim(), email: details.email.trim() },
      notes: { orderId: order.id },
      theme: { color: brand },
      handler: async (response) => {
        try {
          const paid = await verifyPayment(order.id, accessToken, response);
          finish(paid, t('waPayPaid'));
        } catch (err) {
          setError(err.message);
          setBusy(false);
        }
      },
      modal: {
        ondismiss: () => {
          setError(t('paymentCancelled'));
          setBusy(false);
        },
      },
    });
    checkout.on('payment.failed', (response) => {
      reportPaymentFailed(order.id, accessToken).catch(() => {});
      setError(t('paymentFailed', { reason: response.error?.description || '' }));
    });
    checkout.open();
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (busy) return;
    setError('');
    setBusy(true);

    const payload = {
      items: lines.map((line) => ({ id: line.id, qty: line.qty, options: { fabric: line.fabric, chaise: line.chaise } })),
      customer: details,
      fulfilment: { type: fulfilment, showroom },
      paymentMethod: method,
    };

    try {
      if (method === 'razorpay') {
        const signature = JSON.stringify(payload);
        if (pendingRef.current?.signature !== signature) {
          pendingRef.current = { ...(await placeOrder(payload)), signature };
        }
        await payWithRazorpay(pendingRef.current);
        return; // finish() or ondismiss clears busy
      }

      const { order } = await placeOrder(payload);
      finish(order, method === 'whatsapp' ? t('waPayWhatsapp') : t('waPayOffline'));
      if (method === 'whatsapp') {
        // Opened from the success screen too, in case the browser blocks this popup
        window.open(waLink(buildWaMessage(order, t('waPayWhatsapp'))), '_blank', 'noopener');
      }
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  if (placed) {
    const { order, waMessage } = placed;
    const message = order.paymentStatus === 'paid' ? t('orderPaid') : order.paymentMethod === 'whatsapp' ? t('orderWhatsapp') : t('orderOffline');
    return (
      <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="orderDoneTitle">
        <div className="modal checkout checkout-done">
          <button className="modal-close" aria-label={t('closeModal')} type="button" onClick={handleClose}><CloseIcon /></button>
          <div className="checkout-done-body">
            <span className="checkout-done-icon" aria-hidden="true">✓</span>
            <h2 id="orderDoneTitle">{t('orderPlacedTitle', { name: details.name.trim().split(' ')[0] })}</h2>
            <p>{message}</p>
            <div className="checkout-order-id">
              <span>{t('orderNumber')}</span>
              <strong>{order.id}</strong>
              <span>{order.totalLabel}</span>
            </div>
            <div className="checkout-done-actions">
              <a href={waLink(waMessage)} target="_blank" rel="noopener noreferrer" className="btn-wa btn-lg btn-block">
                <WaIcon size={18} /> {t('sendOnWhatsapp')}
              </a>
              <button type="button" className="btn-secondary btn-lg btn-block" onClick={handleClose}>{t('continueShopping')}</button>
            </div>
            <p className="checkout-hint">{t('orderQuestions')}</p>
          </div>
        </div>
      </div>
    );
  }

  const submitLabel = busy
    ? t('placing')
    : method === 'razorpay'
      ? t('placeOrderPay', { total: formatRupees(total) })
      : method === 'whatsapp'
        ? t('placeOrderWa')
        : t('placeOrder');

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="checkoutTitle" onClick={(e) => { if (e.target === e.currentTarget && !busy) handleClose(); }}>
      <div className="modal checkout">
        <button className="modal-close" aria-label={t('closeModal')} type="button" onClick={handleClose} disabled={busy}><CloseIcon /></button>
        <form className="checkout-grid" onSubmit={handleSubmit}>
          <div className="checkout-form">
            <h2 id="checkoutTitle" className="checkout-title">{t('checkout')}</h2>

            <fieldset className="checkout-section">
              <legend>{t('contactDetails')}</legend>
              <label className="field">
                <span>{t('fieldName')}</span>
                <input required autoComplete="name" maxLength={80} value={details.name} onChange={update('name')} />
              </label>
              <div className="field-row">
                <label className="field">
                  <span>{t('fieldPhone')}</span>
                  <div className="field-prefix">
                    <em>+91</em>
                    <input
                      required
                      type="tel"
                      inputMode="numeric"
                      autoComplete="tel-national"
                      pattern="[6-9][0-9]{9}"
                      maxLength={10}
                      value={details.phone}
                      onChange={(e) => setDetails((prev) => ({ ...prev, phone: e.target.value.replace(/\D/g, '') }))}
                    />
                  </div>
                </label>
                <label className="field">
                  <span>{t('fieldEmail')}</span>
                  <input type="email" autoComplete="email" maxLength={120} value={details.email} onChange={update('email')} />
                </label>
              </div>
            </fieldset>

            <fieldset className="checkout-section">
              <legend>{t('receiveTitle')}</legend>
              <div className="choice-list">
                <label className={`choice${fulfilment === 'delivery' ? ' active' : ''}`}>
                  <input type="radio" name="fulfilment" value="delivery" checked={fulfilment === 'delivery'} onChange={() => setFulfilment('delivery')} />
                  <span><strong>{t('homeDelivery')}</strong><small>{t('homeDeliverySub')}</small></span>
                </label>
                <label className={`choice${fulfilment === 'pickup' ? ' active' : ''}`}>
                  <input type="radio" name="fulfilment" value="pickup" checked={fulfilment === 'pickup'} onChange={() => setFulfilment('pickup')} />
                  <span><strong>{t('pickup')}</strong><small>{t('pickupSub')}</small></span>
                </label>
              </div>

              {fulfilment === 'delivery' ? (
                <>
                  <label className="field">
                    <span>{t('fieldAddress')}</span>
                    <textarea required rows={2} autoComplete="street-address" maxLength={400} value={details.address} onChange={update('address')} />
                  </label>
                  <label className="field field-short">
                    <span>{t('fieldPincode')}</span>
                    <input
                      required
                      inputMode="numeric"
                      autoComplete="postal-code"
                      pattern="[0-9]{6}"
                      maxLength={6}
                      value={details.pincode}
                      onChange={(e) => setDetails((prev) => ({ ...prev, pincode: e.target.value.replace(/\D/g, '') }))}
                    />
                  </label>
                </>
              ) : (
                <div className="swatches">
                  {SHOWROOMS.map((room) => (
                    <button key={room.value} type="button" aria-pressed={showroom === room.value} className={`swatch${showroom === room.value ? ' active' : ''}`} onClick={() => setShowroom(room.value)}>
                      {t(room.key)}
                    </button>
                  ))}
                </div>
              )}

              <label className="field">
                <span>{t('fieldNotes')}</span>
                <textarea rows={2} maxLength={500} placeholder={t('notesPlaceholder')} value={details.notes} onChange={update('notes')} />
              </label>
            </fieldset>

            <fieldset className="checkout-section">
              <legend>{t('payTitle')}</legend>
              <div className="choice-list">
                {razorpayAvailable && (
                  <label className={`choice${method === 'razorpay' ? ' active' : ''}`}>
                    <input type="radio" name="method" value="razorpay" checked={method === 'razorpay'} onChange={() => setMethod('razorpay')} />
                    <span><strong>{t('payOnline')}</strong><small>{t('payOnlineSub')}</small></span>
                  </label>
                )}
                <label className={`choice${method === 'offline' ? ' active' : ''}`}>
                  <input type="radio" name="method" value="offline" checked={method === 'offline'} onChange={() => setMethod('offline')} />
                  <span><strong>{t('payOffline')}</strong><small>{t('payOfflineSub')}</small></span>
                </label>
                <label className={`choice${method === 'whatsapp' ? ' active' : ''}`}>
                  <input type="radio" name="method" value="whatsapp" checked={method === 'whatsapp'} onChange={() => setMethod('whatsapp')} />
                  <span><strong>{t('payWhatsapp')}</strong><small>{t('payWhatsappSub')}</small></span>
                </label>
              </div>
            </fieldset>
          </div>

          <aside className="checkout-summary">
            <h3>{t('orderSummary')}</h3>
            <ul>
              {lines.map((line) => {
                const item = localize(line.product);
                return (
                  <li key={line.key}>
                    <span className="checkout-thumb">
                      <img src={item.img} alt="" />
                      <b>{line.qty}</b>
                    </span>
                    <span className="checkout-line-info">
                      <span>{item.name}</span>
                      <small>{lineOptionsLabel(line, t)}</small>
                    </span>
                    <span className="checkout-line-price">{formatRupees(line.product.priceNum * line.qty)}</span>
                  </li>
                );
              })}
            </ul>
            <div className="drawer-total">
              <span>{t('subtotal')}</span>
              <strong>{formatRupees(total)}</strong>
            </div>
            <p className="checkout-hint">{t('gst')}</p>

            {error && <p className="checkout-error" role="alert">{error}</p>}

            <button type="submit" className={`${method === 'whatsapp' ? 'btn-wa' : 'btn-primary'} btn-lg btn-block`} disabled={busy || lines.length === 0}>
              {method === 'whatsapp' && <WaIcon size={18} />}
              {submitLabel}
            </button>
          </aside>
        </form>
      </div>
    </div>
  );
}
