import React, { useState, useRef, useEffect } from "react"; 
import "./InvestmentDetails.css";
import { PermissionGate } from "../../../../../../../../hooks/Auth/PermissionGate";
import DatePicker from "../../../../../../../../components/DateComponents/DatePicker";
import { MoreActionsIcon, DeleteIcon, DuplicateIcon, AddFileIcon, AddCommentIcon } from "../../../../../../../../components/Icons/InteractiveIcons";
import { ChevronDownIcon } from "../../../../../../../../components/Icons/DirectionIcons";
import { SortIcon, PlusIcon } from "../../../../icons";

const FLOW_TYPES = ["Investment", "Dividend", "Interest", "Other", "Divestment"];

const BADGE_STYLES = {
  "Investment":        { background: "#fef3c7", color: "#b45309" },
  "Dividend":          { background: "#dcfce7", color: "#15803d" },
  "Dividends":         { background: "#dcfce7", color: "#15803d" },
  "Interest":          { background: "#e0f2fe", color: "#0369a1" },
  "Interests":         { background: "#e0f2fe", color: "#0369a1" },
  "Divestment":        { background: "#fee2e2", color: "#b91c1c" },
  "Other":             { background: "#ede9fe", color: "#6d28d9" },
  "Partial divestment":{ background: "#ffe4e6", color: "#be123c" },
};

function TypeSelect({ value, options, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const style = BADGE_STYLES[value] || { background: "#f1f5f9", color: "#334155" };

  return (
    <div className="typeSelectWrapper" ref={ref}>
      <button
        className="typeSelectTrigger"
        onClick={() => setOpen((v) => !v)}
        type="button"
      >
        <span className="typeSelectBadge" style={{ background: style.background, color: style.color }}>
          {value}
        </span>
        <span className="typeSelectChevron"><ChevronDownIcon /></span>
      </button>
      {open && (
        <div className="typeSelectDropdown">
          {options.map((t) => {
            const s = BADGE_STYLES[t] || { background: "#f1f5f9", color: "#334155" };
            return (
              <button
                key={t}
                className="typeSelectOption"
                onClick={() => { onChange(t); setOpen(false); }}
                type="button"
              >
                <span className="typeSelectBadge" style={{ background: s.background, color: s.color }}>
                  {t}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

const formatNum = (v) => {
  if (v === "" || v === undefined) return "";
  const n = Number(v);
  if (isNaN(n)) return v;
  return n.toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
};

const formatDateForDisplay = (dateString) => {
  if (!dateString) return "";
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return dateString;
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = String(d.getFullYear()).slice(2);
  return `${day}/${month}/${year}`;
};

function KebabMenu({ onAddComment, onAddFile, onDuplicate, onDelete }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="kebabWrapper" ref={ref}>
      <button className="kebabBtn" onClick={() => setOpen((v) => !v)}>
        <MoreActionsIcon />
      </button>
      {open && (
        <div className="kebabDropdown">
          <button className="kebabItem" onClick={() => { onAddComment(); setOpen(false); }}>
            <AddCommentIcon /> Add comment
          </button>
          <button className="kebabItem" onClick={() => { onAddFile(); setOpen(false); }}>
            <AddFileIcon />
            <span className="kebabItemRow">
              Add file <span className="kebabItemClose"></span>
            </span>
          </button>
          <button className="kebabItem" onClick={() => { onDuplicate(); setOpen(false); }}>
            <DuplicateIcon /> Duplicate
          </button>
          <div className="kebabDivider" />
          <button className="kebabItem kebabItemDelete" onClick={() => { onDelete(); setOpen(false); }}>
            <DeleteIcon /> Delete
          </button>
        </div>
      )}
    </div>
  );
}

export default function InvestmentFlowsTable({ flows, onUpdate, onDelete, onAdd, flowTypes }) {
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
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [wrapperRef]);

  const handleDuplicate = (f) => {
    onAdd({ ...f, id: null, flowId: null });
  };

  return (
    <div className="invTableContainer">
      <table className="invTable">
        <thead>
          <tr>
            <th>Flow <span className="invSortIcon"><SortIcon/></span></th>
            <th>Date <span className="invSortIcon"><SortIcon/></span></th>
            <th className="invNum">Amount (€) <span className="invSortIcon"><SortIcon/></span></th>
            <th className="invNum">FX Rate <span className="invSortIcon"><SortIcon/></span></th>
            <th className="invNum">Amount LC <span className="invSortIcon"><SortIcon/></span></th>
            <th>Type <span className="invSortIcon"><SortIcon/></span></th>
            {hasPartialDivestment && <th className="invNum">Divestment %</th>}
            <PermissionGate>
              <th style={{ textAlign: 'right', paddingRight: '12px' }}>Actions</th>
            </PermissionGate>
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
                          position: 'absolute', top: '100%', left: '0',
                          zIndex: 1000, boxShadow: '0 4px 15px rgba(0,0,0,0.15)',
                          background: 'white', borderRadius: '8px', marginTop: '4px'
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
                      value={amountEuro ? `${formatNum(amountEuro)}` : ""}
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
                  <TypeSelect
                    value={f.type}
                    options={types}
                    onChange={(val) => onUpdate(f.id, "type", val)}
                  />
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
                          min="0" max="9.9999" step="0.0001"
                          placeholder="0 - 9.9999"
                        />
                      </div>
                    ) : (
                      <div className="invEmptyCell" />
                    )}
                  </td>
                )}

                <td style={{ overflow: 'visible' }}>
                  <PermissionGate>
                    <div className="invActionsCell">
                      <KebabMenu
                        onAddComment={() => {}}
                        onAddFile={() => {}}
                        onDuplicate={() => handleDuplicate(f)}
                        onDelete={() => onDelete(f.id)}
                      />
                    </div>
                  </PermissionGate>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <PermissionGate>
        <button className="invAddFlowBtn" onClick={onAdd}>
          <span className="invAddFlowIcon"><PlusIcon /></span>
          <span className="invAddFlowText">New Flow</span>
        </button>
      </PermissionGate>
    </div>
  );
}