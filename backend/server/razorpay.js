import { createHmac, timingSafeEqual } from 'node:crypto';

const KEY_ID = process.env.RAZORPAY_KEY_ID || '';
const KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || '';
const WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET || '';

export const razorpayEnabled = Boolean(KEY_ID && KEY_SECRET);
export const razorpayKeyId = KEY_ID;

function safeEqualHex(expected, received) {
  const a = Buffer.from(String(expected));
  const b = Buffer.from(String(received || ''));
  return a.length === b.length && timingSafeEqual(a, b);
}

function authHeader() {
  return `Basic ${Buffer.from(`${KEY_ID}:${KEY_SECRET}`).toString('base64')}`;
}

/**
 * Create a Razorpay order for the given amount (in rupees).
 * https://razorpay.com/docs/api/orders/create/
 */
export async function createRazorpayOrder({ amount, receipt, notes }) {
  const res = await fetch('https://api.razorpay.com/v1/orders', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: authHeader(),
    },
    body: JSON.stringify({ amount: Math.round(amount * 100), currency: 'INR', receipt, notes }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.error?.description || `Razorpay order creation failed (${res.status})`);
  }
  return data;
}

/**
 * Verify the signature Razorpay Checkout returns after a successful payment.
 * https://razorpay.com/docs/payments/server-integration/nodejs/payment-gateway/build-integration/#verify-payment-signature
 */
export function verifyPaymentSignature({ orderId, paymentId, signature }) {
  if (typeof orderId !== 'string' || typeof paymentId !== 'string' || typeof signature !== 'string') return false;
  const expected = createHmac('sha256', KEY_SECRET).update(`${orderId}|${paymentId}`).digest('hex');
  return safeEqualHex(expected, signature);
}

/**
 * Fetch a payment from Razorpay to confirm it really belongs to this order and amount.
 * https://razorpay.com/docs/api/payments/fetch-with-id/
 */
export async function fetchPayment(paymentId) {
  if (typeof paymentId !== 'string' || !/^pay_[A-Za-z0-9]+$/.test(paymentId)) throw new Error('Invalid payment id');
  const res = await fetch(`https://api.razorpay.com/v1/payments/${paymentId}`, {
    headers: { Authorization: authHeader() },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error?.description || `Razorpay payment lookup failed (${res.status})`);
  return data;
}

export const webhookEnabled = Boolean(WEBHOOK_SECRET);

export function verifyWebhookSignature(rawBody, signature) {
  if (!Buffer.isBuffer(rawBody) || rawBody.length === 0) return false;
  const expected = createHmac('sha256', WEBHOOK_SECRET).update(rawBody).digest('hex');
  return safeEqualHex(expected, signature);
}
