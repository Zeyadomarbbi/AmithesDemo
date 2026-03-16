import React, {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useMemo,
  useState,
} from "react";
import { useTableSort, SortableHeaderRenderer } from '../../../../../../../../components/Sort/TableSort';
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
    shareClasses = [],
    operations = [],
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

  const shareClassLookup = useMemo(() => {
    const map = new Map();
    (Array.isArray(shareClasses) ? shareClasses : []).forEach((sc) => {
      map.set(String(sc.share_class_id), sc);
    });
    return map;
  }, [shareClasses]);
  const operationTypeById = useMemo(() => {
    const map = new Map();
    (Array.isArray(operations) ? operations : []).forEach((op) => {
      const id = op?.lps_operation_details_id ?? op?.operation_id ?? op?.id;
      const typeName = String(op?.operation_type_name ?? op?.type_name ?? "").toLowerCase();
      if (id) map.set(Number(id), typeName);
    });
    return map;
  }, [operations]);

  const beforeByLp = useMemo(() => {
    const map = {};
    const safe = Array.isArray(existingAllocations) ? existingAllocations : [];
    const currentOpNum = operationNumber != null ? Number(operationNumber) : Infinity;
    const currentIsDistribution = isDistributionType(opType);

    safe.forEach((alloc) => {
      if (Number(alloc?.operation_number ?? 0) >= currentOpNum) return;

      const allocOpId = Number(alloc?.lps_operation_details);
      const allocTypeName = operationTypeById.get(allocOpId) ?? "";
      const allocIsDistribution = allocTypeName.includes("distribution");

      // Only sum same-type operations
      if (currentIsDistribution !== allocIsDistribution) return;

      const lpId = String(alloc?.lp_id ?? "");
      if (!lpId) return;
      if (!map[lpId]) {
        map[lpId] = { capitalCall: 0, sharesIssued: 0 };
      }
      map[lpId].capitalCall += Number(alloc?.capital_call ?? 0);
      map[lpId].sharesIssued += Number(alloc?.shares_issued ?? 0);
    });
    return map;
  }, [existingAllocations, operationNumber, opType, operationTypeById]);

  const sharesBeforeByLp = useMemo(() => {
    const map = {};
    const safe = Array.isArray(existingAllocations) ? existingAllocations : [];
    const currentOpNum = operationNumber != null ? Number(operationNumber) : Infinity;

    safe.forEach((alloc) => {
      if (Number(alloc?.operation_number ?? 0) >= currentOpNum) return;
      const lpId = String(alloc?.lp_id ?? "");
      if (!lpId) return;
      if (!map[lpId]) map[lpId] = { sharesIssued: 0 };
      map[lpId].sharesIssued += Number(alloc?.shares_issued ?? 0);
    });
    return map;
  }, [existingAllocations, operationNumber]);

  const rows = useMemo(() => {
    const lpMap = new Map();
    const safeLps = Array.isArray(lps) ? lps : [];
    const safeCommitments = Array.isArray(commitments) ? commitments : [];

    safeCommitments.forEach((c) => {
      const lpIdStr = String(c.lp_id);
      const closing = c?.closing_period_date ? new Date(c.closing_period_date) : null;
      if (!closing || isNaN(closing.getTime()) || closing > dueDate) return;

      if (!lpMap.has(lpIdStr)) {
        const lpObj = safeLps.find((lp) => String(lp?.lp_id ?? lp?.id ?? "") === lpIdStr);
        if (lpObj) lpMap.set(lpIdStr, lpObj);
      }
    });

    const arr = Array.from(lpMap.values());
    console.log("[Step3] full perLp:", perLp);
    console.log("[Step3] lps prop:", lps);
    console.log("[Step3] commitments prop:", commitments);
    console.log("[Step3] dueDate:", dueDate);
    console.log("[Step3] lpMap built:", Array.from(lpMap.entries()));
    return arr.map((lp, idx) => {
      const lpIdStr = String(lp?.lp_id ?? lp?.id ?? `${idx}`);
      const name = lp?.name ?? lp?.fullName ?? lp?.lpName ?? lp?.label ?? "";

      const lpCommitmentRecord = safeCommitments.find(
        (c) => String(c.lp_id) === lpIdStr && new Date(c.closing_period_date) <= dueDate
      );
      const commitmentAmount = Number(lpCommitmentRecord?.commitment_amount ?? getLpCommitmentNumber(lp)) || 0;

      const step2 = perLp?.[lpIdStr] || {};
      const mainAmountNum = Number(getMainAmountFromStep2(step2) || 0);
      const aggBefore = beforeByLp[lpIdStr] || { capitalCall: 0, sharesIssued: 0 };
      const beforeAmount = Number(aggBefore.capitalCall);
      const beforeShares = Number(sharesBeforeByLp[lpIdStr]?.sharesIssued || 0);

      if (distMode) {
        const distributedAfter = beforeAmount + mainAmountNum;
        const pctBefore = commitmentAmount > 0 ? beforeAmount / commitmentAmount : 0;
        const pctOp = commitmentAmount > 0 ? mainAmountNum / commitmentAmount : 0;
        const pctAfter = commitmentAmount > 0 ? distributedAfter / commitmentAmount : 0;

        const scId = step2?.shareClassId ?? null;
        const sc = scId ? shareClassLookup.get(String(scId)) : null;
        const isRedemption = sc?.distribution_method === "REDEMPTION_OF_SHARES";
        const nominalValue = parseFloat(sc?.nominal_value || 0);
        const sharesRedeemed = isRedemption && nominalValue > 0
          ? mainAmountNum / nominalValue
          : 0;
        const sharesAfter = isRedemption
          ? beforeShares - sharesRedeemed
          : beforeShares;

        return {
          id: lpIdStr,
          initials: lp?.initials || initialsFromName(name),
          name,
          beforeA: fmtMoney(beforeAmount),
          beforeA_raw: beforeAmount,
          beforePct: fmtPctFraction(pctBefore),
          beforePct_raw: pctBefore,
          beforeShares: fmtShares(beforeShares),
          beforeShares_raw: beforeShares,
          opAmount: fmtMoney(mainAmountNum),
          opAmount_raw: mainAmountNum,
          opPct: fmtPctFraction(pctOp),
          opPct_raw: pctOp,
          opSharesRedeemed: fmtShares(sharesRedeemed),
          opSharesRedeemed_raw: sharesRedeemed,
          afterA: fmtMoney(distributedAfter),
          afterA_raw: distributedAfter,
          afterPct: fmtPctFraction(pctAfter),
          afterPct_raw: pctAfter,
          afterShares: fmtShares(sharesAfter),
          afterShares_raw: sharesAfter,
        };
      }

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

      const flowRaws = {};
      flows.forEach((f) => {
        op[f.id] = fmtMoney(step2Flows[f.id]);
        flowRaws[`op_${f.id}_raw`] = Number(step2Flows[f.id] || 0);
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
        beforeCalled_raw: beforeAmount,
        beforePct_raw: beforeAmount / commitmentAmount,
        beforeShares_raw: beforeShares,
        op,
        opMainAmount_raw: mainAmountNum,
        opCalledPct_raw: opCalledPct,
        opSharesIssued_raw: sharesIssued,
        ...flowRaws,
        after: {
          calledAfter: fmtMoney(afterCalled),
          calledPctAfter: fmtPctFraction(afterPct),
          sharesAfter: fmtShares(afterSharesNon),
          undrawn: fmtMoney(undrawn),
        },
        afterCalled_raw: afterCalled,
        afterPct_raw: afterPct,
        afterShares_raw: afterSharesNon,
        undrawn_raw: undrawn,
      };
    });
  }, [lps, commitments, perLp, flows, distMode, beforeByLp, dueDate, shareClassLookup]);

  const { sorted, sortKey, toggleSort } = useTableSort(rows, "name");

  // --- Totals Calculation ---
  const totals = useMemo(() => {
    const initial = {
      beforeA: 0,
      beforeShares: 0,
      opAmount: 0,
      opShares: 0,
      afterA: 0,
      afterShares: 0,
      undrawn: 0,
    };

    return rows.reduce((acc, row) => {
      if (distMode) {
        acc.beforeA += row.beforeA_raw || 0;
        acc.beforeShares += row.beforeShares_raw || 0;
        acc.opAmount += row.opAmount_raw || 0;
        acc.opShares += row.opSharesRedeemed_raw || 0;
        acc.afterA += row.afterA_raw || 0;
        acc.afterShares += row.afterShares_raw || 0;
      } else {
        acc.beforeA += row.beforeCalled_raw || 0;
        acc.beforeShares += row.beforeShares_raw || 0;
        acc.opAmount += row.opMainAmount_raw || 0;
        acc.opShares += row.opSharesIssued_raw || 0;
        acc.afterA += row.afterCalled_raw || 0;
        acc.afterShares += row.afterShares_raw || 0;
        acc.undrawn += row.undrawn_raw || 0;
      }
      return acc;
    }, initial);
  }, [rows, distMode]);

  const baseOpCols = useMemo(() => {
    if (distMode) return [];
    return [
      { key: "mainAmount", label: "Amount", showCurrency: true, rawKey: "opMainAmount_raw" },
      { key: "calledPct", label: "% Called", showCurrency: false, rawKey: "opCalledPct_raw" },
      { key: "sharesIssued", label: "Shares issued", showCurrency: false, rawKey: "opSharesIssued_raw" },
    ];
  }, [distMode]);

  const opCols = useMemo(() => {
    if (distMode) return [];
    return [...baseOpCols];
  }, [baseOpCols, distMode]);

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

  if (distMode) {
    return (
      <div className="op3-root">
        {saveErrorMsg && <div className="op3-error">{saveErrorMsg}</div>}
        <div className="op3-table-wrapper">
          <div className="op3-scroll-x">
            <table className="op3-table op3-table--wide">
              <thead>
                <tr className="op3-top-row">
                  <th className="op3-top op3-top-info op3-sticky-0">INFORMATION</th>
                  <th className="op3-top op3-top-breakdown" colSpan={3}>BREAKDOWN BEFORE</th>
                  <th className="op3-top op3-top-op" colSpan={3}>OPERATION</th>
                  <th className="op3-top op3-top-after" colSpan={3}>BREAKDOWN AFTER</th>
                </tr>
                <tr className="op3-head-row">
                  <th className="op3-head op3-head-lp op3-sticky-0">
                    <SortableHeaderRenderer label="LPs" columnKey="name" currentSortKey={sortKey} toggleSort={toggleSort} />
                  </th>
                  <th className="op3-head"><SortableHeaderRenderer label="Distributed before" columnKey="beforeA_raw" currentSortKey={sortKey} toggleSort={toggleSort} showCurrency /></th>
                  <th className="op3-head"><SortableHeaderRenderer label="% Distributed before" columnKey="beforePct_raw" currentSortKey={sortKey} toggleSort={toggleSort} /></th>
                  <th className="op3-head"><SortableHeaderRenderer label="Shares before" columnKey="beforeShares_raw" currentSortKey={sortKey} toggleSort={toggleSort} /></th>
                  <th className="op3-head"><SortableHeaderRenderer label="Distribution" columnKey="opAmount_raw" currentSortKey={sortKey} toggleSort={toggleSort} showCurrency /></th>
                  <th className="op3-head"><SortableHeaderRenderer label="% Distribution" columnKey="opPct_raw" currentSortKey={sortKey} toggleSort={toggleSort} /></th>
                  <th className="op3-head"><SortableHeaderRenderer label="Shares redeemed" columnKey="opSharesRedeemed_raw" currentSortKey={sortKey} toggleSort={toggleSort} /></th>
                  <th className="op3-head"><SortableHeaderRenderer label="Distributed after" columnKey="afterA_raw" currentSortKey={sortKey} toggleSort={toggleSort} showCurrency /></th>
                  <th className="op3-head"><SortableHeaderRenderer label="% Distributed after" columnKey="afterPct_raw" currentSortKey={sortKey} toggleSort={toggleSort} /></th>
                  <th className="op3-head"><SortableHeaderRenderer label="Shares after" columnKey="afterShares_raw" currentSortKey={sortKey} toggleSort={toggleSort} /></th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((row, index) => (
                  <tr key={row.id} className={`op3-body-row ${index % 2 === 1 ? "is-alt" : ""}`}>
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
                ))}
              </tbody>
              <tfoot>
                <tr className="op3-foot-row">
                  <td className="op3-foot-label op3-sticky-0">Total</td>
                  <td className="op3-foot op3-cell-calc">{fmtMoney(totals.beforeA)}</td>
                  <td className="op3-foot op3-cell-calc"></td>
                  <td className="op3-foot op3-cell-calc">{fmtShares(totals.beforeShares)}</td>
                  <td className="op3-foot op3-cell-fetched">{fmtMoney(totals.opAmount)}</td>
                  <td className="op3-foot op3-cell-fetched"></td>
                  <td className="op3-foot op3-cell-fetched">{fmtShares(totals.opShares)}</td>
                  <td className="op3-foot op3-cell-calc">{fmtMoney(totals.afterA)}</td>
                  <td className="op3-foot op3-cell-calc"></td>
                  <td className="op3-foot op3-cell-calc">{fmtShares(totals.afterShares)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="op3-root">
      {saveErrorMsg && <div className="op3-error">{saveErrorMsg}</div>}
      <div className="op3-table-wrapper">
        <div className="op3-scroll-x">
          <table className="op3-table op3-table--wide">
            <thead>
              <tr className="op3-top-row">
                <th className="op3-top op3-top-info op3-sticky-0">INFORMATION</th>
                <th className="op3-top op3-top-breakdown" colSpan={3}>BREAKDOWN BEFORE</th>
                <th className="op3-top op3-top-op" colSpan={opCols.length}>OPERATION</th>
                <th className="op3-top op3-top-after" colSpan={4}>BREAKDOWN AFTER</th>
              </tr>
              <tr className="op3-head-row">
                <th className="op3-head op3-head-lp op3-sticky-0">
                  <SortableHeaderRenderer label="LPs" columnKey="name" currentSortKey={sortKey} toggleSort={toggleSort} />
                </th>
                <th className="op3-head"><SortableHeaderRenderer label="Called before" columnKey="beforeCalled_raw" currentSortKey={sortKey} toggleSort={toggleSort} showCurrency /></th>
                <th className="op3-head"><SortableHeaderRenderer label="% Called before" columnKey="beforePct_raw" currentSortKey={sortKey} toggleSort={toggleSort} /></th>
                <th className="op3-head"><SortableHeaderRenderer label="Shares before" columnKey="beforeShares_raw" currentSortKey={sortKey} toggleSort={toggleSort} /></th>
                {opCols.map((c) => (
                  <th key={c.key} className="op3-head">
                    <SortableHeaderRenderer label={c.label} columnKey={c.rawKey} currentSortKey={sortKey} toggleSort={toggleSort} showCurrency={c.showCurrency} />
                  </th>
                ))}
                <th className="op3-head"><SortableHeaderRenderer label="Called after" columnKey="afterCalled_raw" currentSortKey={sortKey} toggleSort={toggleSort} showCurrency /></th>
                <th className="op3-head"><SortableHeaderRenderer label="% Called after" columnKey="afterPct_raw" currentSortKey={sortKey} toggleSort={toggleSort} /></th>
                <th className="op3-head"><SortableHeaderRenderer label="Shares after" columnKey="afterShares_raw" currentSortKey={sortKey} toggleSort={toggleSort} /></th>
                <th className="op3-head"><SortableHeaderRenderer label="Undrawn" columnKey="undrawn_raw" currentSortKey={sortKey} toggleSort={toggleSort} showCurrency /></th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((row, index) => (
                <tr key={row.id} className={`op3-body-row ${index % 2 === 1 ? "is-alt" : ""}`}>
                  <td className="op3-cell-lp op3-sticky-0">
                    <div className="op3-avatar">{row.initials}</div>
                    <span className="op3-lp-name">{row.name}</span>
                  </td>
                  <td className="op3-cell-calc">{row.before.calledBefore}</td>
                  <td className="op3-cell-calc">{row.before.calledPctBefore}</td>
                  <td className="op3-cell-calc">{row.before.sharesBefore}</td>
                  {opCols.map((c) => (
                    <td key={c.key} className="op3-cell-fetched">{row.op?.[c.key] ?? ""}</td>
                  ))}
                  <td className="op3-cell-calc">{row.after.calledAfter}</td>
                  <td className="op3-cell-calc">{row.after.calledPctAfter}</td>
                  <td className="op3-cell-calc">{row.after.sharesAfter}</td>
                  <td className="op3-cell-calc">{row.after.undrawn}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="op3-foot-row">
                <td className="op3-foot-label op3-sticky-0">Total</td>
                <td className="op3-foot op3-cell-calc">{fmtMoney(totals.beforeA)}</td>
                <td className="op3-foot op3-cell-calc"></td>
                <td className="op3-foot op3-cell-calc">{fmtShares(totals.beforeShares)}</td>
                {opCols.map((c) => (
                  <td key={c.key} className="op3-foot op3-cell-fetched">
                    {c.key === "mainAmount" ? fmtMoney(totals.opAmount) : 
                     c.key === "sharesIssued" ? fmtShares(totals.opShares) : ""}
                  </td>
                ))}
                <td className="op3-foot op3-cell-calc">{fmtMoney(totals.afterA)}</td>
                <td className="op3-foot op3-cell-calc"></td>
                <td className="op3-foot op3-cell-calc">{fmtShares(totals.afterShares)}</td>
                <td className="op3-foot op3-cell-calc">{fmtMoney(totals.undrawn)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
});

export default OperationStep3Breakdown;