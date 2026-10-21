// Product pages and the sitemap, built from the live catalog.
//
// The storefront is a single-page app, so every URL used to return the same HTML: crawlers that
// don't run JavaScript (link previews on WhatsApp and Facebook, Bing) saw the home page's title
// and image for every product. vercel.json sends /?product=<slug> and /sitemap.xml here.
//   /api/seo?type=product&slug=<slug>  the app's index.html with that product's tags and content
//   /api/seo?type=sitemap              every product currently on sale
import { SITE, absoluteImage, productDescription, productJsonLd, productTitle, productUrl } from '../frontend/src/lib/seo.js';

export const config = { runtime: 'edge' };

const API = 'https://furniture8home-backend.ritur-dev.workers.dev';
const PAGES = ['privacy', 'terms', 'shipping', 'refunds', 'contact'];

const escapeHtml = (text) =>
  String(text ?? '').replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch]);

async function getJson(path) {
  const res = await fetch(`${API}${path}`, { headers: { Origin: SITE } });
  if (!res.ok) throw new Error(`${path} returned ${res.status}`);
  return res.json();
}

async function catalog() {
  const [products, categories] = await Promise.all([getJson('/api/products'), getJson('/api/categories').catch(() => [])]);
  return { products: products.filter((p) => !p.hidden), categories };
}

// ---------- Product pages ----------

async function appHtml(request) {
  const own = new URL('/index.html', request.url);
  const res = await fetch(own);
  if (res.ok) return res.text();
  // A protected preview deployment can't fetch itself; the live page has the same tags
  return (await fetch(`${SITE}/index.html`)).text();
}

function setTag(html, pattern, replacement) {
  return pattern.test(html) ? html.replace(pattern, replacement) : html;
}

function productPage(html, product, categoryName) {
  const title = escapeHtml(productTitle(product));
  const desc = escapeHtml(productDescription(product));
  const url = escapeHtml(productUrl(product.slug));
  const image = escapeHtml(absoluteImage(product.img));
  const alt = escapeHtml(product.name);

  html = setTag(html, /<title>[\s\S]*?<\/title>/, `<title>${title}</title>`);
  html = setTag(html, /<meta name="title" content="[^"]*">/, `<meta name="title" content="${title}">`);
  html = setTag(html, /<meta name="description" content="[^"]*">/, `<meta name="description" content="${desc}">`);
  html = setTag(html, /<link rel="canonical" href="[^"]*">/, `<link rel="canonical" href="${url}">`);
  html = setTag(html, /<meta property="og:type" content="[^"]*">/, '<meta property="og:type" content="product">');
  html = setTag(html, /<meta property="og:url" content="[^"]*">/, `<meta property="og:url" content="${url}">`);
  html = setTag(html, /<meta property="og:title" content="[^"]*">/, `<meta property="og:title" content="${title}">`);
  html = setTag(html, /<meta property="og:description" content="[^"]*">/, `<meta property="og:description" content="${desc}">`);
  html = setTag(html, /<meta property="og:image" content="[^"]*">/, `<meta property="og:image" content="${image}">`);
  // The product photo's size isn't known here, so drop the home image's width and height
  html = html.replace(/\s*<meta property="og:image:(width|height)" content="[^"]*">/g, '');
  html = setTag(html, /<meta property="og:image:alt" content="[^"]*">/, `<meta property="og:image:alt" content="${alt}">`);
  html = setTag(html, /<meta name="twitter:url" content="[^"]*">/, `<meta name="twitter:url" content="${url}">`);
  html = setTag(html, /<meta name="twitter:title" content="[^"]*">/, `<meta name="twitter:title" content="${title}">`);
  html = setTag(html, /<meta name="twitter:description" content="[^"]*">/, `<meta name="twitter:description" content="${desc}">`);
  html = setTag(html, /<meta name="twitter:image" content="[^"]*">/, `<meta name="twitter:image" content="${image}">`);
  html = setTag(html, /<meta name="twitter:image:alt" content="[^"]*">/, `<meta name="twitter:image:alt" content="${alt}">`);

  const priceTags = product.priceNum
    ? `\n  <meta property="product:price:amount" content="${product.priceNum}">\n  <meta property="product:price:currency" content="INR">`
    : '';
  // "<" is escaped so product text can never close the script tag
  const jsonLd = JSON.stringify(productJsonLd(product, categoryName)).replace(/</g, '\\u003c');
  html = html.replace('</head>', `${priceTags}\n  <script type="application/ld+json" id="product-schema-jsonld">${jsonLd}</script>\n</head>`);

  // Readable content for crawlers; React replaces it as soon as the app starts
  const facts = [product.dims, product.material].filter(Boolean).map((f) => `<li>${escapeHtml(f)}</li>`).join('');
  const features = (product.features || []).map((f) => `<li>${escapeHtml(f)}</li>`).join('');
  const body = `<style>.seo-product{max-width:720px;margin:32px auto;padding:0 16px;font-family:system-ui,sans-serif;line-height:1.5}.seo-product img{max-width:100%;height:auto;border-radius:12px}</style>
  <main class="seo-product">
    <p><a href="/">Furniture8home</a>${categoryName ? ` › ${escapeHtml(categoryName)}` : ''}</p>
    <h1>${escapeHtml(product.name)}</h1>
    <img src="${image}" alt="${alt}" width="600">
    ${product.priceNum ? `<p><strong>${escapeHtml(product.price)}</strong>${product.inStock === false ? ' · Made to order' : ''}</p>` : ''}
    <p>${escapeHtml(product.desc)}</p>
    ${facts ? `<ul>${facts}</ul>` : ''}
    ${features ? `<ul>${features}</ul>` : ''}
    <p>See it at our showrooms in Maligaon and Paschim Boragaon, Guwahati, or WhatsApp <a href="https://wa.me/916002584075">+91 60025 84075</a>.</p>
  </main>`;
  return html.replace('<div id="root"></div>', `<div id="root">${body}</div>`);
}

async function productResponse(request, slug) {
  const [html, data] = await Promise.all([appHtml(request), catalog().catch(() => null)]);
  const headers = { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'public, max-age=0, s-maxage=300, stale-while-revalidate=86400' };
  if (!data) return new Response(html, { headers: { ...headers, 'Cache-Control': 'no-store' } });

  const product = data.products.find((p) => p.slug === slug);
  if (!product) {
    // Renamed or removed: the app still opens on the home page, but search engines drop the link
    const gone = html.replace('</head>', '  <meta name="robots" content="noindex, follow">\n</head>');
    return new Response(gone, { status: 404, headers });
  }
  const categoryName = data.categories.find((c) => c.id === product.cat)?.name || '';
  return new Response(productPage(html, product, categoryName), { headers });
}

// ---------- Sitemap ----------

async function sitemapResponse() {
  const { products } = await catalog();
  const today = new Date().toISOString().slice(0, 10);
  const url = (loc, extra = '') => `  <url>\n    <loc>${escapeHtml(loc)}</loc>${extra}\n  </url>`;
  const entries = [
    url(`${SITE}/`, `\n    <lastmod>${today}</lastmod>\n    <changefreq>daily</changefreq>\n    <priority>1.0</priority>\n    <image:image><image:loc>${SITE}/og-image.jpg</image:loc></image:image>`),
    ...products.map((p) =>
      url(productUrl(p.slug), `\n    <changefreq>weekly</changefreq>\n    <priority>0.8</priority>\n    <image:image><image:loc>${escapeHtml(absoluteImage(p.img))}</image:loc><image:title>${escapeHtml(p.name)}</image:title></image:image>`),
    ),
    ...PAGES.map((page) => url(`${SITE}/${page}.html`, '\n    <changefreq>yearly</changefreq>\n    <priority>0.3</priority>')),
  ];
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n${entries.join('\n')}\n</urlset>\n`;
  return new Response(xml, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8', 'Cache-Control': 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400' },
  });
}

export default async function handler(request) {
  const params = new URL(request.url).searchParams;
  const type = params.get('type');
  try {
    if (type === 'sitemap') return await sitemapResponse();
    if (type === 'product') return await productResponse(request, params.get('slug') || params.get('product') || '');
  } catch (err) {
    console.error('seo:', err);
    if (type === 'sitemap') return Response.redirect(`${SITE}/sitemap-static.xml`, 302);
    return new Response(await appHtml(request), { headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' } });
  }
  return new Response('Not found', { status: 404 });
}
