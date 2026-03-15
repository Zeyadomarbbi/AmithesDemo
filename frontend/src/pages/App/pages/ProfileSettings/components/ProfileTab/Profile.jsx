// ProfileTab.jsx
import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useAuth } from '../../../../../../hooks/Auth/AuthContext';
import SearchableSelect from '../../../../../../components/SearchBar/SearchableSelect.jsx';
import DateInputWithPicker from '../../../../../../components/DateComponents/DateInput.jsx';
import './Profile.css';

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

function ProfileTab() {
  const { user, countries = [] } = useOutletContext();
  const { updateUser, updateProfile } = useAuth();

  const [form, setForm] = useState({
    first_name: user?.first_name || '',
    last_name:  user?.last_name  || '',
    username:   user?.username   || '',
    title:      user?.profile?.title    || '',
    birthday:   user?.profile?.birthday ? new Date(user.profile.birthday) : null,
    country:    user?.profile?.country  || null,
    timezone:   user?.profile?.timezone || 'UTC+00:00',
  });

  const [saving, setSaving] = useState(false);
  const [saved,  setSaved]  = useState(false);
  const [error,  setError]  = useState('');

  useEffect(() => {
    if (user) {
      setForm({
        first_name: user.first_name || '',
        last_name:  user.last_name  || '',
        username:   user.username   || '',
        title:      user.profile?.title    || '',
        birthday:   user.profile?.birthday ? new Date(user.profile.birthday) : null,
        country:    user.profile?.country  || null,
        timezone:   user.profile?.timezone || 'UTC+00:00',
      });
    }
  }, [user]);

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setSaved(false);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    setError('');
  console.log('--- Profile Submit Payload ---');
  console.log('updateUser payload:', {
    first_name: form.first_name,
    last_name:  form.last_name,
    username:   form.username,
  });
  console.log('updateProfile payload:', {
    title:    form.title,
    birthday: form.birthday ? form.birthday.toISOString().split('T')[0] : null,
    country:  form.country,
    timezone: form.timezone,
  });
  console.log('form.country raw value:', form.country);
  console.log('countries[0] sample:', countries[0]);
    try {
      await updateUser({
        first_name: form.first_name,
        last_name:  form.last_name,
        username:   form.username,
      });

      await updateProfile({
        title:    form.title,
        birthday: form.birthday
          ? form.birthday.toISOString().split('T')[0]
          : null,
        country:  form.country,
        timezone: form.timezone,
      });

      setSaved(true);
    } catch (err) {
      const msg = err?.response?.data
        ? Object.values(err.response.data).flat().join(' ')
        : 'Failed to save. Please try again.';
      setError(msg);
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
    <div className="settings-tab-container">
      <div className="profile-tab-body">

        {/* Avatar */}
        <div className="profile-avatar-block">
          <div className="profile-avatar-circle">{getInitials()}</div>
          <div className="profile-avatar-meta">
            <span className="profile-avatar-label">Profile picture</span>
            <span className="profile-avatar-hint">Avatar is generated from your initials.</span>
          </div>
        </div>

        <form className="settings-form" onSubmit={handleSubmit}>

          {/* Row 1 — First name / Last name */}
          <div className="settings-form-row">
            <div className="settings-field">
              <label className="settings-label">First name</label>
              <input
                className="settings-input"
                name="first_name"
                value={form.first_name}
                onChange={handleChange}
                placeholder="First name"
              />
            </div>
            <div className="settings-field">
              <label className="settings-label">Last name</label>
              <input
                className="settings-input"
                name="last_name"
                value={form.last_name}
                onChange={handleChange}
                placeholder="Last name"
              />
            </div>
          </div>

          {/* Row 2 — Title / Birthday */}
          <div className="settings-form-row">
            <div className="settings-field">
              <label className="settings-label">Representative title</label>
              <input
                className="settings-input"
                name="title"
                value={form.title}
                onChange={handleChange}
                placeholder="e.g. Investment Manager"
              />
            </div>
            <div className="settings-field">
              <label className="settings-label">Birthday</label>
              <DateInputWithPicker
                initialDate={form.birthday || new Date()}
                onDateChange={(date) => {
                  setForm(prev => ({ ...prev, birthday: date }));
                  setSaved(false);
                }}
                isSingle={true}
                dateFormat="DD/MM/YYYY"
              />
            </div>
          </div>

          {/* Row 3 — Country (half width) */}
          <div className="settings-form-row">
            <div className="settings-field">
              <label className="settings-label">Country</label>
                <SearchableSelect
                  options={formattedCountries}
                  value={form.country}
                  onChange={(val) => {
                    setForm(prev => ({ ...prev, country: val }));
                    setSaved(false);
                  }}
                  placeholder="Select a country"
                  labelKey="name"
                  valueKey="id"
                  secondaryLabelKey="code"
                  triggerClassName="settings-input"
                />
            </div>
          </div>

          {/* Row 4 — Timezone (full width) */}
          <div className="settings-field">
            <label className="settings-label">Timezone</label>
            <SearchableSelect
              options={TIMEZONE_OPTIONS}
              value={form.timezone}
              onChange={(val) => {
                setForm(prev => ({ ...prev, timezone: val }));
                setSaved(false);
              }}
              placeholder="Select a timezone"
              labelKey="name"
              valueKey="id"
              secondaryLabelKey="offset"
              triggerClassName="settings-input"
            />
          </div>

          {/* Row 5 — Username (full width) */}
          <div className="settings-field">
            <label className="settings-label">Username</label>
            <input
              className="settings-input"
              name="username"
              value={form.username}
              onChange={handleChange}
              placeholder="username"
            />
          </div>

          {error && <p className="settings-error">{error}</p>}

          <div className="settings-form-actions">
            {saved && <span className="settings-saved-badge">Saved</span>}
            <button
              type="submit"
              className="settings-save-btn"
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Update profile'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}

export default ProfileTab;