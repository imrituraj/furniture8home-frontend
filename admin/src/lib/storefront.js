// The backend (Cloudflare Worker), shared with the storefront build. Empty means same-origin,
// which is what local dev uses (Vite proxies /api and /media to the local Worker).
export const API_URL = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');

// The public storefront, for "View Store" and product links
const DEFAULT_STOREFRONT = import.meta.env.DEV ? 'http://localhost:5173' : 'https://furniture8home.com';
export const STOREFRONT_URL = (import.meta.env.VITE_STOREFRONT_URL || DEFAULT_STOREFRONT).replace(/\/+$/, '');

/**
 * Resolve a product or category image for display in the admin.
 * Uploaded photos ("media/<id>") are served by the backend; catalog images ("images/…") are
 * part of the same Vercel deployment as the admin.
 */
export function assetUrl(src) {
  if (!src || /^(https?:|data:|blob:)/.test(src)) return src;
  const path = src.replace(/^\/+/, '');
  return path.startsWith('media/') ? `${API_URL}/${path}` : `/${path}`;
}

export function productUrl(product) {
  return `${STOREFRONT_URL}/?product=${encodeURIComponent(product.slug)}`;
}
