import bundledProducts from '../data/products.json';

// The backend (Cloudflare Worker) URL, e.g. https://furniture8home-backend.<you>.workers.dev.
// Empty means same-origin, which is what `npm run dev` uses (Vite proxies /api to the local Worker).
export const API_URL = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');

// Admin dashboard (built from admin/ into this deployment) — linked from the footer's staff login
export const ADMIN_URL =
  import.meta.env.VITE_ADMIN_URL || (import.meta.env.DEV ? 'http://localhost:5174/admin/' : 'https://admin.furniture8home.com/');

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
