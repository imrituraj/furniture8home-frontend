import { useState } from 'react';
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

const FAQS = [
  {
    q: 'Where are Furniture8home showrooms located in Guwahati?',
    qAs: 'গুৱাহাটীত Furniture8home ৰ শ্ব’ৰুম ক’ত অৱস্থিত?',
    a: 'Furniture8home has two physical showrooms in Guwahati: Showroom 1 on AT Road, Maligaon (Opposite The GYM, PIN 781011) and Showroom 2 in Paschim Boragaon (Opposite GYM Central, PIN 781035). Both floors stock physical display models you can sit on, touch the fabrics, and inspect before purchasing.',
    aAs: 'গুৱাহাটীত আমাৰ দুটা শ্ব’ৰুম আছে: ১) মালিগাঁও এটি ৰোড (The GYM ৰ বিপৰীতে, পিন ৭৮১০১১) আৰু ২) পশ্চিম বৰাগাঁও (GYM Central ৰ বিপৰীতে, পিন ৭৮১০৩৫)। দুয়োটা মহলাতে আপুনি কাঠ পৰীক্ষা কৰি আৰু কুশ্বনত বহি পছন্দ কৰিব পাৰিব।'
  },
  {
    q: 'Can I customize the size, fabric, and chaise layout of my sofa?',
    qAs: 'মই মোৰ কোঠাৰ জোখ অনুযায়ী চোফা কাষ্টমাইজ কৰিব পাৰিমনে?',
    a: 'Yes! Every sectional, L-shape sofa, and wooden settee is custom-built to your room’s exact measurements to the inch. You can choose from stain-resistant velvet, textured chenille, linen, and select right-facing, left-facing, or customized chaise layouts.',
    aAs: 'হয়! প্ৰতিটো এল-চেকচনেল আৰু কাঠৰ চোফা আপোনাৰ কোঠাৰ জোখ অনুসৰি নিৰ্মাণ কৰা হয়। আপুনি দাগ-প্ৰতিৰোধী ভেলভেট, লিনেন কাপোৰ আৰু বাওঁফালৰ বা সোঁফালৰ চেইজ নিজৰ ইচ্ছা অনুসৰি বাছি লব পাৰে।'
  },
  {
    q: 'What type of timber and cushioning materials are used?',
    qAs: 'আপোনালোকৰ চোফাত কি কাঠ আৰু ফোম ব্যৱহাৰ কৰা হয়?',
    a: 'We craft frames exclusively from 100% kiln-seasoned, chemically treated Assam Teak and seasoned Indian Sheesham, immune to termites and humidity distortion. We use commercial-grade 40D high-resilience foam over anti-sag pocket coils that retain bounce for 10+ years.',
    aAs: 'আমাৰ চোফাৰ সকলো ফ্ৰেম ১০০% কিলন-ট্ৰিটেড অসম চেগুন (Assam Teak) আৰু চিচম কাঠেৰে নিৰ্মিত, যি উই-পৰুৱা আৰু সেমেকা বতাহৰ পৰা সম্পূৰ্ণ সুৰক্ষিত। কুশ্বনত উচ্চ ঘনত্বৰ 40D ফোম ব্যৱহাৰ কৰা হয়।'
  },
  {
    q: 'Do you deliver and install furniture across Guwahati and Assam?',
    qAs: 'গুৱাহাটী আৰু সমগ্ৰ অসমত ডেলিভাৰী আৰু ইনষ্টলেশ্বনৰ সুবিধা আছেনে?',
    a: 'Yes, our dedicated in-house workshop team provides white-glove doorstep delivery, stair carry, and careful in-room installation across all neighborhoods of Guwahati (Maligaon, Boragaon, Zoo Road, Beltola, Dispur, Jalukbari, Khanapara) and throughout greater Assam.',
    aAs: 'হয়, আমাৰ নিজা ৱৰ্কশ্বপৰ দলটোৱে গুৱাহাটীৰ সকলো প্ৰান্তত (মালিগাঁও, বৰাগাঁও, জু-ৰোড, বেলতলা, দিছপুৰ) আৰু সমগ্ৰ অসমত ঘৰৰ ভিতৰলৈ নি নিখুঁতভাৱে ইনষ্টলেশ্বন কৰি দিয়ে।'
  },
  {
    q: 'How can I enquire or order furniture from Furniture8home?',
    qAs: 'অৰ্ডাৰ বা দামৰ বিষয়ে কেনেকৈ যোগাযোগ কৰিব পাৰি?',
    a: 'You can chat with our workshop specialists directly on WhatsApp at +91 60025 84075 with a photo of your living room or preferred furniture model, or visit our showrooms in Maligaon or Paschim Boragaon open every day from 10:00 AM to 8:30 PM.',
    aAs: 'আপুনি আমাৰ হোৱাটছএপ নম্বৰ ৬০০২৫ ৮৪০৭৫ ত আপোনাৰ কোঠাৰ ফটো বা পছন্দৰ মডেল প্ৰেৰণ কৰি পোনপটীয়াকৈ কথা পাতিব পাৰে, বা মালিগাঁও আৰু বৰাগাঁও শ্ব’ৰুমত পুৱা ১০ বজাৰ পৰা নিশা ৮:৩০ বজালৈ আহিব পাৰে।'
  }
];

export function FAQSection() {
  const { lang } = useLang();
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <section className="faq-section wrap" id="faq" aria-labelledby="faqTitle">
      <div className="section-eyebrow">{lang === 'as' ? 'সঘনাই সোধা প্ৰশ্ন' : 'Frequently Asked Questions'}</div>
      <h2 className="section-title" id="faqTitle">{lang === 'as' ? 'গুৱাহাটীৰ গ্ৰাহকৰ প্ৰশ্নসমূহ' : 'Common Questions from Guwahati Homeowners'}</h2>
      <p className="section-desc">{lang === 'as' ? 'কাষ্টম চোফা, কাঠৰ গুণমান, শ্ব’ৰুম আৰু ডেলিভাৰী সম্পৰ্কীয় প্ৰয়োজনীয় তথ্য' : 'Everything you need to know about timber quality, showroom visits, custom sizes & white-glove installation.'}</p>
      
      <div className="faq-accordion" role="region" aria-label="FAQ Accordion">
        {FAQS.map((faq, idx) => {
          const isOpen = openIndex === idx;
          const question = lang === 'as' ? faq.qAs : faq.q;
          const answer = lang === 'as' ? faq.aAs : faq.a;
          return (
            <div key={idx} className={`faq-item${isOpen ? ' open' : ''}`}>
              <button
                type="button"
                className="faq-question-btn"
                aria-expanded={isOpen}
                aria-controls={`faq-answer-${idx}`}
                id={`faq-btn-${idx}`}
                onClick={() => setOpenIndex(isOpen ? -1 : idx)}
              >
                <span>{question}</span>
                <span className="faq-chevron" aria-hidden="true">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </span>
              </button>
              {isOpen && (
                <div id={`faq-answer-${idx}`} className="faq-answer" role="region" aria-labelledby={`faq-btn-${idx}`}>
                  <p>{answer}</p>
                </div>
              )}
            </div>
          );
        })}
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
