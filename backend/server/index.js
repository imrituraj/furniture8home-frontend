import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import { createServer as createHttpServer } from 'node:http';
import { fileURLToPath } from 'node:url';
import express from 'express';
import {
  ValidationError,
  addProduct,
  deleteProduct,
  duplicateProduct,
  getCatalog,
  getPublicCatalog,
  importCatalog,
  resetCatalog,
  updateProduct,
} from './catalog.js';
import {
  CategoryError,
  addCategory,
  deleteCategory,
  getCategories,
  getPublicCategories,
  reorderCategories,
  updateCategory,
} from './categories.js';
import {
  ORDER_STATUSES,
  OrderError,
  PAYMENT_STATUSES,
  buildOrder,
  findOrderByRazorpayId,
  getOrders,
  getOwnOrder,
  publicOrder,
  saveOrder,
  updateOrder,
} from './orders.js';
import {
  createRazorpayOrder,
  fetchPayment,
  razorpayEnabled,
  razorpayKeyId,
  verifyPaymentSignature,
  verifyWebhookSignature,
  webhookEnabled,
} from './razorpay.js';

const IS_PROD = process.env.NODE_ENV === 'production';
const PORT = Number(process.env.PORT) || 4000;
// Dev stays on this machine only; production listens publicly (behind your proxy/host)
const HOST = process.env.HOST || (IS_PROD ? '0.0.0.0' : '127.0.0.1');
const SESSION_TTL_MS = 12 * 60 * 60 * 1000;
const MAX_SESSIONS = 50;
const STOREFRONT_ORIGIN = process.env.STOREFRONT_ORIGIN || '*';
const ADMIN_ROOT = fileURLToPath(new URL('../admin', import.meta.url));
const ADMIN_DIST = fileURLToPath(new URL('../dist', import.meta.url));
const NODE_MODULES = fileURLToPath(new URL('../node_modules', import.meta.url));

// ---------- Startup checks ----------

const ADMIN_PIN = process.env.ADMIN_PIN || (IS_PROD ? '' : '8888');
if (IS_PROD && !/^\d{6,8}$/.test(ADMIN_PIN)) {
  console.error('ADMIN_PIN must be set to 6–8 digits in production. Refusing to start.');
  process.exit(1);
}
if (!process.env.ADMIN_PIN) {
  console.warn('ADMIN_PIN is not set — using the development PIN 8888.');
}
if (!razorpayEnabled) {
  console.warn('RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET not set — online payment is disabled at checkout.');
}

const app = express();
app.disable('x-powered-by');

// Only trust X-Forwarded-For when a proxy is actually in front, otherwise clients could fake their IP
// and walk around the rate limits. Set TRUST_PROXY=1 behind one proxy (Render, Railway, Nginx, …).
if (process.env.TRUST_PROXY) {
  const value = process.env.TRUST_PROXY;
  app.set('trust proxy', /^\d+$/.test(value) ? Number(value) : value);
}

app.use((req, res, next) => {
  res.set({
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Cross-Origin-Opener-Policy': 'same-origin',
  });
  if (IS_PROD) res.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  next();
});

// ---------- Rate limiting ----------

/**
 * Fixed-window counter per key. Old entries are swept so the map can't grow without bound.
 */
function createCounter(windowMs) {
  const hits = new Map(); // key -> { count, resetAt }
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of hits) if (entry.resetAt <= now) hits.delete(key);
  }, windowMs).unref();

  return {
    count(key) {
      const entry = hits.get(key);
      return entry && entry.resetAt > Date.now() ? entry.count : 0;
    },
    add(key) {
      const now = Date.now();
      const entry = hits.get(key);
      if (!entry || entry.resetAt <= now) hits.set(key, { count: 1, resetAt: now + windowMs });
      else entry.count += 1;
    },
  };
}

const orderCounter = createCounter(10 * 60 * 1000);
const loginFailures = createCounter(15 * 60 * 1000);

function limitOrders(req, res, next) {
  if (orderCounter.count(req.ip) >= 15) {
    return res.status(429).json({ error: 'Too many orders from this device. Please call or WhatsApp us.' });
  }
  orderCounter.add(req.ip);
  next();
}

// ---------- Razorpay webhook (needs the raw body for signature checks) ----------

function markPaid(order, paymentId) {
  // Never resurrect an order staff already refunded, and keep cancelled orders cancelled
  if (order.paymentStatus === 'paid' || order.paymentStatus === 'refunded') return order;
  return updateOrder(order.id, {
    paymentStatus: 'paid',
    status: order.status === 'new' ? 'confirmed' : order.status,
    razorpay: { ...order.razorpay, paymentId: paymentId || order.razorpay.paymentId },
  });
}

function paymentMatchesOrder(payment, order) {
  return (
    payment.order_id === order.razorpay?.orderId &&
    payment.amount === order.total * 100 &&
    payment.currency === 'INR' &&
    ['authorized', 'captured'].includes(payment.status)
  );
}

app.post('/api/razorpay/webhook', express.raw({ type: '*/*', limit: '1mb' }), (req, res) => {
  if (!webhookEnabled) return res.status(404).end();
  if (!verifyWebhookSignature(req.body, req.get('x-razorpay-signature'))) {
    return res.status(400).json({ error: 'Invalid signature' });
  }

  let event;
  try {
    event = JSON.parse(req.body.toString('utf8'));
  } catch {
    return res.status(400).json({ error: 'Invalid payload' });
  }
  const payment = event.payload?.payment?.entity;
  const rzpOrderId = event.payload?.order?.entity?.id || payment?.order_id;
  const order = typeof rzpOrderId === 'string' ? findOrderByRazorpayId(rzpOrderId) : null;

  if (order && (event.event === 'order.paid' || event.event === 'payment.captured')) {
    if (!payment || paymentMatchesOrder(payment, order)) markPaid(order, payment?.id);
    else console.warn(`Webhook payment for ${order.id} does not match the order amount — not marking paid`);
  } else if (order && event.event === 'payment.failed' && order.paymentStatus === 'pending') {
    updateOrder(order.id, { paymentStatus: 'failed' });
  }
  res.json({ ok: true });
});

// ---------- Public storefront API ----------

const publicJson = express.json({ limit: '20kb' });

// The storefront is hosted separately, so allow it to call the public endpoints
function storefrontCors(req, res, next) {
  res.set('Access-Control-Allow-Origin', STOREFRONT_ORIGIN);
  res.set('Access-Control-Allow-Methods', 'GET, POST');
  res.set('Access-Control-Allow-Headers', 'Content-Type');
  res.set('Vary', 'Origin');
  if (req.method === 'OPTIONS') return res.status(204).end();
  next();
}

app.use(['/api/products', '/api/categories', '/api/config', '/api/orders'], storefrontCors);

app.get('/api/products', (req, res) => {
  res.json(getPublicCatalog());
});

app.get('/api/categories', (req, res) => {
  res.json(getPublicCategories());
});

app.get('/api/config', (req, res) => {
  res.json({ razorpay: razorpayEnabled ? { keyId: razorpayKeyId } : null });
});

app.post('/api/orders', limitOrders, publicJson, async (req, res) => {
  const order = buildOrder(req.body);

  if (order.paymentMethod === 'razorpay') {
    if (!razorpayEnabled) return res.status(400).json({ error: 'Online payment is not available right now' });
    try {
      const rzp = await createRazorpayOrder({
        amount: order.total,
        receipt: order.id,
        notes: { orderId: order.id },
      });
      order.razorpay = { orderId: rzp.id, paymentId: null };
    } catch (err) {
      console.error('Razorpay order creation failed', err.message);
      return res.status(502).json({ error: 'Could not start online payment. Please try again or choose another option.' });
    }
  }

  order.accessToken = randomBytes(24).toString('hex');
  saveOrder(order);

  res.status(201).json({
    order: publicOrder(order),
    accessToken: order.accessToken,
    razorpay: order.razorpay && {
      keyId: razorpayKeyId,
      orderId: order.razorpay.orderId,
      amount: order.total * 100,
      currency: 'INR',
    },
  });
});

function findOwnOrder(req, res) {
  const order = getOwnOrder(req.params.id, req.body?.accessToken);
  if (!order) res.status(404).json({ error: 'Order not found' });
  return order;
}

app.post('/api/orders/:id/verify-payment', publicJson, async (req, res) => {
  const order = findOwnOrder(req, res);
  if (!order) return;
  const { razorpay_order_id: orderId, razorpay_payment_id: paymentId, razorpay_signature: signature } = req.body;
  const rejected = () =>
    res.status(400).json({ error: 'Payment could not be verified. If money was debited, please contact us.' });

  if (!order.razorpay || orderId !== order.razorpay.orderId || !verifyPaymentSignature({ orderId, paymentId, signature })) {
    return rejected();
  }

  // Defence in depth: confirm with Razorpay that this payment is for this order and the full amount.
  // A valid signature already proves Razorpay issued it, so a lookup outage doesn't block the customer.
  try {
    const payment = await fetchPayment(paymentId);
    if (!paymentMatchesOrder(payment, order)) {
      console.warn(`Payment ${paymentId} does not match order ${order.id}`);
      return rejected();
    }
  } catch (err) {
    console.warn(`Could not look up payment ${paymentId}; relying on its signature:`, err.message);
  }

  res.json(publicOrder(markPaid(order, paymentId)));
});

app.post('/api/orders/:id/payment-failed', publicJson, (req, res) => {
  const order = findOwnOrder(req, res);
  if (!order) return;
  const updated = order.paymentStatus === 'pending' ? updateOrder(order.id, { paymentStatus: 'failed' }) : order;
  res.json(publicOrder(updated));
});

// ---------- Admin auth ----------

const sessions = new Map(); // token -> expiry timestamp

setInterval(() => {
  const now = Date.now();
  for (const [token, expiry] of sessions) if (expiry <= now) sessions.delete(token);
}, 60 * 60 * 1000).unref();

const sha256 = (value) => createHash('sha256').update(value).digest();

function pinMatches(entered) {
  if (typeof entered !== 'string' && typeof entered !== 'number') return false;
  // Compare fixed-length digests so neither the PIN nor its length leaks through timing
  return timingSafeEqual(sha256(String(entered).trim()), sha256(ADMIN_PIN));
}

app.post('/api/admin/login', express.json({ limit: '1kb' }), (req, res) => {
  // Lock out after repeated wrong PINs — per device, and site-wide to stop distributed guessing
  if (loginFailures.count(req.ip) >= 5 || loginFailures.count('*') >= 30) {
    return res.status(429).json({ error: 'Too many wrong PINs. Try again in 15 minutes.' });
  }
  if (!pinMatches(req.body?.pin)) {
    loginFailures.add(req.ip);
    loginFailures.add('*');
    return res.status(401).json({ error: 'Incorrect PIN. Please try again.' });
  }

  if (sessions.size >= MAX_SESSIONS) sessions.delete(sessions.keys().next().value);
  const token = randomBytes(32).toString('hex');
  sessions.set(token, Date.now() + SESSION_TTL_MS);
  res.json({ token });
});

function requireAdmin(req, res, next) {
  const header = req.get('authorization') || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  const expiry = token && sessions.get(token);
  if (!expiry || expiry < Date.now()) {
    if (token) sessions.delete(token);
    return res.status(401).json({ error: 'Session expired. Please log in again.' });
  }
  req.token = token;
  next();
}

const admin = express.Router();
// Authenticate before parsing, so only logged-in staff can send large bodies (image uploads)
admin.use(requireAdmin, express.json({ limit: '15mb' }));
admin.use((req, res, next) => {
  res.set('Cache-Control', 'no-store');
  next();
});

admin.post('/logout', (req, res) => {
  sessions.delete(req.token);
  res.status(204).end();
});

admin.get('/products', (req, res) => res.json(getCatalog()));

admin.post('/products', (req, res) => res.status(201).json(addProduct(req.body || {})));

admin.patch('/products/:id', (req, res) => {
  const updated = updateProduct(req.params.id, req.body || {});
  if (!updated) return res.status(404).json({ error: 'Product not found' });
  res.json(updated);
});

admin.delete('/products/:id', (req, res) => {
  if (!deleteProduct(req.params.id)) return res.status(404).json({ error: 'Product not found' });
  res.status(204).end();
});

admin.post('/products/:id/duplicate', (req, res) => {
  const clone = duplicateProduct(req.params.id);
  if (!clone) return res.status(404).json({ error: 'Product not found' });
  res.status(201).json(clone);
});

admin.put('/catalog', (req, res) => res.json(importCatalog(req.body)));

admin.post('/catalog/reset', (req, res) => res.json(resetCatalog()));

admin.get('/categories', (req, res) => res.json(getCategories()));

admin.post('/categories', (req, res) => res.status(201).json(addCategory(req.body || {})));

// Registered before /categories/:id so "order" isn't read as a category id
admin.put('/categories/order', (req, res) => res.json(reorderCategories(req.body?.ids)));

admin.patch('/categories/:id', (req, res) => {
  const updated = updateCategory(req.params.id, req.body || {});
  if (!updated) return res.status(404).json({ error: 'Category not found' });
  res.json(updated);
});

admin.delete('/categories/:id', (req, res) => {
  const inUse = getCatalog().filter((p) => p.cat === req.params.id).length;
  if (!deleteCategory(req.params.id, inUse)) return res.status(404).json({ error: 'Category not found' });
  res.status(204).end();
});

admin.get('/orders', (req, res) => {
  res.json(getOrders().map(({ accessToken, ...order }) => order));
});

admin.patch('/orders/:id', (req, res) => {
  const { status, paymentStatus, adminNote } = req.body || {};
  const updates = {};
  if (status !== undefined) {
    if (!ORDER_STATUSES.includes(status)) return res.status(400).json({ error: 'Unknown order status' });
    updates.status = status;
  }
  if (paymentStatus !== undefined) {
    if (!PAYMENT_STATUSES.includes(paymentStatus)) return res.status(400).json({ error: 'Unknown payment status' });
    updates.paymentStatus = paymentStatus;
  }
  if (adminNote !== undefined) {
    if (typeof adminNote !== 'string') return res.status(400).json({ error: 'Note must be text' });
    updates.adminNote = adminNote.slice(0, 1000);
  }

  const updated = updateOrder(req.params.id, updates);
  if (!updated) return res.status(404).json({ error: 'Order not found' });
  const { accessToken, ...order } = updated;
  res.json(order);
});

app.use('/api/admin', admin);

app.use('/api', (req, res) => res.status(404).json({ error: 'Not found' }));

// ---------- Errors ----------

app.use((err, req, res, next) => {
  if (res.headersSent) return next(err);
  if (err instanceof OrderError || err instanceof ValidationError || err instanceof CategoryError) {
    return res.status(400).json({ error: err.message });
  }
  const status = err.status || err.statusCode;
  if (status >= 400 && status < 500) {
    // Body parser errors: too large, malformed JSON, …
    return res.status(status).json({ error: status === 413 ? 'Request is too large' : 'Invalid request' });
  }
  console.error(err);
  res.status(500).json({ error: 'Something went wrong. Please try again.' });
});

// ---------- Admin dashboard UI ----------

const httpServer = createHttpServer(app);

if (IS_PROD) {
  const ADMIN_CSP = [
    "default-src 'self'",
    "script-src 'self'",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    'font-src https://fonts.gstatic.com',
    'img-src * data: blob:',
    "connect-src 'self'",
    "object-src 'none'",
    "base-uri 'none'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ].join('; ');
  app.use((req, res, next) => {
    res.set('Content-Security-Policy', ADMIN_CSP);
    next();
  });
  app.use(express.static(ADMIN_DIST, { index: false }));
  app.get('/{*splat}', (req, res) => {
    res.set('Cache-Control', 'no-store');
    res.sendFile(`${ADMIN_DIST}/index.html`);
  });
} else {
  const { createServer } = await import('vite');
  const vite = await createServer({
    configFile: fileURLToPath(new URL('../vite.config.js', import.meta.url)),
    root: ADMIN_ROOT,
    server: {
      middlewareMode: true,
      hmr: { server: httpServer },
      // Only serve the admin app and its dependencies — never server code or data/ (orders, catalog)
      fs: { strict: true, allow: [ADMIN_ROOT, NODE_MODULES] },
    },
    appType: 'spa',
  });
  app.use(vite.middlewares);
}

httpServer.listen(PORT, HOST, () => {
  console.log(`Furniture8home backend: admin + API on http://${HOST === '0.0.0.0' ? 'localhost' : HOST}:${PORT}`);
});
