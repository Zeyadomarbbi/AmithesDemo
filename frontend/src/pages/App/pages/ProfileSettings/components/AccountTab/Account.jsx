// AccountTab.jsx
import React, { useState } from 'react';
import { useAuth } from '../../../../../../hooks/Auth/AuthContext';
import './Account.css';

function Account() {
  const { user } = useAuth();

  const [emailForm, setEmailForm]     = useState({ email: user?.email || '' });
  const [passwordForm, setPasswordForm] = useState({ current: '', next: '', confirm: '' });
  const [emailSaved, setEmailSaved]   = useState(false);
  const [pwSaved, setPwSaved]         = useState(false);
  const [pwError, setPwError]         = useState('');

  const handleEmailChange  = (e) => { setEmailForm({ email: e.target.value }); setEmailSaved(false); };
  const handlePasswordChange = (e) => {
    setPasswordForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setPwSaved(false);
    setPwError('');
  };

  const handleEmailSubmit = (e) => {
    e.preventDefault();
    // wire to API
    setEmailSaved(true);
  };

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    if (passwordForm.next !== passwordForm.confirm) {
      setPwError('Passwords do not match.');
      return;
    }
    // wire to API
    setPwSaved(true);
    setPasswordForm({ current: '', next: '', confirm: '' });
  };

  return (
    <div className="settings-tab-container">

      {/* Email */}
      <div className="settings-section">
        <h2 className="settings-section-title">Email address</h2>
        <p className="settings-section-desc">Your login email. Changing it will require re-verification.</p>
        <form className="settings-form" onSubmit={handleEmailSubmit}>
          <div className="settings-field">
            <label className="settings-label">Email</label>
            <input
              className="settings-input"
              type="email"
              name="email"
              value={emailForm.email}
              onChange={handleEmailChange}
              placeholder="you@example.com"
            />
          </div>
          <div className="settings-form-actions">
            {emailSaved && <span className="settings-saved-badge">Saved</span>}
            <button type="submit" className="settings-save-btn">Update email</button>
          </div>
        </form>
      </div>

      <div className="settings-divider" />

      {/* Password */}
      <div className="settings-section">
        <h2 className="settings-section-title">Password</h2>
        <p className="settings-section-desc">Use a strong password you don't reuse elsewhere.</p>
        <form className="settings-form" onSubmit={handlePasswordSubmit}>
          <div className="settings-field">
            <label className="settings-label">Current password</label>
            <input
              className="settings-input"
              type="password"
              name="current"
              value={passwordForm.current}
              onChange={handlePasswordChange}
              placeholder="••••••••"
            />
          </div>
          <div className="settings-form-row">
            <div className="settings-field">
              <label className="settings-label">New password</label>
              <input
                className="settings-input"
                type="password"
                name="next"
                value={passwordForm.next}
                onChange={handlePasswordChange}
                placeholder="••••••••"
              />
            </div>
            <div className="settings-field">
              <label className="settings-label">Confirm new password</label>
              <input
                className="settings-input"
                type="password"
                name="confirm"
                value={passwordForm.confirm}
                onChange={handlePasswordChange}
                placeholder="••••••••"
              />
            </div>
          </div>
          {pwError && <p className="settings-error">{pwError}</p>}
          <div className="settings-form-actions">
            {pwSaved && <span className="settings-saved-badge">Password updated</span>}
            <button type="submit" className="settings-save-btn">Update password</button>
          </div>
        </form>
      </div>

      <div className="settings-divider" />

      {/* Danger zone */}
      <div className="settings-section">
        <h2 className="settings-section-title danger-title">Danger zone</h2>
        <p className="settings-section-desc">Permanently delete your account and all associated data. This cannot be undone.</p>
        <button className="settings-danger-btn">Delete account</button>
      </div>

    </div>
  );
}

export default Account;