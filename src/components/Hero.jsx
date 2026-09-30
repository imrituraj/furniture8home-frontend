import { WaIcon } from './Icons.jsx';
import { waLink } from '../lib/whatsapp.js';
import { useLang } from '../i18n/LanguageContext.jsx';

export default function Hero({ total }) {
  const { t } = useLang();

  return (
    <section className="hero wrap" id="hero">
      <div className="hero-grid">
        <div>
          <div className="eyebrow-pill">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" /></svg>
            {t('eyebrow')}
          </div>
          <h1>{t('heroTitle')} <span className="highlight">{t('heroHighlight')}</span></h1>
          <p className="hero-lead">{t('heroLead')}</p>
          <div className="hero-actions">
            <a className="btn-primary" href="#catalog">
              {t('explore', { n: total })}
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19" /><polyline points="19 12 12 19 5 12" /></svg>
            </a>
            <a className="btn-secondary" href={waLink(t('waCustom'))} target="_blank" rel="noopener noreferrer">
              <WaIcon size={16} />
              {t('customRequest')}
            </a>
          </div>
          <div className="hero-stats">
            <div className="stat-item"><span className="num">2</span><span className="label">{t('statShowrooms')}</span></div>
            <div className="stat-item"><span className="num">{total}</span><span className="label">{t('statDesigns')}</span></div>
            <div className="stat-item"><span className="num">{t('statCustomNum')}</span><span className="label">{t('statCustom')}</span></div>
            <div className="stat-item"><span className="num" style={{ fontSize: 20 }}>60025</span><span className="label">{t('statWa')}</span></div>
          </div>
        </div>
        <div className="hero-visual">
          <div className="hero-main-card">
            <img src="images/original_site/hero.jpeg" alt={t('heroAlt')} width="640" height="480" fetchPriority="high" />
          </div>
          <div className="floating-badge badge-top">
            <div className="badge-icon-box">★</div>
            <div>
              <div className="badge-title">{t('badgeSit')}</div>
              <div className="badge-sub">{t('badgeFloors')}</div>
            </div>
          </div>
          <div className="floating-badge badge-bottom">
            <div className="badge-icon-box">🪵</div>
            <div>
              <div className="badge-title">{t('badgeTeak')}</div>
              <div className="badge-sub">{t('badgeFoam')}</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
