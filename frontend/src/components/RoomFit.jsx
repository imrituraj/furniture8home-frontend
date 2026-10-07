import { useEffect, useState } from 'react';
import { useLang } from '../i18n/LanguageContext.jsx';
import { CM_PER_FT, fitFor, footprint } from '../lib/fit.js';

function toUnit(cm, unit) {
  if (!cm) return '';
  return unit === 'ft' ? String(Math.round((cm / CM_PER_FT) * 10) / 10) : String(Math.round(cm));
}

function toCm(value, unit) {
  const n = Number(String(value).replace(',', '.'));
  if (!Number.isFinite(n) || n <= 0) return 0;
  return Math.round(unit === 'ft' ? n * CM_PER_FT : n);
}

/**
 * Room size inputs: wall length and how far furniture can come out from the wall.
 */
export function RoomFitForm({ room, onChange, fitOnly, onFitOnly, compact = false }) {
  const { t } = useLang();
  const [unit, setUnit] = useState(room?.unit || 'ft');
  const [wall, setWall] = useState(toUnit(room?.wall, room?.unit || 'ft'));
  const [depth, setDepth] = useState(toUnit(room?.depth, room?.unit || 'ft'));

  useEffect(() => {
    setWall(toUnit(room?.wall, unit));
    setDepth(toUnit(room?.depth, unit));
  }, [room?.wall, room?.depth]);

  function commit(nextWall = wall, nextDepth = depth, nextUnit = unit) {
    const w = toCm(nextWall, nextUnit);
    const d = toCm(nextDepth, nextUnit);
    onChange(w && d ? { wall: w, depth: d, unit: nextUnit } : null);
  }

  function switchUnit(next) {
    if (next === unit) return;
    const w = toCm(wall, unit);
    const d = toCm(depth, unit);
    setUnit(next);
    setWall(toUnit(w, next));
    setDepth(toUnit(d, next));
    if (w && d) onChange({ wall: w, depth: d, unit: next });
  }

  return (
    <div className={`roomfit${compact ? ' is-compact' : ''}`}>
      <div className="roomfit-fields">
        <label className="field">
          <span>{t('fitWall')}</span>
          <input inputMode="decimal" value={wall} placeholder={unit === 'ft' ? '10' : '300'} onChange={(e) => { setWall(e.target.value); commit(e.target.value, depth); }} />
        </label>
        <label className="field">
          <span>{t('fitDepth')}</span>
          <input inputMode="decimal" value={depth} placeholder={unit === 'ft' ? '6' : '180'} onChange={(e) => { setDepth(e.target.value); commit(wall, e.target.value); }} />
        </label>
        <div className="roomfit-units" role="group" aria-label={t('fitUnits')}>
          {['ft', 'cm'].map((u) => (
            <button key={u} type="button" aria-pressed={unit === u} className={unit === u ? 'active' : ''} onClick={() => switchUnit(u)}>{u}</button>
          ))}
        </div>
      </div>
      {!compact && (
        <div className="roomfit-actions">
          <label className="roomfit-check">
            <input type="checkbox" checked={fitOnly} disabled={!room} onChange={(e) => onFitOnly(e.target.checked)} />
            <span>{t('fitOnly')}</span>
          </label>
          {room && <button type="button" className="roomfit-clear" onClick={() => { setWall(''); setDepth(''); onChange(null); onFitOnly(false); }}>{t('fitClear')}</button>}
        </div>
      )}
    </div>
  );
}

export function FitBadge({ product, room }) {
  const { t } = useLang();
  const fit = fitFor(product, room);
  if (!fit) return null;
  return <span className={`fit-badge fit-${fit}`}>{fit === 'fits' ? t('fitYes') : fit === 'tight' ? t('fitTight') : t('fitNo')}</span>;
}

/**
 * Top-down view: the customer's wall and floor space, with the piece placed against the wall.
 */
export function FitDrawing({ product, room }) {
  const { t } = useLang();
  const size = footprint(product);
  if (!size || !room) return null;
  const fit = fitFor(product, room);
  const W = Math.max(room.wall, size.w);
  const D = Math.max(room.depth, size.d);
  const pad = 14;
  const scale = 300 / W;
  const vw = W * scale + pad * 2;
  const vh = D * scale + pad * 2 + 22;
  const roomX = pad + ((W - room.wall) / 2) * scale;
  const sofaX = pad + ((W - size.w) / 2) * scale;
  const spare = room.wall - size.w;
  const spareDepth = room.depth - size.d;
  const cm = (n) => (room.unit === 'ft' ? `${Math.round((n / CM_PER_FT) * 10) / 10} ft` : `${Math.round(n)} cm`);

  return (
    <figure className={`fit-drawing fit-${fit}`}>
      <svg viewBox={`0 0 ${vw} ${vh}`} role="img" aria-label={t('fitDrawingLabel')}>
        <rect x={roomX} y={pad} width={room.wall * scale} height={room.depth * scale} className="fit-room" />
        <line x1={roomX} y1={pad} x2={roomX + room.wall * scale} y2={pad} className="fit-wall" />
        <rect x={sofaX} y={pad} width={size.w * scale} height={size.d * scale} rx="6" className="fit-piece" />
        <text x={vw / 2} y={pad + (size.d * scale) / 2 + 4} textAnchor="middle" className="fit-text">{cm(size.w)} × {cm(size.d)}</text>
        <text x={vw / 2} y={vh - 6} textAnchor="middle" className="fit-caption">{t('fitYourWall', { size: cm(room.wall) })}</text>
      </svg>
      <figcaption>
        {fit === 'no'
          ? t('fitNoBody', { by: cm(Math.max(-spare, -spareDepth)) })
          : t(fit === 'tight' ? 'fitTightBody' : 'fitSpare', { wall: cm(spare), depth: cm(spareDepth) })}
      </figcaption>
    </figure>
  );
}
