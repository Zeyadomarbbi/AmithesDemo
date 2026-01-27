import React, { useMemo, useState } from "react";
import InvestmentFlowsTable from "./InvestmentFlowsTable";
import "./InvestmentDetails.css";

const FLOW_TYPES = ["Investment", "Dividend", "Interest", "Other", "Divestment"];

// Helper: safe number parsing from any format (strings with spaces/commas)
const toNumber = (v) => {
  if (typeof v === "number") return v;
  const str = String(v ?? "").replace(/[^0-9.-]/g, "");
  const n = parseFloat(str);
  return Number.isFinite(n) ? n : 0;
};

// Helper: Format Money
const formatMoney = (n, currency = "€") => {
  // French locale gives spaces as separators (e.g., 12 000 000)
  return toNumber(n).toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) + " " + currency;
};

export default function InvestmentDetailsDrawer({ investment, onClose }) {
  
  // 1. Initialize State with initial flows (could be passed via props too)
  const [flows, setFlows] = useState([
    { id: 1, date: "2023-02-02", amount: -10000000, fxRate: 1.1, type: "Investment" },
    { id: 2, date: "2024-02-02", amount: -2000000, fxRate: 1.05, type: "Investment" },
   ]);

  const [fairValueDate, setFairValueDate] = useState("2025-03-31");
  const [fairValueAmount, setFairValueAmount] = useState(13500000);
  const [fairValueFxRate, setFairValueFxRate] = useState(1.10);

  // 2. Read from Props (External Source) with fallbacks
  const headerCurrency = investment?.currency || "EUR €";
  const headerCountry = investment?.country || "Germany"; // Could be Egypt based on image, using props makes it dynamic
  const headerOwnership = investment?.ownership || "21.65%";
  const headerName = investment?.name || "Alyra";
  const headerSub = investment?.sub || "BioTech";

  // 3. Dynamic Calculations: Fair Value LC
  const fairValueAmountLC = useMemo(() => {
    return toNumber(fairValueAmount) * toNumber(fairValueFxRate);
  }, [fairValueAmount, fairValueFxRate]);

  // 4. Dynamic Calculations: Summary Cards (Sums by Type)
  const sumsByType = useMemo(() => {
    const sums = Object.fromEntries(FLOW_TYPES.map((t) => [t, 0]));
    
    flows.forEach(f => {
      // Summing absolute values for display in cards, or keep signed based on business logic.
      // Usually Investment is negative in DB but shown positive on "Investment" card.
      const val = toNumber(f.amount);
      if (sums[f.type] !== undefined) {
         sums[f.type] += Math.abs(val); 
      }
    });

    return sums;
  }, [flows]);

  // Handlers
  const handleAddFlow = () => {
    const newId = flows.length > 0 ? Math.max(...flows.map(f => f.id)) + 1 : 1;
    setFlows((prev) => [
      ...prev,
      { id: newId, date: "", amount: 0, fxRate: 0, type: "Investment" },
    ]);
  };

  const handleUpdateFlow = (id, field, value) => {
    setFlows((prev) => prev.map((f) => (f.id === id ? { ...f, [field]: value } : f)));
  };

  const handleDeleteFlow = (id) => {
    setFlows((prev) => prev.filter((f) => f.id !== id));
  };

  const handleSave = () => {
    // Logic to save flows, fairValue, etc.
    const payload = {
        investmentId: investment?.id,
        flows,
        fairValue: { date: fairValueDate, amount: fairValueAmount, fx: fairValueFxRate }
    };
    console.log("Saving:", payload);
    onClose();
  };

  return (
    <div className="invDrawerOverlay" onClick={onClose}>
      <aside className="invDrawerPanel" onClick={(e) => e.stopPropagation()}>
        
        {/* ===== HEADER (Dynamic from Props) ===== */}
        <div className="invDrawerHeader">
          <button className="invBackBtn" onClick={onClose}>‹</button>
          
          <div className="invHeaderContent">
            <div className="invTitleBlock">
              <div className="invMainTitle">{headerName}</div>
              <div className="invSubTitle">{headerSub}</div>
            </div>

            <div className="invMetaGroup">
              <div className="invMetaItem">
                <span className="invMetaLabel">Ownership</span>
                <span className="invMetaValue">{headerOwnership}</span>
              </div>
              <div className="invMetaItem">
                <span className="invMetaLabel">Currency</span>
                <span className="invMetaValue">{headerCurrency}</span>
              </div>
              <div className="invMetaItem">
                <span className="invMetaLabel">Country</span>
                <span className="invMetaValue">
                   {/* Flag logic can be added here based on country code */}
                   {headerCountry === "Egypt" ? "🇪🇬" : "🇩🇪"} {headerCountry}
                </span>
              </div>
            </div>

            <div className="invHeaderActions">
              <button className="invActionIcon" title="Edit">✎</button>
              <button className="invActionIcon" title="Delete">🗑</button>
            </div>
          </div>
        </div>

        {/* ===== BODY ===== */}
        <div className="invDrawerBody">
          
          <div className="invSectionHeader">Flows</div>

          {/* Summary Cards (Dynamic from State) */}
          <div className="invCardsRow">
            <div className="invSummaryCard">
              <div className="invCardTitle">Investment</div>
              <div className="invCardValue">{formatMoney(sumsByType.Investment)}</div>
            </div>
            <div className="invSummaryCard">
              <div className="invCardTitle">Dividends</div>
              <div className="invCardValue">{formatMoney(sumsByType.Dividend)}</div>
            </div>
            <div className="invSummaryCard">
              <div className="invCardTitle">Interests</div>
              <div className="invCardValue">{formatMoney(sumsByType.Interest)}</div>
            </div>
             <div className="invSummaryCard">
              <div className="invCardTitle">Other</div>
              <div className="invCardValue">{formatMoney(sumsByType.Other)}</div>
            </div>
            <div className="invSummaryCard">
              <div className="invCardTitle">Divestment</div>
              <div className="invCardValue">{formatMoney(sumsByType.Divestment)}</div>
            </div>
          </div>

          {/* Fair Value Box (Calculated) */}
          {/* ===== Fair value box ===== */}
<div className="invFairBox">
  <div className="invFairCol" style={{ maxWidth: '160px' }}>
    <div className="invFairLabel">Fair Value</div>
    <input 
      type="date" 
      className="invInputBase invDateText"
      value={fairValueDate}
      onChange={(e) => setFairValueDate(e.target.value)}
    />
  </div>

  <div className="invFairCol">
    <div className="invFairLabel">Amount</div>
    <input 
      type="number" 
      className="invInputBase"
      value={fairValueAmount} 
      onChange={(e) => setFairValueAmount(e.target.value)}
    />
  </div>

  <div className="invFairCol">
    <div className="invFairLabel">FX Rate*</div>
    <input 
      type="number" 
      className="invInputBase"
      step="0.01"
      value={fairValueFxRate} 
      onChange={(e) => setFairValueFxRate(e.target.value)}
    />
  </div>

  <div className="invFairCol">
    <div className="invFairLabel">Amount LC *</div>
    <div style={{ height: '42px', display: 'flex', alignItems: 'center', fontSize: '14px', color: '#334155', fontWeight: '500' }}>
      {formatMoney(fairValueAmountLC, "").trim()}
    </div>
  </div>
</div>

          {/* Table (Fully Interactive) */}
          <InvestmentFlowsTable 
            flows={flows} 
            onUpdate={handleUpdateFlow}
            onDelete={handleDeleteFlow}
            onAdd={handleAddFlow}
          />
{/* ===== Performance ===== */}
<section className="inv-performance">
  <h4 className="inv-performance-title">Performance</h4>

  <div className="inv-performance-grid">
    <div className="perf-card">
      <span>Gross IRR €</span>
      <strong>—</strong>
    </div>

    <div className="perf-card">
      <span>Gross IRR LC</span>
      <strong>—</strong>
    </div>

    <div className="perf-card">
      <span>MOIC € (incl. dividends)</span>
      <strong>—</strong>
    </div>

    <div className="perf-card">
      <span>MOIC LC (incl. dividends)</span>
      <strong>—</strong>
    </div>

    <div className="perf-card">
      <span>MOIC € (excl. dividends)</span>
      <strong>—</strong>
    </div>

    <div className="perf-card">
      <span>MOIC LC (excl. dividends)</span>
      <strong>—</strong>
    </div>
  </div>
</section>

        </div>

        {/* ===== FOOTER ===== */}
        <div className="invDrawerFooter">
          <button className="invFooterBtn invBtnCancel" onClick={onClose}>Cancel</button>
          <button className="invFooterBtn invBtnSave" onClick={handleSave}>Save</button>
        </div>

      </aside>
    </div>
  );
}