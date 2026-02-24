// PortfolioPage.jsx
import { Outlet, NavLink, useParams } from 'react-router-dom';
import { usePortfolioDataset } from "./usePortfolioDataset";
import "./styles/portfolio.tokens.css";
import "./PortfolioPage.css";
import "./styles/portfolio.tables.css";

const PortfolioPage = () => {
  const { fundId } = useParams();
  const portfolioDataset = usePortfolioDataset(fundId);

  return (
    <div className="portfolio-page">
      <main className="portfolio-content">
        <h1 className="portfolio-title">Portfolio</h1>

        {/* Tabs */}
        <div className="portfolio-tabs">
          <NavLink to="summary" className="portfolio-tabs-tab">
            Portfolio summary
          </NavLink>
          <NavLink to="fx" className="portfolio-tabs-tab">
            Portfolio FX
          </NavLink>
          <NavLink to="limits" className="portfolio-tabs-tab">
            Limits
          </NavLink>
          <NavLink to="compare" className="portfolio-tabs-tab">
            Compare
          </NavLink>
        </div>

        {/* Routed content */}
        <Outlet context={{ fundId, portfolioDataset }} />
      </main>
    </div>
  );
};

export default PortfolioPage;
