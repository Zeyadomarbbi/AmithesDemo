// in: frontend/src/components/SidePanel.jsx

import React from 'react';

// This is just a placeholder to make the import work.
// We will add the links later.
function SidePanel() {
  return (
    <div className="side-panel">
      {/* We'll use a placeholder style in App.css */}
      <p>Side Panel</p>
      
      {/* Your links will go here */}
      <ul>
        <li>Dashboard</li>
        <li>LPs Statement</li>
        <li>Portfolio</li>
        <li>Financials</li>
        <li>Scenarios (Active)</li>
      </ul>
    </div>
  );
}

export default SidePanel;