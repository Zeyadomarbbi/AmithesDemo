import React from 'react';
import { Outlet } from 'react-router-dom';
import SidePanel from './SidePanel';
// No CSS import here!

function RootLayout() {
  return (
    // Make sure this says: className="app-layout"
    <div className="app-layout"> 
      <SidePanel />
      
      {/* Make sure this says: className="main-content" */}
      <main className="main-content">
        <Outlet /> 
      </main>
    </div>
  );
}

export default RootLayout;