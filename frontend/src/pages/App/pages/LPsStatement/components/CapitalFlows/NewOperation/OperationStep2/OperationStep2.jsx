import React, {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useMemo,
  useState,
} from "react";
import { useOutletContext } from "react-router-dom";
import "./OperationStep2.css";
import AddFlowModal from "./components/AddFlowModal.jsx";

/* ✅ We fetch Share Classes here (NO backend change) */
import { useShareClasses } from "/src/pages/App/hooks/useShareClass.js";

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

  if (!API_BASE) {
    return joinUrl(prefix, pp);
  }
  return joinUrl(joinUrl(API_BASE, prefix), pp);
}

async function fetchJson(url, options = {}) {
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
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
    if (Number.isFinite(n)) {
      sum += n;
      any = true;
    }
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

function getLpCommitmentNumber(lp) {
  const rows = Array.isArray(lp?.sharesRows) ? lp.sharesRows : [];
  if (rows.length) {
    const sum = rows.reduce(
      (acc, r) => acc + (parseMoney(r?.commitment) || 0),
      0
    );
    return Number.isFinite(sum) ? sum : 0;
  }
  return parseMoney(lp?.commitment) || 0;
}

function getLpCalledAmountNumber(lp) {
  // ✅ try many possible keys (since your LP register/capital flows table may use different naming)
  const candidates = [
    lp?.called_amount,
    lp?.calledAmount,
    lp?.called,
    lp?.called_before,
    lp?.calledBefore,
    lp?.called_to_date,
    lp?.calledToDate,
    lp?.total_called,
    lp?.totalCalled,
    lp?.["Called amount"],
    lp?.["Called Amount"],
    lp?.["called amount"],
  ];

  for (const v of candidates) {
    const n = parseMoney(v);
    if (n !== null && Number.isFinite(n)) return n;
  }
  return 0; // ✅ if not present, treat as 0
}

function getPrimaryShareClassId(lp) {
  const rows = Array.isArray(lp?.sharesRows) ? lp.sharesRows : [];
  if (rows.length) {
    let best = null;
    let bestAmt = -Infinity;

    rows.forEach((r) => {
      const sc =
        r?.shareClass ??
        r?.share_class ??
        r?.type ??
        r?.class ??
        r?.share_class_id ??
        null;

      const amt = parseMoney(r?.commitment) || 0;
      if (sc !== null && sc !== undefined && amt > bestAmt) {
        bestAmt = amt;
        best = sc;
      }
    });

    if (best !== null && best !== undefined) return String(best);
  }

  const direct =
    lp?.share_class ??
    lp?.shareClassId ??
    lp?.shareClass ??
    lp?.class ??
    lp?.share_class_id ??
    null;

  if (direct !== null && direct !== undefined) return String(direct);

  return null;
}

function getNominalValueFromShareClass(sc = {}) {
  const candidates = [
    sc?.nominal_value,
    sc?.nominalValue,
    sc?.nominal_value_per_share,
    sc?.nominalValuePerShare,
    sc?.nominal_value_eur,
    sc?.nominalValueEur,
    sc?.par_value,
    sc?.parValue,
    sc?.nominal,
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

  // ✅ equalization
  eqTargetInput: "",
};

const OperationStep2 = forwardRef(function OperationStep2(
  {
    lps = [],
    operationType = "Distribution",
    onNext,
    draft,
    setDraft,
    operationId = null,
    fundId: fundIdProp,
  },
  ref
) {
  const [showAddFlow, setShowAddFlow] = useState(false);
  const outlet = useOutletContext() || {};
  const fundId = fundIdProp ?? outlet.fundId;

  const { data: shareClasses = [] } = useShareClasses(fundId);

  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);

  const safeDraft = draft || EMPTY_DRAFT;

  const breakdown = safeDraft.breakdown ?? "lps";
  const flows = safeDraft.flows ?? [];
  const flowTotalInputs = safeDraft.flowTotalInputs ?? {};
  const flowTotals = safeDraft.flowTotals ?? {};
  const eqTargetInput = safeDraft.eqTargetInput ?? "";

  const opKind = useMemo(() => {
    const t = String(operationType || "").toLowerCase();
    if (t.includes("equalization")) return "equalization"; // means Equalization/Capital Call
    if (t.includes("distribution")) return "distribution";
    return "capital_call";
  }, [operationType]);

  const isEqualization = opKind === "equalization";
  const isDistribution = opKind === "distribution";

  const totalsLabel = isDistribution
    ? "Distributed Amount (€)"
    : "Call Amount (€)";

  const setBreakdown = (v) => {
    if (typeof setDraft !== "function") return;
    setDraft((prev) => ({ ...(prev || EMPTY_DRAFT), breakdown: v }));
  };

  const setFlows = (updater) => {
    if (typeof setDraft !== "function") return;
    setDraft((prev) => {
      const p = prev || EMPTY_DRAFT;
      const nextFlows =
        typeof updater === "function" ? updater(p.flows || []) : updater;
      return { ...p, flows: nextFlows };
    });
  };

  const setFlowTotalInputs = (updater) => {
    if (typeof setDraft !== "function") return;
    setDraft((prev) => {
      const p = prev || EMPTY_DRAFT;
      const next =
        typeof updater === "function"
          ? updater(p.flowTotalInputs || {})
          : updater;
      return { ...p, flowTotalInputs: next };
    });
  };

  const setFlowTotals = (updater) => {
    if (typeof setDraft !== "function") return;
    setDraft((prev) => {
      const p = prev || EMPTY_DRAFT;
      const next =
        typeof updater === "function" ? updater(p.flowTotals || {}) : updater;
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
    const label =
      cleanName ||
      flowData?.flowTypeName ||
      flowData?.flowType ||
      `Flow ${flows.length + 1}`;

    const flowTypeId = flowData?.flowTypeId ?? flowData?.flow_type_id ?? null;

    const newFlow = {
      id: `flow_${Date.now()}_${Math.random().toString(16).slice(2)}`,
      label,
      flowType: flowData?.flowTypeName || flowData?.flowType || "",
      data: {
        ...flowData,
        flowTypeId,
      },
      operation_flow_id: null,
    };

    setFlows((prev) => [...prev, newFlow]);
    setShowAddFlow(false);

    setFlowTotalInputs((prev) => ({ ...prev, [newFlow.id]: "" }));
    setFlowTotals((prev) => ({ ...prev, [newFlow.id]: null }));
  };

  const totalCommitment = useMemo(() => {
    const arr = Array.isArray(lps) ? lps : [];
    return arr.reduce((acc, lp) => acc + (getLpCommitmentNumber(lp) || 0), 0);
  }, [lps]);

  /** LP rows */
  const lpRows = useMemo(() => {
    const arr = Array.isArray(lps) ? lps : [];

    const base = arr.map((lp, idx) => {
      const name = lp?.name ?? lp?.fullName ?? lp?.lpName ?? "—";

      const initials =
        lp?.initials ??
        (name
          ? name
              .split(" ")
              .filter(Boolean)
              .slice(0, 2)
              .map((w) => w[0].toUpperCase())
              .join("")
          : "LP");

      const ownershipRaw =
        lp?.ownership ??
        lp?.ownershipPercent ??
        lp?.ownershipPct ??
        lp?.ownershipPctDecimal ??
        lp?.percentOwnership ??
        lp?.percentOfOwnership ??
        lp?.ownership_percentage ??
        lp?.["% of Ownership"];

      const pctFromProp = parsePercent(ownershipRaw);
      const commitmentNumber = getLpCommitmentNumber(lp);
      const calledAmountNumber = getLpCalledAmountNumber(lp);

      const realId = lp?.lp_id ?? lp?.id ?? lp?.lpId ?? `${idx}`;

      return {
        id: String(realId),
        name,
        initials,
        pctFromProp,
        commitmentNumber,
        calledAmountNumber,
        shareClassId: getPrimaryShareClassId(lp),
      };
    });

    const totalCommit = base.reduce(
      (acc, r) => acc + (r.commitmentNumber || 0),
      0
    );

    const allProvidedAreZero =
      totalCommit > 0 &&
      base.length > 0 &&
      base.every((r) => r.pctFromProp !== null && Number(r.pctFromProp) === 0);

    return base.map((r) => {
      let ownershipPct = r.pctFromProp;

      if (ownershipPct === null) {
        ownershipPct = totalCommit > 0 ? r.commitmentNumber / totalCommit : null;
      }

      if (allProvidedAreZero) {
        ownershipPct = totalCommit > 0 ? r.commitmentNumber / totalCommit : 0;
      }

      return {
        id: r.id,
        name: r.name,
        initials: r.initials,
        ownershipPct,
        shareClassId: r.shareClassId,
        commitmentNumber: r.commitmentNumber,
        calledAmountNumber: r.calledAmountNumber,
      };
    });
  }, [lps]);

  /** Share class rows (also compute called amount by class) */
  const shareClassRows = useMemo(() => {
    const arr = Array.isArray(lps) ? lps : [];

    const sumsByClass = new Map();
    const calledByClass = new Map();

    let grand = 0;

    arr.forEach((lp) => {
      const rows = Array.isArray(lp?.sharesRows) ? lp.sharesRows : [];
      const calledLp = getLpCalledAmountNumber(lp);

      if (rows.length) {
        const totalLpCommit = rows.reduce(
          (acc, r) => acc + (parseMoney(r?.commitment) || 0),
          0
        );

        rows.forEach((r) => {
          const keyRaw = r?.type ?? r?.shareClass ?? r?.class ?? "-";
          const key = String(keyRaw || "-").trim() || "-";
          const commit = parseMoney(r?.commitment) || 0;

          if (!sumsByClass.has(key)) sumsByClass.set(key, 0);
          sumsByClass.set(key, (sumsByClass.get(key) || 0) + commit);
          grand += commit;

          // ✅ allocate called amount proportionally by commitment share
          const ratio =
            totalLpCommit > 0 ? commit / totalLpCommit : 0;

          if (!calledByClass.has(key)) calledByClass.set(key, 0);
          calledByClass.set(key, (calledByClass.get(key) || 0) + calledLp * ratio);
        });
      } else {
        const keyRaw = lp?.class ?? lp?.shareClass ?? "-";
        const key = String(keyRaw || "-").trim() || "-";
        const commit = parseMoney(lp?.commitment) || 0;

        if (!sumsByClass.has(key)) sumsByClass.set(key, 0);
        sumsByClass.set(key, (sumsByClass.get(key) || 0) + commit);
        grand += commit;

        if (!calledByClass.has(key)) calledByClass.set(key, 0);
        calledByClass.set(key, (calledByClass.get(key) || 0) + calledLp);
      }
    });

    const keys = Array.from(sumsByClass.keys()).sort((a, b) =>
      String(a).localeCompare(String(b))
    );

    return keys.map((k) => {
      const sum = sumsByClass.get(k) || 0;
      const pct = grand > 0 ? sum / grand : null;

      const pretty =
        String(k).toUpperCase().startsWith("CLASS ")
          ? String(k)
          : `Class ${String(k)}`;

      const stableId = `sc_${String(k).toLowerCase().replace(/\s+/g, "_")}`;

      return {
        id: stableId,
        name: pretty,
        initials: String(k).toUpperCase().replace("CLASS", "").trim() || "SC",
        ownershipPct: pct,
        shareClassKey: String(k || "").trim(),
        commitmentNumber: sum,
        calledAmountNumber: calledByClass.get(k) || 0,
      };
    });
  }, [lps]);

  const rows = breakdown === "share-class" ? shareClassRows : lpRows;

  /** Layout */
  const capMinPx =
    flows.length > 0 ? flows.length * FLOW_W + BLUEBOX_SIDE_PADDING : null;

  const gridCols = useMemo(() => {
    if (isEqualization) {
      if (flows.length > 0) {
        return `${LPS_W}px ${EQ_W}px minmax(${capMinPx}px, 1fr) ${TOT_W}px`;
      }
      return `${LPS_W}px ${EQ_W}px 1fr ${TOT_W}px`;
    }

    if (flows.length > 0) {
      return `${LPS_W}px minmax(${capMinPx}px, 1fr) ${TOT_W}px`;
    }
    return `${LPS_W}px 1fr ${TOT_W}px`;
  }, [isEqualization, flows.length, capMinPx]);

  const flowCols =
    flows.length > 0 ? `repeat(${flows.length}, ${FLOW_W}px)` : undefined;

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

      if (pct === null || pct === undefined || !Number.isFinite(pct)) {
        map[r.id] = null;
        continue;
      }

      let sum = 0;
      let hasAny = false;

      for (const fid of flowIds) {
        const t = flowTotals[fid];
        if (t !== null && t !== undefined && Number.isFinite(t)) {
          sum += t * pct;
          hasAny = true;
        }
      }

      map[r.id] = hasAny ? sum : null;
    }

    return map;
  }, [rows, flows, flowTotals]);

  /** ✅ grand total = sum of all flow totals (this is the "sum of all totals") */
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

    return any ? sum : null;
  }, [flows, flowTotals]);

  /**
   * ✅ Point (3)
   * percent under each input = (input amount / totalCommitment) * 100
   */
  const flowPercents = useMemo(() => {
    const map = {};
    for (const f of flows) {
      const t = flowTotals[f.id];
      if (
        totalCommitment > 0 &&
        t !== null &&
        t !== undefined &&
        Number.isFinite(t)
      ) {
        map[f.id] = (t / totalCommitment) * 100;
      } else {
        map[f.id] = null;
      }
    }
    return map;
  }, [flows, flowTotals, totalCommitment]);

  const grandPercent =
    totalCommitment > 0 && grandTotal !== null && Number.isFinite(grandTotal)
      ? (grandTotal / totalCommitment) * 100
      : null;

  /**
   * ✅ Point (4)
   * equalization target per row =
   * (targetPct * commitmentOfRow) - calledAmountOfRow
   */
  const eqTargetPct = useMemo(() => {
    const f = parsePercent(eqTargetInput);
    return f !== null && Number.isFinite(f) ? f : null; // fraction (0..1)
  }, [eqTargetInput]);

  const eqByRowId = useMemo(() => {
    if (!isEqualization) return {};
    const out = {};

    for (const r of rows) {
      const target = eqTargetPct;
      if (target === null || !Number.isFinite(target)) {
        out[r.id] = null;
        continue;
      }

      const commit = Number(r?.commitmentNumber || 0);
      const called = Number(r?.calledAmountNumber || 0);

      if (!Number.isFinite(commit)) {
        out[r.id] = null;
        continue;
      }

      out[r.id] = target * commit - called;
    }

    return out;
  }, [isEqualization, rows, eqTargetPct]);

  /** Lookup maps for nominal values */
  const shareClassLookup = useMemo(() => {
    const byId = new Map();
    const byName = new Map();

    (Array.isArray(shareClasses) ? shareClasses : []).forEach((sc) => {
      const id =
        sc?.share_class_id ??
        sc?.id ??
        sc?.shareClassId ??
        sc?.share_class ??
        null;

      const name =
        sc?.share_class_name ??
        sc?.name ??
        sc?.shareClassName ??
        sc?.share_class_label ??
        null;

      const nominal = getNominalValueFromShareClass(sc);

      if (id !== null && id !== undefined) byId.set(String(id), nominal);
      if (name) byName.set(String(name).toLowerCase().trim(), nominal);

      if (name) {
        const n = String(name).toLowerCase().trim();
        if (!n.startsWith("class ")) byName.set(`class ${n}`, nominal);
      }
    });

    return { byId, byName };
  }, [shareClasses]);

  /** Shares issued */
  const sharesIssuedByRowId = useMemo(() => {
    const out = {};

    for (const r of rows) {
      const mainAmount = totalsByRowId[r.id];
      if (mainAmount === null || !Number.isFinite(mainAmount)) {
        out[r.id] = null;
        continue;
      }

      let scKey = null;

      if (breakdown === "share-class") {
        scKey = r.shareClassKey ?? r.name ?? null;
      } else {
        scKey = r.shareClassId ?? null;
      }

      if (!scKey) {
        out[r.id] = null;
        continue;
      }

      const raw = String(scKey).trim();
      if (!raw || raw === "-") {
        out[r.id] = null;
        continue;
      }

      let nominal = shareClassLookup.byId.get(raw);

      if (nominal === null || nominal === undefined) {
        const lc = raw.toLowerCase();
        nominal =
          shareClassLookup.byName.get(lc) ??
          shareClassLookup.byName.get(lc.replace(/^class\s+/, "")) ??
          shareClassLookup.byName.get(`class ${lc.replace(/^class\s+/, "")}`);
      }

      if (!Number.isFinite(nominal) || nominal <= 0) {
        out[r.id] = null;
        continue;
      }

      out[r.id] = mainAmount / nominal;
    }

    return out;
  }, [rows, totalsByRowId, breakdown, shareClassLookup]);

  /** Persist flows */
  const persistFlows = useCallback(async () => {
    if (!operationId) {
      throw new Error("Missing operationId (Step 1 must be saved first).");
    }

    const toCreate = flows.filter((f) => !f?.operation_flow_id);

    const roundMoney = (val, decimals = 2) => {
      if (val === null || val === undefined) return null;
      const n = Number(val);
      if (!Number.isFinite(n)) return null;
      return Number(n.toFixed(decimals));
    };

    const clampDecimal = (val, decimals = 6) => {
      if (val === null || val === undefined) return 0;
      const n = Number(val);
      if (!Number.isFinite(n)) return 0;
      const clamped = Math.min(Math.max(n, 0), 1);
      return Number(clamped.toFixed(decimals));
    };

    for (const f of toCreate) {
      const total = flowTotals[f.id];

      const inputAmount =
        total !== null && total !== undefined && Number.isFinite(total)
          ? roundMoney(total, 2)
          : null;

      const flowTypeId = f?.data?.flowTypeId ?? f?.data?.flow_type_id ?? null;

      if (!flowTypeId) {
        throw new Error(
          `Flow "${f.label}" is missing flowTypeId. Make sure AddFlowModal returns flow_type_id from DB.`
        );
      }

      const rawAlloc =
        totalCommitment > 0 && inputAmount !== null
          ? inputAmount / totalCommitment
          : 0;

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
      const created = await fetchJson(url, {
        method: "POST",
        body: JSON.stringify(payload),
      });

      const newOpFlowId =
        created?.operation_flow_id ?? created?.id ?? created?.pk ?? null;

      if (!newOpFlowId) {
        throw new Error("Flow created but response missing operation_flow_id.");
      }

      setFlows((prev) =>
        (prev || []).map((x) =>
          x.id === f.id ? { ...x, operation_flow_id: newOpFlowId } : x
        )
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
        grandPercent !== null && Number.isFinite(grandPercent)
          ? grandPercent / 100
          : null;

      for (const r of rows) {
        const pct = r.ownershipPct;
        const rowFlows = {};

        for (const f of flows) {
          const t = flowTotals[f.id];
          const value =
            t !== null &&
            t !== undefined &&
            Number.isFinite(t) &&
            pct !== null &&
            pct !== undefined &&
            Number.isFinite(pct)
              ? t * pct
              : null;

          rowFlows[f.id] = value;
        }

        perLpOut[r.id] = {
          mainAmount: totalsByRowId[r.id],
          calledPct: calledPctDecimal,
          sharesIssued: sharesIssuedByRowId[r.id],
          flows: rowFlows,

          // ✅ equalization outputs
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
    onNext,
    operationType,
    flows,
    flowTotals,
    rows,
    totalsByRowId,
    grandPercent,
    sharesIssuedByRowId,
    persistFlows,
    isEqualization,
    eqByRowId,
    eqTargetPct,
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
              className={
                "op2-breakdown-tab" +
                (breakdown === "share-class"
                  ? " op2-breakdown-tab--active"
                  : "")
              }
              onClick={() => setBreakdown("share-class")}
              disabled={isSaving}
            >
              Share Class
            </button>
            <button
              type="button"
              className={
                "op2-breakdown-tab" +
                (breakdown === "lps" ? " op2-breakdown-tab--active" : "")
              }
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
                  <button
                    type="button"
                    className="op2-head-plus"
                    onClick={openFlow}
                    aria-label="Add flow"
                    disabled={isSaving}
                  >
                    +
                  </button>
                </div>

                <div className="op2-head-block op2-head-block--dark op2-head-block--tot">
                  TOTAUX
                </div>
              </>
            ) : (
              <>
                <div className="op2-head-block op2-head-block--cap">
                  <div className="op2-cap-strip-type">
                    {(operationType || "Distribution").toUpperCase()}
                  </div>

                  <button
                    type="button"
                    className="op2-head-plus"
                    onClick={openFlow}
                    aria-label="Add flow"
                    disabled={isSaving}
                  >
                    +
                  </button>
                </div>

                <div className="op2-head-block op2-head-block--dark op2-head-block--tot">
                  TOTAUX
                </div>
              </>
            )}
          </div>

          {/* BODY */}
          <div className="op2-body-row" style={{ gridTemplateColumns: gridCols }}>
            {/* LPs */}
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
                        <span className="op2-num">
                          {v === null ? "-" : formatMoney(v)}
                        </span>
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
                    <button
                      type="button"
                      className="op2-add-flow-btn"
                      onClick={openFlow}
                      disabled={isSaving}
                    >
                      + Add a first flow
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="op2-cap-header">
                      <div
                        className="op2-cap-header-grid"
                        style={{ gridTemplateColumns: flowCols }}
                      >
                        {flows.map((flow) => (
                          <div key={flow.id} className="op2-cap-header-cell">
                            <div className="op2-flow-title">{flow.label}</div>
                            <div className="op2-flow-subtitle">{flow.flowType}</div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="op2-cap-body">
                      <div
                        className="op2-cap-grid"
                        style={{ gridTemplateColumns: flowCols }}
                      >
                        {flows.map((flow) => {
                          const total = flowTotals[flow.id];

                          return (
                            <div key={flow.id} className="op2-flow-col">
                              {rows.map((r) => {
                                const pct = r.ownershipPct;

                                const value =
                                  total !== null &&
                                  total !== undefined &&
                                  Number.isFinite(total) &&
                                  pct !== null &&
                                  pct !== undefined &&
                                  Number.isFinite(pct)
                                    ? total * pct
                                    : null;

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
                      <span className="op2-num">
                        {v === null ? "-" : formatMoney(v)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* FOOTER */}
          <div className="op2-footer-row" style={{ gridTemplateColumns: gridCols }}>
            <div className="op2-footer-cell op2-footer-cell--label">Total</div>

            {/* Equalization footer (keep percent meaning same as your point #3) */}
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

            {/* Flows footer */}
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
                <div
                  className="op2-cap-footer-grid"
                  style={{ gridTemplateColumns: flowCols }}
                >
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

                      {/* ✅ Point (3) */}
                      <div className="op2-footer-percent">
                        = {formatPct(flowPercents[flow.id])}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ✅ Totaux footer: white box shows SUM OF ALL TOTALS (grandTotal) */}
            <div className="op2-footer-cell">
              <div className="op2-footer-total-input">
                <span className="op2-footer-euro">€</span>
                <span className="op2-footer-dash">
                  {grandTotal === null ? "-" : formatMoney(grandTotal)}
                </span>
              </div>

              {/* ✅ Point (3) */}
              <div className="op2-footer-percent">= {formatPct(grandPercent)}</div>
            </div>
          </div>
        </div>
      </div>

      {showAddFlow && (
        <AddFlowModal onClose={closeFlow} onSave={handleSaveFlow} isSaving={isSaving} />
      )}
    </>
  );
});

export default OperationStep2;
