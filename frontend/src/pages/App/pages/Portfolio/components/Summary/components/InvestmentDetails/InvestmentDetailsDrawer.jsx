import React, { useMemo, useState, useEffect, useRef, useCallback } from "react";
import { xirr as xirrLib } from "@webcarrot/xirr";
import { PermissionGate } from "../../../../../../../../hooks/Auth/PermissionGate";
import InvestmentFlowsTable from "./InvestmentFlowsTable";
import useApi from "../../../../../../../../hooks/api/useApi";
import { DoubleArrowLeftIcon } from "../../../../../../../../components/Icons/DirectionIcons";
import Prompt from "../../../../../../components/Toast/Prompt.jsx";
import NewInvestmentModal from "../NewInvestmentModal/NewInvestmentModal.jsx";
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
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
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

const countryISO = {
  "france": "fr", "germany": "de", "italy": "it", "netherlands": "nl",
  "uk": "gb", "united kingdom": "gb", "norway": "no", "spain": "es",
  "sweden": "se", "switzerland": "ch", "belgium": "be", "denmark": "dk",
  "usa": "us", "united states": "us", "austria": "at", "portugal": "pt",
  "finland": "fi", "poland": "pl", "ireland": "ie", "luxembourg": "lu",
  "czech republic": "cz", "hungary": "hu", "romania": "ro", "greece": "gr",
  "turkey": "tr", "russia": "ru", "china": "cn", "japan": "jp",
  "india": "in", "australia": "au", "canada": "ca", "brazil": "br",
  "mexico": "mx", "south africa": "za", "singapore": "sg", "south korea": "kr",
  "israel": "il", "uae": "ae", "united arab emirates": "ae",
};

const getFlagUrl = (country) => {
  if (!country) return null;
  const iso = countryISO[String(country).toLowerCase().trim()];
  return iso ? `https://flagcdn.com/40x30/${iso}.png` : null;
};

const EditIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const DeleteIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <polyline points="3 6 5 6 21 6" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M10 11v6M14 11v6" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export default function InvestmentDetailsDrawer({ investment, timeframe, fundId, onClose, onSaved, onUpdateInvestment, onDeleteInvestment }) {
  const api = useApi();
  const [currentInvestment, setCurrentInvestment] = useState(investment);
  console.log("currentInvestment", currentInvestment)
  const [flows, setFlows] = useState([]);
  console.log("flows", flows)
  const [fairValueFxRate, setFairValueFxRate] = useState(0);
  const [fairValueAmountLC, setFairValueAmountLC] = useState(0);
  const [fairValueId, setFairValueId] = useState(null);
  const [transactionTypes, setTransactionTypes] = useState([]);
  const [toast, setToast] = useState(null);
  const [deletePromptOpen, setDeletePromptOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isMutating, setIsMutating] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const flowIdRef = useRef(1);

  const headerCurrency =
    currentInvestment?.currency ||
    [
      currentInvestment?.currencyName,
      currentInvestment?.currencyCode ? `(${currentInvestment.currencyCode})` : "",
      currentInvestment?.currencySymbol,
    ].filter(Boolean).join(" ").trim() || "EUR €";

  const headerCountry = currentInvestment?.country || "Germany";
  const ownershipValue = toNumber(currentInvestment?.ownership);
  const headerOwnership = Number.isFinite(ownershipValue) && ownershipValue > 0
    ? `${ownershipValue.toFixed(2)}%` : "21.65%";
  const headerName = currentInvestment?.name || "Alyra";
  const headerSub = currentInvestment?.sector || currentInvestment?.sub || "BioTech";
  const headerTimeframe = timeframe?.display_label || null;
  const fairValueDateLabel = timeframe?.rawDate || timeframe?.date || "";
  const sourceInvestmentId =
    investment?.id ?? investment?.investment_id ?? investment?.investmentId ?? null;
  const investmentId =
    currentInvestment?.id ?? currentInvestment?.investment_id ?? currentInvestment?.investmentId ?? null;

  useEffect(() => {
    setCurrentInvestment(investment);
  }, [investment]);

  const refreshInvestmentDetails = useCallback(async () => {
    if (!fundId || !sourceInvestmentId) return null;
    const data = await api.get(`/api/funds/${fundId}/portfolio-investments/${sourceInvestmentId}/`);
    setCurrentInvestment(data);
    return data;
  }, [api, fundId, sourceInvestmentId]);

  useEffect(() => {
    refreshInvestmentDetails().catch((err) => {
      console.error("Failed to reload investment details:", err.message);
    });
  }, [refreshInvestmentDetails]);

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
      divestmentPercentage: flow.divestment_percentage ?? flow.divestmentPercentage ?? null,
    };
  }, [makeLocalFlowId]);

  useEffect(() => {
    if (!currentInvestment) return;
    const rawFlows = currentInvestment.transaction_flows || [];
    setFlows(rawFlows.map(mapFlowFromApi));
    if (!fairValueDateLabel) {
      setFairValueId(null); setFairValueFxRate(0); setFairValueAmountLC(0); return;
    }
    const rawFairValues = currentInvestment.fair_value_flows || [];
    const match = rawFairValues.find((fv) => String(fv.date) === String(fairValueDateLabel));
    if (match) {
      setFairValueId(match.fair_value_id ?? match.id ?? null);
      setFairValueFxRate(match.fx_rate ?? match.fxRate ?? 0);
      setFairValueAmountLC(match.amount_lc ?? match.amountLC ?? 0);
    } else {
      setFairValueId(null); setFairValueFxRate(0); setFairValueAmountLC(0);
    }
  }, [currentInvestment, fairValueDateLabel, mapFlowFromApi]);

  const fairValueAmount = useMemo(() => {
    return toNumber(fairValueAmountLC) / toNumber(fairValueFxRate);
  }, [fairValueFxRate, fairValueAmountLC]);

  const normalizeAmountLC = (flow) => {
    const lc = toNumber(flow.amountLC);
    const type = canonicalType(flow.type);
    if (type === "Investment") return -Math.abs(lc);
    return Math.abs(lc);
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
        return { date: new Date(f.date), amount: fx ? lc / fx : 0 };
      })
      .filter((c) => Number.isFinite(c.amount) && c.amount !== 0)
      .sort((a, b) => a.date - b.date);
    if (fairValueDateLabel) {
      const fvDate = new Date(fairValueDateLabel);
      if (!Number.isNaN(fvDate.getTime())) {
        const fvAmount = toNumber(fairValueAmount);
        if (Number.isFinite(fvAmount) && fvAmount !== 0) cashflows.push({ date: fvDate, amount: fvAmount });
      }
    }
    return safeXirr(cashflows);
  }, [flows, fairValueDateLabel, fairValueAmount]);

  const irrLC = useMemo(() => {
    const cashflows = flows
      .filter((f) => f.date)
      .map((f) => ({ date: new Date(f.date), amount: normalizeAmountLC(f) }))
      .filter((c) => Number.isFinite(c.amount) && c.amount !== 0)
      .sort((a, b) => a.date - b.date);
    if (fairValueDateLabel) {
      const fvDate = new Date(fairValueDateLabel);
      if (!Number.isNaN(fvDate.getTime())) {
        const fvAmount = toNumber(fairValueAmountLC);
        if (Number.isFinite(fvAmount) && fvAmount !== 0) cashflows.push({ date: fvDate, amount: fvAmount });
      }
    }
    return safeXirr(cashflows);
  }, [flows, fairValueDateLabel, fairValueAmountLC]);

  const investmentEuro = Math.abs(sumsByTypeEuro.Investment || 0);
  const investmentLC = Math.abs(sumsByTypeLC.Investment || 0);
  const moicInclEuro = investmentEuro > 0
    ? (sumsByTypeEuro.Dividend + sumsByTypeEuro.Interest + sumsByTypeEuro.Other + sumsByTypeEuro.Divestment) / investmentEuro : 0;

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
  const moicInclLC = firstInvestmentAmountLC > 0 ? toNumber(fairValueAmountLC) / firstInvestmentAmountLC : 0;
  const moicExclEuro = toNumber(fairValueAmount) > 0
    ? (sumsByTypeEuro.Divestment + investmentEuro) / toNumber(fairValueAmount) : 0;
  const moicExclLC = toNumber(fairValueAmountLC) > 0
    ? (sumsByTypeLC.Divestment + investmentLC) / toNumber(fairValueAmountLC) : 0;

  const handleAddFlow = () => {
    setFlows((prev) => [
      ...prev,
      { id: makeLocalFlowId(), flowId: null, date: "", amountLC: 0, fxRate: 0, type: "Investment", divestmentPercentage: null },
    ]);
  };

  const handleUpdateFlow = (id, field, value) => {
    setFlows((prev) => prev.map((f) => (f.id === id ? { ...f, [field]: value } : f)));
  };

  const handleDeleteFlow = async (id) => {
    const targetFlow = flows.find((f) => f.id === id);
    if (!targetFlow) return;

    if (!targetFlow.flowId) {
      setFlows((prev) => prev.filter((f) => f.id !== id));
      return;
    }

    try {
      await api.delete(`/api/funds/${fundId}/portfolio-investments/${investmentId}/flows/${targetFlow.flowId}/`);
      setFlows((prev) => prev.filter((f) => f.id !== id));
      await refreshInvestmentDetails();
    } catch (err) {
      setToast({
        type: "error",
        title: "Delete failed",
        message: err.message || "Could not delete the flow.",
      });
    }
  };

  const handleEditInvestment = async (payload) => {
    if (!investmentId || typeof onUpdateInvestment !== "function") {
      setToast({ type: "error", title: "Update failed", message: "Investment update is not available." });
      return;
    }

    try {
      setIsMutating(true);
      await onUpdateInvestment(investmentId, payload);
      setIsEditOpen(false);
      onClose();
    } catch (err) {
      setToast({
        type: "error",
        title: "Update failed",
        message: err.message || "Could not update the investment.",
      });
    } finally {
      setIsMutating(false);
    }
  };

  const handleConfirmDeleteInvestment = async () => {
    if (!investmentId || typeof onDeleteInvestment !== "function") {
      setDeletePromptOpen(false);
      setToast({ type: "error", title: "Delete failed", message: "Investment deletion is not available." });
      return;
    }

    try {
      setIsMutating(true);
      await onDeleteInvestment(investmentId);
      setDeletePromptOpen(false);
      setToast({
        type: "success",
        title: "Investment deleted",
        message: "The investment has been removed.",
      });
    } catch (err) {
      setDeletePromptOpen(false);
      setToast({
        type: "error",
        title: "Delete failed",
        message: err.message || "Could not delete the investment.",
      });
      setIsMutating(false);
    }
  };

  const handleSave = async () => {
    try {
      if (!fundId || !investmentId) throw new Error("Missing fund or investment id");
      if (!Number.isFinite(Number(investmentId))) {
        setToast({ type: "error", message: "Please save the investment first." }); return;
      }
      if (!transactionTypes.length) {
        setToast({ type: "error", message: "Transaction types not loaded yet." }); return;
      }
      const normalizeType = (t) => String(t || "").trim().toLowerCase();
      const typeMap = new Map(
        transactionTypes.map(normalizeTransactionType).filter((t) => t.id && t.name).map((t) => [normalizeType(t.name), t.id])
      );
      const validFlows = flows.filter((f) => {
        const fx = toNumber(f.fxRate);
        const lc = toNumber(f.amountLC);
        return Boolean(f.date) && Boolean(f.type) && fx > 0 && Number.isFinite(lc);
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
          if (divestmentPct === null || divestmentPct === "") throw new Error("divestment_percentage required for Partial divestment");
          const pct = toNumber(divestmentPct);
          if (!Number.isFinite(pct) || pct < 0 || pct > 9.9999) throw new Error("divestment_percentage must be between 0 and 9.9999");
        }
        const isUpdate = Boolean(f.flowId);
        const endpoint = isUpdate
          ? `/api/funds/${fundId}/portfolio-investments/${investmentId}/flows/${f.flowId}/`
          : `/api/funds/${fundId}/portfolio-investments/${investmentId}/flows/`;
        const payload = {
          transaction_id: transactionId, date: f.date, amount_lc: amountLC,
          fx_rate: fxRate, amount: amountEuro,
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
      if (!requests.length) { setToast({ type: "error", message: "No valid flows to save." }); return; }
      await Promise.all(requests);
      await refreshInvestmentDetails();
      if (onSaved) await onSaved();
      onClose();
    } catch (err) {
      console.error("Save failed:", err.message);
      setToast({ type: "error", message: err.message || "Failed to save." });
    }
  };

  const flagUrl = getFlagUrl(headerCountry);

  return (
    <div className="invDrawerOverlay" onClick={onClose}>
      <aside
        className={`invDrawerPanel${expanded ? " share-drawer--expanded" : ""}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <div className="invDrawerHeader">
          <button className="invBackBtn" onClick={() => setExpanded((v) => !v)} title={expanded ? "Collapse" : "Expand"}>
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
                <span className="invMetaValue">{headerCurrency}</span>
              </div>
              <div className="invMetaItem">
                <span className="invMetaLabel">Country</span>
                <span className="invMetaValue">
                  {flagUrl && (
                    <img
                      src={flagUrl}
                      alt={headerCountry}
                      style={{ width: 20, height: 20, borderRadius: "50%", objectFit: "cover", border: "none", boxShadow: "none" }}
                    />
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
                <button
                  className="invActionIcon"
                  title="Edit"
                  onClick={() => setIsEditOpen(true)}
                  disabled={isMutating}
                >
                  <EditIcon />
                </button>
                <button
                  className="invActionIcon"
                  title="Delete"
                  onClick={() => setDeletePromptOpen(true)}
                  disabled={isMutating}
                >
                  <DeleteIcon />
                </button>
              </div>
            </PermissionGate>
          </div>
        </div>

        {/* ── Body ── */}
        <div className="invDrawerBody">
          <div className="invSectionHeader">Flows</div>

          <div className="invCardsRow">
            {[
              { label: "Investment",  value: sumsByType.Investment },
              { label: "Dividends",   value: sumsByType.Dividend },
              { label: "Interests",   value: sumsByType.Interest },
              { label: "Other",       value: sumsByType.Other },
              { label: "Divestment",  value: sumsByType.Divestment },
            ].map(({ label, value }) => (
              <div className="invSummaryCard" key={label}>
                <div className="invCardTitle">{label}</div>
                <div className="invCardValue">
                  {value > 0 ? formatMoney(value) : `- €`}
                </div>
              </div>
            ))}
          </div>

          <div className="invFairBox">
            <div className="invFairCol" style={{ maxWidth: "160px" }}>
              <div className="invFairLabel">Fair Value</div>
              <div className="invFairStaticVal">{fairValueDateLabel || "-"}</div>
            </div>
            <div className="invFairCol">
              <div className="invFairLabel">Amount</div>
              <div className="invFairStaticVal">{formatMoney(fairValueAmount, "")}</div>
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
            flowTypes={transactionTypes.map(normalizeTransactionType).map((t) => t.name).filter(Boolean)}
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

        <PermissionGate>
          <div className="invDrawerFooter">
            <button className="invFooterBtn invBtnCancel" onClick={onClose}>Cancel</button>
            <button className="invFooterBtn invBtnSave" onClick={handleSave}>Save</button>
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
            countryName: currentInvestment?.country || currentInvestment?.countryName || "",
            currencyId: currentInvestment?.currencyId || currentInvestment?.currency_id || "",
            currencyCode: currentInvestment?.currencyCode || "",
            currencyName: currentInvestment?.currencyName || "",
            ownership: ownershipValue || "",
          }}
          onClose={() => setIsEditOpen(false)}
          onSave={handleEditInvestment}
        />
      )}

      {toast && (
        <div className={`toast toast-${toast.type} toast-inv`}>
          <span>{toast.message}</span>
          <button className="toast-close" onClick={() => setToast(null)} aria-label="Close">×</button>
        </div>
      )}
    </div>
  );
}