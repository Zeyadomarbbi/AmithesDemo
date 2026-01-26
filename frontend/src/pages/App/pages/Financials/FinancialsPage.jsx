// frontend/src/pages/App/pages/Financials/FinancialsPage.jsx
import React from "react";
import { NavLink, Outlet } from "react-router-dom";
import "./FinancialsLayout.css";

const FinancialsPage = () => {
  return (
    <div className="financials-page">
      <main className="financials-content">
        <h1 className="financials-title">Financials</h1>

        {/* TABS Navigation (real links) */}
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

        {/* Child routes render here */}
        <Outlet />
      </main>
    </div>
  );
};

export default FinancialsPage;
