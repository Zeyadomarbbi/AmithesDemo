import React, { useMemo, useState, useEffect, useRef, useCallback } from "react";
import { xirr as xirrLib } from "@webcarrot/xirr";
import InvestmentFlowsTable from "./InvestmentFlowsTable";
import { BackIcon, EditIcon, TrashIcon } from "../../Icons";
import { usePortfolioFlows } from "../../../../../../../../../hooks/Portfolio/usePortfolioFlows";
import Toast from '../../../../../../../../../components/Toast/Toast.jsx';

import "./InvestmentDetails.css";

const FLOW_TYPES = ["Investment", "Dividend", "Interest", "Other", "Divestment"];

const toNumber = (v) => {
  if (typeof v === "number") return v;
  const str = String(v ?? "").replace(/[^0-9.-]/g, "");
  const n = parseFloat(str);
  return Number.isFinite(n) ? n : 0;
};

const formatMoney = (n, currency = "€") => {
  return (
    toNumber(n).toLocaleString("fr-FR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }) + (currency ? ` ${currency}` : "")
  );
};

const formatRatio = (n) => (!Number.isFinite(n) ? "-" : n.toFixed(2));
const formatPercent = (n) => (!Number.isFinite(n) ? "-" : `${(n * 100).toFixed(2)}%`);

const canonicalType = (type) => {
  const t = String(type || "").trim().toLowerCase();
  if (t.includes("dividend")) return "Dividend";
  if (t.includes("interest")) return "Interest";
  if (t.includes("partial") && t.includes("divest")) return "Divestment";
  if (t.includes("divest")) return "Divestment";
  if (t.includes("invest")) return "Investment";
  return "Other";
};

const round6 = (n) => {
  const v = Number(n);
  return Number.isFinite(v) ? Number(v.toFixed(6)) : 0;
};

const safeXirr = (cashflows) => {
  try {
    if (!cashflows || cashflows.length < 2) return null;
    const hasPos = cashflows.some((c) => c.amount > 0);
    const hasNeg = cashflows.some((c) => c.amount < 0);
    if (!hasPos || !hasNeg) return null;
    return xirrLib(cashflows);
  } catch (err) {
    return null;
  }
};

export default function InvestmentDetailsDrawer({ 
  investment, 
  timeframe, 
  fundId, 
  scenarioId, 
  onClose, 
  onSaved,
  transactionTypes,
  exitDate, 
  exitValue 
}) {
  const investmentId = investment?.id ?? investment?.investment_id ?? null;
  
  const { 
    flows: apiFlows, 
    fetchFlows, 
    createFlow, 
    updateFlow, 
    deleteFlow, 
    loading: flowsLoading 
  } = usePortfolioFlows(fundId, investmentId);

  const [localFlows, setLocalFlows] = useState([]);
  const [exitFxRate, setExitFxRate] = useState(1); 
  const [toast, setToast] = useState(null);
  const flowIdRef = useRef(1);

  // Metadata
  const headerCurrency = investment?.currency || "EUR €";
  const headerCountry = investment?.country || "Germany";
  const headerOwnership = investment?.ownership ? `${toNumber(investment.ownership).toFixed(2)}%` : "-";
  const headerName = investment?.name || "Deal Name";
  const headerSub = investment?.sector || investment?.sub || "";
  const headerTimeframe = timeframe?.display_label || null;

  const normalizeTransactionType = useCallback((t) => {
    if (!t) return { id: null, name: "" };
    const name = t.transaction_name ?? t.name ?? "";
    const id = t.id ?? t.transaction_id ?? null;
    return { id, name: String(name || "").trim() };
  }, []);

  const makeLocalFlowId = useCallback(() => {
    const id = `tmp-${Date.now()}-${flowIdRef.current}`;
    flowIdRef.current += 1;
    return id;
  }, []);

  const mapFlowFromApi = useCallback((flow) => {
    return {
      id: flow.id || flow.flow_id || makeLocalFlowId(),
      flowId: flow.id || flow.flow_id || null,
      date: flow.date || "",
      amountLC: flow.amount_lc || 0,
      fxRate: flow.fx_rate || 1,
      type: flow.transaction_name || "Investment",
      divestmentPercentage: flow.divestment_percentage ?? null,
      isReal: flow.scenario_id === null 
    };
  }, [makeLocalFlowId]);

  useEffect(() => {
    if (scenarioId) fetchFlows(scenarioId);
  }, [scenarioId, fetchFlows]);

  useEffect(() => {
    setLocalFlows(apiFlows.map(mapFlowFromApi));
  }, [apiFlows, mapFlowFromApi]);

  /* =========================================================
     CALCULATIONS
     ========================================================= */

  const exitValueLC = useMemo(() => toNumber(exitValue) * toNumber(exitFxRate), [exitValue, exitFxRate]);

  // 1. Sums by Type (LC) - MODIFIED: Divestment includes Exit Value
  const sumsByTypeLC = useMemo(() => {
    const sums = { Investment: 0, Dividend: 0, Interest: 0, Other: 0, Divestment: 0 };
    localFlows.forEach((f) => {
      const t = canonicalType(f.type);
      if (sums[t] !== undefined) sums[t] += Math.abs(toNumber(f.amountLC));
    });
    // ADD EXIT VALUE TO DIVESTMENT SUM
    sums.Divestment += toNumber(exitValueLC); 
    return sums;
  }, [localFlows, exitValueLC]);

  // 2. Sums by Type (Euro) - MODIFIED: Divestment includes Exit Value
  const sumsByTypeEuro = useMemo(() => {
    const sums = { Investment: 0, Dividend: 0, Interest: 0, Other: 0, Divestment: 0 };
    localFlows.forEach((f) => {
      const t = canonicalType(f.type);
      const fx = toNumber(f.fxRate);
      const eur = fx ? Math.abs(toNumber(f.amountLC)) / fx : 0;
      if (sums[t] !== undefined) sums[t] += eur;
    });
    // ADD EXIT VALUE TO DIVESTMENT SUM
    sums.Divestment += toNumber(exitValue);
    return sums;
  }, [localFlows, exitValue]);

  const normalizeAmountLC = (flow) => {
    const lc = toNumber(flow.amountLC);
    return canonicalType(flow.type) === "Investment" ? -Math.abs(lc) : Math.abs(lc);
  };

  const irrEuro = useMemo(() => {
    const cashflows = localFlows
      .filter((f) => f.date && toNumber(f.fxRate) > 0)
      .map((f) => ({ 
        date: new Date(f.date), 
        amount: normalizeAmountLC(f) / toNumber(f.fxRate) 
      }))
      .sort((a, b) => a.date - b.date);
    
    if (exitDate && toNumber(exitValue) !== 0) {
      cashflows.push({ date: new Date(exitDate), amount: toNumber(exitValue) });
    }
    return safeXirr(cashflows);
  }, [localFlows, exitDate, exitValue]);

  const irrLC = useMemo(() => {
    const cashflows = localFlows
      .filter((f) => f.date)
      .map((f) => ({ 
        date: new Date(f.date), 
        amount: normalizeAmountLC(f) 
      }))
      .sort((a, b) => a.date - b.date);
    
    if (exitDate && exitValueLC !== 0) {
      cashflows.push({ date: new Date(exitDate), amount: exitValueLC });
    }
    return safeXirr(cashflows);
  }, [localFlows, exitDate, exitValueLC]);

  const investedEuro = sumsByTypeEuro.Investment;
  const investedLC = sumsByTypeLC.Investment;

  // Use the modified sums directly (which now include exit value)
  const moicInclEuro = investedEuro > 0 
    ? (sumsByTypeEuro.Divestment + sumsByTypeEuro.Dividend + sumsByTypeEuro.Interest + sumsByTypeEuro.Other) / investedEuro 
    : 0;

  const moicInclLC = investedLC > 0 
    ? (sumsByTypeLC.Divestment + sumsByTypeLC.Dividend + sumsByTypeLC.Interest + sumsByTypeLC.Other) / investedLC 
    : 0;

  const moicExclEuro = investedEuro > 0
    ? sumsByTypeEuro.Divestment / investedEuro
    : 0;

  const moicExclLC = investedLC > 0
    ? sumsByTypeLC.Divestment / investedLC
    : 0;

  /* ===== HANDLERS ===== */

  const handleAddFlow = () => {
    setLocalFlows(prev => [...prev, { 
      id: makeLocalFlowId(), 
      flowId: null, 
      date: "", 
      amountLC: 0, 
      fxRate: 1, 
      type: "Investment", 
      divestmentPercentage: null, 
      isReal: false 
    }]);
  };

  const handleUpdateInput = (id, field, value) => {
    setLocalFlows(prev => prev.map(f => {
      if (f.id === id && f.isReal) return f; 
      return f.id === id ? { ...f, [field]: value } : f;
    }));
  };

  const handleDeleteFlow = async (id) => {
    const flow = localFlows.find(f => f.id === id);
    if (flow?.isReal) {
      setToast({ type: "error", message: "Cannot delete master record from scenario mode." });
      return;
    }
    if (flow?.flowId) {
      await deleteFlow(scenarioId, flow.flowId);
    } else {
      setLocalFlows(prev => prev.filter(f => f.id !== id));
    }
  };

  const handleSave = async () => {
    try {
      if (!scenarioId || !investmentId) throw new Error("Context Error");

      const normalizeType = (t) => String(t || "").trim().toLowerCase();
      const typeMap = new Map(transactionTypes.map(t => {
        const norm = normalizeTransactionType(t);
        return [normalizeType(norm.name), norm.id];
      }));

      const flowsToSave = localFlows.filter(f => !f.isReal && f.date && f.type && toNumber(f.fxRate) > 0);

      for (const f of flowsToSave) {
        const payload = {
          transaction_id: typeMap.get(normalizeType(f.type)),
          date: f.date,
          amount_lc: round6(toNumber(f.amountLC)),
          fx_rate: round6(toNumber(f.fxRate)),
          amount: round6(toNumber(f.amountLC) / toNumber(f.fxRate)),
          divestment_percentage: canonicalType(f.type).includes("Partial") ? round6(toNumber(f.divestmentPercentage)) : null,
          scenario_id: scenarioId 
        };

        if (f.flowId) {
          await updateFlow(scenarioId, f.flowId, payload);
        } else {
          await createFlow(scenarioId, payload);
        }
      }

      if (onSaved) onSaved();
      onClose();
    } catch (err) {
      setToast({ type: "error", message: "Error committing scenario changes." });
    }
  };

  return (
    <div className="invDrawerOverlay" onClick={onClose}>
      <aside className="invDrawerPanel" onClick={(e) => e.stopPropagation()}>
        <div className="invDrawerHeader">
          <button className="invBackBtn" onClick={onClose}><BackIcon/></button>
          <div className="invHeaderContent">
            <div className="invTitleBlock">
              <div className="invMainTitle">{headerName}</div>
              <div className="invSubTitle">{headerSub}</div>
            </div>
            <div className="invMetaGroup">
              <div className="invMetaItem"><span className="invMetaLabel">Ownership</span><span className="invMetaValue">{headerOwnership}</span></div>
              <div className="invMetaItem"><span className="invMetaLabel">Currency</span><span className="invMetaValue">{headerCurrency}</span></div>
              <div className="invMetaItem"><span className="invMetaLabel">Country</span><span className="invMetaValue">{headerCountry}</span></div>
              {headerTimeframe && <div className="invMetaItem"><span className="invMetaLabel">Timeframe</span><span className="invMetaValue">{headerTimeframe}</span></div>}
            </div>
          </div>
        </div>

        <div className="invDrawerBody">
          <div className="invSectionHeader">Scenario Trajectory</div>
          
          {/* Summary Cards */}
          <div className="invCardsRow">
            {FLOW_TYPES.map(type => (
              <div key={type} className="invSummaryCard">
                <div className="invCardTitle">{type === "Divestment" ? "Divestment" : type}</div>
                {/* For Divestment, we are now showing the SUM of (Partial Exits + Terminal Value).
                   The sumsByTypeLC logic above handles this addition.
                */}
                <div className="invCardValue">{formatMoney(sumsByTypeLC[type], "")}</div>
              </div>
            ))}
          </div>

          <div className="invFairBox">
            <div className="invFairCol" style={{ maxWidth: '160px' }}>
              <div className="invFairLabel">Exit Date (Proj.)</div>
              <div style={{ height: '42px', display: 'flex', alignItems: 'center', fontSize: '14px', color: '#334155', fontWeight: '500' }}>
                {exitDate ? new Date(exitDate).toLocaleDateString('en-GB') : "-"}
              </div>
            </div>
            <div className="invFairCol">
              <div className="invFairLabel">Exit Amount (€)</div>
              <div style={{ height: '42px', display: 'flex', alignItems: 'center', fontSize: '14px', color: '#334155', fontWeight: '500' }}>
                {formatMoney(exitValue, "")}
              </div>
            </div>
            <div className="invFairCol">
              <div className="invFairLabel">Exit FX Rate*</div>
              <input 
                className="invInputBase" 
                type="number" 
                step="0.0001" 
                value={exitFxRate} 
                onChange={(e) => setExitFxRate(e.target.value)} 
              />
            </div>
            <div className="invFairCol">
              <div className="invFairLabel">Implied Amount LC</div>
              <div style={{ height: '42px', display: 'flex', alignItems: 'center', fontSize: '14px', color: '#334155', fontWeight: '500' }}>
                {formatMoney(exitValueLC, "")}
              </div>
            </div>
          </div>

          <InvestmentFlowsTable 
            flows={localFlows} 
            onUpdate={handleUpdateInput} 
            onDelete={handleDeleteFlow} 
            onAdd={handleAddFlow} 
            flowTypes={transactionTypes.map(t => normalizeTransactionType(t).name).filter(Boolean)}
          />

          <section className="inv-performance">
            <h4 className="inv-performance-title">Scenario Performance Metrics</h4>
            <div className="inv-performance-grid">
              <div className="perf-card"><span>Gross IRR €</span><strong>{formatPercent(irrEuro)}</strong></div>
              <div className="perf-card"><span>Gross IRR LC</span><strong>{formatPercent(irrLC)}</strong></div>
              <div className="perf-card"><span>MOIC € (incl. div)</span><strong>{formatRatio(moicInclEuro)}x</strong></div>
              <div className="perf-card"><span>MOIC LC (incl. div)</span><strong>{formatRatio(moicInclLC)}x</strong></div>
              <div className="perf-card"><span>MOIC € (excl. div)</span><strong>{formatRatio(moicExclEuro)}x</strong></div>
              <div className="perf-card"><span>MOIC LC (excl. div)</span><strong>{formatRatio(moicExclLC)}x</strong></div>
            </div>
          </section>
        </div>

        <div className="invDrawerFooter">
          <button className="invFooterBtn invBtnCancel" onClick={onClose}>Cancel</button>
          <button className="invFooterBtn invBtnSave" onClick={handleSave} disabled={flowsLoading}>
            {flowsLoading ? "Syncing..." : "Save"}
          </button>
        </div>
      </aside>
      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}
    </div>
  );
}