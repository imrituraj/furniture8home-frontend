import { useEffect, useRef, useState } from 'react';
import { useLang } from '../i18n/LanguageContext.jsx';

function Arrow({ dir }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={dir === 'left' ? 'M15 18l-6-6 6-6' : 'M9 6l6 6-6 6'} />
    </svg>
  );
}

/**
 * Product photos: main photo with arrows, swipe on touch screens, arrow keys, and thumbnails.
 */
export default function Gallery({ images, alt }) {
  const { t } = useLang();
  const [index, setIndex] = useState(0);
  const touchX = useRef(null);
  const count = images.length;

  useEffect(() => setIndex(0), [images.join('|')]);

  const go = (delta) => setIndex((i) => (i + delta + count) % count);

  useEffect(() => {
    if (count < 2) return undefined;
    const onKey = (e) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === 'ArrowLeft') go(-1);
      if (e.key === 'ArrowRight') go(1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [count]);

  const current = images[Math.min(index, count - 1)];

  return (
    <div className="gallery">
      <div
        className="gallery-main"
        onTouchStart={(e) => { touchX.current = e.touches[0].clientX; }}
        onTouchEnd={(e) => {
          if (touchX.current === null || count < 2) return;
          const dx = e.changedTouches[0].clientX - touchX.current;
          if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1);
          touchX.current = null;
        }}
      >
        <a className="modal-img" href={current} target="_blank" rel="noopener noreferrer" title={t('zoomNote')}>
          <img src={current} alt={count > 1 ? `${alt} (${index + 1}/${count})` : alt} />
        </a>
        {count > 1 && (
          <>
            <button type="button" className="gallery-arrow gallery-prev" onClick={() => go(-1)} aria-label={t('galleryPrev')}><Arrow dir="left" /></button>
            <button type="button" className="gallery-arrow gallery-next" onClick={() => go(1)} aria-label={t('galleryNext')}><Arrow dir="right" /></button>
            <span className="gallery-count">{index + 1} / {count}</span>
          </>
        )}
      </div>
      {count > 1 && (
        <div className="gallery-thumbs" role="group" aria-label={t('galleryPhotos')}>
          {images.map((src, i) => (
            <button key={src} type="button" className={`gallery-thumb${i === index ? ' active' : ''}`} onClick={() => setIndex(i)} aria-label={t('galleryShow', { n: i + 1 })} aria-pressed={i === index}>
              <img src={src} alt="" loading="lazy" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
