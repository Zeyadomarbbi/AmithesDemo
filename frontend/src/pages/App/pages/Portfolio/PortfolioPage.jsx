// PortfolioPage.jsx
import { Outlet, NavLink, useParams } from 'react-router-dom';
import { TimeframeProvider } from '../../hooks/Core/TimeframeContext';
import { usePortfolioDataset } from "./usePortfolioDataset";
import { useCountries } from "../../hooks/Reference/useCountries";
import { useCurrencies } from "../../hooks/Reference/useCurrencies";
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
    refreshInvestment: async (investmentId) => {
      await dataset.refresh();
      const refreshedId = Number(investmentId);
      return (dataset.investments || []).find((inv) => {
        const id = Number(inv.investment_id ?? inv.id ?? inv.investmentId);
        return id === refreshedId;
      }) || null;
    },
    hasLoaded: Boolean(dataset.loadedAt),
  };
  return (
    <TimeframeProvider fundId={fundId}>
      <div className="portfolio-page">
        <main className="portfolio-content">
          <h1 className="portfolio-title">Portfolio</h1>
          <div className="portfolio-tabs">
            <NavLink to="summary" className="portfolio-tabs-tab">Portfolio Summary</NavLink>
            <NavLink to="fx" className="portfolio-tabs-tab">Portfolio FX</NavLink>
            <NavLink to="compare" className="portfolio-tabs-tab">Compare</NavLink>
            <NavLink to="limits" className="portfolio-tabs-tab">Limits</NavLink>
          </div>
          <Outlet context={{ fundId, portfolioDataset, countries, currencies }} />
        </main>
      </div>
    </TimeframeProvider>
  );
};

export default PortfolioPage;
