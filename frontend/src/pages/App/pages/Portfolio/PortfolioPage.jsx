// PortfolioPage.jsx
import { useEffect } from 'react';
import { Outlet, NavLink, useParams } from 'react-router-dom';
import { usePortfolio } from "../../hooks/Portfolio/usePortfolio"; // Adjust path to your clean hook
import { TimeframeProvider } from '../../hooks/Core/TimeframeContext';

import "./styles/portfolio.tokens.css";
import "./PortfolioPage.css";
import "./styles/portfolio.tables.css";

const PortfolioPage = () => {
  const { fundId } = useParams();
  
  // Use the clean, standardized API hook
  const { investments, loading, fetchInvestments } = usePortfolio(fundId);

  // Auto-fetch when the portfolio layout mounts
  useEffect(() => {
    if (fundId) {
      fetchInvestments();
    }
  }, [fundId, fetchInvestments]);

  // Bridge the data shape so the downstream tabs don't need any changes
  const portfolioDataset = {
    investments: investments.map((inv) => ({
      ...inv,
      transaction_flows: (inv.transaction_flows ?? []).filter((f) => f.scenario_id === null),
      fair_value_flows: inv.fair_value_flows ?? [],
    })),
    isLoading: loading,
    refresh: fetchInvestments,
  };

  return (
    <TimeframeProvider fundId={fundId}>
      <div className="portfolio-page">
        <main className="portfolio-content">
          <h1 className="portfolio-title">Portfolio</h1>
          <div className="portfolio-tabs">
            <NavLink to="summary" className="portfolio-tabs-tab">Portfolio Summary</NavLink>
            <NavLink to="fx" className="portfolio-tabs-tab">Portfolio FX</NavLink>
            <NavLink to="limits" className="portfolio-tabs-tab">Limits</NavLink>
            <NavLink to="compare" className="portfolio-tabs-tab">Compare</NavLink>
          </div>
          <Outlet context={{ fundId, portfolioDataset }} />
        </main>
      </div>
    </TimeframeProvider>
  );
};

export default PortfolioPage;