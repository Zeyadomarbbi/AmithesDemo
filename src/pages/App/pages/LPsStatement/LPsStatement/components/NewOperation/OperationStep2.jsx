// frontend/src/pages/App/pages/LPsStatement/components/NewOperation/OperationStep2.jsx
import React, { useState } from "react";
import "./OperationStep2.css";
import AddFlowModal from "./AddFlowModal.jsx";
import OperationStep2Filled from "./OperationStep2Filled.jsx";

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
  const [isFilled, setIsFilled] = useState(false); // false = empty table, true = filled version

  const openFlow = () => setShowAddFlow(true);
  const closeFlow = () => setShowAddFlow(false);

  const handleSaveFlow = (flowData) => {
    // later you can use flowData to update rows, etc.
    console.log("Save clicked with:", flowData);
    setIsFilled(true);      // 🔹 switch to the filled table
    setShowAddFlow(false);  // 🔹 close modal
  };

  // 🔹 RENDER
  return (
    <>
      {/* ================== MAIN CONTENT ================== */}
      {!isFilled ? (
        /* ========== EMPTY / FIRST STATE ========== */
        <div className="op2-table-outer">
          <div className="op2-table-inner">
            {/* ================= HEADER STRIP ================= */}
            <div className="op2-head-row">
              <div className="op2-head-block op2-head-block--eq">
                EQUALIZATION
              </div>

              <div className="op2-head-block op2-head-block--cap">
                <span>CAPITALL CALL</span>
                <button
                  type="button"
                  className="op2-head-plus"
                  onClick={openFlow}
                >
                  +
                </button>
              </div>

              <div className="op2-head-block op2-head-block--tot">
                TOTAUX
              </div>
            </div>

            {/* ================= BODY (3 COLUMNS) ================= */}
            <div className="op2-body-row">
              {/* ---------- LEFT COLUMN: LPs + Equalization ---------- */}
              <div className="op2-left-col">
                {/* LPs header row (label + sort + empty right header) */}
                <div className="op2-lp-header-row">
                  <div className="op2-lp-header">
                    <span className="op2-lp-header-label">LPs</span>
                    <span className="op2-lp-header-sort">⇅</span>
                  </div>
                  <div className="op2-lp-header-spacer" />
                </div>

                {/* Equalization filter (only in right half) */}
                <div className="op2-eq-filter">
                  <div className="op2-eq-spacer" />
                  <div className="op2-eq-panel">
                    <div className="op2-eq-filter-top">
                      <span className="op2-eq-filter-title">Equalization</span>
                      <button
                        type="button"
                        className="op2-icon-btn op2-icon-btn--pencil"
                      >
                        ✎
                      </button>
                    </div>
                    <div className="op2-eq-filter-input-row">
                      <input
                        className="op2-input"
                        placeholder="Target..."
                      />
                      <button type="button" className="op2-icon-btn">
                        ⋯
                      </button>
                    </div>
                  </div>
                </div>

                {/* LP rows – avatar + name + equalization value */}
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

              {/* ---------- MIDDLE COLUMN: blue area with "Add a first flow" ---------- */}
              <div className="op2-middle-col">
                <button
                  type="button"
                  className="op2-add-flow-btn"
                  onClick={openFlow}
                >
                  + Add a first flow
                </button>
              </div>

              {/* ---------- RIGHT COLUMN: Call Amount (€) ---------- */}
              <div className="op2-right-col">
                <div className="op2-callamount-header">
                  <span>Call Amount (€)</span>
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

            {/* ================= FOOTER TOTALS ================= */}
            <div className="op2-footer-row">
              {/* Equalization total (left) */}
              <div className="op2-footer-left">
                <span className="op2-footer-total-label">Total</span>
                <div className="op2-footer-total-input">
                  <span className="op2-footer-euro">€</span>
                  <span className="op2-footer-dash">-</span>
                </div>
                <span className="op2-footer-percent">= 0.00%</span>
              </div>

              {/* Capital Call total (wide middle field) */}
              <div className="op2-footer-mid">
                <div className="op2-footer-total-input op2-footer-total-input--wide">
                  <span className="op2-footer-euro">€</span>
                  <input className="op2-footer-input" />
                </div>
                <span className="op2-footer-percent">= -%</span>
              </div>

              {/* Call Amount total (right) */}
              <div className="op2-footer-right">
                <div className="op2-footer-total-input">
                  <span className="op2-footer-euro">€</span>
                  <span className="op2-footer-dash">-</span>
                </div>
                <span className="op2-footer-percent">= -%</span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* ========== AFTER SAVE → FILLED TABLE ========== */
        <OperationStep2Filled />
      )}

      {/* ================= ADD FLOW MODAL ================= */}
      {showAddFlow && (
        <AddFlowModal
          onClose={closeFlow}
          onSave={handleSaveFlow}
        />
      )}
    </>
  );
}
