// frontend/src/components/AppLayout.jsx
import React from 'react';
import { Outlet, useLocation } from 'react-router-dom'; // 1. Import useLocation
import SidePanel from './SidePanel/SidePanel';
import Header from './Header/Header';

// Renamed from RootLayout
function AppLayout() {
  const location = useLocation();
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