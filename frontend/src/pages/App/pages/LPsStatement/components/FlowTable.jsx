import React, { useMemo, useState } from "react";
import "./FlowTable.css";

const OPERATIONS = [
  {
    id: 1,
    label: "Capital call #1",
    category: "Capital call",
    date: "2025-01-01",
    calledAmount: 17850000,
    calledPercent: 15.68,
    distribAmount: null,
    distribPercent: null,
    netCum: 17850000,
  },
  {
    id: 2,
    label: "Equalization #1",
    category: "Capital call",
    date: "2025-03-23",
    calledAmount: 465000,
    calledPercent: 0.58,
    distribAmount: null,
    distribPercent: null,
    netCum: 18315000,
  },
  {
    id: 3,
    label: "Distribution #1",
    category: "Distribution",
    date: "2025-06-30",
    calledAmount: 0,
    calledPercent: 0,
    distribAmount: 2315000,
    distribPercent: 2.5,
    netCum: 16000000,
  },
];

const SORTABLE_COLUMNS = ["date", "calledAmount", "calledPercent", "distribAmount", "distribPercent", "netCum"];

export default function FlowTable({ operationFilter, search }) {
  const [sortConfig, setSortConfig] = useState({
    key: "date",
    direction: "asc",
  });

  const handleSort = (key) => {
    if (!SORTABLE_COLUMNS.includes(key)) return;

    setSortConfig((prev) => {
      if (prev.key === key) {
        return {
          key,
          direction: prev.direction === "asc" ? "desc" : "asc",
        };
      }
      return { key, direction: "asc" };
    });
  };

  const rows = useMemo(() => {
    let data = [...OPERATIONS];

    // filter by category
    if (operationFilter !== "All operations") {
      data = data.filter((op) => op.category === operationFilter);
    }

    // search by label
    if (search.trim()) {
      const s = search.toLowerCase();
      data = data.filter((op) => op.label.toLowerCase().includes(s));
    }

    // sorting
    const { key, direction } = sortConfig;
    data.sort((a, b) => {
      let aVal = a[key];
      let bVal = b[key];

      if (key === "date") {
        aVal = new Date(aVal).getTime();
        bVal = new Date(bVal).getTime();
      }

      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;

      if (aVal < bVal) return direction === "asc" ? -1 : 1;
      if (aVal > bVal) return direction === "asc" ? 1 : -1;
      return 0;
    });

    return data;
  }, [operationFilter, search, sortConfig]);

  const totals = useMemo(() => {
    const base = { calledAmount: 0, calledPercent: 0, distribAmount: 0, distribPercent: 0, netCum: 0 };

    rows.forEach((r) => {
      base.calledAmount += r.calledAmount || 0;
      base.calledPercent += r.calledPercent || 0;
      base.distribAmount += r.distribAmount || 0;
      base.distribPercent += r.distribPercent || 0;
      base.netCum += r.netCum || 0;
    });

    return base;
  }, [rows]);

  const formatMoney = (value) => {
    if (!value) return "-";
    return value.toLocaleString("fr-FR");
  };

  const formatPercent = (value) => {
    if (!value) return "-";
    return `${value.toFixed(2)}%`;
  };

  const sortIcon = (key) => {
    if (sortConfig.key !== key) return "↕";
    return sortConfig.direction === "asc" ? "↑" : "↓";
  };

  const formatDate = (iso) =>
    new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" });

  return (
    <div className="cf-table-wrapper">
      <table className="cf-table">
        <thead>
          <tr>
            <th>Operations</th>
            <th onClick={() => handleSort("date")}>
              Date <span className="cf-sort">{sortIcon("date")}</span>
            </th>
            <th onClick={() => handleSort("calledAmount")}>
              Called amount (€) <span className="cf-sort">{sortIcon("calledAmount")}</span>
            </th>
            <th onClick={() => handleSort("calledPercent")}>
              % Called <span className="cf-sort">{sortIcon("calledPercent")}</span>
            </th>
            <th onClick={() => handleSort("distribAmount")}>
              Distrib. amount (€) <span className="cf-sort">{sortIcon("distribAmount")}</span>
            </th>
            <th onClick={() => handleSort("distribPercent")}>
              % Distributed <span className="cf-sort">{sortIcon("distribPercent")}</span>
            </th>
            <th onClick={() => handleSort("netCum")}>
              Net cum. (€) <span className="cf-sort">{sortIcon("netCum")}</span>
            </th>
          </tr>
        </thead>

        <tbody>
          {rows.map((r) => (
            <tr key={r.id}>
              <td>{r.label}</td>
              <td>{formatDate(r.date)}</td>
              <td className="cf-num">{formatMoney(r.calledAmount)}</td>
              <td className="cf-num">{formatPercent(r.calledPercent)}</td>
              <td className="cf-num">{formatMoney(r.distribAmount)}</td>
              <td className="cf-num">{formatPercent(r.distribPercent)}</td>
              <td className="cf-num">{formatMoney(r.netCum)}</td>
            </tr>
          ))}

          {/* Totals row (based on filtered rows) */}
          <tr className="cf-total-row">
            <td>Total</td>
            <td></td>
            <td className="cf-num">{formatMoney(totals.calledAmount)}</td>
            <td className="cf-num">{formatPercent(totals.calledPercent)}</td>
            <td className="cf-num">{formatMoney(totals.distribAmount)}</td>
            <td className="cf-num">{formatPercent(totals.distribPercent)}</td>
            <td className="cf-num">{formatMoney(totals.netCum)}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
