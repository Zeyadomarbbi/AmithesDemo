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
import { useCapitalFlowFlowDetails } from "../../../../../../hooks/LPsStatement/useCapitalFlowFlowDetails.js";
import "./OperationStep2.css";

const LPS_W = 340;
const TOT_W = 240;
const FLOW_W = 220;
const EQ_W = 220;
const BLUEBOX_SIDE_PADDING = 28;

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

function rowAmountForFlow(flow, row, flowTotal) {
  const pct = row.ownershipPct;
  if (flowTotal === null || !Number.isFinite(flowTotal)) return null;
  if (pct === null || !Number.isFinite(pct)) return null;
  return flowTotal * pct;
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

const EMPTY_DRAFT = {
  breakdown: "lps",
  flows: [],
  flowTotalInputs: {},
  flowTotals: {},
  eqTargetInput: "",
};
const EQ_FLOW_SYNTHETIC_ID = "__eq_flow__";

const OperationStep2 = forwardRef(function OperationStep2(
  {
    lps,
    operationType = "Distribution",
    existingAllocations = [],
    fetchAllAllocations = null,
    operationTypeId,
    operationTypeName,
    operationNumber,
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
  const opKind = useMemo(() => {
    const t = String(operationType || "").toLowerCase();
    if (t.includes("equalization")) return "equalization";
    if (t.includes("distribution")) return "distribution";
    return "capital_call";
  }, [operationType]);

  const isEqualization = opKind === "equalization";
  const isDistribution = opKind === "distribution";
  const totalsLabel = isDistribution ? "Distributed Amount (€)" : "Call Amount (€)";
  const { data: shareClasses = [], isLoading: isLoadingShareClass } = useShareClasses(fundId);
  const { flowTypes, fetchFlowTypes, isLoading: isLoadingTypes } = useFlowTypes();
  const { flows: fetchedFlows, fetchFlows, isLoading: isLoadingCFFlowDetails } = useCapitalFlowFlowDetails(fundId, operationId);

  useEffect(() => {
    fetchAllAllocations?.().catch(() => {});
  }, [fetchAllAllocations]);
  useEffect(() => {
    fetchFlowTypes?.().catch(() => {});
  }, [fetchFlowTypes]);
  useEffect(() => {
    if (operationId) fetchFlows().catch(() => {});
  }, [operationId, fetchFlows]);

  useEffect(() => {
    if (!fetchedFlows?.length) return;

    const eqTypeId = (Array.isArray(flowTypes) ? flowTypes : []).find(
      (ft) => String(ft.name ?? "").toLowerCase() === "equalization"
    )?.flow_type_id ?? null;

    const loadedFlows = [];
    const loadedTotals = {};
    const loadedInputs = {};
    let loadedEqTargetInput = null;

    fetchedFlows.forEach((f) => {
      const isEq = eqTypeId !== null && Number(f.flow_type_id) === Number(eqTypeId);
      
      if (isEq) {
        if (f.input_percentage !== null && f.input_percentage !== undefined) {
          loadedEqTargetInput = String(f.input_percentage);
        }
      }

      const fid = String(f.operation_flow_id);
      const amount = Number(f.computed_total_amount || f.input_amount || 0);
      loadedFlows.push({
        id: fid,
        label: f.flow_name,
        flowType: f.flow_name,
        data: { flowTypeId: f.flow_type_id, ...f },
        operation_flow_id: f.operation_flow_id,
        isSyntheticEqualization: isEq,
      });
      loadedTotals[fid] = amount;
      loadedInputs[fid] = amount.toString();
    });

    if (typeof setDraft === "function") {
      setDraft((prev) => ({
        ...(prev || EMPTY_DRAFT),
        flows: loadedFlows,
        flowTotals: loadedTotals,
        flowTotalInputs: loadedInputs,
        ...(loadedEqTargetInput !== null && { eqTargetInput: loadedEqTargetInput }),
      }));
    }
  }, [fetchedFlows, flowTypes, setDraft]);

  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);

  const safeDraft = draft || EMPTY_DRAFT;
  const breakdown = safeDraft.breakdown ?? "lps";
  
  const flows = (safeDraft.flows ?? []).filter(f => !f.isSyntheticEqualization);
  const flowTotalInputs = safeDraft.flowTotalInputs ?? {};
  const flowTotals = safeDraft.flowTotals ?? {};
  const eqTargetInput = safeDraft.eqTargetInput ?? "";
  
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

  const commitmentByLpId = {};
  for (const c of filteredCommitments) {
    const id = String(c.lp_id);
    if (!commitmentByLpId[id]) {
      commitmentByLpId[id] = {
        commitmentNumber: 0,
        shareClassId: c.share_class_id ? String(c.share_class_id) : null,
      };
    }
    commitmentByLpId[id].commitmentNumber += parseFloat(c.commitment_amount || 0);
    if (c.share_class_id) commitmentByLpId[id].shareClassId = String(c.share_class_id);
  }

  const historicalData = useMemo(() => {
    const byLp = {};
    const byClass = {};
    const currentOpNum = operationNumber !== null ? Number(operationNumber) : Infinity;

    for (const alloc of existingAllocations) {
      const allocOpNum = Number(alloc.operation_number ?? 0);
      if (allocOpNum >= currentOpNum) continue;

      const lpId = String(alloc.lp_id ?? "");
      const scId = String(alloc.share_class_id ?? "");
      const called = parseFloat(alloc.capital_call || 0);
      const commit = parseFloat(alloc.commitment_amount || 0);

      if (scId && !byClass[scId]) {
        byClass[scId] = { calledAmount: 0, commitmentAmount: 0 };
      }

      if (lpId) {
        if (!byLp[lpId]) byLp[lpId] = { calledAmount: 0, commitmentAmount: 0, opNum: -1, scId: null };
        byLp[lpId].calledAmount += called;
        
        if (allocOpNum > byLp[lpId].opNum) {
          byLp[lpId].commitmentAmount = commit;
          byLp[lpId].opNum = allocOpNum;
          byLp[lpId].scId = scId;
        }
      }

      if (scId) {
        byClass[scId].calledAmount += called;
      }
    }

    for (const lpId in byLp) {
      const sc = byLp[lpId].scId;
      if (sc && byClass[sc]) {
        byClass[sc].commitmentAmount += byLp[lpId].commitmentAmount;
      }
    }

    return { byLp, byClass };
  }, [existingAllocations, operationNumber]);
  
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
          calledAmount: 0,
          share_class_id: c.share_class_id ?? null,
        });
      }
      const entry = byLp.get(id);
      entry.commitmentAmount += parseFloat(c.commitment_amount || 0);
      entry.calledAmount += parseFloat(c.called_amount || c.capital_called || 0);
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
        calledAmountNumber: historicalData.byLp[r.id]?.calledAmount || 0,
      };
    });
  }, [filteredCommitments, totalFundCommitment, lps, historicalData]);

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
        calledAmountNumber: historicalData.byClass[scId]?.calledAmount || 0,
      };
    });
  }, [filteredCommitments, totalFundCommitment, shareClasses, historicalData]);

  const rows = breakdown === "share-class" ? shareClassRows : lpRows;
  const totalCommitment = totalFundCommitment;

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

    const eqFlowTypeId = (Array.isArray(flowTypes) ? flowTypes : []).find(
      (ft) => String(ft.name ?? "").toLowerCase() === "equalization"
    )?.flow_type_id ?? null;

    const newFlow = {
      id: `flow_${Date.now()}_${Math.random().toString(16).slice(2)}`,
      label,
      flowType: flowData?.flowTypeName || flowData?.flowType || "",
      data: { ...flowData, flowTypeId },
      operation_flow_id: null,
      isSyntheticEqualization: eqFlowTypeId !== null && Number(flowTypeId) === Number(eqFlowTypeId)
    };
    
    setFlows((prev) => [...prev, newFlow]);
    setShowAddFlow(false);
    setFlowTotalInputs((prev) => ({ ...prev, [newFlow.id]: "" }));
    setFlowTotals((prev) => ({ ...prev, [newFlow.id]: null }));
  };

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
      const called = Number(historicalData[r.id]?.calledAmount || r?.calledAmountNumber || 0);
      if (!Number.isFinite(commit)) { out[r.id] = null; continue; }
      out[r.id] = (eqTargetPct * commit) - called;
    }
    return out;
  }, [isEqualization, rows, eqTargetPct, historicalData]);

  const totalsByRowId = useMemo(() => {
    const map = {};
    const flowIds = flows.map((f) => f.id);
    
    for (const r of rows) {
      const pct = r.ownershipPct;
      let sum = 0;
      let hasAny = false;
      
      if (pct !== null && pct !== undefined && Number.isFinite(pct)) {
        for (const fid of flowIds) {
          const t = flowTotals[fid];
          if (t !== null && t !== undefined && Number.isFinite(t)) { 
            sum += t * pct; 
            hasAny = true; 
          }
        }
      }

      if (isEqualization) {
        const eqVal = eqByRowId[r.id];
        if (eqVal !== null && eqVal !== undefined && Number.isFinite(eqVal)) {
          sum += eqVal;
          hasAny = true;
        }
      }

      map[r.id] = hasAny ? sum : null;
    }
    return map;
  }, [rows, flows, flowTotals, isEqualization, eqByRowId]);

    const eqGrandTotal = useMemo(() => {
    if (!isEqualization) return null;
    let sum = 0;
    let any = false;
    for (const r of rows) {
      const v = eqByRowId[r.id];
      if (v !== null && Number.isFinite(v)) { sum += v; any = true; }
    }
    return any ? sum : null;
  }, [isEqualization, rows, eqByRowId]);

  const grandTotal = useMemo(() => {
    let sum = 0; 
    let any = false;
    
    for (const f of flows) {
      const t = flowTotals[f.id];
      if (t !== null && t !== undefined && Number.isFinite(t)) { 
        sum += t; 
        any = true; 
      }
    }
    
    if (isEqualization && eqGrandTotal !== null && Number.isFinite(eqGrandTotal)) {
      sum += eqGrandTotal;
      any = true;
    }
    
    return any ? sum : null;
  }, [flows, flowTotals, isEqualization, eqGrandTotal]);

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

  const shareClassLookup = useMemo(() => {
    const byId = new Map();
    const byName = new Map();
    (Array.isArray(shareClasses) ? shareClasses : []).forEach((sc) => {
      const id = sc?.share_class_id ?? sc?.id ?? sc?.shareClassId ?? sc?.share_class ?? null;
      const name = sc?.share_class_name ?? sc?.name ?? sc?.shareClassName ?? sc?.share_class_label ?? null;
      
      const nominal = typeof getNominalValueFromShareClass === "function" 
        ? getNominalValueFromShareClass(sc) 
        : (sc?.nominal_value ?? null);

      if (id !== null && id !== undefined) byId.set(String(id), nominal);
      if (name) {
        byName.set(String(name).toLowerCase().trim(), nominal);
        const n = String(name).toLowerCase().trim();
        if (!n.startsWith("class ")) byName.set(`class ${n}`, nominal);
      }
    });
    return { byId, byName };
  }, [shareClasses]);

  const submitToNext = useCallback(async () => {
    if (typeof onNext !== "function") return;
    const perLpOut = {};
    const calledPctDecimal =
      grandPercent !== null && Number.isFinite(grandPercent) ? grandPercent / 100 : null;

    for (const r of rows) {
      const pct = r.ownershipPct;
      const rowFlows = {};

      for (const f of flows) {
        const t = flowTotals[f.id];
        rowFlows[f.id] =
          t !== null && t !== undefined && Number.isFinite(t) &&
          pct !== null && pct !== undefined && Number.isFinite(pct)
            ? t * pct : null;
      }

      const mainAmount = totalsByRowId[r.id];
      const scKey = breakdown === "share-class" ? (r.shareClassKey ?? r.name ?? null) : (r.shareClassId ?? null);
      const raw = scKey ? String(scKey).trim() : null;

      const scObj = (Array.isArray(shareClasses) ? shareClasses : []).find(
        (sc) => String(sc?.share_class_id ?? sc?.id ?? "") === raw
      );

      let nominalVal = typeof getNominalValueFromShareClass === "function" && scObj
        ? getNominalValueFromShareClass(scObj)
        : scObj?.nominal_value;

      if (nominalVal == null && raw && raw !== "-") {
        nominalVal = shareClassLookup.byId.get(raw);
        if (nominalVal == null) {
          const lc = raw.toLowerCase();
          nominalVal =
            shareClassLookup.byName.get(lc) ??
            shareClassLookup.byName.get(lc.replace(/^class\s+/, "")) ??
            shareClassLookup.byName.get(`class ${lc.replace(/^class\s+/, "")}`);
        }
      }

      const nomNum = parseFloat(nominalVal);
      const issuanceMethod = scObj?.issuance_method;
      let computedShares = null;

      if (!Number.isFinite(nomNum) || nomNum <= 0) {
        computedShares = null;
      } else if (issuanceMethod === "PRO_RATA_CALLED") {
        computedShares = Number.isFinite(mainAmount) ? mainAmount / nomNum : null;
      } else {
        const currentCommitment = r.commitmentNumber ?? 0;
        const prevCommitment = breakdown === "share-class"
          ? (historicalData?.byClass?.[r.shareClassKey]?.commitmentAmount ?? 0)
          : (historicalData?.byLp?.[r.id]?.commitmentAmount ?? 0);
        const delta = currentCommitment - prevCommitment;
        computedShares = delta > 0 ? delta / nomNum : 0;
      }

      perLpOut[r.id] = {
        mainAmount: totalsByRowId[r.id],
        calledPct: calledPctDecimal,
        sharesIssued: computedShares,
        flows: rowFlows,
        commitmentNumber: commitmentByLpId[r.id]?.commitmentNumber ?? r.commitmentNumber ?? 0,
        shareClassId: commitmentByLpId[r.id]?.shareClassId ?? r.shareClassId ?? null,
        eqAmount: isEqualization ? eqByRowId[r.id] : null,
        eqTargetPct: isEqualization ? eqTargetPct : null,
      };
    }

    const mappedFlows = flows.map((f) => {
      const flowTotal = flowTotals[f.id] ?? null;

      const perLpAmounts = rows
        .map((r) => rowAmountForFlow(f, r, flowTotal))
        .filter((v) => v !== null && Number.isFinite(v));

      const computedTotalAmount = flowTotal;

      return {
        id: f.id,
        operation_flow_id: f.operation_flow_id ?? null,
        flow_type_id: f?.data?.flowTypeId ?? null,
        flow_name: f.label,
        input_type: "amount",
        input_amount: flowTotal,
        input_percentage: null,
        computed_total_amount: computedTotalAmount,
        allocation_percentage_of_commitment:
          totalCommitment > 0 && computedTotalAmount !== null && Number.isFinite(computedTotalAmount)
            ? (computedTotalAmount / totalCommitment) * 100
            : null,
      };
    });

    if (isEqualization) {
      const eqFlowTypeId = (Array.isArray(flowTypes) ? flowTypes : []).find(
        (ft) => String(ft.name ?? "").toLowerCase() === "equalization"
      )?.flow_type_id ?? null;

      const fetchedEqFlow = (draft?.flows ?? []).find((f) => f.isSyntheticEqualization);

      mappedFlows.unshift({
        id: fetchedEqFlow?.id || EQ_FLOW_SYNTHETIC_ID,
        operation_flow_id: fetchedEqFlow?.operation_flow_id ?? null,
        flow_type_id: eqFlowTypeId,
        flow_name: "Equalization",
        input_type: "percentage",
        input_amount: null,
        input_percentage: eqTargetPct !== null ? eqTargetPct * 100 : null,
        computed_total_amount: eqGrandTotal,
        allocation_percentage_of_commitment:
          totalCommitment > 0 && eqGrandTotal !== null && Number.isFinite(eqGrandTotal)
            ? (eqGrandTotal / totalCommitment) * 100
            : null,
      });
    }

    onNext({
      operationType: operationType || "Distribution",
      flows: mappedFlows,
      perLp: perLpOut,
      grandTotal,
      grandPercent,
    });
  }, [
    onNext, operationType, flows, flowTotals, rows, totalsByRowId,
    grandPercent, isEqualization, eqByRowId, eqTargetPct, eqGrandTotal,
    breakdown, shareClassLookup, shareClasses, historicalData,
    totalCommitment, flowTypes, draft
  ]);

  useImperativeHandle(ref, () => ({ submitToNext }), [submitToNext]);

  const saveErrorMsg = saveError?.message ? String(saveError.message) : null;
  const eqGrandTotalPct = useMemo(() => {
      if (!isEqualization || totalCommitment <= 0 || eqGrandTotal === null || !Number.isFinite(eqGrandTotal)) return null;
      return (eqGrandTotal / totalCommitment) * 100;
    }, [isEqualization, eqGrandTotal, totalCommitment]);

  const isLoadingData =
  isLoadingTypes ||
  isLoadingShareClass ||
  (operationId && isLoadingCFFlowDetails);

  if (isLoadingData) {
    return <div style={{ padding: 20 }}>Loading...</div>;
  }
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
                  <span className="op2-footer-euro">€</span>
                  <span className="op2-footer-dash">
                    {eqGrandTotal === null ? "-" : formatMoney(eqGrandTotal)}
                  </span>
                </div>
                <div className="op2-footer-percent">
                  = {eqGrandTotalPct === null ? "-%" : formatPct(eqGrandTotalPct)}
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
          flowTypes={flowTypes}      
          isLoading={isLoadingTypes}
        />
      )}
    </>
  );
});

export default OperationStep2;