import React, { useMemo, useState, useEffect, useRef, useCallback } from "react";
import { xirr as xirrLib } from "@webcarrot/xirr";
import InvestmentFlowsTable from "./InvestmentFlowsTable";
import "./InvestmentDetails.css";
import { API_BASE_URL } from "../../../../../../hooks/useApi";


const BackIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path fill-rule="evenodd" clip-rule="evenodd" d="M9.75527 5.24408C10.0807 5.56951 10.0807 6.09715 9.75527 6.42259L6.17786 10L9.75527 13.5774C10.0807 13.9028 10.0807 14.4305 9.75527 14.7559C9.42983 15.0814 8.9022 15.0814 8.57676 14.7559L4.41009 10.5893C4.08466 10.2638 4.08466 9.73618 4.41009 9.41074L8.57676 5.24408C8.9022 4.91864 9.42983 4.91864 9.75527 5.24408ZM15.5886 5.24408C15.914 5.56951 15.914 6.09715 15.5886 6.42259L12.0112 10L15.5886 13.5774C15.914 13.9028 15.914 14.4305 15.5886 14.7559C15.2632 15.0814 14.7355 15.0814 14.4101 14.7559L10.2434 10.5893C9.91799 10.2638 9.91799 9.73618 10.2434 9.41074L14.4101 5.24408C14.7355 4.91864 15.2632 4.91864 15.5886 5.24408Z" fill="#375A89"/>
  </svg>
);

const EditIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path fill-rule="evenodd" clip-rule="evenodd" d="M13.5774 1.91099C14.8234 0.665084 16.8434 0.665086 18.0893 1.911C19.3352 3.15691 19.3352 5.17693 18.0893 6.42284L7.08403 17.4281C7.07006 17.442 7.05622 17.4559 7.04249 17.4697C6.83841 17.6741 6.65839 17.8544 6.4445 17.9954C6.25645 18.1194 6.05251 18.2174 5.8382 18.2868C5.59444 18.3657 5.34118 18.3937 5.05407 18.4253C5.03476 18.4275 5.0153 18.4296 4.99567 18.4318L2.17536 18.7452C1.92376 18.7731 1.67309 18.6852 1.49408 18.5062C1.31508 18.3272 1.22715 18.0765 1.2551 17.8249L1.56847 15.0046C1.57065 14.985 1.5728 14.9655 1.57493 14.9462C1.6066 14.6591 1.63453 14.4058 1.71344 14.1621C1.78282 13.9478 1.88084 13.7438 2.00485 13.5558C2.14589 13.3419 2.3262 13.1618 2.53061 12.9578C2.54436 12.944 2.55822 12.9302 2.57219 12.9162L13.5774 1.91099ZM16.9108 3.08951C16.3157 2.49447 15.351 2.49447 14.756 3.08951L3.7507 14.0947C3.48195 14.3635 3.43205 14.4189 3.39623 14.4733C3.35489 14.536 3.32222 14.6039 3.29909 14.6754C3.27905 14.7373 3.26692 14.8109 3.22494 15.1886L3.02661 16.9737L4.81162 16.7753C5.18937 16.7333 5.26297 16.7212 5.32489 16.7012C5.39632 16.678 5.4643 16.6454 5.52699 16.604C5.58132 16.5682 5.63677 16.5183 5.90552 16.2496L16.9108 5.24433C17.5058 4.64929 17.5058 3.68455 16.9108 3.08951Z" fill="#375A89"/>
  </svg>
);

const TrashIcon = () => (
  <svg width="17" height="17" viewBox="0 0 17 17" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path fill-rule="evenodd" clip-rule="evenodd" d="M5 0.833333C5 0.373096 5.3731 0 5.83333 0H10.8333C11.2936 0 11.6667 0.373096 11.6667 0.833333C11.6667 1.29357 11.2936 1.66667 10.8333 1.66667H5.83333C5.3731 1.66667 5 1.29357 5 0.833333ZM2.49354 2.5H0.833333C0.373096 2.5 0 2.8731 0 3.33333C0 3.79357 0.373096 4.16667 0.833333 4.16667H1.72037L2.25512 12.1879C2.29708 12.8174 2.3318 13.3384 2.39406 13.7624C2.45888 14.2039 2.56171 14.6073 2.77591 14.9833C3.10936 15.5687 3.61232 16.0392 4.21852 16.333C4.60794 16.5217 5.01733 16.5975 5.46216 16.6328C5.8894 16.6667 6.41152 16.6667 7.04245 16.6667H9.62422C10.2551 16.6667 10.7773 16.6667 11.2045 16.6328C11.6493 16.5975 12.0587 16.5217 12.4481 16.333C13.0543 16.0392 13.5573 15.5687 13.8908 14.9833C14.105 14.6073 14.2078 14.2039 14.2726 13.7624C14.3349 13.3383 14.3696 12.8173 14.4116 12.1878L14.9463 4.16667H15.8333C16.2936 4.16667 16.6667 3.79357 16.6667 3.33333C16.6667 2.8731 16.2936 2.5 15.8333 2.5H14.1731C14.1683 2.49996 14.1634 2.49996 14.1585 2.5H2.50812C2.50327 2.49996 2.49841 2.49996 2.49354 2.5ZM13.2759 4.16667H3.39074L3.91589 12.044C3.96062 12.7148 3.99154 13.1695 4.04305 13.5203C4.09308 13.861 4.1542 14.0357 4.22406 14.1583C4.39079 14.451 4.64227 14.6863 4.94537 14.8332C5.07237 14.8947 5.25071 14.9441 5.59405 14.9713C5.94752 14.9994 6.40321 15 7.07555 15H9.59112C10.2635 15 10.7191 14.9994 11.0726 14.9713C11.416 14.9441 11.5943 14.8947 11.7213 14.8332C12.0244 14.6863 12.2759 14.451 12.4426 14.1583C12.5125 14.0357 12.5736 13.861 12.6236 13.5203C12.6751 13.1695 12.7061 12.7148 12.7508 12.044L13.2759 4.16667ZM6.66667 6.25C7.1269 6.25 7.5 6.6231 7.5 7.08333V11.25C7.5 11.7102 7.1269 12.0833 6.66667 12.0833C6.20643 12.0833 5.83333 11.7102 5.83333 11.25V7.08333C5.83333 6.6231 6.20643 6.25 6.66667 6.25ZM10 6.25C10.4602 6.25 10.8333 6.6231 10.8333 7.08333V11.25C10.8333 11.7102 10.4602 12.0833 10 12.0833C9.53976 12.0833 9.16667 11.7102 9.16667 11.25V7.08333C9.16667 6.6231 9.53976 6.25 10 6.25Z" fill="#375A89"/>
  </svg>
);
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
    console.log("cashflows", cashflows)
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

const normalizeAmountLC = (flow) => {
  const lc = toNumber(flow.amountLC);
  const type = canonicalType(flow.type);
  if (type === "Investment") return -Math.abs(lc);
  if (type === "Dividend" || type === "Interest" || type === "Other" || type === "Divestment" || type === "Partial divestment") {
    return Math.abs(lc);
  }
  // Fallback: keep original sign from backend for unknown transaction names.
  return lc;
};

// Consolidated KPI calculation function
const calculateKPIs = (flows, fairValueAmount, fairValueAmountLC, fairValueDateLabel) => {
  // Sum by type (€)
  const sumsByTypeEuro = flows.reduce((acc, f) => {
    const t = canonicalType(f.type);
    const lc = Math.abs(toNumber(f.amountLC));
    const fx = toNumber(f.fxRate);
    const eur = fx ? lc / fx : 0;
    if (acc[t] !== undefined) acc[t] += eur;
    return acc;
  }, { Investment: 0, Dividend: 0, Interest: 0, Other: 0, Divestment: 0 });

  // Sum by type (LC)
  const sumsByTypeLC = flows.reduce((acc, f) => {
    const t = canonicalType(f.type);
    const lc = Math.abs(toNumber(f.amountLC));
    if (acc[t] !== undefined) acc[t] += lc;
    return acc;
  }, { Investment: 0, Dividend: 0, Interest: 0, Other: 0, Divestment: 0 });

  // First investment flow
  const firstInvestmentFlow = flows
    .filter((f) => canonicalType(f.type) === "Investment")
    .sort((a, b) => {
      if (!a.date && !b.date) return 0;
      if (!a.date) return 1;
      if (!b.date) return -1;
      return new Date(a.date) - new Date(b.date);
    })[0] || null;

  const firstInvestmentAmountLC = Math.abs(toNumber(firstInvestmentFlow?.amountLC));

  // IRR €
  const cashflowsEuro = flows
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
    if (!Number.isNaN(fvDate.getTime()) && Number.isFinite(toNumber(fairValueAmount)) && toNumber(fairValueAmount) !== 0) {
      cashflowsEuro.push({ date: fvDate, amount: toNumber(fairValueAmount) });
    }
  }

  const irrEuro = safeXirr(cashflowsEuro);

  // IRR LC
  const cashflowsLC = flows
    .filter((f) => f.date)
    .map((f) => ({ date: new Date(f.date), amount: normalizeAmountLC(f) }))
    .filter((c) => Number.isFinite(c.amount) && c.amount !== 0)
    .sort((a, b) => a.date - b.date);

  if (fairValueDateLabel) {
    const fvDate = new Date(fairValueDateLabel);
    if (!Number.isNaN(fvDate.getTime()) && Number.isFinite(toNumber(fairValueAmountLC)) && toNumber(fairValueAmountLC) !== 0) {
      cashflowsLC.push({ date: fvDate, amount: toNumber(fairValueAmountLC) });
    }
  }

  const irrLC = safeXirr(cashflowsLC);

  // MOIC calculations
  const investmentEuro = Math.abs(sumsByTypeEuro.Investment || 0);
  const investmentLC = Math.abs(sumsByTypeLC.Investment || 0);

  const moicInclEuro = investmentEuro > 0
    ? (sumsByTypeEuro.Dividend + sumsByTypeEuro.Interest + sumsByTypeEuro.Other + sumsByTypeEuro.Divestment) / investmentEuro
    : 0;

  const moicInclLC = firstInvestmentAmountLC > 0
    ? toNumber(fairValueAmountLC) / firstInvestmentAmountLC
    : 0;

  const moicExclEuro = toNumber(fairValueAmount) > 0
    ? (sumsByTypeEuro.Divestment + investmentEuro) / toNumber(fairValueAmount)
    : 0;

  const moicExclLC = toNumber(fairValueAmountLC) > 0
    ? (sumsByTypeLC.Divestment + investmentLC) / toNumber(fairValueAmountLC)
    : 0;

  return {
    irrEuro,
    irrLC,
    moicInclEuro,
    moicInclLC,
    moicExclEuro,
    moicExclLC,
    sumsByTypeEuro,
    sumsByTypeLC,
  };
};

export default function InvestmentDetailsDrawer({ investment, timeframe, fundId, onClose, onSaved }) {
  
  const [flows, setFlows] = useState([]);
  const [fairValueFxRate, setFairValueFxRate] = useState(0);
  const [fairValueAmountLC, setFairValueAmountLC] = useState(0);
  const [fairValueId, setFairValueId] = useState(null);
  const [transactionTypes, setTransactionTypes] = useState([]);
  const [toast, setToast] = useState(null);
  const flowIdRef = useRef(1);

  // 2. Read from Props (External Source) with fallbacks
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
  const headerCountry = investment?.country || "Germany"; // Could be Egypt based on image, using props makes it dynamic
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

  useEffect(() => {
    const fetchTypes = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/portfolio-transaction-types/`);
        if (!res.ok) throw new Error("Failed to fetch transaction types");
        const data = await res.json();
        setTransactionTypes(data);
      } catch (err) {
        console.error("Transaction types fetch failed:", err);
      }
    };
    fetchTypes();
  }, []);

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

  const loadInvestmentData = useCallback(async () => {
    if (!fundId || !investmentId) return;
    try {
      const flowsRes = await fetch(
        `${API_BASE_URL}/api/funds/${fundId}/portfolio-investments/${investmentId}/flows/`
      );
      if (flowsRes.ok) {
        const flowsData = await flowsRes.json();
        const mapped =
          Array.isArray(flowsData) && flowsData.length
            ? flowsData.map(mapFlowFromApi)
            : [];
        setFlows(mapped);
      } else {
        setFlows([]);
      }

      if (!fairValueDateLabel) {
        setFairValueId(null);
        setFairValueFxRate(0);
        setFairValueAmountLC(0);
        return;
      }

      const fairRes = await fetch(
        `${API_BASE_URL}/api/funds/${fundId}/portfolio-investments/${investmentId}/fair-values/`
      );
      if (!fairRes.ok) {
        setFairValueId(null);
        setFairValueFxRate(0);
        setFairValueAmountLC(0);
        return;
      }

      const fairData = await fairRes.json();
      const fairRows = Array.isArray(fairData) ? fairData : [];
      const match = fairRows.find(
        (fv) => String(fv.date) === String(fairValueDateLabel)
      );

      if (match) {
        setFairValueId(match.fair_value_id ?? match.id ?? null);
        setFairValueFxRate(match.fx_rate ?? match.fxRate ?? 0);
        setFairValueAmountLC(match.amount_lc ?? match.amountLC ?? 0);
      } else {
        // No fair value for this timeframe => start fresh (fair value only)
        setFairValueId(null);
        setFairValueFxRate(0);
        setFairValueAmountLC(0);
      }
    } catch (err) {
      console.error("Load investment details failed:", err);
      setFlows([]);
      setFairValueId(null);
      setFairValueFxRate(0);
      setFairValueAmountLC(0);
    }
  }, [fundId, investmentId, fairValueDateLabel, mapFlowFromApi]);

  useEffect(() => {
    loadInvestmentData();
  }, [loadInvestmentData]);

  // 3. Dynamic Calculations: Fair Value Amount (€)
  const fairValueAmount = useMemo(() => {
    return toNumber(fairValueFxRate) * toNumber(fairValueAmountLC);
  }, [fairValueFxRate, fairValueAmountLC]);

  // 4. Calculate all KPIs using consolidated function
  const kpis = useMemo(() => {
    return calculateKPIs(flows, fairValueAmount, fairValueAmountLC, fairValueDateLabel);
  }, [flows, fairValueAmount, fairValueAmountLC, fairValueDateLabel]);

  // Extract sumsByType for the summary cards
  const sumsByType = useMemo(() => {
    return Object.fromEntries(
      Object.entries(kpis.sumsByTypeEuro).map(([type, value]) => [type, value])
    );
  }, [kpis.sumsByTypeEuro]);

  // Handlers
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

  const handleSave = async () => {
    // Logic to save flows, fairValue, etc.
    try {
      if (!fundId || !investmentId) {
        throw new Error("Missing fund or investment id");
      }
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

      console.log(
        "[InvestmentDetails] flow types before save:",
        flows.map((f) => ({ id: f.id, type: f.type, divestmentPercentage: f.divestmentPercentage }))
      );

      const flowRequests = validFlows.map((f) => {
        const transactionId = typeMap.get(normalizeType(f.type));
        if (!transactionId) {
          throw new Error(`Unknown transaction type: ${f.type}`);
        }
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
        const url = isUpdate
          ? `${API_BASE_URL}/api/funds/${fundId}/portfolio-investments/${investmentId}/flows/${f.flowId}/`
          : `${API_BASE_URL}/api/funds/${fundId}/portfolio-investments/${investmentId}/flows/`;
        return fetch(url, {
          method: isUpdate ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            transaction_id: transactionId,
            date: f.date,
            amount_lc: amountLC,
            fx_rate: fxRate,
            amount: amountEuro,
            divestment_percentage: isPartial ? round6(toNumber(divestmentPct)) : null,
          }),
        });
      });

      const requests = [...flowRequests];
      if (fairValueDateLabel) {
        requests.push(
          fetch(
            fairValueId
              ? `${API_BASE_URL}/api/funds/${fundId}/portfolio-investments/${investmentId}/fair-values/${fairValueId}/`
              : `${API_BASE_URL}/api/funds/${fundId}/portfolio-investments/${investmentId}/fair-values/`,
            {
              method: fairValueId ? "PUT" : "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                date: fairValueDateLabel,
                amount_lc: round6(toNumber(fairValueAmountLC)),
                fx_rate: round6(toNumber(fairValueFxRate)),
                amount: round6(toNumber(fairValueAmount)),
              }),
            }
          )
        );
      }

      if (!requests.length) {
        setToast({ type: "error", message: "No valid flows to save." });
        return;
      }

      const responses = await Promise.all(requests);
      const bad = responses.find((r) => !r.ok);
      if (bad) {
        const text = await bad.text();
        console.error("Save failed:", text);
        setToast({ type: "error", message: "Failed to save investment details." });
        return;
      }
    } catch (err) {
      console.error("Save investment details failed:", err);
      setToast({ type: "error", message: "Failed to save investment details." });
      return;
    }
    await loadInvestmentData();
    if (onSaved) {
      await onSaved();
    }
    onClose();
  };

  return (
    <div className="invDrawerOverlay" onClick={onClose}>
      <aside className="invDrawerPanel" onClick={(e) => e.stopPropagation()}>
        
        {/* ===== HEADER (Dynamic from Props) ===== */}
        <div className="invDrawerHeader">
          <button className="invBackBtn" onClick={onClose}><BackIcon/></button>
          
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
              <button className="invActionIcon" title="Edit"><EditIcon/></button>
              <button className="invActionIcon" title="Delete"><TrashIcon/></button>
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

          {/* Table (Fully Interactive) */}
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
{/* ===== Performance ===== */}
<section className="inv-performance">
  <h4 className="inv-performance-title">Performance</h4>

  <div className="inv-performance-grid">
    <div className="perf-card">
      <span>Gross IRR €</span>
      <strong>{kpis.irrEuro !== null ? formatPercent(kpis.irrEuro) : "-"}</strong>
    </div>

    <div className="perf-card">
      <span>Gross IRR LC</span>
      <strong>{kpis.irrLC !== null ? formatPercent(kpis.irrLC) : "-"}</strong>
    </div>

    <div className="perf-card">
      <span>MOIC € (incl. dividends)</span>
      <strong>{`${formatRatio(kpis.moicInclEuro)}x`}</strong>
    </div>

    <div className="perf-card">
      <span>MOIC LC (incl. dividends)</span>
      <strong>{`${formatRatio(kpis.moicInclLC)}x`}</strong>
    </div>

    <div className="perf-card">
      <span>MOIC € (excl. dividends)</span>
      <strong>{`${formatRatio(kpis.moicExclEuro)}x`}</strong>
    </div>

    <div className="perf-card">
      <span>MOIC LC (excl. dividends)</span>
      <strong>{`${formatRatio(kpis.moicExclLC)}x`}</strong>
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