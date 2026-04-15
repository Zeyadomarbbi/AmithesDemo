// frontend/src/pages/App/AppLayout.jsx
import React from 'react';
import { Outlet, useLocation } from 'react-router-dom'; 
import { useAuth } from '../../../hooks/Auth/AuthContext';
import SidePanel from './SidePanel/SidePanel';
import Header from './Header/Header';
import './AppLayout.css';

function AppLayout() {
  const { isViewer } = useAuth();
  const location = useLocation();
  const showHeader = location.pathname.startsWith('/funds/');

  return (
    <div className={`app-layout ${isViewer ? 'mode-viewer' : ''}`}>
      <div className="sidebar-wrapper">
        <SidePanel />
      </div>
      <div className="right-column">
        <Header className={showHeader ? '' : 'hidden'} />
        <main className="main-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default AppLayout;