import React from 'react';
import { useParams } from 'react-router-dom';

function SettingsPage() {
  const { fundId } = useParams();

  return (
    <div className="settings-page">
      <h1>Fund Settings</h1>
      <p>Settings for Fund ID: {fundId}</p>
      {/* Add your settings form here later */}
    </div>
  );
}

export default SettingsPage;