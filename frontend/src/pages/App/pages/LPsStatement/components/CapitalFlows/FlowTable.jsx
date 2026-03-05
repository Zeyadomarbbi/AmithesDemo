// frontend/src/pages/App/pages/LPsStatement/components/CapitalFlowTable/FlowTable.jsx
import React, { useMemo } from "react";
import "./FlowTable.css";
import { useNumberFormatter, useDateFormatter, usePercentageFormatter } from "../../../../../../components/useFormatter.js";
import { SortIcon } from "../../Icons.jsx";
import { useTableSort, SortableHeaderRenderer } from '/src/components/Sort/TableSort';
import { useNumberFormatter, usePercentageFormatter, useDateFormatter } from '/src/components/useFormatter';

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
  operations = [],
  lpAllocations = [],
  lps = [],
}) {
  const formatNumber = useNumberFormatter();
  const formatPercent = usePercentageFormatter();
  const formatDate = useDateFormatter();

  const view = getViewFromFilter(operationFilter);

  const operationById = useMemo(() => {
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

  const operationRows = useMemo(() => {
    return filteredOps.map((op) => {
      const opId = op?.lps_operation_details_id ?? op?.id;
      const category = getCategory(op);
      const isDist = category === "Distribution";

      const opAllocs = (Array.isArray(lpAllocations) ? lpAllocations : []).filter(
        (a) => String(a?.lps_operation_details_id) === String(opId)
      );
      const totalCapitalCall = opAllocs.reduce((s, a) => s + Number(a?.capital_call ?? 0), 0);
      const totalSharesIssued = opAllocs.reduce((s, a) => s + Number(a?.shares_issued ?? 0), 0);
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
        calledAmount: isDist ? null : totalCapitalCall,
        calledPercent: isDist ? null : overallPct,
        sharesIssued: isDist ? null : totalSharesIssued,
        distribAmount: isDist ? totalCapitalCall : null,
        distribPercent: isDist ? overallPct : null,
        sharesRedeemed: isDist ? 0 : null,
        netCum: isDist ? null : Number(op?.total_operation_amount ?? 0),
      };
    });
  }, [operations, lpAllocations]);

  const lpsRows = useMemo(() => {
    return (Array.isArray(lpAllocations) ? lpAllocations : []).map((alloc) => {
      const opId = String(alloc?.lps_operation_details_id ?? "");
      const op = operationById[opId];
      const category = getCategory(op || {});
      const isDist = category === "Distribution";
      const lpName = getLpName(alloc?.lp_id, lps);
      const capitalCall = Number(alloc?.capital_call ?? 0);
      const calledPct = Number(alloc?.called_percentage ?? 0) * 100;
      const sharesIssued = Number(alloc?.shares_issued ?? 0);

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
  }, [lpAllocations, operationById, lps]);

  const shareClassRows = useMemo(() => {
    const byClass = {};
    (Array.isArray(lpAllocations) ? lpAllocations : []).forEach((alloc) => {
      const scId = String(alloc?.share_class_id ?? "-");
      const opId = String(alloc?.lps_operation_details_id ?? "");
      const op = operationById[opId];
      const isDist = getCategory(op || {}) === "Distribution";

      if (!byClass[scId]) {
        byClass[scId] = {
          id: `sc-${scId}`,
          category: isDist ? "Distribution" : "Capital call",
          shareClass: `Class ${scId}`,
          calledAmount: 0,
          calledPercent: 0,
          sharesIssued: 0,
          distribAmount: 0,
          distribPercent: 0,
          sharesRedeemed: 0,
          _count: 0,
          _isDist: isDist,
        };
      }
      const entry = byClass[scId];
      const capitalCall = Number(alloc?.capital_call ?? 0);
      const calledPct = Number(alloc?.called_percentage ?? 0) * 100;
      const sharesIssued = Number(alloc?.shares_issued ?? 0);

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

    return Object.values(byClass).map((entry) => ({
      ...entry,
      calledPercent: entry._count > 0 ? entry.calledPercent / entry._count : 0,
      distribPercent: entry._count > 0 ? entry.distribPercent / entry._count : 0,
      calledAmount: entry._isDist ? null : entry.calledAmount,
      sharesIssued: entry._isDist ? null : entry.sharesIssued,
      distribAmount: entry._isDist ? entry.distribAmount : null,
      sharesRedeemed: entry._isDist ? entry.sharesRedeemed : null,
    }));
  }, [lpAllocations, operationById]);

  const { baseRows, columnsByView } = useMemo(() => {
    if (breakdown === "lps") return { baseRows: lpsRows, columnsByView: LPS_COLUMNS };
    if (breakdown === "shareClasses") return { baseRows: shareClassRows, columnsByView: SHARE_CLASS_COLUMNS };
    return { baseRows: operationRows, columnsByView: OPERATIONS_COLUMNS };
  }, [breakdown, operationRows, lpsRows, shareClassRows]);

  const columns = columnsByView[view] ?? columnsByView.all;

  // Filter rows before passing to useTableSort
  const filteredRows = useMemo(() => {
    let data = [...baseRows];

    if (view === "capital") {
      data = data.filter((r) => r.category === "Capital call");
    } else if (view === "distribution") {
      data = data.filter((r) => r.category === "Distribution");
    }

    if (search && search.trim()) {
      const s = search.toLowerCase();
      data = data.filter((r) => {
        const label = r.label ?? r.lp ?? r.shareClass ?? "";
        return label.toLowerCase().includes(s);
      });
    }

    return data;
  }, [baseRows, view, search, breakdown]);

  const { sorted: rows, sortKey, toggleSort } = useTableSort(filteredRows, "date");

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

  const formatCell = (row, col) => {
    const value = row[col.key];
    if (value === null || value === undefined || value === "") return "-";
    switch (col.type) {
      case "date": return formatDate(value);
      case "number": return formatNumber(value);
      case "percent": return formatPercent(value);
      default: return value;
    }
  };

  const formatTotalCell = (col) => {
    const value = totals[col.key];
    if (value === null || value === undefined || isNaN(value)) return "";
    if (col.type === "percent") return formatPercent(value);
    if (col.type === "number") return formatNumber(value);
    return "";
  };

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
                  <th key={col.key} className={col.align === "right" ? "cf-num" : undefined}>
                    {col.sortable ? (
                      <SortableHeaderRenderer
                        label={col.header}
                        columnKey={col.key}
                        currentSortKey={sortKey}
                        toggleSort={toggleSort}
                        center={col.align === "right"}
                        showCurrency={false}
                      />
                    ) : (
                      col.header
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