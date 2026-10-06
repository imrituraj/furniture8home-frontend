import { useState } from 'react';
import { login } from '../lib/api.js';
import { ChairIcon, CloseIcon } from './Icons.jsx';

const EMAIL_KEY = 'f8h_admin_email';

// Remember the admin email on this device, so staff usually only type the passcode
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

export default function AdminLogin({ onLoginSuccess, onCancel }) {
  const [email, setEmail] = useState(readSavedEmail);
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  function handleSubmit(e) {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Please enter the admin email address');
      return;
    }
    if (!pin.trim()) {
      setError('Please enter your passcode');
      return;
    }

    setSubmitting(true);
    login(email.trim(), pin)
      .then(() => {
        setError('');
        saveEmail(email.trim());
        onLoginSuccess();
      })
      .catch((err) => {
        setError(err.message || 'Login failed. Please try again.');
        setPin('');
      })
      .finally(() => setSubmitting(false));
  }

  function handleKeypad(digit) {
    if (pin.length < 8) {
      setPin((prev) => prev + digit);
      setError('');
    }
  }

  function handleBackspace() {
    setPin((prev) => prev.slice(0, -1));
    setError('');
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
          <ChairIcon />
        </div>
        <h2 id="adminLoginTitle" className="admin-login-title">Admin Access</h2>
        <p className="admin-login-sub">Sign in with the admin email and passcode to manage orders, products and categories.</p>

        <form onSubmit={handleSubmit} className="admin-login-form">
          <input
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setError('');
            }}
            placeholder="Admin email"
            autoComplete="username"
            autoFocus={!email}
            className={`admin-email-input${error ? ' has-error' : ''}`}
            aria-label="Admin email"
          />
          <div className="admin-pin-display">
            <input
              type="password"
              value={pin}
              onChange={(e) => {
                setPin(e.target.value.replace(/[^0-9]/g, ''));
                setError('');
              }}
              placeholder="Passcode"
              maxLength={8}
              autoFocus={Boolean(email)}
              autoComplete="current-password"
              inputMode="numeric"
              className={`admin-pin-input${error ? ' has-error' : ''}`}
              aria-label="Passcode"
            />
          </div>

          {error && <div className="admin-login-error">{error}</div>}

          <div className="admin-keypad">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
              <button key={n} type="button" className="admin-keypad-btn" onClick={() => handleKeypad(String(n))}>
                {n}
              </button>
            ))}
            <button type="button" className="admin-keypad-btn admin-keypad-clear" onClick={() => setPin('')}>
              C
            </button>
            <button key={0} type="button" className="admin-keypad-btn" onClick={() => handleKeypad('0')}>
              0
            </button>
            <button type="button" className="admin-keypad-btn admin-keypad-back" onClick={handleBackspace} aria-label="Backspace">
              ⌫
            </button>
          </div>

          <div className="admin-login-actions">
            <button type="submit" className="btn-primary" disabled={submitting} style={{ width: '100%', justifyContent: 'center' }}>
              Unlock Catalog Manager
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
