import { readFileSync, writeFileSync, existsSync, renameSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const SEED_FILE = fileURLToPath(new URL('../data/category-seed.json', import.meta.url));
const CATEGORIES_FILE = fileURLToPath(new URL('../data/categories.json', import.meta.url));

const MAX_CATEGORIES = 100;
const DEFAULT_IMG = 'images/lsofa/0e06df108cba5f38f4c09e7d95643405.jpg';

export class CategoryError extends Error {}

function text(value, max) {
  return typeof value === 'string' || typeof value === 'number' ? String(value).trim().slice(0, max) : '';
}

// Same rules as product images (see catalog.js safeImage), kept local to avoid a circular import
function safeImage(value) {
  const img = text(value, 15_000_000);
  if (!img) return DEFAULT_IMG;
  if (/^data:image\/(png|jpe?g|webp|gif|avif);base64,[a-z0-9+/=\s]+$/i.test(img)) return img;
  if (/^https:\/\/[^\s"'<>]+$/i.test(img)) return img;
  if (/^\/?images\/[\w\-./~ ]+$/.test(img) && !img.includes('..')) return img;
  throw new CategoryError('Image must be an uploaded image, an https:// URL, or a path under images/');
}

function slugId(name) {
  return text(name, 60)
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * A category's id is what products store in `cat`, so it never changes after creation.
 */
function normalize(category, index) {
  if (!category || typeof category !== 'object' || Array.isArray(category)) {
    throw new CategoryError('Each category must be an object');
  }
  const id = text(category.id, 60);
  const name = text(category.name, 60);
  if (!id) throw new CategoryError('Category id is missing');
  if (!name) throw new CategoryError('Please give the category a name');
  const sort = Number(category.sort);
  return {
    id,
    name,
    nameAs: text(category.nameAs, 60),
    img: safeImage(category.img),
    sort: Number.isFinite(sort) ? Math.round(sort) : index,
    hidden: category.hidden === true,
    // Show the L-shape orientation picker for products in this category
    chaise: category.chaise === true,
  };
}

let categories = [];

function sorted(list) {
  return [...list].sort((a, b) => a.sort - b.sort);
}

function persist(list) {
  categories = sorted(list);
  const tmp = `${CATEGORIES_FILE}.tmp`;
  writeFileSync(tmp, JSON.stringify(categories, null, 2), { mode: 0o600 });
  renameSync(tmp, CATEGORIES_FILE);
  return categories;
}

function load() {
  if (existsSync(CATEGORIES_FILE)) {
    try {
      const parsed = JSON.parse(readFileSync(CATEGORIES_FILE, 'utf8'));
      if (Array.isArray(parsed)) return sorted(parsed.map(normalize));
    } catch (err) {
      console.error('Failed to read categories.json', err);
    }
    const backup = `${CATEGORIES_FILE}.corrupt-${Date.now()}`;
    renameSync(CATEGORIES_FILE, backup);
    console.error(`Moved unreadable categories to ${backup}; starting from the default categories.`);
  }
  const seed = JSON.parse(readFileSync(SEED_FILE, 'utf8'));
  return persist(seed.map(normalize));
}

categories = load();

export function getCategories() {
  return categories;
}

export function getPublicCategories() {
  return categories.filter((c) => !c.hidden);
}

export function getCategory(id) {
  return categories.find((c) => c.id === id) || null;
}

export function hasCategory(id) {
  return categories.some((c) => c.id === id);
}

export function categoryOffersChaise(id) {
  return getCategory(id)?.chaise === true;
}

export function addCategory(data) {
  if (categories.length >= MAX_CATEGORIES) throw new CategoryError(`You can have at most ${MAX_CATEGORIES} categories`);
  const base = slugId(data?.name);
  if (!base) throw new CategoryError('Please give the category a name using letters or numbers');
  let id = base;
  for (let n = 2; hasCategory(id); n += 1) id = `${base}-${n}`;
  const sort = categories.reduce((max, c) => Math.max(max, c.sort), -1) + 1;
  const category = normalize({ ...data, id, sort }, categories.length);
  persist([...categories, category]);
  return category;
}

export function updateCategory(id, updates) {
  const current = getCategory(id);
  if (!current) return null;
  if (!updates || typeof updates !== 'object' || Array.isArray(updates)) throw new CategoryError('Invalid update');
  const next = normalize({ ...current, ...updates, id: current.id }, current.sort);
  persist(categories.map((c) => (c.id === id ? next : c)));
  return next;
}

/**
 * Save a new display order. `ids` must list every category exactly once.
 */
export function reorderCategories(ids) {
  if (!Array.isArray(ids) || ids.length !== categories.length || new Set(ids).size !== ids.length || !ids.every(hasCategory)) {
    throw new CategoryError('The new order must list every category once');
  }
  return persist(categories.map((c) => ({ ...c, sort: ids.indexOf(c.id) })));
}

/**
 * Delete a category. Refused while products still use it, so nothing is silently orphaned.
 */
export function deleteCategory(id, productCount) {
  if (!hasCategory(id)) return false;
  if (productCount > 0) {
    throw new CategoryError(`${productCount} product${productCount === 1 ? ' is' : 's are'} still in this category. Move or delete them first.`);
  }
  persist(categories.filter((c) => c.id !== id));
  return true;
}
