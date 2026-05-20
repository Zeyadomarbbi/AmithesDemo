import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import DateInputWithPicker from "../../../../../../../../../../../components/DateComponents/DateInput";
import {
  PlusIcon,
  MoreActionsIcon,
  DeleteIcon,
  DuplicateIcon,
  EditIcon,
  CloseIcon,
} from "/src/components/Icons/InteractiveIcons";
import { ChevronDownIcon } from "/src/components/Icons/DirectionIcons";
import { PercentageIcon } from "/src/components/Icons/NumericalIcons";
import { SortableHeaderRenderer, useTableSort } from "../../../../../../../../../../../components/Sort/TableSort";
import { useNumberFormatter, useDateFormatter } from "../../../../../../../../../../../components/useFormatter";
import "/src/pages/App/pages/Portfolio/components/Summary/components/InvestmentDetails/InvestmentDetails.css";

const FLOW_TYPES = ["Investment", "Dividend", "Interest", "Other", "Divestment", "Partial divestment"];

const BADGE_STYLES = {
  "Investment":         { background: "#fef3c7", color: "#b45309" },
  "Dividend":           { background: "#dcfce7", color: "#15803d" },
  "Interest":           { background: "#e0f2fe", color: "#0369a1" },
  "Divestment":         { background: "#fee2e2", color: "#b91c1c" },
  "Other":              { background: "#ede9fe", color: "#6d28d9" },
  "Partial divestment": { background: "#ffe4e6", color: "#be123c" },
};

function TypeSelect({ value, options, onChange, disabled }) {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState(null);
  const btnRef = useRef(null);

  const updatePosition = () => {
    if (!btnRef.current) return;
    const rect = btnRef.current.getBoundingClientRect();
    setCoords({
      top: rect.bottom + window.scrollY + 4,
      left: rect.left + window.scrollX,
      width: rect.width,
    });
  };

  useEffect(() => {
    if (!open) return;
    updatePosition();
    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);
    return () => {
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [open]);

  return (
    <>
      <div className="typeSelectWrapper">
        <button
          ref={btnRef}
          className="typeSelectTrigger"
          onClick={() => { if (!disabled) setOpen(v => !v); }}
          type="button"
          disabled={disabled}
          style={disabled ? { opacity: 0.5, cursor: "not-allowed" } : {}}
          title={disabled ? "Cannot edit master record" : ""}
        >
          <span
            className="typeSelectBadge"
            style={BADGE_STYLES[value] || { background: "#f1f5f9", color: "#64748b" }}
          >
            {value || "Select"}
          </span>
          <ChevronDownIcon />
        </button>
      </div>

      {open && !disabled && coords &&
        createPortal(
          <div
            className="typeSelectDropdown"
            style={{
              position: "absolute",
              top: coords.top,
              left: coords.left,
              width: coords.width,
              zIndex: 10000,
            }}
          >
            {options.map((t) => (
              <button
                key={t}
                className="typeSelectOption"
                onClick={() => { onChange(t); setOpen(false); }}
                type="button"
              >
                {t}
              </button>
            ))}
          </div>,
          document.body
        )}
    </>
  );
}

function KebabMenu({ onDuplicate, onDelete, isScenarioCreated }) {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState(null);
  const btnRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handleScroll = () => setOpen(false);
    window.addEventListener("scroll", handleScroll, true);
    return () => window.removeEventListener("scroll", handleScroll, true);
  }, [open]);

  const handleOpen = (e) => {
    e.stopPropagation();
    if (!open && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setCoords({
        top: rect.bottom + window.scrollY + 4,
        left: rect.left + window.scrollX,
      });
    }
    setOpen(v => !v);
  };

  return (
    <div className="kebabWrapper">
      <button ref={btnRef} className="kebabBtn" onClick={handleOpen} type="button">
        <MoreActionsIcon />
      </button>

      {open && coords && createPortal(
        <div
          className="kebabDropdown"
          style={{
            position: "absolute",
            top: coords.top,
            left: coords.left,
            zIndex: 10000,
          }}
          onClick={(e) => e.stopPropagation()}
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

export default function InvestmentFlowsTable({ flows, onUpdate, onDelete, onAdd, flowTypes }) {
  const formatNumber = useNumberFormatter();
  const formatDate = useDateFormatter();
  const types = flowTypes?.length > 0 ? flowTypes : FLOW_TYPES;
  const noScroll = (e) => e.target.blur();
  const { sorted, sortKey, toggleSort } = useTableSort(flows ?? [], null);

  const [isEditing, setIsEditing] = useState(false);

  const handleDuplicate = (f) => {
    onAdd({ ...f, id: null, flowId: null });
  };

  const handleAddNew = () => {
    onAdd();
    setIsEditing(true);
  };

  return (
    <>
      <div className="invFairBox invFairBox--flows">
        {/* HEADER */}
        <div className="invFairCol">
          <div className="invFairLabel">Flow #</div>
        </div>

        <div className="invFairCol">
          <SortableHeaderRenderer
            label="Date"
            columnKey="date"
            currentSortKey={sortKey}
            toggleSort={toggleSort}
            center={true}
          />
        </div>

        <div className="invFairCol">
          <SortableHeaderRenderer
            label={<>Amount <span className="invHeaderCurrency">(€)</span></>}
            columnKey="amountEuro"
            currentSortKey={sortKey}
            toggleSort={toggleSort}
            center={true}
          />
        </div>

        <div className="invFairCol">
          <SortableHeaderRenderer
            label="FX Rate"
            columnKey="fxRate"
            currentSortKey={sortKey}
            toggleSort={toggleSort}
            center={true}
          />
        </div>

        <div className="invFairCol">
          <SortableHeaderRenderer
            label="Amount LC"
            columnKey="amountLC"
            currentSortKey={sortKey}
            toggleSort={toggleSort}
            center={true}
          />
        </div>

        <div className="invFairCol">
          <SortableHeaderRenderer
            label="Type"
            columnKey="type"
            currentSortKey={sortKey}
            toggleSort={toggleSort}
            center={true}
          />
        </div>

        <div className="invFairCol" style={{ alignItems: "flex-end" }}>
          <button
            className="invRowActionBtn"
            onClick={() => setIsEditing(v => !v)}
          >
            {isEditing ? <CloseIcon /> : <EditIcon />}
          </button>
        </div>

        {/* ROWS */}
        {sorted.map((f, index) => {
          const amountLCVal = parseFloat(String(f.amountLC).replace(/[^0-9.-]/g, "")) || 0;
          const fxVal = parseFloat(String(f.fxRate).replace(/[^0-9.-]/g, "")) || 0;
          const amountEuro = fxVal ? amountLCVal / fxVal : 0;
          const isPartialDivestment = String(f.type).toLowerCase() === "partial divestment";
          const isMasterRecord = !f.isScenarioCreated;
          const disabledStyles = isMasterRecord ? { opacity: 0.5, cursor: "not-allowed" } : {};

          return (
            <React.Fragment key={f.id}>
              <div className="invFairCol">
                <div className="invFairStaticVal">#{index + 1}</div>
              </div>

              <div className="invFairCol">
                {isEditing ? (
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
                ) : (
                  <div className="invFairStaticVal">
                    {f.date ? formatDate(f.date) : "-"}
                  </div>
                )}
              </div>

              <div className="invFairCol">
                <div className="invFairStaticVal">
                  {amountEuro ? formatNumber(amountEuro) : "-"}
                </div>
              </div>

              <div className="invFairCol">
                {isEditing ? (
                  <input
                    className="invInputBase"
                    type="number"
                    step="any"
                    value={f.fxRate === 0 || f.fxRate === "0" ? "" : f.fxRate ?? ""}
                    placeholder="0"
                    onChange={(e) => onUpdate(f.id, "fxRate", e.target.value)}
                    onWheel={noScroll}
                    disabled={isMasterRecord}
                    style={disabledStyles}
                  />
                ) : (
                  <div className="invFairStaticVal">
                    {f.fxRate ? formatNumber(f.fxRate) : "-"}
                  </div>
                )}
              </div>

              <div className="invFairCol">
                {isEditing ? (
                  <input
                    className="invInputBase"
                    type="number"
                    step="any"
                    value={f.amountLC === 0 || f.amountLC === "0" ? "" : f.amountLC ?? ""}
                    placeholder="0"
                    onChange={(e) => onUpdate(f.id, "amountLC", e.target.value)}
                    onWheel={noScroll}
                    disabled={isMasterRecord}
                    style={disabledStyles}
                  />
                ) : (
                  <div className="invFairStaticVal">
                    {f.amountLC ? formatNumber(f.amountLC) : "-"}
                  </div>
                )}
              </div>

              <div className="invFairCol">
                {isEditing ? (
                  <>
                    <TypeSelect
                      value={f.type}
                      options={types}
                      onChange={(val) => onUpdate(f.id, "type", val)}
                      disabled={isMasterRecord}
                    />
                    {isPartialDivestment && (
                      <div className="invInputWrapper invPartialInput">
                        <input
                          className="invInputBase"
                          type="number"
                          step="any"
                          value={f.divestmentPercentage ?? ""}
                          onChange={(e) => onUpdate(f.id, "divestmentPercentage", e.target.value)}
                          placeholder="0-100"
                          onWheel={noScroll}
                          disabled={isMasterRecord}
                          style={disabledStyles}
                        />
                        <PercentageIcon />
                      </div>
                    )}
                  </>
                ) : (
                  <span
                    className="typeSelectBadge"
                    style={BADGE_STYLES[f.type] || {}}
                  >
                    {f.type || "-"}
                  </span>
                )}
              </div>

              <div className="invFairCol" style={{ alignItems: "flex-end" }}>
                {isEditing && (
                  <KebabMenu
                    onDuplicate={() => handleDuplicate(f)}
                    onDelete={() => onDelete(f.id)}
                    isScenarioCreated={f.isScenarioCreated}
                  />
                )}
              </div>
            </React.Fragment>
          );
        })}
      </div>

      <button className="invAddFlowBtn" onClick={handleAddNew}>
        <PlusIcon /> New Flow
      </button>
    </>
  );
}