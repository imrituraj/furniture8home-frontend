import { useRef, useState } from 'react';
import { login } from '../lib/api.js';
import { LogoMark, CloseIcon } from './Icons.jsx';

const EMAIL_KEY = 'f8h_admin_email';

// Remember the admin email on this device, so staff usually only type the password
function readSavedEmail() {
  try {
    return localStorage.getItem(EMAIL_KEY) || '';
  } catch {
    return '';
  }
}

function saveEmail(email) {
  try {
    localStorage.setItem(EMAIL_KEY, email);
  } catch {
    // Storage blocked: they'll type it next time
  }
}

function EyeIcon({ open }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
      <circle cx="12" cy="12" r="3" />
      {!open && <path d="M3 3l18 18" />}
    </svg>
  );
}

export default function AdminLogin({ onLoginSuccess, onCancel }) {
  const [email, setEmail] = useState(readSavedEmail);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const passwordRef = useRef(null);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  function handleSubmit(e) {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Please enter the admin email address');
      return;
    }
    if (!password) {
      setError('Please enter your password');
      return;
    }

    setSubmitting(true);
    login(email.trim(), password)
      .then(() => {
        setError('');
        saveEmail(email.trim());
        onLoginSuccess();
      })
      .catch((err) => {
        setError(err.message || 'Login failed. Please try again.');
        setPassword('');
      })
      .finally(() => setSubmitting(false));
  }

  return (
    <div className="admin-login-overlay" role="dialog" aria-modal="true" aria-labelledby="adminLoginTitle">
      <div className="admin-login-card">
        {onCancel && (
          <button type="button" className="admin-modal-close" onClick={onCancel} aria-label="Cancel and return">
            <CloseIcon />
          </button>
        )}
        <div className="admin-login-icon">
          <LogoMark />
        </div>
        <h2 id="adminLoginTitle" className="admin-login-title">Admin Access</h2>
        <p className="admin-login-sub">Sign in with the admin email and password to manage orders, products and categories.</p>

        <form onSubmit={handleSubmit} className="admin-login-form" noValidate>
          <label className="admin-login-field">
            <span>Email</span>
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError('');
              }}
              placeholder="you@example.com"
              autoComplete="username"
              autoCapitalize="none"
              spellCheck={false}
              autoFocus={!email}
              className={`admin-login-input${error ? ' has-error' : ''}`}
            />
          </label>

          <label className="admin-login-field">
            <span>Password</span>
            <div className="admin-password-wrap">
              <input
                ref={passwordRef}
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError('');
                }}
                placeholder="Your password"
                autoComplete="current-password"
                autoCapitalize="none"
                spellCheck={false}
                autoFocus={Boolean(email)}
                maxLength={128}
                className={`admin-login-input${error ? ' has-error' : ''}`}
              />
              <button
                type="button"
                className="admin-password-toggle"
                onClick={() => {
                  setShowPassword((v) => !v);
                  // Keep typing in the field, so Enter still signs in
                  passwordRef.current?.focus();
                }}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                aria-pressed={showPassword}
              >
                <EyeIcon open={showPassword} />
              </button>
            </div>
          </label>

          {error && <div className="admin-login-error" role="alert">{error}</div>}

          <div className="admin-login-actions">
            <button type="submit" className="btn-primary" disabled={submitting} style={{ width: '100%', justifyContent: 'center' }}>
              {submitting ? 'Signing in…' : 'Sign in'}
            </button>
            {onCancel && (
              <button type="button" className="btn-secondary" style={{ width: '100%', justifyContent: 'center', marginTop: '8px' }} onClick={onCancel}>
                Return to Store
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
