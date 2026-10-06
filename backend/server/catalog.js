import { readFileSync, writeFileSync, existsSync, renameSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { hasCategory } from './categories.js';

const SEED_FILE = fileURLToPath(new URL('../data/products.json', import.meta.url));
const CATALOG_FILE = fileURLToPath(new URL('../data/catalog.json', import.meta.url));

/**
 * Format a number or string into ₹ formatted string (e.g. 14500 -> "₹14,500")
 */
export function formatPrice(val) {
  if (val === undefined || val === null || val === '') return '₹0';
  const num = typeof val === 'number' ? val : parseInt(String(val).replace(/[^0-9]/g, ''), 10) || 0;
  return `₹${num.toLocaleString('en-IN')}`;
}

/**
 * Extract clean numeric price
 */
export function parsePriceNum(val) {
  if (typeof val === 'number') return Math.max(0, Math.round(val));
  const num = parseInt(String(val || '').replace(/[^0-9]/g, ''), 10);
  return isNaN(num) ? 0 : num;
}

/**
 * Generate URL slug from title
 */
export function slugify(text) {
  return String(text || '')
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

const MAX_PRICE = 10_000_000; // ₹1 crore — well above any real piece, guards against typos and overflow
const MAX_PRODUCTS = 2000;
const MAX_FEATURES = 20;
const DEFAULT_IMG = 'images/chairs/B612_20221205_111922_652.jpg';

export class ValidationError extends Error {}

function text(value, max) {
  return typeof value === 'string' || typeof value === 'number' ? String(value).trim().slice(0, max) : '';
}

/**
 * Only allow images that are safe to put in src/href on the storefront:
 * site-relative paths, https URLs, or inline raster images uploaded from the admin.
 */
export function safeImage(value) {
  const img = text(value, 15_000_000);
  if (!img) return DEFAULT_IMG;
  if (/^data:image\/(png|jpe?g|webp|gif|avif);base64,[a-z0-9+/=\s]+$/i.test(img)) return img;
  if (/^https:\/\/[^\s"'<>]+$/i.test(img)) return img;
  if (/^\/?images\/[\w\-./~ ]+$/.test(img) && !img.includes('..')) return img;
  throw new ValidationError('Image must be an uploaded image, an https:// URL, or a path under images/');
}

function safeLocalization(as) {
  if (!as || typeof as !== 'object' || Array.isArray(as)) return null;
  const name = text(as.name, 200);
  const desc = text(as.desc, 2000);
  return name || desc ? { name, desc } : null;
}

function nextId(list) {
  return list.reduce((max, p) => Math.max(max, Number(p.id) || 0), 100) + 1;
}

/**
 * Normalize product to ensure all required fields are present
 */
export function normalizeProduct(product, existingList = []) {
  if (!product || typeof product !== 'object' || Array.isArray(product)) {
    throw new ValidationError('Each product must be an object');
  }
  const priceNum = Math.min(MAX_PRICE, parsePriceNum(product.priceNum ?? product.price));
  const rawId = Math.floor(Number(product.id));
  const id = Number.isSafeInteger(rawId) && rawId > 0 ? rawId : nextId(existingList);
  const name = text(product.name, 200) || 'Untitled Furniture Piece';
  const slug = slugify(text(product.slug, 200)) || slugify(name) || `piece-${id}`;
  const rating = Number(product.rating);
  const reviews = Math.floor(Number(product.reviews));

  return {
    id,
    slug,
    name,
    cat: text(product.cat, 60) || 'Accent',
    price: formatPrice(priceNum),
    priceNum,
    badge: text(product.badge, 60),
    rating: rating > 0 && rating <= 5 ? Math.round(rating * 10) / 10 : 4.9,
    reviews: reviews >= 0 && reviews < 1_000_000 ? reviews : 12,
    img: safeImage(product.img),
    desc: text(product.desc, 2000),
    dims: text(product.dims, 300),
    material: text(product.material, 300),
    features: Array.isArray(product.features)
      ? product.features.map((f) => text(f, 200)).filter(Boolean).slice(0, MAX_FEATURES)
      : [],
    inStock: product.inStock !== false, // default true
    hidden: product.hidden === true,    // default false
    as: safeLocalization(product.as),   // optional Assamese localization overrides
  };
}

function readSeed() {
  const seed = JSON.parse(readFileSync(SEED_FILE, 'utf8'));
  return seed.map((item) => normalizeProduct(item, seed));
}

let catalog = [];

function load() {
  if (existsSync(CATALOG_FILE)) {
    try {
      const parsed = JSON.parse(readFileSync(CATALOG_FILE, 'utf8'));
      if (Array.isArray(parsed)) {
        return parsed.map((item) => {
          try {
            return normalizeProduct(item, parsed);
          } catch {
            // Saved before image validation existed — keep the product, drop the unsafe image
            return normalizeProduct({ ...item, img: DEFAULT_IMG }, parsed);
          }
        });
      }
    } catch (err) {
      console.error('Failed to read catalog.json', err);
    }
    // Keep the unreadable file for recovery instead of silently overwriting it
    const backup = `${CATALOG_FILE}.corrupt-${Date.now()}`;
    renameSync(CATALOG_FILE, backup);
    console.error(`Moved unreadable catalog to ${backup}; starting from the factory catalog.`);
  }
  return persist(readSeed());
}

function persist(products) {
  catalog = products;
  // Write to a temp file first so a crash mid-write can't corrupt the catalog
  const tmp = `${CATALOG_FILE}.tmp`;
  writeFileSync(tmp, JSON.stringify(products, null, 2), { mode: 0o600 });
  renameSync(tmp, CATALOG_FILE);
  return products;
}

catalog = load();

export function getCatalog() {
  return catalog;
}

/**
 * Only public (non-hidden) products for the storefront
 */
export function getPublicCatalog() {
  return catalog.filter((product) => !product.hidden);
}

// Products created or edited from the admin must belong to a managed category
function assertCategory(cat) {
  if (!hasCategory(text(cat, 60))) throw new ValidationError('Choose a category from the list (add new ones in the Categories tab)');
}

export function updateProduct(id, updates) {
  const index = catalog.findIndex((p) => p.id === Number(id));
  if (index === -1) return null;

  const target = catalog[index];
  if (!updates || typeof updates !== 'object' || Array.isArray(updates)) throw new ValidationError('Invalid update');
  if ('cat' in updates) assertCategory(updates.cat);
  const merged = { ...target, ...updates, id: target.id };

  // Recalculate price if either price or priceNum was passed
  if ('price' in updates || 'priceNum' in updates) {
    merged.priceNum = parsePriceNum(updates.priceNum ?? updates.price);
  }

  // Recalculate slug if title changed and slug wasn't explicitly supplied
  if (updates.name && !updates.slug) {
    merged.slug = slugify(updates.name) || target.slug;
  }

  const normalized = normalizeProduct(merged, catalog);
  const next = [...catalog];
  next[index] = normalized;
  persist(next);
  return normalized;
}

export function addProduct(data) {
  if (catalog.length >= MAX_PRODUCTS) throw new ValidationError(`A catalog can hold at most ${MAX_PRODUCTS} products`);
  const { id: _ignored, ...rest } = data;
  assertCategory(rest.cat);
  const normalized = normalizeProduct(rest, catalog);
  // Place newly added items at the beginning of the catalog
  persist([normalized, ...catalog]);
  return normalized;
}

export function duplicateProduct(id) {
  const item = catalog.find((p) => p.id === Number(id));
  if (!item) return null;

  const newId = nextId(catalog);
  const clone = normalizeProduct({
    ...item,
    id: newId,
    name: `${item.name} (Copy)`,
    slug: `${item.slug}-copy-${newId}`,
    badge: item.badge || 'New Variation',
  }, catalog);
  persist([clone, ...catalog]);
  return clone;
}

export function deleteProduct(id) {
  const before = catalog.length;
  persist(catalog.filter((p) => p.id !== Number(id)));
  return catalog.length < before;
}

export function importCatalog(data) {
  if (!Array.isArray(data) || data.length === 0) {
    throw new ValidationError('Invalid JSON: Must be an array of products');
  }
  if (data.length > MAX_PRODUCTS) throw new ValidationError(`A catalog can hold at most ${MAX_PRODUCTS} products`);

  const normalized = data.map((item) => normalizeProduct(item, data));
  // Duplicate ids would make edits hit the wrong product — give repeats a fresh id
  let maxId = nextId(normalized) - 1;
  const seen = new Set();
  for (const product of normalized) {
    if (seen.has(product.id)) product.id = ++maxId;
    seen.add(product.id);
  }
  return persist(normalized);
}

/**
 * Reset catalog to factory defaults from data/products.json
 */
export function resetCatalog() {
  return persist(readSeed());
}
