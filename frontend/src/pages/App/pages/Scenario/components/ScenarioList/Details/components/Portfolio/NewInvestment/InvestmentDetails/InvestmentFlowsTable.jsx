import React, { useState, useRef, useEffect } from "react";
import ReactDOM from "react-dom";
import DateInputWithPicker from "../../../../../../../../../../../components/DateComponents/DateInput";
import { PlusIcon, TrashIcon, MoreActionsIcon, DeleteIcon, DuplicateIcon } from '/src/components/Icons/InteractiveIcons';
import { ChevronDownIcon } from "/src/components/Icons/DirectionIcons";
import { PercentageIcon } from "/src/components/Icons/NumericalIcons";
import { SortableHeaderRenderer, useTableSort } from "../../../../../../../../../../..//components/Sort/TableSort";
import { useNumberFormatter } from '../../../../../../../../../../../components/useFormatter';
import "/src/pages/App/pages/Portfolio/components/Summary/components/InvestmentDetails/InvestmentDetails.css"

const FLOW_TYPES = ["Investment", "Dividend", "Interest", "Other", "Divestment", "Partial divestment"];

const BADGE_STYLES = {
  "Investment": { background: "#fef3c7", color: "#b45309" },
  "Dividend": { background: "#dcfce7", color: "#15803d" },
  "Interest": { background: "#e0f2fe", color: "#0369a1" },
  "Divestment": { background: "#fee2e2", color: "#b91c1c" },
  "Other": { background: "#ede9fe", color: "#6d28d9" },
  "Partial divestment": { background: "#ffe4e6", color: "#be123c" },
};

// --- Sub-components (TypeSelect & KebabMenu) ---

function TypeSelect({ value, options, onChange, disabled }) {
  const [open, setOpen] = useState(false);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0, width: 0 });
  const triggerRef = useRef(null);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (triggerRef.current && !triggerRef.current.contains(e.target) &&
          dropdownRef.current && !dropdownRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleOpen = () => {
    if (disabled) return;
    if (!open && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setDropdownPos({ top: rect.bottom + 4, left: rect.left, width: rect.width });
    }
    setOpen((v) => !v);
  };

  const style = BADGE_STYLES[value] || {};

  return (
    <div className="typeSelectWrapper">
      <button 
        ref={triggerRef} 
        className="typeSelectTrigger" 
        onClick={handleOpen} 
        type="button"
        disabled={disabled}
        style={disabled ? { opacity: 0.5, cursor: "not-allowed" } : {}}
        title={disabled ? "Cannot edit master record" : ""}
      >
        <span className="typeSelectBadge" style={{ background: style.background, color: style.color }}>
          {value || "Select a type"}
        </span>
        <span className="typeSelectChevron"><ChevronDownIcon /></span>
      </button>
      {open && !disabled && ReactDOM.createPortal(
        <div className="typeSelectDropdown" style={{ position: "fixed", top: dropdownPos.top, left: dropdownPos.left, minWidth: dropdownPos.width }}>
          {options.map((t) => (
            <button key={t} className="typeSelectOption" onClick={() => { onChange(t); setOpen(false); }}>
              {t}
            </button>
          ))}
        </div>,
        document.body
      )}
    </div>
  );
}

function KebabMenu({ onDuplicate, onDelete, isScenarioCreated }) {
  const [open, setOpen] = useState(false);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 });
  const triggerRef = useRef(null);
  const dropdownRef = useRef(null);

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (
        triggerRef.current && !triggerRef.current.contains(e.target) &&
        dropdownRef.current && !dropdownRef.current.contains(e.target)
      ) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  // Close on scroll to prevent the portal from floating away
  useEffect(() => {
    if (!open) return;
    const handleScroll = () => setOpen(false);
    window.addEventListener("scroll", handleScroll, true);
    return () => window.removeEventListener("scroll", handleScroll, true);
  }, [open]);

  const handleOpen = (e) => {
    e.stopPropagation(); // Prevents event bubbling
    if (!open && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setDropdownPos({ top: rect.bottom + 4, left: rect.right - 180 });
    }
    setOpen((v) => !v);
  };

  return (
    <div className="kebabWrapper">
      <button 
        ref={triggerRef} 
        className="kebabBtn" 
        onClick={handleOpen} 
        type="button"
      >
        <MoreActionsIcon />
      </button>
      {open && ReactDOM.createPortal(
        <div 
          className="kebabDropdown" 
          ref={dropdownRef}
          style={{ position: "fixed", top: dropdownPos.top, left: dropdownPos.left }}
          onClick={(e) => e.stopPropagation()} // Keeps menu open when clicking inside
        >
          <button className="kebabItem" onClick={() => { onDuplicate(); setOpen(false); }} type="button">
            <DuplicateIcon /> Duplicate
          </button>
          
          <div className="kebabDivider" />
          
          <button 
            className="kebabItem kebabItemDelete" 
            onClick={() => { onDelete(); setOpen(false); }} 
            type="button"
            disabled={!isScenarioCreated}
            title={!isScenarioCreated ? "Cannot delete master record from scenario mode" : "Delete"}
            style={!isScenarioCreated ? { opacity: 0.5, cursor: "not-allowed" } : {}}
          >
            <DeleteIcon /> Delete
          </button>
        </div>,
        document.body
      )}
    </div>
  );
}
// --- Main Table Component ---

export default function InvestmentFlowsTable({ flows, onUpdate, onDelete, onAdd, flowTypes }) {
  const formatNumber = useNumberFormatter();
  const types = flowTypes?.length > 0 ? flowTypes : FLOW_TYPES;
  const noScroll = (e) => e.target.blur();
  const { sorted, sortKey, toggleSort } = useTableSort(flows ?? [], null);
  console.log("flows", flows)
  return (
    <div className="invTableContainer">
      <div className="invTableScroll">
        <table className="invTable">
          <thead>
            <tr>
              <th className="invThFlow">
                <SortableHeaderRenderer label="Flow" columnKey="id" currentSortKey={sortKey} toggleSort={toggleSort} />
              </th>
              <th className="invThDate">
                <SortableHeaderRenderer label="Date" columnKey="date" currentSortKey={sortKey} toggleSort={toggleSort} />
              </th>
              <th className="invThAmountEuro invNum">
                <SortableHeaderRenderer label={<>Amount <span className="invHeaderCurrency">(€)</span></>} columnKey="amountEuro" currentSortKey={sortKey} toggleSort={toggleSort} />
              </th>
              <th className="invThFxRate invNum">
                <SortableHeaderRenderer label="FX Rate" columnKey="fxRate" currentSortKey={sortKey} toggleSort={toggleSort} />
              </th>
              <th className="invThAmountLC invNum">
                <SortableHeaderRenderer label="Amount LC" columnKey="amountLC" currentSortKey={sortKey} toggleSort={toggleSort} />
              </th>
              <th className="invThType">
                <SortableHeaderRenderer label="Type" columnKey="type" currentSortKey={sortKey} toggleSort={toggleSort} />
              </th>
              <th className="invThActions">Actions</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((f, index) => {
              const amountLCVal = parseFloat(String(f.amountLC).replace(/[^0-9.-]/g, "")) || 0;
              const fxVal = parseFloat(String(f.fxRate).replace(/[^0-9.-]/g, "")) || 0;
              const amountEuro = fxVal ? amountLCVal / fxVal : 0;
              const isPartialDivestment = String(f.type).toLowerCase() === "partial divestment";
              const isMasterRecord = !f.isScenarioCreated;
              const disabledStyles = isMasterRecord ? { opacity: 0.5, cursor: "not-allowed" } : {};
              return (
                <tr key={f.id}>
                  <td className="invTdFlow">#{index + 1}</td>
                  
                  {/* Applied DateInputWithPicker logic */}
                  <td className="invTdDate">
                    <div className="invInputWrapper">
                      <DateInputWithPicker
                        isSingle={true}
                        initialDate={f.date ? new Date(f.date) : null}
                        disabled={isMasterRecord}
                        onDateChange={(date) => {
                          const y = date.getFullYear();
                          const m = String(date.getMonth() + 1).padStart(2, "0");
                          const d = String(date.getDate()).padStart(2, "0");
                          onUpdate(f.id, "date", `${y}-${m}-${d}`);
                        }}
                      />
                    </div>
                  </td>

                  <td className="invTdAmountEuro">
                    <input 
                      type="text" 
                      readOnly 
                      className="invTableInput invNum readOnlyInput" 
                      value={amountEuro ? formatNumber(amountEuro) : ""} 
                      
                    />
                  </td>

                  <td className="invTdFxRate">
                    <input 
                      type="number" 
                      step="any" 
                      className="invTableInput invNum" 
                      value={f.fxRate === 0 || f.fxRate === "0" ? "" : f.fxRate ?? ""} 
                      placeholder="0"
                      onChange={(e) => onUpdate(f.id, "fxRate", e.target.value)} 
                      onWheel={noScroll}
                      disabled={isMasterRecord}
                      style={disabledStyles}
                    />
                  </td>

                  <td className="invTdAmountLC">
                    <input 
                      type="number" 
                      step="any" 
                      className="invTableInput invNum" 
                      value={f.amountLC === 0 || f.amountLC === "0" ? "" : f.amountLC ?? ""} 
                      placeholder="0"
                      onChange={(e) => onUpdate(f.id, "amountLC", e.target.value)} 
                      onWheel={noScroll}
                      disabled={isMasterRecord}
                      style={disabledStyles}
                    />
                  </td>

                  <td className="invTdType">
                    <TypeSelect 
                      value={f.type} 
                      options={types} 
                      onChange={(val) => onUpdate(f.id, "type", val)} 
                      disabled={isMasterRecord}
                    />
                    {isPartialDivestment && (
                      <div className="invInputWrapper invPartialInput">
                        <input
                          type="number"
                          step="any"
                          className="invTableInput"
                          value={f.divestmentPercentage ?? ""}
                          onChange={(e) => onUpdate(f.id, "divestmentPercentage", e.target.value)}
                          placeholder="0 - 100"
                          onWheel={noScroll}
                          disabled={isMasterRecord}
                          style={disabledStyles}
                        />
                        <PercentageIcon />
                      </div>
                    )}
                  </td>

                  <td className="invTdActions">
                    <KebabMenu 
                      onDuplicate={() => onAdd({ ...f, id: null, flowId: null })} 
                      onDelete={() => onDelete(f.id)} 
                      isScenarioCreated={f.isScenarioCreated}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <button className="invAddFlowBtn" onClick={onAdd}>
        <span className="invAddFlowIcon"><PlusIcon /></span>
        <span className="invAddFlowText">New Flow</span>
      </button>
    </div>
  );
}