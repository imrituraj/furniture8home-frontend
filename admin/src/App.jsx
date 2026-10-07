import { useEffect, useState } from 'react';
import AdminDashboard from './components/AdminDashboard.jsx';
import AdminLogin from './components/AdminLogin.jsx';
import CategoriesDashboard from './components/CategoriesDashboard.jsx';
import SalesDashboard from './components/SalesDashboard.jsx';
import VisitsDashboard from './components/VisitsDashboard.jsx';
import DiscountsDashboard from './components/DiscountsDashboard.jsx';
import OrdersDashboard from './components/OrdersDashboard.jsx';
import { isAuthenticated, onSessionExpired } from './lib/api.js';
import { STOREFRONT_URL } from './lib/storefront.js';

const VIEWS = [
  { key: 'orders', label: 'Orders' },
  { key: 'sales', label: 'Sales' },
  { key: 'visits', label: 'Visits' },
  { key: 'catalog', label: 'Products' },
  { key: 'categories', label: 'Categories' },
  { key: 'discounts', label: 'Discounts' },
];

function readView() {
  const hash = window.location.hash.slice(1);
  return VIEWS.some((v) => v.key === hash) ? hash : 'orders';
}

// Order QR codes link to #order/<id>: open that order straight away
function readOrderLink() {
  const match = /^#order\/(.+)$/.exec(window.location.hash);
  return match ? decodeURIComponent(match[1]) : null;
}

export default function App() {
  const [authed, setAuthed] = useState(isAuthenticated);
  const [view, setView] = useState(readView);
  const [orderLink, setOrderLink] = useState(readOrderLink);

  useEffect(() => onSessionExpired(() => setAuthed(false)), []);

  useEffect(() => {
    const onHash = () => {
      setView(readView());
      setOrderLink(readOrderLink());
    };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  function openStore() {
    window.location.href = STOREFRONT_URL;
  }

  if (!authed) {
    return <AdminLogin onLoginSuccess={() => setAuthed(true)} onCancel={openStore} />;
  }

  const nav = (
    <div className="admin-view-tabs" role="tablist">
      {VIEWS.map((v) => (
        <a key={v.key} href={`#${v.key}`} role="tab" aria-selected={view === v.key} className={view === v.key ? 'active' : ''}>
          {v.label}
        </a>
      ))}
    </div>
  );

  const props = { nav, onExit: openStore, onLogout: () => setAuthed(false) };
  if (view === 'catalog') return <AdminDashboard {...props} />;
  if (view === 'categories') return <CategoriesDashboard {...props} />;
  if (view === 'sales') return <SalesDashboard {...props} />;
  if (view === 'visits') return <VisitsDashboard {...props} />;
  if (view === 'discounts') return <DiscountsDashboard {...props} />;
  return <OrdersDashboard {...props} openOrderId={orderLink} />;
}
