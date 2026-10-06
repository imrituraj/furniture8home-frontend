import { useMemo } from 'react';
import { finderOrigins, orderQrLink, qrMatrix } from '../lib/qr.js';
import { useLang } from '../i18n/LanguageContext.jsx';

const QUIET = 2; // white margin around the code, in modules (the card adds more)

function QrSvg({ text, label }) {
  const { size, isDark, isFinder } = useMemo(() => qrMatrix(text), [text]);
  const dim = size + QUIET * 2;
  const dots = [];
  for (let r = 0; r < size; r += 1) {
    for (let c = 0; c < size; c += 1) {
      if (isDark(r, c) && !isFinder(r, c)) {
        dots.push(<rect key={`${r}-${c}`} x={c + QUIET + 0.06} y={r + QUIET + 0.06} width="0.88" height="0.88" rx="0.3" />);
      }
    }
  }
  return (
    <svg viewBox={`0 0 ${dim} ${dim}`} role="img" aria-label={label} shapeRendering="geometricPrecision">
      <rect width={dim} height={dim} fill="#fff" />
      <g fill="#1d1a16">
        {dots}
        {finderOrigins(size).map(([r, c]) => (
          <g key={`f${r}-${c}`} transform={`translate(${c + QUIET} ${r + QUIET})`}>
            <path d="M2 0h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2h-3a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2zm.2 1a1.2 1.2 0 0 0-1.2 1.2v2.6a1.2 1.2 0 0 0 1.2 1.2h2.6a1.2 1.2 0 0 0 1.2-1.2v-2.6a1.2 1.2 0 0 0-1.2-1.2z" fillRule="evenodd" />
            <rect x="2" y="2" width="3" height="3" rx="0.9" />
          </g>
        ))}
      </g>
    </svg>
  );
}

/**
 * Draw the pass as a PNG so customers can keep it in their photos.
 */
function savePassImage({ order, link, title, hint, fulfilment }) {
  const { size, isDark } = qrMatrix(link);
  const scale = 2;
  const W = 600 * scale;
  const H = 860 * scale;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  ctx.scale(scale, scale);

  ctx.fillStyle = '#26312a';
  ctx.beginPath();
  ctx.roundRect(0, 0, 600, 860, 36);
  ctx.fill();

  ctx.fillStyle = '#f3eee6';
  ctx.font = '600 30px Georgia, serif';
  ctx.textAlign = 'left';
  ctx.fillText('Furniture8home', 44, 70);
  ctx.fillStyle = '#b9c2b1';
  ctx.font = '600 15px Helvetica, Arial, sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText(title.toUpperCase(), 556, 68);

  // QR on a white tile
  const tile = 380;
  const tx = (600 - tile) / 2;
  const ty = 120;
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.roundRect(tx, ty, tile, tile, 24);
  ctx.fill();
  const pad = 26;
  const cell = (tile - pad * 2) / size;
  ctx.fillStyle = '#1d1a16';
  for (let r = 0; r < size; r += 1) {
    for (let c = 0; c < size; c += 1) {
      if (isDark(r, c)) ctx.fillRect(tx + pad + c * cell, ty + pad + r * cell, Math.ceil(cell), Math.ceil(cell));
    }
  }

  ctx.textAlign = 'center';
  ctx.fillStyle = '#b9c2b1';
  ctx.font = '600 14px Helvetica, Arial, sans-serif';
  ctx.fillText('ORDER', 300, 560);
  ctx.fillStyle = '#f3eee6';
  ctx.font = '600 34px Menlo, Consolas, monospace';
  ctx.fillText(order.id, 300, 600);
  ctx.fillStyle = '#e2b486';
  ctx.font = '500 26px Georgia, serif';
  ctx.fillText(order.totalLabel, 300, 646);
  ctx.fillStyle = '#b9c2b1';
  ctx.font = '400 17px Helvetica, Arial, sans-serif';
  ctx.fillText(fulfilment, 300, 700);
  ctx.fillText(hint, 300, 730);
  ctx.font = '400 14px Helvetica, Arial, sans-serif';
  ctx.fillText('WhatsApp 60025 84075 · furniture8home.com', 300, 800);

  const a = document.createElement('a');
  a.download = `${order.id}.png`;
  a.href = canvas.toDataURL('image/png');
  a.click();
}

export default function OrderPass({ order }) {
  const { t } = useLang();
  const link = orderQrLink(order.id);
  const fulfilment = order.fulfilment?.type === 'pickup'
    ? t('passPickup', { showroom: order.fulfilment.showroom })
    : t('passDelivery');

  return (
    <div className="order-pass">
      <div className="order-pass-top">
        <span className="order-pass-brand">Furniture<em>8</em>home</span>
        <span className="order-pass-kind">{t('passTitle')}</span>
      </div>
      <div className="order-pass-qr">
        <QrSvg text={link} label={t('passQrLabel', { id: order.id })} />
      </div>
      <div className="order-pass-meta">
        <span className="order-pass-label">{t('orderNumber')}</span>
        <strong className="order-pass-id">{order.id}</strong>
        <span className="order-pass-total">{order.totalLabel}</span>
      </div>
      <p className="order-pass-hint">
        <span>{fulfilment}</span>
        <span>{t('passHint')}</span>
      </p>
      <button
        type="button"
        className="order-pass-save"
        onClick={() => savePassImage({ order, link, title: t('passTitle'), hint: t('passHint'), fulfilment })}
      >
        {t('passSave')}
      </button>
    </div>
  );
}
