import React from "react";
import { useLocation, Outlet, useParams, NavLink, Navigate } from "react-router-dom";
import "./SettingsPage.css";

const TABS = [
  { label: "Fund Identity", path: "fund-identity" },
  { label: "Share Classes", path: "share-classes" },
  { label: "Waterfall Structure", path: "waterfall-structure" },
  { label: "Management fees", path: "management-fees" },
];

const SettingsPage = () => {
  const location = useLocation();
  const { fundId } = useParams();

  // Redirect to first tab if on root settings path
  if (location.pathname.endsWith('/settings') || location.pathname.endsWith('/settings/')) {
    return <Navigate to="fund-identity" replace />;
  }

  return (
    <div className="fund-settings-page">
      <div className="fund-settings-container">
        
        {/* --- HEADER & TABS --- */}
        <div className="fund-settings-header">
          <h1 className="fund-settings-title">Fund Setup</h1>
          <div className="fund-settings-tabs-container">
            <div className="fund-settings-tabs">
              {TABS.map((tab) => (
                <NavLink
                  key={tab.path}
                  to={tab.path}
                  className={({ isActive }) => 
                    `fund-settings-tab ${isActive ? "fund-settings-tab--active" : ""}`
                  }
                >
                  {tab.label}
                </NavLink>
              ))}
            </div>
          </div>
        </div>

        {/* --- CONTENT AREA --- */}
        <div className="fund-settings-content-area">
          {/* We pass 'fundId' via context so child components (Outlet) can access it.
             Alternatively, child components can use useParams() directly.
          */}
          <Outlet context={{ fundId }} />
        </div>

        {/* --- NO FOOTER --- */}
        {/* The "Save" buttons are now located inside specific components:
           1. FundIdentity.jsx (has its own Save button)
           2. NewShareClassDrawer.jsx (has its own Save button)
        */}
        
      </div>
    </div>
  );
};

export default SettingsPage;