// frontend/src/pages/App/pages/LPsStatement/components/FlowTable.jsx
import React, { useMemo, useState } from "react";
import "./FlowTable.css";
import { SortIcon } from "../../../../Icons.jsx";

/* ===================== DATASETS ===================== */

const OPERATIONS_ROWS = [
  {
    id: 1,
    category: "Capital call",
    label: "Capital call #1",
    date: "2026-05-19",
    calledAmount: 1_000_000,
    calledPercent: 1.0,
    distribAmount: null,
    distribPercent: null,
    netCum: 1_000_000,
    investment: 350_000,
    managFees: 500_000,
    dueDilFees: 500_000,
    opex: 500_000,
    sharesIssued: 10_000,
    sharesRedeemed: null,
    divestment: null,
    dividends: null,
    interests: null,
    other: null,
    nature: null,
  },
  {
    id: 2,
    category: "Capital call",
    label: "Capital call #2",
    date: "2026-05-19",
    calledAmount: 600_000,
    calledPercent: 0.87,
    distribAmount: null,
    distribPercent: null,
    netCum: 1_600_000,
    investment: 265_000,
    managFees: 100_000,
    dueDilFees: 100_000,
    opex: 100_000,
    sharesIssued: 8_500,
    sharesRedeemed: null,
    divestment: null,
    dividends: null,
    interests: null,
    other: null,
    nature: null,
  },
  {
    id: 3,
    category: "Capital call",
    label: "Capital call #3",
    date: "2026-05-19",
    calledAmount: 0,
    calledPercent: 0.97,
    distribAmount: null,
    distribPercent: null,
    netCum: 615_000,
    investment: null,
    managFees: 100_000,
    dueDilFees: 50_000,
    opex: 50_000,
    sharesIssued: 4_200,
    sharesRedeemed: null,
    divestment: null,
    dividends: null,
    interests: null,
    other: null,
    nature: null,
  },
  {
    id: 4,
    category: "Distribution",
    label: "Distribution #1",
    date: "2024-09-12",
    calledAmount: 0,
    calledPercent: 0,
    distribAmount: 805_000,
    distribPercent: 0.85,
    netCum: null,
    investment: null,
    managFees: null,
    dueDilFees: null,
    opex: null,
    sharesIssued: null,
    sharesRedeemed: 3_000,
    divestment: 0,
    dividends: 800_000,
    interests: 0,
    other: 5_000,
    nature: "Nominal",
  },
  {
    id: 5,
    category: "Distribution",
    label: "Distribution #2",
    date: "2024-09-12",
    calledAmount: 0,
    calledPercent: 0,
    distribAmount: 25_000_000,
    distribPercent: 21.85,
    netCum: null,
    investment: null,
    managFees: null,
    dueDilFees: null,
    opex: null,
    sharesIssued: null,
    sharesRedeemed: 18_500,
    divestment: 25_000_000,
    dividends: 0,
    interests: 100_000,
    other: 0,
    nature: "Nominal",
  },
  {
    id: 6,
    category: "Distribution",
    label: "Distribution #3",
    date: "2024-09-12",
    calledAmount: 0,
    calledPercent: 0,
    distribAmount: 1_955_000,
    distribPercent: 5.15,
    netCum: null,
    investment: null,
    managFees: null,
    dueDilFees: null,
    opex: null,
    sharesIssued: null,
    sharesRedeemed: 7_800,
    divestment: 805_000,
    dividends: 1_000_000,
    interests: 100_000,
    other: 50_000,
    nature: "Hurdle",
  },
];

const LPS_ROWS = [
  {
    id: "lp-1",
    category: "Capital call",
    lp: "Alice Right",
    shareClass: "Class A1",
    calledPercent: 20.0,
    calledAmount: 2_200_000,
    sharesIssued: 12_000,
    investment: 2_000_000,
    managFees: 100_000,
    dueDilFees: 0,
    opex: 100_000,
    structFees: 100_000,
  },
  {
    id: "lp-2",
    category: "Capital call",
    lp: "AKA Partners",
    shareClass: "Class A1",
    calledPercent: 20.0,
    calledAmount: 2_200_000,
    sharesIssued: 10_000,
    investment: 2_000_000,
    managFees: 100_000,
    dueDilFees: 0,
    opex: 150_000,
    structFees: 50_000,
  },
  {
    id: "lp-3",
    category: "Capital call",
    lp: "Yield Studio",
    shareClass: "Class A2",
    calledPercent: 20.0,
    calledAmount: 2_200_000,
    sharesIssued: 8_000,
    investment: 2_000_000,
    managFees: 100_000,
    dueDilFees: 0,
    opex: 100_000,
    structFees: 100_000,
  },
  {
    id: "lp-4",
    category: "Distribution",
    lp: "Alice Right",
    shareClass: "Class A1",
    distribPercent: 5.0,
    distribAmount: 500_000,
    sharesRedeemed: 2_000,
    divestment: 200_000,
    dividends: 250_000,
    interests: 30_000,
    other: 20_000,
  },
];

const SHARE_CLASS_ROWS = [
  {
    id: "sc-1",
    category: "Capital call",
    shareClass: "Class A1",
    calledPercent: 25.0,
    calledAmount: 4_400_000,
    sharesIssued: 22_000,
    investment: 4_000_000,
    managFees: 200_000,
    dueDilFees: 0,
    opex: 250_000,
    structFees: 150_000,
  },
  {
    id: "sc-2",
    category: "Capital call",
    shareClass: "Class A2",
    calledPercent: 20.0,
    calledAmount: 2_200_000,
    sharesIssued: 8_000,
    investment: 2_000_000,
    managFees: 100_000,
    dueDilFees: 0,
    opex: 100_000,
    structFees: 100_000,
  },
  {
    id: "sc-3",
    category: "Distribution",
    shareClass: "Class A1",
    distribPercent: 10.0,
    distribAmount: 1_000_000,
    sharesRedeemed: 3_500,
    divestment: 400_000,
    dividends: 500_000,
    interests: 60_000,
    other: 40_000,
  },
];

/* ===================== COLUMN DEFINITIONS (same logic) ===================== */

const OPERATIONS_COLUMNS = {
  all: [
    { key: "label", header: "Operations", sortable: true, type: "text" },
    { key: "date", header: "Date", sortable: true, type: "date" },
    {
      key: "calledAmount",
      header: "Called amount (€)",
      sortable: true,
      type: "number",
      align: "right",
    },
    {
      key: "calledPercent",
      header: "% Called",
      sortable: true,
      type: "percent",
      align: "right",
    },
    {
      key: "distribAmount",
      header: "Distrib. amount (€)",
      sortable: true,
      type: "number",
      align: "right",
    },
    {
      key: "distribPercent",
      header: "% Distributed",
      sortable: true,
      type: "percent",
      align: "right",
    },
    {
      key: "sharesIssued",
      header: "Total shares issued",
      sortable: true,
      type: "number",
      align: "right",
    },
    {
      key: "sharesRedeemed",
      header: "Total shares redeemed",
      sortable: true,
      type: "number",
      align: "right",
    },
    {
      key: "netCum",
      header: "Net cum. (€)",
      sortable: true,
      type: "number",
      align: "right",
    },
  ],
  capital: [
    { key: "label", header: "Operations", sortable: false, type: "text" },
    { key: "date", header: "Date", sortable: true, type: "date" },
    {
      key: "calledPercent",
      header: "% Called",
      sortable: true,
      type: "percent",
      align: "right",
    },
    {
      key: "calledAmount",
      header: "Called am. (€)",
      sortable: true,
      type: "number",
      align: "right",
    },
    {
      key: "sharesIssued",
      header: "Total shares issued",
      sortable: true,
      type: "number",
      align: "right",
    },
    {
      key: "investment",
      header: "Investment (€)",
      sortable: true,
      type: "number",
      align: "right",
    },
    {
      key: "managFees",
      header: "Manag. fees (€)",
      sortable: true,
      type: "number",
      align: "right",
    },
    {
      key: "dueDilFees",
      header: "Due dil. fees (€)",
      sortable: true,
      type: "number",
      align: "right",
    },
    {
      key: "opex",
      header: "Opex (€)",
      sortable: true,
      type: "number",
      align: "right",
    },
  ],
  distribution: [
    { key: "label", header: "Operations", sortable: false, type: "text" },
    { key: "date", header: "Date", sortable: true, type: "date" },
    {
      key: "distribPercent",
      header: "% Distributed",
      sortable: true,
      type: "percent",
      align: "right",
    },
    {
      key: "distribAmount",
      header: "Distrib. am. (€)",
      sortable: true,
      type: "number",
      align: "right",
    },
    {
      key: "sharesRedeemed",
      header: "Total shares redeemed",
      sortable: true,
      type: "number",
      align: "right",
    },
    {
      key: "divestment",
      header: "Divestment (€)",
      sortable: true,
      type: "number",
      align: "right",
    },
    {
      key: "dividends",
      header: "Dividends (€)",
      sortable: true,
      type: "number",
      align: "right",
    },
    {
      key: "interests",
      header: "Interests (€)",
      sortable: true,
      type: "number",
      align: "right",
    },
    {
      key: "other",
      header: "Other (€)",
      sortable: true,
      type: "number",
      align: "right",
    },
    { key: "nature", header: "Nature", sortable: false, type: "text" },
  ],
};

const LPS_COLUMNS = {
  all: [
    { key: "lp", header: "LPs", sortable: false, type: "text" },
    { key: "shareClass", header: "Share class", sortable: false, type: "text" },
    {
      key: "calledPercent",
      header: "% Called",
      sortable: true,
      type: "percent",
      align: "right",
    },
    {
      key: "calledAmount",
      header: "Called am. (€)",
      sortable: true,
      type: "number",
      align: "right",
    },
    {
      key: "sharesIssued",
      header: "Total shares issued",
      sortable: true,
      type: "number",
      align: "right",
    },
    {
      key: "sharesRedeemed",
      header: "Total shares redeemed",
      sortable: true,
      type: "number",
      align: "right",
    },
    {
      key: "investment",
      header: "Investment (€)",
      sortable: true,
      type: "number",
      align: "right",
    },
    {
      key: "managFees",
      header: "Manag. fees (€)",
      sortable: true,
      type: "number",
      align: "right",
    },
    {
      key: "dueDilFees",
      header: "Due dil. fees (€)",
      sortable: true,
      type: "number",
      align: "right",
    },
    {
      key: "opex",
      header: "Opex (€)",
      sortable: true,
      type: "number",
      align: "right",
    },
    {
      key: "structFees",
      header: "Struct. fees (€)",
      sortable: true,
      type: "number",
      align: "right",
    },
    {
      key: "divestment",
      header: "Divestment (€)",
      sortable: true,
      type: "number",
      align: "right",
    },
    {
      key: "dividends",
      header: "Dividends (€)",
      sortable: true,
      type: "number",
      align: "right",
    },
    {
      key: "interests",
      header: "Interests (€)",
      sortable: true,
      type: "number",
      align: "right",
    },
    {
      key: "other",
      header: "Other (€)",
      sortable: true,
      type: "number",
      align: "right",
    },
  ],
  capital: [
    { key: "lp", header: "LPs", sortable: false, type: "text" },
    { key: "shareClass", header: "Share class", sortable: false, type: "text" },
    {
      key: "calledPercent",
      header: "% Called",
      sortable: true,
      type: "percent",
      align: "right",
    },
    {
      key: "calledAmount",
      header: "Called am. (€)",
      sortable: true,
      type: "number",
      align: "right",
    },
    {
      key: "sharesIssued",
      header: "Total shares issued",
      sortable: true,
      type: "number",
      align: "right",
    },
    {
      key: "investment",
      header: "Investment (€)",
      sortable: true,
      type: "number",
      align: "right",
    },
    {
      key: "managFees",
      header: "Manag. fees (€)",
      sortable: true,
      type: "number",
      align: "right",
    },
    {
      key: "dueDilFees",
      header: "Due dil. fees (€)",
      sortable: true,
      type: "number",
      align: "right",
    },
    {
      key: "opex",
      header: "Opex (€)",
      sortable: true,
      type: "number",
      align: "right",
    },
    {
      key: "structFees",
      header: "Struct. fees (€)",
      sortable: true,
      type: "number",
      align: "right",
    },
  ],
  distribution: [
    { key: "lp", header: "LPs", sortable: false, type: "text" },
    { key: "shareClass", header: "Share class", sortable: false, type: "text" },
    {
      key: "distribPercent",
      header: "% Distributed",
      sortable: true,
      type: "percent",
      align: "right",
    },
    {
      key: "distribAmount",
      header: "Distrib. am. (€)",
      sortable: true,
      type: "number",
      align: "right",
    },
    {
      key: "sharesRedeemed",
      header: "Total shares redeemed",
      sortable: true,
      type: "number",
      align: "right",
    },
    {
      key: "divestment",
      header: "Divestment (€)",
      sortable: true,
      type: "number",
      align: "right",
    },
    {
      key: "dividends",
      header: "Dividends (€)",
      sortable: true,
      type: "number",
      align: "right",
    },
    {
      key: "interests",
      header: "Interests (€)",
      sortable: true,
      type: "number",
      align: "right",
    },
    {
      key: "other",
      header: "Other (€)",
      sortable: true,
      type: "number",
      align: "right",
    },
  ],
};

const SHARE_CLASS_COLUMNS = {
  all: [
    { key: "shareClass", header: "Share class", sortable: false, type: "text" },
    {
      key: "calledPercent",
      header: "% Called",
      sortable: true,
      type: "percent",
      align: "right",
    },
    {
      key: "calledAmount",
      header: "Called am. (€)",
      sortable: true,
      type: "number",
      align: "right",
    },
    {
      key: "sharesIssued",
      header: "Total shares issued",
      sortable: true,
      type: "number",
      align: "right",
    },
    {
      key: "sharesRedeemed",
      header: "Total shares redeemed",
      sortable: true,
      type: "number",
      align: "right",
    },
    {
      key: "investment",
      header: "Investment (€)",
      sortable: true,
      type: "number",
      align: "right",
    },
    {
      key: "managFees",
      header: "Manag. fees (€)",
      sortable: true,
      type: "number",
      align: "right",
    },
    {
      key: "dueDilFees",
      header: "Due dil. fees (€)",
      sortable: true,
      type: "number",
      align: "right",
    },
    {
      key: "opex",
      header: "Opex (€)",
      sortable: true,
      type: "number",
      align: "right",
    },
    {
      key: "structFees",
      header: "Struct. fees (€)",
      sortable: true,
      type: "number",
      align: "right",
    },
    {
      key: "divestment",
      header: "Divestment (€)",
      sortable: true,
      type: "number",
      align: "right",
    },
    {
      key: "dividends",
      header: "Dividends (€)",
      sortable: true,
      type: "number",
      align: "right",
    },
    {
      key: "interests",
      header: "Interests (€)",
      sortable: true,
      type: "number",
      align: "right",
    },
    {
      key: "other",
      header: "Other (€)",
      sortable: true,
      type: "number",
      align: "right",
    },
  ],
  capital: [
    { key: "shareClass", header: "Share class", sortable: false, type: "text" },
    {
      key: "calledPercent",
      header: "% Called",
      sortable: true,
      type: "percent",
      align: "right",
    },
    {
      key: "calledAmount",
      header: "Called am. (€)",
      sortable: true,
      type: "number",
      align: "right",
    },
    {
      key: "sharesIssued",
      header: "Total shares issued",
      sortable: true,
      type: "number",
      align: "right",
    },
    {
      key: "investment",
      header: "Investment (€)",
      sortable: true,
      type: "number",
      align: "right",
    },
    {
      key: "managFees",
      header: "Manag. fees (€)",
      sortable: true,
      type: "number",
      align: "right",
    },
    {
      key: "dueDilFees",
      header: "Due dil. fees (€)",
      sortable: true,
      type: "number",
      align: "right",
    },
    {
      key: "opex",
      header: "Opex (€)",
      sortable: true,
      type: "number",
      align: "right",
    },
    {
      key: "structFees",
      header: "Struct. fees (€)",
      sortable: true,
      type: "number",
      align: "right",
    },
  ],
  distribution: [
    { key: "shareClass", header: "Share class", sortable: false, type: "text" },
    {
      key: "distribPercent",
      header: "% Distributed",
      sortable: true,
      type: "percent",
      align: "right",
    },
    {
      key: "distribAmount",
      header: "Distrib. am. (€)",
      sortable: true,
      type: "number",
      align: "right",
    },
    {
      key: "sharesRedeemed",
      header: "Total shares redeemed",
      sortable: true,
      type: "number",
      align: "right",
    },
    {
      key: "divestment",
      header: "Divestment (€)",
      sortable: true,
      type: "number",
      align: "right",
    },
    {
      key: "dividends",
      header: "Dividends (€)",
      sortable: true,
      type: "number",
      align: "right",
    },
    {
      key: "interests",
      header: "Interests (€)",
      sortable: true,
      type: "number",
      align: "right",
    },
    {
      key: "other",
      header: "Other (€)",
      sortable: true,
      type: "number",
      align: "right",
    },
  ],
};

const BREAKDOWN_CONFIG = {
  operations: { rows: OPERATIONS_ROWS, columns: OPERATIONS_COLUMNS },
  lps: { rows: LPS_ROWS, columns: LPS_COLUMNS },
  shareClasses: { rows: SHARE_CLASS_ROWS, columns: SHARE_CLASS_COLUMNS },
};

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
  onSelectOperation, // ✅ ONLY NEW PROP
}) {
  const [sortConfig, setSortConfig] = useState({ key: "date", direction: "asc" });

  const view = getViewFromFilter(operationFilter);
  const { rows: baseRows, columns: columnsByView } = BREAKDOWN_CONFIG[breakdown];

  const columns = columnsByView[view];
  const sortableKeys = columns.filter((c) => c.sortable).map((c) => c.key);

  const handleSort = (key) => {
    if (!sortableKeys.includes(key)) return;

    setSortConfig((prev) => {
      if (prev.key === key) {
        return { key, direction: prev.direction === "asc" ? "desc" : "asc" };
      }
      return { key, direction: "asc" };
    });
  };

  const rows = useMemo(() => {
    let data = [...baseRows];

    // filter by category
    if (view === "capital") data = data.filter((r) => r.category === "Capital call");
    else if (view === "distribution") data = data.filter((r) => r.category === "Distribution");

    // search by label / lp / share class
    if (search && search.trim()) {
      const s = search.toLowerCase();
      data = data.filter((r) => {
        if (breakdown === "operations") return (r.label || "").toLowerCase().includes(s);
        if (breakdown === "lps") return (r.lp || "").toLowerCase().includes(s);
        return (r.shareClass || "").toLowerCase().includes(s);
      });
    }

    const activeKey = sortableKeys.includes(sortConfig.key)
      ? sortConfig.key
      : sortableKeys[0];
    const direction = sortConfig.direction || "asc";

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

        if (aVal < bVal) return direction === "asc" ? -1 : 1;
        if (aVal > bVal) return direction === "asc" ? 1 : -1;
        return 0;
      });
    }

    return data;
  }, [baseRows, view, search, sortConfig, sortableKeys, columns, breakdown]);

  const totals = useMemo(() => {
    const totalsObj = {};
    columns.forEach((col) => {
      if (col.type === "number" || col.type === "percent") {
        totalsObj[col.key] = 0;
      }
    });

    rows.forEach((row) => {
      columns.forEach((col) => {
        if (
          (col.type === "number" || col.type === "percent") &&
          typeof row[col.key] === "number"
        ) {
          totalsObj[col.key] += row[col.key];
        }
      });
    });

    return totalsObj;
  }, [rows, columns]);

  const formatMoney = (value) => {
    if (value === null || value === undefined) return "-";
    if (typeof value !== "number") return "-";
    return value.toLocaleString("fr-FR");
  };

  const formatPercent = (value) => {
    if (value === null || value === undefined) return "-";
    if (typeof value !== "number") return "-";
    return `${value.toFixed(2)}%`;
  };

  const formatDate = (iso) =>
    new Date(iso).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });

  const formatCell = (row, col) => {
    const value = row[col.key];
    if (value === null || value === undefined || value === "") return "-";

    switch (col.type) {
      case "date":
        return formatDate(value);
      case "number":
        return formatMoney(value);
      case "percent":
        return formatPercent(value);
      default:
        return value;
    }
  };

  const formatTotalCell = (col) => {
    const value = totals[col.key];
    if (value === null || value === undefined || isNaN(value)) return "";
    if (col.type === "percent") return formatPercent(value);
    if (col.type === "number") return formatMoney(value);
    return "";
  };

  // ✅ clickable only for operations rows
  const rowClickable =
    breakdown === "operations" && typeof onSelectOperation === "function";

  return (
    <div className="cf-root">
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
                className={rowClickable ? "cf-row-clickable" : undefined}
                onClick={() => {
                  if (!rowClickable) return;
                  onSelectOperation(r);
                }}
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
    </div>
  );
}
