import { useEffect, useState } from 'react';
import { CATEGORIES, FILTERS } from '../data/content.js';
import { ArrowIcon, HeartIcon, SearchIcon, StarIcon, WaIcon } from './Icons.jsx';
import ShareButton from './ShareButton.jsx';
import { waLink } from '../lib/whatsapp.js';
import { useLang } from '../i18n/LanguageContext.jsx';

export const CAT_TITLE = {
  Sectionals: 'catSectionals',
  'Wooden Sofas': 'catWooden',
  Accent: 'catAccent',
  Dining: 'catDining',
  Wingback: 'catWing',
};

const FILTER_KEY = {
  all: 'allCollections',
  Sectionals: 'filterSectionals',
  'Wooden Sofas': 'filterWooden',
  Accent: 'filterAccent',
  Dining: 'filterDining',
  Wingback: 'filterWing',
};

const PAGE_SIZE = 12;

export function ProductCard({ product, saved, onOpen, onToggleWish }) {
  const { t, localize } = useLang();
  const item = localize(product);
  const isStockOut = product.inStock === false;
  const waMessage = isStockOut
    ? t('waStockOut', { name: item.name, price: product.price })
    : t('waCard', { name: item.name, price: product.price });

  return (
    <article className={`card${isStockOut ? ' is-stock-out' : ''}`}>
      <div className="card-media">
        <button type="button" className="card-img-btn" onClick={() => onOpen(product)} aria-label={`${t('quickView')}: ${item.name}`}>
          <img src={product.img} alt={item.name} loading="lazy" width="400" height="500" decoding="async" />
          <span className="card-view">{t('quickView')}</span>
        </button>
        <div className="card-badges">
          {isStockOut && <span className="card-badge card-badge--out">{t('stockOut')}</span>}
          {item.badge && <span className="card-badge">{item.badge}</span>}
        </div>
        <button
          className={`wishlist-btn${saved ? ' active' : ''}`}
          type="button"
          title={t('saveWish')}
          aria-label={saved ? t('saved') : t('saveWish')}
          aria-pressed={saved}
          onClick={() => onToggleWish(product.id)}
        >
          <HeartIcon filled={saved} />
        </button>
      </div>
      <div className="card-body">
        <div className="card-meta">
          <span>{t(CAT_TITLE[product.cat] || 'catAccent')}</span>
          <span className="card-rating"><StarIcon size={12} /> {product.rating || '4.9'} <span>({product.reviews || 20})</span></span>
        </div>
        <h3 className="card-title">
          <button type="button" onClick={() => onOpen(product)}>{item.name}</button>
        </h3>
        {product.dims && <p className="card-dims">{product.dims}</p>}
        <div className="card-foot">
          <div className="card-price-box">
            <span className="card-price">{product.price}</span>
            <span className="card-price-sub">{isStockOut ? t('madeToOrder') : t('deliveryReady')}</span>
          </div>
          <div className="card-actions">
            <ShareButton product={item} className="card-icon-btn" />
            <a
              href={waLink(waMessage)}
              target="_blank"
              rel="noopener noreferrer"
              className="card-icon-btn card-icon-btn--wa"
              title={t('enquireWa')}
              aria-label={`${t('enquireWa')}: ${item.name}`}
            >
              <WaIcon />
            </a>
          </div>
        </div>
      </div>
    </article>
  );
}

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
  const { t } = useLang();
  const [limit, setLimit] = useState(PAGE_SIZE);

  useEffect(() => {
    setLimit(PAGE_SIZE);
  }, [category, query, sort]);

  const countFor = (id) => (id === 'all' ? products.length : products.filter((p) => p.cat === id).length);
  const shown = visible.slice(0, limit);
  const remaining = visible.length - shown.length;

  return (
    <>
      <section className="categories wrap" aria-labelledby="catTitle">
        <div className="section-head">
          <div>
            <div className="eyebrow">{t('curated')}</div>
            <h2 className="section-title" id="catTitle">{t('exploreType')}</h2>
          </div>
          <p className="section-desc">{t('exploreDesc')}</p>
        </div>
        <div className="cat-grid">
          {CATEGORIES.map((cat) => (
            <button key={cat.id} type="button" className={`cat-tile${category === cat.id ? ' active' : ''}`} onClick={() => onFilter(cat.id)}>
              <img src={cat.img} alt="" loading="lazy" />
              <span className="cat-tile-body">
                <span className="cat-tile-title">{t(CAT_TITLE[cat.id])}</span>
                <span className="cat-tile-count">
                  {t('pieces', { n: countFor(cat.id) })}
                  <ArrowIcon size={15} />
                </span>
              </span>
            </button>
          ))}
        </div>
      </section>

      <section className="catalog wrap" id="catalog" aria-labelledby="collectionTitle">
        <div className="section-head">
          <div>
            <div className="eyebrow">{t('collectionEyebrow')}</div>
            <h2 className="section-title" id="collectionTitle">{t('collectionTitle')}</h2>
          </div>
          <p className="catalog-status" aria-live="polite">
            {t('showing')} <strong>{visible.length}</strong> {t('ofPieces', { n: products.length })}
          </p>
        </div>

        <div className="toolbar">
          <div className="toolbar-row">
            <label className={`search-box${query.trim() ? ' has-query' : ''}`}>
              <SearchIcon size={17} />
              <input type="search" value={query} onChange={(e) => onQuery(e.target.value)} placeholder={t('searchPlaceholder')} autoComplete="off" aria-label={t('searchLabel')} />
              {query && (
                <button className="search-clear" title={t('clearSearch')} aria-label={t('clearSearch')} type="button" onClick={() => onQuery('')}>×</button>
              )}
            </label>
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
          <div className="chips" role="group" aria-label={t('allCollections')}>
            {FILTERS.map((filter) => (
              <button key={filter.id} type="button" className={`chip${category === filter.id ? ' active' : ''}`} aria-pressed={category === filter.id} onClick={() => onFilter(filter.id)}>
                {t(FILTER_KEY[filter.id])} <span className="chip-count">{countFor(filter.id)}</span>
              </button>
            ))}
          </div>
        </div>

        {visible.length === 0 ? (
          <div className="empty-state">
            <h3>{t('emptyTitle')}</h3>
            <p>{t('emptyBody')}</p>
            <button className="btn-primary" type="button" onClick={onReset}>{t('reset')}</button>
          </div>
        ) : (
          <>
            <div className="grid">
              {shown.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  saved={wishlist.includes(product.id)}
                  onOpen={onOpen}
                  onToggleWish={onToggleWish}
                />
              ))}
            </div>
            {remaining > 0 && (
              <div className="show-more">
                <button type="button" className="btn-secondary btn-lg" onClick={() => setLimit((n) => n + PAGE_SIZE)}>
                  {t('showMore', { n: Math.min(remaining, PAGE_SIZE) })}
                </button>
              </div>
            )}
          </>
        )}
      </section>
    </>
  );
}
