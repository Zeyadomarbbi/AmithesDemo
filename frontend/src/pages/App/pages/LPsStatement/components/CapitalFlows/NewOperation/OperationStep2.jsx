// frontend/src/pages/App/pages/LPsStatement/components/NewOperation/OperationStep2.jsx
import React, {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useMemo,
  useState,
} from "react";
import "./OperationStep2.css";
import AddFlowModal from "./AddFlowModal.jsx";

const LPS_W = 340;
const TOT_W = 240;
const FLOW_W = 220;
const BLUEBOX_SIDE_PADDING = 28; // 14px left + 14px right

function parsePercent(value) {
  if (value === null || value === undefined || value === "") return null;

  if (typeof value === "number") {
    if (!Number.isFinite(value)) return null;
    return value > 1 ? value / 100 : value;
  }

  const s = String(value).trim().replace(/\s+/g, "");
  if (!s) return null;

  const cleaned = s.replace("%", "").replace(",", ".");
  const n = Number(cleaned);
  if (!Number.isFinite(n)) return null;

  return n > 1 ? n / 100 : n;
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
    const sum = rows.reduce((acc, r) => acc + (parseMoney(r?.commitment) || 0), 0);
    return Number.isFinite(sum) ? sum : 0;
  }
  return parseMoney(lp?.commitment) || 0;
}

const OperationStep2 = forwardRef(function OperationStep2(
  {
    lps = [],
    operationType = "Distribution",
    onNext,
    draft,
    setDraft,
  },
  ref
) {
  const [showAddFlow, setShowAddFlow] = useState(false);

  // ✅ persistent (comes from wizard)
  const breakdown = draft?.breakdown ?? "lps";
  const flows = draft?.flows ?? [];
  const flowTotalInputs = draft?.flowTotalInputs ?? {};
  const flowTotals = draft?.flowTotals ?? {};

  const setBreakdown = (v) =>
    setDraft((prev) => ({ ...prev, breakdown: v }));

  const setFlows = (updater) =>
    setDraft((prev) => ({
      ...prev,
      flows: typeof updater === "function" ? updater(prev.flows || []) : updater,
    }));

  const setFlowTotalInputs = (updater) =>
    setDraft((prev) => ({
      ...prev,
      flowTotalInputs:
        typeof updater === "function"
          ? updater(prev.flowTotalInputs || {})
          : updater,
    }));

  const setFlowTotals = (updater) =>
    setDraft((prev) => ({
      ...prev,
      flowTotals:
        typeof updater === "function" ? updater(prev.flowTotals || {}) : updater,
    }));

  const openFlow = () => setShowAddFlow(true);
  const closeFlow = () => setShowAddFlow(false);

  const handleSaveFlow = (flowData) => {
    const cleanName = flowData?.flowName?.trim();
    const label = cleanName || flowData?.flowType || `Flow ${flows.length + 1}`;

    const newFlow = {
      id: `flow_${Date.now()}_${Math.random().toString(16).slice(2)}`,
      label,
      flowType: flowData?.flowType || "",
      data: flowData,
    };

    setFlows((prev) => [...prev, newFlow]);
    setShowAddFlow(false);

    setFlowTotalInputs((prev) => ({ ...prev, [newFlow.id]: "" }));
    setFlowTotals((prev) => ({ ...prev, [newFlow.id]: null }));
  };

  const totalCommitment = useMemo(() => {
    return (lps || []).reduce(
      (acc, lp) => acc + (getLpCommitmentNumber(lp) || 0),
      0
    );
  }, [lps]);

  const lpRows = useMemo(() => {
    const base = (lps || []).map((lp, idx) => {
      const name = lp.name ?? lp.fullName ?? lp.lpName ?? "—";
      const initials =
        lp.initials ??
        (name
          ? name
              .split(" ")
              .filter(Boolean)
              .slice(0, 2)
              .map((w) => w[0].toUpperCase())
              .join("")
          : "LP");

      const ownershipRaw =
        lp.ownership ??
        lp.ownershipPercent ??
        lp.ownershipPct ??
        lp.ownershipPctDecimal ??
        lp.percentOwnership ??
        lp.percentOfOwnership ??
        lp.ownership_percentage ??
        lp["% of Ownership"];

      const pctFromProp = parsePercent(ownershipRaw);
      const commitmentNumber = getLpCommitmentNumber(lp);

      return {
        id: lp.id ?? lp.lpId ?? `${idx}`,
        name,
        initials,
        pctFromProp,
        commitmentNumber,
      };
    });

    const totalCommit = base.reduce((acc, r) => acc + (r.commitmentNumber || 0), 0);

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
      };
    });
  }, [lps]);

  const shareClassRows = useMemo(() => {
    const sumsByClass = new Map();
    let grand = 0;

    (lps || []).forEach((lp) => {
      const rows = Array.isArray(lp?.sharesRows) ? lp.sharesRows : [];

      if (rows.length) {
        rows.forEach((r) => {
          const keyRaw = r?.type ?? r?.shareClass ?? r?.class ?? "-";
          const key = String(keyRaw || "-").trim() || "-";
          const val = parseMoney(r?.commitment) || 0;

          if (!sumsByClass.has(key)) sumsByClass.set(key, 0);
          sumsByClass.set(key, sumsByClass.get(key) + val);
          grand += val;
        });
      } else {
        const keyRaw = lp?.class ?? lp?.shareClass ?? "-";
        const key = String(keyRaw || "-").trim() || "-";
        const val = parseMoney(lp?.commitment) || 0;

        if (!sumsByClass.has(key)) sumsByClass.set(key, 0);
        sumsByClass.set(key, sumsByClass.get(key) + val);
        grand += val;
      }
    });

    const priority = ["A1", "A2", "A3", "B"];
    const keys = Array.from(sumsByClass.keys());

    keys.sort((a, b) => {
      const A = String(a).toUpperCase();
      const B = String(b).toUpperCase();
      const ia = priority.indexOf(A);
      const ib = priority.indexOf(B);
      if (ia !== -1 && ib !== -1) return ia - ib;
      if (ia !== -1) return -1;
      if (ib !== -1) return 1;
      return A.localeCompare(B);
    });

    return keys.map((k) => {
      const sum = sumsByClass.get(k) || 0;
      const pct = grand > 0 ? sum / grand : null;
      const pretty =
        String(k).toUpperCase().startsWith("CLASS ")
          ? String(k)
          : `Class ${String(k)}`;

      return {
        id: `sc_${String(k).replace(/\s+/g, "_")}`,
        name: pretty,
        initials: String(k).toUpperCase().replace("CLASS", "").trim() || "SC",
        ownershipPct: pct,
      };
    });
  }, [lps]);

  const rows = breakdown === "share-class" ? shareClassRows : lpRows;

  const capMinPx =
    flows.length > 0 ? flows.length * FLOW_W + BLUEBOX_SIDE_PADDING : null;

  const gridCols =
    flows.length > 0
      ? `${LPS_W}px minmax(${capMinPx}px, 1fr) ${TOT_W}px`
      : `${LPS_W}px 1fr ${TOT_W}px`;

  const flowCols =
    flows.length > 0 ? `repeat(${flows.length}, ${FLOW_W}px)` : undefined;

  const onChangeFlowTotal = (flowId, raw) => {
    setFlowTotalInputs((prev) => ({ ...prev, [flowId]: raw }));
    setFlowTotals((prev) => ({ ...prev, [flowId]: parseMoney(raw) }));
  };

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

  const flowPercents = useMemo(() => {
    const map = {};
    for (const f of flows) {
      const t = flowTotals[f.id];
      if (totalCommitment > 0 && t !== null && t !== undefined && Number.isFinite(t)) {
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

  const submitToNext = useCallback(() => {
    if (typeof onNext !== "function") return;

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
        sharesIssued: null,
        flows: rowFlows,
      };
    }

    onNext({
      operationType: operationType || "Distribution",
      flows: flows.map((f) => ({ id: f.id, label: f.label, flowType: f.flowType })),
      perLp: perLpOut,
    });
  }, [onNext, operationType, flows, flowTotals, rows, totalsByRowId, grandPercent]);

  useImperativeHandle(ref, () => ({ submitToNext }), [submitToNext]);

  return (
    <>
      <div className="op2-topbar">
        <div className="op2-breakdown">
          <span className="op2-breakdown-label">Breakdown :</span>
          <div className="op2-breakdown-tabs">
            <button
              type="button"
              className={
                "op2-breakdown-tab" +
                (breakdown === "share-class" ? " op2-breakdown-tab--active" : "")
              }
              onClick={() => setBreakdown("share-class")}
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
            >
              LPs
            </button>
          </div>
        </div>
      </div>

      <div className="op2-table-outer">
        <div className="op2-table-inner">
          <div className="op2-head-row" style={{ gridTemplateColumns: gridCols }}>
            <div className="op2-head-block op2-head-block--dark" />

            <div className="op2-head-block op2-head-block--cap">
              <div className="op2-cap-strip-type">
                {(operationType || "Distribution").toUpperCase()}
              </div>

              <button
                type="button"
                className="op2-head-plus"
                onClick={openFlow}
                aria-label="Add flow"
              >
                +
              </button>
            </div>

            <div className="op2-head-block op2-head-block--dark op2-head-block--tot">
              TOTAUX
            </div>
          </div>

          <div className="op2-body-row" style={{ gridTemplateColumns: gridCols }}>
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

            <div className="op2-col op2-col--cap">
              <div className="op2-bluebox">
                {flows.length === 0 ? (
                  <div className="op2-cap-empty">
                    <button
                      type="button"
                      className="op2-add-flow-btn"
                      onClick={openFlow}
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

            <div className="op2-col op2-col--tot">
              <div className="op2-col-header op2-col-header--right">
                <span>Call Amount (€)</span>
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

          <div className="op2-footer-row" style={{ gridTemplateColumns: gridCols }}>
            <div className="op2-footer-cell op2-footer-cell--label">Total</div>

            <div className="op2-footer-cell op2-footer-cell--cap">
              {flows.length === 0 ? (
                <>
                  <div className="op2-footer-total-input op2-footer-total-input--wide">
                    <span className="op2-footer-euro">€</span>
                    <input className="op2-footer-input" />
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
                        />
                      </div>

                      <div className="op2-footer-percent">
                        = {formatPct(flowPercents[flow.id])}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="op2-footer-cell">
              <div className="op2-footer-total-input">
                <span className="op2-footer-euro">€</span>
                <span className="op2-footer-dash">
                  {grandTotal === null ? "-" : formatMoney(grandTotal)}
                </span>
              </div>
              <div className="op2-footer-percent">= {formatPct(grandPercent)}</div>
            </div>
          </div>
        </div>
      </div>

      {showAddFlow && <AddFlowModal onClose={closeFlow} onSave={handleSaveFlow} />}
    </>
  );
});

export default OperationStep2;
