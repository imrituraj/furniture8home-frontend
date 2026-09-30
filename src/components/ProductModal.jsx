import { CHAISE_OPTIONS, FABRICS } from '../data/content.js';
import { CloseIcon, HeartIcon, WaIcon } from './Icons.jsx';
import ShareButton from './ShareButton.jsx';
import { waLink } from '../lib/whatsapp.js';
import { useLang } from '../i18n/LanguageContext.jsx';

const FABRIC_KEY = {
  'Royal Navy': 'fabricNavy',
  'Charcoal Grey': 'fabricCharcoal',
  'Forest Sage': 'fabricSage',
  'Ivory Cream': 'fabricIvory',
  'Mustard Gold': 'fabricMustard',
};

const CHAISE_KEY = {
  'Right Facing Chaise': 'chaiseRight',
  'Left Facing Chaise': 'chaiseLeft',
  'Custom Measurement': 'chaiseCustom',
};

const CAT_KEY = {
  Sectionals: 'catSectionals',
  'Wooden Sofas': 'catWooden',
  Accent: 'catAccent',
  Dining: 'catDining',
  Wingback: 'catWing',
};

export default function ProductModal({ product, fabric, chaise, saved, onClose, onFabric, onChaise, onToggleWish }) {
  const { lang, t, localize } = useLang();
  if (!product) return null;

  const item = localize(product);
  const isStockOut = product.inStock === false;
  const fabricLabel = t(FABRIC_KEY[fabric] || 'fabricNavy');
  const chaiseLabel = t(CHAISE_KEY[chaise] || 'chaiseRight');
  const specs = [`${t('fabricTitle')}: ${fabricLabel}`];
  if (product.cat === 'Sectionals') specs.push(`${t('chaiseTitle')}: ${chaiseLabel}`);
  
  const orderText = isStockOut
    ? (lang === 'as'
      ? `নমস্কাৰ Furniture8home, মই "${item.name}" (${product.price}, ${specs.join(', ')}) ৰ বিষয়ে জানিব বিচাৰোঁ। বৰ্তমান ষ্টক শেষ বুলি দেখা গৈছে, মই কাষ্টম অৰ্ডাৰ দিব পাৰিমনে?`
      : `Hi Furniture8home, I would like to place a custom pre-order for "${item.name}" (${product.price}, ${specs.join(', ')}) which is currently marked as out of stock.`)
    : t('waOrder', { name: item.name, price: product.price, specs: specs.join(', ') });

  return (
    <div className="modal-overlay open" role="dialog" aria-modal="true" aria-label={item.name} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-container">
        <button className="modal-close-btn" aria-label={t('closeModal')} type="button" onClick={onClose}><CloseIcon /></button>
        <div className="modal-content-grid">
          <div className="modal-gallery">
            <div className="modal-main-img-wrap" onClick={() => window.open(product.img, '_blank', 'noopener')} role="button" tabIndex={0}>
              <img src={product.img} alt={item.name} />
            </div>
            <div className="modal-gallery-note">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /><line x1="11" y1="8" x2="11" y2="14" /><line x1="8" y1="11" x2="14" y2="11" /></svg>
              {t('zoomNote')}
            </div>
          </div>
          <div className="modal-info">
            <div className="modal-breadcrumbs">{t('sku', { cat: t(CAT_KEY[product.cat] || 'catAccent'), id: product.id })}</div>
            {isStockOut && (
              <div className="modal-stockout-banner">
                <span>⚠️</span>
                <span>{lang === 'as' ? 'বৰ্তমান ষ্টক শেষ — কাষ্টম অৰ্ডাৰত উপলব্ধ' : 'Currently Out of Stock — Available on Custom Order'}</span>
              </div>
            )}
            <h2 className="modal-title">{item.name}</h2>
            <div className="modal-price-row">
              <div className="modal-price">{product.price}</div>
              <div className="modal-price-tax">{t('gst')}</div>
            </div>
            <p className="modal-desc">{item.desc}</p>

            <div className="custom-section">
              <div className="custom-title">{t('fabricTitle')} <span>{fabricLabel}</span></div>
              <div className="swatches">
                {FABRICS.map((swatch) => (
                  <button key={swatch.name} type="button" className={`swatch-btn${fabric === swatch.name ? ' active' : ''}`} onClick={() => onFabric(swatch.name)}>
                    <span className="color-dot" style={{ background: swatch.hex }} /> {t(FABRIC_KEY[swatch.name])}
                  </button>
                ))}
              </div>
            </div>

            {product.cat === 'Sectionals' && (
              <div className="custom-section">
                <div className="custom-title">{t('chaiseTitle')} <span>{chaiseLabel}</span></div>
                <div className="swatches">
                  {CHAISE_OPTIONS.map((option) => (
                    <button key={option} type="button" className={`swatch-btn${chaise === option ? ' active' : ''}`} onClick={() => onChaise(option)}>
                      {t(CHAISE_KEY[option])}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <table className="specs-table">
              <tbody>
                <tr><td>{t('dims')}</td><td>{product.dims}</td></tr>
                <tr><td>{t('materials')}</td><td>{product.material}</td></tr>
                <tr><td>{t('warranty')}</td><td>{t('warrantyVal')}</td></tr>
                <tr><td>{t('delivery')}</td><td>{t('deliveryVal')}</td></tr>
              </tbody>
            </table>

            <div className="modal-actions">
              <a href={waLink(orderText)} target="_blank" rel="noopener noreferrer" className="btn-wa-modal">
                <WaIcon size={20} />
                <span>{isStockOut ? (lang === 'as' ? 'কাষ্টম অৰ্ডাৰৰ বাবে যোগাযোগ কৰক' : 'Enquire for Custom Restock / Order') : t('enquireOrder')}</span>
              </a>
              <div className="modal-action-row">
                <ShareButton product={item} className="btn-call-modal" label={t('share')} />
                <a href={waLink(t('waGeneral'))} target="_blank" rel="noopener noreferrer" className="btn-call-modal" style={{ flex: 1 }}>
                  {t('whatsappNumber')}
                </a>
                <button className="btn-call-modal" type="button" style={{ flex: 1 }} onClick={() => onToggleWish(product.id)}>
                  <HeartIcon filled={saved} size={16} />
                  {saved ? t('saved') : t('save')}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
