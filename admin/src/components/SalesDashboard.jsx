import { useEffect, useMemo, useState } from 'react';
import { fetchCatalog, fetchCategories, fetchOrders, formatPrice } from '../lib/api.js';
import AdminHeader from './AdminHeader.jsx';

const PERIODS = [
  { key: 7, label: '7 days', bucket: 'day' },
  { key: 30, label: '30 days', bucket: 'day' },
  { key: 90, label: '3 months', bucket: 'week' },
  { key: 365, label: '12 months', bucket: 'month' },
];

const METHOD_LABELS = { razorpay: 'Online (Razorpay)', offline: 'Pay offline', whatsapp: 'WhatsApp order' };
const DAY = 86400000;

// Dates in India time, as YYYY-MM-DD
function istDay(ms) {
  return new Date(ms + 5.5 * 3600000).toISOString().slice(0, 10);
}

function bucketKey(iso, bucket) {
  const day = istDay(Date.parse(iso));
  if (bucket === 'month') return day.slice(0, 7);
  if (bucket === 'week') {
    // Week starting Monday
    const d = new Date(`${day}T00:00:00Z`);
    const monday = new Date(d.getTime() - ((d.getUTCDay() + 6) % 7) * DAY);
    return monday.toISOString().slice(0, 10);
  }
  return day;
}

function bucketLabel(key, bucket) {
  if (bucket === 'month') return new Date(`${key}-01T00:00:00Z`).toLocaleDateString('en-IN', { month: 'short', timeZone: 'UTC' });
  return new Date(`${key}T00:00:00Z`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', timeZone: 'UTC' });
}

// Every bucket in the period, so quiet days still show as empty bars
function allBuckets(days, bucket) {
  const keys = [];
  const end = Date.now();
  for (let t = end - (days - 1) * DAY; t <= end; t += DAY) {
    const key = bucketKey(new Date(t).toISOString(), bucket);
    if (keys[keys.length - 1] !== key) keys.push(key);
  }
  return keys;
}

function summarise(orders) {
  const live = orders.filter((o) => o.status !== 'cancelled');
  const sales = live.reduce((s, o) => s + o.total, 0);
  return {
    sales,
    count: live.length,
    average: live.length ? Math.round(sales / live.length) : 0,
    collected: live.filter((o) => o.paymentStatus === 'paid').reduce((s, o) => s + o.total, 0),
    discounts: live.reduce((s, o) => s + (o.discount?.amount || 0), 0),
    cancelled: orders.length - live.length,
  };
}

function Change({ now, before }) {
  if (!before) return <span className="sales-change">No earlier data</span>;
  const pct = Math.round(((now - before) / before) * 100);
  return <span className={`sales-change ${pct >= 0 ? 'up' : 'down'}`}>{pct >= 0 ? '▲' : '▼'} {Math.abs(pct)}% vs previous</span>;
}

function Bars({ rows, format = formatPrice }) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <ul className="sales-bars">
      {rows.map((r) => (
        <li key={r.label}>
          <span className="sales-bar-label">{r.label}</span>
          <span className="sales-bar-track"><span className="sales-bar-fill" style={{ width: `${(r.value / max) * 100}%` }} /></span>
          <span className="sales-bar-value">{format(r.value)}{r.note ? <small> · {r.note}</small> : null}</span>
        </li>
      ))}
    </ul>
  );
}

export default function SalesDashboard({ nav, onExit, onLogout }) {
  const [orders, setOrders] = useState([]);
  const [catalog, setCatalog] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [period, setPeriod] = useState(PERIODS[1]);

  useEffect(() => {
    Promise.all([fetchOrders(), fetchCatalog(), fetchCategories()])
      .then(([o, p, c]) => { setOrders(o); setCatalog(p); setCategories(c); })
      .catch((err) => setError(err.message || 'Failed to load sales'))
      .finally(() => setLoading(false));
  }, []);

  const data = useMemo(() => {
    const now = Date.now();
    const start = now - period.key * DAY;
    const prevStart = start - period.key * DAY;
    const current = orders.filter((o) => Date.parse(o.createdAt) >= start);
    const previous = orders.filter((o) => Date.parse(o.createdAt) >= prevStart && Date.parse(o.createdAt) < start);
    const live = current.filter((o) => o.status !== 'cancelled');

    const byBucket = Object.fromEntries(allBuckets(period.key, period.bucket).map((k) => [k, 0]));
    for (const o of live) {
      const key = bucketKey(o.createdAt, period.bucket);
      if (key in byBucket) byBucket[key] += o.total;
    }

    const products = {};
    const catOf = Object.fromEntries(catalog.map((p) => [p.id, p.cat]));
    const catName = Object.fromEntries(categories.map((c) => [c.id, c.name]));
    const byCategory = {};
    for (const o of live) {
      for (const item of o.items) {
        const p = (products[item.id] ||= { name: item.name, qty: 0, revenue: 0 });
        p.qty += item.qty;
        p.revenue += item.lineTotal;
        const cat = catName[catOf[item.id]] || catOf[item.id] || 'Other';
        byCategory[cat] = (byCategory[cat] || 0) + item.lineTotal;
      }
    }
    const byMethod = {};
    const byFulfilment = { Delivery: 0, 'Showroom pickup': 0 };
    for (const o of live) {
      byMethod[o.paymentMethod] = (byMethod[o.paymentMethod] || 0) + o.total;
      byFulfilment[o.fulfilment?.type === 'pickup' ? 'Showroom pickup' : 'Delivery'] += 1;
    }

    return {
      now: summarise(current),
      before: summarise(previous),
      chart: Object.entries(byBucket).map(([key, value]) => ({ key, value, label: bucketLabel(key, period.bucket) })),
      topProducts: Object.values(products).sort((a, b) => b.revenue - a.revenue).slice(0, 8),
      categories: Object.entries(byCategory).sort((a, b) => b[1] - a[1]).map(([label, value]) => ({ label, value })),
      methods: Object.entries(byMethod).sort((a, b) => b[1] - a[1]).map(([m, value]) => ({ label: METHOD_LABELS[m] || m, value })),
      fulfilment: Object.entries(byFulfilment).map(([label, value]) => ({ label, value })),
    };
  }, [orders, catalog, categories, period]);

  const chartMax = Math.max(1, ...data.chart.map((b) => b.value));
  const labelEvery = Math.ceil(data.chart.length / 10);

  return (
    <div className="admin-wrapper">
      <AdminHeader subtitle="Sales and performance" nav={nav} onExit={onExit} onLogout={onLogout} />
      <main className="admin-main wrap">
        <div className="sales-toolbar">
          <div className="admin-status-tabs">
            {PERIODS.map((p) => (
              <button key={p.key} type="button" className={`admin-tab-btn${period.key === p.key ? ' active' : ''}`} onClick={() => setPeriod(p)}>
                Last {p.label}
              </button>
            ))}
          </div>
          <span className="admin-help-text">Cancelled orders are left out. Times are India time.</span>
        </div>

        {error && <div className="admin-callout">{error}</div>}
        {loading ? (
          <p className="admin-help-text">Loading sales…</p>
        ) : (
          <>
            <section className="admin-kpi-grid sales-kpis">
              <div className="admin-kpi-card">
                <div className="admin-kpi-label">Sales</div>
                <div className="admin-kpi-value">{formatPrice(data.now.sales)}</div>
                <div className="admin-kpi-hint"><Change now={data.now.sales} before={data.before.sales} /></div>
              </div>
              <div className="admin-kpi-card">
                <div className="admin-kpi-label">Orders</div>
                <div className="admin-kpi-value">{data.now.count}</div>
                <div className="admin-kpi-hint"><Change now={data.now.count} before={data.before.count} /></div>
              </div>
              <div className="admin-kpi-card">
                <div className="admin-kpi-label">Average order</div>
                <div className="admin-kpi-value">{formatPrice(data.now.average)}</div>
                <div className="admin-kpi-hint"><Change now={data.now.average} before={data.before.average} /></div>
              </div>
              <div className="admin-kpi-card">
                <div className="admin-kpi-label">Collected</div>
                <div className="admin-kpi-value" style={{ color: 'var(--brand-sage)' }}>{formatPrice(data.now.collected)}</div>
                <div className="admin-kpi-hint">To collect: {formatPrice(data.now.sales - data.now.collected)}</div>
              </div>
              <div className="admin-kpi-card">
                <div className="admin-kpi-label">Discounts given</div>
                <div className="admin-kpi-value">{formatPrice(data.now.discounts)}</div>
                <div className="admin-kpi-hint">{data.now.cancelled} cancelled order{data.now.cancelled === 1 ? '' : 's'}</div>
              </div>
            </section>

            <section className="admin-catalog-container sales-panel">
              <h3 className="sales-title">Sales by {period.bucket}</h3>
              {data.now.count === 0 ? (
                <p className="admin-help-text">No orders in this period yet.</p>
              ) : (
                <div className="sales-chart" role="img" aria-label={`Sales by ${period.bucket}`}>
                  {data.chart.map((b, i) => (
                    <div key={b.key} className="sales-col" title={`${b.label}: ${formatPrice(b.value)}`}>
                      <div className="sales-col-bar" style={{ height: `${Math.max((b.value / chartMax) * 100, b.value ? 2 : 0)}%` }} />
                      <span className="sales-col-label">{i % labelEvery === 0 ? b.label : ''}</span>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <div className="sales-grid">
              <section className="admin-catalog-container sales-panel">
                <h3 className="sales-title">Best sellers</h3>
                {data.topProducts.length ? (
                  <Bars rows={data.topProducts.map((p) => ({ label: p.name, value: p.revenue, note: `${p.qty} sold` }))} />
                ) : <p className="admin-help-text">Nothing sold in this period.</p>}
              </section>
              <section className="admin-catalog-container sales-panel">
                <h3 className="sales-title">By category</h3>
                {data.categories.length ? <Bars rows={data.categories} /> : <p className="admin-help-text">Nothing sold in this period.</p>}
              </section>
              <section className="admin-catalog-container sales-panel">
                <h3 className="sales-title">How customers paid</h3>
                {data.methods.length ? <Bars rows={data.methods} /> : <p className="admin-help-text">No orders yet.</p>}
              </section>
              <section className="admin-catalog-container sales-panel">
                <h3 className="sales-title">Delivery or pickup</h3>
                <Bars rows={data.fulfilment} format={(n) => `${n} order${n === 1 ? '' : 's'}`} />
              </section>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
