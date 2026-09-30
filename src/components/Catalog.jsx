import { CATEGORIES, FILTERS } from '../data/content.js';
import { HeartIcon, WaIcon } from './Icons.jsx';
import ShareButton from './ShareButton.jsx';
import { waLink } from '../lib/whatsapp.js';
import { useLang } from '../i18n/LanguageContext.jsx';

const CAT_TITLE = {
  Sectionals: 'catSectionals',
  'Wooden Sofas': 'catWooden',
  Accent: 'catAccent',
  Dining: 'catDining',
  Wingback: 'catWing',
};

const CAT_COUNT = {
  Sectionals: 'countSectionals',
  'Wooden Sofas': 'countWooden',
  Accent: 'countAccent',
  Dining: 'countDining',
  Wingback: 'countWing',
};

const FILTER_KEY = {
  all: 'allCollections',
  Sectionals: 'filterSectionals',
  'Wooden Sofas': 'filterWooden',
  Accent: 'filterAccent',
  Dining: 'filterDining',
  Wingback: 'filterWing',
};

export default function Catalog({
  products,
  visible,
  category,
  query,
  sort,
  wishlist,
  onQuery,
  onSort,
  onFilter,
  onReset,
  onOpen,
  onToggleWish,
}) {
  const { lang, t, localize } = useLang();

  return (
    <>
      <section className="quick-categories wrap">
        <div className="section-eyebrow">{t('curated')}</div>
        <h2 className="section-title">{t('exploreType')}</h2>
        <p className="section-desc">{t('exploreDesc')}</p>
        <div className="cat-explorer-grid">
          {CATEGORIES.map((cat) => (
            <button key={cat.id} type="button" className={`cat-pill-card${category === cat.id ? ' active' : ''}`} onClick={() => onFilter(cat.id)}>
              <div className="img-box"><img src={cat.img} alt={t(CAT_TITLE[cat.id])} loading="lazy" /></div>
              <div className="cat-body">
                <div className="cat-title">{t(CAT_TITLE[cat.id])}</div>
                <div className="cat-count">{t(CAT_COUNT[cat.id])}</div>
              </div>
            </button>
          ))}
        </div>
      </section>

      <section className="catalog wrap" id="catalog">
        <div className="catalog-controls">
          <div className="controls-top">
            <div className={`search-box${query.trim() ? ' has-query' : ''}`}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
              <input type="text" value={query} onChange={(e) => onQuery(e.target.value)} placeholder={t('searchPlaceholder')} autoComplete="off" aria-label={t('searchLabel')} />
              <button className="search-clear-btn" title={t('clearSearch')} type="button" onClick={() => onQuery('')}>×</button>
            </div>
            <div className="sort-box">
              <label htmlFor="sortSelect">{t('sortBy')}</label>
              <select id="sortSelect" value={sort} onChange={(e) => onSort(e.target.value)}>
                <option value="featured">{t('sortFeatured')}</option>
                <option value="price-asc">{t('sortLow')}</option>
                <option value="price-desc">{t('sortHigh')}</option>
                <option value="rating-desc">{t('sortRated')}</option>
                <option value="name-asc">{t('sortName')}</option>
              </select>
            </div>
          </div>
          <div className="filters-bar">
            {FILTERS.map((filter) => {
              const count = filter.id === 'all' ? products.length : products.filter((p) => p.cat === filter.id).length;
              return (
                <button key={filter.id} type="button" className={`filter-btn${category === filter.id ? ' active' : ''}`} onClick={() => onFilter(filter.id)}>
                  {t(FILTER_KEY[filter.id])} <span className="count-badge">{count}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="catalog-status">
          <span>{t('showing')} <strong>{visible.length}</strong> {t('ofPieces', { n: products.length })}</span>
          <span>{t(FILTER_KEY[category] || 'allCollections')}</span>
        </div>

        {visible.length === 0 ? (
          <div className="empty-state">
            <h3>{t('emptyTitle')}</h3>
            <p>{t('emptyBody')}</p>
            <button className="btn-primary" type="button" onClick={onReset}>{t('reset')}</button>
          </div>
        ) : (
          <div className="grid">
            {visible.map((product) => {
              const item = localize(product);
              const saved = wishlist.includes(product.id);
              const isStockOut = product.inStock === false;
              const waMessage = isStockOut
                ? (lang === 'as'
                  ? `নমস্কাৰ Furniture8home, মই "${item.name}" (${product.price}) ৰ বিষয়ে জানিব বিচাৰোঁ। বৰ্তমান ষ্টক শেষ বুলি দেখা গৈছে, মই অৰ্ডাৰ দিব পাৰিমনে?`
                  : `Hi Furniture8home, I would like to enquire about ordering "${item.name}" (${product.price}) which is currently marked as stock out.`)
                : t('waCard', { name: item.name, price: product.price });

              return (
                <article className={`card${isStockOut ? ' is-stock-out' : ''}`} key={product.id}>
                  <div className="card-img-wrap" onClick={() => onOpen(product)} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter') onOpen(product); }}>
                    <img src={product.img} alt={item.name} loading="lazy" />
                    {isStockOut && (
                      <span className="card-badge-stockout">
                        {lang === 'as' ? 'ষ্টক শেষ' : 'Stock Out'}
                      </span>
                    )}
                    {item.badge && <span className="card-badge">{item.badge}</span>}
                    <button className={`wishlist-btn${saved ? ' active' : ''}`} type="button" title={t('saveWish')} aria-label={saved ? t('saved') : t('saveWish')} onClick={(e) => { e.stopPropagation(); onToggleWish(product.id); }}>
                      <HeartIcon filled={saved} />
                    </button>
                    <div className="card-quick-overlay">{t('quickView')}</div>
                  </div>
                  <div className="card-body" onClick={() => onOpen(product)} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter') onOpen(product); }}>
                    <div className="card-meta">
                      <span className="card-cat">{t(CAT_TITLE[product.cat] || 'catAccent')}</span>
                      <span className="card-rating">★ {product.rating || '4.9'} ({product.reviews || 20})</span>
                    </div>
                    <h3 className="card-title">{item.name}</h3>
                    <div className="card-dims">{product.dims}</div>
                    <div className="card-footer">
                      <div className="card-price-box">
                        <span className="card-price">{product.price}</span>
                        <span className="card-price-sub">
                          {isStockOut
                            ? (lang === 'as' ? 'অনুগ্ৰহ কৰি অৰ্ডাৰ কৰক' : 'Made to Order')
                            : t('deliveryReady')}
                        </span>
                      </div>
                      <div className="card-actions">
                        <ShareButton product={item} className="card-wa-btn" />
                        <a href={waLink(waMessage)} target="_blank" rel="noopener noreferrer" className="card-wa-btn" title={isStockOut ? 'Enquire on WhatsApp' : t('enquireWa')} aria-label={isStockOut ? 'Enquire on WhatsApp' : t('enquireWa')} onClick={(e) => e.stopPropagation()}>
                          <WaIcon />
                        </a>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </>
  );
}
