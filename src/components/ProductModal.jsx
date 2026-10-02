import { useEffect, useRef } from 'react';
import { CHAISE_OPTIONS, FABRICS } from '../data/content.js';
import { CloseIcon, HeartIcon, PhoneIcon, StarIcon, WaIcon } from './Icons.jsx';
import ShareButton from './ShareButton.jsx';
import { CAT_TITLE } from './Catalog.jsx';
import { TEL_LINK, waLink } from '../lib/whatsapp.js';
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

export default function ProductModal({ product, related = [], fabric, chaise, saved, onClose, onOpen, onFabric, onChaise, onToggleWish }) {
  const { t, localize } = useLang();
  const scrollRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 });
  }, [product?.id]);

  if (!product) return null;

  const item = localize(product);
  const isStockOut = product.inStock === false;
  const fabricLabel = t(FABRIC_KEY[fabric] || 'fabricNavy');
  const chaiseLabel = t(CHAISE_KEY[chaise] || 'chaiseRight');
  const specs = [`${t('fabricTitle')}: ${fabricLabel}`];
  if (product.cat === 'Sectionals') specs.push(`${t('chaiseTitle')}: ${chaiseLabel}`);

  const orderText = isStockOut
    ? t('waStockOutOrder', { name: item.name, price: product.price, specs: specs.join(', ') })
    : t('waOrder', { name: item.name, price: product.price, specs: specs.join(', ') });

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-label={item.name} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal" ref={scrollRef}>
        <button className="modal-close" aria-label={t('closeModal')} type="button" onClick={onClose}><CloseIcon /></button>
        <div className="modal-grid">
          <div className="modal-gallery">
            <a className="modal-img" href={product.img} target="_blank" rel="noopener noreferrer" title={t('zoomNote')}>
              <img src={product.img} alt={item.name} />
            </a>
            <p className="modal-gallery-note">{t('zoomNote')}</p>
          </div>

          <div className="modal-info">
            <div className="modal-crumbs">{t('sku', { cat: t(CAT_TITLE[product.cat] || 'catAccent'), id: product.id })}</div>
            {isStockOut && <div className="modal-stockout">{t('stockOutBanner')}</div>}
            <h2 className="modal-title">{item.name}</h2>
            <div className="modal-rating">
              <StarIcon size={14} /> {product.rating || '4.9'} <span>({product.reviews || 20})</span>
              {item.badge && <span className="card-badge">{item.badge}</span>}
            </div>
            <div className="modal-price-row">
              <span className="modal-price">{product.price}</span>
              <span className="modal-price-tax">{t('gst')}</span>
            </div>
            <p className="modal-desc">{item.desc}</p>

            <div className="option-group">
              <div className="option-title">{t('fabricTitle')} <span>{fabricLabel}</span></div>
              <div className="swatches">
                {FABRICS.map((swatch) => (
                  <button key={swatch.name} type="button" aria-pressed={fabric === swatch.name} className={`swatch${fabric === swatch.name ? ' active' : ''}`} onClick={() => onFabric(swatch.name)}>
                    <span className="swatch-dot" style={{ background: swatch.hex }} /> {t(FABRIC_KEY[swatch.name])}
                  </button>
                ))}
              </div>
            </div>

            {product.cat === 'Sectionals' && (
              <div className="option-group">
                <div className="option-title">{t('chaiseTitle')} <span>{chaiseLabel}</span></div>
                <div className="swatches">
                  {CHAISE_OPTIONS.map((option) => (
                    <button key={option} type="button" aria-pressed={chaise === option} className={`swatch${chaise === option ? ' active' : ''}`} onClick={() => onChaise(option)}>
                      {t(CHAISE_KEY[option])}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <dl className="specs">
              {product.dims && <div><dt>{t('dims')}</dt><dd>{product.dims}</dd></div>}
              {product.material && <div><dt>{t('materials')}</dt><dd>{product.material}</dd></div>}
              <div><dt>{t('warranty')}</dt><dd>{t('warrantyVal')}</dd></div>
              <div><dt>{t('delivery')}</dt><dd>{t('deliveryVal')}</dd></div>
            </dl>

            <div className="modal-actions">
              <a href={waLink(orderText)} target="_blank" rel="noopener noreferrer" className="btn-wa btn-lg btn-block">
                <WaIcon size={20} />
                <span>{isStockOut ? t('enquireRestock') : t('enquireOrder')}</span>
              </a>
              <div className="modal-action-row">
                <button className={`btn-secondary${saved ? ' is-saved' : ''}`} type="button" aria-pressed={saved} onClick={() => onToggleWish(product.id)}>
                  <HeartIcon filled={saved} size={16} />
                  {saved ? t('saved') : t('save')}
                </button>
                <ShareButton product={item} className="btn-secondary" label={t('share')} />
                <a href={TEL_LINK} className="btn-secondary">
                  <PhoneIcon size={16} /> {t('call')}
                </a>
              </div>
            </div>
          </div>
        </div>

        {related.length > 0 && (
          <div className="related">
            <h3>{t('related')}</h3>
            <div className="related-row">
              {related.map((other) => {
                const otherItem = localize(other);
                return (
                  <button key={other.id} type="button" className="related-item" onClick={() => onOpen(other, { replace: true })}>
                    <img src={other.img} alt="" loading="lazy" />
                    <span className="related-name">{otherItem.name}</span>
                    <span className="related-price">{other.price}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
