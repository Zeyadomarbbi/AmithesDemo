import React from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider, Navigate, Outlet } from 'react-router-dom';

/* --- CONTEXTS & GUARDS --- */
import { AuthProvider } from './hooks/Auth/AuthContext.jsx'; // Path to your new AuthContext
import ProtectedRoute from './hooks/Auth/ProtectedRoute'; // Path to your new ProtectedRoute
import { FundProvider } from './pages/App/hooks/Core/FundContext.jsx';
import FundSetupGuard from './pages/App/hooks/Core/FundSetupGuard';
import { PermissionGate } from "./hooks/Auth/PermissionGate.jsx";
import { StaffRoute } from './hooks/Auth/StaffRoute.jsx';
/* --- AUTH --- */
import LoginPage from './pages/Auth/Login/LoginPage';

/* --- APP LAYOUT --- */
import AppLayout from './pages/App/components/AppLayout'; 

/* --- PAGES --- */
import AllFundsPage from './pages/App/pages/All Funds/AllFundsPage';
import AdminsPage from './pages/App/pages/Admins/AdminsPage';
import HelpPage from './pages/App/pages/Help/HelpPage';

/* --- DASHBOARD --- */
import DashboardPage from './pages/App/pages/Dashboard/DashboardPage';
import KPIDashboard from './pages/App/pages/Dashboard/components/KPIDashboard/KPIDashboard';
import LimitsDashboard from './pages/App/pages/Dashboard/components/LimitsDashboard/LimitsDashboard';

/* --- LPs STATEMENT --- */
import LPsStatementPage from './pages/App/pages/LPsStatement/LPsStatementPage.jsx';
import CapitalAccountStatement from './pages/App/pages/LPsStatement/components/CapitalAccountStatement/CapitalAccountStatement';
import CapitalFlows from './pages/App/pages/LPsStatement/components/CapitalFlows/CapitalFlows.jsx';
import Limits from './pages/App/pages/LPsStatement/components/Limits/Limits.jsx';
import LPsRegister from './pages/App/pages/LPsStatement/components/LPsRegister/LPsRegister.jsx';

/* --- DEALFLOW --- */
import DealflowPage from './pages/App/pages/DealFlow/Dealflowpage';

/* --- FINANCIALS --- */
import FinancialsPage from './pages/App/pages/Financials/FinancialsPage';
import PnLTab from "./pages/App/pages/Financials/components/PnLTab/PnLTab.jsx";
import LimitsTab from "./pages/App/pages/Financials/components/limitstab/LimitsTab.jsx";

/* --- SETTINGS --- */
import SettingsPage from './pages/App/pages/Settings/SettingsPage';
import FundIdentity from './pages/App/pages/Settings/components/FundIdentity/FundIdentity';
import ManagementFees from './pages/App/pages/Settings/components/ManagementFees/ManagementFees';
import ShareClasses from './pages/App/pages/Settings/components/ShareClasses/ShareClasses';
import WaterfallStructure from './pages/App/pages/Settings/components/WaterfallStructure/WaterfallStructure';

/* --- PORTFOLIO --- */
import PortfolioPage from './pages/App/pages/Portfolio/PortfolioPage';
import PortfolioSummaryTab from "./pages/App/pages/Portfolio/components/Summary/PortfolioSummaryTab";
import PortfolioFxTab from "./pages/App/pages/Portfolio/components/FX/PortfolioFxTab";
import PortfolioLimitsTab from "./pages/App/pages/Portfolio/components/Limits/PortfolioLimitsTab";
import PortfolioCompareTab from "./pages/App/pages/Portfolio/components/Compare/PortfolioCompareTab";

/* --- SCENARIOS --- */
import ScenariosPage from './pages/App/pages/Scenario/ScenariosPage';
import ScenarioDetailPage from './pages/App/pages/Scenario/components/ScenarioList/Details/ScenarioDetailPage';
import SynthesisDetailsDrawer from './pages/App/pages/Scenario/components/SynthesisList/Details/SynthesisDetailsDrawer';

import ProfileSettings  from './pages/App/pages/ProfileSettings/ProfileSettings';
import Profile       from './pages/App/pages/ProfileSettings/components/ProfileTab/Profile';
import Account       from './pages/App/pages/ProfileSettings/components/AccountTab/Account';
import Notifications from './pages/App/pages/ProfileSettings/components/NotificationsTab/Notifications';

import './index.css';

const router = createBrowserRouter([
  // Public Routes
  { path: '/', element: <Navigate to="/login" replace /> },
  { path: '/login', element: <LoginPage /> },

  // === PROTECTED APP DOMAIN ===
  {
    element: <ProtectedRoute />, // 1. STOPS UNAUTHENTICATED USERS HERE
    children: [
      {
        element: <FundProvider><Outlet /></FundProvider>, // 2. ONLY FETCHES FUNDS IF LOGGED IN
        children: [
          {
            path: '/', 
            element: <AppLayout />, 
            children: [
              { path: 'all-funds', element: <AllFundsPage /> },
              {
                element: <StaffRoute />,
                children: [
                  { path: 'admins', element: <AdminsPage /> }
                ]
              },
              { path: 'help', element: <HelpPage /> },
              {
                path: 'settings/profile',
                element: <ProfileSettings />,
                children: [
                  { index: true,            element: <Navigate to="profile" replace /> },
                  { path: 'profile',        element: <Profile /> },
                  { path: 'account',        element: <Account /> },
                  { path: 'notifications',  element: <Notifications /> },
                ],
              },
              // --- FUND SPECIFIC DOMAIN ---
              {
                path: 'funds/:fundId',
                element: <FundSetupGuard><Outlet /></FundSetupGuard>, 
                children: [
                  { 
                    path: 'settings', 
                    element: (
                      <PermissionGate fallback={<Navigate to=".." replace />}>
                        <SettingsPage />
                      </PermissionGate>
                    ), 
                    children: [
                        { index: true, element: <Navigate to="fund-identity" replace /> },
                        { path: 'fund-identity', element: <FundIdentity /> },
                        { path: 'share-classes', element: <ShareClasses /> },
                        { path: 'waterfall-structure', element: <WaterfallStructure /> },
                        { path: 'management-fees', element: <ManagementFees /> },
                    ]
                  },
                  { 
                    path: 'lps-statement', 
                    element: <LPsStatementPage />,
                    children: [
                      { index: true, element: <Navigate to="lps-register" replace /> },
                      { path: 'lps-register', element: <LPsRegister /> },
                      { path: 'capital-flows', element: <CapitalFlows /> },
                      { path: 'capital-account-statement', element: <CapitalAccountStatement /> },
                      { path: 'lps-limits', element: <Limits /> },
                    ]
                  },
                  {
                    path: 'dashboard',
                    element: <DashboardPage />,
                    children: [
                      { index: true, element: <Navigate to="kpi" replace /> },
                      { path: 'kpi', element: <KPIDashboard /> },
                      { path: 'kpi/:timeframeId', element: <KPIDashboard /> },
                      { path: 'limits', element: <LimitsDashboard /> },
                    ]
                  },
                  { 
                    path: 'scenario-dashboard', 
                    element: <ScenariosPage />,
                    children: [
                      { 
                        path: 'synthesis-details/:synthesisId', 
                        element: <SynthesisDetailsDrawer /> 
                      }
                    ]
                  },
                  {
                    path: 'portfolio',
                    element: <PortfolioPage />,
                    children: [
                      { index: true, element: <Navigate to="summary" replace /> },
                      { path: 'summary', element: <PortfolioSummaryTab /> },
                      { path: 'fx', element: <PortfolioFxTab /> },
                      { path: 'limits', element: <PortfolioLimitsTab /> },
                      { path: 'compare', element: <PortfolioCompareTab /> },
                    ],
                  },
                  {
                    path: 'dealflow',
                    element: <DealflowPage />,
                  },
                  {
                    path: "financials",
                    element: <FinancialsPage />,
                    children: [
                      { index: true, element: <Navigate to="pnl" replace /> },
                      { path: "pnl", element: <PnLTab /> },
                      { path: "limits", element: <LimitsTab /> },
                    ],
                  },
                ]
              }
            ]
          },
          // Special case: Full page scenario details outside AppLayout sidebar
          {
            path: '/funds/:fundId/scenario-dashboard/scenario-details/:scenarioId/:tab?',
            element: (
              <FundSetupGuard>
                <ScenarioDetailPage />
              </FundSetupGuard>
            )
          }
        ]
      }
    ]
  }
]);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      {/* ⚠️ FundProvider removed from here. It is now safely inside the Protected Route above! */}
      <RouterProvider router={router} />
    </AuthProvider>
  </React.StrictMode>
);