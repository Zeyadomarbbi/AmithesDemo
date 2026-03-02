import React, { useMemo, useState, useEffect, useRef, useCallback } from "react";
import { xirr as xirrLib } from "@webcarrot/xirr";
import InvestmentFlowsTable from "./InvestmentFlowsTable";
import useApi from "../../../../../../hooks/api/useApi"; // Adjust path to useApi
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

const formatRatio = (n) => {
  if (!Number.isFinite(n)) return "-";
  return n.toFixed(2);
};

const formatPercent = (n) => {
  if (!Number.isFinite(n)) return "-";
  return `${(n * 100).toFixed(2)}%`;
};

const canonicalType = (type) => {
  const t = String(type || "").trim().toLowerCase();
  if (t.includes("dividend")) return "Dividend";
  if (t.includes("interest")) return "Interest";
  if (t.includes("partial") && t.includes("divest")) return "Partial divestment";
  if (t.includes("divest")) return "Divestment";
  if (t.includes("invest")) return "Investment";
  if (t === "other") return "Other";
  return "Other";
};

const round6 = (n) => {
  const v = Number(n);
  if (!Number.isFinite(v)) return 0;
  return Number(v.toFixed(6));
};

const safeXirr = (cashflows) => {
  try {
    if (!cashflows || cashflows.length < 2) return null;
    const hasPos = cashflows.some((c) => c.amount > 0);
    const hasNeg = cashflows.some((c) => c.amount < 0);
    if (!hasPos || !hasNeg) return null;
    return xirrLib(cashflows);
  } catch (err) {
    console.error("XIRR calculation failed:", err);
    return null;
  }
};

export default function InvestmentDetailsDrawer({ investment, timeframe, fundId, onClose, onSaved }) {
  const api = useApi();
  const [flows, setFlows] = useState([]);
  const [fairValueFxRate, setFairValueFxRate] = useState(0);
  const [fairValueAmountLC, setFairValueAmountLC] = useState(0);
  const [fairValueId, setFairValueId] = useState(null);
  const [transactionTypes, setTransactionTypes] = useState([]);
  const [toast, setToast] = useState(null);
  const flowIdRef = useRef(1);

  const headerCurrency =
    investment?.currency ||
    [
      investment?.currencyName,
      investment?.currencyCode ? `(${investment.currencyCode})` : "",
      investment?.currencySymbol,
    ]
      .filter(Boolean)
      .join(" ")
      .trim() ||
    "EUR €";
  const headerCountry = investment?.country || "Germany";
  const ownershipValue = toNumber(investment?.ownership);
  const headerOwnership = Number.isFinite(ownershipValue) && ownershipValue > 0
    ? `${ownershipValue.toFixed(2)}%`
    : "21.65%";
  const headerName = investment?.name || "Alyra";
  const headerSub = investment?.sector || investment?.sub || "BioTech";
  const headerTimeframe = timeframe?.display_label || null;
  const fairValueDateLabel = timeframe?.rawDate || timeframe?.date || "";
  const investmentId =
    investment?.id ??
    investment?.investment_id ??
    investment?.investmentId ??
    null;

  // 1. Fetch Types using useApi
  useEffect(() => {
    const fetchTypes = async () => {
      try {
        const data = await api.get("/api/portfolio-transaction-types/");
        setTransactionTypes(data);
      } catch (err) {
        console.error("Transaction types fetch failed:", err.message);
      }
    };
    fetchTypes();
  }, [api]);

  const normalizeTransactionType = useCallback((t) => {
    if (!t) return { id: null, name: "" };
    const name =
      t.name ??
      t.transaction_name ??
      t.transactionName ??
      t.transaction_type_name ??
      t.label ??
      "";
    const id =
      t.id ??
      t.transaction_id ??
      t.transactionId ??
      t.transaction_type_id ??
      null;
    return { id, name: String(name || "").trim() };
  }, []);

  const makeLocalFlowId = useCallback(() => {
    const id = `tmp-${Date.now()}-${flowIdRef.current}`;
    flowIdRef.current += 1;
    return id;
  }, []);

  const mapFlowFromApi = useCallback((flow) => {
    const backendId = flow.flow_id ?? flow.id ?? flow.flowId ?? null;
    const typeName =
      flow.transaction_name ??
      flow.transaction_type_name ??
      flow.transaction_type?.name ??
      flow.transaction_type ??
      flow.type ??
      "Investment";

    return {
      id: backendId ?? makeLocalFlowId(),
      flowId: backendId,
      date: flow.date || "",
      amountLC: flow.amount_lc ?? flow.amountLC ?? 0,
      fxRate: flow.fx_rate ?? flow.fxRate ?? 0,
      type: typeName,
      divestmentPercentage:
        flow.divestment_percentage ?? flow.divestmentPercentage ?? null,
    };
  }, [makeLocalFlowId]);

  // 2. Load directly from the passed `investment` prop
  useEffect(() => {
    if (!investment) return;

    // Load Flows directly from memory
    const rawFlows = investment.transaction_flows || [];
    setFlows(rawFlows.map(mapFlowFromApi));

    if (!fairValueDateLabel) {
      setFairValueId(null);
      setFairValueFxRate(0);
      setFairValueAmountLC(0);
      return;
    }

    // Extract correct Fair Value from memory
    const rawFairValues = investment.fair_value_flows || [];
    const match = rawFairValues.find(
      (fv) => String(fv.date) === String(fairValueDateLabel)
    );

    if (match) {
      setFairValueId(match.fair_value_id ?? match.id ?? null);
      setFairValueFxRate(match.fx_rate ?? match.fxRate ?? 0);
      setFairValueAmountLC(match.amount_lc ?? match.amountLC ?? 0);
    } else {
      setFairValueId(null);
      setFairValueFxRate(0);
      setFairValueAmountLC(0);
    }
  }, [investment, fairValueDateLabel, mapFlowFromApi]);

  const fairValueAmount = useMemo(() => {
    return toNumber(fairValueAmountLC) / toNumber(fairValueFxRate);
  }, [fairValueFxRate, fairValueAmountLC]);

  const normalizeAmountLC = (flow) => {
    const lc = toNumber(flow.amountLC);
    const type = canonicalType(flow.type);
    if (type === "Investment") return -Math.abs(lc);
    if (type === "Dividend" || type === "Interest" || type === "Other" || type === "Divestment" || type === "Partial divestment") {
      return Math.abs(lc);
    }
    return lc;
  };

  const sumsByType = useMemo(() => {
    const sums = Object.fromEntries(FLOW_TYPES.map((t) => [t, 0]));
    flows.forEach((f) => {
      const t = canonicalType(f.type);
      const lc = Math.abs(toNumber(f.amountLC));
      if (sums[t] !== undefined) sums[t] += lc;
    });
    return sums;
  }, [flows]);

  const sumsByTypeEuro = useMemo(() => {
    const sums = Object.fromEntries(FLOW_TYPES.map((t) => [t, 0]));
    flows.forEach((f) => {
      const t = canonicalType(f.type);
      const lc = Math.abs(toNumber(f.amountLC));
      const fx = toNumber(f.fxRate);
      const eur = fx ? lc / fx : 0;
      if (sums[t] !== undefined) sums[t] += eur;
    });
    return sums;
  }, [flows]);

  const sumsByTypeLC = useMemo(() => {
    const sums = Object.fromEntries(FLOW_TYPES.map((t) => [t, 0]));
    flows.forEach((f) => {
      const t = canonicalType(f.type);
      const lc = Math.abs(toNumber(f.amountLC));
      if (sums[t] !== undefined) sums[t] += lc;
    });
    return sums;
  }, [flows]);

  const irrEuro = useMemo(() => {
    const cashflows = flows
      .filter((f) => f.date && toNumber(f.fxRate) > 0)
      .map((f) => {
        const lc = normalizeAmountLC(f);
        const fx = toNumber(f.fxRate);
        const eur = fx ? lc / fx : 0;
        return { date: new Date(f.date), amount: eur };
      })
      .filter((c) => Number.isFinite(c.amount) && c.amount !== 0)
      .sort((a, b) => a.date - b.date);
    if (fairValueDateLabel) {
      const fvDate = new Date(fairValueDateLabel);
      if (!Number.isNaN(fvDate.getTime())) {
        const fvAmount = toNumber(fairValueAmount);
        if (Number.isFinite(fvAmount) && fvAmount !== 0) {
          cashflows.push({ date: fvDate, amount: fvAmount });
        }
      }
    }
    return safeXirr(cashflows);
  }, [flows, fairValueDateLabel, fairValueAmount]);

  const irrLC = useMemo(() => {
    const cashflows = flows
      .filter((f) => f.date)
      .map((f) => ({
        date: new Date(f.date),
        amount: normalizeAmountLC(f),
      }))
      .filter((c) => Number.isFinite(c.amount) && c.amount !== 0)
      .sort((a, b) => a.date - b.date);
    if (fairValueDateLabel) {
      const fvDate = new Date(fairValueDateLabel);
      if (!Number.isNaN(fvDate.getTime())) {
        const fvAmount = toNumber(fairValueAmountLC);
        if (Number.isFinite(fvAmount) && fvAmount !== 0) {
          cashflows.push({ date: fvDate, amount: fvAmount });
        }
      }
    }
    return safeXirr(cashflows);
  }, [flows, fairValueDateLabel, fairValueAmountLC]);

  const investmentEuro = Math.abs(sumsByTypeEuro.Investment || 0);
  const investmentLC = Math.abs(sumsByTypeLC.Investment || 0);
  const moicInclEuro =
    investmentEuro > 0
      ? (sumsByTypeEuro.Dividend + sumsByTypeEuro.Interest + sumsByTypeEuro.Other + sumsByTypeEuro.Divestment) /
        investmentEuro
      : 0;
  
  const firstInvestmentFlow = useMemo(() => {
    const investmentFlows = flows.filter((f) => canonicalType(f.type) === "Investment");
    if (!investmentFlows.length) return null;
    return [...investmentFlows].sort((a, b) => {
      if (!a.date && !b.date) return 0;
      if (!a.date) return 1;
      if (!b.date) return -1;
      return new Date(a.date) - new Date(b.date);
    })[0];
  }, [flows]);

  const firstInvestmentAmountLC = Math.abs(toNumber(firstInvestmentFlow?.amountLC));

  const moicInclLC =
    firstInvestmentAmountLC > 0 ? toNumber(fairValueAmountLC) / firstInvestmentAmountLC : 0;

  const moicExclEuro =
    toNumber(fairValueAmount) > 0
      ? (sumsByTypeEuro.Divestment + investmentEuro) / toNumber(fairValueAmount)
      : 0;

  const moicExclLC =
    toNumber(fairValueAmountLC) > 0
      ? (sumsByTypeLC.Divestment + investmentLC) / toNumber(fairValueAmountLC)
      : 0;

  const handleAddFlow = () => {
    setFlows((prev) => [
      ...prev,
      { id: makeLocalFlowId(), flowId: null, date: "", amountLC: 0, fxRate: 0, type: "Investment", divestmentPercentage: null },
    ]);
  };

  const handleUpdateFlow = (id, field, value) => {
    setFlows((prev) => prev.map((f) => (f.id === id ? { ...f, [field]: value } : f)));
  };

  const handleDeleteFlow = (id) => {
    setFlows((prev) => prev.filter((f) => f.id !== id));
  };

  // 3. Save Logic updated to useApi
  const handleSave = async () => {
    try {
      if (!fundId || !investmentId) throw new Error("Missing fund or investment id");
      
      if (!Number.isFinite(Number(investmentId))) {
        setToast({ type: "error", message: "Please save the investment first." });
        return;
      }

      if (!transactionTypes.length) {
        setToast({ type: "error", message: "Transaction types are not loaded yet. Please try again." });
        return;
      }

      const normalizeType = (t) => String(t || "").trim().toLowerCase();
      const typeMap = new Map(
        transactionTypes
          .map(normalizeTransactionType)
          .filter((t) => t.id && t.name)
          .map((t) => [normalizeType(t.name), t.id])
      );

      const validFlows = flows.filter((f) => {
        const hasDate = Boolean(f.date);
        const hasType = Boolean(f.type);
        const fx = toNumber(f.fxRate);
        const lc = toNumber(f.amountLC);
        return hasDate && hasType && fx > 0 && Number.isFinite(lc);
      });

      const flowRequests = validFlows.map((f) => {
        const transactionId = typeMap.get(normalizeType(f.type));
        if (!transactionId) throw new Error(`Unknown transaction type: ${f.type}`);
        
        const amountLC = round6(toNumber(f.amountLC));
        const fxRate = round6(toNumber(f.fxRate));
        const amountEuro = fxRate ? round6(amountLC / fxRate) : 0;

        const isPartial = canonicalType(f.type) === "Partial divestment";
        const divestmentPct = f.divestmentPercentage ?? null;
        
        if (isPartial) {
          if (divestmentPct === null || divestmentPct === "") {
            throw new Error("divestment_percentage required for Partial divestment");
          }
          const pct = toNumber(divestmentPct);
          if (!Number.isFinite(pct) || pct < 0 || pct > 9.9999) {
            throw new Error("divestment_percentage must be between 0 and 9.9999");
          }
        }

        const isUpdate = Boolean(f.flowId);
        const endpoint = isUpdate
          ? `/api/funds/${fundId}/portfolio-investments/${investmentId}/flows/${f.flowId}/`
          : `/api/funds/${fundId}/portfolio-investments/${investmentId}/flows/`;
        
        const payload = {
          transaction_id: transactionId,
          date: f.date,
          amount_lc: amountLC,
          fx_rate: fxRate,
          amount: amountEuro,
          divestment_percentage: isPartial ? round6(toNumber(divestmentPct)) : null,
        };

        return isUpdate ? api.put(endpoint, payload) : api.post(endpoint, payload);
      });

      const requests = [...flowRequests];
      
      if (fairValueDateLabel) {
        const endpoint = fairValueId
          ? `/api/funds/${fundId}/portfolio-investments/${investmentId}/fair-values/${fairValueId}/`
          : `/api/funds/${fundId}/portfolio-investments/${investmentId}/fair-values/`;
        
        const payload = {
          date: fairValueDateLabel,
          amount_lc: round6(toNumber(fairValueAmountLC)),
          fx_rate: round6(toNumber(fairValueFxRate)),
          amount: round6(toNumber(fairValueAmount)),
        };

        requests.push(fairValueId ? api.put(endpoint, payload) : api.post(endpoint, payload));
      }

      if (!requests.length) {
        setToast({ type: "error", message: "No valid flows to save." });
        return;
      }

      // useApi will throw if any of these reject
      await Promise.all(requests);
      
      // Since we don't fetch internally anymore, we just trigger the parent's refresh
      if (onSaved) await onSaved();
      onClose();

    } catch (err) {
      console.error("Save investment details failed:", err.message);
      setToast({ type: "error", message: err.message || "Failed to save investment details." });
    }
  };

  return (
    <div className="invDrawerOverlay" onClick={onClose}>
      <aside className="invDrawerPanel" onClick={(e) => e.stopPropagation()}>
        
        <div className="invDrawerHeader">
          <button className="invBackBtn" onClick={onClose}>
            {/* Replace with your BackIcon */}
            &larr;
          </button>
          
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
                   {headerCountry}
                </span>
              </div>
              {headerTimeframe && (
                <div className="invMetaItem">
                  <span className="invMetaLabel">Timeframe</span>
                  <span className="invMetaValue">{headerTimeframe}</span>
                </div>
              )}
            </div>

            <div className="invHeaderActions">
              <button className="invActionIcon" title="Edit">✎</button>
              <button className="invActionIcon" title="Delete">🗑</button>
            </div>
          </div>
        </div>

        <div className="invDrawerBody">
          <div className="invSectionHeader">Flows</div>

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

          <div className="invFairBox">
            <div className="invFairCol" style={{ maxWidth: '160px' }}>
              <div className="invFairLabel">Fair Value</div>
              <div style={{ height: '42px', display: 'flex', alignItems: 'center', fontSize: '14px', color: '#334155', fontWeight: '500' }}>
                {fairValueDateLabel || "-"}
              </div>
            </div>

            <div className="invFairCol">
              <div className="invFairLabel">Amount</div>
              <div style={{ height: '42px', display: 'flex', alignItems: 'center', fontSize: '14px', color: '#334155', fontWeight: '500' }}>
                {formatMoney(fairValueAmount, "")}
              </div>
            </div>

            <div className="invFairCol">
              <div className="invFairLabel">FX Rate*</div>
              <input
                className="invInputBase"
                type="number"
                step="0.0001"
                value={fairValueFxRate}
                onChange={(e) => setFairValueFxRate(e.target.value)}
              />
            </div>

            <div className="invFairCol">
              <div className="invFairLabel">Amount LC *</div>
              <input
                className="invInputBase"
                type="number"
                step="0.01"
                value={fairValueAmountLC}
                onChange={(e) => setFairValueAmountLC(e.target.value)}
              />
            </div>
          </div>

          <InvestmentFlowsTable 
            flows={flows} 
            onUpdate={handleUpdateFlow}
            onDelete={handleDeleteFlow}
            onAdd={handleAddFlow}
            flowTypes={transactionTypes
              .map(normalizeTransactionType)
              .map((t) => t.name)
              .filter(Boolean)}
          />

          <section className="inv-performance">
            <h4 className="inv-performance-title">Performance</h4>

            <div className="inv-performance-grid">
              <div className="perf-card">
                <span>Gross IRR €</span>
                <strong>{irrEuro !== null ? formatPercent(irrEuro) : "-"}</strong>
              </div>

              <div className="perf-card">
                <span>Gross IRR LC</span>
                <strong>{irrLC !== null ? formatPercent(irrLC) : "-"}</strong>
              </div>

              <div className="perf-card">
                <span>MOIC € (incl. dividends)</span>
                <strong>{`${formatRatio(moicInclEuro)}x`}</strong>
              </div>

              <div className="perf-card">
                <span>MOIC LC (incl. dividends)</span>
                <strong>{`${formatRatio(moicInclLC)}x`}</strong>
              </div>

              <div className="perf-card">
                <span>MOIC € (excl. dividends)</span>
                <strong>{`${formatRatio(moicExclEuro)}x`}</strong>
              </div>

              <div className="perf-card">
                <span>MOIC LC (excl. dividends)</span>
                <strong>{`${formatRatio(moicExclLC)}x`}</strong>
              </div>
            </div>
          </section>
        </div>

        <div className="invDrawerFooter">
          <button className="invFooterBtn invBtnCancel" onClick={onClose}>Cancel</button>
          <button className="invFooterBtn invBtnSave" onClick={handleSave}>Save</button>
        </div>
      </aside>

      {toast && (
        <div className={`toast toast-${toast.type} toast-inv`}>
          <span>{toast.message}</span>
          <button
            className="toast-close"
            onClick={() => setToast(null)}
            aria-label="Close"
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
}