// frontend/src/pages/App/pages/LPsStatement/components/NewOperation/OperationStep2Filled.jsx
import React from "react";
import "./OperationStep2Filled.css";

const FLOW_COLUMNS = [
  { id: "due_dil", title: "Due dil ABEC", subtitle: "Due diligence fees" },
  { id: "inv_abc", title: "Investment in ABC", subtitle: "Investment" },
  { id: "struct_fy24", title: "Structuring FY24", subtitle: "Structuring fees" },
];

const SHARE_ROWS = [
  { id: 1, initials: "AR", name: "Alice Right", equalization: "-15 098", flows: ["15 000", "150 000", "10 000"], callAmount: "160 000" },
  { id: 2, initials: "AR", name: "Alice Right", equalization: "-234 098", flows: ["160 980", "1 609 080", "75 000"], callAmount: "1 567 900" },
  { id: 3, initials: "AR", name: "Alice Right", equalization: "-57 980", flows: ["46 758", "460 758", "32 768"], callAmount: "437 980" },
  { id: 4, initials: "AR", name: "Alice Right", equalization: "-1 034 978", flows: ["798 098", "7 089 098", "176 879"], callAmount: "6 000 765" },
  { id: 5, initials: "AR", name: "Alice Right", equalization: "998 098", flows: ["765 890", "7 065 890", "209 876"], callAmount: "6 123 456" },
  { id: 6, initials: "AR", name: "Alice Right", equalization: "356 908", flows: ["436 000", "4 036 000", "136 879"], callAmount: "4 250 980" },
  { id: 7, initials: "AR", name: "Alice Right", equalization: "100 000", flows: ["30 876", "300 876", "2 485"], callAmount: "4 789 000" },
];

export default function OperationStep2Filled({ onAddFlow }) {
  const handleAddFlow = onAddFlow || (() => {});

  return (
    <div className="op2f-root">
      <div className="op2f-table-wrapper">
        <table className="op2f-table">
          <colgroup>
            <col className="op2f-col-lp" />
            <col className="op2f-col-eq" />
            <col className="op2f-col-flow" />
            <col className="op2f-col-flow" />
            <col className="op2f-col-flow" />
            <col className="op2f-col-tot" />
          </colgroup>

          <thead>
            {/* ================= TOP DARK STRIP ================= */}
            <tr className="op2f-row-top">
              <th className="op2f-top op2f-top-lp" />
              <th className="op2f-top op2f-top-blue">EQUALIZATION</th>

              {/* ✅ CAPITAL CALL now a normal table cell with an inner flex wrapper */}
              <th className="op2f-top op2f-top-blue op2f-top-cap" colSpan={3}>
                <div className="op2f-top-cap-inner">
                  <span>CAPITAL CALL</span>
                  <button
                    type="button"
                    className="op2f-top-plus"
                    onClick={handleAddFlow}
                  >
                    +
                  </button>
                </div>
              </th>

              {/* ✅ TOTAUX is the header of the LAST column only */}
              <th className="op2f-top op2f-top-dark">TOTAUX</th>
            </tr>

            {/* ============= COLUMN HEADERS ============= */}
            <tr className="op2f-row-head">
              <th className="op2f-head op2f-head-lp">
                <div className="op2f-lp-header">
                  <span className="op2f-lp-label">LPs</span>
                  <span className="op2f-lp-currency">(€)</span>
                  <span className="op2f-lp-sort">⇅</span>
                </div>
              </th>

              <th className="op2f-head op2f-head-eq">
                <div className="op2f-eq-title-row">
                  <span className="op2f-eq-title">Equalization</span>
                  <button type="button" className="op2f-icon-btn">
                    ✎
                  </button>
                </div>
                <div className="op2f-eq-input-row">
                  <input className="op2f-input" value="Target..." readOnly />
                  <button
                    type="button"
                    className="op2f-icon-btn op2f-icon-square"
                  >
                    …
                  </button>
                </div>
              </th>

              {FLOW_COLUMNS.map((col) => (
                <th key={col.id} className="op2f-head op2f-head-flow">
                  <div className="op2f-flow-title-row">
                    <span className="op2f-flow-title">{col.title}</span>
                    <button type="button" className="op2f-icon-btn">
                      ✎
                    </button>
                  </div>
                  <span className="op2f-flow-sub">{col.subtitle}</span>
                </th>
              ))}

              <th className="op2f-head op2f-head-tot">
                <div className="op2f-tot-chip">
                  <span className="op2f-tot-title">Call Amount (€)</span>
                  <span className="op2f-tot-sort">⇅</span>
                </div>
              </th>
            </tr>
          </thead>

          <tbody>
            {SHARE_ROWS.map((row, index) => {
              const isAlt = index % 2 === 1;
              return (
                <tr
                  key={row.id}
                  className={`op2f-row-body ${isAlt ? "is-alt" : ""}`}
                >
                  <td className="op2f-cell op2f-cell-lp">
                    <div className="op2f-avatar">{row.initials}</div>
                    <span className="op2f-lp-name">{row.name}</span>
                  </td>

                  <td className="op2f-cell op2f-cell-eq">
                    {row.equalization}
                  </td>

                  {row.flows.map((val, i) => (
                    <td
                      key={`${row.id}-${i}`}
                      className="op2f-cell op2f-cell-flow"
                    >
                      {val}
                    </td>
                  ))}

                  <td className="op2f-cell op2f-cell-tot">
                    <span className="op2f-value-total">{row.callAmount}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>

          <tfoot>
            <tr className="op2f-row-footer">
              <td className="op2f-foot op2f-foot-label">Total</td>

              <td className="op2f-foot">
                <div className="op2f-foot-box">
                  <span>-</span>
                  <span>€</span>
                </div>
                <span className="op2f-foot-hint">= 0.00%</span>
              </td>

              <td className="op2f-foot">
                <div className="op2f-foot-box">
                  <span>2 198 078</span>
                  <span>€</span>
                </div>
                <span className="op2f-foot-hint">= 2.20%</span>
              </td>

              <td className="op2f-foot">
                <div className="op2f-foot-box">
                  <span>19 876 540</span>
                  <span>€</span>
                </div>
                <span className="op2f-foot-hint">= 19.88%</span>
              </td>

              <td className="op2f-foot">
                <div className="op2f-foot-box">
                  <span>754 021</span>
                  <span>€</span>
                </div>
                <span className="op2f-foot-hint">= 0.75%</span>
              </td>

              <td className="op2f-foot">
                <div className="op2f-foot-box">
                  <span>22 645 980</span>
                  <span>€</span>
                </div>
                <span className="op2f-foot-hint">= 22.64%</span>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
