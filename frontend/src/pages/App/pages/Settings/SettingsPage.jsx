import React from "react";
import { useLocation, Outlet, useParams, NavLink, Navigate } from "react-router-dom";
import { useFundDetails } from '../../hooks/useFundDetails.js';
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
  
  // High-level data fetching shared by all tabs
  const { fund, isFundLoading, error } = useFundDetails(fundId);

  // Auto-redirect to fund-identity if path is exactly /settings
  if (location.pathname.endsWith('/settings') || location.pathname.endsWith('/settings/')) {
    return <Navigate to="fund-identity" replace />;
  }

  if (isFundLoading) return <div className="settings-loader">Loading Fund Details...</div>;
  if (error) return <div className="settings-error">Error: {error}</div>;

  return (
    <div className="settings-page">
      <div className="settings-container">
        <h1 className="settings-title">Fund Setup — {fund?.legal_name}</h1>

        <div className="settings-tabs">
          {TABS.map((tab) => (
            <NavLink
              key={tab.path}
              to={tab.path}
              className={({ isActive }) => 
                "settings-tab" + (isActive ? " settings-tab--active" : "")
              }
            >
              {tab.label}
            </NavLink>
          ))}
        </div>

        <div className="settings-content-area">
          {/* Outlet provides the fetched fund object to any child tab */}
          <Outlet context={{ fund, fundId }} />
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;