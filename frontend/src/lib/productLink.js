export function productPath(slug) {
  const params = new URLSearchParams(window.location.search);
  params.set('product', slug);
  const search = params.toString();
  return `${window.location.pathname}?${search}`;
}

export function productUrl(slug) {
  return `${window.location.origin}${productPath(slug)}`;
}

export function productSlugFromLocation() {
  return new URLSearchParams(window.location.search).get('product');
}

export function findProductByLocation(list) {
  const slug = productSlugFromLocation();
  if (!slug) return null;
  return list.find((product) => product.slug === slug) || null;
}

export function writeProductUrl(slug, { replace = false } = {}) {
  const next = productPath(slug);
  const current = `${window.location.pathname}${window.location.search}`;
  if (current === next) return;
  const method = replace ? 'replaceState' : 'pushState';
  window.history[method]({ product: slug }, '', next);
}

export function clearProductUrl() {
  const params = new URLSearchParams(window.location.search);
  if (!params.has('product')) return;
  params.delete('product');
  const search = params.toString();
  window.history.pushState({}, '', `${window.location.pathname}${search ? `?${search}` : ''}`);
}
