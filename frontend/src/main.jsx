import React from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider, Navigate, Outlet } from 'react-router-dom';
import { FundProvider } from './pages/App/hooks/Core/FundContext.jsx';
import FundSetupGuard from './pages/App/hooks/Core/FundSetupGuard'; // <--- Import your Guard
import './index.css';

// --- AUTH ---
import LoginPage from './pages/Auth/Login/LoginPage';

// --- APP LAYOUT ---
import AppLayout from './pages/App/components/AppLayout'; 

// --- PAGES ---
import AllFundsPage from './pages/App/pages/All Funds/AllFundsPage';
import AdminsPage from './pages/App/pages/Admins/AdminsPage';
import HelpPage from './pages/App/pages/Help/HelpPage';

// --- DASHBOARD COMPONENTS ---
import DashboardPage from './pages/App/pages/Dashboard/DashboardPage';
import KPIDashboard from './pages/App/pages/Dashboard/components/KPIDashboard/KPIDashboard';
import LimitsDashboard from './pages/App/pages/Dashboard/components/LimitsDashboard/LimitsDashboard';

// --- LPs STATEMENT COMPONENT ---
import LPsStatementPage from './pages/App/pages/LPsStatement/LPsStatementPage.jsx';
import CapitalAccountStatement from './pages/App/pages/LPsStatement/components/CapitalAccountStatement/CapitalAccountStatement';
import CapitalFlows from './pages/App/pages/LPsStatement/components/CapitalFlows/CapitalFlows.jsx';
import Limits from './pages/App/pages/LPsStatement/components/Limits/Limits.jsx';
import LPsRegister from './pages/App/pages/LPsStatement/components/LPsRegister/LPsRegister.jsx';

// --- FINANCIALS COMPONENTS ---
import FinancialsPage from './pages/App/pages/Financials/FinancialsPage';
import PnLTab from "./pages/App/pages/Financials/components/PnLTab/PnLTab.jsx";
import LimitsTab from "./pages/App/pages/Financials/components/limitstab/LimitsTab.jsx";

// --- SETTINGS COMPONENTS ---
import SettingsPage from './pages/App/pages/Settings/SettingsPage';
import FundIdentity from './pages/App/pages/Settings/components/FundIdentity/FundIdentity';
import ManagementFees from './pages/App/pages/Settings/components/ManagementFees/ManagementFees';
import ShareClasses from './pages/App/pages/Settings/components/ShareClasses/ShareClasses';
import WaterfallStructure from './pages/App/pages/Settings/components/WaterfallStructure/WaterfallStructure';

// --- PORTFOLIO COMPONENTS ---
import PortfolioPage from './pages/App/pages/Portfolio/PortfolioPage';
import PortfolioSummaryTab from "./pages/App/pages/Portfolio/components/Summary/PortfolioSummaryTab";
import PortfolioFxTab from "./pages/App/pages/Portfolio/components/FX/PortfolioFxTab";
import PortfolioLimitsTab from "./pages/App/pages/Portfolio/components/Limits/PortfolioLimitsTab";
import PortfolioCompareTab from "./pages/App/pages/Portfolio/components/Compare/PortfolioCompareTab";
import CompareDetailPanel from "./pages/App/pages/Portfolio/components/Compare/CompareDetailPanel";

// --- SCENARIO COMPONENTS ---
import ScenariosPage from './pages/App/pages/Scenario/ScenariosPage';
import ScenarioList from './pages/App/pages/Scenario/components/ScenarioList/ScenarioList.jsx';
import ScenarioDetailPage from './pages/App/pages/Scenario/components/ScenarioList/Details/ScenarioDetailPage';
import SynthesisList from './pages/App/pages/Scenario/components/SynthesisList/SynthesisList.jsx';
import SynthesisDetailsDrawer from './pages/App/pages/Scenario/components/SynthesisList/Details/SynthesisDetailsDrawer';


const router = createBrowserRouter([
  { path: '/', element: <Navigate to="/login" replace /> },
  { path: '/login', element: <LoginPage /> },

  // === APP DOMAIN ===
  {
    path: '/', 
    element: <AppLayout />, 
    children: [
      { path: 'all-funds', element: <AllFundsPage /> },
      { path: 'admins', element: <AdminsPage /> },
      { path: 'help', element: <HelpPage /> },

      // 2. FUND SPECIFIC PAGES
      {
        path: 'funds/:fundId',
        // Wrap children in the Guard so it applies to ALL fund-specific modules
        element: <FundSetupGuard><Outlet /></FundSetupGuard>, 
        children: [
          { 
            path: 'settings', 
            element: <SettingsPage />, 
            children: [
                { index: true, element: <Navigate to="fund-identity" replace /> },
                { path: 'fund-identity', element: <FundIdentity /> },
                { path: 'share-classes', element: <ShareClasses /> },
                { path: 'waterfall-structure', element: <WaterfallStructure /> },
                { path: 'management-fees', element: <ManagementFees /> },
            ]
          },
          { path: 'lps-statement', 
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
                path: 'scenario-details/:scenarioId/:tab?', 
                element: <ScenarioDetailPage /> 
              },
              { 
                path: 'synthesis-details/:synthesisId', 
                element: <SynthesisDetailsDrawer /> 
              }
            ], 
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
              { path: 'compare/:positionId', element: <CompareDetailPanel /> },
            ],
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
    ],
  },
]);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <FundProvider>
      <RouterProvider router={router} />
    </FundProvider>
  </React.StrictMode>
);