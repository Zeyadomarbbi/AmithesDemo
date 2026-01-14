import React from 'react';
import { Outlet, useLocation } from 'react-router-dom'; 
import { useFundData } from '../hooks/useFundData.js'; // Adjust path to where you saved the hook
import SidePanel from './SidePanel/SidePanel';
import Header from './Header/Header';

import './AppLayout.css';

function AppLayout() {
  const location = useLocation();
  const showHeader = location.pathname.startsWith('/funds/');

  // 1. Fetch dynamic funds using the global hook
  // We ignore isLoading here so the layout renders immediately (SidePanel can handle empty lists gracefully)
  const { funds } = useFundData();

  return (
    <div className="app-layout">
      {/* 2. Pass dynamic funds to SidePanel */}
      <SidePanel funds={funds} />
      
      <div className="right-column">
        {/* 3. Pass dynamic funds to Header */}
        {showHeader && <Header funds={funds} />}
        
        <main className="main-content">
          {/* 4. Pass funds context to children (optional, if children don't fetch themselves) */}
          <Outlet context={{ funds }} />
        </main>
      </div>
    </div>
  );
}

export default AppLayout;