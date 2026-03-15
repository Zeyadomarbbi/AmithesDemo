// NotificationsTab.jsx
import React, { useState } from 'react';
import './Notifications.css';

const NOTIFICATION_GROUPS = [
  {
    group: 'Activity',
    items: [
      { id: 'fund_updates',    label: 'Fund updates',         desc: 'Changes to fund data, settings, or documents.' },
      { id: 'scenario_alerts', label: 'Scenario alerts',      desc: 'Notifications when a scenario finishes processing.' },
      { id: 'limit_breaches',  label: 'Limit breaches',       desc: 'Alerts when a portfolio or LP limit is exceeded.' },
    ],
  },
  {
    group: 'System',
    items: [
      { id: 'security',        label: 'Security alerts',      desc: 'Login from new device or suspicious activity.' },
      { id: 'product_updates', label: 'Product updates',      desc: 'New features and platform release notes.' },
    ],
  },
];

function Toggle({ checked, onChange }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      className={`notif-toggle ${checked ? 'on' : 'off'}`}
      onClick={onChange}
    >
      <span className="notif-toggle-thumb" />
    </button>
  );
}

function Notifications() {
  const [prefs, setPrefs] = useState(() => {
    const initial = {};
    NOTIFICATION_GROUPS.forEach(g => g.items.forEach(item => {
      initial[item.id] = { email: true, inApp: true };
    }));
    return initial;
  });

  const [saved, setSaved] = useState(false);

  const toggle = (id, channel) => {
    setPrefs(prev => ({
      ...prev,
      [id]: { ...prev[id], [channel]: !prev[id][channel] },
    }));
    setSaved(false);
  };

  const handleSave = () => {
    // wire to API
    setSaved(true);
  };

  return (
    <div className="settings-tab-container">
      <div className="settings-section">
        <h2 className="settings-section-title">Notifications</h2>
        <p className="settings-section-desc">Choose how and when you want to be notified.</p>
      </div>

      <div className="notif-table">
        <div className="notif-table-header">
          <span className="notif-col-label" />
          <span className="notif-col-channel">Email</span>
          <span className="notif-col-channel">In-app</span>
        </div>

        {NOTIFICATION_GROUPS.map(group => (
          <div key={group.group} className="notif-group">
            <div className="notif-group-label">{group.group}</div>
            {group.items.map(item => (
              <div key={item.id} className="notif-row">
                <div className="notif-row-info">
                  <span className="notif-row-title">{item.label}</span>
                  <span className="notif-row-desc">{item.desc}</span>
                </div>
                <div className="notif-col-channel">
                  <Toggle
                    checked={prefs[item.id].email}
                    onChange={() => toggle(item.id, 'email')}
                  />
                </div>
                <div className="notif-col-channel">
                  <Toggle
                    checked={prefs[item.id].inApp}
                    onChange={() => toggle(item.id, 'inApp')}
                  />
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>

      <div className="settings-form-actions" style={{ marginTop: '24px' }}>
        {saved && <span className="settings-saved-badge">Saved</span>}
        <button className="settings-save-btn" onClick={handleSave}>Save preferences</button>
      </div>
    </div>
  );
}

export default Notifications;