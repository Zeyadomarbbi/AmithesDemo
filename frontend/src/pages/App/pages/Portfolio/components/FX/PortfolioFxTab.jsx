import React, { useMemo, useState } from "react";
import { useOutletContext } from 'react-router-dom';
import { useFundData } from "../../../../hooks/Core/FundContext";
import { FX_DEALS_DATA } from "../../portfolioData";
import { useFxDealsRows, useFxDealsTimeframes } from "./FXbackwork";
import FxDealsView from "./components/Deals/FxDealsView";
import FxPortfolioView from "./components/Portfolio/FxPortfolioView";
import FxChartsView from "./components/Charts/FxChartsView";
import "./PortfolioFxTab.css";

const PortfolioFxTab = () => {
  const { fundId } = useOutletContext();
  const { funds, isLoading: isFundsLoading } = useFundData();
  const [fxBreakdown, setFxBreakdown] = useState("deals");
  const timeframesState = useFxDealsTimeframes(fundId);
  const fallbackInvestments = useMemo(
    () => FX_DEALS_DATA[fundId] || FX_DEALS_DATA[Number(fundId)] || [],
    [fundId]
  );
  const { investments: dealsInvestments, isLoading: isDealsLoading } =
    useFxDealsRows(fundId, timeframesState.quarters, fallbackInvestments);

  const currentFund = funds.find((f) => String(f.id) === String(fundId));
  const symbol = currentFund?.currencySymbol || "EUR";

  const shared = {
    ...timeframesState,
    dealsInvestments,
    isDealsLoading,
    symbol,
    isFundsLoading,
  };

  const views = {
    deals: <FxDealsView fundId={fundId} shared={shared} />,
    portfolio: <FxPortfolioView fundId={fundId} shared={shared} />,
    charts: <FxChartsView fundId={fundId} shared={shared} />
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
