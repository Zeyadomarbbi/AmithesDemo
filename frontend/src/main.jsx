import React from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import './index.css'; 

import RootLayout from './components/RootLayout';
import ScenariosPage from './pages/Scenario/ScenariosPage';
import DashboardPage from './pages/Dashboard/DashboardPage';
import PortfolioPage from './pages/Portfolio/PortfolioPage';
import FinancialsPage from './pages/Financials/FinancialsPage';
import LPsStatementPage from './pages/LPsStatement/LPsStatementPage';
import ScenarioDetailPage from './pages/Scenario/components/ScenarioList/ScenarioDetailPage/ScenarioDetailPage';
// ... (import your other pages)

const router = createBrowserRouter([
  {
    path: '/',
    // Redirect the base URL to a default fund (e.g., fund 1)
    element: <Navigate to="/funds/1/dashboard" replace />,
  },
  {
    // This is the new dynamic parent route.
    // :fundId can be 1, 2, 3, or any ID.
    path: '/funds/:fundId',
    element: <RootLayout />, // The layout will now be aware of the fundId
    children: [
      {
        path: 'dashboard', // Matches /funds/1/dashboard
        element: <DashboardPage />,
      },
      {
        path: 'scenarios', // Matches /funds/1/scenarios
        element: <ScenariosPage />,
      },
      {
        path: 'scenarios/:scenarioId', // Matches /funds/1/scenarios/123
        element: <ScenarioDetailPage />,
      },
      {
        path: 'portfolio', // Matches /funds/1/portfolio
        element: <PortfolioPage />,
      },
      {
        path: 'lps-statement', // Renders at /portfolio
        element: <LPsStatementPage />,
      },
            {
        path: 'financials', // Renders at /portfolio
        element: <FinancialsPage />,
      },
    ],
  },
]);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);