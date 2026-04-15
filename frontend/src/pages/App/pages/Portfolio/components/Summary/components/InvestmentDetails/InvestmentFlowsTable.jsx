import React, { useState } from "react";
import { createPortal } from "react-dom";

import { PermissionGate } from "../../../../../../../../hooks/Auth/PermissionGate";
import DateInputWithPicker from "../../../../../../../../components/DateComponents/DateInput";
import {
  MoreActionsIcon,
  DeleteIcon,
  DuplicateIcon,
  AddFileIcon,
  AddCommentIcon,
  PlusIcon,
  EditIcon,
  CloseIcon,
} from "../../../../../../../../components/Icons/InteractiveIcons";
import { ChevronDownIcon } from "../../../../../../../../components/Icons/DirectionIcons";
import { PercentageIcon } from "../../../../../../../../components/Icons/NumericalIcons";
import { useTableSort, SortableHeaderRenderer } from "../../../../../../../../components/Sort/TableSort";
import { useNumberFormatter, useDateFormatter } from "../../../../../../../../components/useFormatter.js";
import "./InvestmentDetails.css";

const FLOW_TYPES = ["Investment", "Dividend", "Interest", "Other", "Divestment", "Partial divestment"];

const BADGE_STYLES = {
  "Investment":         { background: "#fef3c7", color: "#b45309" },
  "Dividend":           { background: "#dcfce7", color: "#15803d" },
  "Interest":           { background: "#e0f2fe", color: "#0369a1" },
  "Divestment":         { background: "#fee2e2", color: "#b91c1c" },
  "Other":              { background: "#ede9fe", color: "#6d28d9" },
  "Partial divestment": { background: "#ffe4e6", color: "#be123c" },
};

function TypeSelect({ value, options, onChange }) {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState(null);
  const btnRef = React.useRef(null);

  const updatePosition = () => {
    if (!btnRef.current) return;
    const rect = btnRef.current.getBoundingClientRect();

    setCoords({
      top: rect.bottom + window.scrollY + 4,
      left: rect.left + window.scrollX,
      width: rect.width,
    });
  };

  React.useEffect(() => {
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
          onClick={() => setOpen(v => !v)}
          type="button"
        >
          <span
            className="typeSelectBadge"
            style={
              BADGE_STYLES[value] || {
                background: "#f1f5f9",
                color: "#64748b",
              }
            }
          >
            {value || "Select"}
          </span>
          <ChevronDownIcon />
        </button>
      </div>

      {open &&
        coords &&
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
                onClick={() => {
                  onChange(t);
                  setOpen(false);
                }}
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

function KebabMenu({ onDuplicate, onDelete }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="kebabWrapper">
      <button className="kebabBtn" onClick={() => setOpen(v => !v)} type="button">
        <MoreActionsIcon />
      </button>

      {open && (
        <div className="kebabDropdown">
          <button className="kebabItem" onClick={() => { onDuplicate(); setOpen(false); }}>
            <DuplicateIcon /> Duplicate
          </button>
          <button className="kebabItem kebabItemDelete" onClick={() => { onDelete(); setOpen(false); }}>
            <DeleteIcon /> Delete
          </button>
        </div>
      )}
    </div>
  );
}

export default function InvestmentFlowsTable({
  flows,
  onUpdate,
  onDelete,
  onAdd,
  flowTypes = [],
}) {
  const types = flowTypes.length ? flowTypes : FLOW_TYPES;
  const { sorted, sortKey, toggleSort } = useTableSort(flows ?? [], null);

  const formatNumber = useNumberFormatter();
  const formatDate = useDateFormatter();

  const [isEditing, setIsEditing] = useState(false);

  const handleDuplicate = (f) => {
    onAdd({ ...f, id: null, flowId: null });
    setIsEditing(true);
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
            label="Amount"
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

        <PermissionGate>
          <div className="invFairCol" style={{ alignItems: "flex-end" }}>
            <button
              className="invRowActionBtn"
              onClick={() => setIsEditing(v => !v)}
            >
              {isEditing ? <CloseIcon /> : <EditIcon />}
            </button>
          </div>
        </PermissionGate>

        {/* ROWS */}
        {sorted.map((f, index) => {
          const amountLC = Number(f.amountLC) || 0;
          const fx = Number(f.fxRate) || 0;
          const amountEuro = fx ? amountLC / fx : 0;
          const isPartial = String(f.type).toLowerCase() === "partial divestment";

          return (
            <React.Fragment key={f.id}>
              <div className="invFairCol">
                <div className="invFairStaticVal">#{index + 1}</div>
              </div>

              <div className="invFairCol">
                {isEditing ? (
                  <DateInputWithPicker
                    isSingle
                    initialDate={f.date ? new Date(f.date) : null}
                    onDateChange={(d) =>
                      onUpdate(f.id, "date", d.toISOString().slice(0, 10))
                    }
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
                    value={f.fxRate || ""}
                    onChange={(e) => onUpdate(f.id, "fxRate", e.target.value)}
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
                    value={f.amountLC || ""}
                    onChange={(e) => onUpdate(f.id, "amountLC", e.target.value)}
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
                    />
                    {isPartial && (
                      <input
                        className="invInputBase"
                        type="number"
                        value={f.divestmentPercentage || ""}
                        onChange={(e) =>
                          onUpdate(f.id, "divestmentPercentage", e.target.value)
                        }
                        placeholder="0-100"
                      />
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

              {isEditing && (
                <PermissionGate>
                  <div className="invFairCol" style={{ alignItems: "flex-end" }}>
                    <KebabMenu
                      onDuplicate={() => handleDuplicate(f)}
                      onDelete={() => onDelete(f.id)}
                    />
                  </div>
                </PermissionGate>
              )}
              {!isEditing && <div className="invFairCol" />}
            </React.Fragment>
          );
        })}
      </div>

      <PermissionGate>
        <button className="invAddFlowBtn" onClick={handleAddNew}>
          <PlusIcon /> New Flow
        </button>
      </PermissionGate>
    </>
  );
}