import { ChairIcon, CloseIcon, HeartIcon, MenuIcon, MoonIcon, PhoneIcon, SunIcon, WaIcon } from './Icons.jsx';
import { waLink, TEL_LINK } from '../lib/whatsapp.js';
import { useLang } from '../i18n/LanguageContext.jsx';

const NAV = [
  { key: 'navCollection', cat: 'all' },
  { key: 'navSectionals', cat: 'Sectionals' },
  { key: 'navWooden', cat: 'Wooden Sofas' },
  { key: 'navCustom', href: '#bespoke' },
  { key: 'navShowrooms', href: '#showrooms' },
];

const MOBILE_NAV = [
  { key: 'mobAll', cat: 'all' },
  { key: 'mobSectionals', cat: 'Sectionals' },
  { key: 'mobWooden', cat: 'Wooden Sofas' },
  { key: 'mobAccent', cat: 'Accent' },
  { key: 'mobDining', cat: 'Dining' },
  { key: 'mobCustom', href: '#bespoke' },
  { key: 'mobShowrooms', href: '#showrooms' },
];

export default function Header({
  menuOpen,
  onToggleMenu,
  onCloseMenu,
  onFilter,
  wishlistCount,
  onOpenWishlist,
  isDark,
  onToggleTheme,
}) {
  const { lang, t, toggleLang } = useLang();

  function navLink(item, className) {
    if (item.cat) {
      return (
        <a key={item.key} className={className} href="#catalog" onClick={(e) => { e.preventDefault(); onFilter(item.cat); }}>
          {t(item.key)}
        </a>
      );
    }
    return <a key={item.key} className={className} href={item.href} onClick={onCloseMenu}>{t(item.key)}</a>;
  }

  return (
    <>
      <div className="announce">
        <div className="wrap announce-inner">
          <span className="announce-text">{t('announce')}</span>
          <div className="announce-right">
            <a href={TEL_LINK} className="announce-link">
              <PhoneIcon size={13} />
              <span>60025 84075</span>
            </a>
            <button type="button" className="lang-switch" onClick={toggleLang} aria-label={t('langSwitchLabel')} title={t('langSwitchLabel')}>
              <span className="lang-mark" aria-hidden="true">{lang === 'en' ? 'অ' : 'EN'}</span>
              <span>{t('langSwitch')}</span>
            </button>
          </div>
        </div>
      </div>

      <header className={`site-header${menuOpen ? ' menu-open' : ''}`}>
        <div className="wrap nav">
          <a href="#hero" className="logo" onClick={onCloseMenu} aria-label="Furniture8home">
            <span className="logo-icon"><ChairIcon /></span>
            <span className="logo-words">
              <span className="logo-text">Furniture<span className="num">8</span>home</span>
              <span className="logo-sub">{t('logoSub')}</span>
            </span>
          </a>

          <nav className="nav-links" aria-label="Primary">
            {NAV.map((item) => navLink(item))}
          </nav>

          <div className="nav-actions">
            <button className="icon-btn" type="button" title={isDark ? t('lightMode') : t('darkMode')} aria-label={isDark ? t('lightMode') : t('darkMode')} onClick={onToggleTheme}>
              {isDark ? <SunIcon /> : <MoonIcon />}
            </button>
            <button className="icon-btn" type="button" title={t('wishlist')} aria-label={t('wishlist')} onClick={onOpenWishlist}>
              <HeartIcon size={18} />
              {wishlistCount > 0 && <span className="badge-count">{wishlistCount}</span>}
            </button>
            <a className="btn-wa-header" href={waLink(t('waVisit'))} target="_blank" rel="noopener noreferrer">
              <WaIcon />
              <span>{t('whatsapp')}</span>
            </a>
            <button className="icon-btn menu-toggle" type="button" title={t('openMenu')} aria-label={t('openMenu')} aria-expanded={menuOpen} aria-controls="mobileNav" onClick={onToggleMenu}>
              {menuOpen ? <CloseIcon size={18} /> : <MenuIcon />}
            </button>
          </div>
        </div>

        <nav className={`mobile-nav${menuOpen ? ' open' : ''}`} id="mobileNav" aria-label="Mobile">
          <div className="wrap mobile-nav-inner">
            {MOBILE_NAV.map((item) => navLink(item, 'mobile-nav-link'))}
            <div className="mobile-nav-cta">
              <a className="btn-primary" href={waLink(t('waGeneral'))} target="_blank" rel="noopener noreferrer">
                <WaIcon size={16} /> {t('whatsappNumber')}
              </a>
              <a className="btn-secondary" href={TEL_LINK}>
                <PhoneIcon size={16} /> {t('call')}
              </a>
            </div>
          </div>
        </nav>
      </header>
    </>
  );
}
