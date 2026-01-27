import React from "react";
import "./InvestmentDetails.css";

const FLOW_TYPES = ["Investment", "Dividend", "Interest", "Other", "Divestment"];

// Helper to format numbers nicely (French style spaces)
const formatNum = (v) => {
  if (v === "" || v === undefined) return "";
  const n = Number(v);
  if (isNaN(n)) return v;
  return n.toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 2 }).replace(/,/g, ' ');
};

// Icons Components
const CommentIcon = () => (
  <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M14 1a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H4.414A2 2 0 0 0 3 11.586l-2 2V2a1 1 0 0 1 1-1h12zM2 0a2 2 0 0 0-2 2v12.793a.5.5 0 0 0 .854.353l2.853-2.853A1 1 0 0 1 4.414 12H14a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2H2z"/></svg>
);
const FileIcon = () => (
   <svg width="14" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M4 0h5.293A1 1 0 0 1 10 .293L13.707 4a1 1 0 0 1 .293.707V14a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V2a2 2 0 0 1 2-2zm5.5 1.5v2a1 1 0 0 0 1 1h2l-3-3z"/></svg>
);
const MenuIcon = () => (
  <div style={{fontWeight: 'bold', fontSize: '18px', paddingBottom:'6px'}}>⋮</div>
);

export default function InvestmentFlowsTable({ flows, onUpdate, onDelete, onAdd }) {
  
  return (
    <div className="invTableContainer">
      <table className="invTable">
        <thead>
          <tr>
            <th>Flow <span className="invSortIcon">⬍</span></th>
            <th>Date <span className="invSortIcon">⬍</span></th>
            <th className="invNum">Amount (€) <span className="invSortIcon">⬍</span></th>
            <th className="invNum">FX Rate <span className="invSortIcon">⬍</span></th>
            <th className="invNum">Amount LC <span className="invSortIcon">⬍</span></th>
            <th>Type <span className="invSortIcon">⬍</span></th>
            <th style={{ textAlign: 'right', paddingRight: '12px' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {flows.map((f, index) => {
            // Live Calculation per row
            const amountVal = parseFloat(String(f.amount).replace(/[^0-9.-]/g, "")) || 0;
            const fxVal = parseFloat(String(f.fxRate).replace(/[^0-9.-]/g, "")) || 0;
            const calculatedLC = amountVal * fxVal;

            return (
              <tr key={f.id}>
                {/* ID */}
                <td style={{ color: '#0f172a', fontWeight: '600' }}>#{index + 1}</td>

                {/* Date */}
                <td style={{ width: '130px' }}>
                  <div className="invInputWrapper">
                    <input
                      type="date"
                      className="invTableInput"
                      value={f.date}
                      onChange={(e) => onUpdate(f.id, "date", e.target.value)}
                    />
                     <span className="invCheckIcon">✓</span>
                  </div>
                </td>

                {/* Amount (Editable) */}
                <td>
                  <div className="invInputWrapper">
                    <input
                      type="number"
                      className="invTableInput invNum"
                      value={f.amount}
                      onChange={(e) => onUpdate(f.id, "amount", e.target.value)}
                    />
                    <span className="invCheckIcon">✓</span>
                  </div>
                </td>

                {/* FX Rate (Editable) */}
                <td style={{ width: '100px' }}>
                   <div className="invInputWrapper">
                    <input
                      type="number"
                      step="0.01"
                      className="invTableInput invNum"
                      value={f.fxRate}
                      onChange={(e) => onUpdate(f.id, "fxRate", e.target.value)}
                    />
                    <span className="invCheckIcon">✓</span>
                  </div>
                </td>

                {/* Amount LC (Calculated & ReadOnly) */}
                <td>
                   <div className="invInputWrapper">
                    <input
                      type="text"
                      readOnly
                      className="invTableInput invNum"
                      // Display Calculated Value with "LC" suffix
                      value={calculatedLC ? `${formatNum(calculatedLC)} LC` : ""}
                    />
                    <span className="invCheckIcon">✓</span>
                  </div>
                </td>

                {/* Type Badge Dropdown */}
                <td style={{ width: '140px' }}>
                  <select
                    className={`invBadgeSelect badge-${f.type}`}
                    value={f.type}
                    onChange={(e) => onUpdate(f.id, "type", e.target.value)}
                  >
                    {FLOW_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </td>

                {/* Actions */}
                <td>
                  <div className="invActionsCell">
                    
                    
                    <button 
                      className="invRowActionBtn invIconGrey" 
                      title="Delete"
                      onClick={() => onDelete(f.id)}
                    >
                       <MenuIcon />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <button className="invAddFlowBtn" onClick={onAdd}>
        + New Flow
      </button>
    </div>
  );
}