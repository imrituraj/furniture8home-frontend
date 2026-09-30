import initialProducts from '../data/products.json';

const STORAGE_KEY = 'f8h_custom_catalog';
const PIN_KEY = 'f8h_admin_pin';
const SESSION_KEY = 'f8h_admin_session';
const DEFAULT_PIN = '8888';

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

/**
 * Normalize product to ensure all required fields are present
 */
export function normalizeProduct(product, existingList = []) {
  const priceNum = parsePriceNum(product.priceNum ?? product.price);
  const formattedPrice = formatPrice(priceNum);
  
  let id = product.id;
  if (!id) {
    const maxId = existingList.reduce((max, p) => Math.max(max, Number(p.id) || 0), 100);
    id = maxId + 1;
  }

  const name = (product.name || 'Untitled Furniture Piece').trim();
  const slug = product.slug || slugify(name) || `piece-${id}`;

  return {
    id: Number(id),
    slug,
    name,
    cat: product.cat || 'Accent',
    price: formattedPrice,
    priceNum,
    badge: product.badge || '',
    rating: Number(product.rating) || 4.9,
    reviews: Number(product.reviews) || 12,
    img: product.img || 'images/chairs/B612_20221205_111922_652.jpg',
    desc: product.desc || '',
    dims: product.dims || '',
    material: product.material || '',
    features: Array.isArray(product.features) ? product.features : [],
    inStock: product.inStock !== false, // default true
    hidden: Boolean(product.hidden),    // default false
    as: product.as || null,             // optional Assamese localization overrides
  };
}

/**
 * Get all products currently stored (including hidden ones) for Admin
 */
export function getStoredCatalog() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((item) => normalizeProduct(item, parsed));
      }
    }
  } catch (err) {
    console.error('Failed to read catalog from storage', err);
  }

  // Fallback to initialProducts
  const initial = initialProducts.map((item) => normalizeProduct(item, initialProducts));
  saveCatalog(initial);
  return initial;
}

/**
 * Get only public (non-hidden) products for Storefront
 */
export function getPublicCatalog() {
  return getStoredCatalog().filter((product) => !product.hidden);
}

/**
 * Save products to localStorage and emit custom event
 */
export function saveCatalog(products) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
    window.dispatchEvent(new CustomEvent('f8h_catalog_changed', { detail: products }));
  } catch (err) {
    console.error('Failed to save catalog to localStorage', err);
  }
  return products;
}

/**
 * Update a single product by ID
 */
export function updateProduct(id, updates) {
  const current = getStoredCatalog();
  const index = current.findIndex((p) => Number(p.id) === Number(id));
  if (index === -1) return null;

  const target = current[index];
  const merged = { ...target, ...updates };

  // Recalculate price if either price or priceNum was passed
  if ('price' in updates || 'priceNum' in updates) {
    const priceNum = parsePriceNum(updates.priceNum ?? updates.price);
    merged.priceNum = priceNum;
    merged.price = formatPrice(priceNum);
  }

  // Recalculate slug if title changed and slug wasn't explicitly supplied
  if (updates.name && !updates.slug) {
    merged.slug = slugify(updates.name) || target.slug;
  }

  const normalized = normalizeProduct(merged, current);
  current[index] = normalized;
  saveCatalog(current);
  return normalized;
}

/**
 * Toggle stock status (inStock = true/false)
 */
export function toggleStock(id) {
  const current = getStoredCatalog();
  const item = current.find((p) => Number(p.id) === Number(id));
  if (!item) return null;
  return updateProduct(id, { inStock: item.inStock === false });
}

/**
 * Toggle visibility / remove from public store (hidden = true/false)
 */
export function toggleVisibility(id) {
  const current = getStoredCatalog();
  const item = current.find((p) => Number(p.id) === Number(id));
  if (!item) return null;
  return updateProduct(id, { hidden: !item.hidden });
}

/**
 * Delete a product permanently
 */
export function deleteProduct(id) {
  const current = getStoredCatalog();
  const filtered = current.filter((p) => Number(p.id) !== Number(id));
  saveCatalog(filtered);
  return filtered;
}

/**
 * Add a new product
 */
export function addProduct(newProductData) {
  const current = getStoredCatalog();
  const normalized = normalizeProduct(newProductData, current);
  // Place newly added items at the beginning of the catalog
  const updated = [normalized, ...current];
  saveCatalog(updated);
  return normalized;
}

/**
 * Duplicate a product
 */
export function duplicateProduct(id) {
  const current = getStoredCatalog();
  const item = current.find((p) => Number(p.id) === Number(id));
  if (!item) return null;

  const maxId = current.reduce((max, p) => Math.max(max, Number(p.id) || 0), 100);
  const newId = maxId + 1;
  const clone = {
    ...item,
    id: newId,
    name: `${item.name} (Copy)`,
    slug: `${item.slug}-copy-${newId}`,
    badge: item.badge ? `${item.badge}` : 'New Variation',
  };

  const normalized = normalizeProduct(clone, current);
  const updated = [normalized, ...current];
  saveCatalog(updated);
  return normalized;
}

/**
 * Reset catalog to factory defaults from products.json
 */
export function resetToDefaultCatalog() {
  const initial = initialProducts.map((item) => normalizeProduct(item, initialProducts));
  saveCatalog(initial);
  return initial;
}

/**
 * Export catalog as clean JSON file download
 */
export function exportCatalogJson(customFilename = 'products.json') {
  const current = getStoredCatalog();
  const jsonStr = JSON.stringify(current, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = customFilename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  return jsonStr;
}

/**
 * Import a JSON string or parsed array to overwrite or merge catalog
 */
export function importCatalogJson(jsonInput) {
  let data = jsonInput;
  if (typeof jsonInput === 'string') {
    data = JSON.parse(jsonInput);
  }
  if (!Array.isArray(data) || data.length === 0) {
    throw new Error('Invalid JSON: Must be an array of products');
  }

  const normalizedList = data.map((item) => normalizeProduct(item, data));
  saveCatalog(normalizedList);
  return normalizedList;
}

/**
 * Admin Authentication Helpers
 */
export function getAdminPin() {
  return localStorage.getItem(PIN_KEY) || DEFAULT_PIN;
}

export function setAdminPin(newPin) {
  if (!newPin || String(newPin).trim().length < 4) {
    throw new Error('PIN must be at least 4 digits');
  }
  localStorage.setItem(PIN_KEY, String(newPin).trim());
  return true;
}

export function isAdminAuthenticated() {
  return sessionStorage.getItem(SESSION_KEY) === 'true';
}

export function loginAdmin(enteredPin) {
  const currentPin = getAdminPin();
  if (String(enteredPin).trim() === currentPin) {
    sessionStorage.setItem(SESSION_KEY, 'true');
    return true;
  }
  return false;
}

export function logoutAdmin() {
  sessionStorage.removeItem(SESSION_KEY);
}
