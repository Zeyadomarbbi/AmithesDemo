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
 * API (local-friendly like Step2)
 * ------------------------- */
const RUNTIME =
  (typeof window !== "undefined" && window.__RUNTIME_CONFIG__) || {};

const API_BASE_RAW = RUNTIME.API_BASE_URL || import.meta.env.VITE_API_BASE_URL || "";
const API_PREFIX_RAW = RUNTIME.API_PREFIX || import.meta.env.VITE_API_PREFIX || "";

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

  // ✅ safe local default
  const prefix = API_PREFIX || "/api";

  if (!API_BASE) {
    return joinUrl(prefix, pp); // "/api/operations/.."
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

/** expects fraction (0..1), prints xx.xx% */
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

/** Prefer "primary" share class if sharesRows exist */
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

/** main amount from Step2 */
function getMainAmountFromStep2(step2Row = {}) {
  if (step2Row.mainAmount !== undefined) return step2Row.mainAmount;
  if (step2Row.capitalCall !== undefined) return step2Row.capitalCall;
  if (step2Row.distribution !== undefined) return step2Row.distribution;
  return null;
}

/** -------------------------
 * Step 3 APIs
 * ------------------------- */
async function fetchStep3Preview(operationId) {
  const url = apiUrl(`/operations/${operationId}/step3-preview/`);
  return fetchJson(url);
}

async function confirmStep3(operationId) {
  const url = apiUrl(`/operations/${operationId}/lp-allocations/confirm/`);
  return fetchJson(url, { method: "POST", body: JSON.stringify({}) });
}

const OperationStep3Breakdown = forwardRef(function OperationStep3Breakdown(
  {
    lps = [],
    step2Result,
    operationType,
    operationId = null,
    totalFundCommitment = 0,
    onFinalSave,
    commitments = [],   // ← add
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

  const [preview, setPreview] = useState(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [previewError, setPreviewError] = useState(null);
  const committedLpIds = useMemo(() => {
    return new Set((Array.isArray(commitments) ? commitments : []).map((c) => String(c.lp_id)));
  }, [commitments]);

  const filteredLps = useMemo(() => {
    return (Array.isArray(lps) ? lps : []).filter((lp) => {
      const id = String(lp?.lp_id ?? lp?.id ?? "");
      return committedLpIds.has(id);
    });
  }, [lps, committedLpIds]);
  // ✅ Load preview in ALL envs (local-friendly)
  useEffect(() => {
    if (!operationId) return;

    let alive = true;
    setIsLoadingPreview(true);
    setPreviewError(null);

    fetchStep3Preview(operationId)
      .then((data) => {
        if (!alive) return;
        setPreview(data || null);
      })
      .catch((e) => {
        if (!alive) return;
        setPreviewError(e);
      })
      .finally(() => {
        if (!alive) return;
        setIsLoadingPreview(false);
      });

    return () => {
      alive = false;
    };
  }, [operationId]);

  // ✅ helper to read preview row by lp/shareClass (shareClass stays internal only)
  const getPreviewRow = useCallback(
    (lpIdNum, shareClassIdNum) => {
      const byKey = preview?.by_key || null;
      if (!byKey) return null;

      const lpN = Number(lpIdNum);
      if (!Number.isFinite(lpN)) return null;

      // if share class missing, infer from preview keys for this LP (highest commitment)
      if (
        shareClassIdNum === null ||
        shareClassIdNum === undefined ||
        shareClassIdNum === ""
      ) {
        const prefix = `${lpN}:`;
        let best = null;
        let bestCommit = -Infinity;

        Object.entries(byKey).forEach(([k, v]) => {
          if (!k.startsWith(prefix)) return;
          const parts = String(k).split(":");
          const sc = Number(parts[1]);
          const commit = Number(v?.commitment_amount ?? 0);

          if (!Number.isFinite(sc)) return;
          if (commit > bestCommit) {
            bestCommit = commit;
            best = v;
          }
        });

        return best || null;
      }

      const scN = Number(shareClassIdNum);
      if (!Number.isFinite(scN)) return null;

      const key = `${lpN}:${scN}`;
      return byKey[key] || null;
    },
    [preview]
  );

  /**
   * ✅ Build table rows:
   * - In Distribution mode: use labels like your screenshot:
   *   Distributed before / % / Shares before
   *   Distribution / % / Shares redeemed (0 for now)
   *   Distributed after / % / Shares after (PLUS)
   *
   * - In non-distribution: keep your existing Called/Undrawn style.
   */
  const rows = useMemo(() => {
    const arr = filteredLps;

    return arr.map((lp, idx) => {
      const rawId = lp?.lp_id ?? lp?.id ?? lp?.lpId ?? `${idx}`;
      const lpIdStr = String(rawId);
      const lpIdNum = Number(rawId);

      const name =
        lp?.name ??
        lp?.fullName ??
        lp?.lpName ??
        lp?.label ??
        "";

      const shareClassId = getPrimaryShareClassId(lp);
      const commitmentAmount = getLpCommitmentNumber(lp) || 0;

      const step2 = perLp?.[lpIdStr] || {};
      const mainAmountNum = Number(getMainAmountFromStep2(step2) || 0);

      const p = getPreviewRow(lpIdNum, shareClassId);

      // NOTE: backend fields are still named "before_called/after_called" etc.
      // In Distribution mode we just DISPLAY them as "distributed".
      const beforeAmount = Number(p?.before_called ?? 0);
      const beforeShares = Number(p?.before_shares ?? 0);

      const sharesRedeemed = 0; // ✅ per your request (for now)

      if (distMode) {
        // Distributed after = distributed before + distribution
        const distributedAfter = Number(p?.after_called ?? (beforeAmount + mainAmountNum));
        const pctBefore = commitmentAmount > 0 ? beforeAmount / commitmentAmount : 0;
        const pctOp = commitmentAmount > 0 ? mainAmountNum / commitmentAmount : 0;
        const pctAfter = commitmentAmount > 0 ? distributedAfter / commitmentAmount : 0;

        // ✅ Shares after is PLUS (before + redeemed). Redeemed=0 for now.
        const sharesAfter = Number(p?.after_shares ?? (beforeShares + sharesRedeemed));

        return {
          id: lpIdStr,
          initials: lp?.initials || initialsFromName(name),
          name,

          // before
          beforeA: fmtMoney(beforeAmount),
          beforePct: fmtPctFraction(pctBefore),
          beforeShares: fmtShares(beforeShares),

          // operation
          opAmount: fmtMoney(mainAmountNum),
          opPct: fmtPctFraction(pctOp),
          opSharesRedeemed: fmtShares(sharesRedeemed),

          // after
          afterA: fmtMoney(distributedAfter),
          afterPct: fmtPctFraction(pctAfter),
          afterShares: fmtShares(sharesAfter),
        };
      }

      // -------------------------
      // Non-distribution (keep existing behavior)
      // -------------------------
      const beforeCalled = beforeAmount;
      const beforePct = Number(p?.before_pct ?? (commitmentAmount > 0 ? beforeCalled / commitmentAmount : 0));
      const beforeSharesNon = beforeShares;

      const afterCalled = Number(
        p?.after_called ?? (beforeCalled + (Number(mainAmountNum) || 0))
      );
      const afterPct = Number(
        p?.after_pct ?? (commitmentAmount > 0 ? afterCalled / commitmentAmount : 0)
      );

      const sharesIssued = Number(step2?.sharesIssued || 0);
      const afterSharesNon = Number(p?.after_shares ?? (beforeSharesNon + sharesIssued));

      const undrawn = Number(
        p?.undrawn ?? (commitmentAmount - afterCalled)
      );

      // Keep existing "operation" columns with flows
      const step2Flows = step2?.flows || {};
      const op = {
        mainAmount: fmtMoney(mainAmountNum),
        calledPct: fmtPctFraction(step2?.calledPct ?? null),
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
          calledBefore: fmtMoney(beforeCalled),
          calledPctBefore: fmtPctFraction(beforePct),
          sharesBefore: fmtShares(beforeSharesNon),
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
  }, [filteredLps, perLp, flows, getPreviewRow, distMode]);

  /**
   * Non-distribution operation columns (keep as-is)
   */
  const baseOpCols = useMemo(() => {
    if (distMode) return [];
    // your previous labels
    return [
      { key: "mainAmount", label: "Amount (€)" },
      { key: "calledPct", label: "% Called" },
      { key: "sharesIssued", label: "Shares issued" },
    ];
  }, [distMode]);

  const flowOpCols = useMemo(() => {
    if (distMode) return [];
    return flows.map((f) => ({ key: f.id, label: f.label }));
  }, [flows, distMode]);

  const opCols = useMemo(() => {
    if (distMode) return [];
    return [...baseOpCols, ...flowOpCols];
  }, [baseOpCols, flowOpCols, distMode]);

  const submitToNext = useCallback(async () => {
    if (!operationId) throw new Error("Missing operationId.");

    setIsSaving(true);
    setSaveError(null);

    try {
      if (savedOnce) return;

      await confirmStep3(operationId);

      const fresh = await fetchStep3Preview(operationId);
      setPreview(fresh || null);

      setSavedOnce(true);
    } catch (e) {
      setSaveError(e);
      throw e;
    } finally {
      setIsSaving(false);
    }
  }, [operationId, savedOnce]);

  useImperativeHandle(ref, () => ({ submitToNext }), [submitToNext]);

  const saveErrorMsg = saveError?.message ? String(saveError.message) : null;
  const previewErrMsg = previewError?.message ? String(previewError.message) : null;

  // =========================
  // ✅ DISTRIBUTION TABLE
  // =========================
  if (distMode) {
    return (
      <div className="op3-root">
        {previewErrMsg && (
          <div style={{ marginBottom: 10, color: "#b42318", fontSize: 12 }}>
            Preview error: {previewErrMsg}
          </div>
        )}

        {saveErrorMsg && (
          <div style={{ marginBottom: 10, color: "#b42318", fontSize: 12 }}>
            {saveErrorMsg}
          </div>
        )}

        {isLoadingPreview && (
          <div style={{ marginBottom: 10, color: "#667085", fontSize: 12 }}>
            Loading previous allocations…
          </div>
        )}

        <div className="op3-table-wrapper">
          <div className="op3-scroll-x">
            <table className="op3-table op3-table--wide">
              <colgroup>
                <col className="op3-col-lp" />

                {/* before */}
                <col className="op3-col-called" />
                <col className="op3-col-calledpct" />
                <col className="op3-col-shares" />

                {/* operation */}
                <col className="op3-col-op" />
                <col className="op3-col-op" />
                <col className="op3-col-op" />

                {/* after */}
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
  // ✅ NON-DISTRIBUTION TABLE (UNCHANGED STRUCTURE)
  // =========================
  return (
    <div className="op3-root">
      {previewErrMsg && (
        <div style={{ marginBottom: 10, color: "#b42318", fontSize: 12 }}>
          Preview error: {previewErrMsg}
        </div>
      )}

      {saveErrorMsg && (
        <div style={{ marginBottom: 10, color: "#b42318", fontSize: 12 }}>
          {saveErrorMsg}
        </div>
      )}

      {isLoadingPreview && (
        <div style={{ marginBottom: 10, color: "#667085", fontSize: 12 }}>
          Loading previous allocations…
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
