import React, {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useMemo,
  useState,
  useEffect
} from "react";
import { useOutletContext } from "react-router-dom";
import AddFlowModal from "./components/AddFlowModal.jsx";
import { useShareClasses } from "../../../../../../hooks/useShareClass.js"
import { useFlowTypes } from "../../../../../../hooks/LPsStatement/useFlowTypes.js";
import "./OperationStep2.css";

const LPS_W = 340;
const TOT_W = 240;
const FLOW_W = 220;
const EQ_W = 220;
const BLUEBOX_SIDE_PADDING = 28;

/** -------------------------
 * API helpers
 * ------------------------- */
const RUNTIME =
  (typeof window !== "undefined" && window.__RUNTIME_CONFIG__) || {};
const API_BASE_RAW =
  RUNTIME.API_BASE_URL || import.meta.env.VITE_API_BASE_URL || "";
const API_PREFIX_RAW =
  RUNTIME.API_PREFIX || import.meta.env.VITE_API_PREFIX || "";
const API_BASE = String(API_BASE_RAW).replace(/\/$/, "");
const API_PREFIX = String(API_PREFIX_RAW).replace(/\/$/, "");

function joinUrl(a, b) {
  const aa = String(a || "").replace(/\/$/, "");
  const bb = String(b || "").replace(/^\//, "");
  if (!aa) return `/${bb}`;
  if (!bb) return aa;
  return `${aa}/${bb}`;
}

function apiUrl(path) {
  const p = String(path || "");
  const pp = p.startsWith("/") ? p : `/${p}`;
  const prefix = API_PREFIX || "/api";
  if (!API_BASE) return joinUrl(prefix, pp);
  return joinUrl(joinUrl(API_BASE, prefix), pp);
}

async function fetchJson(url, options = {}) {
  const res = await fetch(url, {
    ...options,
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    credentials: "include",
  });
  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text || null;
  }
  if (!res.ok) {
    const msg =
      (data && data.detail) ||
      (data && data.error) ||
      (typeof data === "string" ? data : "") ||
      `Request failed (${res.status})`;
    const err = new Error(msg);
    err.status = res.status;
    err.data = data;
    err.url = url;
    throw err;
  }
  return data;
}

/** -------------------------
 * Parse/format helpers
 * ------------------------- */
function parsePercent(value) {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "number") {
    if (!Number.isFinite(value)) return null;
    return Math.abs(value) > 1 ? value / 100 : value;
  }
  const s = String(value).trim().replace(/\s+/g, "");
  if (!s) return null;
  const cleaned = s.replace("%", "").replace(",", ".");
  const n = Number(cleaned);
  if (!Number.isFinite(n)) return null;
  return Math.abs(n) > 1 ? n / 100 : n;
}

function parseMoney(value) {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  const s = String(value).trim();
  if (!s) return null;
  const parts = s.split("/").map((p) => p.trim());
  let sum = 0;
  let any = false;
  for (const part of parts) {
    let cleaned = part.replace(/[^\d.,-]/g, "");
    if (!cleaned) continue;
    const lastComma = cleaned.lastIndexOf(",");
    const lastDot = cleaned.lastIndexOf(".");
    if (lastComma > lastDot) {
      cleaned = cleaned.replace(/\./g, "").replace(",", ".");
    } else {
      cleaned = cleaned.replace(/,/g, "");
    }
    const n = Number(cleaned);
    if (Number.isFinite(n)) { sum += n; any = true; }
  }
  return any ? sum : null;
}

function formatMoney(n) {
  if (n === null || n === undefined || !Number.isFinite(n)) return "-";
  return new Intl.NumberFormat("fr-FR", {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  }).format(n);
}

function formatPct(n) {
  if (n === null || n === undefined || !Number.isFinite(n)) return "-%";
  return `${n.toFixed(2)}%`;
}

function getNominalValueFromShareClass(sc = {}) {
  const candidates = [
    sc?.nominal_value, sc?.nominalValue, sc?.nominal_value_per_share,
    sc?.nominalValuePerShare, sc?.nominal_value_eur, sc?.nominalValueEur,
    sc?.par_value, sc?.parValue, sc?.nominal,
  ];
  for (const v of candidates) {
    const n = parseMoney(v);
    if (n !== null && Number.isFinite(n) && n > 0) return n;
  }
  return null;
}

/** -------------------------
 * Draft
 * ------------------------- */
const EMPTY_DRAFT = {
  breakdown: "lps",
  flows: [],
  flowTotalInputs: {},
  flowTotals: {},
  eqTargetInput: "",
};

const OperationStep2 = forwardRef(function OperationStep2(
  {
    lps,
    operationType = "Distribution",
    operationTypeId,
    operationTypeName,
    onNext,
    draft,
    setDraft,
    operationId = null,
    fundId: fundIdProp,
    commitments = [],
    totalFundCommitment = 0,
    dueDate = null,
  },
  ref
) {
  const [showAddFlow, setShowAddFlow] = useState(false);
  const outlet = useOutletContext() || {};
  const fundId = fundIdProp ?? outlet.fundId;

  const { data: shareClasses = [] } = useShareClasses(fundId);
  const { flowTypes, fetchFlowTypes, isLoading: isLoadingTypes } = useFlowTypes();
  useEffect(() => {
    fetchFlowTypes?.().catch(() => {});
  }, [fetchFlowTypes]);

  console.log()
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);

  const safeDraft = draft || EMPTY_DRAFT;
  const breakdown = safeDraft.breakdown ?? "lps";
  const flows = safeDraft.flows ?? [];
  const flowTotalInputs = safeDraft.flowTotalInputs ?? {};
  const flowTotals = safeDraft.flowTotals ?? {};
  const eqTargetInput = safeDraft.eqTargetInput ?? "";

  // ── Derive filtered commitments (due_date >= closing_period_date) ──────────
  const filteredCommitments = useMemo(() => {
    if (!dueDate) return Array.isArray(commitments) ? commitments : [];
    let dueDateObj = dueDate;
    if (typeof dueDateObj === "object") {
      if (typeof dueDateObj.toDate === "function") dueDateObj = dueDateObj.toDate();
      else if (dueDateObj.$d) dueDateObj = dueDateObj.$d;
    }
    const due = dueDateObj instanceof Date ? dueDateObj : new Date(dueDateObj);
    if (Number.isNaN(due.getTime())) return Array.isArray(commitments) ? commitments : [];
    return (Array.isArray(commitments) ? commitments : []).filter((c) => {
      const closing = c?.closing_period_date ? new Date(c.closing_period_date) : null;
      return closing && !Number.isNaN(closing.getTime()) && due >= closing;
    });
  }, [commitments, dueDate]);

  // ── Derive LP rows directly from filtered commitments ─────────────────────
  // Each commitment has: lp_id, share_class_id, commitment_amount, closing_name
  // We group by lp_id and sum commitment_amounts
  const lpRows = useMemo(() => {
    const nameById = new Map();
    (Array.isArray(lps) ? lps : []).forEach((lp) => {
      const id = String(lp?.lp_id ?? lp?.id ?? "");
      const name = lp?.name ?? lp?.fullName ?? lp?.lpName ?? null;
      if (id && name) nameById.set(id, name);
    });

    const byLp = new Map();
    for (const c of filteredCommitments) {
      const id = String(c.lp_id);
      if (!byLp.has(id)) {
        byLp.set(id, {
          id,
          lp_id: c.lp_id,
          name: nameById.get(id) ?? `LP ${c.lp_id}`,
          commitmentAmount: 0,
          share_class_id: c.share_class_id ?? null,
        });
      }
      const entry = byLp.get(id);
      entry.commitmentAmount += parseFloat(c.commitment_amount || 0);
      if (c.share_class_id) entry.share_class_id = c.share_class_id;
    }

    const arr = Array.from(byLp.values());
    const total = totalFundCommitment || arr.reduce((s, r) => s + r.commitmentAmount, 0);

    return arr.map((r) => {
      const initials = r.name.split(" ").filter(Boolean).slice(0, 2)
        .map((w) => w[0].toUpperCase()).join("") || "LP";
      const ownershipPct = total > 0 ? r.commitmentAmount / total : null;
      return {
        id: r.id,
        name: r.name,
        initials,
        ownershipPct,
        shareClassId: r.share_class_id ? String(r.share_class_id) : null,
        commitmentNumber: r.commitmentAmount,
        calledAmountNumber: 0,
      };
    });
  }, [filteredCommitments, totalFundCommitment, lps]);

  // ── Derive Share Class rows from filtered commitments ─────────────────────
  const shareClassRows = useMemo(() => {
    const byClass = new Map();
    for (const c of filteredCommitments) {
      const scId = c.share_class_id ? String(c.share_class_id) : "-";
      if (!byClass.has(scId)) {
        byClass.set(scId, { scId, commitmentAmount: 0 });
      }
      byClass.get(scId).commitmentAmount += parseFloat(c.commitment_amount || 0);
    }

    const total = totalFundCommitment ||
      Array.from(byClass.values()).reduce((s, r) => s + r.commitmentAmount, 0);

    // Enrich with share class name from useShareClasses data
    const scLookup = new Map();
    (Array.isArray(shareClasses) ? shareClasses : []).forEach((sc) => {
      const id = String(sc?.share_class_id ?? sc?.id ?? "");
      if (id) scLookup.set(id, sc?.share_class_name ?? sc?.name ?? `Class ${id}`);
    });

    return Array.from(byClass.entries()).map(([scId, { commitmentAmount }]) => {
      const name = scLookup.get(scId) ?? `Class ${scId}`;
      const initials = name.replace(/class\s*/i, "").trim().slice(0, 2).toUpperCase() || "SC";
      const ownershipPct = total > 0 ? commitmentAmount / total : null;
      const stableId = `sc_${scId}`;
      return {
        id: stableId,
        name,
        initials,
        ownershipPct,
        shareClassKey: scId,
        commitmentNumber: commitmentAmount,
        calledAmountNumber: 0,
      };
    });
  }, [filteredCommitments, totalFundCommitment, shareClasses]);

  const rows = breakdown === "share-class" ? shareClassRows : lpRows;

  // totalCommitment = the pre-computed value from Step 1
  const totalCommitment = totalFundCommitment;

  const opKind = useMemo(() => {
    const t = String(operationType || "").toLowerCase();
    if (t.includes("equalization")) return "equalization";
    if (t.includes("distribution")) return "distribution";
    return "capital_call";
  }, [operationType]);

  const isEqualization = opKind === "equalization";
  const isDistribution = opKind === "distribution";
  const totalsLabel = isDistribution ? "Distributed Amount (€)" : "Call Amount (€)";

  const setBreakdown = (v) => {
    if (typeof setDraft !== "function") return;
    setDraft((prev) => ({ ...(prev || EMPTY_DRAFT), breakdown: v }));
  };

  const setFlows = (updater) => {
    if (typeof setDraft !== "function") return;
    setDraft((prev) => {
      const p = prev || EMPTY_DRAFT;
      const nextFlows = typeof updater === "function" ? updater(p.flows || []) : updater;
      return { ...p, flows: nextFlows };
    });
  };

  const setFlowTotalInputs = (updater) => {
    if (typeof setDraft !== "function") return;
    setDraft((prev) => {
      const p = prev || EMPTY_DRAFT;
      const next = typeof updater === "function" ? updater(p.flowTotalInputs || {}) : updater;
      return { ...p, flowTotalInputs: next };
    });
  };

  const setFlowTotals = (updater) => {
    if (typeof setDraft !== "function") return;
    setDraft((prev) => {
      const p = prev || EMPTY_DRAFT;
      const next = typeof updater === "function" ? updater(p.flowTotals || {}) : updater;
      return { ...p, flowTotals: next };
    });
  };

  const setEqTargetInput = (raw) => {
    if (typeof setDraft !== "function") return;
    setDraft((prev) => ({ ...(prev || EMPTY_DRAFT), eqTargetInput: raw }));
  };

  const openFlow = () => setShowAddFlow(true);
  const closeFlow = () => setShowAddFlow(false);

  const handleSaveFlow = (flowData) => {
    const cleanName = flowData?.flowName?.trim();
    const label = cleanName || flowData?.flowTypeName || flowData?.flowType || `Flow ${flows.length + 1}`;
    const flowTypeId = flowData?.flowTypeId ?? flowData?.flow_type_id ?? null;
    const newFlow = {
      id: `flow_${Date.now()}_${Math.random().toString(16).slice(2)}`,
      label,
      flowType: flowData?.flowTypeName || flowData?.flowType || "",
      data: { ...flowData, flowTypeId },
      operation_flow_id: null,
    };
    setFlows((prev) => [...prev, newFlow]);
    setShowAddFlow(false);
    setFlowTotalInputs((prev) => ({ ...prev, [newFlow.id]: "" }));
    setFlowTotals((prev) => ({ ...prev, [newFlow.id]: null }));
  };

  /** Layout */
  const capMinPx = flows.length > 0 ? flows.length * FLOW_W + BLUEBOX_SIDE_PADDING : null;

  const gridCols = useMemo(() => {
    if (isEqualization) {
      if (flows.length > 0) return `${LPS_W}px ${EQ_W}px minmax(${capMinPx}px, 1fr) ${TOT_W}px`;
      return `${LPS_W}px ${EQ_W}px 1fr ${TOT_W}px`;
    }
    if (flows.length > 0) return `${LPS_W}px minmax(${capMinPx}px, 1fr) ${TOT_W}px`;
    return `${LPS_W}px 1fr ${TOT_W}px`;
  }, [isEqualization, flows.length, capMinPx]);

  const flowCols = flows.length > 0 ? `repeat(${flows.length}, ${FLOW_W}px)` : undefined;

  const onChangeFlowTotal = (flowId, raw) => {
    setFlowTotalInputs((prev) => ({ ...prev, [flowId]: raw }));
    setFlowTotals((prev) => ({ ...prev, [flowId]: parseMoney(raw) }));
  };

  /** Totals per row */
  const totalsByRowId = useMemo(() => {
    const map = {};
    const flowIds = flows.map((f) => f.id);
    for (const r of rows) {
      const pct = r.ownershipPct;
      if (pct === null || pct === undefined || !Number.isFinite(pct)) { map[r.id] = null; continue; }
      let sum = 0;
      let hasAny = false;
      for (const fid of flowIds) {
        const t = flowTotals[fid];
        if (t !== null && t !== undefined && Number.isFinite(t)) { sum += t * pct; hasAny = true; }
      }
      map[r.id] = hasAny ? sum : null;
    }
    return map;
  }, [rows, flows, flowTotals]);

  const grandTotal = useMemo(() => {
    let sum = 0; let any = false;
    for (const f of flows) {
      const t = flowTotals[f.id];
      if (t !== null && t !== undefined && Number.isFinite(t)) { sum += t; any = true; }
    }
    return any ? sum : null;
  }, [flows, flowTotals]);

  const flowPercents = useMemo(() => {
    const map = {};
    for (const f of flows) {
      const t = flowTotals[f.id];
      map[f.id] = (totalCommitment > 0 && t !== null && t !== undefined && Number.isFinite(t))
        ? (t / totalCommitment) * 100
        : null;
    }
    return map;
  }, [flows, flowTotals, totalCommitment]);

  const grandPercent =
    totalCommitment > 0 && grandTotal !== null && Number.isFinite(grandTotal)
      ? (grandTotal / totalCommitment) * 100
      : null;

  const eqTargetPct = useMemo(() => {
    const f = parsePercent(eqTargetInput);
    return f !== null && Number.isFinite(f) ? f : null;
  }, [eqTargetInput]);

  const eqByRowId = useMemo(() => {
    if (!isEqualization) return {};
    const out = {};
    for (const r of rows) {
      if (eqTargetPct === null || !Number.isFinite(eqTargetPct)) { out[r.id] = null; continue; }
      const commit = Number(r?.commitmentNumber || 0);
      const called = Number(r?.calledAmountNumber || 0);
      if (!Number.isFinite(commit)) { out[r.id] = null; continue; }
      out[r.id] = eqTargetPct * commit - called;
    }
    return out;
  }, [isEqualization, rows, eqTargetPct]);

  /** Share class nominal value lookup for shares issued */
  const shareClassLookup = useMemo(() => {
    const byId = new Map();
    const byName = new Map();
    (Array.isArray(shareClasses) ? shareClasses : []).forEach((sc) => {
      const id = sc?.share_class_id ?? sc?.id ?? sc?.shareClassId ?? sc?.share_class ?? null;
      const name = sc?.share_class_name ?? sc?.name ?? sc?.shareClassName ?? sc?.share_class_label ?? null;
      const nominal = getNominalValueFromShareClass(sc);
      if (id !== null && id !== undefined) byId.set(String(id), nominal);
      if (name) {
        byName.set(String(name).toLowerCase().trim(), nominal);
        const n = String(name).toLowerCase().trim();
        if (!n.startsWith("class ")) byName.set(`class ${n}`, nominal);
      }
    });
    return { byId, byName };
  }, [shareClasses]);

  const sharesIssuedByRowId = useMemo(() => {
    const out = {};
    for (const r of rows) {
      const mainAmount = totalsByRowId[r.id];
      if (mainAmount === null || !Number.isFinite(mainAmount)) { out[r.id] = null; continue; }
      const scKey = breakdown === "share-class" ? (r.shareClassKey ?? r.name ?? null) : (r.shareClassId ?? null);
      if (!scKey) { out[r.id] = null; continue; }
      const raw = String(scKey).trim();
      if (!raw || raw === "-") { out[r.id] = null; continue; }
      let nominal = shareClassLookup.byId.get(raw);
      if (nominal === null || nominal === undefined) {
        const lc = raw.toLowerCase();
        nominal =
          shareClassLookup.byName.get(lc) ??
          shareClassLookup.byName.get(lc.replace(/^class\s+/, "")) ??
          shareClassLookup.byName.get(`class ${lc.replace(/^class\s+/, "")}`);
      }
      if (!Number.isFinite(nominal) || nominal <= 0) { out[r.id] = null; continue; }
      out[r.id] = mainAmount / nominal;
    }
    return out;
  }, [rows, totalsByRowId, breakdown, shareClassLookup]);

  /** Persist flows to DB */
  const persistFlows = useCallback(async () => {
    if (!operationId) throw new Error("Missing operationId (Step 1 must be saved first).");
    const toCreate = flows.filter((f) => !f?.operation_flow_id);
    const roundMoney = (val, decimals = 2) => {
      if (val === null || val === undefined) return null;
      const n = Number(val);
      return Number.isFinite(n) ? Number(n.toFixed(decimals)) : null;
    };
    const clampDecimal = (val, decimals = 6) => {
      if (val === null || val === undefined) return 0;
      const n = Number(val);
      if (!Number.isFinite(n)) return 0;
      return Number(Math.min(Math.max(n, 0), 1).toFixed(decimals));
    };
    for (const f of toCreate) {
      const total = flowTotals[f.id];
      const inputAmount = (total !== null && total !== undefined && Number.isFinite(total))
        ? roundMoney(total, 2) : null;
      const flowTypeId = f?.data?.flowTypeId ?? f?.data?.flow_type_id ?? null;
      if (!flowTypeId) throw new Error(`Flow "${f.label}" is missing flowTypeId.`);
      const rawAlloc = totalCommitment > 0 && inputAmount !== null ? inputAmount / totalCommitment : 0;
      const payload = {
        operation: Number(operationId),
        flow_type: Number(flowTypeId),
        flow_name: (f?.data?.flowName || f?.label || "").trim() || "Flow",
        input_type: "amount",
        input_amount: inputAmount,
        input_percentage: null,
        allocation_percentage_of_commitment: clampDecimal(rawAlloc, 6),
        commitment_amount: roundMoney(totalCommitment || 0, 2),
      };
      const url = apiUrl(`/operations/${operationId}/flows/`);
      const created = await fetchJson(url, { method: "POST", body: JSON.stringify(payload) });
      const newOpFlowId = created?.operation_flow_id ?? created?.id ?? created?.pk ?? null;
      if (!newOpFlowId) throw new Error("Flow created but response missing operation_flow_id.");
      setFlows((prev) =>
        (prev || []).map((x) => x.id === f.id ? { ...x, operation_flow_id: newOpFlowId } : x)
      );
    }
  }, [flows, flowTotals, operationId, totalCommitment, setFlows]);

  const submitToNext = useCallback(async () => {
    if (typeof onNext !== "function") return;
    setIsSaving(true);
    setSaveError(null);
    try {
      await persistFlows();
      const perLpOut = {};
      const calledPctDecimal =
        grandPercent !== null && Number.isFinite(grandPercent) ? grandPercent / 100 : null;
      for (const r of rows) {
        const pct = r.ownershipPct;
        const rowFlows = {};
        for (const f of flows) {
          const t = flowTotals[f.id];
          rowFlows[f.id] =
            (t !== null && t !== undefined && Number.isFinite(t) &&
             pct !== null && pct !== undefined && Number.isFinite(pct))
              ? t * pct : null;
        }
        perLpOut[r.id] = {
          mainAmount: totalsByRowId[r.id],
          calledPct: calledPctDecimal,
          sharesIssued: sharesIssuedByRowId[r.id],
          flows: rowFlows,
          eqAmount: isEqualization ? eqByRowId[r.id] : null,
          eqTargetPct: isEqualization ? eqTargetPct : null,
        };
      }
      onNext({
        operationType: operationType || "Distribution",
        flows: flows.map((f) => ({
          id: f.id,
          label: f.label,
          flowType: f.flowType,
          operation_flow_id: f.operation_flow_id || null,
          flowTypeId: f?.data?.flowTypeId ?? null,
        })),
        perLp: perLpOut,
      });
    } catch (e) {
      setSaveError(e);
      throw e;
    } finally {
      setIsSaving(false);
    }
  }, [
    onNext, operationType, flows, flowTotals, rows, totalsByRowId,
    grandPercent, sharesIssuedByRowId, persistFlows, isEqualization,
    eqByRowId, eqTargetPct,
  ]);

  useImperativeHandle(ref, () => ({ submitToNext }), [submitToNext]);

  const saveErrorMsg = saveError?.message ? String(saveError.message) : null;

  return (
    <>
      {saveErrorMsg && (
        <div style={{ marginBottom: 10, color: "#b42318", fontSize: 12 }}>
          {saveErrorMsg}
        </div>
      )}

      <div className="op2-topbar">
        <div className="op2-breakdown">
          <span className="op2-breakdown-label">Breakdown :</span>
          <div className="op2-breakdown-tabs">
            <button
              type="button"
              className={"op2-breakdown-tab" + (breakdown === "share-class" ? " op2-breakdown-tab--active" : "")}
              onClick={() => setBreakdown("share-class")}
              disabled={isSaving}
            >
              Share Class
            </button>
            <button
              type="button"
              className={"op2-breakdown-tab" + (breakdown === "lps" ? " op2-breakdown-tab--active" : "")}
              onClick={() => setBreakdown("lps")}
              disabled={isSaving}
            >
              LPs
            </button>
          </div>
        </div>
      </div>

      <div className="op2-table-outer">
        <div className="op2-table-inner">
          {/* TOP STRIP */}
          <div className="op2-head-row" style={{ gridTemplateColumns: gridCols }}>
            <div className="op2-head-block op2-head-block--dark" />
            {isEqualization ? (
              <>
                <div className="op2-head-block op2-head-block--cap">
                  <div className="op2-cap-strip-type">EQUALIZATION</div>
                </div>
                <div className="op2-head-block op2-head-block--cap">
                  <div className="op2-cap-strip-type">CAPITAL CALL</div>
                  <button type="button" className="op2-head-plus" onClick={openFlow} aria-label="Add flow" disabled={isSaving}>+</button>
                </div>
                <div className="op2-head-block op2-head-block--dark op2-head-block--tot">TOTAUX</div>
              </>
            ) : (
              <>
                <div className="op2-head-block op2-head-block--cap">
                  <div className="op2-cap-strip-type">{(operationType || "Distribution").toUpperCase()}</div>
                  <button type="button" className="op2-head-plus" onClick={openFlow} aria-label="Add flow" disabled={isSaving}>+</button>
                </div>
                <div className="op2-head-block op2-head-block--dark op2-head-block--tot">TOTAUX</div>
              </>
            )}
          </div>

          {/* BODY */}
          <div className="op2-body-row" style={{ gridTemplateColumns: gridCols }}>
            {/* LPs / Share Class column */}
            <div className="op2-col op2-col--lps">
              <div className="op2-col-header">
                <span>{breakdown === "share-class" ? "Share class" : "LPs"}</span>
                <span className="op2-sort">⇅</span>
              </div>
              <div className="op2-rows">
                {rows.map((r) => (
                  <div key={r.id} className="op2-row">
                    <div className="op2-lp-info">
                      <div className="op2-avatar">{r.initials}</div>
                      <span className="op2-lp-name">{r.name}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Equalization column */}
            {isEqualization && (
              <div className="op2-col op2-col--eq">
                <div className="op2-col-header">
                  <span>Equalization</span>
                  <span className="op2-sort">⇅</span>
                </div>
                <div className="op2-eq-target-wrap">
                  <input
                    className="op2-eq-target-input"
                    placeholder="Target..."
                    value={eqTargetInput}
                    onChange={(e) => setEqTargetInput(e.target.value)}
                    disabled={isSaving}
                    inputMode="decimal"
                  />
                </div>
                <div className="op2-rows">
                  {rows.map((r) => {
                    const v = eqByRowId[r.id];
                    return (
                      <div key={r.id} className="op2-row op2-row--right">
                        <span className="op2-num">{v === null ? "-" : formatMoney(v)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Flows column */}
            <div className="op2-col op2-col--cap">
              <div className="op2-bluebox">
                {flows.length === 0 ? (
                  <div className="op2-cap-empty">
                    <button type="button" className="op2-add-flow-btn" onClick={openFlow} disabled={isSaving}>
                      + Add a first flow
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="op2-cap-header">
                      <div className="op2-cap-header-grid" style={{ gridTemplateColumns: flowCols }}>
                        {flows.map((flow) => (
                          <div key={flow.id} className="op2-cap-header-cell">
                            <div className="op2-flow-title">{flow.label}</div>
                            <div className="op2-flow-subtitle">{flow.flowType}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="op2-cap-body">
                      <div className="op2-cap-grid" style={{ gridTemplateColumns: flowCols }}>
                        {flows.map((flow) => {
                          const total = flowTotals[flow.id];
                          return (
                            <div key={flow.id} className="op2-flow-col">
                              {rows.map((r) => {
                                const pct = r.ownershipPct;
                                const value =
                                  total !== null && total !== undefined && Number.isFinite(total) &&
                                  pct !== null && pct !== undefined && Number.isFinite(pct)
                                    ? total * pct : null;
                                return (
                                  <div key={r.id} className="op2-flow-cell">
                                    {value === null ? "-" : formatMoney(value)}
                                  </div>
                                );
                              })}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Totaux */}
            <div className="op2-col op2-col--tot">
              <div className="op2-col-header op2-col-header--right">
                <span>{totalsLabel}</span>
                <span className="op2-sort">⇅</span>
              </div>
              <div className="op2-rows">
                {rows.map((r) => {
                  const v = totalsByRowId[r.id];
                  return (
                    <div key={r.id} className="op2-row op2-row--right">
                      <span className="op2-num">{v === null ? "-" : formatMoney(v)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* FOOTER */}
          <div className="op2-footer-row" style={{ gridTemplateColumns: gridCols }}>
            <div className="op2-footer-cell op2-footer-cell--label">Total</div>

            {isEqualization && (
              <div className="op2-footer-cell">
                <div className="op2-footer-total-input">
                  <span className="op2-footer-euro">%</span>
                  <input
                    className="op2-footer-input"
                    value={eqTargetInput}
                    onChange={(e) => setEqTargetInput(e.target.value)}
                    inputMode="decimal"
                    placeholder=""
                    disabled={isSaving}
                  />
                </div>
                <div className="op2-footer-percent">
                  = {eqTargetPct === null ? "-%" : formatPct(eqTargetPct * 100)}
                </div>
              </div>
            )}

            <div className="op2-footer-cell op2-footer-cell--cap">
              {flows.length === 0 ? (
                <>
                  <div className="op2-footer-total-input op2-footer-total-input--wide">
                    <span className="op2-footer-euro">€</span>
                    <input className="op2-footer-input" disabled />
                  </div>
                  <div className="op2-footer-percent">= -%</div>
                </>
              ) : (
                <div className="op2-cap-footer-grid" style={{ gridTemplateColumns: flowCols }}>
                  {flows.map((flow) => (
                    <div key={flow.id} className="op2-flow-footer-col">
                      <div className="op2-footer-total-input">
                        <span className="op2-footer-euro">€</span>
                        <input
                          className="op2-footer-input"
                          value={flowTotalInputs[flow.id] ?? ""}
                          onChange={(e) => onChangeFlowTotal(flow.id, e.target.value)}
                          inputMode="decimal"
                          placeholder=""
                          disabled={isSaving}
                        />
                      </div>
                      <div className="op2-footer-percent">= {formatPct(flowPercents[flow.id])}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="op2-footer-cell">
              <div className="op2-footer-total-input">
                <span className="op2-footer-euro">€</span>
                <span className="op2-footer-dash">{grandTotal === null ? "-" : formatMoney(grandTotal)}</span>
              </div>
              <div className="op2-footer-percent">= {formatPct(grandPercent)}</div>
            </div>
          </div>
        </div>
      </div>

      {showAddFlow && (
        <AddFlowModal 
          onClose={closeFlow} 
          onSave={handleSaveFlow} 
          isSaving={isSaving} 
          flowTypes={flowTypes}      // Pass data
          isLoading={isLoadingTypes} // Pass loading state
        />
      )}
    </>
  );
});

export default OperationStep2;