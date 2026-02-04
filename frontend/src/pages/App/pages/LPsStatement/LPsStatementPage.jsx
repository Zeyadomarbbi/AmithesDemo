import React from "react";
import { Outlet, useParams, NavLink, useLocation, Navigate } from "react-router-dom";
import "./LPsStatementPage.css";

const TABS = [
  { label: "LPs Register", path: "lps-register" },
  { label: "Capital flows", path: "capital-flows" },
  { label: "Capital Account Statement", path: "capital-account-statement" },
  { label: "Limits", path: "lps-limits" },
];

export default function LPsStatementPage() {
  const { fundId } = useParams();
  const location = useLocation();

  if (location.pathname.endsWith('/lps-statement') || location.pathname.endsWith('/lps-statement/')) {
    return <Navigate to="lps-register" replace />;
  }

  return (
    <div className="lp-page">
      <div className="lp-page-container">
        
        {/* --- HEADER & TABS --- */}
        <div className="lp-page-header">
          <h1 className="lp-page-title">LPs Statement</h1>
          <div className="lp-page-tabs-container">
            <div className="lp-page-tabs">
              {TABS.map((tab) => (
                <NavLink
                  key={tab.path}
                  to={tab.path}
                  className={({ isActive }) => 
                    `lp-page-tab ${isActive ? "lp-page-tab--active" : ""}`
                  }
                >
                  {tab.label}
                </NavLink>
              ))}
            </div>
          </div>
        </div>

        {/* --- CONTENT AREA --- */}
        <div className="lp-page-content-area">
          <Outlet context={{ fundId }} />
        </div>
        
      </div>
    </div>
  );
}