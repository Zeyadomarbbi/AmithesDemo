// frontend/src/components/AppLayout.jsx
import React from 'react';
import { Outlet, useLocation } from 'react-router-dom'; // 1. Import useLocation
import SidePanel from './SidePanel/SidePanel';
import Header from './Header/Header';

// Renamed from RootLayout
function AppLayout() {
  const location = useLocation();

  // 2. Logic: Only show header if we are inside a specific fund
  // This returns true for "/funds/1/dashboard"
  // This returns false for "/admins", "/help", "/allfunds"
  const showHeader = location.pathname.startsWith('/funds/');

  return (
    <div className="app-layout">
      <SidePanel />
      
      <div className="right-column">
        
        {/* 3. Conditional Rendering */}
        {showHeader && <Header />}

        <main className="main-content">
          <Outlet /> 
        </main>
      </div>
    </div>
  );
}

export default AppLayout;