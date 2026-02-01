import React from "react";
import { Outlet, NavLink, useParams } from "react-router-dom";

import "./FinancialsLayout.css";

const FinancialsPage = () => {
  const { fundId } = useParams();

  return (
    <div className="financials-page">
      <main className="financials-content">
        <h1 className="financials-title">Financials</h1>

        <div className="financials-tabs">
          <NavLink
            to="pnl"
            end
            className={({ isActive }) => `tab ${isActive ? "active" : ""}`}
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

        {/* Child route renders here (PnLTab or LimitsTab) */}
        <Outlet context={{ fundId }} />
      </main>
    </div>
  );
};

export default FinancialsPage;
