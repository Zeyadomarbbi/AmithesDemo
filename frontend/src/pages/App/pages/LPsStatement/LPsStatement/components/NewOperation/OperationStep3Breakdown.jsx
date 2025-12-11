import React from "react";
import "./OperationStep3Breakdown.css";

const ROWS = [
  {
    id: 1,
    initials: "AR",
    name: "Alice Right",
    commitment: "1 000 000",
    ownership: "2.00%",
    calledBefore: "200 000",
    calledPct: "20.00%",
    sharesBefore: "200",
    equalization: "-15 098",
    capitalCall: "160 000",
  },
  {
    id: 2,
    initials: "AR",
    name: "Alice Right",
    commitment: "10 000 000",
    ownership: "20.00%",
    calledBefore: "2 000 000",
    calledPct: "20.00%",
    sharesBefore: "2 000",
    equalization: "-234 098",
    capitalCall: "1 567 900",
  },
  {
    id: 3,
    initials: "AR",
    name: "Alice Right",
    commitment: "5 000 000",
    ownership: "10.00%",
    calledBefore: "1 000 000",
    calledPct: "20.00%",
    sharesBefore: "1 000",
    equalization: "-57 980",
    capitalCall: "437 980",
  },
  {
    id: 4,
    initials: "AR",
    name: "Alice Right",
    commitment: "7 500 000",
    ownership: "15.00%",
    calledBefore: "1 500 000",
    calledPct: "20.00%",
    sharesBefore: "1 500",
    equalization: "-1 034 978",
    capitalCall: "6 000 765",
  },
  {
    id: 5,
    initials: "AR",
    name: "Alice Right",
    commitment: "2 500 000",
    ownership: "5.00%",
    calledBefore: "-",
    calledPct: "0.00%",
    sharesBefore: "-",
    equalization: "998 098",
    capitalCall: "6 123 456",
  },
  {
    id: 6,
    initials: "AR",
    name: "Alice Right",
    commitment: "15 000 000",
    ownership: "30.00%",
    calledBefore: "-",
    calledPct: "0.00%",
    sharesBefore: "-",
    equalization: "356 908",
    capitalCall: "4 250 980",
  },
];

export default function OperationStep3Breakdown() {
  return (
    <div className="op3-root">
      <div className="op3-table-wrapper">
        <table className="op3-table">
          <colgroup>
            <col className="op3-col-lp" />
            <col className="op3-col-commit" />
            <col className="op3-col-owner" />
            <col className="op3-col-called" />
            <col className="op3-col-calledpct" />
            <col className="op3-col-shares" />
            <col className="op3-col-eq" />
            <col className="op3-col-call" />
          </colgroup>

          {/* ================= TOP DARK STRIP ================= */}
          <thead>
            <tr className="op3-top-row">
              <th className="op3-top op3-top-info" colSpan={3}>
                INFORMATION
              </th>
              <th className="op3-top op3-top-breakdown" colSpan={3}>
                BREAKDOWN BEFORE OPERATION
                <button type="button" className="op3-top-plus">
                  +
                </button>
              </th>
              <th className="op3-top op3-top-op" colSpan={2}>
                OPERATION
              </th>
            </tr>

            {/* ================= SECOND HEADER ROW ================= */}
            <tr className="op3-head-row">
              <th className="op3-head op3-head-lp">LPs</th>
              <th className="op3-head">Commitment (€)</th>
              <th className="op3-head">Ownership (%)</th>
              <th className="op3-head">Called before (€)</th>
              <th className="op3-head">% Called before</th>
              <th className="op3-head">Shares before (€)</th>
              <th className="op3-head">Equalization (€)</th>
              <th className="op3-head">Capital call (€)</th>
            </tr>
          </thead>

          {/* ================= BODY ROWS ================= */}
          <tbody>
            {ROWS.map((row, index) => {
              const isAlt = index % 2 === 1;
              return (
                <tr
                  key={row.id}
                  className={`op3-body-row ${isAlt ? "is-alt" : ""}`}
                >
                  <td className="op3-cell op3-cell-lp">
                    <div className="op3-avatar">{row.initials}</div>
                    <span className="op3-lp-name">{row.name}</span>
                  </td>
                  <td className="op3-cell">{row.commitment}</td>
                  <td className="op3-cell">{row.ownership}</td>
                  <td className="op3-cell">{row.calledBefore}</td>
                  <td className="op3-cell">{row.calledPct}</td>
                  <td className="op3-cell">{row.sharesBefore}</td>
                  <td className="op3-cell">{row.equalization}</td>
                  <td className="op3-cell">{row.capitalCall}</td>
                </tr>
              );
            })}
          </tbody>

          {/* ================= TOTAL ROW ================= */}
          <tfoot>
            <tr className="op3-foot-row">
              <td className="op3-foot-label">Total</td>
              <td className="op3-foot">41 000 000</td>
              <td className="op3-foot">100.00%</td>
              <td className="op3-foot">4 700 000</td>
              <td className="op3-foot">20.00%</td>
              <td className="op3-foot">4 700</td>
              <td className="op3-foot">-</td>
              <td className="op3-foot">18 547 203</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
