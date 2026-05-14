import React, { useState } from "react";
import { TimeframeProvider, useTimeframeContext } from "/src/pages/App/hooks/Core/TimeframeContext";
import TimeframeSelector from "/src/components/QuarterSelection/TimeframeSelector.jsx";
import { useActiveFund } from "/src/pages/App/hooks/useActiveFund.js";
import { ShareIcon, DownloadIcon, PlusIcon } from "/src/components/Icons/InteractiveIcons";
import "./KPIsTab.css";

const FINANCIALS_ROWS = ["Sales", "COGS", "Gross margin", "Opex", "EBITDA", "Other"];
const VALUATION_ROWS  = ["EBITDA", "Multiple", "EV", "Net Debt", "EqV", "Other"];

const MOCK_VALUE = "500 000";
const TOTAL_VALUE = "600 000";

function DragHandle() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ opacity: 0.35, flexShrink: 0 }}>
      <circle cx="4" cy="2.5" r="1.2" fill="#374151" />
      <circle cx="4" cy="7"   r="1.2" fill="#374151" />
      <circle cx="4" cy="11.5" r="1.2" fill="#374151" />
      <circle cx="10" cy="2.5" r="1.2" fill="#374151" />
      <circle cx="10" cy="7"   r="1.2" fill="#374151" />
      <circle cx="10" cy="11.5" r="1.2" fill="#374151" />
    </svg>
  );
}

function KPISection({ title, rows, selected, onToggle }) {
  const { quarters } = useTimeframeContext();

  const activeQuarters = quarters.filter((q) => selected.includes(q.id));
  const columns = activeQuarters.length > 0
    ? activeQuarters.map((q) => ({ id: `q-${q.id}`, label: q.display_label }))
    : [
        { id: "fy-2024", label: "FY 2024 (€)" },
        { id: "fy-2025", label: "FY 2025 (€)" },
        { id: "fy-2026", label: "FY 2026 (€)" },
        { id: "fy-2027", label: "FY 2027 (€)" },
      ];

  return (
    <div className="kpi-section">
      <div className="kpi-section-title"><span>{title}</span></div>

      {/* Toolbar */}
      <div className="kpi-toolbar">
        <TimeframeSelector
          selected={selected}
          onChange={onToggle}
          isSingle={false}
          maxSelections={6}
        />
        <div className="kpi-toolbar-right">
          <button className="kpi-btn-outline"><ShareIcon /> Upload</button>
          <button className="kpi-btn-outline"><DownloadIcon /> Download</button>
          <button className="kpi-btn-primary"><PlusIcon /> New KPI</button>
        </div>
      </div>

      {/* Table */}
      <div className="kpi-table-container">
        <table className="kpi-table">
          <thead>
            <tr>
              <th className="kpi-th kpi-th--handle" />
              <th className="kpi-th kpi-th--label" />
              {columns.map((col) => (
                <th key={col.id} className="kpi-th kpi-th--value">{col.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row} className="kpi-row">
                <td className="kpi-td kpi-td--handle"><DragHandle /></td>
                <td className="kpi-td kpi-td--label">{row}</td>
                {columns.map((col) => (
                  <td key={col.id} className="kpi-td kpi-td--value">{MOCK_VALUE}</td>
                ))}
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="kpi-total-row">
              <td />
              <td className="kpi-total-label">Net Profit</td>
              {columns.map((col, i) => (
                <td key={col.id} className="kpi-total-value">
                  {i === columns.length - 1 ? "-" : TOTAL_VALUE}
                </td>
              ))}
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

function KPIsTabInner() {
  const [selected, setSelected] = useState([]);
  const handleToggle = (id) =>
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  return (
    <div className="kpi-wrapper">
      <KPISection title="Financials" rows={FINANCIALS_ROWS} selected={selected} onToggle={handleToggle} />
      <KPISection title="Valuation"  rows={VALUATION_ROWS}  selected={selected} onToggle={handleToggle} />
    </div>
  );
}

export default function KPIsTab() {
  const fundId = useActiveFund();
  return (
    <TimeframeProvider fundId={fundId}>
      <KPIsTabInner />
    </TimeframeProvider>
  );
}
