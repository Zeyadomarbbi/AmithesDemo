import React, { useState, useRef, useEffect } from "react";
import ReactDOM from "react-dom";
import { PermissionGate } from "../../../../../../../../hooks/Auth/PermissionGate";
import DateInputWithPicker from "../../../../../../../../components/DateComponents/DateInput";
import { MoreActionsIcon, DeleteIcon, DuplicateIcon, AddFileIcon, AddCommentIcon } from "../../../../../../../../components/Icons/InteractiveIcons";
import { ChevronDownIcon } from "../../../../../../../../components/Icons/DirectionIcons";
import { PercentageIcon } from "../../../../../../../../components/Icons/NumericalIcons";
import { PlusIcon } from "../../../../icons";
import { useTableSort, SortableHeaderRenderer } from "../../../../../../../../components/Sort/TableSort";
import { useNumberFormatter, usePercentageFormatter } from "../../../../../../../../components/useFormatter.js";
import "./InvestmentDetails.css";

const FLOW_TYPES = ["Investment", "Dividend", "Interest", "Other", "Divestment", "Partial divestment"];

const BADGE_STYLES = {
  "Investment":         { background: "#fef3c7", color: "#b45309" },
  "Dividend":           { background: "#dcfce7", color: "#15803d" },
  "Dividends":          { background: "#dcfce7", color: "#15803d" },
  "Interest":           { background: "#e0f2fe", color: "#0369a1" },
  "Interests":          { background: "#e0f2fe", color: "#0369a1" },
  "Divestment":         { background: "#fee2e2", color: "#b91c1c" },
  "Other":              { background: "#ede9fe", color: "#6d28d9" },
  "Partial divestment": { background: "#ffe4e6", color: "#be123c" },
};

const isEmptyType = (value) =>
  !value || value === "" || value === "click";

const AmountEuroLabel = () => (
  <>Amount <span className="invHeaderCurrency">(€)</span></>
);

function TypeSelect({ value, options, onChange }) {
  const [open, setOpen] = useState(false);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0, width: 0 });
  const triggerRef = useRef(null);
  const dropdownRef = useRef(null);
  
  useEffect(() => {
    function handleClickOutside(e) {
      if (
        triggerRef.current && !triggerRef.current.contains(e.target) &&
        dropdownRef.current && !dropdownRef.current.contains(e.target)
      ) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!open) return;
    const handleScroll = () => setOpen(false);
    window.addEventListener("scroll", handleScroll, true);
    return () => window.removeEventListener("scroll", handleScroll, true);
  }, [open]);

  const handleOpen = () => {
    if (!open && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setDropdownPos({ top: rect.bottom + 4, left: rect.left, width: rect.width });
    }
    setOpen((v) => !v);
  };

  const isEmpty = isEmptyType(value);
  const style = BADGE_STYLES[value] || {};

  return (
    <div className="typeSelectWrapper">
      <button ref={triggerRef} className="typeSelectTrigger" onClick={handleOpen} type="button">
        <span
          className={`typeSelectBadge${isEmpty ? " typeSelectPlaceholder" : ""}`}
          style={isEmpty ? {} : { background: style.background, color: style.color }}
        >
          {isEmpty ? "Select a type" : value}
        </span>
        <span className="typeSelectChevron"><ChevronDownIcon /></span>
      </button>

      {open && ReactDOM.createPortal(
        <div
          ref={dropdownRef}
          className="typeSelectDropdown"
          style={{ position: "fixed", top: dropdownPos.top, left: dropdownPos.left, minWidth: dropdownPos.width }}
        >
          {options.map((t) => (
            <button
              key={t}
              className="typeSelectOption"
              onClick={() => { onChange(t); setOpen(false); }}
              type="button"
            >
              <span className="typeSelectBadge" style={{ background: "transparent", color: "#334155", padding: 0 }}>
                {t}
              </span>
            </button>
          ))}
        </div>,
        document.body
      )}
    </div>
  );
}

function KebabMenu({ onAddComment, onAddFile, onDuplicate, onDelete }) {
  const [open, setOpen] = useState(false);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 });
  const triggerRef = useRef(null);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (
        triggerRef.current && !triggerRef.current.contains(e.target) &&
        dropdownRef.current && !dropdownRef.current.contains(e.target)
      ) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!open) return;
    const handleScroll = () => setOpen(false);
    window.addEventListener("scroll", handleScroll, true);
    return () => window.removeEventListener("scroll", handleScroll, true);
  }, [open]);

  const handleOpen = () => {
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
        type="button"
        className="kebabBtn"
        onClick={(event) => { event.stopPropagation(); handleOpen(); }}
      >
        <MoreActionsIcon />
      </button>
      {open && ReactDOM.createPortal(
        <div
          ref={dropdownRef}
          className="kebabDropdown"
          style={{ position: "fixed", top: dropdownPos.top, left: dropdownPos.left }}
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
        >
          <button type="button" className="kebabItem" onClick={() => { onAddComment(); setOpen(false); }}>
            <AddCommentIcon /> Add comment
          </button>
          <button type="button" className="kebabItem" onClick={() => { onAddFile(); setOpen(false); }}>
            <AddFileIcon />
            <span className="kebabItemRow">Add file <span className="kebabItemClose"></span></span>
          </button>
          <button type="button" className="kebabItem" onClick={() => { onDuplicate(); setOpen(false); }}>
            <DuplicateIcon /> Duplicate
          </button>
          <div className="kebabDivider" />
          <button type="button" className="kebabItem kebabItemDelete" onClick={() => { onDelete(); setOpen(false); }}>
            <DeleteIcon /> Delete
          </button>
        </div>,
        document.body
      )}
    </div>
  );
}

export default function InvestmentFlowsTable({ flows, onUpdate, onDelete, onAdd, flowTypes = [] }) {
  const types = flowTypes.length > 0 ? flowTypes : FLOW_TYPES;
  const noScroll = (e) => e.target.blur();
  const { sorted, sortKey, toggleSort } = useTableSort(flows ?? [], null);
  const formatNumber  = useNumberFormatter();
  const formatPercent = usePercentageFormatter();
  const handleDuplicate = (f) => {
    onAdd({ ...f, id: null, flowId: null });
  };

  return (
    <>
      <div className="invTableContainer">
        <div className="invTableScroll">
          <table className="invTable">
            <thead>
              <tr>
                <th className="invThFlow">
                  <SortableHeaderRenderer label="Flow" columnKey="id" currentSortKey={sortKey} toggleSort={toggleSort} center={false} showCurrency={false} />
                </th>
                <th className="invThDate">
                  <SortableHeaderRenderer label="Date" columnKey="date" currentSortKey={sortKey} toggleSort={toggleSort} center={false} showCurrency={false} />
                </th>
                <th className="invThAmountEuro invNum">
                  <SortableHeaderRenderer label={<AmountEuroLabel />} columnKey="amountEuro" currentSortKey={sortKey} toggleSort={toggleSort} center={false} showCurrency={false} />
                </th>
                <th className="invThFxRate invNum">
                  <SortableHeaderRenderer label="FX Rate" columnKey="fxRate" currentSortKey={sortKey} toggleSort={toggleSort} center={false} showCurrency={false} />
                </th>
                <th className="invThAmountLC invNum">
                  <SortableHeaderRenderer label="Amount LC" columnKey="amountLC" currentSortKey={sortKey} toggleSort={toggleSort} center={false} showCurrency={false} />
                </th>
                <th className="invThType">
                  <SortableHeaderRenderer label="Type" columnKey="type" currentSortKey={sortKey} toggleSort={toggleSort} center={false} showCurrency={false} />
                </th>
                <PermissionGate>
                  <th className="invThActions">Actions</th>
                </PermissionGate>
              </tr>
            </thead>
            <tbody>
              {sorted.map((f, index) => {
                const amountLCVal = parseFloat(String(f.amountLC)) || 0;
                const fxVal       = parseFloat(String(f.fxRate))   || 0;
                const amountEuro  = fxVal ? amountLCVal / fxVal : 0;
                const isPartialDivestment = String(f.type).toLowerCase() === "partial divestment";

                return (
                  <tr key={f.id}>
                    <td className="invTdFlow">#{index + 1}</td>

                    <td className="invTdDate">
                      <div className="invInputWrapper">
                        <DateInputWithPicker
                          isSingle={true}
                          initialDate={f.date ? new Date(f.date) : null}
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
                      <div className="invInputWrapper">
                        <input
                          type="text"
                          readOnly
                          className="invTableInput invNum readOnlyInput"
                          value={amountEuro ? formatNumber(amountEuro) : ""}
                        />
                      </div>
                    </td>

                    {/* FX Rate — raw input */}
                    <td className="invTdFxRate">
                      <div className="invInputWrapper">
                        <input
                          type="number"
                          step="any"
                          className="invTableInput invNum"
                          value={f.fxRate === 0 || f.fxRate === "0" ? "" : f.fxRate ?? ""}
                          placeholder="0"
                          onChange={(e) => onUpdate(f.id, "fxRate", e.target.value)}
                          onWheel={noScroll}
                        />
                      </div>
                    </td>

                    {/* Amount LC — raw input */}
                    <td className="invTdAmountLC">
                      <div className="invInputWrapper">
                        <input
                          type="number"
                          step="any"
                          className="invTableInput invNum"
                          value={f.amountLC === 0 || f.amountLC === "0" ? "" : f.amountLC ?? ""}
                          placeholder="0"
                          onChange={(e) => onUpdate(f.id, "amountLC", e.target.value)}
                          onWheel={noScroll}
                        />
                      </div>
                    </td>

                    <td className="invTdType">
                      <TypeSelect
                        value={f.type}
                        options={types}
                        onChange={(val) => onUpdate(f.id, "type", val)}
                      />
                      {isPartialDivestment && (
                        <div className="invInputWrapper invPartialInput">
                          <input
                            type="number"
                            step="any"
                            className="invTableInput"
                            value={
                              f.divestmentPercentage === null ||
                              f.divestmentPercentage === undefined ||
                              f.divestmentPercentage === ""
                                ? ""
                                : f.divestmentPercentage
                            }
                            onChange={(e) => onUpdate(f.id, "divestmentPercentage", e.target.value)}
                            min="0"
                            max="100"
                            placeholder="0 - 100"
                            onWheel={noScroll}
                          />
                          <PercentageIcon />
                        </div>
                      )}
                    </td>

                    <td className="invTdActions">
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
        </div>
      </div>

      <PermissionGate>
        <button className="invAddFlowBtn" onClick={onAdd}>
          <span className="invAddFlowIcon"><PlusIcon /></span>
          <span className="invAddFlowText">New Flow</span>
        </button>
      </PermissionGate>
    </>
  );
}