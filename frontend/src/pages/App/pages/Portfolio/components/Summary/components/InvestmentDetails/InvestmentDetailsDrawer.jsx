import React, { useMemo, useState, useEffect, useRef, useCallback } from "react";
import { PermissionGate } from "../../../../../../../../hooks/Auth/PermissionGate";
import InvestmentFlowsTable from "./InvestmentFlowsTable";
import { DoubleArrowLeftIcon } from "../../../../../../../../components/Icons/DirectionIcons";
import { EditIcon, DeleteIcon, CloseIcon } from "../../../../../../../../components/Icons/InteractiveIcons.jsx";
import { useNumberFormatter, usePercentageFormatter, useDateFormatter, useMoicFormatter } from "../../../../../../../../components/useFormatter.js";
import { usePortfolioFlows } from "../../../../../../hooks/Portfolio/usePortfolioFlows.js";
import { usePortfolioTransactionTypes } from "../../../../../../hooks/Reference/usePortfolioTransactionTypes.js";
import { classifyInvestmentsByTimeframe, calculatePortfolioMetrics, calculateSubtotalMetrics, calcIrrSafely } from "../../PortfolioHelpers";

import Prompt from "../../../../../../components/Toast/Prompt.jsx";
import NewInvestmentModal from "../NewInvestmentModal/NewInvestmentModal.jsx";
import "./InvestmentDetails.css";

const FLOW_TYPES = ["Investment", "Dividend", "Interest", "Other", "Divestment", "Partial divestment"];

const toNumber = (v) => {
  if (typeof v === "number") return v;
  const str = String(v ?? "").replace(/[^0-9.-]/g, "");
  const n = parseFloat(str);
  return Number.isFinite(n) ? n : 0;
};

const roundForApi = (v) => {
  const n = toNumber(v);
  return Number.isFinite(n) ? Number(n.toFixed(6)) : 0;
};

const partialDivestmentFromBackend = (value) => {
  const n = toNumber(value);
  return Number.isFinite(n) ? n * 10 : 0;
};

const partialDivestmentToBackend = (value) => {
  const n = toNumber(value);
  return Number.isFinite(n) ? n / 10 : 0;
};

const getApiErrorMessage = (err, fallback = "Request failed.") => {
  const data = err?.response?.data;
  if (!data) return err?.message || fallback;
  if (typeof data === "string") return data;
  if (typeof data.detail === "string") return data.detail;
  if (typeof data.error === "string") return data.error;
  const firstEntry = Object.entries(data).find(([, value]) => {
    if (Array.isArray(value)) return value.length > 0;
    return Boolean(value);
  });
  if (!firstEntry) return err?.message || fallback;
  const [field, value] = firstEntry;
  const message = Array.isArray(value) ? value[0] : value;
  return `${field}: ${message}`;
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

const noop = () => {};

export default function InvestmentDetailsDrawer({
  investment,
  timeframe,
  fundId,
  onClose,
  onSaved,
  onUpdateInvestment,
  onDeleteInvestment,
  countries = [],
  currencies = [],
  showToast = noop,
}) {
  const [currentInvestment, setCurrentInvestment] = useState(investment);
  const [flows, setFlows] = useState([]);
  const [fairValueFxRate, setFairValueFxRate] = useState(0);
  const [fairValueAmountLC, setFairValueAmountLC] = useState(0);
  const [fairValueId, setFairValueId] = useState(null);
  const [deletePromptOpen, setDeletePromptOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isMutating, setIsMutating] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const flowIdRef = useRef(1);
  
  const formatNumber  = useNumberFormatter();
  const formatPercent = usePercentageFormatter();
  const formatDate    = useDateFormatter();
  const formatMoic    = useMoicFormatter();
  
  const noScroll = (e) => e.target.blur();

  const getFlagUrl = useCallback((countryNameOrId) => {
    if (!countryNameOrId || !countries) return null;
    const countryData = countries.find(c =>
      String(c.name).toLowerCase() === String(countryNameOrId).toLowerCase() ||
      Number(c.id) === Number(countryNameOrId)
    );
    if (!countryData?.iso2) return null;
    const code = countryData.iso2.toLowerCase();
    return `https://flagcdn.com/40x30/${code}.png`;
  }, [countries]);

  const sourceInvestmentId = investment?.id ?? investment?.investment_id ?? investment?.investmentId ?? null;
  const investmentId = currentInvestment?.id ?? currentInvestment?.investment_id ?? currentInvestment?.investmentId ?? null;
  const [isFairValueEditing, setIsFairValueEditing] = useState(false);
  const { transactionTypes } = usePortfolioTransactionTypes();
  const { createFlow, updateFlow, deleteFlow: apiDeleteFlow, saveFairValue: apiSaveFairValue } = usePortfolioFlows(fundId, sourceInvestmentId);

  const headerCurrency = useMemo(() => {
    const id = currentInvestment?.currencyId || currentInvestment?.currency_id;
    const match = currencies.find((c) => Number(c.id) === Number(id));
    const code = match?.code || currentInvestment?.currencyCode || currentInvestment?.currency_code || "-";
    const symbol = match?.symbol;
    return symbol ? `${code} (${symbol})` : code;
  }, [currentInvestment, currencies]);

  const headerCountry =
    currentInvestment?.country ||
    currentInvestment?.country_name ||
    currentInvestment?.countryName ||
    "";
    
  const ownershipValue = toNumber(currentInvestment?.ownership);
  const headerOwnership = Number.isFinite(ownershipValue) && ownershipValue > 0
    ? formatPercent(ownershipValue) : "-";
  const headerName = currentInvestment?.name || "-";
  const headerSub = currentInvestment?.sector || currentInvestment?.sub || "-";
  const headerTimeframe = timeframe?.display_label || null;
  const fairValueDateLabel = timeframe?.rawDate || timeframe?.date || "";

  useEffect(() => { setCurrentInvestment(investment); }, [investment]);

  const normalizeTransactionType = useCallback((t) => {
    if (!t) return { id: null, name: "" };
    const name = t.name ?? t.transaction_name ?? t.transactionName ?? t.transaction_type_name ?? t.label ?? "";
    const id = t.id ?? t.transaction_id ?? t.transactionId ?? t.transaction_type_id ?? null;
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
      flow.transaction_name ?? flow.transaction_type_name ??
      flow.transaction_type?.name ?? flow.transaction_type ?? flow.type ?? "Investment";
    return {
      id: backendId ?? makeLocalFlowId(),
      flowId: backendId,
      date: flow.date || "",
      amountLC: flow.amount_lc ?? flow.amountLC ?? 0,
      fxRate: flow.fx_rate ?? flow.fxRate ?? 0,
      type: typeName,
      divestmentPercentage:
        canonicalType(typeName) === "Partial divestment"
          ? partialDivestmentFromBackend(flow.divestment_percentage ?? flow.divestmentPercentage ?? null)
          : (flow.divestment_percentage ?? flow.divestmentPercentage ?? null),
    };
  }, [makeLocalFlowId]);

  useEffect(() => {
    if (!currentInvestment) return;
    const rawFlows = (currentInvestment.transaction_flows || []).filter(
      (flow) => flow.scenario_id === null || flow.scenario_id === undefined
    );
    setFlows(rawFlows.map(mapFlowFromApi));
    if (!fairValueDateLabel) {
      setFairValueId(null); setFairValueFxRate(0); setFairValueAmountLC(0);
    } else {
      const rawFairValues = currentInvestment.fair_value_flows || [];
      const match = rawFairValues.find((fv) => String(fv.date) === String(fairValueDateLabel));
      if (match) {
        setFairValueId(match.fair_value_id ?? match.id ?? null);
        setFairValueFxRate(match.fx_rate ?? match.fxRate ?? 0);
        setFairValueAmountLC(match.amount_lc ?? match.amountLC ?? 0);
      } else {
        setFairValueId(null); setFairValueFxRate(0); setFairValueAmountLC(0);
      }
    }
    setIsDirty(false);
  }, [currentInvestment, fairValueDateLabel, mapFlowFromApi]);

  const fairValueAmount = useMemo(() => {
    return toNumber(fairValueAmountLC) / toNumber(fairValueFxRate);
  }, [fairValueFxRate, fairValueAmountLC]);

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

  const classified = useMemo(() => {
    if (!currentInvestment || !fairValueDateLabel) return [];

    return classifyInvestmentsByTimeframe(
      [currentInvestment],
      fairValueDateLabel
    );
  }, [currentInvestment, fairValueDateLabel]);

  const calculatedRows = useMemo(() => {
    if (!classified.length || !fairValueDateLabel) return [];

    return calculatePortfolioMetrics(
      classified,
      fairValueDateLabel
    );
  }, [classified, fairValueDateLabel]);

  const totals = useMemo(() => {
    if (!calculatedRows.length) return null;

    return calculateSubtotalMetrics(calculatedRows);
  }, [calculatedRows]);

  const fullCashflows = useMemo(() => {
    if (!currentInvestment || !fairValueDateLabel) return [];

    const cutoff = new Date(fairValueDateLabel);

    const flows = (currentInvestment.transaction_flows || [])
      .filter(f => !f.is_deleted && new Date(f.date) <= cutoff);

    const cf = [];

    flows.forEach(f => {
      const type = String(f.transaction_name).toLowerCase();
      const amount = toNumber(f.amount);

      if (type === "investment") {
        cf.push({ date: new Date(f.date), amount: -amount });
      } else {
        cf.push({ date: new Date(f.date), amount });
      }
    });

    const latestFV = (currentInvestment.fair_value_flows || [])
      .filter(fv => new Date(fv.date) <= cutoff)
      .sort((a,b) => new Date(b.date) - new Date(a.date))[0];

    if (latestFV) {
      cf.push({
        date: new Date(latestFV.date),
        amount: toNumber(latestFV.amount)
      });
    }

    return cf;
  }, [currentInvestment, fairValueDateLabel]);

  const fullCashflowsLC = useMemo(() => { 
    if (!currentInvestment || !fairValueDateLabel) return []; 

    const cutoff = new Date(fairValueDateLabel); 

    const flows = (currentInvestment.transaction_flows || []) 
      .filter(f => !f.is_deleted && new Date(f.date) <= cutoff); 

    const cf = []; 

    flows.forEach(f => { 
      const type = String(f.transaction_name).toLowerCase(); 
      const amountLC = toNumber(f.amount_lc ?? f.amountLC); 

      if (type === "investment") { 
        cf.push({ date: new Date(f.date), amount: -amountLC }); 
      } else { 
        cf.push({ date: new Date(f.date), amount: amountLC }); 
      } 
    }); 

    const latestFV = (currentInvestment.fair_value_flows || []) 
      .filter(fv => new Date(fv.date) <= cutoff) 
      .sort((a,b) => new Date(b.date) - new Date(a.date))[0]; 

    if (latestFV) { 
      cf.push({ 
        date: new Date(latestFV.date), 
        amount: toNumber(latestFV.amount_lc ?? latestFV.amountLC) 
      }); 
    } 

    return cf; 
  }, [currentInvestment, fairValueDateLabel]);

  const irrEuro = calcIrrSafely(fullCashflows)*100;
  const irrLC   = calcIrrSafely(fullCashflowsLC)*100;
  console.log("Calculated IRR (Euro):", irrEuro);
  console.log("Calculated IRR (LC):", irrLC);
  const moicInclEuro = totals?.moicIncl ?? 0;
  const moicInclLC = totals?.moicInclLC ?? 0;

  const moicExclEuro = totals?.moicExcl ?? 0;
  const moicExclLC = totals?.moicExclLC ?? 0;

  const handleAddFlow = (initialFlow = null) => {
    setIsDirty(true);
    setFlows((prev) => [
      ...prev,
      initialFlow
        ? { ...initialFlow, id: makeLocalFlowId(), flowId: null, divestmentPercentage: initialFlow.divestmentPercentage !== undefined ? initialFlow.divestmentPercentage : null }
        : { id: makeLocalFlowId(), flowId: null, date: "", amountLC: 0, fxRate: 0, type: "", divestmentPercentage: null },
    ]);
  };

  const handleUpdateFlow = (id, field, value) => {
    setIsDirty(true);
    setFlows((prev) =>
      prev.map((f) => {
        if (f.id !== id) return f;
        if (field === "type") {
          const isPartial = String(value || "").trim().toLowerCase() === "partial divestment";
          return { ...f, type: value, divestmentPercentage: isPartial ? (f.divestmentPercentage ?? "") : null };
        }
        return { ...f, [field]: value };
      })
    );
  };

  const handleDeleteFlow = async (id) => {
    const targetFlow = flows.find((f) => f.id === id);
    if (!targetFlow) return;
    if (!targetFlow.flowId) { 
      setFlows((prev) => prev.filter((f) => f.id !== id)); 
      setIsDirty(true);
      return; 
    }
    try {
      await apiDeleteFlow(null, targetFlow.flowId);
      setFlows((prev) => prev.filter((f) => f.id !== id));
      if (onSaved) await onSaved();
      showToast({ type: "success", title: "Flow deleted", message: "The flow has been deleted successfully." });
    } catch (err) {
      showToast({ type: "error", title: "Delete failed", message: err.message || "Could not delete the flow." });
    }
  };

  const handleEditInvestment = async (payload) => {
    if (!investmentId || typeof onUpdateInvestment !== "function") {
      showToast({ type: "error", title: "Update failed", message: "Investment update is not available." }); return;
    }
    try {
      setIsMutating(true);
      await onUpdateInvestment(investmentId, payload);
      setIsEditOpen(false);
      onClose();
    } catch (err) {
      showToast({ type: "error", title: "Update failed", message: err.message || "Could not update the investment." });
    } finally {
      setIsMutating(false);
    }
  };

  const handleConfirmDeleteInvestment = async () => {
    if (!investmentId || typeof onDeleteInvestment !== "function") {
      setDeletePromptOpen(false);
      showToast({ type: "error", title: "Delete failed", message: "Investment deletion is not available." }); return;
    }
    try {
      setIsMutating(true);
      await onDeleteInvestment(investmentId);
      setDeletePromptOpen(false);
    } catch (err) {
      setDeletePromptOpen(false);
      showToast({ type: "error", title: "Delete failed", message: err.message || "Could not delete the investment." });
      setIsMutating(false);
    }
  };

  const handleSave = async () => {
    try {
      if (!fundId || !investmentId) throw new Error("Missing fund or investment id");
      if (!Number.isFinite(Number(investmentId))) { showToast({ type: "error", title: "Save failed", message: "Please save the investment first." }); return; }
      if (!transactionTypes.length) { showToast({ type: "error", title: "Save failed", message: "Transaction types not loaded yet." }); return; }
      const normalizeType = (t) => String(t || "").trim().toLowerCase();
      const typeMap = new Map(
        transactionTypes.map(normalizeTransactionType).filter((t) => t.id && t.name).map((t) => [normalizeType(t.name), t.id])
      );
      const validFlows = flows.filter((f) => {
        const fx = toNumber(f.fxRate);
        const lc = toNumber(f.amountLC);
        return Boolean(f.date) && Boolean(f.type) && fx > 0 && Number.isFinite(lc) && lc !== 0;
      });
      const flowRequests = validFlows.map((f) => {
        const transactionId = typeMap.get(normalizeType(f.type));
        if (!transactionId) throw new Error(`Unknown transaction type: ${f.type}`);
        const amountLC = roundForApi(f.amountLC);
        const fxRate = roundForApi(f.fxRate);
        const amountEuro = fxRate ? amountLC / fxRate : 0;
        const isPartial = canonicalType(f.type) === "Partial divestment";
        const divestmentPct = f.divestmentPercentage ?? null;
        if (isPartial) {
          if (divestmentPct === null || divestmentPct === "") throw new Error("divestment_percentage required for Partial divestment");
          const pct = toNumber(divestmentPct);
          if (!Number.isFinite(pct) || pct < 0 || pct > 100) throw new Error("divestment_percentage must be between 0 and 100");
        }
        const payload = {
          transaction_id: transactionId, date: f.date, amount_lc: amountLC,
          fx_rate: fxRate, amount: roundForApi(amountEuro),
          divestment_percentage: isPartial ? roundForApi(partialDivestmentToBackend(divestmentPct)) : null,
        };
        
        if (f.flowId) {
          return updateFlow(null, f.flowId, payload);
        } else {
          return createFlow(null, payload);
        }
      });
      
      const requests = [...flowRequests];
      const hasFairValueInput = fairValueDateLabel && toNumber(fairValueFxRate) > 0 && Number.isFinite(toNumber(fairValueAmountLC)) && toNumber(fairValueAmountLC) !== 0;
      
      if (hasFairValueInput) {
        const payload = {
          fairValueId,
          date: fairValueDateLabel,
          amount_lc: roundForApi(fairValueAmountLC),
          fx_rate: roundForApi(fairValueFxRate),
          amount: roundForApi(fairValueAmount),
        };
        requests.push(apiSaveFairValue(null, payload));
      }
      
      if (!requests.length) { showToast({ type: "error", title: "Save failed", message: "No valid flows to save." }); return; }
      
      await Promise.all(requests);
      if (onSaved) await onSaved();
      
      setIsDirty(false);
      showToast({ type: "success", title: "Portfolio saved", message: "Investment details have been saved successfully." });
      onClose();
    } catch (err) {
      console.error("Save failed:", err.message);
      showToast({ type: "error", title: "Save failed", message: getApiErrorMessage(err, "Failed to save.") });
    }
  };

  return (
    <div className="invDrawerOverlay" onClick={onClose}>
      <aside
        className={`invDrawerPanel${expanded ? " share-drawer--expanded" : ""}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="invDrawerHeader">
          <button
            className={`invBackBtn ${expanded ? "invBackBtn--expanded" : ""}`}
            onClick={() => setExpanded((v) => !v)}
            title={expanded ? "Collapse" : "Expand"}
          >
            <DoubleArrowLeftIcon />
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
                <span className="invMetaValue">
                  {headerCurrency}
                </span>
              </div>
              <div className="invMetaItem">
                <span className="invMetaLabel">Country</span>
                <span className="invMetaValue">
                  {getFlagUrl(headerCountry) && (
                    <img src={getFlagUrl(headerCountry)} alt={headerCountry} className="country-flag-img" width={20} height={15} />
                  )}
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
            <PermissionGate>
              <div className="invHeaderActions">
                <button className="invActionIcon" title="Edit" onClick={() => setIsEditOpen(true)} disabled={isMutating}><EditIcon /></button>
                <button className="invActionIcon" title="Delete" onClick={() => setDeletePromptOpen(true)} disabled={isMutating}><DeleteIcon /></button>
              </div>
            </PermissionGate>
          </div>
        </div>

        <div className="invDrawerBody">
          <div className="invSectionHeader">Flows</div>

          <div className="invCardsRow">
            {[
              { label: "Investment",  value: sumsByTypeEuro.Investment },
              { label: "Dividends",   value: sumsByTypeEuro.Dividend },
              { label: "Interests",   value: sumsByTypeEuro.Interest },
              { label: "Other",       value: sumsByTypeEuro.Other },
              { label: "Divestment",  value: sumsByTypeEuro.Divestment },
            ].map(({ label, value }) => (
              <div className="invSummaryCard" key={label}>
                <div className="invCardTitle">{label}</div>
                <div className="invCardValue">
                  {value > 0 ? `${formatNumber(value)}` : `-`}
                </div>
              </div>
            ))}
          </div>

          <div className="invFairBox" style={{ position: "relative" }}>
            <button
              type="button"
              className="invRowActionBtn"
              style={{ position: "absolute", top: "12px", right: "12px" }}
              onClick={() => setIsFairValueEditing(!isFairValueEditing)}
              title="Toggle Edit"
            >
              {isFairValueEditing ? <CloseIcon /> : <EditIcon />}
            </button>

            <div className="invFairCol">
              <div className="invFairLabelTitle">Fair Value</div>
              <div className="invFairLabelTitleSub">
                {fairValueDateLabel ? formatDate(fairValueDateLabel) : "-"}
              </div>
            </div>
            <div className="invFairCol">
              <div className="invFairLabel">Amount</div>
              <div className="invFairStaticVal">{formatNumber(fairValueAmount)}</div>
            </div>
            <div className="invFairCol">
              <div className="invFairLabel">FX Rate*</div>
              {isFairValueEditing ? (
                <input
                  className="invInputBase"
                  type="number"
                  step="any"
                  value={fairValueFxRate === 0 ? "" : fairValueFxRate}
                  placeholder="0"
                  onChange={(e) => {
                    setFairValueFxRate(e.target.value);
                    setIsDirty(true);
                  }}
                  onWheel={noScroll}
                />
              ) : (
                <div className="invFairStaticVal">{formatNumber(fairValueFxRate)}</div>
              )}
            </div>
            <div className="invFairCol">
              <div className="invFairLabel">Amount LC*</div>
              {isFairValueEditing ? (
                <input
                  className="invInputBase"
                  type="number"
                  step="any"
                  value={fairValueAmountLC === 0 ? "" : fairValueAmountLC}
                  placeholder="0"
                  onChange={(e) => {
                    setFairValueAmountLC(e.target.value);
                    setIsDirty(true);
                  }}
                  onWheel={noScroll}
                />
              ) : (
                <div className="invFairStaticVal">{formatNumber(fairValueAmountLC)}</div>
              )}
            </div>
          </div>

          <InvestmentFlowsTable
            flows={flows}
            onUpdate={handleUpdateFlow}
            onDelete={handleDeleteFlow}
            onAdd={handleAddFlow}
            flowTypes={transactionTypes.map(normalizeTransactionType).map((t) => t.name).filter(Boolean)}
          />

          <section className="inv-performance">
            <h4 className="invSectionHeader">Performance</h4>
            <div className="inv-performance-grid">
              {[
                { label: "Gross IRR €", value: irrEuro !== null ? formatPercent(irrEuro) : "-" },
                { label: "Gross IRR LC", value: irrLC !== null ? formatPercent(irrLC) : "-" },
                { label: "MOIC € (incl.)", value: formatMoic(moicInclEuro) },
                { label: "MOIC LC (incl.)", value: formatMoic(moicInclLC) },
                { label: "MOIC € (excl.)", value: formatMoic(moicExclEuro) },
                { label: "MOIC LC (excl.)", value: formatMoic(moicExclLC) },
              ].map(({ label, value }) => (
                <div className="perf-card" key={label}>
                  <div className="invCardTitle" title={label}>{label}</div>
                  <div className="invCardValue">{value}</div>
                </div>
              ))}
            </div>
          </section>
        </div>

        <PermissionGate>
          <div className="invDrawerFooter">
            <button className="invFooterBtn invBtnCancel" onClick={onClose}>Cancel</button>
            <button 
              className="invFooterBtn invBtnSave" 
              onClick={handleSave} 
              disabled={!isDirty || isMutating}
            >
              Save
            </button>
          </div>
        </PermissionGate>
      </aside>

      {deletePromptOpen && (
        <Prompt
          title="Delete investment"
          message={`Are you sure you want to delete "${headerName}"? This action cannot be undone.`}
          type="error"
          confirmLabel="Delete"
          cancelLabel="Cancel"
          onCancel={() => setDeletePromptOpen(false)}
          onConfirm={handleConfirmDeleteInvestment}
        />
      )}

      {isEditOpen && (
        <NewInvestmentModal
          mode="edit"
          initialValues={{
            name: currentInvestment?.name || "",
            sector: currentInvestment?.sector || "",
            countryId: currentInvestment?.countryId || currentInvestment?.country_id || "",
            countryName:
              currentInvestment?.country ||
              currentInvestment?.country_name ||
              currentInvestment?.countryName ||
              "",
            currencyId: currentInvestment?.currencyId || currentInvestment?.currency_id || "",
            currencyCode: currentInvestment?.currencyCode || "",
            currencyName: currentInvestment?.currencyName || "",
            ownership: ownershipValue || "",
          }}
          onClose={() => setIsEditOpen(false)}
          onSave={handleEditInvestment}
          countries={countries}
          currencies={currencies}
        />
      )}
    </div>
  );
}