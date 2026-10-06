import bundledProducts from '../data/products.json';

// Same-origin by default (Vite proxies /api to the backend in dev); set VITE_API_URL when the API lives elsewhere.
export const API_URL = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');

// Admin dashboard (served by the backend) — linked from the footer's staff login
export const ADMIN_URL = import.meta.env.VITE_ADMIN_URL || 'http://localhost:4000';

/**
 * Catalog shipped with the build, shown immediately and used if the API is unreachable.
 */
export const fallbackCatalog = bundledProducts.filter((product) => !product.hidden);

/**
 * Live catalog managed from the admin dashboard (hidden products already excluded).
 */
export async function fetchCatalog() {
  const res = await fetch(`${API_URL}/api/products`);
  if (!res.ok) throw new Error(`Catalog request failed (${res.status})`);
  return res.json();
}
