import React from 'react';
import { useFundData } from '../../hooks/Core/FundContext';
import { useActiveFund } from '../../hooks/useActiveFund';
import { useCurrencies } from "../../hooks/Reference/useCurrencies";
import './Header.css';

function Header() {
  const { funds } = useFundData();
  const activeFundId = useActiveFund();
  const { currencies, isLoading } = useCurrencies();

  const currentFund = funds.find(f => f.id.toString() === activeFundId?.toString());
  
  if (!currentFund || isLoading) {
    return <header className="top-header"></header>;
  }

  const currentCurrency = currencies?.find(c => c.id === currentFund.currencyId);

  return (
    <header className="top-header">
      <div className="header-text-container">
        <div className="header-row-primary">
          <span className="header-fund-name">
            {currentFund.name} <span className="header-fund-shortname">({currentFund.shortName})</span>
          </span>
        </div>
        
        {currentCurrency && (
          <div className="header-row-secondary">
            <span className="header-currency-info">
              {currentCurrency.name} ({currentCurrency.code} — {currentCurrency.symbol})
            </span>
          </div>
        )}
      </div>
    </header>
  );
}

export default Header;