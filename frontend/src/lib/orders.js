import { API_URL } from './catalog.js';

async function request(method, path, body) {
  const res = await fetch(`${API_URL}/api${path}`, {
    method,
    headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

export const fetchStoreConfig = () => request('GET', '/config');
export const placeOrder = (payload) => request('POST', '/orders', payload);
export const verifyPayment = (orderId, accessToken, response) =>
  request('POST', `/orders/${orderId}/verify-payment`, { accessToken, ...response });
export const reportPaymentFailed = (orderId, accessToken) =>
  request('POST', `/orders/${orderId}/payment-failed`, { accessToken });

let razorpayScript = null;

/**
 * Load Razorpay Checkout on demand so it never slows down the storefront.
 */
export function loadRazorpay() {
  if (window.Razorpay) return Promise.resolve(window.Razorpay);
  if (!razorpayScript) {
    razorpayScript = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(window.Razorpay);
      script.onerror = () => {
        razorpayScript = null;
        reject(new Error('Could not load Razorpay. Check your connection and try again.'));
      };
      document.body.appendChild(script);
    });
  }
  return razorpayScript;
}

export const checkCoupon = (code, items) => request('POST', '/coupons/check', { code, items });
export const trackOrder = (orderId, phone) => request('POST', '/orders/track', { orderId, phone });
export const fetchAvailability = (showroom, date) =>
  request('GET', `/bookings/availability?showroom=${encodeURIComponent(showroom)}&date=${encodeURIComponent(date)}`);
export const bookVisit = (booking) => request('POST', '/bookings', booking);
