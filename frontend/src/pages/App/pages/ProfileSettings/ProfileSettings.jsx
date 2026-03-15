// ProfileSettings.jsx
import React from 'react';
import { Outlet, useNavigate, useMatch } from 'react-router-dom';
import { useAuth } from '../../../../hooks/Auth/AuthContext';
import { useCountries } from '../../hooks/Reference/useCountries';
import { PageSpinner } from '../../../../components/LoadingScreens/LoadingScreens';
import './ProfileSettings.css';

const TABS = [
  { label: 'Profile',       path: 'profile' },
  { label: 'Account',       path: 'account' },
  { label: 'Notifications', path: 'notifications' },
];

function ProfileSettings() {
  const navigate = useNavigate();
  const { user, loading: userLoading } = useAuth();
  const { countries = [], isLoading: countriesLoading } = useCountries();

  const isProfile       = useMatch('/settings/profile/profile');
  const isAccount       = useMatch('/settings/profile/account');
  const isNotifications = useMatch('/settings/profile/notifications');

  const activeMap = {
    profile:       !!isProfile,
    account:       !!isAccount,
    notifications: !!isNotifications,
  };

  if (userLoading || countriesLoading) {
    return <PageSpinner />;
  }

  return (
    <div className="profile-settings-page">

      <div className="profile-settings-header">
        <h1 className="profile-settings-title">Settings</h1>
      </div>

      <div className="profile-settings-tabs">
        {TABS.map(tab => (
          <button
            key={tab.path}
            className={`profile-settings-tab-item ${activeMap[tab.path] ? 'active' : ''}`}
            onClick={() => navigate(tab.path)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="profile-settings-content">
        <Outlet context={{ user, countries }} />
      </div>
    </div>
  );
}

export default ProfileSettings;