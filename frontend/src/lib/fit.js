const ROOM_KEY = 'f8h_room';

/**
 * Width and depth in cm from a product's dimensions, e.g. "W 274cm · D 168cm (Chaise) · H 88cm".
 */
export function footprint(product) {
  const dims = product?.dims || '';
  const w = /\bW\s*(\d{2,4})\s*cm/i.exec(dims);
  const d = /\bD\s*(\d{2,4})\s*cm/i.exec(dims);
  return w && d ? { w: Number(w[1]), d: Number(d[1]) } : null;
}

// Less than this much room to spare (cm) counts as a tight fit
const TIGHT_CM = 15;

/**
 * 'fits', 'tight' or 'no' for a room { wall, depth } in cm; null if the product has no size.
 */
export function fitFor(product, room) {
  const size = footprint(product);
  if (!size || !room) return null;
  if (size.w > room.wall || size.d > room.depth) return 'no';
  return room.wall - size.w < TIGHT_CM || room.depth - size.d < TIGHT_CM ? 'tight' : 'fits';
}

export function readRoom() {
  try {
    const room = JSON.parse(localStorage.getItem(ROOM_KEY) || 'null');
    return room && room.wall > 0 && room.depth > 0 ? room : null;
  } catch {
    return null;
  }
}

export function saveRoom(room) {
  try {
    if (room) localStorage.setItem(ROOM_KEY, JSON.stringify(room));
    else localStorage.removeItem(ROOM_KEY);
  } catch {
    // Only remembers the size between visits
  }
}

export const CM_PER_FT = 30.48;
