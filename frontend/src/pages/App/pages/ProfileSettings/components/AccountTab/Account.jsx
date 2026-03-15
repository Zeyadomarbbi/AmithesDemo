// AccountTab.jsx
import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useAuth } from '../../../../../../hooks/Auth/AuthContext';
import Toast from '../../../../components/Toast/Toast.jsx';
import '../ProfileSettings.shared.css';
import './Account.css';

function AccountTab() {
  const { user } = useOutletContext();
  const { updateUser, updateProfile, changePassword, deleteUser } = useAuth();

  // ── Layer 1: Edit fields ──
  const [form, setForm] = useState({
    email:   user?.email   || '',
    phone:   user?.profile?.phone || '',
  });

  const [passwordForm, setPasswordForm] = useState({
    current: '',
    next:    '',
    confirm: '',
  });

  const [saving,   setSaving]   = useState(false);
  const [pwSaving, setPwSaving] = useState(false);
  const [toast,    setToast]    = useState(null);

  // ── Layer 2: 2FA ──
  const [twoFaEnabled, setTwoFaEnabled] = useState(user?.profile?.two_fa_enabled || false);
  const [twoFaSaving,  setTwoFaSaving]  = useState(false);

  // ── Layer 3: Delete ──
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting,      setDeleting]      = useState(false);

  const handleFormChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handlePasswordChange = (e) => {
    setPasswordForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  // ── Save email / phone ──
  const handleInfoSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateUser({ email: form.email });
      await updateProfile({ phone: form.phone });
      setToast({ type: 'success', title: 'Account updated', message: 'Email and phone saved.' });
    } catch (err) {
      const msg = err?.response?.data
        ? Object.values(err.response.data).flat().join(' ')
        : 'Failed to save.';
      setToast({ type: 'error', title: 'Update failed', message: msg });
    } finally {
      setSaving(false);
    }
  };

  // ── Save password ──
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (passwordForm.next !== passwordForm.confirm) {
      setToast({ type: 'error', title: 'Password mismatch', message: 'New passwords do not match.' });
      return;
    }
    setPwSaving(true);
    try {
      await changePassword(passwordForm.current, passwordForm.next);
      setPasswordForm({ current: '', next: '', confirm: '' });
      setToast({ type: 'success', title: 'Password updated', message: 'Your password has been changed.' });
    } catch (err) {
      const msg = err?.response?.data
        ? Object.values(err.response.data).flat().join(' ')
        : 'Failed to update password.';
      setToast({ type: 'error', title: 'Update failed', message: msg });
    } finally {
      setPwSaving(false);
    }
  };

  // ── Toggle 2FA ──
  const handle2FAToggle = async () => {
    setTwoFaSaving(true);
    try {
      const next = !twoFaEnabled;
      await updateProfile({ two_fa_enabled: next });
      setTwoFaEnabled(next);
      setToast({
        type: 'success',
        title: next ? '2FA enabled' : '2FA disabled',
        message: next
          ? 'Two-factor authentication is now active.'
          : 'Two-factor authentication has been turned off.',
      });
    } catch {
      setToast({ type: 'error', title: 'Failed', message: 'Could not update 2FA setting.' });
    } finally {
      setTwoFaSaving(false);
    }
  };

  // ── Delete account ──
  const handleDeleteConfirm = async () => {
    setDeleting(true);
    try {
      await deleteUser();
    } catch {
      setToast({ type: 'error', title: 'Delete failed', message: 'Could not delete account. Please try again.' });
      setDeleting(false);
      setConfirmDelete(false);
    }
  };

  return (
    <div className="up-container">

      {toast && (
        <Toast
          type={toast.type}
          title={toast.title}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}

      {/* ── Layer 1: Edit fields ── */}
      <div className="up-section">
        <h2 className="up-section-title">Account information</h2>
        <p className="up-section-desc">Update your email address and phone number.</p>
      </div>

      <form className="up-form" onSubmit={handleInfoSubmit}>
        <div className="up-form-row">
          <div className="up-field">
            <label className="up-label">Email address</label>
            <input
              className="up-input"
              type="email"
              name="email"
              value={form.email}
              onChange={handleFormChange}
              placeholder="you@example.com"
            />
          </div>
          <div className="up-field">
            <label className="up-label">Phone number</label>
            <input
              className="up-input"
              type="tel"
              name="phone"
              value={form.phone}
              onChange={handleFormChange}
              placeholder="+1 234 567 8900"
            />
          </div>
        </div>
        <div className="up-form-actions">
          <button type="submit" className="up-save-btn" disabled={saving}>
            {saving ? 'Saving...' : 'Update information'}
          </button>
        </div>
      </form>

      <div className="up-divider" />

      {/* Password */}
      <div className="up-section">
        <h2 className="up-section-title">Password</h2>
        <p className="up-section-desc">Use a strong password you don't reuse elsewhere.</p>
      </div>

      <form className="up-form" onSubmit={handlePasswordSubmit}>
        <div className="up-field">
          <label className="up-label">Current password</label>
          <input
            className="up-input"
            type="password"
            name="current"
            value={passwordForm.current}
            onChange={handlePasswordChange}
            placeholder="••••••••"
          />
        </div>
        <div className="up-form-row">
          <div className="up-field">
            <label className="up-label">New password</label>
            <input
              className="up-input"
              type="password"
              name="next"
              value={passwordForm.next}
              onChange={handlePasswordChange}
              placeholder="••••••••"
            />
          </div>
          <div className="up-field">
            <label className="up-label">Confirm new password</label>
            <input
              className="up-input"
              type="password"
              name="confirm"
              value={passwordForm.confirm}
              onChange={handlePasswordChange}
              placeholder="••••••••"
            />
          </div>
        </div>
        <div className="up-form-actions">
          <button type="submit" className="up-save-btn" disabled={pwSaving}>
            {pwSaving ? 'Saving...' : 'Update password'}
          </button>
        </div>
      </form>

      <div className="up-divider" />

      {/* ── Layer 2: 2FA block ── */}
      <div className="account-2fa-block">
        <div className="account-2fa-text">
          <p className="account-2fa-desc">
            Two-factor authentication (2FA) adds an extra layer of security to your account.
            This means you will need to enter your password and verification code when you log in.
          </p>
        </div>
        <button
          className={`account-2fa-btn ${twoFaEnabled ? 'enabled' : ''}`}
          onClick={handle2FAToggle}
          disabled={twoFaSaving}
        >
          {twoFaSaving
            ? 'Saving...'
            : twoFaEnabled
              ? 'Disable email 2FA'
              : 'Enable email 2FA'}
        </button>
      </div>

      <div className="up-divider" />

      {/* ── Layer 3: Delete account ── */}
      <div className="up-section">
        <h2 className="up-section-title up-danger-title">Danger zone</h2>
        <p className="up-section-desc">
          Permanently delete your account and all associated data. This cannot be undone.
        </p>
      </div>

      {!confirmDelete ? (
        <div>
          <button className="up-danger-btn" onClick={() => setConfirmDelete(true)}>
            Delete account
          </button>
        </div>
      ) : (
        <div className="account-delete-confirm">
          <p className="account-delete-warning">
            Are you sure? This will permanently delete your account and cannot be reversed.
          </p>
          <div className="account-delete-actions">
            <button
              className="up-save-btn"
              onClick={() => setConfirmDelete(false)}
              disabled={deleting}
            >
              Cancel
            </button>
            <button
              className="up-danger-btn"
              onClick={handleDeleteConfirm}
              disabled={deleting}
            >
              {deleting ? 'Deleting...' : 'Yes, delete my account'}
            </button>
          </div>
        </div>
      )}

    </div>
  );
}

export default AccountTab;