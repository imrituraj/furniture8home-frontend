// Search and link-preview data for product pages. Shared by the storefront (which updates the
// page as products open) and the Vercel function in api/seo.js (which puts the same tags in the
// HTML, for crawlers and link previews that don't run JavaScript).

export const SITE = 'https://furniture8home.com';

export function productUrl(slug) {
  return `${SITE}/?product=${encodeURIComponent(slug)}`;
}

export function absoluteImage(src) {
  if (!src) return `${SITE}/og-image.jpg`;
  if (/^https?:\/\//.test(src)) return src;
  return `${SITE}/${String(src).replace(/^\/+/, '')}`;
}

function clip(text, max) {
  const clean = String(text || '').replace(/\s+/g, ' ').trim();
  return clean.length <= max ? clean : `${clean.slice(0, max - 1).replace(/\s+\S*$/, '')}…`;
}

export function productTitle(product) {
  return `${product.name} | Furniture8home Guwahati`;
}

/** About 155 characters: what it is, the price, and where to see it. */
export function productDescription(product) {
  const price = product.priceNum ? ` ${product.price}.` : '';
  const lead = clip(product.desc || product.name, 150 - price.length - 60);
  return `${lead}${price} See it at our Maligaon & Boragaon showrooms, Guwahati.`;
}

export function productJsonLd(product, categoryName = '') {
  const url = productUrl(product.slug);
  const images = [product.img, ...(Array.isArray(product.images) ? product.images : [])].filter(Boolean).map(absoluteImage);
  return [
    {
      '@context': 'https://schema.org',
      '@type': 'Product',
      '@id': `${url}#product`,
      name: product.name,
      url,
      image: images.length ? images : [absoluteImage('')],
      description: product.desc || product.name,
      sku: `F8H-${product.id}`,
      mpn: `F8H-${product.id}`,
      ...(categoryName ? { category: categoryName } : {}),
      ...(product.material ? { material: product.material } : {}),
      brand: { '@type': 'Brand', name: 'Furniture8home' },
      offers: {
        '@type': 'Offer',
        url,
        priceCurrency: 'INR',
        price: product.priceNum || 0,
        priceValidUntil: `${new Date().getFullYear() + 1}-12-31`,
        availability: product.inStock !== false ? 'https://schema.org/InStock' : 'https://schema.org/PreOrder',
        itemCondition: 'https://schema.org/NewCondition',
        seller: { '@id': `${SITE}/#organization` },
      },
      // No aggregateRating: Google only allows ratings from genuine customer reviews.
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE}/` },
        ...(categoryName ? [{ '@type': 'ListItem', position: 2, name: categoryName, item: `${SITE}/#catalog` }] : []),
        { '@type': 'ListItem', position: categoryName ? 3 : 2, name: product.name, item: url },
      ],
    },
  ];
}
