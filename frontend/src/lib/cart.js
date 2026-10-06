const CART_KEY = 'f8h_cart';
export const MAX_QTY = 20;

export function formatRupees(amount) {
  return `₹${Number(amount || 0).toLocaleString('en-IN')}`;
}

export function readCart() {
  try {
    const saved = JSON.parse(localStorage.getItem(CART_KEY) || '[]');
    return Array.isArray(saved) ? saved.filter((line) => line && line.key && line.id) : [];
  } catch {
    return [];
  }
}

export function writeCart(cart) {
  try {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
  } catch {
    // Storage unavailable (private mode) — the cart just won't survive a reload
  }
}

/**
 * Add a product with its chosen options; the same product + options merges into one line.
 */
// Pass chaise only for products whose category offers the L-shape option
export function addToCart(cart, product, { fabric, chaise }, qty = 1) {
  const options = { fabric, chaise: chaise || '' };
  const key = `${product.id}|${options.fabric}|${options.chaise}`;
  const existing = cart.find((line) => line.key === key);
  if (existing) {
    return cart.map((line) => (line.key === key ? { ...line, qty: Math.min(MAX_QTY, line.qty + qty) } : line));
  }
  return [...cart, { key, id: product.id, qty, ...options }];
}

/**
 * Join cart lines with live product data. Lines whose product was removed are dropped;
 * hidden or out-of-stock products stay visible but block checkout.
 */
export function resolveCart(cart, products) {
  return cart
    .map((line) => {
      const product = products.find((p) => p.id === line.id);
      return product ? { ...line, product, available: product.inStock !== false } : null;
    })
    .filter(Boolean);
}
