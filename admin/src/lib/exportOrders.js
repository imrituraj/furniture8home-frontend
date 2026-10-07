const COLUMNS = [
  ['Order', (o) => o.id],
  ['Date (IST)', (o) => new Date(o.createdAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' })],
  ['Status', (o) => o.status],
  ['Payment', (o) => ({ razorpay: 'Online (Razorpay)', offline: 'Pay offline', whatsapp: 'WhatsApp' })[o.paymentMethod] || o.paymentMethod],
  ['Payment status', (o) => o.paymentStatus],
  ['Customer', (o) => o.customer.name],
  ['Phone', (o) => o.customer.phone],
  ['Email', (o) => o.customer.email],
  ['Delivery or pickup', (o) => (o.fulfilment?.type === 'pickup' ? `Pickup: ${o.fulfilment.showroom}` : 'Delivery')],
  ['Address', (o) => o.customer.address],
  ['PIN code', (o) => o.customer.pincode],
  ['Items', (o) => o.items.map((i) => `${i.name} × ${i.qty}${[i.options?.fabric, i.options?.chaise].filter(Boolean).length ? ` (${[i.options?.fabric, i.options?.chaise].filter(Boolean).join(', ')})` : ''}`).join('; ')],
  ['Subtotal (₹)', (o) => o.subtotal ?? o.total],
  ['Discount code', (o) => o.discount?.code || ''],
  ['Discount (₹)', (o) => o.discount?.amount || 0],
  ['Total (₹)', (o) => o.total],
  ['Razorpay payment', (o) => o.razorpay?.paymentId || ''],
  ['Customer notes', (o) => o.customer.notes],
  ['Internal note', (o) => o.adminNote || ''],
];

/**
 * One CSV cell. Text a customer typed could start with = + - @ and run as a formula when the
 * file is opened in Excel, so those cells get a leading apostrophe.
 */
function cell(value) {
  if (typeof value === 'number') return String(value);
  let text = String(value ?? '');
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

/**
 * Orders as a CSV that opens directly in Excel (UTF-8 with BOM, so ₹ and Assamese work).
 */
export function ordersToCsv(orders) {
  const lines = [COLUMNS.map(([h]) => cell(h)).join(','), ...orders.map((o) => COLUMNS.map(([, get]) => cell(get(o))).join(','))];
  return `\uFEFF${lines.join('\r\n')}`;
}

export function downloadOrdersCsv(orders, filename) {
  const blob = new Blob([ordersToCsv(orders)], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
