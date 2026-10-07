import { logout } from '../lib/api.js';
import { LogoMark } from './Icons.jsx';

/**
 * The admin's top bar: brand, view tabs, page actions, and store/log-out buttons.
 */
export default function AdminHeader({ subtitle, nav, actions, onExit, onLogout }) {
  async function handleLogout() {
    await logout().catch(() => {});
    onLogout();
  }

  return (
    <header className="admin-nav-header">
      <div className="admin-nav-inner wrap">
        <div className="admin-brand">
          <div className="admin-brand-icon">
            <LogoMark />
          </div>
          <div>
            <div className="admin-brand-title">
              Furniture<span className="num">8</span>home
              <span className="admin-badge">Admin Manager</span>
            </div>
            <div className="admin-brand-sub">{subtitle}</div>
          </div>
        </div>
        <div className="admin-nav-actions">
          {nav}
          {actions}
          <button type="button" className="admin-btn admin-btn-ghost" onClick={onExit} title="Exit Admin and View Store">
            <span>← View Store</span>
          </button>
          <button type="button" className="admin-btn admin-btn-ghost" onClick={handleLogout} title="Log out of the admin dashboard">
            <span>Log out</span>
          </button>
        </div>
      </div>
    </header>
  );
}
