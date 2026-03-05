import React, { useState, useRef, useEffect } from "react"; 
import DatePicker from "../../../../../../../../../../../components/DateComponents/DatePicker";
import { SortIcon, PlusIcon, TrashIcon } from '/src/components/Icons/InteractiveIcons';
import { useNumberFormatter } from '../../../../../../../../../../../components/useFormatter';
import "./InvestmentDetails.css";

const FLOW_TYPES = ["Investment", "Dividend", "Interest", "Other", "Divestment"];

const formatDateForDisplay = (dateString) => {
    if (!dateString) return "";
    return dateString; 
};

export default function InvestmentFlowsTable({ flows, onUpdate, onDelete, onAdd, flowTypes }) {
  const formatNumber = useNumberFormatter();
  const types = flowTypes && flowTypes.length > 0 ? flowTypes : FLOW_TYPES;
  const [activePickerId, setActivePickerId] = useState(null);
  const hasPartialDivestment = flows.some(
    (f) => String(f.type).toLowerCase() === "partial divestment"
  );

  const wrapperRef = useRef(null);
  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setActivePickerId(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [wrapperRef]);

  return (
    <div className="invTableContainer">
      <table className="invTable">
        <thead>
          <tr>
            <th>Flow <span className="invSortIcon"><SortIcon/></span></th>
            <th>Date <span className="invSortIcon"><SortIcon/></span></th>
            <th className="invNum">Amount <span className="invSortIcon"><SortIcon/></span></th>
            <th className="invNum">FX Rate <span className="invSortIcon"><SortIcon/></span></th>
            <th className="invNum">Amount LC* <span className="invSortIcon"><SortIcon/></span></th>
            <th>Type <span className="invSortIcon"><SortIcon/></span></th>
            {hasPartialDivestment && <th className="invNum">Divestment %</th>}
            <th style={{ textAlign: 'right', paddingRight: '12px' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {flows.map((f, index) => {
            const amountLCVal = parseFloat(String(f.amountLC).replace(/[^0-9.-]/g, "")) || 0;
            const fxVal = parseFloat(String(f.fxRate).replace(/[^0-9.-]/g, "")) || 0;
            const amountEuro = fxVal ? amountLCVal / fxVal : 0;
            const isPickerOpen = activePickerId === f.id;

            return (
              <tr key={f.id}>
                <td style={{ color: '#64748b', fontWeight: '400' }}>#{index + 1}</td>

                <td style={{ overflow: 'visible' }}>
                  <div className="invInputWrapper" style={{ position: 'relative' }} ref={isPickerOpen ? wrapperRef : null}>
                    <input
                        type="text"
                        className="invTableInput"
                        placeholder="Select date"
                        value={formatDateForDisplay(f.date)}
                        onClick={() => setActivePickerId(f.id)}
                        readOnly
                    />

                    {isPickerOpen && (
                        <DatePicker
                            isSingle={true}
                            initialStartDate={f.date ? new Date(f.date) : new Date()}
                            onClose={() => setActivePickerId(null)}
                            onApply={(data) => {
                                if (data.start) {
                                    const dateObj = data.start;
                                    const y = dateObj.getFullYear();
                                    const m = String(dateObj.getMonth() + 1).padStart(2, '0');
                                    const d = String(dateObj.getDate()).padStart(2, '0');
                                    onUpdate(f.id, "date", `${y}-${m}-${d}`);
                                }
                                setActivePickerId(null);
                            }}
                            style={{
                                position: 'absolute',
                                top: '100%',
                                left: '0',
                                zIndex: 1000,
                                boxShadow: '0 4px 15px rgba(0,0,0,0.15)',
                                background: 'white',
                                borderRadius: '8px',
                                marginTop: '4px'
                            }}
                        />
                    )}
                  </div>
                </td>
         
                <td>
                  <div className="invInputWrapper">
                    <input
                      type="text"
                      readOnly
                      className="invTableInput invNum readOnlyInput"
                      value={amountEuro ? formatNumber(amountEuro) : ""}
                    />
                  </div>
                </td>

                <td style={{ width: '100px' }}>
                    <div className="invInputWrapper">
                     <input
                      type="number"
                      step="0.01"
                      className="invTableInput invNum"
                      value={f.fxRate}
                      onChange={(e) => onUpdate(f.id, "fxRate", e.target.value)}
                    />
                  </div>
                </td>

                <td>
                    <div className="invInputWrapper">
                     <input
                      type="number"
                      className="invTableInput invNum"
                      value={f.amountLC}
                      onChange={(e) => onUpdate(f.id, "amountLC", e.target.value)}
                    />
                  </div>
                </td>

                <td style={{ width: '140px' }}>
                  <select
                    className={`invBadgeSelect badge-${String(f.type).replace(/\\s+/g, "-")}`}
                    value={f.type}
                    onChange={(e) => onUpdate(f.id, "type", e.target.value)}
                  >
                    {types.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </td>

                {hasPartialDivestment && (
                  <td style={{ width: '140px' }}>
                    {String(f.type).toLowerCase() === "partial divestment" ? (
                      <div className="invInputWrapper">
                        <input
                          type="number"
                          className="invTableInput invNum"
                          value={f.divestmentPercentage ?? ""}
                          onChange={(e) => onUpdate(f.id, "divestmentPercentage", e.target.value)}
                          min="0"
                          max="9.9999"
                          step="0.0001"
                          placeholder="0 - 9.9999"
                        />
                      </div>
                    ) : (
                      <div className="invEmptyCell" />
                    )}
                  </td>
                )}
                <td>
                  <div className="invActionsCell">
                    <button className="invRowActionBtn invIconGrey" onClick={() => onDelete(f.id)}>
                        <TrashIcon />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <button className="invAddFlowBtn" onClick={onAdd}>
        <span className="invAddFlowIcon"><PlusIcon /></span>
        <span className="invAddFlowText">New Flow</span>
      </button>
    </div>
  );
}