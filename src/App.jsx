import { useCallback, useEffect, useMemo, useState } from 'react';
import Header from './components/Header.jsx';
import Hero from './components/Hero.jsx';
import Catalog from './components/Catalog.jsx';
import ProductModal from './components/ProductModal.jsx';
import WishlistDrawer from './components/WishlistDrawer.jsx';
import AdminDashboard from './components/AdminDashboard.jsx';
import AdminLogin from './components/AdminLogin.jsx';
import { Bespoke, FAQSection, Footer, Reviews, Showrooms, WhyUs } from './components/SiteSections.jsx';
import { WaIcon } from './components/Icons.jsx';
import { waLink } from './lib/whatsapp.js';
import { clearProductUrl, findProductByLocation, writeProductUrl } from './lib/productLink.js';
import { useLang } from './i18n/LanguageContext.jsx';
import { getPublicCatalog, isAdminAuthenticated } from './lib/catalogStorage.js';

const WISH_KEY = 'f8h_wishlist';
const THEME_KEY = 'f8h_theme';

function readWishlist() {
  try {
    const saved = JSON.parse(localStorage.getItem(WISH_KEY) || '[]');
    return Array.isArray(saved) ? saved : [];
  } catch {
    return [];
  }
}

function checkIsAdminRoute() {
  if (typeof window === 'undefined') return false;
  return window.location.hash === '#admin' || new URLSearchParams(window.location.search).has('admin');
}

export default function App() {
  const { t, localize } = useLang();
  const [products, setProducts] = useState(getPublicCatalog);
  const [category, setCategory] = useState('all');
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState('featured');
  const [wishlist, setWishlist] = useState(readWishlist);
  const [active, setActive] = useState(() => findProductByLocation(getPublicCatalog()));
  const [fabric, setFabric] = useState('Royal Navy');
  const [chaise, setChaise] = useState('Right Facing Chaise');
  const [menuOpen, setMenuOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [showTop, setShowTop] = useState(false);

  // Admin routing & authentication state
  const [isAdminView, setIsAdminView] = useState(checkIsAdminRoute);
  const [isAuthenticated, setIsAuthenticated] = useState(isAdminAuthenticated);

  // Sync products when catalogStorage updates
  useEffect(() => {
    function onCatalogChange() {
      const publicList = getPublicCatalog();
      setProducts(publicList);
      // Update active modal if it was edited
      setActive((prev) => {
        if (!prev) return null;
        return publicList.find((p) => p.id === prev.id) || null;
      });
    }
    window.addEventListener('f8h_catalog_changed', onCatalogChange);
    return () => window.removeEventListener('f8h_catalog_changed', onCatalogChange);
  }, []);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products
      .filter((product) => {
        const matchCat = category === 'all' || product.cat === category;
        if (!q) return matchCat;
        const item = localize(product);
        const haystack = [
          product.name,
          product.desc,
          item.name,
          item.desc,
          product.cat,
          product.material,
          product.badge,
          item.badge,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        return matchCat && haystack.includes(q);
      })
      .sort((a, b) => {
        if (sort === 'price-asc') return (a.priceNum || 0) - (b.priceNum || 0);
        if (sort === 'price-desc') return (b.priceNum || 0) - (a.priceNum || 0);
        if (sort === 'rating-desc') return (b.rating || 0) - (a.rating || 0);
        if (sort === 'name-asc') return localize(a).name.localeCompare(localize(b).name, 'as');
        return a.id - b.id;
      });
  }, [category, products, query, sort, localize]);

  const savedProducts = products.filter((product) => wishlist.includes(product.id));

  useEffect(() => {
    localStorage.setItem(WISH_KEY, JSON.stringify(wishlist));
  }, [wishlist]);

  useEffect(() => {
    document.body.style.overflow = active || drawerOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [active, drawerOpen]);

  const closeProduct = useCallback(() => {
    setActive(null);
    clearProductUrl();
  }, []);

  const openProduct = useCallback((product, { replace = false } = {}) => {
    setActive(product);
    setFabric('Royal Navy');
    setChaise('Right Facing Chaise');
    writeProductUrl(product.slug, { replace });
  }, []);

  const openAdmin = useCallback(() => {
    setIsAdminView(true);
    window.location.hash = 'admin';
  }, []);

  const exitAdmin = useCallback(() => {
    setIsAdminView(false);
    if (window.location.hash === '#admin') {
      window.history.pushState(null, '', window.location.pathname + (window.location.search ? window.location.search : ''));
    }
  }, []);

  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 400);
    const onKey = (event) => {
      if (event.key === 'Escape') {
        closeProduct();
        setDrawerOpen(false);
        setMenuOpen(false);
      }
      // Alt + A shortcut to toggle Admin
      if (event.altKey && (event.key === 'a' || event.key === 'A')) {
        event.preventDefault();
        setIsAdminView((prev) => !prev);
      }
    };
    const onPop = () => {
      const isNowAdmin = checkIsAdminRoute();
      setIsAdminView(isNowAdmin);
      const product = findProductByLocation(getPublicCatalog());
      setActive(product);
      if (product) {
        setFabric('Royal Navy');
        setChaise('Right Facing Chaise');
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('keydown', onKey);
    window.addEventListener('popstate', onPop);
    window.addEventListener('hashchange', onPop);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('popstate', onPop);
      window.removeEventListener('hashchange', onPop);
    };
  }, [closeProduct]);

  useEffect(() => {
    if (isAdminView) {
      document.title = 'Catalog & Storefront Admin — Furniture8home';
      return;
    }

    const defaultTitle = 'Furniture8home — Solid Teak Sofas, L-Sectionals & Custom Furniture Guwahati';
    const defaultDesc = 'Guwahati\'s premier furniture workshop & showrooms in Maligaon and Paschim Boragaon. Handcrafted seasoned Assam teak sofas, custom-sized L-sectionals, dining sets & accent chairs. WhatsApp: 60025 84075.';

    const item = active ? localize(active) : null;

    if (item) {
      const productTitle = `${item.name} | Furniture8home Guwahati`;
      const productDesc = `${item.desc || item.name} Handcrafted in Guwahati with seasoned timber. Available at Furniture8home showrooms in Maligaon & Paschim Boragaon. Order on WhatsApp: 60025 84075.`;
      const productUrl = `https://furniture8home.com/?product=${encodeURIComponent(item.slug)}`;
      const productImg = item.img?.startsWith('http') || item.img?.startsWith('data:')
        ? item.img
        : `https://furniture8home.com/${item.img}`;

      document.title = productTitle;
      document.querySelector('meta[name="description"]')?.setAttribute('content', productDesc);
      document.querySelector('meta[property="og:title"]')?.setAttribute('content', productTitle);
      document.querySelector('meta[property="og:description"]')?.setAttribute('content', productDesc);
      document.querySelector('meta[property="og:image"]')?.setAttribute('content', productImg);
      document.querySelector('meta[property="og:url"]')?.setAttribute('content', productUrl);

      // Inject or update dynamic Product Schema for Google Rich Snippets
      let scriptTag = document.getElementById('product-schema-jsonld');
      if (!scriptTag) {
        scriptTag = document.createElement('script');
        scriptTag.id = 'product-schema-jsonld';
        scriptTag.type = 'application/ld+json';
        document.head.appendChild(scriptTag);
      }
      scriptTag.textContent = JSON.stringify({
        '@context': 'https://schema.org/',
        '@type': 'Product',
        name: item.name,
        image: productImg,
        description: item.desc || item.name,
        sku: `F8H-${item.id}`,
        mpn: `F8H-${item.id}`,
        brand: {
          '@type': 'Brand',
          name: 'Furniture8home',
        },
        offers: {
          '@type': 'Offer',
          url: productUrl,
          priceCurrency: 'INR',
          price: item.priceNum || 15000,
          priceValidUntil: '2027-12-31',
          availability: item.inStock !== false ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
          itemCondition: 'https://schema.org/NewCondition',
          seller: {
            '@type': 'Organization',
            name: 'Furniture8home',
          },
        },
        aggregateRating: {
          '@type': 'AggregateRating',
          ratingValue: String(item.rating || 4.9),
          reviewCount: item.reviews || 20,
        },
      });
    } else {
      document.title = defaultTitle;
      document.querySelector('meta[name="description"]')?.setAttribute('content', defaultDesc);
      document.querySelector('meta[property="og:title"]')?.setAttribute('content', defaultTitle);
      document.querySelector('meta[property="og:description"]')?.setAttribute('content', defaultDesc);
      document.querySelector('meta[property="og:image"]')?.setAttribute('content', 'https://furniture8home.com/images/original_site/hero.jpeg');
      document.querySelector('meta[property="og:url"]')?.setAttribute('content', 'https://furniture8home.com/');

      const existingScript = document.getElementById('product-schema-jsonld');
      if (existingScript) existingScript.remove();
    }
  }, [active, isAdminView, localize]);

  function filterCategory(next) {
    setCategory(next);
    setMenuOpen(false);
    document.getElementById('catalog')?.scrollIntoView({ behavior: 'smooth' });
  }

  function toggleWish(id) {
    setWishlist((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  }

  function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme');
    let next = 'dark';
    if (current === 'dark') next = 'light';
    else if (current === 'light') next = 'dark';
    else next = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem(THEME_KEY, next);
  }

  function resetFilters() {
    setCategory('all');
    setQuery('');
    setSort('featured');
  }

  // If in Admin view, render Admin Dashboard or Login prompt
  if (isAdminView) {
    if (!isAuthenticated) {
      return <AdminLogin onLoginSuccess={() => setIsAuthenticated(true)} onCancel={exitAdmin} />;
    }
    return (
      <AdminDashboard
        onExit={exitAdmin}
        onOpenProduct={(p) => {
          exitAdmin();
          openProduct(p);
        }}
      />
    );
  }

  return (
    <>
      <Header
        menuOpen={menuOpen}
        onToggleMenu={() => setMenuOpen((open) => !open)}
        onCloseMenu={() => setMenuOpen(false)}
        onFilter={filterCategory}
        wishlistCount={wishlist.length}
        onOpenWishlist={() => setDrawerOpen(true)}
        onToggleTheme={toggleTheme}
        onOpenAdmin={openAdmin}
      />
      <main>
        <Hero total={products.length} />
        <Catalog
          products={products}
          visible={visible}
          category={category}
          query={query}
          sort={sort}
          wishlist={wishlist}
          onQuery={setQuery}
          onSort={setSort}
          onFilter={filterCategory}
          onReset={resetFilters}
          onOpen={openProduct}
          onToggleWish={toggleWish}
        />
        <Bespoke />
        <WhyUs />
        <Reviews />
        <Showrooms />
        <FAQSection />
      </main>
      <Footer onFilter={filterCategory} onOpenAdmin={openAdmin} />
      <ProductModal
        product={active}
        fabric={fabric}
        chaise={chaise}
        saved={active ? wishlist.includes(active.id) : false}
        onClose={closeProduct}
        onFabric={setFabric}
        onChaise={setChaise}
        onToggleWish={toggleWish}
      />
      <WishlistDrawer
        open={drawerOpen}
        products={savedProducts}
        onClose={() => setDrawerOpen(false)}
        onToggle={toggleWish}
      />
      <a
        className="floating-wa-btn"
        href={waLink(t('waFloat'))}
        target="_blank"
        rel="noopener noreferrer"
        title={t('floatWa')}
      >
        <div className="pulse-dot" />
        <WaIcon size={20} />
        <span>{t('floatCta')}</span>
      </a>
      <button
        className={`back-to-top${showTop ? ' visible' : ''}`}
        title={t('backTop')}
        aria-label={t('backTop')}
        type="button"
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <line x1="12" y1="19" x2="12" y2="5" />
          <polyline points="5 12 12 5 19 12" />
        </svg>
      </button>
    </>
  );
}
