import { useEffect, useRef, useState } from 'react';
import { addCoupon, deleteCoupon, fetchCoupons, formatPrice, updateCoupon } from '../lib/api.js';
import AdminHeader from './AdminHeader.jsx';
import { CloseIcon } from './Icons.jsx';

function offerLabel(c) {
  const off = c.type === 'percent' ? `${c.value}% off` : `${formatPrice(c.value)} off`;
  return c.type === 'percent' && c.maxDiscount ? `${off}, up to ${formatPrice(c.maxDiscount)}` : off;
}

function shortDate(d) {
  return d ? new Date(`${d}T12:00:00Z`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }) : '';
}

function rules(c) {
  const parts = [];
  if (c.minOrder) parts.push(`Min order ${formatPrice(c.minOrder)}`);
  if (c.startsAt) parts.push(`From ${shortDate(c.startsAt)}`);
  if (c.expiresAt) parts.push(`Until ${shortDate(c.expiresAt)}`);
  if (c.perPhoneLimit) parts.push(`${c.perPhoneLimit} per customer`);
  return parts.join(' · ') || 'No limits';
}

function state(c) {
  const today = new Date(Date.now() + 5.5 * 3600000).toISOString().slice(0, 10);
  if (!c.active) return ['Off', 'pill-out'];
  if (c.expiresAt && today > c.expiresAt) return ['Expired', 'pill-out'];
  if (c.startsAt && today < c.startsAt) return ['Scheduled', 'pill-pending'];
  if (c.usageLimit && c.used >= c.usageLimit) return ['Used up', 'pill-out'];
  return ['Live', 'pill-in'];
}

export default function DiscountsDashboard({ nav, onExit, onLogout }) {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null); // {} to create, a coupon to edit
  const [deleting, setDeleting] = useState(null);
  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);

  function showToast(message, type = 'success') {
    clearTimeout(toastTimer.current);
    setToast({ message, type });
    toastTimer.current = setTimeout(() => setToast(null), 3200);
  }

  async function run(action, message) {
    try {
      const result = await action();
      setCoupons(await fetchCoupons());
      if (message) showToast(message);
      return result ?? true;
    } catch (err) {
      showToast(err.message || 'Something went wrong', 'warning');
      return null;
    }
  }

  useEffect(() => {
    fetchCoupons()
      .then(setCoupons)
      .catch((err) => showToast(err.message || 'Failed to load discount codes', 'warning'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="admin-wrapper">
      {toast && (
        <div className={`admin-toast admin-toast-${toast.type}`} role="status">
          <span>{toast.message}</span>
          <button type="button" onClick={() => setToast(null)}>×</button>
        </div>
      )}
      <AdminHeader
        subtitle="Discount codes"
        nav={nav}
        actions={<button type="button" className="admin-btn admin-btn-primary" onClick={() => setEditing({})}><span>+ New code</span></button>}
        onExit={onExit}
        onLogout={onLogout}
      />
      <main className="admin-main wrap">
        <p className="admin-help-text discounts-intro">Customers type a code at checkout. Discounts are worked out on the server, so a code can't be stretched past its rules.</p>
        {loading ? (
          <p className="admin-help-text">Loading…</p>
        ) : coupons.length === 0 ? (
          <div className="admin-empty-state">
            <h3>Create your first discount code</h3>
            <p>For example DIWALI10: 10% off, up to ₹3,000, until 31 October, once per customer.</p>
            <button type="button" className="admin-btn admin-btn-primary" onClick={() => setEditing({})}>+ New code</button>
          </div>
        ) : (
          <section className="admin-catalog-container">
            <div className="admin-table-responsive">
              <table className="admin-table">
                <thead>
                  <tr><th>Code</th><th>Offer</th><th>Rules</th><th>Used</th><th>Status</th><th style={{ width: '170px' }}>Actions</th></tr>
                </thead>
                <tbody>
                  {coupons.map((c) => {
                    const [label, pill] = state(c);
                    return (
                      <tr key={c.code}>
                        <td><span className="discount-code">{c.code}</span>{c.note && <div className="admin-cell-sub">{c.note}</div>}</td>
                        <td><div className="admin-cell-title">{offerLabel(c)}</div></td>
                        <td><div className="admin-cell-sub">{rules(c)}</div></td>
                        <td><strong>{c.used}</strong>{c.usageLimit ? <span className="admin-cell-sub"> / {c.usageLimit}</span> : null}</td>
                        <td>
                          <button type="button" className={`admin-status-pill ${pill}`} title="Click to turn on or off" onClick={() => run(() => updateCoupon(c.code, { active: !c.active }), `${c.code} turned ${c.active ? 'off' : 'on'}`)}>
                            <span className="pill-dot" />{label}
                          </button>
                        </td>
                        <td>
                          <div className="admin-actions-cell">
                            <button type="button" className="admin-btn admin-btn-sm admin-btn-secondary" onClick={() => setEditing(c)}>Edit</button>
                            <button type="button" className="admin-btn admin-btn-sm admin-btn-danger" onClick={() => setDeleting(c)}>Delete</button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </main>

      {editing && (
        <CouponForm
          coupon={editing}
          onClose={() => setEditing(null)}
          onSave={async (data) => {
            const ok = editing.code
              ? await run(() => updateCoupon(editing.code, data), `${editing.code} saved`)
              : await run(() => addCoupon(data), `${data.code.toUpperCase()} created`);
            if (ok) setEditing(null);
          }}
        />
      )}

      {deleting && (
        <div className="admin-modal-overlay open" role="dialog" aria-modal="true">
          <div className="admin-confirm-card">
            <h2>Delete {deleting.code}?</h2>
            <p>Customers won't be able to use it any more. Orders that already used it keep their discount. To pause it instead, turn it off.</p>
            <div className="admin-modal-footer">
              <button type="button" className="admin-btn admin-btn-secondary" onClick={() => setDeleting(null)}>Cancel</button>
              <button type="button" className="admin-btn admin-btn-danger" onClick={async () => { if (await run(() => deleteCoupon(deleting.code), `${deleting.code} deleted`)) setDeleting(null); }}>Delete code</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function CouponForm({ coupon, onClose, onSave }) {
  const isNew = !coupon.code;
  const [form, setForm] = useState({
    code: coupon.code || '',
    type: coupon.type || 'percent',
    value: coupon.value || '',
    maxDiscount: coupon.maxDiscount || '',
    minOrder: coupon.minOrder || '',
    startsAt: coupon.startsAt || '',
    expiresAt: coupon.expiresAt || '',
    usageLimit: coupon.usageLimit || '',
    perPhoneLimit: coupon.perPhoneLimit ?? (isNew ? 1 : ''),
    note: coupon.note || '',
    active: coupon.active !== false,
  });
  const [saving, setSaving] = useState(false);
  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));
  const num = (v) => (v === '' ? 0 : Number(v));

  async function submit(e) {
    e.preventDefault();
    setSaving(true);
    await onSave({
      ...form,
      code: form.code.trim().toUpperCase(),
      value: num(form.value),
      maxDiscount: num(form.maxDiscount),
      minOrder: num(form.minOrder),
      usageLimit: num(form.usageLimit),
      perPhoneLimit: num(form.perPhoneLimit),
    });
    setSaving(false);
  }

  return (
    <div className="admin-modal-overlay open" role="dialog" aria-modal="true" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <form className="admin-export-card admin-category-form" onSubmit={submit}>
        <div className="admin-modal-header">
          <div>
            <h2>{isNew ? 'New discount code' : `Edit ${coupon.code}`}</h2>
            {!isNew && <div className="admin-modal-sub">Used {coupon.used} time{coupon.used === 1 ? '' : 's'}</div>}
          </div>
          <button type="button" className="admin-modal-close" onClick={onClose} aria-label="Close"><CloseIcon /></button>
        </div>

        <div className="admin-form-row">
          <div className="admin-form-group">
            <label htmlFor="cCode">Code *</label>
            <input id="cCode" value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase().replace(/\s/g, '') }))} disabled={!isNew} placeholder="DIWALI10" maxLength={20} required autoFocus={isNew} />
          </div>
          <div className="admin-form-group">
            <label htmlFor="cType">Discount type</label>
            <select id="cType" value={form.type} onChange={set('type')}>
              <option value="percent">Percent off</option>
              <option value="flat">Flat ₹ off</option>
            </select>
          </div>
        </div>
        <div className="admin-form-row">
          <div className="admin-form-group">
            <label htmlFor="cValue">{form.type === 'percent' ? 'Percent off *' : 'Rupees off *'}</label>
            <input id="cValue" type="number" min="1" max={form.type === 'percent' ? 90 : undefined} value={form.value} onChange={set('value')} placeholder={form.type === 'percent' ? '10' : '1000'} required />
          </div>
          {form.type === 'percent' ? (
            <div className="admin-form-group">
              <label htmlFor="cMax">Maximum discount (₹)</label>
              <input id="cMax" type="number" min="0" value={form.maxDiscount} onChange={set('maxDiscount')} placeholder="No maximum" />
            </div>
          ) : <div className="admin-form-group" />}
        </div>
        <div className="admin-form-row">
          <div className="admin-form-group">
            <label htmlFor="cMin">Minimum order (₹)</label>
            <input id="cMin" type="number" min="0" value={form.minOrder} onChange={set('minOrder')} placeholder="None" />
          </div>
          <div className="admin-form-group">
            <label htmlFor="cUses">Total uses allowed</label>
            <input id="cUses" type="number" min="0" value={form.usageLimit} onChange={set('usageLimit')} placeholder="Unlimited" />
          </div>
        </div>
        <div className="admin-form-row">
          <div className="admin-form-group">
            <label htmlFor="cStart">Starts on</label>
            <input id="cStart" type="date" value={form.startsAt} onChange={set('startsAt')} />
          </div>
          <div className="admin-form-group">
            <label htmlFor="cEnd">Last day</label>
            <input id="cEnd" type="date" value={form.expiresAt} onChange={set('expiresAt')} />
          </div>
        </div>
        <div className="admin-form-row">
          <div className="admin-form-group">
            <label htmlFor="cPer">Uses per customer (phone)</label>
            <input id="cPer" type="number" min="0" value={form.perPhoneLimit} onChange={set('perPhoneLimit')} placeholder="Unlimited" />
          </div>
          <div className="admin-form-group">
            <label htmlFor="cNote">Note (only you see this)</label>
            <input id="cNote" value={form.note} onChange={set('note')} placeholder="Diwali Instagram post" maxLength={200} />
          </div>
        </div>
        <label className="admin-check">
          <input type="checkbox" checked={form.active} onChange={set('active')} />
          <span>Active: customers can use this code</span>
        </label>

        <div className="admin-modal-footer">
          <button type="button" className="admin-btn admin-btn-secondary" onClick={onClose}>Cancel</button>
          <button type="submit" className="admin-btn admin-btn-primary" disabled={saving}>{saving ? 'Saving…' : isNew ? 'Create code' : 'Save changes'}</button>
        </div>
      </form>
    </div>
  );
}
