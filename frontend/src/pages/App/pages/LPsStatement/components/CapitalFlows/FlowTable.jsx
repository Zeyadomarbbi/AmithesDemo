// frontend/src/pages/App/pages/LPsStatement/components/CapitalFlowTable/FlowTable.jsx
import React, { useMemo, useState } from "react";
import "./FlowTable.css";
import { useNumberFormatter, useDateFormatter, usePercentageFormatter } from "../../../../../../components/useFormatter.js";
import { SortIcon } from "../../Icons.jsx";

/* ===================== HELPERS ===================== */

function getCategory(op = {}) {
  const name = String(op?.operation_type_name ?? "").toLowerCase();
  if (name.includes("distribution")) return "distribution";
  const id = Number(op?.operation_type_id ?? 0);
  if (id === 4) return "distribution";
  return "capital";
}

function fmt(v) {
  if (v === null || v === undefined || (typeof v === "number" && isNaN(v))) return "-";
  return Number(v).toLocaleString("fr-FR", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

function fmtPct(v) {
  if (v === null || v === undefined || (typeof v === "number" && isNaN(v))) return "-";
  return `${Number(v).toFixed(2)}%`;
}

function fmtDate(iso) {
  if (!iso) return "-";
  return new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function getLpName(lpId, lps = []) {
  const found = lps.find((l) => String(l?.lp_id ?? l?.id) === String(lpId));
  return found?.name ?? found?.fullName ?? `LP ${lpId}`;
}

function isEqualizationFlow(f) {
  return String(f.flow_type_id) === "13" || String(f.flow_name ?? "").toLowerCase() === "equalization";
}

/* ===================== COMPONENT ===================== */

export default function FlowTable({
  operationFilter,
  search,
  breakdown,
  onSelectOperation,
  shareClasses = [],
  flowTypes = [],
  operations = [],
  lpAllocations = [],
  lps = [],
}) {
  const [sortConfig, setSortConfig] = useState({ key: "date", direction: "desc" });
  const formatNumber = useNumberFormatter();
  const formatPercentage = usePercentageFormatter();
  const formatDate = useDateFormatter();
  const view = operationFilter === "Capital call"
    ? "capital"
    : operationFilter === "Distribution"
    ? "distribution"
    : "all";

  // ── Filter operations by view ──────────────────────────────────────────────
  const filteredOps = useMemo(() => {
    const ops = Array.isArray(operations) ? operations : [];
    if (view === "capital") return ops.filter((op) => getCategory(op) === "capital");
    if (view === "distribution") return ops.filter((op) => getCategory(op) === "distribution");
    return ops;
  }, [operations, view]);

  const shareClassLookup = useMemo(() => {
    const map = {};
    (Array.isArray(shareClasses) ? shareClasses : []).forEach((sc) => {
      const id = String(sc?.share_class_id ?? sc?.id ?? "");
      const name = sc?.share_class_name ?? sc?.name ?? null;
      if (id && name) map[id] = name;
    });
    return map;
  }, [shareClasses]);

  // ── Flow type lookup: flow_type_id -> name ─────────────────────────────────
  const flowTypeLookup = useMemo(() => {
    const map = {};
    (Array.isArray(flowTypes) ? flowTypes : []).forEach((ft) => {
      map[String(ft.flow_type_id)] = ft.name ?? `Flow ${ft.flow_type_id}`;
    });
    return map;
  }, [flowTypes]);

  // ── Dynamic flow columns: deduplicated by flow_type_id ────────────────────
  const dynamicFlowCols = useMemo(() => {
    const seen = new Map(); // flow_type_id -> col def
    filteredOps.forEach((op) => {
      (op.flows ?? []).forEach((f) => {
        const typeId = String(f.flow_type_id ?? "");
        if (!typeId || seen.has(typeId) || isEqualizationFlow(f)) return;
        seen.set(typeId, {
          key: `flow__${typeId}`,
          header: flowTypeLookup[typeId] ?? f.flow_name ?? `Flow ${typeId}`,
          flowTypeId: typeId,
          type: "number",
          align: "right",
          sortable: true,
          isDynamic: true,
        });
      });
    });
    return Array.from(seen.values());
  }, [filteredOps, flowTypeLookup]);

  // ── Build operation rows ───────────────────────────────────────────────────
  const operationRows = useMemo(() => {
    return filteredOps.map((op) => {
      const opId = op?.lps_operation_details_id ?? op?.id;
      const category = getCategory(op);
      const isDist = category === "distribution";
      const overallPct = Number(op?.overall_percentage_of_commitment ?? 0) * 100;
      const totalAmount = Number(op?.total_operation_amount ?? 0);

      const flowAmounts = {};
      (op.flows ?? []).forEach((f) => {
        if (isEqualizationFlow(f)) return;
        const typeId = String(f.flow_type_id ?? "");
        if (!typeId) return;
        const key = `flow__${typeId}`;
        flowAmounts[key] = (flowAmounts[key] ?? 0) + Number(f.computed_total_amount ?? 0);
      });

      return {
        id: String(opId),
        _raw: op,
        category,
        label: op?.operation_name ?? op?.name ?? `Operation ${opId}`,
        date: op?.due_date ?? op?.notice_date ?? null,
        calledAmount: isDist ? null : totalAmount,
        calledPercent: isDist ? null : overallPct,
        distribAmount: isDist ? totalAmount : null,
        distribPercent: isDist ? overallPct : null,
        netCum: isDist ? -totalAmount : totalAmount,
        ...flowAmounts,
      };
    });
  }, [filteredOps]);

  // ── Build LP rows ──────────────────────────────────────────────────────────
const lpRows = useMemo(() => {
  const byLp = {};

  filteredOps.forEach((op) => {
    const category = getCategory(op);
    const isDist = category === "distribution";

    // Get called_percentage per LP from parent lpAllocations (optional enrichment)
    const opAllocs = op.lp_allocations ?? [];
    const pctByLp = {};
    const scByLp = {};
    opAllocs.forEach((a) => {
      pctByLp[String(a.lp_id)] = Number(a.called_percentage ?? 0) * 100;
      if (a.share_class_id) scByLp[String(a.lp_id)] = String(a.share_class_id);
    });

    // Drive rows from nested lp_allocations
    (op.flows ?? []).forEach((f) => {
      if (isEqualizationFlow(f)) return;
      const typeId = String(f.flow_type_id ?? "");

      (f.lp_allocations ?? []).forEach((alloc) => {
        const lpId = String(alloc.lp_id);
        const amount = Number(alloc.allocated_amount ?? 0);

        if (!byLp[lpId]) {
          const scId = scByLp[lpId] ?? null;
          byLp[lpId] = {
            id: `lp-${lpId}`,
            category,
            lp: getLpName(lpId, lps),
            shareClass: scId ? (shareClassLookup[scId] ?? `Class ${scId}`) : "-",
            calledAmount: 0,
            calledPercent: 0,
            distribAmount: 0,
            distribPercent: 0,
            _calledPctCount: 0,
            _distribPctCount: 0,
            _totalCapitalCall: 0,
            _totalCommitment: 0,
            _totalDistrib: 0,
          };
        }

        const entry = byLp[lpId];

        if (typeId) {
          const key = `flow__${typeId}`;
          entry[key] = (entry[key] ?? 0) + amount;
        }
      });
    });

    // Enrich with called_percentage from opAllocs
    opAllocs.forEach((a) => {
      const lpId = String(a.lp_id);
      if (!byLp[lpId]) return;
      if (isDist) {
        byLp[lpId].distribAmount += Number(a.capital_call ?? 0);
        byLp[lpId]._totalDistrib += Number(a.capital_call ?? 0);
      } else {
        byLp[lpId].calledAmount += Number(a.capital_call ?? 0);
        byLp[lpId]._totalCapitalCall += Number(a.capital_call ?? 0);
        byLp[lpId]._totalCommitment = Math.max(
          byLp[lpId]._totalCommitment,
          Number(a.commitment_amount ?? 0)
        );
      }
    });
  });

  return Object.values(byLp).map((entry) => ({
    ...entry,
    calledPercent: entry._totalCommitment > 0
      ? (entry._totalCapitalCall / entry._totalCommitment) * 100
      : 0,
    distribPercent: entry._totalCommitment > 0
      ? (entry._totalDistrib / entry._totalCommitment) * 100
      : 0,
    calledAmount: entry.calledAmount || null,
    distribAmount: entry.distribAmount || null,
  }));
}, [filteredOps, lpAllocations, lps, shareClassLookup]);
  // ── Build Share Class rows ─────────────────────────────────────────────────
const shareClassRows = useMemo(() => {
  const byClass = {};
  const pctBySc = {};
  filteredOps.forEach((op) => {
    const category = getCategory(op);
    const isDist = category === "distribution";

    // Build sc lookup from op.lp_allocations (same source as lpRows)
    const opAllocs = op.lp_allocations ?? [];
    const scByLp = {};
    
    opAllocs.forEach((a) => {
      if (a.share_class_id) {
        scByLp[String(a.lp_id)] = String(a.share_class_id);
        const scId = String(a.share_class_id);
        const lpId = String(a.lp_id);
        if (!pctBySc[scId]) pctBySc[scId] = { call: 0, lpCommitments: {} };
        pctBySc[scId].call += Number(a.capital_call ?? 0);
        pctBySc[scId].lpCommitments[lpId] = Number(a.commitment_amount ?? 0);

        // ADD: accumulate calledAmount/distribAmount from capital_call
        if (!byClass[scId]) {
          byClass[scId] = {
            id: `sc-${scId}`,
            category,
            shareClass: shareClassLookup[scId] ?? `Class ${scId}`,
            calledAmount: 0,
            distribAmount: 0,
            calledPercent: 0,
            distribPercent: 0,
          };
        }
        if (isDist) {
          byClass[scId].distribAmount += Number(a.capital_call ?? 0);
        } else {
          byClass[scId].calledAmount += Number(a.capital_call ?? 0);
        }
      }
    });

    (op.flows ?? []).forEach((f) => {
      if (isEqualizationFlow(f)) return;
      const typeId = String(f.flow_type_id ?? "");
      if (!typeId) return;
      const key = `flow__${typeId}`;

      (f.lp_allocations ?? []).forEach((alloc) => {
        const lpId = String(alloc.lp_id);
        const scId = scByLp[lpId];
        if (!scId) return;
        const amount = Number(alloc.allocated_amount ?? 0);

        if (!byClass[scId]) {
          byClass[scId] = {
            id: `sc-${scId}`,
            category,
            shareClass: shareClassLookup[scId] ?? `Class ${scId}`,
            calledAmount: 0,
            calledPercent: 0,
            distribAmount: 0,
            distribPercent: 0,
          };
        }

        const entry = byClass[scId];
        entry[key] = (entry[key] ?? 0) + amount;
      });
    });

    // Enrich with called_percentage
    Object.entries(pctBySc).forEach(([scId, { call, lpCommitments }]) => {
      if (!byClass[scId]) return;
      const totalCommitment = Object.values(lpCommitments).reduce((s, v) => s + v, 0);
      const pct = totalCommitment > 0 ? (call / totalCommitment) * 100 : 0;
      byClass[scId].calledPercent = pct;
      byClass[scId].distribPercent = pct;
    });
  });

  return Object.values(byClass).map((entry) => ({
    ...entry,
    calledAmount: entry.calledAmount || null,
    distribAmount: entry.distribAmount || null,
  }));
}, [filteredOps, shareClassLookup]);

  // ── Select rows ────────────────────────────────────────────────────────────
  const baseRows = useMemo(() => {
    if (breakdown === "lps") return lpRows;
    if (breakdown === "shareClasses") return shareClassRows;
    return operationRows;
  }, [breakdown, operationRows, lpRows, shareClassRows]);

  // ── Static columns ─────────────────────────────────────────────────────────
  const staticColumns = useMemo(() => {
    if (breakdown === "operations") {
      if (view === "all") return [
        { key: "label",         header: "Operation",           type: "text",    sortable: true },
        { key: "date",          header: "Date",                type: "date",    sortable: true },
        { key: "calledAmount",  header: "Called amount (€)",   type: "number",  sortable: true, align: "right" },
        { key: "calledPercent", header: "% Called",            type: "percent", sortable: true, align: "right" },
        { key: "distribAmount", header: "Distrib. amount (€)", type: "number",  sortable: true, align: "right" },
        { key: "distribPercent",header: "% Distributed",       type: "percent", sortable: true, align: "right" },
        { key: "netCum",        header: "Net cum. (€)",        type: "number",  sortable: true, align: "right" },
      ];
      if (view === "capital") return [
        { key: "label",         header: "Operation",           type: "text",    sortable: true },
        { key: "date",          header: "Date",                type: "date",    sortable: true },
        { key: "calledPercent", header: "% Called",            type: "percent", sortable: true, align: "right" },
        { key: "calledAmount",  header: "Called am. (€)",      type: "number",  sortable: true, align: "right" },
      ];
      return [
        { key: "label",         header: "Operation",           type: "text",    sortable: true },
        { key: "date",          header: "Date",                type: "date",    sortable: true },
        { key: "distribPercent",header: "% Distributed",       type: "percent", sortable: true, align: "right" },
        { key: "distribAmount", header: "Distrib. am. (€)",    type: "number",  sortable: true, align: "right" },
      ];
    }

    if (breakdown === "lps") {
      if (view === "capital") return [
        { key: "lp",            header: "LPs",                 type: "text",    sortable: false },
        { key: "shareClass",    header: "Share class",         type: "text",    sortable: false },
        { key: "calledPercent", header: "% Called",            type: "percent", sortable: true, align: "right" },
        { key: "calledAmount",  header: "Called am. (€)",      type: "number",  sortable: true, align: "right" },
      ];
      if (view === "distribution") return [
        { key: "lp",            header: "LPs",                 type: "text",    sortable: false },
        { key: "shareClass",    header: "Share class",         type: "text",    sortable: false },
        { key: "distribPercent",header: "% Distributed",       type: "percent", sortable: true, align: "right" },
        { key: "distribAmount", header: "Distrib. am. (€)",    type: "number",  sortable: true, align: "right" },
      ];
      return [
        { key: "lp",            header: "LPs",                 type: "text",    sortable: false },
        { key: "shareClass",    header: "Share class",         type: "text",    sortable: false },
        { key: "calledPercent", header: "% Called",            type: "percent", sortable: true, align: "right" },
        { key: "calledAmount",  header: "Called am. (€)",      type: "number",  sortable: true, align: "right" },
        { key: "distribPercent",header: "% Distributed",       type: "percent", sortable: true, align: "right" },
        { key: "distribAmount", header: "Distrib. am. (€)",    type: "number",  sortable: true, align: "right" },
      ];
    }

    // shareClasses
    if (view === "capital") return [
      { key: "shareClass",    header: "Share class",           type: "text",    sortable: false },
      { key: "calledPercent", header: "% Called",              type: "percent", sortable: true, align: "right" },
      { key: "calledAmount",  header: "Called am. (€)",        type: "number",  sortable: true, align: "right" },
    ];
    if (view === "distribution") return [
      { key: "shareClass",    header: "Share class",           type: "text",    sortable: false },
      { key: "distribPercent",header: "% Distributed",         type: "percent", sortable: true, align: "right" },
      { key: "distribAmount", header: "Distrib. am. (€)",      type: "number",  sortable: true, align: "right" },
    ];
    return [
      { key: "shareClass",    header: "Share class",           type: "text",    sortable: false },
      { key: "calledPercent", header: "% Called",              type: "percent", sortable: true, align: "right" },
      { key: "calledAmount",  header: "Called am. (€)",        type: "number",  sortable: true, align: "right" },
      { key: "distribPercent",header: "% Distributed",         type: "percent", sortable: true, align: "right" },
      { key: "distribAmount", header: "Distrib. am. (€)",      type: "number",  sortable: true, align: "right" },
    ];
  }, [view, breakdown]);

  // Insert dynamic cols before last static col, only for capital/distribution views
const columns = useMemo(() => {
    if (view === "all") return staticColumns;

    // Find the index of the main amount column (calledAmount or distribAmount)
    const amountIndex = staticColumns.findIndex(
      (c) => c.key === "calledAmount" || c.key === "distribAmount"
    );

    if (amountIndex === -1) {
      return [...staticColumns, ...dynamicFlowCols];
    }

    const before = staticColumns.slice(0, amountIndex + 1); // Up to and including Amount
    const after = staticColumns.slice(amountIndex + 1);    // Everything else

    return [...before, ...dynamicFlowCols, ...after];
  }, [staticColumns, dynamicFlowCols, view]);

  // ── Sort ───────────────────────────────────────────────────────────────────
  const handleSort = (key) => {
    const col = columns.find((c) => c.key === key);
    if (!col?.sortable) return;
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  const rows = useMemo(() => {
    let data = [...baseRows];

    if (search?.trim()) {
      const s = search.toLowerCase();
      data = data.filter((r) => {
        const label = r.label ?? r.lp ?? r.shareClass ?? "";
        return label.toLowerCase().includes(s);
      });
    }

    const col = columns.find((c) => c.key === sortConfig.key);
    if (col?.sortable) {
      data.sort((a, b) => {
        let aVal = a[sortConfig.key];
        let bVal = b[sortConfig.key];
        if (col.type === "date") {
          aVal = aVal ? new Date(aVal).getTime() : null;
          bVal = bVal ? new Date(bVal).getTime() : null;
        }
        if (aVal === null || aVal === undefined) return 1;
        if (bVal === null || bVal === undefined) return -1;
        if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      });
    }

    return data;
  }, [baseRows, search, sortConfig, columns]);

  // ── Totals ─────────────────────────────────────────────────────────────────
  const totals = useMemo(() => {
    const obj = {};
    columns.forEach((col) => {
      if (col.type === "number" || col.type === "percent") obj[col.key] = 0;
    });
    rows.forEach((row) => {
      columns.forEach((col) => {
        if ((col.type === "number" || col.type === "percent") && typeof row[col.key] === "number") {
          obj[col.key] += row[col.key];
        }
      });
    });

    // Override percent totals — sum of % makes no sense, compute from amounts
    if (obj.calledPercent !== undefined && obj.calledAmount !== undefined) {
      // Get total_fund_commitment from the latest operation by due_date
      const latestOp = [...filteredOps].sort((a, b) =>
        new Date(b.due_date ?? b.notice_date ?? 0) - new Date(a.due_date ?? a.notice_date ?? 0)
      )[0];
      const tfc = Number(latestOp?.total_fund_commitment ?? 0);
      obj.calledPercent = tfc > 0 ? (obj.calledAmount / tfc) * 100 : 0;
    }
    if (obj.distribPercent !== undefined && obj.distribAmount !== undefined) {
      const latestOp = [...filteredOps].sort((a, b) =>
        new Date(b.due_date ?? b.notice_date ?? 0) - new Date(a.due_date ?? a.notice_date ?? 0)
      )[0];
      const tfc = Number(latestOp?.total_fund_commitment ?? 0);
      obj.distribPercent = tfc > 0 ? (obj.distribAmount / tfc) * 100 : 0;
    }

    return obj;
  }, [rows, columns, filteredOps]);

const formatCell = (row, col) => {
    const v = row[col.key];
    if (v === null || v === undefined || v === "") return "-";
    
    switch (col.type) {
      case "date":
        return formatDate(v);
      case "number":
        return formatNumber(v);
      case "percent":
        return formatPercentage(v);
      default:
        return v;
    }
  };

  const formatTotal = (col) => {
    const v = totals[col.key];
    if (v === null || v === undefined || isNaN(v)) return "";
    
    switch (col.type) {
      case "number":
        return formatNumber(v);
      case "percent":
        return formatPercentage(v);
      default:
        return "";
    }
  };

  const isClickable = breakdown === "operations";

  return (
    <div className="cf-root">
      {rows.length === 0 ? (
        <div className="cf-empty">No operations found.</div>
      ) : (
        <div className="cf-table-wrapper">
          <table className="cf-table">
            <thead>
              <tr>
                {columns.map((col) => (
                  <th
                    key={col.key}
                    onClick={() => handleSort(col.key)}
                    className={[
                      col.sortable ? "cf-sortable" : "",
                      col.align === "right" ? "cf-num" : "",
                      sortConfig.key === col.key ? "cf-sorted" : "",
                    ].filter(Boolean).join(" ") || undefined}
                  >
                    {col.header}
                    {col.sortable && (
                      <span className="cf-sort">
                        <SortIcon />
                      </span>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr
                  key={r.id}
                  onClick={() => isClickable && onSelectOperation?.(r._raw)}
                  className={isClickable ? "cf-row--clickable" : undefined}
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={col.align === "right" ? "cf-num" : undefined}
                    >
                      {formatCell(r, col)}
                    </td>
                  ))}
                </tr>
              ))}
              <tr className="cf-total-row">
                {columns.map((col, i) => (
                  <td
                    key={col.key}
                    className={col.align === "right" ? "cf-num" : undefined}
                  >
                    {i === 0 ? "Total" : formatTotal(col)}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}