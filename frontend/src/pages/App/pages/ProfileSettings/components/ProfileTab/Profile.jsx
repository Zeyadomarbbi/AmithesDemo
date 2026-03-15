// ProfileTab.jsx
import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useAuth } from '../../../../../../hooks/Auth/AuthContext';
import SearchableSelect from '../../../../../../components/SearchBar/SearchableSelect.jsx';
import DateInputWithPicker from '../../../../../../components/DateComponents/DateInput.jsx';
import Toast from '../../../../components/Toast/Toast.jsx';
import '../ProfileSettings.shared.css';

const TIMEZONE_OPTIONS = [
  { id: 'UTC-12:00', name: 'UTC−12:00', offset: '(UTC−12:00) Baker Island' },
  { id: 'UTC-11:00', name: 'UTC−11:00', offset: '(UTC−11:00) Niue, Samoa' },
  { id: 'UTC-10:00', name: 'UTC−10:00', offset: '(UTC−10:00) Hawaii' },
  { id: 'UTC-09:00', name: 'UTC−09:00', offset: '(UTC−09:00) Alaska' },
  { id: 'UTC-08:00', name: 'UTC−08:00', offset: '(UTC−08:00) Pacific Time (US)' },
  { id: 'UTC-07:00', name: 'UTC−07:00', offset: '(UTC−07:00) Mountain Time (US)' },
  { id: 'UTC-06:00', name: 'UTC−06:00', offset: '(UTC−06:00) Central Time (US)' },
  { id: 'UTC-05:00', name: 'UTC−05:00', offset: '(UTC−05:00) Eastern Time (US)' },
  { id: 'UTC-04:00', name: 'UTC−04:00', offset: '(UTC−04:00) Atlantic Time, Caracas' },
  { id: 'UTC-03:00', name: 'UTC−03:00', offset: '(UTC−03:00) São Paulo, Buenos Aires' },
  { id: 'UTC-02:00', name: 'UTC−02:00', offset: '(UTC−02:00) Mid-Atlantic' },
  { id: 'UTC-01:00', name: 'UTC−01:00', offset: '(UTC−01:00) Azores, Cape Verde' },
  { id: 'UTC+00:00', name: 'UTC±00:00', offset: '(UTC±00:00) London, Dublin, Lisbon' },
  { id: 'UTC+01:00', name: 'UTC+01:00', offset: '(UTC+01:00) Paris, Berlin, Rome, Cairo' },
  { id: 'UTC+02:00', name: 'UTC+02:00', offset: '(UTC+02:00) Athens, Johannesburg' },
  { id: 'UTC+03:00', name: 'UTC+03:00', offset: '(UTC+03:00) Moscow, Nairobi, Riyadh' },
  { id: 'UTC+04:00', name: 'UTC+04:00', offset: '(UTC+04:00) Dubai, Baku' },
  { id: 'UTC+05:00', name: 'UTC+05:00', offset: '(UTC+05:00) Karachi, Tashkent' },
  { id: 'UTC+05:30', name: 'UTC+05:30', offset: '(UTC+05:30) Mumbai, Kolkata' },
  { id: 'UTC+06:00', name: 'UTC+06:00', offset: '(UTC+06:00) Dhaka, Almaty' },
  { id: 'UTC+07:00', name: 'UTC+07:00', offset: '(UTC+07:00) Bangkok, Jakarta' },
  { id: 'UTC+08:00', name: 'UTC+08:00', offset: '(UTC+08:00) Beijing, Singapore, Perth' },
  { id: 'UTC+09:00', name: 'UTC+09:00', offset: '(UTC+09:00) Tokyo, Seoul' },
  { id: 'UTC+09:30', name: 'UTC+09:30', offset: '(UTC+09:30) Adelaide, Darwin' },
  { id: 'UTC+10:00', name: 'UTC+10:00', offset: '(UTC+10:00) Sydney, Melbourne' },
  { id: 'UTC+11:00', name: 'UTC+11:00', offset: '(UTC+11:00) Solomon Islands' },
  { id: 'UTC+12:00', name: 'UTC+12:00', offset: '(UTC+12:00) Auckland, Fiji' },
];

const toLocalDateString = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

function ProfileTab() {
  const { user, countries = [] } = useOutletContext();
  const { updateUser, updateProfile } = useAuth();

  const [form, setForm] = useState({
    first_name: user?.first_name           || '',
    last_name:  user?.last_name            || '',
    username:   user?.username             || '',
    title:      user?.profile?.title       || '',
    birthday:   user?.profile?.birthday    ? new Date(user.profile.birthday) : null,
    country:    user?.profile?.country_id  || null,
    timezone:   user?.profile?.timezone    || 'UTC+00:00',
  });

  const [saving, setSaving] = useState(false);
  const [toast,  setToast]  = useState(null);

  useEffect(() => {
    if (user) {
      setForm({
        first_name: user.first_name           || '',
        last_name:  user.last_name            || '',
        username:   user.username             || '',
        title:      user.profile?.title       || '',
        birthday:   user.profile?.birthday    ? new Date(user.profile.birthday) : null,
        country:    user.profile?.country_id  || null,
        timezone:   user.profile?.timezone    || 'UTC+00:00',
      });
    }
  }, [user]);

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      await updateUser({
        first_name: form.first_name,
        last_name:  form.last_name,
        username:   form.username,
      });

      await updateProfile({
        title:    form.title,
        birthday: form.birthday ? toLocalDateString(form.birthday) : null,
        country:  form.country,
        timezone: form.timezone,
      });

      setToast({ type: 'success', title: 'Profile updated', message: 'Your changes have been saved.' });
    } catch (err) {
      const msg = err?.response?.data
        ? Object.values(err.response.data).flat().join(' ')
        : 'Failed to save. Please try again.';
      setToast({ type: 'error', title: 'Update failed', message: msg });
    } finally {
      setSaving(false);
    }
  };

  const getInitials = () => {
    const parts = [form.first_name, form.last_name].filter(Boolean);
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    if (form.username) return form.username[0].toUpperCase();
    return 'U';
  };

  const formattedCountries = countries.map(c => ({
    ...c,
    name: c.name || '',
    code: c.iso2 || '',
  }));

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

      <div className="up-body">

        {/* Avatar */}
        <div className="up-avatar-block">
          <div className="up-avatar-circle">{getInitials()}</div>
          <div className="up-avatar-meta">
            <span className="up-avatar-label">Profile picture</span>
            <span className="up-avatar-hint">Avatar is generated from your initials.</span>
          </div>
        </div>

        <form className="up-form" onSubmit={handleSubmit}>

          {/* Row 1 — First name / Last name */}
          <div className="up-form-row">
            <div className="up-field">
              <label className="up-label">First name</label>
              <input className="up-input" name="first_name" value={form.first_name} onChange={handleChange} placeholder="First name" />
            </div>
            <div className="up-field">
              <label className="up-label">Last name</label>
              <input className="up-input" name="last_name" value={form.last_name} onChange={handleChange} placeholder="Last name" />
            </div>
          </div>

          {/* Row 2 — Title / Birthday */}
          <div className="up-form-row">
            <div className="up-field">
              <label className="up-label">Representative title</label>
              <input className="up-input" name="title" value={form.title} onChange={handleChange} placeholder="e.g. Investment Manager" />
            </div>
            <div className="up-field">
              <label className="up-label">Birthday</label>
              <DateInputWithPicker
                initialDate={form.birthday || new Date()}
                onDateChange={(date) => setForm(prev => ({ ...prev, birthday: date }))}
                isSingle={true}
                dateFormat="DD/MM/YYYY"
              />
            </div>
          </div>

          {/* Row 3 — Country (half width) */}
          <div className="up-form-row">
            <div className="up-field">
              <label className="up-label">Country</label>
              <SearchableSelect
                options={formattedCountries}
                value={form.country}
                onChange={(val) => setForm(prev => ({ ...prev, country: val }))}
                placeholder="Select a country"
                labelKey="name"
                valueKey="id"
                secondaryLabelKey="code"
                triggerClassName="up-input"
              />
            </div>
          </div>

          {/* Row 4 — Timezone (full width) */}
          <div className="up-field">
            <label className="up-label">Timezone</label>
            <SearchableSelect
              options={TIMEZONE_OPTIONS}
              value={form.timezone}
              onChange={(val) => setForm(prev => ({ ...prev, timezone: val }))}
              placeholder="Select a timezone"
              labelKey="name"
              valueKey="id"
              secondaryLabelKey="offset"
              triggerClassName="up-input"
            />
          </div>

          {/* Row 5 — Username (full width) */}
          <div className="up-field">
            <label className="up-label">Username</label>
            <input className="up-input" name="username" value={form.username} onChange={handleChange} placeholder="username" />
          </div>

          <div className="up-form-actions">
            <button type="submit" className="up-save-btn" disabled={saving}>
              {saving ? 'Saving...' : 'Update profile'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}

export default ProfileTab;