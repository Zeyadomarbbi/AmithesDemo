// frontend/src/pages/App/pages/LPsStatement/components/NewOperation/OperationStep3Breakdown.jsx
import React, {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useMemo,
  useState,
  useEffect,
} from "react";
import "./OperationStep3Breakdown.css";


/** -------------------------
 * Helpers
 * ------------------------- */
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

function fmtPctFraction(frac) {
  if (frac === null || frac === undefined || frac === "") return "";
  const num = Number(frac);
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

function isDistributionType(operationType = "") {
  return String(operationType || "").toLowerCase().includes("distribution");
}

function parseMoney(value) {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "number") return Number.isFinite(value) ? value : null;

  const s = String(value).trim();
  if (!s) return null;

  let cleaned = s.replace(/[^\d.,-]/g, "");
  if (!cleaned) return null;

  const lastComma = cleaned.lastIndexOf(",");
  const lastDot = cleaned.lastIndexOf(".");
  if (lastComma > lastDot) {
    cleaned = cleaned.replace(/\./g, "").replace(",", ".");
  } else {
    cleaned = cleaned.replace(/,/g, "");
  }

  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

function getLpCommitmentNumber(lp) {
  const rows = Array.isArray(lp?.sharesRows) ? lp.sharesRows : [];
  if (rows.length) {
    const sum = rows.reduce((acc, r) => acc + (parseMoney(r?.commitment) || 0), 0);
    return Number.isFinite(sum) ? sum : 0;
  }
  return parseMoney(lp?.commitment) || 0;
}

function getPrimaryShareClassId(lp) {
  const rows = Array.isArray(lp?.sharesRows) ? lp.sharesRows : [];
  if (rows.length) {
    let best = null;
    let bestAmt = -Infinity;

    rows.forEach((r) => {
      const sc =
        r?.share_class_id ??
        r?.shareClassId ??
        r?.shareClass ??
        r?.share_class ??
        r?.type ??
        r?.class ??
        null;

      const amt = parseMoney(r?.commitment) || 0;
      if (sc !== null && sc !== undefined && amt > bestAmt) {
        bestAmt = amt;
        best = sc;
      }
    });

    if (best !== null && best !== undefined) return Number(best);
  }

  const direct =
    lp?.share_class_id ??
    lp?.shareClassId ??
    lp?.shareClass ??
    lp?.share_class ??
    lp?.class ??
    null;

  return direct !== null && direct !== undefined ? Number(direct) : null;
}

function getMainAmountFromStep2(step2Row = {}) {
  if (step2Row.mainAmount !== undefined) return step2Row.mainAmount;
  if (step2Row.capitalCall !== undefined) return step2Row.capitalCall;
  if (step2Row.distribution !== undefined) return step2Row.distribution;
  return null;
}

const OperationStep3Breakdown = forwardRef(function OperationStep3Breakdown(
  {
    lps = [],
    step2Result,
    operationType,
    operationId = null,
    operationNumber,
    totalFundCommitment = 0,
    onFinalSave,
    commitments = [],
    existingAllocations = [], 
    dueDate = null,
  },
  ref
) {
  const opType = step2Result?.operationType || operationType || "";
  const distMode = useMemo(() => isDistributionType(opType), [opType]);

  const flows = step2Result?.flows || [];
  const perLp = step2Result?.perLp || {};

  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [savedOnce, setSavedOnce] = useState(false);

  const committedLpIds = useMemo(() => {
    return new Set((Array.isArray(commitments) ? commitments : []).map((c) => String(c.lp_id)));
  }, [commitments]);

  const filteredLps = useMemo(() => {
    return (Array.isArray(lps) ? lps : []).filter((lp) => {
      const id = String(lp?.lp_id ?? lp?.id ?? "");
      return committedLpIds.has(id);
    });
  }, [lps, committedLpIds]);


  /**
   * Build "before" totals from existingAllocations (all previous operations).
   * Aggregates capital_call and shares_issued per LP across all past operations.
   */
  const beforeByLp = useMemo(() => {
    const map = {};
    const safe = Array.isArray(existingAllocations) ? existingAllocations : [];
    const currentOpNum = operationNumber != null ? Number(operationNumber) : Infinity;

    safe.forEach((alloc) => {
      if (Number(alloc?.operation_number ?? 0) >= currentOpNum) {
        return;
      }

      const lpId = String(alloc?.lp_id ?? "");
      if (!lpId) return;

      if (!map[lpId]) {
        map[lpId] = { capitalCall: 0, sharesIssued: 0 };
      }

      map[lpId].capitalCall += Number(alloc?.capital_call ?? 0);
      map[lpId].sharesIssued += Number(alloc?.shares_issued ?? 0);
    });

    return map;
  }, [existingAllocations, operationNumber]);
  const rows = useMemo(() => {
    // Build a map of LPs that have a commitment passing the filter
    const lpMap = new Map(); // lp_id -> LP object
    const safeLps = Array.isArray(lps) ? lps : [];

    const safeCommitments = Array.isArray(commitments) ? commitments : [];

    safeCommitments.forEach((c) => {
      const lpIdStr = String(c.lp_id);
      // Skip commitments outside due date (replicate filteredCommitments)
      const closing = c?.closing_period_date ? new Date(c.closing_period_date) : null;
      if (!closing || isNaN(closing.getTime()) || closing > dueDate) return;

      // Only add LP once
      if (!lpMap.has(lpIdStr)) {
        const lpObj = safeLps.find((lp) => String(lp?.lp_id ?? lp?.id ?? "") === lpIdStr);
        if (lpObj) lpMap.set(lpIdStr, lpObj);
      }
    });

    const arr = Array.from(lpMap.values());

    return arr.map((lp, idx) => {
      const lpIdStr = String(lp?.lp_id ?? lp?.id ?? `${idx}`);
      const name = lp?.name ?? lp?.fullName ?? lp?.lpName ?? lp?.label ?? "";

      const shareClassId = getPrimaryShareClassId(lp);

      // Get commitment from the filtered commitments
      const lpCommitmentRecord = safeCommitments.find(
        (c) => String(c.lp_id) === lpIdStr && new Date(c.closing_period_date) <= dueDate
      );
      const commitmentAmount = Number(lpCommitmentRecord?.commitment_amount ?? getLpCommitmentNumber(lp)) || 0;

      const step2 = perLp?.[lpIdStr] || {};
      const mainAmountNum = Number(getMainAmountFromStep2(step2) || 0);

      const aggBefore = beforeByLp[lpIdStr] || { capitalCall: 0, sharesIssued: 0 };
      const beforeAmount = Number(aggBefore.capitalCall);
      const beforeShares = Number(aggBefore.sharesIssued);

      if (distMode) {
        const distributedAfter = beforeAmount + mainAmountNum;
        const pctBefore = commitmentAmount > 0 ? beforeAmount / commitmentAmount : 0;
        const pctOp = commitmentAmount > 0 ? mainAmountNum / commitmentAmount : 0;
        const pctAfter = commitmentAmount > 0 ? distributedAfter / commitmentAmount : 0;
        const sharesAfter = beforeShares; // adjust if needed

        return {
          id: lpIdStr,
          initials: lp?.initials || initialsFromName(name),
          name,
          beforeA: fmtMoney(beforeAmount),
          beforePct: fmtPctFraction(pctBefore),
          beforeShares: fmtShares(beforeShares),
          opAmount: fmtMoney(mainAmountNum),
          opPct: fmtPctFraction(pctOp),
          afterA: fmtMoney(distributedAfter),
          afterPct: fmtPctFraction(pctAfter),
          afterShares: fmtShares(sharesAfter),
        };
      }

      // Non-distribution
      const afterCalled = beforeAmount + mainAmountNum;
      const afterPct = commitmentAmount > 0 ? afterCalled / commitmentAmount : 0;
      const sharesIssued = Number(step2?.sharesIssued || 0);
      const afterSharesNon = beforeShares + sharesIssued;
      const undrawn = commitmentAmount - afterCalled;

      const step2Flows = step2?.flows || {};
      const opCalledPct = commitmentAmount > 0 ? mainAmountNum / commitmentAmount : 0;
      const op = {
        mainAmount: fmtMoney(mainAmountNum),
        calledPct: fmtPctFraction(opCalledPct),
        sharesIssued: fmtShares(step2?.sharesIssued ?? null),
      };
      flows.forEach((f) => {
        op[f.id] = fmtMoney(step2Flows[f.id]);
      });

      return {
        id: lpIdStr,
        initials: lp?.initials || initialsFromName(name),
        name,
        before: {
          calledBefore: fmtMoney(beforeAmount),
          calledPctBefore: fmtPctFraction(beforeAmount / commitmentAmount),
          sharesBefore: fmtShares(beforeShares),
        },
        op,
        after: {
          calledAfter: fmtMoney(afterCalled),
          calledPctAfter: fmtPctFraction(afterPct),
          sharesAfter: fmtShares(afterSharesNon),
          undrawn: fmtMoney(undrawn),
        },
      };
    });
  }, [lps, commitments, perLp, flows, distMode, beforeByLp, dueDate]);


  const baseOpCols = useMemo(() => {
    if (distMode) return [];
    return [
      { key: "mainAmount", label: "Amount (€)" },
      { key: "calledPct", label: "% Called" },
      { key: "sharesIssued", label: "Shares issued" },
    ];
  }, [distMode]);

  const flowOpCols = useMemo(() => [], []);

  const opCols = useMemo(() => {
    if (distMode) return [];
    return [...baseOpCols, ...flowOpCols];
  }, [baseOpCols, flowOpCols, distMode]);

  const submitToNext = useCallback(async () => {
    if (!onFinalSave) throw new Error("onFinalSave not provided.");

    setIsSaving(true);
    setSaveError(null);

    try {
      if (savedOnce) return;

      await onFinalSave();
      setSavedOnce(true);
    } catch (e) {
      setSaveError(e);
      throw e;
    } finally {
      setIsSaving(false);
    }
  }, [onFinalSave, savedOnce]);

  useImperativeHandle(ref, () => ({ submitToNext }), [submitToNext]);

  const saveErrorMsg = saveError?.message ? String(saveError.message) : null;

  // =========================
  // DISTRIBUTION TABLE
  // =========================
  if (distMode) {
    return (
      <div className="op3-root">

        {saveErrorMsg && (
          <div style={{ marginBottom: 10, color: "#b42318", fontSize: 12 }}>
            {saveErrorMsg}
          </div>
        )}

        <div className="op3-table-wrapper">
          <div className="op3-scroll-x">
            <table className="op3-table op3-table--wide">
              <colgroup>
                <col className="op3-col-lp" />
                <col className="op3-col-called" />
                <col className="op3-col-calledpct" />
                <col className="op3-col-shares" />
                <col className="op3-col-op" />
                <col className="op3-col-op" />
                <col className="op3-col-op" />
                <col className="op3-col-after" />
                <col className="op3-col-after" />
                <col className="op3-col-after" />
              </colgroup>

              <thead>
                <tr className="op3-top-row">
                  <th className="op3-top op3-top-info op3-sticky-0" colSpan={1}>
                    INFORMATION
                  </th>
                  <th className="op3-top op3-top-breakdown" colSpan={3}>
                    BREAKDOWN BEFORE OPERATION
                    <button type="button" className="op3-top-plus" disabled={isSaving}>
                      +
                    </button>
                  </th>
                  <th className="op3-top op3-top-op" colSpan={3}>
                    OPERATION
                  </th>
                  <th className="op3-top op3-top-after" colSpan={3}>
                    BREAKDOWN AFTER OPERATION
                  </th>
                </tr>

                <tr className="op3-head-row">
                  <th className="op3-head op3-head-lp op3-sticky-0">LPs</th>
                  <th className="op3-head">Distributed before (€)</th>
                  <th className="op3-head">% Distributed before</th>
                  <th className="op3-head">Shares before</th>
                  <th className="op3-head">Distribution (€)</th>
                  <th className="op3-head">% Distribution</th>
                  <th className="op3-head">Shares redeemed</th>
                  <th className="op3-head">Distributed after (€)</th>
                  <th className="op3-head">% Distributed after</th>
                  <th className="op3-head">Shares after</th>
                </tr>
              </thead>

              <tbody>
                {rows.map((row, index) => {
                  const isAlt = index % 2 === 1;
                  return (
                    <tr key={row.id} className={`op3-body-row ${isAlt ? "is-alt" : ""}`}>
                      <td className="op3-cell-lp op3-sticky-0">
                        <div className="op3-avatar">{row.initials}</div>
                        <span className="op3-lp-name">{row.name}</span>
                      </td>
                      <td className="op3-cell-calc">{row.beforeA}</td>
                      <td className="op3-cell-calc">{row.beforePct}</td>
                      <td className="op3-cell-calc">{row.beforeShares}</td>
                      <td className="op3-cell-fetched">{row.opAmount}</td>
                      <td className="op3-cell-fetched">{row.opPct}</td>
                      <td className="op3-cell-fetched">{row.opSharesRedeemed}</td>
                      <td className="op3-cell-calc">{row.afterA}</td>
                      <td className="op3-cell-calc">{row.afterPct}</td>
                      <td className="op3-cell-calc">{row.afterShares}</td>
                    </tr>
                  );
                })}
              </tbody>

              <tfoot>
                <tr className="op3-foot-row">
                  <td className="op3-foot-label op3-sticky-0">Total</td>
                  <td className="op3-foot op3-cell-calc"></td>
                  <td className="op3-foot op3-cell-calc"></td>
                  <td className="op3-foot op3-cell-calc"></td>
                  <td className="op3-foot op3-cell-fetched"></td>
                  <td className="op3-foot op3-cell-fetched"></td>
                  <td className="op3-foot op3-cell-fetched"></td>
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

  // =========================
  // NON-DISTRIBUTION TABLE
  // =========================
  return (
    <div className="op3-root">

      {saveErrorMsg && (
        <div style={{ marginBottom: 10, color: "#b42318", fontSize: 12 }}>
          {saveErrorMsg}
        </div>
      )}


      <div className="op3-table-wrapper">
        <div className="op3-scroll-x">
          <table className="op3-table op3-table--wide">
            <colgroup>
              <col className="op3-col-lp" />
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
                <th className="op3-top op3-top-info op3-sticky-0" colSpan={1}>
                  INFORMATION
                </th>
                <th className="op3-top op3-top-breakdown" colSpan={3}>
                  BREAKDOWN BEFORE OPERATION
                  <button type="button" className="op3-top-plus" disabled={isSaving}>
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
                <th className="op3-head op3-head-lp op3-sticky-0">LPs</th>
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
                  <tr key={row.id} className={`op3-body-row ${isAlt ? "is-alt" : ""}`}>
                    <td className="op3-cell-lp op3-sticky-0">
                      <div className="op3-avatar">{row.initials}</div>
                      <span className="op3-lp-name">{row.name}</span>
                    </td>
                    <td className="op3-cell-calc">{row.before.calledBefore}</td>
                    <td className="op3-cell-calc">{row.before.calledPctBefore}</td>
                    <td className="op3-cell-calc">{row.before.sharesBefore}</td>
                    {opCols.map((c) => (
                      <td key={c.key} className="op3-cell-fetched">
                        {row.op?.[c.key] ?? ""}
                      </td>
                    ))}
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
                <td className="op3-foot-label op3-sticky-0">Total</td>
                <td className="op3-foot op3-cell-calc"></td>
                <td className="op3-foot op3-cell-calc"></td>
                <td className="op3-foot op3-cell-calc"></td>
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
});

export default OperationStep3Breakdown;
