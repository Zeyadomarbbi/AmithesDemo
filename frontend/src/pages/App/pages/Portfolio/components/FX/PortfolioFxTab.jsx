import React, { useState } from "react";
import { useOutletContext } from 'react-router-dom';
import FxDealsView from "./components/Deals/FxDealsView";
import FxPortfolioView from "./components/Portfolio/FxPortfolioView";
import FxChartsView from "./components/Charts/FxChartsView";
import "./PortfolioFxTab.css";

const PortfolioFxTab = () => {
  const { fundId } = useOutletContext();
  const [fxBreakdown, setFxBreakdown] = useState("deals");

  const views = {
    deals: <FxDealsView fundId={fundId} />, // Pass fundId here
    portfolio: <FxPortfolioView fundId={fundId} />,
    charts: <FxChartsView fundId={fundId} />
  };

  return (
    <div className="fx-tab-container">
      <div className="fx-breakdown-row">
        <span className="fx-breakdown-label">Breakdown :</span>
        <div className="fx-breakdown-controls">
          {["deals", "portfolio", "charts"].map((type) => (
            <button
              key={type}
              className={`fx-breakdown-pill ${fxBreakdown === type ? "active" : ""}`}
              onClick={() => setFxBreakdown(type)}
            >
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </button>
          ))}
        </div>
      </div>
      <div className="fx-view-content">
        {views[fxBreakdown]}
      </div>
    </div>
  );
};

export default PortfolioFxTab;