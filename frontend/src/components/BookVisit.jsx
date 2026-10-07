import { useEffect, useMemo, useState } from 'react';
import { CloseIcon, PinIcon } from './Icons.jsx';
import { useLang } from '../i18n/LanguageContext.jsx';
import { bookVisit, fetchAvailability } from '../lib/orders.js';
import { STORES } from '../data/content.js';

const DETAILS_KEY = 'f8h_checkout_details';
const DAYS_SHOWN = 14;

function savedDetails() {
  try {
    const { name = '', phone = '', email = '' } = JSON.parse(localStorage.getItem(DETAILS_KEY) || '{}');
    return { name, phone, email };
  } catch {
    return { name: '', phone: '', email: '' };
  }
}

// Dates in India time, so "today" matches the shop
function upcomingDates() {
  const today = Date.now() + 5.5 * 60 * 60 * 1000;
  return Array.from({ length: DAYS_SHOWN }, (_, i) => new Date(today + i * 86400000).toISOString().slice(0, 10));
}

function dayLabel(date, lang) {
  const d = new Date(`${date}T12:00:00+05:30`);
  const locale = lang === 'as' ? 'as-IN' : 'en-IN';
  return {
    weekday: d.toLocaleDateString(locale, { weekday: 'short', timeZone: 'Asia/Kolkata' }),
    day: d.toLocaleDateString(locale, { day: 'numeric', timeZone: 'Asia/Kolkata' }),
    month: d.toLocaleDateString(locale, { month: 'short', timeZone: 'Asia/Kolkata' }),
  };
}

function timeLabel(slot) {
  const [h] = slot.split(':').map(Number);
  return `${((h + 11) % 12) + 1}:00 ${h < 12 ? 'AM' : 'PM'}`;
}

export default function BookVisit({ open, initialShowroom = 'Maligaon', onClose }) {
  const { t, lang } = useLang();
  const dates = useMemo(upcomingDates, [open]);
  const [showroom, setShowroom] = useState(initialShowroom);
  const [date, setDate] = useState(dates[0]);
  const [slots, setSlots] = useState(null);
  const [slot, setSlot] = useState('');
  const [details, setDetails] = useState(savedDetails);
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [booked, setBooked] = useState(null);

  useEffect(() => {
    if (open) {
      setShowroom(initialShowroom);
      setBooked(null);
      setError('');
    }
  }, [open, initialShowroom]);

  useEffect(() => {
    if (!open || booked) return;
    let cancelled = false;
    setSlots(null);
    setSlot('');
    fetchAvailability(showroom, date)
      .then((result) => { if (!cancelled) setSlots(result.slots); })
      .catch((err) => { if (!cancelled) { setSlots([]); setError(err.message); } });
    return () => { cancelled = true; };
  }, [open, showroom, date, booked]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (event) => { if (event.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const store = STORES.find((s) => s.name === showroom) || STORES[0];
  const update = (field) => (e) => setDetails((prev) => ({ ...prev, [field]: field === 'phone' ? e.target.value.replace(/\D/g, '') : e.target.value }));

  async function handleSubmit(e) {
    e.preventDefault();
    if (!slot) {
      setError(t('visitPickTime'));
      return;
    }
    setBusy(true);
    setError('');
    try {
      setBooked(await bookVisit({ showroom, date, slot, ...details, notes }));
      try {
        const saved = JSON.parse(localStorage.getItem(DETAILS_KEY) || '{}');
        localStorage.setItem(DETAILS_KEY, JSON.stringify({ ...saved, ...details }));
      } catch {
        // Only used to pre-fill forms
      }
    } catch (err) {
      setError(err.message);
      // The slot may have just filled up: refresh the times
      fetchAvailability(showroom, date).then((r) => setSlots(r.slots)).catch(() => {});
    } finally {
      setBusy(false);
    }
  }

  const when = booked ? `${new Date(`${booked.date}T12:00:00+05:30`).toLocaleDateString(lang === 'as' ? 'as-IN' : 'en-IN', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'Asia/Kolkata' })}, ${timeLabel(booked.slot)}` : '';

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="visitTitleModal" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal visit">
        <button className="modal-close" aria-label={t('closeModal')} type="button" onClick={onClose}><CloseIcon /></button>
        {booked ? (
          <div className="visit-done">
            <span className="checkout-done-icon" aria-hidden="true">✓</span>
            <h2 id="visitTitleModal">{t('visitBookedTitle', { name: booked.name.split(' ')[0] })}</h2>
            <p>{t('visitBookedBody')}</p>
            <div className="visit-ticket">
              <span className="track-label">{t('visitBookingNo')}</span>
              <strong>{booked.id}</strong>
              <span>{when}</span>
              <span>Furniture8home {booked.showroom}</span>
            </div>
            <a className="btn-primary btn-lg btn-block" href={store.directions} target="_blank" rel="noopener noreferrer">
              <PinIcon size={16} /> {t('directions')}
            </a>
            <button type="button" className="btn-secondary btn-lg btn-block" onClick={onClose}>{t('close')}</button>
          </div>
        ) : (
          <form className="visit-body" onSubmit={handleSubmit}>
            <h2 id="visitTitleModal">{t('visitModalTitle')}</h2>
            <p className="track-sub">{t('visitModalSub')}</p>

            <div className="visit-step">
              <span className="visit-step-label">{t('visitShowroom')}</span>
              <div className="swatches">
                {STORES.map((s) => (
                  <button key={s.name} type="button" aria-pressed={showroom === s.name} className={`swatch${showroom === s.name ? ' active' : ''}`} onClick={() => setShowroom(s.name)}>
                    {s.name === 'Maligaon' ? t('store1name') : t('store2name')}
                  </button>
                ))}
              </div>
            </div>

            <div className="visit-step">
              <span className="visit-step-label">{t('visitDay')}</span>
              <div className="visit-days" role="group" aria-label={t('visitDay')}>
                {dates.map((d) => {
                  const label = dayLabel(d, lang);
                  return (
                    <button key={d} type="button" aria-pressed={date === d} className={`visit-day${date === d ? ' active' : ''}`} onClick={() => setDate(d)}>
                      <small>{label.weekday}</small>
                      <strong>{label.day}</strong>
                      <small>{label.month}</small>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="visit-step">
              <span className="visit-step-label">{t('visitTime')}</span>
              {slots === null ? (
                <p className="visit-loading">{t('visitLoading')}</p>
              ) : slots.some((s) => s.available) ? (
                <div className="visit-slots">
                  {slots.map((s) => (
                    <button key={s.time} type="button" disabled={!s.available} aria-pressed={slot === s.time} className={`visit-slot${slot === s.time ? ' active' : ''}`} onClick={() => { setSlot(s.time); setError(''); }}>
                      {timeLabel(s.time)}
                    </button>
                  ))}
                </div>
              ) : (
                <p className="visit-loading">{t('visitNoSlots')}</p>
              )}
            </div>

            <div className="visit-step">
              <span className="visit-step-label">{t('visitYou')}</span>
              <label className="field">
                <span>{t('fieldName')}</span>
                <input required autoComplete="name" maxLength={80} value={details.name} onChange={update('name')} />
              </label>
              <div className="field-row">
                <label className="field">
                  <span>{t('fieldPhone')}</span>
                  <div className="field-prefix">
                    <em>+91</em>
                    <input required type="tel" inputMode="numeric" autoComplete="tel-national" pattern="[6-9][0-9]{9}" maxLength={10} value={details.phone} onChange={update('phone')} />
                  </div>
                </label>
                <label className="field">
                  <span>{t('visitEmail')}</span>
                  <input type="email" autoComplete="email" maxLength={120} value={details.email} onChange={update('email')} />
                </label>
              </div>
              <label className="field">
                <span>{t('visitNotes')}</span>
                <textarea rows={2} maxLength={500} placeholder={t('visitNotesPlaceholder')} value={notes} onChange={(e) => setNotes(e.target.value)} />
              </label>
            </div>

            {error && <p className="checkout-error" role="alert">{error}</p>}
            <button type="submit" className="btn-primary btn-lg btn-block" disabled={busy}>
              {busy ? t('visitBooking') : slot ? t('visitConfirm', { time: timeLabel(slot) }) : t('visitBookButton')}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
