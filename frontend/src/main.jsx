import React from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import './index.css'; 

// --- AUTH ---
import LoginPage from './pages/Auth/Login/LoginPage';

// --- APP LAYOUT (Moved) ---
import AppLayout from './pages/App/components/AppLayout'; 

// --- APP PAGES (Moved) ---
import DashboardPage from './pages/App/pages/Dashboard/DashboardPage';
import ScenariosPage from './pages/App/pages/Scenario/ScenariosPage';
import ScenarioDetailPage from './pages/App/pages/Scenario/components/ScenarioList/ScenarioDetailPage/ScenarioDetailPage';
import PortfolioPage from './pages/App/pages/Portfolio/PortfolioPage';
import LPsStatementPage from './pages/App/pages/LPsStatement/LPsStatementPage';
import FinancialsPage from './pages/App/pages/Financials/FinancialsPage';
import AllFundsPage from './pages/App/pages/All Funds/AllFundsPage';
import AdminsPage from './pages/App/pages/Admins/AdminsPage';
import HelpPage from './pages/App/pages/Help/HelpPage';
import SettingsPage from './pages/App/pages/Settings/SettingsPage';

const router = createBrowserRouter([
  { path: '/', element: <Navigate to="/auth/login" replace /> },
  { path: '/auth/login', element: <LoginPage /> },

  // === APP DOMAIN ===
  {
    path: '/', 
    element: <AppLayout />, // Layout wraps both Funds and Global pages
    children: [
      // 1. GLOBAL PAGES (No Fund ID in URL)
      { path: 'allfunds', element: <AllFundsPage /> },
      { path: 'admins', element: <AdminsPage /> },
      { path: 'help', element: <HelpPage /> },

      // 2. FUND SPECIFIC PAGES
      {
        path: 'funds/:fundId',
        children: [
          { path: 'settings', element: <SettingsPage /> },
          { path: 'dashboard', element: <DashboardPage /> },
          { path: 'scenarios', element: <ScenariosPage /> },
          { path: 'scenarios/:scenarioId', element: <ScenarioDetailPage /> },
          { path: 'portfolio', element: <PortfolioPage /> },
          { path: 'lps-statement', element: <LPsStatementPage /> },
          { path: 'financials', element: <FinancialsPage /> },
        ]
      }
    ],
  },
]);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);