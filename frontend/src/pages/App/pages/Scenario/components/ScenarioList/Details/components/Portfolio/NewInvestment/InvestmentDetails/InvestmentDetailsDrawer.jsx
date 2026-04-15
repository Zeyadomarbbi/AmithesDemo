import React, { useMemo, useState, useEffect, useRef, useCallback } from "react";
import { xirr as xirrLib } from "@webcarrot/xirr";
import { PermissionGate } from "../../../../../../../../../../../hooks/Auth/PermissionGate";
import InvestmentFlowsTable from "./InvestmentFlowsTable";
import { DoubleArrowLeftIcon } from "/src/components/Icons/DirectionIcons";
import { EditIcon, DeleteIcon } from "/src/components/Icons/InteractiveIcons";
import { usePortfolioFlows } from "../../../../../../../../../hooks/Portfolio/usePortfolioFlows";
import { useNumberFormatter, usePercentageFormatter } from "../../../../../../../../../../../components/useFormatter.js";
import Toast from "../../../../../../../../../components/Toast/Toast.jsx";
import Prompt from "../../../../../../../../../components/Toast/Prompt.jsx";
import NewInvestmentModal from "../NewInvestmentPopup/NewInvestmentModal.jsx";
import "/src/pages/App/pages/Portfolio/components/Summary/components/InvestmentDetails/InvestmentDetails.css";

const FLOW_TYPES = ["Investment", "Dividend", "Interest", "Other", "Divestment"];

const noop = () => {};

const toNumber = (v) => {
  if (typeof v === "number") return v;
  const str = String(v ?? "").replace(/[^0-9.-]/g, "");
  const n = parseFloat(str);
  return Number.isFinite(n) ? n : 0;
};

const formatRatio = (n) => (!Number.isFinite(n) ? "-" : n.toFixed(2));

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
  if (t.includes("partial") && t.includes("divest")) return "Divestment";
  if (t.includes("divest")) return "Divestment";
  if (t.includes("invest")) return "Investment";
  return "Other";
};

const round6 = (n) => {
  const v = Number(n);
  return Number.isFinite(v) ? Number(v.toFixed(6)) : 0;
};

const bruteXirr = (cashflows) => {
  const npv = (r) =>
    cashflows.reduce((sum, cf) => {
      const t = (cf.date - cashflows[0].date) / (365 * 24 * 3600 * 1000);
      return sum + cf.amount / Math.pow(1 + r, t);
    }, 0);

  let low = -0.999;
  let high = 1;

  for (let i = 0; i < 100; i++) {
    const mid = (low + high) / 2;
    const val = npv(mid);

    if (Math.abs(val) < 1e-6) return mid;
    if (val > 0) low = mid;
    else high = mid;
  }

  return null;
};

const safeXirr = (cashflows) => {
  try {
    return xirrLib(cashflows);
  } catch {
    return bruteXirr(cashflows);
  }
};

export default function InvestmentDetailsDrawer({
  investment,
  fundId,
  scenarioId,
  onClose,
  onSaved,
  onUpdateInvestment,
  onDeleteInvestment,
  transactionTypes,
  exitDate,
  exitValue,
  countries,
  currencies,
  showToast = noop,
}) {
  const investmentId = investment?.id ?? investment?.investment_id ?? null;
  const isRealInvestment = investment?.scenario_id === null;
  const {
    flows: apiFlows,
    fetchFlows,
    createFlow,
    updateFlow,
    deleteFlow,
    loading: flowsLoading,
  } = usePortfolioFlows(fundId, investmentId);

  const [localFlows, setLocalFlows] = useState([]);
  const [exitFxRate, setExitFxRate] = useState(1);
  const [toast, setToast] = useState(null);
  const [deletePromptOpen, setDeletePromptOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isMutating, setIsMutating] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const flowIdRef = useRef(1);

  const formatNumber  = useNumberFormatter();
  const formatPercent = usePercentageFormatter();
  const noScroll = (e) => e.target.blur();

  const headerCurrency = useMemo(() => {
    const id = investment?.currencyId || investment?.currency_id;
    const match = currencies?.find((c) => Number(c.id) === Number(id));
    const code = match?.code || investment?.currency_code || investment?.currency || "EUR";
    const symbol = match?.symbol;
    return symbol ? `${code} (${symbol})` : code;
  }, [investment, currencies]);

  const headerCountry  = investment?.country_name || investment?.country || "-";
  const ownershipValue = toNumber(investment?.ownership);
  const headerOwnership = Number.isFinite(ownershipValue) && ownershipValue > 0
    ? `${ownershipValue.toFixed(2)}%`
    : "-";
  const headerName = investment?.name || "Deal Name";
  const headerSub  = investment?.sector || investment?.sub || "";

  const getFlagUrl = useCallback((countryNameOrId) => {
    if (!countryNameOrId || !countries) return null;
    const countryData = countries.find(
      (c) =>
        String(c.name).toLowerCase() === String(countryNameOrId).toLowerCase() ||
        Number(c.id) === Number(countryNameOrId)
    );
    if (!countryData?.iso2) return null;
    return `https://flagcdn.com/40x30/${countryData.iso2.toLowerCase()}.png`;
  }, [countries]);

  const normalizeTransactionType = useCallback((t) => {
    if (!t) return { id: null, name: "" };
    const name = t.transaction_name ?? t.name ?? "";
    const id   = t.id ?? t.transaction_id ?? null;
    return { id, name: String(name || "").trim() };
  }, []);

  const makeLocalFlowId = useCallback(() => {
    const id = `tmp-${Date.now()}-${flowIdRef.current}`;
    flowIdRef.current += 1;
    return id;
  }, []);

  const mapFlowFromApi = useCallback((flow) => ({
    id: flow.id || flow.flow_id || makeLocalFlowId(),
    flowId: flow.id || flow.flow_id || null,
    date: flow.date || "",
    amountLC: flow.amount_lc || 0,
    fxRate: flow.fx_rate || 1,
    type: flow.transaction_name || "Investment",
    divestmentPercentage: flow.divestment_percentage ?? null,
    isReal: flow.scenario_id === null,
    isScenarioCreated: !!flow.scenario_id,
  }), [makeLocalFlowId]);

  useEffect(() => {
    if (scenarioId) fetchFlows(scenarioId);
  }, [scenarioId, fetchFlows]);

  useEffect(() => {
    setLocalFlows(apiFlows.map(mapFlowFromApi));
  }, [apiFlows, mapFlowFromApi]);

  const exitValueLC = useMemo(
    () => toNumber(exitValue) * toNumber(exitFxRate),
    [exitValue, exitFxRate]
  );

  const sumsByTypeLC = useMemo(() => {
    const sums = { Investment: 0, Dividend: 0, Interest: 0, Other: 0, Divestment: 0 };
    localFlows.forEach((f) => {
      const t = canonicalType(f.type);
      if (sums[t] !== undefined) sums[t] += Math.abs(toNumber(f.amountLC));
    });
    sums.Divestment += toNumber(exitValueLC);
    return sums;
  }, [localFlows, exitValueLC]);

  const sumsByTypeEuro = useMemo(() => {
    const sums = { Investment: 0, Dividend: 0, Interest: 0, Other: 0, Divestment: 0 };
    localFlows.forEach((f) => {
      const t  = canonicalType(f.type);
      const fx = toNumber(f.fxRate);
      const eur = fx ? Math.abs(toNumber(f.amountLC)) / fx : 0;
      if (sums[t] !== undefined) sums[t] += eur;
    });
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
        amount: normalizeAmountLC(f) / toNumber(f.fxRate),
      }))
      .sort((a, b) => a.date - b.date);

    if (exitDate && toNumber(exitValue) !== 0)
      cashflows.push({ date: new Date(exitDate), amount: toNumber(exitValue) });

    const result = safeXirr(cashflows);
    return result !== null ? result * 100 : null;
  }, [localFlows, exitDate, exitValue]);

  const irrLC = useMemo(() => {
    const cashflows = localFlows
      .filter((f) => f.date)
      .map((f) => ({
        date: new Date(f.date),
        amount: normalizeAmountLC(f),
      }))
      .sort((a, b) => a.date - b.date);

    if (exitDate && exitValueLC !== 0)
      cashflows.push({ date: new Date(exitDate), amount: exitValueLC });

    const result = safeXirr(cashflows);
    return result !== null ? result * 100 : null;
  }, [localFlows, exitDate, exitValueLC]);

  const investedEuro = sumsByTypeEuro.Investment;
  const investedLC   = sumsByTypeLC.Investment;

  const moicInclEuro = investedEuro > 0
    ? (sumsByTypeEuro.Divestment + sumsByTypeEuro.Dividend + sumsByTypeEuro.Interest + sumsByTypeEuro.Other) / investedEuro
    : 0;
  const moicInclLC = investedLC > 0
    ? (sumsByTypeLC.Divestment + sumsByTypeLC.Dividend + sumsByTypeLC.Interest + sumsByTypeLC.Other) / investedLC
    : 0;
  const moicExclEuro = investedEuro > 0 ? sumsByTypeEuro.Divestment / investedEuro : 0;
  const moicExclLC   = investedLC   > 0 ? sumsByTypeLC.Divestment   / investedLC   : 0;

  const handleAddFlow = (template = null) => {
    setLocalFlows((prev) => [
      ...prev,
      {
        id: makeLocalFlowId(),
        flowId: null,
        date: template?.date || "",
        amountLC: template?.amountLC || 0,
        fxRate: template?.fxRate || 1,
        type: template?.type || "Investment",
        divestmentPercentage: template?.divestmentPercentage ?? null,
        isReal: false,
        isScenarioCreated: true,
      },
    ]);
  };

  const handleUpdateInput = (id, field, value) => {
    setLocalFlows((prev) =>
      prev.map((f) => {
        if (f.id === id && f.isReal) return f;
        return f.id === id ? { ...f, [field]: value } : f;
      })
    );
  };

  const handleDeleteFlow = async (id) => {
    const flow = localFlows.find((f) => f.id === id);
    if (flow?.isReal) {
      setToast({ type: "error", message: "Cannot delete master record from scenario mode." });
      return;
    }
    if (flow?.flowId) {
      await deleteFlow(scenarioId, flow.flowId);
    } else {
      setLocalFlows((prev) => prev.filter((f) => f.id !== id));
    }
  };

  const handleEditInvestment = async (payload) => {
    if (!investmentId || typeof onUpdateInvestment !== "function") {
      setToast({ type: "error", message: "Investment update is not available." });
      return;
    }
    try {
      setIsMutating(true);
      await onUpdateInvestment(investmentId, payload);
      setIsEditOpen(false);
      onClose();
    } catch (err) {
      setToast({ type: "error", message: err.message || "Could not update the investment." });
    } finally {
      setIsMutating(false);
    }
  };

  const handleConfirmDeleteInvestment = async () => {
    if (!investmentId || typeof onDeleteInvestment !== "function") {
      setDeletePromptOpen(false);
      setToast({ type: "error", message: "Investment deletion is not available." });
      return;
    }
    try {
      setIsMutating(true);
      await onDeleteInvestment(investmentId);
      setDeletePromptOpen(false);
    } catch (err) {
      setDeletePromptOpen(false);
      setToast({ type: "error", message: err.message || "Could not delete the investment." });
      setIsMutating(false);
    }
  };

  const handleSave = async () => {
    try {
      if (!scenarioId || !investmentId) throw new Error("Context Error");

      const normalizeType = (t) => String(t || "").trim().toLowerCase();
      const typeMap = new Map(
        transactionTypes.map((t) => {
          const norm = normalizeTransactionType(t);
          return [normalizeType(norm.name), norm.id];
        })
      );

      const flowsToSave = localFlows.filter(
        (f) => !f.isReal && f.date && f.type && toNumber(f.fxRate) > 0
      );

      for (const f of flowsToSave) {
        const payload = {
          transaction_id: typeMap.get(normalizeType(f.type)),
          date: f.date,
          amount_lc: round6(toNumber(f.amountLC)),
          fx_rate: round6(toNumber(f.fxRate)),
          amount: round6(toNumber(f.amountLC) / toNumber(f.fxRate)),
          divestment_percentage: canonicalType(f.type).includes("Partial")
            ? round6(toNumber(f.divestmentPercentage))
            : null,
          scenario_id: scenarioId,
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
      setToast({ type: "error", message: getApiErrorMessage(err, "Error committing scenario changes.") });
    }
  };

  return (
    <div className="invDrawerOverlay" onClick={onClose}>
      <aside
        className={`invDrawerPanel${expanded ? " scenario-pf-drawer--expanded" : ""}`}
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
                <span className="invMetaValue">{headerCurrency}</span>
              </div>
              <div className="invMetaItem">
                <span className="invMetaLabel">Country</span>
                <span className="invMetaValue">
                  {getFlagUrl(headerCountry) && (
                    <img
                      src={getFlagUrl(headerCountry)}
                      alt={headerCountry}
                      className="country-flag-img"
                      width={20}
                      height={15}
                    />
                  )}
                  {headerCountry}
                </span>
              </div>
            </div>

            <PermissionGate>
              <div className="invHeaderActions">
                <button
                  className="invActionIcon"
                  title="Edit"
                  onClick={() => setIsEditOpen(true)}
                  disabled={isMutating || isRealInvestment}
                  style={isRealInvestment ? { opacity: 0.5, cursor: "not-allowed" } : {}}
                >
                  <EditIcon />
                </button>
                <button
                  className="invActionIcon"
                  title="Delete"
                  onClick={() => setDeletePromptOpen(true)}
                  disabled={isMutating || isRealInvestment}
                  style={isRealInvestment ? { opacity: 0.5, cursor: "not-allowed" } : {}}
                >
                  <DeleteIcon />
                </button>
              </div>
            </PermissionGate>
          </div>
        </div>

        <div className="invDrawerBody">
          <div className="invSectionHeader">Scenario Trajectory</div>

          <div className="invCardsRow">
            {FLOW_TYPES.map((type) => (
              <div key={type} className="invSummaryCard">
                <div className="invCardTitle">{type}</div>
                <div className="invCardValue">
                  {sumsByTypeEuro[type] > 0
                    ? `${formatNumber(sumsByTypeEuro[type])} €`
                    : `- €`}
                </div>
              </div>
            ))}
          </div>

          <div className="invFairBox">
            <div className="invFairCol" style={{ maxWidth: "160px" }}>
              <div className="invFairLabel invFairLabelDark">Exit Date (Proj.)</div>
              <div className="invFairStaticVal">
                {exitDate ? new Date(exitDate).toLocaleDateString("en-GB") : "-"}
              </div>
            </div>
            <div className="invFairCol">
              <div className="invFairLabel">Exit Amount (€)</div>
              <div className="invFairStaticVal">{formatNumber(exitValue)}</div>
            </div>
            <div className="invFairCol">
              <div className="invFairLabel">Exit FX Rate*</div>
              <input
                className="invInputBase"
                type="number"
                step="0.0001"
                value={exitFxRate}
                onChange={(e) => setExitFxRate(e.target.value)}
                onWheel={noScroll}
              />
            </div>
            <div className="invFairCol">
              <div className="invFairLabel">Implied Amount LC</div>
              <div className="invFairStaticVal">{formatNumber(exitValueLC)}</div>
            </div>
          </div>

          <InvestmentFlowsTable
            flows={localFlows}
            onUpdate={handleUpdateInput}
            onDelete={handleDeleteFlow}
            onAdd={handleAddFlow}
            flowTypes={transactionTypes
              .map((t) => normalizeTransactionType(t).name)
              .filter(Boolean)}
          />

          <section className="inv-performance">
            <h4 className="invSectionHeader">Scenario Performance Metrics</h4>
            <div className="inv-performance-grid">
              {[
                { label: "Gross IRR €",        value: irrEuro !== null ? formatPercent(irrEuro) : "-" },
                { label: "Gross IRR LC",        value: irrLC !== null ? formatPercent(irrLC) : "-" },
                { label: "MOIC € (incl. div)",  value: `${formatRatio(moicInclEuro)}x` },
                { label: "MOIC LC (incl. div)", value: `${formatRatio(moicInclLC)}x` },
                { label: "MOIC € (excl. div)",  value: `${formatRatio(moicExclEuro)}x` },
                { label: "MOIC LC (excl. div)", value: `${formatRatio(moicExclLC)}x` },
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
            <button className="invFooterBtn invBtnCancel" onClick={onClose}>
              Cancel
            </button>
            <button
              className="invFooterBtn invBtnSave"
              onClick={handleSave}
              disabled={flowsLoading || isMutating}
            >
              {flowsLoading ? "Syncing..." : "Save"}
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
        <div onClick={(e) => e.stopPropagation()}>
          <NewInvestmentModal
            mode="edit"
            initialValues={{
              name: investment?.name || "",
              sector: investment?.sector || "",
              countryId: investment?.countryId || investment?.country_id || "",
              countryName: investment?.country_name || investment?.country || "",
              currencyId: investment?.currencyId || investment?.currency_id || "",
              currencyCode: investment?.currency_code || investment?.currency || "",
              ownership: ownershipValue || "",
            }}
            onClose={() => setIsEditOpen(false)}
            onSave={handleEditInvestment}
            countries={countries}
            currencies={currencies}
          />
        </div>
      )}

      {toast && (
        <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />
      )}
    </div>
  );
}