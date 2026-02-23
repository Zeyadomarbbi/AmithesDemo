// frontend/src/pages/App/pages/LPsStatement/components/NewOperation/OperationStep3Breakdown.jsx
import React, { useMemo } from "react";
import "./OperationStep3Breakdown.css";

/**
 * ✅ Only INFORMATION stays fixed (LPs + Share Class)
 * ✅ Everything else scrolls horizontally
 * ✅ First OPERATION column label depends on operationType
 *    (we read it from step2Result.operationType first, then props.operationType)
 *
 * Props expected:
 *  lps: [{ id, name, shareClass? }]
 *  operationType?: string
 *  step2Result?: {
 *    operationType?: string,             // ✅ IMPORTANT: "Distribution" | "Capital call" | ...
 *    flows?: [{ id, label }],
 *    perLp?: {
 *      [lpId]: {
 *        mainAmount?: number,            // ✅ preferred (the amount shown in first op column)
 *        capitalCall?: number,           // fallback
 *        distribution?: number,          // fallback
 *        calledPct?: number,             // 0..1
 *        sharesIssued?: number,
 *        flows?: { [flowId]: number }
 *      }
 *    }
 *  }
 */

function initialsFromName(name = "") {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "--";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function fmtMoney(n) {
  if (n === null || n === undefined || n === "") return "";
  const num = Number(n);
  if (!Number.isFinite(num)) return "";
  return num.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function fmtPct(n) {
  if (n === null || n === undefined || n === "") return "";
  const num = Number(n);
  if (!Number.isFinite(num)) return "";
  return `${(num * 100).toFixed(2)}%`;
}

function fmtShares(n) {
  if (n === null || n === undefined || n === "") return "";
  const num = Number(n);
  if (!Number.isFinite(num)) return "";
  return num.toLocaleString("en-US", {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  });
}

function getOperationMainLabel(operationType = "") {
  const t = String(operationType || "").trim().toLowerCase();

  if (t.includes("distribution")) return "Distribution (€)";
  if (t.includes("capital")) return "Capital call (€)";
  if (t.includes("call")) return "Capital call (€)";

  return "Amount (€)";
}

function getMainAmountFromStep2(step2Row = {}) {
  if (step2Row.mainAmount !== undefined) return step2Row.mainAmount;
  if (step2Row.capitalCall !== undefined) return step2Row.capitalCall;
  if (step2Row.distribution !== undefined) return step2Row.distribution;
  return null;
}

export default function OperationStep3Breakdown({
  lps = [],
  step2Result,
  operationType,
}) {
  // ✅ ALWAYS prefer op type coming from Step2 result
  const opType =
    step2Result?.operationType || operationType || "Capital call";

  const mainLabel = useMemo(() => getOperationMainLabel(opType), [opType]);

  const flows = step2Result?.flows || [];
  const perLp = step2Result?.perLp || {};

  const baseOpCols = useMemo(
    () => [
      { key: "mainAmount", label: mainLabel }, // ✅ dynamic label
      { key: "calledPct", label: "% Called" },
      { key: "sharesIssued", label: "Shares issued" },
    ],
    [mainLabel]
  );

  const flowOpCols = useMemo(
    () => flows.map((f) => ({ key: f.id, label: f.label })),
    [flows]
  );

  const opCols = useMemo(
    () => [...baseOpCols, ...flowOpCols],
    [baseOpCols, flowOpCols]
  );

  const rows = useMemo(() => {
    return (lps || []).map((lp) => {
      const lpId = lp.id;
      const name = lp.name || lp.label || "";
      const shareClass = lp.shareClass || lp.class || lp.share_class || "";

      const step2 = perLp?.[lpId] || {};
      const step2Flows = step2?.flows || {};

      // BEFORE breakdown (keep 0 for now)
      const before = {
        calledBefore: "0.00",
        calledPctBefore: "0.00%",
        sharesBefore: "0.000",
      };

      // Main amount comes from Step2 (preferred mainAmount)
      const mainAmountNum = getMainAmountFromStep2(step2);

      // OPERATION (yellow / fetched)
      const op = {
        mainAmount: fmtMoney(mainAmountNum),
        calledPct: fmtPct(step2.calledPct),
        sharesIssued: fmtShares(step2.sharesIssued),
      };

      // add dynamic flows
      flows.forEach((f) => {
        op[f.id] = fmtMoney(step2Flows[f.id]);
      });

      // AFTER breakdown (blue / placeholders until formulas)
      const after = {
        calledAfter: op.mainAmount,
        calledPctAfter: op.calledPct,
        sharesAfter: op.sharesIssued,
        undrawn: "",
      };

      return {
        id: lpId,
        initials: lp.initials || initialsFromName(name),
        name,
        shareClass,
        before,
        op,
        after,
      };
    });
  }, [lps, perLp, flows]);

  return (
    <div className="op3-root">
      <div className="op3-table-wrapper">
        <div className="op3-scroll-x">
          <table className="op3-table op3-table--wide">
            <colgroup>
              <col className="op3-col-lp" />
              <col className="op3-col-class" />

              <col className="op3-col-called" />
              <col className="op3-col-calledpct" />
              <col className="op3-col-shares" />

              {opCols.map((c) => (
                <col key={c.key} className="op3-col-op" />
              ))}

              <col className="op3-col-after" />
              <col className="op3-col-after" />
              <col className="op3-col-after" />
              <col className="op3-col-undrawn" />
            </colgroup>

            <thead>
              <tr className="op3-top-row">
                {/* ONLY FIXED */}
                <th className="op3-top op3-top-info op3-sticky-0" colSpan={2}>
                  INFORMATION
                </th>

                {/* MOVES */}
                <th className="op3-top op3-top-breakdown" colSpan={3}>
                  BREAKDOWN BEFORE OPERATION
                  <button type="button" className="op3-top-plus">
                    +
                  </button>
                </th>

                <th className="op3-top op3-top-op" colSpan={opCols.length}>
                  OPERATION
                </th>

                <th className="op3-top op3-top-after" colSpan={4}>
                  BREAKDOWN AFTER OPERATION
                </th>
              </tr>

              <tr className="op3-head-row">
                {/* ONLY FIXED */}
                <th className="op3-head op3-head-lp op3-sticky-0">LPs</th>
                <th className="op3-head op3-sticky-1">Share Class</th>

                {/* MOVES */}
                <th className="op3-head">Called before (€)</th>
                <th className="op3-head">% Called before</th>
                <th className="op3-head">Shares before</th>

                {opCols.map((c) => (
                  <th key={c.key} className="op3-head">
                    {c.label}
                  </th>
                ))}

                <th className="op3-head">Called after (€)</th>
                <th className="op3-head">% Called after</th>
                <th className="op3-head">Shares after</th>
                <th className="op3-head">Undrawn</th>
              </tr>
            </thead>

            <tbody>
              {rows.map((row, index) => {
                const isAlt = index % 2 === 1;
                return (
                  <tr
                    key={row.id}
                    className={`op3-body-row ${isAlt ? "is-alt" : ""}`}
                  >
                    {/* ONLY FIXED */}
                    <td className="op3-cell-lp op3-sticky-0">
                      <div className="op3-avatar">{row.initials}</div>
                      <span className="op3-lp-name">{row.name}</span>
                    </td>

                    <td className="op3-sticky-1 op3-cell-left">
                      {row.shareClass}
                    </td>

                    {/* MOVES (before = blue) */}
                    <td className="op3-cell-calc">{row.before.calledBefore}</td>
                    <td className="op3-cell-calc">
                      {row.before.calledPctBefore}
                    </td>
                    <td className="op3-cell-calc">{row.before.sharesBefore}</td>

                    {/* MOVES (operation = yellow) */}
                    {opCols.map((c) => (
                      <td key={c.key} className="op3-cell-fetched">
                        {row.op?.[c.key] ?? ""}
                      </td>
                    ))}

                    {/* MOVES (after = blue) */}
                    <td className="op3-cell-calc">{row.after.calledAfter}</td>
                    <td className="op3-cell-calc">{row.after.calledPctAfter}</td>
                    <td className="op3-cell-calc">{row.after.sharesAfter}</td>
                    <td className="op3-cell-calc">{row.after.undrawn}</td>
                  </tr>
                );
              })}
            </tbody>

            <tfoot>
              <tr className="op3-foot-row">
                {/* ONLY FIXED */}
                <td className="op3-foot-label op3-sticky-0">Total</td>
                <td className="op3-foot op3-sticky-1"></td>

                {/* MOVES */}
                <td className="op3-foot op3-cell-calc">0.00</td>
                <td className="op3-foot op3-cell-calc">0.00%</td>
                <td className="op3-foot op3-cell-calc">0.000</td>

                {opCols.map((c) => (
                  <td key={c.key} className="op3-foot op3-cell-fetched"></td>
                ))}

                <td className="op3-foot op3-cell-calc"></td>
                <td className="op3-foot op3-cell-calc"></td>
                <td className="op3-foot op3-cell-calc"></td>
                <td className="op3-foot op3-cell-calc"></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}
