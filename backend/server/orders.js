import { readFileSync, writeFileSync, existsSync, renameSync } from 'node:fs';
import { randomBytes, timingSafeEqual } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { formatPrice, getCatalog } from './catalog.js';
import { categoryOffersChaise } from './categories.js';

const ORDERS_FILE = fileURLToPath(new URL('../data/orders.json', import.meta.url));

export const PAYMENT_METHODS = ['razorpay', 'offline', 'whatsapp'];
export const ORDER_STATUSES = ['new', 'confirmed', 'ready', 'out_for_delivery', 'delivered', 'cancelled'];
export const PAYMENT_STATUSES = ['pending', 'paid', 'failed', 'refunded'];
export const SHOWROOMS = ['Maligaon', 'Paschim Boragaon'];

const MAX_QTY = 20;
const MAX_LINES = 30;

// Must match FABRICS / CHAISE_OPTIONS in frontend/src/data/content.js
const FABRICS = ['Royal Navy', 'Charcoal Grey', 'Forest Sage', 'Ivory Cream', 'Mustard Gold'];
const CHAISE_OPTIONS = ['Right Facing Chaise', 'Left Facing Chaise', 'Custom Measurement'];

let orders = load();

function load() {
  if (!existsSync(ORDERS_FILE)) return [];
  try {
    const parsed = JSON.parse(readFileSync(ORDERS_FILE, 'utf8'));
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error('Failed to read orders.json', err);
    return [];
  }
}

function persist() {
  const tmp = `${ORDERS_FILE}.tmp`;
  // Orders hold customer names, phones and addresses — keep the file private to the server user
  writeFileSync(tmp, JSON.stringify(orders, null, 2), { mode: 0o600 });
  renameSync(tmp, ORDERS_FILE);
}

export class OrderError extends Error {}

function cleanText(value, max = 200) {
  if (typeof value !== 'string' && typeof value !== 'number') return '';
  // Strip control characters (keep newlines in addresses/notes)
  return String(value).replace(/[\u0000-\u0009\u000B-\u001F\u007F]/g, '').trim().slice(0, max);
}

function newOrderId() {
  const d = new Date();
  const date = `${String(d.getFullYear()).slice(2)}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
  return `F8H-${date}-${randomBytes(3).toString('hex').toUpperCase()}`;
}

/**
 * Validate a checkout request and build the order. Prices always come from the catalog,
 * never from the client.
 */
export function buildOrder(body) {
  const { items, customer = {}, fulfilment = {}, paymentMethod } = body || {};

  if (!PAYMENT_METHODS.includes(paymentMethod)) throw new OrderError('Choose a payment method');
  if (!Array.isArray(items) || items.length === 0) throw new OrderError('Your cart is empty');
  if (items.length > MAX_LINES) throw new OrderError('Too many items in one order — please call or WhatsApp us');
  if (typeof customer !== 'object' || typeof fulfilment !== 'object' || !customer || !fulfilment) {
    throw new OrderError('Invalid order details');
  }

  const catalog = getCatalog();
  const lines = items.map((line) => {
    if (!line || typeof line !== 'object') throw new OrderError('Invalid cart item');
    const product = catalog.find((p) => p.id === Number(line.id));
    if (!product || product.hidden) throw new OrderError('An item in your cart is no longer available');
    if (product.inStock === false) {
      throw new OrderError(`"${product.name}" is out of stock — please order it on WhatsApp as a custom order`);
    }
    const qty = Math.min(MAX_QTY, Math.max(1, Math.floor(Number(line.qty) || 1)));
    return {
      id: product.id,
      name: product.name,
      img: product.img,
      unitPrice: product.priceNum,
      qty,
      lineTotal: product.priceNum * qty,
      options: {
        fabric: FABRICS.includes(line.options?.fabric) ? line.options.fabric : FABRICS[0],
        ...(categoryOffersChaise(product.cat)
          ? { chaise: CHAISE_OPTIONS.includes(line.options?.chaise) ? line.options.chaise : CHAISE_OPTIONS[0] }
          : {}),
      },
    };
  });

  const name = cleanText(customer.name, 80);
  const phone = cleanText(customer.phone, 20).replace(/[^\d+]/g, '');
  if (!name) throw new OrderError('Please enter your name');
  if (!/^(\+?91)?[6-9]\d{9}$/.test(phone)) throw new OrderError('Please enter a valid 10-digit mobile number');

  const email = cleanText(customer.email, 120);
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new OrderError('Please enter a valid email address');

  const type = fulfilment.type === 'pickup' ? 'pickup' : 'delivery';
  const address = cleanText(customer.address, 400);
  const pincode = cleanText(customer.pincode, 6);
  if (type === 'delivery') {
    if (!address) throw new OrderError('Please enter your delivery address');
    if (!/^\d{6}$/.test(pincode)) throw new OrderError('Please enter a valid 6-digit PIN code');
  }
  const showroom = SHOWROOMS.includes(fulfilment.showroom) ? fulfilment.showroom : SHOWROOMS[0];

  const total = lines.reduce((sum, line) => sum + line.lineTotal, 0);
  if (total <= 0) throw new OrderError('Order total must be more than ₹0');

  const now = new Date().toISOString();
  return {
    id: newOrderId(),
    createdAt: now,
    updatedAt: now,
    items: lines,
    total,
    totalLabel: formatPrice(total),
    customer: {
      name,
      phone,
      email,
      address: type === 'delivery' ? address : '',
      pincode: type === 'delivery' ? pincode : '',
      notes: cleanText(customer.notes, 500),
    },
    fulfilment: type === 'pickup' ? { type, showroom } : { type },
    paymentMethod,
    paymentStatus: 'pending',
    status: 'new',
    razorpay: null,
  };
}

export function saveOrder(order) {
  orders = [order, ...orders];
  persist();
  return order;
}

export function getOrders() {
  return orders;
}

export function getOrder(id) {
  return orders.find((o) => o.id === id) || null;
}

/**
 * Look up an order for the customer who placed it, using the secret returned at checkout.
 */
export function getOwnOrder(id, token) {
  const order = typeof id === 'string' ? getOrder(id) : null;
  if (!order || typeof token !== 'string') return null;
  const a = Buffer.from(order.accessToken || '');
  const b = Buffer.from(token);
  return a.length > 0 && a.length === b.length && timingSafeEqual(a, b) ? order : null;
}

export function findOrderByRazorpayId(razorpayOrderId) {
  return orders.find((o) => o.razorpay?.orderId === razorpayOrderId) || null;
}

export function updateOrder(id, updates) {
  const index = orders.findIndex((o) => o.id === id);
  if (index === -1) return null;
  const next = { ...orders[index], ...updates, id, updatedAt: new Date().toISOString() };
  orders = orders.map((o, i) => (i === index ? next : o));
  persist();
  return next;
}

/**
 * Fields a customer is allowed to see when polling their own order
 */
export function publicOrder(order) {
  const { id, createdAt, items, total, totalLabel, fulfilment, paymentMethod, paymentStatus, status } = order;
  return { id, createdAt, items, total, totalLabel, fulfilment, paymentMethod, paymentStatus, status, customerName: order.customer.name };
}
