// PortfolioPage.jsx
import { Outlet, NavLink, useParams } from 'react-router-dom';
import { TimeframeProvider } from '../../hooks/Core/TimeframeContext';
import { useCountries } from "../../hooks/Reference/useCountries";
import { useCurrencies } from "../../hooks/Reference/useCurrencies";
import { usePortfolio} from "../../hooks/Portfolio/usePortfolio";
import { usePortfolioDataset } from "./usePortfolioDataset";

import "./styles/portfolio.tokens.css";
import "./PortfolioPage.css";
import "./styles/portfolio.tables.css";

const PortfolioPage = () => {
  const { fundId } = useParams();
  const { countries = [] } = useCountries();
  const { currencies = [] } = useCurrencies();
  const dataset = usePortfolioDataset(fundId);

  const portfolioDataset = {
    investments: (dataset.investments || []).map((inv) => {
      const investmentId = Number(inv.investment_id ?? inv.id ?? inv.investmentId);
      const transactionFlows = dataset.flowsByInvestment?.[investmentId] ?? inv.transaction_flows ?? [];
      const fairValueFlows = dataset.fairValuesByInvestment?.[investmentId] ?? inv.fair_value_flows ?? [];

      return {
        ...inv,
        transaction_flows: transactionFlows.filter((f) => f.scenario_id === null),
        fair_value_flows: fairValueFlows,
      };
    }),
    isLoading: dataset.isLoading,
    error: dataset.error,
    loadedAt: dataset.loadedAt,
    refresh: dataset.refresh,
    fetchInvestments: dataset.fetchInvestments,
    fetchInvestment: dataset.fetchInvestment,
    createInvestment: dataset.createInvestment,
    updateInvestment: dataset.updateInvestment,
    deleteInvestment: dataset.deleteInvestment,
    saveFlow: dataset.saveFlow,
    deleteFlow: dataset.deleteFlow,
    saveFairValue: dataset.saveFairValue,
    fetchTransactionTypes: dataset.fetchTransactionTypes,
  };
  return (
    <TimeframeProvider fundId={fundId}>
      <div className="portfolio-page">
        <div className="portfolio-page-container">
          {/* 1. Header Row */}
          <div className="portfolio-page-header">
            <h1 className="portfolio-page-title">Portfolio</h1>
          </div>

          {/* 2. Tabs Row */}
          <div className="portfolio-page-tabs">
            <NavLink 
              to="summary" 
              className={({ isActive }) => `portfolio-page-tab ${isActive ? "active" : ""}`}
            >
              Portfolio Summary
            </NavLink>
            <NavLink 
              to="fx" 
              className={({ isActive }) => `portfolio-page-tab ${isActive ? "active" : ""}`}
            >
              Portfolio FX
            </NavLink>
            <NavLink 
              to="compare" 
              className={({ isActive }) => `portfolio-page-tab ${isActive ? "active" : ""}`}
            >
              Compare
            </NavLink>
            <NavLink 
              to="limits" 
              className={({ isActive }) => `portfolio-page-tab ${isActive ? "active" : ""}`}
            >
              Limits
            </NavLink>
          </div>

          {/* 3. Content Area */}
          <div className="portfolio-page-content-area">
            <Outlet context={{ fundId, portfolioDataset, countries, currencies }} />
          </div>
        </div>
      </div>
    </TimeframeProvider>
  );
};

export default PortfolioPage;
