import React from "react";
import FundCard from "./FundCard";

export default function FundList({ 
  funds = [], 
  onCardClick, 
}) {
  return (
    <div className="funds-grid">
      {funds.map((fund) => (
        <FundCard
          key={fund.id}
          fund={fund}
          clickable
          onClick={() => onCardClick?.(fund.id)}
        />
      ))}
    </div>
  );
}