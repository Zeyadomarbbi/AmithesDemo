import React, { useState } from "react";
import "./OperationStep2.css";
import AddFlowModal from "./AddFlowModal.jsx";

const ROWS = [
  { id: 1, initials: "AR", name: "Alice Right", value: "-15 098" },
  { id: 2, initials: "AR", name: "Alice Right", value: "-234 098" },
  { id: 3, initials: "AR", name: "Alice Right", value: "-57 890" },
  { id: 4, initials: "AR", name: "Alice Right", value: "-1 034 978" },
  { id: 5, initials: "AR", name: "Alice Right", value: "998 098" },
  { id: 6, initials: "AR", name: "Alice Right", value: "356 908" },
];

export default function OperationStep2() {
  const [showAddFlow, setShowAddFlow] = useState(false);

  return (
    <>
      {/* 🔹 Outer wrapper: only horizontal scroll, never vertical */}
      <div className="op2-table-outer">
        <div className="op2-table-inner">
          {/* ===== TOP DARK HEADER ===== */}
          <div className="op2-head-row">
            <div className="op2-head-cell op2-head-cell--eq">
              <span>EQUALIZATION</span>
            </div>

            <div className="op2-head-cell op2-head-cell--call">
              <span>CAPITALL CALL</span>
              <button className="op2-head-plus">+</button>
            </div>

            <div className="op2-head-cell op2-head-cell--tot">
              <span>TOTAUX</span>
            </div>
          </div>

          {/* ===== BODY (3 COLUMNS) ===== */}
          <div className="op2-body-row">
            {/* LEFT COLUMN – LPs + Equalization */}
            <div className="op2-left-col">
              <div className="op2-lp-header">
                <span className="op2-lp-header-label">LPs</span>
                <span className="op2-lp-header-sort">⇅</span>
              </div>

              <div className="op2-eq-filter">
                <div className="op2-eq-filter-top">
                  <span className="op2-eq-filter-title">Equalization</span>
                  <button className="op2-icon-btn op2-icon-btn--pencil">
                    ✎
                  </button>
                </div>
                <div className="op2-eq-filter-input-row">
                  <input
                    className="op2-input eq-target-input"
                    placeholder="Target..."
                  />
                  <button className="op2-icon-btn">⋯</button>
                </div>
              </div>

              <div className="op2-lp-rows">
                {ROWS.map((row) => (
                  <div key={row.id} className="op2-lp-row">
                    <div className="op2-lp-info">
                      <div className="op2-avatar">{row.initials}</div>
                      <span className="op2-lp-name">{row.name}</span>
                    </div>
                    <div className="op2-lp-value">{row.value}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* MIDDLE COLUMN – Big blue area + button */}
            <div className="op2-middle-col">
              <div className="op2-middle-inner">
                <button
                  type="button"
                  className="op2-add-flow-btn"
                  onClick={() => setShowAddFlow(true)}
                >
                  + Add a first flow
                </button>
              </div>
            </div>

            {/* RIGHT COLUMN – Call Amount numbers */}
            <div className="op2-right-col">
              <div className="op2-callamount-header">
                <span className="op2-callamount-title">Call Amount (€)</span>
                <span className="op2-callamount-sort">⇅</span>
              </div>

              <div className="op2-callamount-rows">
                {ROWS.map((row) => (
                  <div key={row.id} className="op2-callamount-row">
                    {row.value}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ===== FOOTER TOTALS ===== */}
          <div className="op2-footer-row">
            <div className="op2-footer-left">
              <span className="op2-footer-total-label">Total</span>
              <div className="op2-footer-total-input">
                <span className="op2-footer-euro">€</span>
                <span className="op2-footer-dash">-</span>
              </div>
              <span className="op2-footer-percent">= 0.00%</span>
            </div>

            <div className="op2-footer-middle">
              <div className="op2-footer-field">
                <span className="op2-footer-euro">€</span>
                <input className="op2-footer-input" />
                <span className="op2-footer-dash">-</span>
              </div>
              <span className="op2-footer-percent">= -%</span>
            </div>

            <div className="op2-footer-right">
              <div className="op2-footer-field">
                <span className="op2-footer-euro">€</span>
                <input className="op2-footer-input" />
                <span className="op2-footer-dash">-</span>
              </div>
              <span className="op2-footer-percent">= -%</span>
            </div>
          </div>
        </div>
      </div>

      {showAddFlow && <AddFlowModal onClose={() => setShowAddFlow(false)} />}
    </>
  );
}
