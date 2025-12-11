import React, { useMemo, useState } from "react";
import "./KPIsTable.css";

const FUNDS = [
  {
    id: 1,
    name: "Asterium Fund I",
    year: 2024,
    strategy: "Europe - SMEs",
    commitment: 120000000,
    cost: 20000000,
    deals: 2,
    grossIrr: 17.28,
    netIrr: 12.57,
    dpi: 0.0,
    rvpi: 1.25,
    tvpi: 1.25,
  },
  {
    id: 2,
    name: "Huron Fund II",
    year: 2023,
    strategy: "Asia - LC",
    commitment: 350000000,
    cost: 250000000,
    deals: 7,
    grossIrr: 12.25,
    netIrr: 7.98,
    dpi: 0.11,
    rvpi: 1.19,
    tvpi: 1.3,
  },
  {
    id: 3,
    name: "Pioneer Fund I",
    year: 2022,
    strategy: "MENA - SMEs",
    commitment: 200000000,
    cost: 150000000,
    deals: 8,
    grossIrr: 25.93,
    netIrr: 17.5,
    dpi: 0.75,
    rvpi: 0.85,
    tvpi: 1.6,
  },
  {
    id: 4,
    name: "Lynx Fund III",
    year: 2021,
    strategy: "Africa - LC",
    commitment: 250000000,
    cost: 210000000,
    deals: 11,
    grossIrr: 19.67,
    netIrr: 14.29,
    dpi: 1.05,
    rvpi: 0.85,
    tvpi: 1.9,
  },
];

const COLS = [
  { key: "name",       label: "Fund",           align: "left",   type: "string" },
  { key: "strategy",   label: "Strategy",       align: "right",  type: "string" },
  { key: "commitment", label: "Commitment (€)", align: "right",  type: "number" },
  { key: "cost",       label: "Cost (€)",       align: "right",  type: "number" },
  { key: "deals",      label: "Nb of deals",    align: "right",  type: "number" },
  { key: "grossIrr",   label: "Gross IRR",      align: "center", type: "number" },
  { key: "netIrr",     label: "Net IRR",        align: "center", type: "number" },
  { key: "dpi",        label: "DPI",            align: "right",  type: "number" },
  { key: "rvpi",       label: "RVPI",           align: "right",  type: "number" },
  { key: "tvpi",       label: "TVPI",           align: "right",  type: "number" },
];

const fmtNum = (x) => new Intl.NumberFormat("fr-FR").format(x);

/* ---------- SVG sort icon used in table headers ---------- */
const SortIcon = ({ active, dir }) => (
  <span className={`sort-icon ${active ? "active" : ""}`}>
    <svg
      width="8"
      height="12"
      viewBox="0 0 8 12"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M3.5286 0.195262C3.78894 -0.0650874 4.21106 -0.0650874 4.4714 0.195262L7.80474 3.5286C8.06509 3.78894 8.06509 4.21106 7.80474 4.4714C7.54439 4.73175 7.12228 4.73175 6.86193 4.4714L4 1.60948L1.13807 4.4714C0.877722 4.73175 0.455612 4.73175 0.195262 4.4714C-0.0650874 4.21106 -0.0650874 3.78894 0.195262 3.5286L3.5286 0.195262ZM0.195262 7.5286C0.455612 7.26825 0.877722 7.26825 1.13807 7.5286L4 10.3905L6.86193 7.5286C7.12228 7.26825 7.54439 7.26825 7.80474 7.5286C8.06509 7.78895 8.06509 8.21106 7.80474 8.47141L4.4714 11.8047C4.21106 12.0651 3.78894 12.0651 3.5286 11.8047L0.195262 8.47141C-0.0650874 8.21106 -0.0650874 7.78895 0.195262 7.5286Z"
        fill="#375A89"
      />
    </svg>
  </span>
);

export default function KPIsTable() {
  const [sortKey, setSortKey] = useState("name");
  const [sortDir, setSortDir] = useState("asc");

  const sorted = useMemo(() => {
    const arr = [...FUNDS];
    arr.sort((a, b) => {
      const va = a[sortKey];
      const vb = b[sortKey];

      if (va == null) return 1;
      if (vb == null) return -1;

      if (typeof va === "string") {
        const res = va.localeCompare(vb);
        return sortDir === "asc" ? res : -res;
      }
      const res = va - vb;
      return sortDir === "asc" ? res : -res;
    });
    return arr;
  }, [sortKey, sortDir]);

  const toggleSort = (key) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  return (
    <div className="table-wrapper">
      <table className="clean-table">
        <thead>
          <tr>
            {COLS.map((c) => (
              <th
                key={c.key}
                className={`th-${c.align}`}
                onClick={() => toggleSort(c.key)}
              >
                <div className="th-inner">
                  <span>{c.label}</span>
                  <SortIcon active={sortKey === c.key} dir={sortDir} />
                </div>
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {sorted.map((f, i) => (
            <tr key={f.id} className={i % 2 === 0 ? "striped" : ""}>
              <td className="td-left">
                <div className="fund-name">{f.name}</div>
                <div className="fund-year">{f.year}</div>
              </td>

              <td className="td-right">{f.strategy}</td>
              <td className="td-right">{fmtNum(f.commitment)}</td>
              <td className="td-right">{fmtNum(f.cost)}</td>
              <td className="td-right">{f.deals}</td>
              <td className="td-center">{f.grossIrr.toFixed(2)}%</td>
              <td className="td-center">{f.netIrr.toFixed(2)}%</td>
              <td className="td-right">{f.dpi.toFixed(2)}x</td>
              <td className="td-right">{f.rvpi.toFixed(2)}x</td>
              <td className="td-right">{f.tvpi.toFixed(2)}x</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
