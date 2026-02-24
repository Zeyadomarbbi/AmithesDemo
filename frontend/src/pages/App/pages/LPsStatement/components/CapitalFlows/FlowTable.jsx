// frontend/src/pages/App/pages/LPsStatement/components/CapitalFlowTable/FlowTable.jsx
import React, { useMemo, useState } from "react";
import "./FlowTable.css";
import { SortIcon } from "../../Icons.jsx";

/* ===================== COLUMN DEFINITIONS ===================== */

const OPERATIONS_COLUMNS = {
  all: [
    { key: "label", header: "Operations", sortable: true, type: "text" },
    { key: "date", header: "Date", sortable: true, type: "date" },
    { key: "calledAmount", header: "Called amount (€)", sortable: true, type: "number", align: "right" },
    { key: "calledPercent", header: "% Called", sortable: true, type: "percent", align: "right" },
    { key: "distribAmount", header: "Distrib. amount (€)", sortable: true, type: "number", align: "right" },
    { key: "distribPercent", header: "% Distributed", sortable: true, type: "percent", align: "right" },
    { key: "sharesIssued", header: "Total shares issued", sortable: true, type: "number", align: "right" },
    { key: "sharesRedeemed", header: "Total shares redeemed", sortable: true, type: "number", align: "right" },
    { key: "netCum", header: "Net cum. (€)", sortable: true, type: "number", align: "right" },
  ],
  capital: [
    { key: "label", header: "Operations", sortable: false, type: "text" },
    { key: "date", header: "Date", sortable: true, type: "date" },
    { key: "calledPercent", header: "% Called", sortable: true, type: "percent", align: "right" },
    { key: "calledAmount", header: "Called am. (€)", sortable: true, type: "number", align: "right" },
  ],
  distribution: [
    { key: "label", header: "Operations", sortable: false, type: "text" },
    { key: "date", header: "Date", sortable: true, type: "date" },
    { key: "distribPercent", header: "% Distributed", sortable: true, type: "percent", align: "right" },
    { key: "distribAmount", header: "Distrib. am. (€)", sortable: true, type: "number", align: "right" },
    { key: "sharesRedeemed", header: "Total shares redeemed", sortable: true, type: "number", align: "right" },
  ],
};

const LPS_COLUMNS = {
  all: [
    { key: "lp", header: "LPs", sortable: false, type: "text" },
    { key: "shareClass", header: "Share class", sortable: false, type: "text" },
    { key: "calledPercent", header: "% Called", sortable: true, type: "percent", align: "right" },
    { key: "calledAmount", header: "Called am. (€)", sortable: true, type: "number", align: "right" },
    { key: "sharesIssued", header: "Total shares issued", sortable: true, type: "number", align: "right" },
    { key: "sharesRedeemed", header: "Total shares redeemed", sortable: true, type: "number", align: "right" },
  ],
  capital: [
    { key: "lp", header: "LPs", sortable: false, type: "text" },
    { key: "shareClass", header: "Share class", sortable: false, type: "text" },
    { key: "calledPercent", header: "% Called", sortable: true, type: "percent", align: "right" },
    { key: "calledAmount", header: "Called am. (€)", sortable: true, type: "number", align: "right" },
    { key: "sharesIssued", header: "Total shares issued", sortable: true, type: "number", align: "right" },
  ],
  distribution: [
    { key: "lp", header: "LPs", sortable: false, type: "text" },
    { key: "shareClass", header: "Share class", sortable: false, type: "text" },
    { key: "distribPercent", header: "% Distributed", sortable: true, type: "percent", align: "right" },
    { key: "distribAmount", header: "Distrib. am. (€)", sortable: true, type: "number", align: "right" },
    { key: "sharesRedeemed", header: "Total shares redeemed", sortable: true, type: "number", align: "right" },
  ],
};

const SHARE_CLASS_COLUMNS = {
  all: [
    { key: "shareClass", header: "Share class", sortable: false, type: "text" },
    { key: "calledPercent", header: "% Called", sortable: true, type: "percent", align: "right" },
    { key: "calledAmount", header: "Called am. (€)", sortable: true, type: "number", align: "right" },
    { key: "sharesIssued", header: "Total shares issued", sortable: true, type: "number", align: "right" },
    { key: "sharesRedeemed", header: "Total shares redeemed", sortable: true, type: "number", align: "right" },
  ],
  capital: [
    { key: "shareClass", header: "Share class", sortable: false, type: "text" },
    { key: "calledPercent", header: "% Called", sortable: true, type: "percent", align: "right" },
    { key: "calledAmount", header: "Called am. (€)", sortable: true, type: "number", align: "right" },
    { key: "sharesIssued", header: "Total shares issued", sortable: true, type: "number", align: "right" },
  ],
  distribution: [
    { key: "shareClass", header: "Share class", sortable: false, type: "text" },
    { key: "distribPercent", header: "% Distributed", sortable: true, type: "percent", align: "right" },
    { key: "distribAmount", header: "Distrib. am. (€)", sortable: true, type: "number", align: "right" },
    { key: "sharesRedeemed", header: "Total shares redeemed", sortable: true, type: "number", align: "right" },
  ],
};

/* ===================== HELPERS ===================== */

// Map operation_type_id -> category
// Based on real API data: type_id 4 = Distribution, others = Capital call
// The operations API also returns operation_type_name when available
function getCategory(op = {}) {
  const name = String(op?.operation_type_name ?? "").toLowerCase();
  if (name.includes("distribution")) return "Distribution";
  const id = Number(op?.operation_type_id ?? op?.operation_type ?? 0);
  if (id === 4) return "Distribution";
  return "Capital call";
}

function getLpName(lpId, lps = []) {
  const found = lps.find((l) => String(l?.lp_id ?? l?.id) === String(lpId));
  return found?.name ?? found?.fullName ?? `LP ${lpId}`;
}

const getViewFromFilter = (filter) => {
  if (filter === "Capital call") return "capital";
  if (filter === "Distribution") return "distribution";
  return "all";
};

/* ===================== COMPONENT ===================== */

export default function FlowTable({
  operationFilter,
  search,
  breakdown,
  onSelectOperation,
  operations = [],       // from useOperationDetails
  lpAllocations = [],    // from useCapitalFlowLPOperationAllocation fetchAllAllocations
  lps = [],
}) {
  const [sortConfig, setSortConfig] = useState({ key: "date", direction: "desc" });

  const view = getViewFromFilter(operationFilter);

  // ── Build a lookup: operationId → operation ────────────────────────────────
  const operationById = useMemo(() => {
    const map = {};
    (Array.isArray(operations) ? operations : []).forEach((op) => {
      const id = op?.lps_operation_details_id ?? op?.id;
      if (id) map[String(id)] = op;
    });
    return map;
  }, [operations]);

  // ── Build rows for OPERATIONS breakdown ───────────────────────────────────
  const operationRows = useMemo(() => {
    return (Array.isArray(operations) ? operations : []).map((op) => {
      const opId = op?.lps_operation_details_id ?? op?.id;
      const category = getCategory(op);
      const isDist = category === "Distribution";

      // Sum LP allocations for this operation (API returns strings — parse them)
      const opAllocs = (Array.isArray(lpAllocations) ? lpAllocations : []).filter(
        (a) => String(a?.lps_operation_details_id) === String(opId)
      );
      const totalCapitalCall = opAllocs.reduce((s, a) => s + Number(a?.capital_call ?? 0), 0);
      const totalSharesIssued = opAllocs.reduce((s, a) => s + Number(a?.shares_issued ?? 0), 0);
      // overall_percentage_of_commitment is a decimal (0..1) — multiply by 100 for display
      const overallPct = Number(op?.overall_percentage_of_commitment ?? 0) * 100;

      return {
        id: String(opId),
        _raw: op,
        category,
        // API uses operation_name not name
        label: op?.operation_name ?? op?.name ?? `Operation ${opId}`,
        date: op?.due_date ?? op?.notice_date ?? null,
        // Capital call fields
        calledAmount: isDist ? null : totalCapitalCall,
        calledPercent: isDist ? null : overallPct,
        sharesIssued: isDist ? null : totalSharesIssued,
        // Distribution fields
        distribAmount: isDist ? totalCapitalCall : null,
        distribPercent: isDist ? overallPct : null,
        sharesRedeemed: isDist ? 0 : null,
        // Shared
        netCum: isDist ? null : Number(op?.total_operation_amount ?? 0),
      };
    });
  }, [operations, lpAllocations]);

  // ── Build rows for LPS breakdown ──────────────────────────────────────────
  const lpsRows = useMemo(() => {
    return (Array.isArray(lpAllocations) ? lpAllocations : []).map((alloc) => {
      const opId = String(alloc?.lps_operation_details_id ?? "");
      const op = operationById[opId];
      const category = getCategory(op || {});
      const isDist = category === "Distribution";
      const lpName = getLpName(alloc?.lp_id, lps);
      // API returns strings — parse them
      const capitalCall = Number(alloc?.capital_call ?? 0);
      const calledPct = Number(alloc?.called_percentage ?? 0) * 100;
      const sharesIssued = Number(alloc?.shares_issued ?? 0);

      return {
        id: String(alloc?.lp_operation_allocation_id),
        _raw: alloc,
        category,
        lp: lpName,
        shareClass: alloc?.share_class_id ? `Class ${alloc.share_class_id}` : "-",
        calledPercent: isDist ? null : calledPct,
        calledAmount: isDist ? null : capitalCall,
        sharesIssued: isDist ? null : sharesIssued,
        distribPercent: isDist ? calledPct : null,
        distribAmount: isDist ? capitalCall : null,
        sharesRedeemed: isDist ? 0 : null,
      };
    });
  }, [lpAllocations, operationById, lps]);

  // ── Build rows for SHARE CLASS breakdown ──────────────────────────────────
  const shareClassRows = useMemo(() => {
    // Group lpAllocations by share_class_id
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

      if (isDist) {
        entry.distribAmount += capitalCall;
        entry.distribPercent += calledPct;
      } else {
        entry.calledAmount += capitalCall;
        entry.calledPercent += calledPct;
        entry.sharesIssued += sharesIssued;
      }
      entry._count += 1;
    });

    return Object.values(byClass).map((entry) => ({
      ...entry,
      // Average the percentage
      calledPercent: entry._count > 0 ? entry.calledPercent / entry._count : 0,
      distribPercent: entry._count > 0 ? entry.distribPercent / entry._count : 0,
      calledAmount: entry._isDist ? null : entry.calledAmount,
      sharesIssued: entry._isDist ? null : entry.sharesIssued,
      distribAmount: entry._isDist ? entry.distribAmount : null,
      sharesRedeemed: entry._isDist ? entry.sharesRedeemed : null,
    }));
  }, [lpAllocations, operationById]);

  // ── Select correct rows + columns based on breakdown ──────────────────────
  const { baseRows, columnsByView } = useMemo(() => {
    if (breakdown === "lps") return { baseRows: lpsRows, columnsByView: LPS_COLUMNS };
    if (breakdown === "shareClasses") return { baseRows: shareClassRows, columnsByView: SHARE_CLASS_COLUMNS };
    return { baseRows: operationRows, columnsByView: OPERATIONS_COLUMNS };
  }, [breakdown, operationRows, lpsRows, shareClassRows]);

  const columns = columnsByView[view] ?? columnsByView.all;
  const sortableKeys = columns.filter((c) => c.sortable).map((c) => c.key);

  const handleSort = (key) => {
    if (!sortableKeys.includes(key)) return;
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  const rows = useMemo(() => {
    let data = [...baseRows];

    // Filter by operation type
    if (view === "capital") {
      data = data.filter((r) => r.category === "Capital call");
    } else if (view === "distribution") {
      data = data.filter((r) => r.category === "Distribution");
    }

    // Search
    if (search && search.trim()) {
      const s = search.toLowerCase();
      data = data.filter((r) => {
        if (breakdown === "operations") return (r.label || "").toLowerCase().includes(s);
        if (breakdown === "lps") return (r.lp || "").toLowerCase().includes(s);
        return (r.shareClass || "").toLowerCase().includes(s);
      });
    }

    // Sort
    const activeKey = sortableKeys.includes(sortConfig.key) ? sortConfig.key : sortableKeys[0];
    if (activeKey) {
      data.sort((a, b) => {
        let aVal = a[activeKey];
        let bVal = b[activeKey];
        const col = columns.find((c) => c.key === activeKey);
        if (col?.type === "date") {
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
  }, [baseRows, view, search, sortConfig, sortableKeys, columns, breakdown]);

  // ── Totals row ─────────────────────────────────────────────────────────────
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
    return obj;
  }, [rows, columns]);

  /* ── Formatters ── */
  const formatMoney = (v) => {
    if (v === null || v === undefined || v === "" || (typeof v === "number" && isNaN(v))) return "-";
    return Number(v).toLocaleString("fr-FR", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  };

  const formatPercent = (v) => {
    if (v === null || v === undefined || (typeof v === "number" && isNaN(v))) return "-";
    return `${Number(v).toFixed(2)}%`;
  };

  const formatDate = (iso) => {
    if (!iso) return "-";
    return new Date(iso).toLocaleDateString("en-GB", {
      day: "2-digit", month: "2-digit", year: "numeric",
    });
  };

  const formatCell = (row, col) => {
    const value = row[col.key];
    if (value === null || value === undefined || value === "") return "-";
    switch (col.type) {
      case "date": return formatDate(value);
      case "number": return formatMoney(value);
      case "percent": return formatPercent(value);
      default: return value;
    }
  };

  const formatTotalCell = (col) => {
    const value = totals[col.key];
    if (value === null || value === undefined || isNaN(value)) return "";
    if (col.type === "percent") return formatPercent(value);
    if (col.type === "number") return formatMoney(value);
    return "";
  };

  return (
    <div className="cf-root">
      {rows.length === 0 && (
        <div style={{ padding: "32px 16px", textAlign: "center", color: "#667085", fontSize: 14 }}>
          No operations found.
        </div>
      )}

      {rows.length > 0 && (
        <div className="cf-table-wrapper">
          <table className="cf-table">
            <thead>
              <tr>
                {columns.map((col) => (
                  <th
                    key={col.key}
                    onClick={() => handleSort(col.key)}
                    className={col.sortable ? "cf-sortable" : undefined}
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
                  onClick={() => breakdown === "operations" && onSelectOperation?.(r._raw)}
                  style={breakdown === "operations" ? { cursor: "pointer" } : undefined}
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
                {columns.map((col, index) => (
                  <td
                    key={col.key}
                    className={col.align === "right" ? "cf-num" : undefined}
                  >
                    {index === 0 ? "Total" : formatTotalCell(col)}
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
