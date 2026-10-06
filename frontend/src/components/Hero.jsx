import { ArrowIcon, StarIcon, WaIcon } from './Icons.jsx';
import { waLink } from '../lib/whatsapp.js';
import { useLang } from '../i18n/LanguageContext.jsx';

export default function Hero({ total }) {
  const { t } = useLang();

  return (
    <section className="hero" id="hero">
      <div className="wrap hero-grid">
        <div className="hero-copy">
          <div className="eyebrow">{t('eyebrow')}</div>
          <h1>
            {t('heroTitle')} <em>{t('heroHighlight')}</em>
          </h1>
          <p className="hero-lead">{t('heroLead')}</p>
          <div className="hero-actions">
            <a className="btn-primary btn-lg" href="#catalog">
              {t('explore', { n: total })}
              <ArrowIcon size={17} />
            </a>
            <a className="btn-secondary btn-lg" href={waLink(t('waCustom'))} target="_blank" rel="noopener noreferrer">
              <WaIcon size={16} />
              {t('customRequest')}
            </a>
          </div>
          <dl className="hero-proof">
            <div><dt>2</dt><dd>{t('statShowrooms')}</dd></div>
            <div><dt>{total}</dt><dd>{t('statDesigns')}</dd></div>
            <div><dt>10</dt><dd>{t('proofWarranty')}</dd></div>
          </dl>
        </div>

        <div className="hero-media">
          <figure className="hero-img hero-img--main">
            <img src="images/original_site/hero.jpeg" alt={t('heroAlt')} width="640" height="480" fetchPriority="high" />
          </figure>
          <figure className="hero-img hero-img--a">
            <img src="images/woodensofa/2223b117512a2b4decec1a5c0d5163e2.jpg" alt="" width="320" height="320" loading="lazy" />
          </figure>
          <figure className="hero-img hero-img--b">
            <img src="images/lsofa/0e06df108cba5f38f4c09e7d95643405.jpg" alt="" width="320" height="320" loading="lazy" />
          </figure>
          <div className="hero-tag">
            <span className="hero-tag-icon"><StarIcon size={15} /></span>
            <span>
              <strong>{t('badgeSit')}</strong>
              <small>{t('badgeFloors')}</small>
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
