import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Header from './components/Header.jsx';
import Hero from './components/Hero.jsx';
import Catalog from './components/Catalog.jsx';
import ProductModal from './components/ProductModal.jsx';
import WishlistDrawer from './components/WishlistDrawer.jsx';
import CartDrawer from './components/CartDrawer.jsx';
import Checkout from './components/Checkout.jsx';
import TrackOrder from './components/TrackOrder.jsx';
import BookVisit from './components/BookVisit.jsx';
import { Bespoke, FAQSection, Footer, Reviews, Showrooms, WhyUs } from './components/SiteSections.jsx';
import { ArrowUpIcon, WaIcon } from './components/Icons.jsx';
import { waLink } from './lib/whatsapp.js';
import { clearProductUrl, findProductByLocation, writeProductUrl } from './lib/productLink.js';
import { useLang } from './i18n/LanguageContext.jsx';
import { useCategories } from './lib/categories.jsx';
import { ADMIN_URL, fallbackCatalog, fetchCatalog } from './lib/catalog.js';
import { MAX_QTY, addToCart, readCart, resolveCart, writeCart } from './lib/cart.js';
import { fitFor, readRoom, saveRoom } from './lib/fit.js';
import { SITE, absoluteImage, productDescription, productJsonLd, productTitle, productUrl } from './lib/seo.js';

// Emails link to the tracking page as ?track=<order number>
function readTrackParam() {
  return new URLSearchParams(window.location.search).get('track') || '';
}

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

function readInitialQuery() {
  return new URLSearchParams(window.location.search).get('q') || '';
}

function readIsDark() {
  const set = document.documentElement.getAttribute('data-theme');
  if (set) return set === 'dark';
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

export default function App() {
  const { t, localize } = useLang();
  const categories = useCategories();
  const [products, setProducts] = useState(fallbackCatalog);
  const [category, setCategory] = useState('all');
  const [query, setQuery] = useState(readInitialQuery);
  const [isDark, setIsDark] = useState(readIsDark);
  const [sort, setSort] = useState('featured');
  const [wishlist, setWishlist] = useState(readWishlist);
  const [active, setActive] = useState(() => findProductByLocation(fallbackCatalog));
  const [fabric, setFabric] = useState('Royal Navy');
  const [chaise, setChaise] = useState('Right Facing Chaise');
  const [menuOpen, setMenuOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [cart, setCart] = useState(readCart);
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [showTop, setShowTop] = useState(false);
  const [room, setRoom] = useState(readRoom);
  const [fitOnly, setFitOnly] = useState(false);
  const [trackId, setTrackId] = useState(readTrackParam);
  // ?track (even without an order number, e.g. from the Shipping page) opens the tracking window
  const [trackOpen, setTrackOpen] = useState(() => new URLSearchParams(window.location.search).has('track'));
  const [visit, setVisit] = useState(null); // showroom name while the booking window is open

  const productsRef = useRef(products);
  productsRef.current = products;

  // Replace the bundled catalog with the live one managed from the admin dashboard
  useEffect(() => {
    let cancelled = false;
    fetchCatalog()
      .then((list) => {
        if (cancelled || !Array.isArray(list)) return;
        setProducts(list);
        // Re-resolve the open product against the live data (it may have been edited or hidden)
        setActive((prev) => (prev ? list.find((p) => p.id === prev.id) || null : findProductByLocation(list)));
      })
      .catch((err) => console.warn('Using bundled catalog:', err.message));
    return () => {
      cancelled = true;
    };
  }, []);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products
      .filter((product) => {
        const matchCat = category === 'all' || product.cat === category;
        // "Only show what fits": hide pieces that are too big for the customer's room
        if (fitOnly && room && fitFor(product, room) === 'no') return false;
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
        if (sort === 'rating-desc') return (b.reviews === 0 ? 0 : b.rating || 0) - (a.reviews === 0 ? 0 : a.rating || 0);
        if (sort === 'name-asc') return localize(a).name.localeCompare(localize(b).name, 'as');
        return a.id - b.id;
      });
  }, [category, products, query, sort, localize, fitOnly, room]);

  const savedProducts = products.filter((product) => wishlist.includes(product.id));

  const related = useMemo(() => {
    if (!active) return [];
    const sameCat = products.filter((p) => p.id !== active.id && p.cat === active.cat);
    const others = products.filter((p) => p.id !== active.id && p.cat !== active.cat);
    return [...sameCat, ...others].slice(0, 4);
  }, [active, products]);

  const cartLines = useMemo(() => resolveCart(cart, products), [cart, products]);
  const cartTotal = cartLines.reduce((sum, line) => sum + line.product.priceNum * line.qty, 0);
  const cartCount = cartLines.reduce((sum, line) => sum + line.qty, 0);
  const canCheckout = cartLines.length > 0 && cartLines.every((line) => line.available);

  useEffect(() => {
    localStorage.setItem(WISH_KEY, JSON.stringify(wishlist));
  }, [wishlist]);

  useEffect(() => {
    writeCart(cart);
  }, [cart]);

  useEffect(() => {
    document.body.style.overflow = active || drawerOpen || cartOpen || checkoutOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [active, drawerOpen, cartOpen, checkoutOpen]);

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

  function cartOptions(product) {
    return { fabric, chaise: categories.offersChaise(product.cat) ? chaise : '' };
  }

  function handleAddToCart(product) {
    setCart((current) => addToCart(current, product, cartOptions(product)));
    setCartOpen(true);
  }

  function handleBuyNow(product) {
    setCart((current) => addToCart(current, product, cartOptions(product)));
    closeProduct();
    setCheckoutOpen(true);
  }

  function setCartQty(key, qty) {
    setCart((current) => current.map((line) => (line.key === key ? { ...line, qty: Math.min(MAX_QTY, Math.max(1, qty)) } : line)));
  }

  function removeFromCart(key) {
    setCart((current) => current.filter((line) => line.key !== key));
  }

  const openAdmin = useCallback(() => {
    window.location.href = ADMIN_URL;
  }, []);

  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 400);
    const onKey = (event) => {
      if (event.key === 'Escape') {
        closeProduct();
        setDrawerOpen(false);
        setCartOpen(false);
        setMenuOpen(false);
      }
    };
    const onPop = () => {
      const product = findProductByLocation(productsRef.current);
      setActive(product);
      if (product) {
        setFabric('Royal Navy');
        setChaise('Right Facing Chaise');
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('keydown', onKey);
    window.addEventListener('popstate', onPop);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('popstate', onPop);
    };
  }, [closeProduct]);

  useEffect(() => {
    const defaultTitle = 'Furniture8home — Solid Teak Sofas, L-Sectionals & Custom Furniture Guwahati';
    const defaultDesc = 'Guwahati\'s premier furniture workshop & showrooms in Maligaon and Paschim Boragaon. Handcrafted seasoned Assam teak sofas, custom-sized L-sectionals, dining sets & accent chairs. WhatsApp: 60025 84075.';

    const item = active ? localize(active) : null;
    const setMeta = (selector, value) => document.querySelector(selector)?.setAttribute('content', value);

    let title = defaultTitle;
    let desc = defaultDesc;
    let url = `${SITE}/`;
    let image = `${SITE}/og-image.jpg`;
    if (item) {
      title = productTitle(item);
      desc = productDescription(item);
      url = productUrl(item.slug);
      image = absoluteImage(item.img);
    }

    document.title = title;
    setMeta('meta[name="description"]', desc);
    setMeta('meta[property="og:title"]', title);
    setMeta('meta[property="og:description"]', desc);
    setMeta('meta[property="og:image"]', image);
    setMeta('meta[property="og:url"]', url);
    setMeta('meta[name="twitter:title"]', title);
    setMeta('meta[name="twitter:description"]', desc);
    setMeta('meta[name="twitter:image"]', image);
    setMeta('meta[name="twitter:url"]', url);
    // Each product is its own page for search engines, not a copy of the home page
    document.querySelector('link[rel="canonical"]')?.setAttribute('href', url);

    let scriptTag = document.getElementById('product-schema-jsonld');
    if (item) {
      if (!scriptTag) {
        scriptTag = document.createElement('script');
        scriptTag.id = 'product-schema-jsonld';
        scriptTag.type = 'application/ld+json';
        document.head.appendChild(scriptTag);
      }
      scriptTag.textContent = JSON.stringify(productJsonLd(active, categories.label(active.cat)));
    } else if (scriptTag) {
      scriptTag.remove();
    }
  }, [active, localize, categories]);

  function filterCategory(next) {
    setCategory(next);
    setMenuOpen(false);
    document.getElementById('catalog')?.scrollIntoView({ behavior: 'smooth' });
  }

  function updateRoom(next) {
    setRoom(next);
    saveRoom(next);
    if (!next) setFitOnly(false);
  }

  const closeTrack = useCallback(() => {
    setTrackOpen(false);
    setTrackId('');
    // Drop ?track= so a refresh doesn't reopen it
    const params = new URLSearchParams(window.location.search);
    if (params.has('track')) {
      params.delete('track');
      const search = params.toString();
      window.history.replaceState(null, '', `${window.location.pathname}${search ? `?${search}` : ''}${window.location.hash}`);
    }
  }, []);

  function toggleWish(id) {
    setWishlist((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  }

  function toggleTheme() {
    const next = isDark ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem(THEME_KEY, next);
    setIsDark(!isDark);
  }

  function resetFilters() {
    setCategory('all');
    setQuery('');
    setSort('featured');
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
        cartCount={cartCount}
        onOpenCart={() => setCartOpen(true)}
        isDark={isDark}
        onToggleTheme={toggleTheme}
        onTrack={() => { setMenuOpen(false); setTrackOpen(true); }}
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
          room={room}
          onRoom={updateRoom}
          fitOnly={fitOnly}
          onFitOnly={setFitOnly}
        />
        <Bespoke />
        <WhyUs />
        <Reviews />
        <Showrooms onBook={setVisit} />
        <FAQSection />
      </main>
      <Footer onFilter={filterCategory} onOpenAdmin={openAdmin} onTrack={() => setTrackOpen(true)} onBook={() => setVisit('Maligaon')} />
      <ProductModal
        product={active}
        related={related}
        onOpen={openProduct}
        fabric={fabric}
        chaise={chaise}
        saved={active ? wishlist.includes(active.id) : false}
        onClose={closeProduct}
        onFabric={setFabric}
        onChaise={setChaise}
        onToggleWish={toggleWish}
        onAddToCart={handleAddToCart}
        onBuyNow={handleBuyNow}
        room={room}
        onRoom={updateRoom}
      />
      <TrackOrder open={trackOpen} initialOrderId={trackId} onClose={closeTrack} />
      <BookVisit open={Boolean(visit)} initialShowroom={visit || 'Maligaon'} onClose={() => setVisit(null)} />
      <WishlistDrawer
        open={drawerOpen}
        products={savedProducts}
        onClose={() => setDrawerOpen(false)}
        onOpen={openProduct}
        onToggle={toggleWish}
      />
      <CartDrawer
        open={cartOpen}
        lines={cartLines}
        total={cartTotal}
        canCheckout={canCheckout}
        onClose={() => setCartOpen(false)}
        onOpen={openProduct}
        onQty={setCartQty}
        onRemove={removeFromCart}
        onCheckout={() => {
          setCartOpen(false);
          setCheckoutOpen(true);
        }}
      />
      <Checkout
        open={checkoutOpen}
        lines={cartLines}
        total={cartTotal}
        onClose={() => setCheckoutOpen(false)}
        onComplete={() => setCart([])}
      />
      <a
        className="floating-wa-btn"
        href={waLink(t('waFloat'))}
        target="_blank"
        rel="noopener noreferrer"
        title={t('floatWa')}
      >
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
        <ArrowUpIcon size={18} />
      </button>
    </>
  );
}
