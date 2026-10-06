import qrcode from 'qrcode-generator';
import { ADMIN_URL } from './catalog.js';

/**
 * What the order QR code holds: a link that opens this order in the admin dashboard.
 * Staff scan it at the showroom or on delivery; it needs the admin PIN, so it shows
 * nothing to anyone else.
 */
export function orderQrLink(orderId) {
  const base = ADMIN_URL.endsWith('/') ? ADMIN_URL : `${ADMIN_URL}/`;
  return `${base}#order/${encodeURIComponent(orderId)}`;
}

/**
 * QR grid for `text`: { size, isDark(row, col), isFinder(row, col) }.
 * High error correction (Q) keeps it scannable with rounded corners and on a scratched phone screen.
 */
export function qrMatrix(text) {
  const qr = qrcode(0, 'Q');
  qr.addData(text);
  qr.make();
  const size = qr.getModuleCount();
  const isFinder = (r, c) => (r < 7 && c < 7) || (r < 7 && c >= size - 7) || (r >= size - 7 && c < 7);
  return { size, isDark: (r, c) => qr.isDark(r, c), isFinder };
}

// Top-left corners of the three finder patterns
export function finderOrigins(size) {
  return [[0, 0], [0, size - 7], [size - 7, 0]];
}
