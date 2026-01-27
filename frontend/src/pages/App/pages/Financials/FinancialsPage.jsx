import React from "react";
import { Outlet, NavLink, useParams } from "react-router-dom"; // Removed useLocation, Navigate

import "./FinancialsLayout.css";

const FinancialsPage = () => {
  const { fundId } = useParams();

  // REMOVED: Manual redirect logic. The Router handles this via 'index: true'.

  return (
    <div className="financials-page">
      <main className="financials-content">
        <h1 className="financials-title">Financials</h1>

        <div className="financials-tabs">
          <NavLink
            to="pnl"
            className={({ isActive }) => `tab ${isActive ? "active" : ""}`}
            end
          >
            P&amp;L
          </NavLink>

          <NavLink
            to="limits"
            className={({ isActive }) => `tab ${isActive ? "active" : ""}`}
          >
            Limits
          </NavLink>
        </div>

        {/* This renders the child route (PnLTab or LimitsTab) */}
        <Outlet context={{ fundId }} />
      </main>
    </div>
  );
};

export default FinancialsPage;