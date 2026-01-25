// KPIsTable.jsx
import React from "react";
// 1. Import the utility components/hooks
import { useTableSort, TableSort } from "./TableSort";
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
  { key: "name",       label: "Fund",           align: "left",   type: "string" },
  { key: "strategy",   label: "Strategy",       align: "right",  type: "string" },
  { key: "commitment", label: "Commitment (€)", align: "right",  type: "number" },
  { key: "cost",       label: "Cost (€)",       align: "right",  type: "number" },
  { key: "deals",      label: "Nb of deals",    align: "right",  type: "number" },
  { key: "grossIrr",   label: "Gross IRR",      align: "center", type: "number" },
  { key: "netIrr",     label: "Net IRR",        align: "center", type: "number" },
  { key: "dpi",        label: "DPI",            align: "right",  type: "number" },
  { key: "rvpi",       label: "RVPI",           align: "right",  type: "number" },
  { key: "tvpi",       label: "TVPI",           align: "right",  type: "number" },
];

const fmtNum = (x) => new Intl.NumberFormat("fr-FR").format(x);

export default function KPIsTable() {
  // 2. Use the custom hook to handle state and sorting
  const { sorted, sortKey, sortDir, toggleSort } = useTableSort(FUNDS);

  return (
    <div className="table-wrapper">
      <table className="clean-table">
        <thead>
          <tr>
            {COLS.map((c) => (
              // 3. Use the TableSort component for headers
              <TableSort
                key={c.key}
                column={c}
                currentSortKey={sortKey}
                currentSortDir={sortDir}
                toggleSort={toggleSort}
              />
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