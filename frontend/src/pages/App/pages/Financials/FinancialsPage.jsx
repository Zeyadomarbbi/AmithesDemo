import React from "react";
import { Outlet, NavLink, useParams } from "react-router-dom";
import "./FinancialsPage.css";

const FinancialsPage = () => {
  const { fundId } = useParams();

  return (
    <div className="financials-page">
      <div className="financials-page-container">
        {/* 1. Header Row */}
        <div className="financials-page-header">
          <h1 className="financials-page-title">Financials</h1>
        </div>

        {/* 2. Tabs Row */}
        <div className="financials-page-tabs">
          <NavLink
            to="pnl"
            end
            className={({ isActive }) => `financials-page-tab ${isActive ? "active" : ""}`}
          >
            P&amp;L
          </NavLink>

          <NavLink
            to="limits"
            className={({ isActive }) => `financials-page-tab ${isActive ? "active" : ""}`}
          >
            Limits
          </NavLink>
        </div>

        {/* 3. Content Area */}
        <div className="financials-page-content-area">
          <Outlet context={{ fundId }} />
        </div>
      </div>
    </div>
  );
};

export default FinancialsPage;