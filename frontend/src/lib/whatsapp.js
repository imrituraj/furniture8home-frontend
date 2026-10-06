export const WHATSAPP_NUMBER = '916002584075';
export const TEL_LINK = 'tel:+916002584075';
export const SHOP_EMAIL = 'Furniture8home@gmail.com';

export function waLink(text) {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
}
