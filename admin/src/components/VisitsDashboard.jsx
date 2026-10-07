import { useEffect, useMemo, useRef, useState } from 'react';
import { fetchBookings, updateBooking } from '../lib/api.js';
import AdminHeader from './AdminHeader.jsx';
import { WaIcon } from './Icons.jsx';

const STATUS_LABELS = { booked: 'Booked', visited: 'Visited', no_show: 'No-show', cancelled: 'Cancelled' };
const FILTERS = [
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'past', label: 'Past' },
  { key: 'all', label: 'All' },
];

function todayIST() {
  return new Date(Date.now() + 5.5 * 3600000).toISOString().slice(0, 10);
}

function dayHeading(date) {
  const today = todayIST();
  const tomorrow = new Date(Date.parse(`${today}T00:00:00Z`) + 86400000).toISOString().slice(0, 10);
  const label = new Date(`${date}T12:00:00Z`).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' });
  if (date === today) return `Today · ${label}`;
  if (date === tomorrow) return `Tomorrow · ${label}`;
  return label;
}

function timeLabel(slot) {
  const [h] = slot.split(':').map(Number);
  return `${((h + 11) % 12) + 1}:00 ${h < 12 ? 'AM' : 'PM'}`;
}

export default function VisitsDashboard({ nav, onExit, onLogout }) {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('upcoming');
  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);

  function showToast(message, type = 'success') {
    clearTimeout(toastTimer.current);
    setToast({ message, type });
    toastTimer.current = setTimeout(() => setToast(null), 3200);
  }

  async function refresh() {
    try {
      setBookings(await fetchBookings());
    } catch (err) {
      showToast(err.message || 'Failed to load visits', 'warning');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  async function setStatus(booking, status) {
    try {
      const updated = await updateBooking(booking.id, { status });
      setBookings((list) => list.map((b) => (b.id === updated.id ? updated : b)));
      showToast(`${booking.name}: ${STATUS_LABELS[status]}`);
    } catch (err) {
      showToast(err.message || 'Update failed', 'warning');
    }
  }

  const today = todayIST();
  const groups = useMemo(() => {
    const list = bookings
      .filter((b) => (filter === 'upcoming' ? b.date >= today : filter === 'past' ? b.date < today : true))
      .sort((a, b) => (filter === 'upcoming' ? `${a.date}${a.slot}`.localeCompare(`${b.date}${b.slot}`) : `${b.date}${b.slot}`.localeCompare(`${a.date}${a.slot}`)));
    const byDay = new Map();
    for (const b of list) {
      if (!byDay.has(b.date)) byDay.set(b.date, []);
      byDay.get(b.date).push(b);
    }
    return [...byDay.entries()];
  }, [bookings, filter, today]);

  const upcomingCount = bookings.filter((b) => b.date >= today && b.status === 'booked').length;
  const todayCount = bookings.filter((b) => b.date === today && b.status === 'booked').length;

  return (
    <div className="admin-wrapper">
      {toast && (
        <div className={`admin-toast admin-toast-${toast.type}`} role="status">
          <span>{toast.message}</span>
          <button type="button" onClick={() => setToast(null)}>×</button>
        </div>
      )}
      <AdminHeader
        subtitle="Showroom visits"
        nav={nav}
        actions={<button type="button" className="admin-btn admin-btn-secondary" onClick={refresh}><span>Refresh</span></button>}
        onExit={onExit}
        onLogout={onLogout}
      />
      <main className="admin-main wrap">
        <section className="admin-kpi-grid">
          <div className="admin-kpi-card">
            <div className="admin-kpi-label">Today</div>
            <div className="admin-kpi-value" style={{ color: 'var(--brand-brass)' }}>{todayCount}</div>
            <div className="admin-kpi-hint">Visits booked</div>
          </div>
          <div className="admin-kpi-card">
            <div className="admin-kpi-label">Upcoming</div>
            <div className="admin-kpi-value">{upcomingCount}</div>
            <div className="admin-kpi-hint">Including today</div>
          </div>
        </section>

        <div className="admin-status-tabs visits-filters">
          {FILTERS.map((f) => (
            <button key={f.key} type="button" className={`admin-tab-btn${filter === f.key ? ' active' : ''}`} onClick={() => setFilter(f.key)}>{f.label}</button>
          ))}
        </div>

        {loading ? (
          <p className="admin-help-text">Loading visits…</p>
        ) : groups.length === 0 ? (
          <div className="admin-empty-state">
            <h3>No visits here</h3>
            <p>Customers book from the Showrooms section of the store. Their visits appear here, and you get an email for each.</p>
          </div>
        ) : (
          groups.map(([date, list]) => (
            <section key={date} className={`admin-catalog-container visits-day${date === today ? ' is-today' : ''}`}>
              <h3 className="sales-title">{dayHeading(date)} <small>· {list.length} visit{list.length === 1 ? '' : 's'}</small></h3>
              <ul className="visits-list">
                {list.map((b) => (
                  <li key={b.id} className={`visit-row status-${b.status}`}>
                    <div className="visit-time">{timeLabel(b.slot)}<small>{b.showroom}</small></div>
                    <div className="visit-who">
                      <strong>{b.name}</strong>
                      <span>
                        <a href={`tel:+91${b.phone.slice(-10)}`}>{b.phone}</a>
                        {b.email && <> · <a href={`mailto:${b.email}`}>{b.email}</a></>}
                      </span>
                      {b.notes && <em>{b.notes}</em>}
                    </div>
                    <div className="visit-actions">
                      <a className="admin-btn admin-btn-sm admin-btn-secondary" href={`https://wa.me/91${b.phone.slice(-10)}?text=${encodeURIComponent(`Hi ${b.name}, this is Furniture8home. Looking forward to your visit to our ${b.showroom} showroom on ${dayHeading(b.date)} at ${timeLabel(b.slot)}.`)}`} target="_blank" rel="noopener noreferrer">
                        <WaIcon size={14} /> <span>WhatsApp</span>
                      </a>
                      <div className="admin-select-wrap">
                        <select value={b.status} onChange={(e) => setStatus(b, e.target.value)} aria-label={`Status for ${b.name}`}>
                          {Object.entries(STATUS_LABELS).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
                        </select>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          ))
        )}
      </main>
    </div>
  );
}
