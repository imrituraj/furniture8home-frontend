import { CartIcon, CloseIcon, TruckIcon } from './Icons.jsx';
import { FABRIC_KEY, CHAISE_KEY } from './ProductModal.jsx';
import { useLang } from '../i18n/LanguageContext.jsx';
import { formatRupees } from '../lib/cart.js';

export function lineOptionsLabel(line, t) {
  const parts = [];
  if (line.fabric) parts.push(t(FABRIC_KEY[line.fabric] || 'fabricNavy'));
  if (line.chaise) parts.push(t(CHAISE_KEY[line.chaise] || 'chaiseRight'));
  return parts.join(' · ');
}

export default function CartDrawer({ open, lines, total, canCheckout, onClose, onOpen, onQty, onRemove, onCheckout }) {
  const { t, localize } = useLang();
  const count = lines.reduce((sum, line) => sum + line.qty, 0);

  return (
    <div className={`drawer-overlay${open ? ' open' : ''}`} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <aside className="drawer" role="dialog" aria-label={t('cartTitle')} aria-hidden={!open} inert={!open}>
        <div className="drawer-head">
          <h3>{t('cartTitle')} <span>{count}</span></h3>
          <button className="icon-btn" aria-label={t('closeDrawer')} type="button" onClick={onClose}>
            <CloseIcon size={18} />
          </button>
        </div>
        <div className="drawer-body">
          {lines.length === 0 ? (
            <div className="drawer-empty">
              <span className="drawer-empty-icon"><CartIcon size={26} /></span>
              <strong>{t('cartEmpty')}</strong>
              <p>{t('cartEmptyBody')}</p>
            </div>
          ) : lines.map((line) => {
            const item = localize(line.product);
            return (
              <div className="drawer-item cart-item" key={line.key}>
                <button type="button" className="drawer-item-main" onClick={() => { onClose(); onOpen(line.product); }}>
                  <img src={item.img} alt="" />
                  <span className="drawer-item-info">
                    <span className="drawer-item-title">{item.name}</span>
                    <span className="cart-item-opts">{lineOptionsLabel(line, t)}</span>
                    {line.available ? (
                      <span className="drawer-item-price">{formatRupees(line.product.priceNum * line.qty)}</span>
                    ) : (
                      <span className="cart-item-warn">{t('cartUnavailable')}</span>
                    )}
                  </span>
                </button>
                <div className="cart-item-side">
                  <div className="qty" role="group" aria-label={item.name}>
                    <button type="button" aria-label={t('qtyDecrease')} disabled={line.qty <= 1} onClick={() => onQty(line.key, line.qty - 1)}>−</button>
                    <span aria-live="polite">{line.qty}</span>
                    <button type="button" aria-label={t('qtyIncrease')} disabled={line.qty >= 20} onClick={() => onQty(line.key, line.qty + 1)}>+</button>
                  </div>
                  <button className="drawer-item-del" type="button" title={t('remove')} aria-label={t('remove')} onClick={() => onRemove(line.key)}>
                    <CloseIcon size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
        {lines.length > 0 && (
          <div className="drawer-foot">
            <div className="drawer-total">
              <span>{t('subtotal')}</span>
              <strong>{formatRupees(total)}</strong>
            </div>
            <p className="cart-delivery-note"><TruckIcon size={16} /> {t('freeDelivery')}</p>
            <button type="button" className="btn-primary btn-lg btn-block" disabled={!canCheckout} onClick={onCheckout}>
              {t('checkout')}
            </button>
          </div>
        )}
      </aside>
    </div>
  );
}
