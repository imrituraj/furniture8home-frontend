import { FEATURES, REVIEWS, STORES } from '../data/content.js';
import { WaIcon } from './Icons.jsx';
import { waLink } from '../lib/whatsapp.js';
import { useLang } from '../i18n/LanguageContext.jsx';

const FEATURE_KEYS = [
  ['feat1t', 'feat1'],
  ['feat2t', 'feat2'],
  ['feat3t', 'feat3'],
  ['feat4t', 'feat4'],
];

const REVIEW_KEYS = [
  ['review1', 'review1loc'],
  ['review2', 'review2loc'],
  ['review3', 'review3loc'],
];

const STORE_COPY = [
  { kicker: 'store1', name: 'store1name', address: 'store1addr', pin: '781011', wa: 'waMaligaon' },
  { kicker: 'store2', name: 'store2name', address: 'store2addr', pin: '781035', wa: 'waBoragaon' },
];

const FOOT_LINKS = [
  ['Sectionals', 'footSec'],
  ['Wooden Sofas', 'footWood'],
  ['Accent', 'footAccent'],
  ['Dining', 'footDining'],
  ['Wingback', 'footWing'],
];

export function Bespoke() {
  const { t } = useLang();
  return (
    <section className="bespoke-section" id="bespoke">
      <div className="wrap">
        <div className="bespoke-card">
          <div className="bespoke-content">
            <div className="section-eyebrow" style={{ textAlign: 'left' }}>{t('bespokeEyebrow')}</div>
            <h2>{t('bespokeTitle')}</h2>
            <p>{t('bespokeBody')}</p>
            <div className="bespoke-steps">
              <div className="step-item"><div className="step-num">{t('step1')}</div><div className="step-text">{t('step1b')}</div></div>
              <div className="step-item"><div className="step-num">{t('step2')}</div><div className="step-text">{t('step2b')}</div></div>
              <div className="step-item"><div className="step-num">{t('step3')}</div><div className="step-text">{t('step3b')}</div></div>
              <div className="step-item"><div className="step-num">{t('step4')}</div><div className="step-text">{t('step4b')}</div></div>
            </div>
            <a href={waLink(t('waBespoke'))} target="_blank" rel="noopener noreferrer" className="btn-primary">
              <WaIcon size={18} />
              {t('startConsult')}
            </a>
          </div>
          <div className="bespoke-contact-box">
            <h3>{t('messageShowroom')}</h3>
            <p>{t('messageBody')}</p>
            <div style={{ fontFamily: 'var(--font-serif)', fontSize: 28, fontWeight: 700, color: 'var(--brand-brass)', marginBottom: 8 }}>60025 84075</div>
            <div style={{ fontSize: 13, color: 'var(--ink-muted)', marginBottom: 24 }}>{t('bothFloors')}</div>
            <a href={waLink(t('waVisitShowroom'))} target="_blank" rel="noopener noreferrer" className="btn-secondary" style={{ width: '100%', justifyContent: 'center' }}>
              {t('chatWa')}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

export function WhyUs() {
  const { t } = useLang();
  return (
    <section className="why-section wrap" id="why-us">
      <div className="section-eyebrow">{t('promise')}</div>
      <h2 className="section-title">{t('whyTitle')}</h2>
      <p className="section-desc">{t('whyDesc')}</p>
      <div className="features-grid">
        {FEATURES.map((feature, index) => (
          <div className="feature-card" key={feature.title}>
            <div className="feature-icon-box">{feature.icon}</div>
            <h3>{t(FEATURE_KEYS[index][0])}</h3>
            <p>{t(FEATURE_KEYS[index][1])}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

export function Reviews() {
  const { t } = useLang();
  return (
    <section className="reviews-section" id="reviews">
      <div className="wrap">
        <div className="section-eyebrow">{t('reviewsEyebrow')}</div>
        <h2 className="section-title">{t('reviewsTitle')}</h2>
        <p className="section-desc">{t('reviewsDesc')}</p>
        <div className="reviews-grid">
          {REVIEWS.map((review, index) => (
            <div className="review-card" key={review.initials}>
              <div className="review-stars">★★★★★</div>
              <p>&quot;{t(REVIEW_KEYS[index][0])}&quot;</p>
              <div className="review-author">
                <div className="review-avatar">{review.initials}</div>
                <div>
                  <div className="author-name">{review.name}</div>
                  <div className="author-loc">{t(REVIEW_KEYS[index][1])}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function Showrooms() {
  const { t } = useLang();
  return (
    <section className="workshop-section wrap" id="showrooms">
      <div className="workshop-box" style={{ display: 'block' }}>
        <div className="workshop-details">
          <div className="section-eyebrow" style={{ textAlign: 'left' }}>{t('visitEyebrow')}</div>
          <h2>{t('visitTitle')}</h2>
          <p>{t('visitBody')}</p>
        </div>
        <div className="stores-grid">
          {STORES.map((store, index) => {
            const copy = STORE_COPY[index];
            return (
              <article className="store-card" key={store.name}>
                <iframe title={t(copy.name)} loading="lazy" referrerPolicy="no-referrer-when-downgrade" src={store.map} />
                <div className="store-card-body">
                  <div className="store-kicker">{t(copy.kicker)}</div>
                  <h3>{t(copy.name)}</h3>
                  <p>{t(copy.address)}</p>
                  <div className="store-pin">{t('pin')} {copy.pin}</div>
                  <div className="store-actions">
                    <a className="btn-primary" href={store.directions} target="_blank" rel="noopener noreferrer">{t('directions')}</a>
                    <a className="btn-secondary" href={waLink(t(copy.wa))} target="_blank" rel="noopener noreferrer">{t('whatsapp')}</a>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export function Footer({ onFilter, onOpenAdmin }) {
  const { t } = useLang();
  return (
    <footer>
      <div className="wrap foot-grid">
        <div className="foot-col">
          <div className="logo-text" style={{ fontSize: 22, marginBottom: 12 }}>Furniture<span className="num">8</span>home</div>
          <p>{t('footAbout')}</p>
          <div style={{ marginTop: 16, fontSize: 13.5, color: 'var(--brand-sage)', fontWeight: 600 }}>{t('footTag')}</div>
        </div>
        <div className="foot-col">
          <h4>{t('footBrowse')}</h4>
          <ul>
            {FOOT_LINKS.map(([id, key]) => (
              <li key={id}><a href="#catalog" onClick={(e) => { e.preventDefault(); onFilter(id); }}>{t(key)}</a></li>
            ))}
          </ul>
        </div>
        <div className="foot-col">
          <h4>{t('footShowrooms')}</h4>
          <p>
            <strong>{t('footMal')}</strong><br />
            {t('footMalAddr')}<br /><br />
            <strong>{t('footBor')}</strong><br />
            {t('footBorAddr')}<br /><br />
            {t('footWaLabel')}
          </p>
        </div>
        <div className="foot-col">
          <h4>{t('footOrder')}</h4>
          <p style={{ marginBottom: 16 }}>{t('footOrderBody')}</p>
          <a href={waLink(t('waVisit'))} target="_blank" rel="noopener noreferrer" className="btn-wa-header" style={{ justifyContent: 'center' }}>
            <WaIcon size={16} />
            <span>{t('chatWa')}</span>
          </a>
        </div>
      </div>
      <div className="wrap foot-bottom">
        <div>{t('copyright')}</div>
        <div style={{ display: 'flex', gap: '18px', alignItems: 'center' }}>
          {onOpenAdmin && (
            <button
              type="button"
              onClick={onOpenAdmin}
              style={{ color: 'var(--ink-muted)', fontSize: '13px', textDecoration: 'underline', cursor: 'pointer' }}
              title="Catalog & Pricing Admin Dashboard"
            >
              Catalog Admin
            </button>
          )}
          <div>{t('designed')}</div>
        </div>
      </div>
    </footer>
  );
}
