import { CloseIcon, HeartIcon, WaIcon } from './Icons.jsx';
import { waLink } from '../lib/whatsapp.js';
import { useLang } from '../i18n/LanguageContext.jsx';

export default function WishlistDrawer({ open, products, onClose, onOpen, onToggle }) {
  const { t, localize } = useLang();
  const items = products.map((product) => localize(product));
  const total = products.reduce((sum, product) => sum + (product.priceNum || 0), 0);
  const lines = items.map((product) => `• ${product.name} (${product.price})`).join('\n');
  const message = t('waWish', { lines, total: total.toLocaleString('en-IN') });

  return (
    <div className={`drawer-overlay${open ? ' open' : ''}`} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <aside className="drawer" role="dialog" aria-label={t('wishTitle')} aria-hidden={!open} inert={!open}>
        <div className="drawer-head">
          <h3>{t('wishTitle')} <span>{products.length}</span></h3>
          <button className="icon-btn" aria-label={t('closeDrawer')} type="button" onClick={onClose}>
            <CloseIcon size={18} />
          </button>
        </div>
        <div className="drawer-body">
          {items.length === 0 ? (
            <div className="drawer-empty">
              <span className="drawer-empty-icon"><HeartIcon size={26} /></span>
              <strong>{t('wishEmpty')}</strong>
              <p>{t('wishEmptyBody')}</p>
            </div>
          ) : items.map((product, index) => (
            <div className="drawer-item" key={product.id}>
              <button type="button" className="drawer-item-main" onClick={() => { onClose(); onOpen(products[index]); }}>
                <img src={product.img} alt="" />
                <span className="drawer-item-info">
                  <span className="drawer-item-title">{product.name}</span>
                  <span className="drawer-item-price">{product.price}</span>
                </span>
              </button>
              <button className="drawer-item-del" type="button" title={t('remove')} aria-label={t('remove')} onClick={() => onToggle(product.id)}>
                <CloseIcon size={16} />
              </button>
            </div>
          ))}
        </div>
        {products.length > 0 && (
          <div className="drawer-foot">
            <div className="drawer-total">
              <span>{t('estimated')}</span>
              <strong>₹{total.toLocaleString('en-IN')}</strong>
            </div>
            <a href={waLink(message)} target="_blank" rel="noopener noreferrer" className="btn-wa btn-lg btn-block">
              <WaIcon size={18} />
              {t('enquireAll')}
            </a>
          </div>
        )}
      </aside>
    </div>
  );
}
