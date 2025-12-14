import React from 'react';
import { Outlet, useLocation } from 'react-router-dom'; 
import SidePanel from './SidePanel/SidePanel';
import Header from './Header/Header';

import './AppLayout.css';

function AppLayout() {
  const location = useLocation();
  const showHeader = location.pathname.startsWith('/funds/');
  const funds = [
    { id: 1, name: 'Asterium Fund I', code: 'AST' },
    { id: 2, name: 'Lynx Capital II', code: 'LYN' },
    { id: 3, name: 'Orion Partners III', code: 'ORI' },
    { id: 4, name: 'Silvergate Ventures', code: 'SIL' },
    { id: 5, name: 'Huron Growth Fund', code: 'HUR' },
    { id: 6, name: 'Pioneer Equity I', code: 'PIO' },
  ];

  return (
    <div className="app-layout">
      <SidePanel funds={funds} />
      
      <div className="right-column">
        {showHeader && <Header funds={funds} />}
        <main className="main-content">
          <Outlet context={{ funds }} />
        </main>
      </div>
    </div>
  );
}

export default AppLayout;