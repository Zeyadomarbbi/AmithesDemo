// NotificationsTab.jsx
import React, { useState } from 'react';
import '../ProfileSettings.shared.css';
import './Notifications.css';

const NOTIFICATION_ITEMS = [
  { id: 'fund_updates',    label: 'Fund updates',    desc: 'Get notified when fund data changes.' },
  { id: 'scenario_alerts', label: 'Scenario alerts', desc: 'Alerts when a scenario finishes processing.' },
  { id: 'limit_breaches',  label: 'Limit breaches',  desc: 'Alerts when a portfolio limit is exceeded.' },
  { id: 'security',        label: 'Security alerts', desc: 'Login from new device or suspicious activity.' },
  { id: 'product_updates', label: 'Product updates', desc: 'New features and platform release notes.' },
  { id: 'reports',         label: 'Reports ready',   desc: 'Notified when a report is generated.' },
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

function NotificationsTab() {
  const [prefs, setPrefs] = useState(() =>
    Object.fromEntries(NOTIFICATION_ITEMS.map(item => [item.id, false]))
  );

  const toggle = (id) => {
    setPrefs(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="up-container">
      <div className="notif-grid">
        {NOTIFICATION_ITEMS.map(item => (
          <div
            key={item.id}
            className={`notif-card ${prefs[item.id] ? 'active' : ''}`}
            onClick={() => toggle(item.id)}
          >
            <Toggle checked={prefs[item.id]} onChange={() => toggle(item.id)} />
            <div className="notif-card-text">
              <span className="notif-card-title">{item.label}</span>
              <span className="notif-card-desc">{item.desc}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default NotificationsTab;