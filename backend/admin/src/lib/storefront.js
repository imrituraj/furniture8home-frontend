export const STOREFRONT_URL = (import.meta.env.VITE_STOREFRONT_URL || 'http://localhost:5173').replace(/\/+$/, '');

/**
 * Product images are stored as paths relative to the storefront (e.g. "images/chairs/x.jpg").
 * Resolve them against the storefront so previews work from the admin's origin.
 */
export function assetUrl(src) {
  if (!src || /^(https?:|data:|blob:)/.test(src)) return src;
  return `${STOREFRONT_URL}/${src.replace(/^\/+/, '')}`;
}

export function productUrl(product) {
  return `${STOREFRONT_URL}/?product=${encodeURIComponent(product.slug)}`;
}
