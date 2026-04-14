import { useEffect } from 'react';
import { Outlet, NavLink, useParams } from 'react-router-dom';
import { TimeframeProvider } from '../../hooks/Core/TimeframeContext';
import { useCountries } from "../../hooks/Reference/useCountries";
import { useCurrencies } from "../../hooks/Reference/useCurrencies";
import { usePortfolio } from "../../hooks/Portfolio/usePortfolio";

import "./styles/portfolio.tokens.css";
import "./styles/portfolio.tables.css";
import "./PortfolioPage.css";

const PortfolioPage = () => {
  const { fundId } = useParams();
  const { countries } = useCountries();
  const { currencies } = useCurrencies();
  const portfolio = usePortfolio(fundId);

  useEffect(() => {
    if (fundId) {
      portfolio.fetchInvestments();
    }
  }, [fundId, portfolio.fetchInvestments]);

  return (
    <TimeframeProvider fundId={fundId}>
      <div className="portfolio-page">
        <div className="portfolio-page-container">
          <div className="portfolio-page-header">
            <h1 className="portfolio-page-title">Portfolio</h1>
          </div>
          <div className="portfolio-page-tabs">
            <NavLink to="summary" className={({ isActive }) => `portfolio-page-tab ${isActive ? "active" : ""}`}>
              Portfolio Summary
            </NavLink>
            <NavLink to="fx" className={({ isActive }) => `portfolio-page-tab ${isActive ? "active" : ""}`}>
              Portfolio FX
            </NavLink>
            <NavLink to="compare" className={({ isActive }) => `portfolio-page-tab ${isActive ? "active" : ""}`}>
              Compare
            </NavLink>
            <NavLink to="limits" className={({ isActive }) => `portfolio-page-tab ${isActive ? "active" : ""}`}>
              Limits
            </NavLink>
          </div>
          <div className="portfolio-page-content-area">
            <Outlet context={{ fundId, portfolio, countries, currencies }} />
          </div>
        </div>
      </div>
    </TimeframeProvider>
  );
};

export default PortfolioPage;