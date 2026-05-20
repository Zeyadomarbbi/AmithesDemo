// ProfileTab.jsx
import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useAuth } from '../../../../../../hooks/Auth/AuthContext';
import SimpleDropdown from '../../../../../../components/SearchBar/SimpleDropdown/SimpleDropdown.jsx';
import DateInputWithPicker from '../../../../../../components/DateComponents/DateInput.jsx';
import Toast from '../../../../components/Toast/Toast.jsx';
import '../ProfileSettings.shared.css';

const toLocalDateString = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

// Generate an exhaustive list of timezones dynamically using Intl API
const generateTimezones = () => {
  try {
    const timezones = Intl.supportedValuesOf('timeZone');
    return timezones.map((tz) => {
      // Calculate offset dynamically for the current date
      const date = new Date();
      const tzString = date.toLocaleString('en-US', { timeZone: tz, timeZoneName: 'shortOffset' });
      const offsetMatch = tzString.match(/(GMT[+-]\d{1,2}(?::\d{2})?)/);
      const rawOffset = offsetMatch ? offsetMatch[1].replace('GMT', 'UTC') : 'UTC+00:00';
      
      // Format offset to ensure consistent UTC±XX:XX format
      let formattedOffset = rawOffset;
      if (rawOffset === 'UTC') {
        formattedOffset = 'UTC±00:00';
      } else if (!rawOffset.includes(':')) {
        formattedOffset = `${rawOffset}:00`;
      }

      // Prettify the display name (e.g., "America/New_York" -> "New York")
      const cityName = tz.split('/').pop().replace(/_/g, ' ');

      return {
        id: tz,
        name: formattedOffset,
        offset: `(${formattedOffset}) ${cityName} - ${tz}`,
        sortKey: parseInt(formattedOffset.replace('UTC', '').replace('±', '0').replace('+', '').replace(':', ''), 10) || 0
      };
    }).sort((a, b) => a.sortKey - b.sortKey);
  } catch (e) {
    // Fallback if Intl API fails
    return [
      { id: 'UTC', name: 'UTC', offset: 'Universal Time Coordinated' }
    ];
  }
};

const TIMEZONE_OPTIONS = generateTimezones();

function ProfileTab() {
  const { user, countries = [] } = useOutletContext();
  const { updateUser, updateProfile } = useAuth();

  const [form, setForm] = useState({
    first_name: user?.first_name          || '',
    last_name:  user?.last_name           || '',
    username:   user?.username            || '',
    title:      user?.profile?.title      || '',
    birthday:   user?.profile?.birthday   ? new Date(user.profile.birthday) : null,
    country:    user?.profile?.country_id || null,
    timezone:   user?.profile?.timezone   || Intl.DateTimeFormat().resolvedOptions().timeZone, // Default to local timezone
  });

  const [saving, setSaving] = useState(false);
  const [toast,  setToast]  = useState(null);

  useEffect(() => {
    if (user) {
      setForm({
        first_name: user.first_name          || '',
        last_name:  user.last_name           || '',
        username:   user.username            || '',
        title:      user.profile?.title      || '',
        birthday:   user.profile?.birthday   ? new Date(user.profile.birthday) : null,
        country:    user.profile?.country_id || null,
        timezone:   user.profile?.timezone   || Intl.DateTimeFormat().resolvedOptions().timeZone,
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
              <SimpleDropdown
                options={formattedCountries}
                value={form.country}
                onChange={(val) => setForm(prev => ({ ...prev, country: val }))}
                placeholder="Select a country"
                labelKey="name"
                valueKey="id"
                isSearchBar={true}
              />
            </div>
          </div>

          {/* Row 4 — Timezone (full width) */}
          <div className="up-field">
            <label className="up-label">Timezone</label>
            <SimpleDropdown
              options={TIMEZONE_OPTIONS}
              value={form.timezone}
              onChange={(val) => setForm(prev => ({ ...prev, timezone: val }))}
              placeholder="Select a timezone"
              labelKey="offset" // Using offset as label so it shows the full "(UTC±XX:XX) City" in the dropdown
              valueKey="id"
              isSearchBar={true}
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