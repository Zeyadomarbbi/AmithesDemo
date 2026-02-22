import React from "react";
import FundCard from "./FundCard";

export default function FundList({ 
  funds = [], 
  onCardClick, 
  fundKpisByFundId = {},
  casKpisByFundId = {} 
}) {
  return (
    <div className="funds-grid">
      {funds.map((fund) => (
        <FundCard
          key={fund.id}
          fund={fund}
          fundKpi={fundKpisByFundId[String(fund.id)]}
          casKpi={casKpisByFundId[String(fund.id)]}
          clickable
          onClick={() => onCardClick?.(fund.id)}
        />
      ))}
    </div>
  );
}