import { useState } from 'react';
import { FAQS, REVIEWS, STORES } from '../data/content.js';
import {
  ArrowIcon,
  ChevronIcon,
  ClockIcon,
  LayersIcon,
  PhoneIcon,
  PinIcon,
  SofaIcon,
  StarIcon,
  TimberIcon,
  TruckIcon,
  WaIcon,
  LogoMark,
} from './Icons.jsx';
import { TEL_LINK, waLink, SHOP_EMAIL } from '../lib/whatsapp.js';
import { useLang } from '../i18n/LanguageContext.jsx';
import { useCategories } from '../lib/categories.jsx';

const FEATURES = [
  { icon: TimberIcon, title: 'feat1t', body: 'feat1' },
  { icon: LayersIcon, title: 'feat2t', body: 'feat2' },
  { icon: SofaIcon, title: 'feat3t', body: 'feat3' },
  { icon: TruckIcon, title: 'feat4t', body: 'feat4' },
];

const STEPS = [
  ['step1', 'step1b'],
  ['step2', 'step2b'],
  ['step3', 'step3b'],
  ['step4', 'step4b'],
];

const REVIEW_KEYS = [
  ['review1', 'review1loc'],
  ['review2', 'review2loc'],
  ['review3', 'review3loc'],
];

const STORE_COPY = [
  { kicker: 'store1', name: 'store1name', address: 'store1addr', wa: 'waMaligaon' },
  { kicker: 'store2', name: 'store2name', address: 'store2addr', wa: 'waBoragaon' },
];

// Step labels read "Step 1 · Measurements"; keep only the part after the dot.
function stepTitle(label) {
  const parts = label.split(' · ');
  return parts[parts.length - 1];
}

export function Bespoke() {
  const { t } = useLang();
  return (
    <section className="bespoke" id="bespoke">
      <div className="wrap bespoke-grid">
        <div className="bespoke-copy">
          <div className="eyebrow eyebrow--light">{t('bespokeEyebrow')}</div>
          <h2>{t('bespokeTitle')}</h2>
          <p>{t('bespokeBody')}</p>
          <ol className="steps">
            {STEPS.map(([title, body], index) => (
              <li key={title}>
                <span className="step-num">{String(index + 1).padStart(2, '0')}</span>
                <strong>{stepTitle(t(title))}</strong>
                <span>{t(body)}</span>
              </li>
            ))}
          </ol>
        </div>
        <aside className="bespoke-card">
          <h3>{t('messageShowroom')}</h3>
          <p>{t('messageBody')}</p>
          <a className="bespoke-phone" href={TEL_LINK}>60025 84075</a>
          <div className="bespoke-floors">{t('bothFloors')}</div>
          <a href={waLink(t('waBespoke'))} target="_blank" rel="noopener noreferrer" className="btn-wa btn-lg">
            <WaIcon size={18} />
            {t('startConsult')}
          </a>
        </aside>
      </div>
    </section>
  );
}

export function WhyUs() {
  const { t } = useLang();
  return (
    <section className="why wrap" id="why-us" aria-labelledby="whyTitle">
      <div className="section-head section-head--center">
        <div>
          <div className="eyebrow">{t('promise')}</div>
          <h2 className="section-title" id="whyTitle">{t('whyTitle')}</h2>
        </div>
        <p className="section-desc">{t('whyDesc')}</p>
      </div>
      <div className="features">
        {FEATURES.map(({ icon: Icon, title, body }) => (
          <div className="feature" key={title}>
            <span className="feature-icon"><Icon size={22} /></span>
            <h3>{t(title)}</h3>
            <p>{t(body)}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

export function Reviews() {
  const { t } = useLang();
  return (
    <section className="reviews" id="reviews" aria-labelledby="reviewsTitle">
      <div className="wrap">
        <div className="section-head">
          <div>
            <div className="eyebrow">{t('reviewsEyebrow')}</div>
            <h2 className="section-title" id="reviewsTitle">{t('reviewsTitle')}</h2>
          </div>
          <p className="section-desc">{t('reviewsDesc')}</p>
        </div>
        <div className="reviews-grid">
          {REVIEWS.map((review, index) => (
            <figure className="review" key={review.initials}>
              <div className="review-stars" aria-label="5 / 5">
                {[0, 1, 2, 3, 4].map((n) => <StarIcon key={n} size={15} />)}
              </div>
              <blockquote>{t(REVIEW_KEYS[index][0])}</blockquote>
              <figcaption>
                <span className="review-avatar">{review.initials}</span>
                <span>
                  <strong>{review.name}</strong>
                  <small>{t(REVIEW_KEYS[index][1])}</small>
                </span>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}

export function Showrooms({ onBook }) {
  const { t } = useLang();
  return (
    <section className="showrooms wrap" id="showrooms" aria-labelledby="visitTitle">
      <div className="section-head">
        <div>
          <div className="eyebrow">{t('visitEyebrow')}</div>
          <h2 className="section-title" id="visitTitle">{t('visitTitle')}</h2>
        </div>
        <p className="section-desc">{t('visitBody')}</p>
      </div>
      <div className="stores">
        {STORES.map((store, index) => {
          const copy = STORE_COPY[index];
          return (
            <article className="store" key={store.name}>
              <div className="store-map">
                <iframe title={store.mapTitle} loading="lazy" referrerPolicy="no-referrer-when-downgrade" src={store.map} />
              </div>
              <div className="store-body">
                <div className="store-kicker">{t(copy.kicker)}</div>
                <h3>{t(copy.name)}</h3>
                <ul className="store-facts">
                  <li><PinIcon size={16} /> {t(copy.address)}</li>
                  <li><ClockIcon size={16} /> {t('hours')}</li>
                </ul>
                <div className="store-actions">
                  <button type="button" className="btn-primary" onClick={() => onBook?.(store.name)}>
                    <ClockIcon size={15} /> {t('visitBookButton')}
                  </button>
                  <a className="btn-secondary" href={store.directions} target="_blank" rel="noopener noreferrer">
                    {t('directions')} <ArrowIcon size={15} />
                  </a>
                  <a className="btn-secondary" href={waLink(t(copy.wa))} target="_blank" rel="noopener noreferrer">
                    <WaIcon size={15} /> {t('whatsapp')}
                  </a>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

export function FAQSection() {
  const { lang, t } = useLang();
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <section className="faq wrap" id="faq" aria-labelledby="faqTitle">
      <div className="faq-intro">
        <div className="eyebrow">{t('faqEyebrow')}</div>
        <h2 className="section-title" id="faqTitle">{t('faqTitle')}</h2>
        <p className="section-desc">{t('faqDesc')}</p>
        <a className="btn-secondary" href={waLink(t('waGeneral'))} target="_blank" rel="noopener noreferrer">
          <WaIcon size={15} /> {t('faqMore')}
        </a>
      </div>
      <div className="faq-list">
        {FAQS.map((faq, idx) => {
          const isOpen = openIndex === idx;
          return (
            <div key={faq.q} className={`faq-item${isOpen ? ' open' : ''}`}>
              <h3>
                <button
                  type="button"
                  className="faq-q"
                  aria-expanded={isOpen}
                  aria-controls={`faq-answer-${idx}`}
                  id={`faq-btn-${idx}`}
                  onClick={() => setOpenIndex(isOpen ? -1 : idx)}
                >
                  <span>{lang === 'as' ? faq.qAs : faq.q}</span>
                  <ChevronIcon size={18} />
                </button>
              </h3>
              <div id={`faq-answer-${idx}`} className="faq-a" role="region" aria-labelledby={`faq-btn-${idx}`} hidden={!isOpen}>
                <p>{lang === 'as' ? faq.aAs : faq.a}</p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export function Footer({ onFilter, onOpenAdmin, onTrack, onBook }) {
  const { t } = useLang();
  const categories = useCategories();
  return (
    <footer className="site-footer">
      <div className="wrap foot-cta">
        <h2>{t('footCta')}</h2>
        <div className="foot-cta-actions">
          <a href={waLink(t('waVisit'))} target="_blank" rel="noopener noreferrer" className="btn-wa btn-lg">
            <WaIcon size={18} /> {t('chatWa')}
          </a>
          <a href={TEL_LINK} className="btn-ghost btn-lg">
            <PhoneIcon size={16} /> 60025 84075
          </a>
        </div>
      </div>
      <div className="wrap foot-grid">
        <div className="foot-col foot-about">
          <div className="foot-logo">
            <span className="logo-icon"><LogoMark size={24} /></span>
            <span className="logo-text">Furniture<span className="num">8</span>home</span>
          </div>
          <p>{t('footAbout')}</p>
          <div className="foot-tag">{t('footTag')}</div>
        </div>
        <div className="foot-col">
          <h4>{t('footBrowse')}</h4>
          <ul>
            {categories.list.map((c) => (
              <li key={c.id}><a href="#catalog" onClick={(e) => { e.preventDefault(); onFilter(c.id); }}>{categories.label(c.id)}</a></li>
            ))}
          </ul>
        </div>
        <div className="foot-col">
          <h4>{t('footShowrooms')}</h4>
          <ul className="foot-stores">
            <li><strong>{t('footMal')}</strong>{t('footMalAddr')}</li>
            <li><strong>{t('footBor')}</strong>{t('footBorAddr')}</li>
            <li>{t('hours')}</li>
          </ul>
        </div>
        <div className="foot-col">
          <h4>{t('footOrder')}</h4>
          <p>{t('footOrderBody')}</p>
          <ul className="foot-actions">
            <li><button type="button" onClick={onTrack}>{t('trackTitle')}</button></li>
            <li><button type="button" onClick={onBook}>{t('visitModalTitle')}</button></li>
          </ul>
          <p className="foot-wa">{t('footWaLabel')}</p>
          <p className="foot-wa"><a href={`mailto:${SHOP_EMAIL}`}>{SHOP_EMAIL}</a></p>
        </div>
      </div>
      <div className="wrap foot-bottom">
        <div>{t('copyright')}</div>
        <div className="foot-bottom-right">
          <span>{t('designed')}</span>
          {onOpenAdmin && (
            <button type="button" className="foot-admin" onClick={onOpenAdmin}>{t('staffLogin')}</button>
          )}
        </div>
      </div>
    </footer>
  );
}
