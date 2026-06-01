import React, { useMemo, useState } from "react";
import { CloseIcon } from "/src/components/Icons/InteractiveIcons";
import SimpleDropdown from "/src/components/SearchBar/SimpleDropdown/SimpleDropdown.jsx";
import "./NewKPIModal.css";

const VIEW_OPTIONS = [
  { id: "quarterly",     name: "Quarterly" },
  { id: "semi-annually", name: "Semi-Annually" },
  { id: "annually",      name: "Annually" },
];

function getColsForViewType(viewType, year) {
  if (!viewType) return [];
  if (viewType === "annually") {
    const y = Number(year) || new Date().getFullYear();
    return [String(y - 3), String(y - 2), String(y - 1), String(y)];
  }
  if (viewType === "semi-annually") return ["H1", "H2"];
  return ["Q1", "Q2", "Q3", "Q4"];
}

function NewKPIModal({ kpiCategories = [], currencies = [], isSaving = false, onClose, onSubmit }) {
  const [kpiName, setKpiName]             = useState("");
  const [kpiCategoryId, setKpiCategoryId] = useState(null);
  const [viewType, setViewType]           = useState(null);
  const [currencyId, setCurrencyId]       = useState(null);
  const [unit, setUnit]                   = useState("");
  const [order, setOrder]                 = useState("");
  const [displayOrder, setDisplayOrder]   = useState("");
  const [year, setYear]                   = useState(new Date().getFullYear());
  const [values, setValues]               = useState({});

  const cols = useMemo(() => getColsForViewType(viewType, year), [viewType, year]);

  const handleViewTypeChange = (vt) => {
    setViewType(vt);
    setValues({});
  };

  const handleYearChange = (y) => {
    setYear(y);
    setValues({});
  };

  const handleColValue = (col, val) => {
    setValues((prev) => ({ ...prev, [col]: val.replace(/[^\d.,-]/g, "") }));
  };

  const canSubmit = kpiName.trim() !== "" && !!viewType;

  const handleSubmit = () => {
    if (!canSubmit) return;
    onSubmit?.({
      kpiName: kpiName.trim(),
      kpiCategoryId,
      viewType,
      currencyId,
      unit: unit.trim(),
      order,
      displayOrder,
      year,
      values,
    });
  };

  return (
    <div className="nkm-overlay" onClick={onClose}>
      <div className="nkm-modal" onClick={(e) => e.stopPropagation()}>

        <div className="nkm-header">
          <button className="nkm-close" onClick={onClose} aria-label="Close"><CloseIcon /></button>
        </div>

        <div className="nkm-body">
          <h2 className="nkm-title">New KPI</h2>

          <div className="nkm-row">
            <div className="nkm-field">
              <label className="nkm-label">KPI item *</label>
              <input
                className="nkm-input"
                placeholder="Enter KPI item"
                value={kpiName}
                onChange={(e) => setKpiName(e.target.value)}
              />
            </div>
            <div className="nkm-field">
              <label className="nkm-label">Category</label>
              <SimpleDropdown
                options={kpiCategories}
                value={kpiCategoryId}
                onChange={setKpiCategoryId}
                placeholder="Select category"
                labelKey="name"
                valueKey="id"
                disabled={isSaving}
              />
            </div>
          </div>

          <div className="nkm-row">
            <div className="nkm-field">
              <label className="nkm-label">Period *</label>
              <SimpleDropdown
                options={VIEW_OPTIONS}
                value={viewType}
                onChange={handleViewTypeChange}
                placeholder="Select period"
                labelKey="name"
                valueKey="id"
                disabled={isSaving}
              />
            </div>
            <div className="nkm-field">
              <label className="nkm-label">Currency</label>
              <SimpleDropdown
                options={currencies}
                value={currencyId}
                onChange={setCurrencyId}
                placeholder="Select currency"
                labelKey="name"
                valueKey="id"
                disabled={isSaving}
              />
            </div>
          </div>

          <div className="nkm-row">
            <div className="nkm-field">
              <label className="nkm-label">Unit</label>
              <input
                className="nkm-input"
                placeholder="EUR, %, count…"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
              />
            </div>
            <div className="nkm-field">
              <label className="nkm-label">Order</label>
              <input
                className="nkm-input"
                type="number"
                placeholder="e.g. 1"
                value={order}
                onChange={(e) => setOrder(e.target.value)}
              />
            </div>
          </div>

          <div className="nkm-row">
            <div className="nkm-field">
              <label className="nkm-label">Display Order</label>
              <input
                className="nkm-input"
                type="number"
                placeholder="e.g. 1"
                value={displayOrder}
                onChange={(e) => setDisplayOrder(e.target.value)}
              />
            </div>
          </div>

          {viewType && (
            <div className="nkm-period-section">
              <div className="nkm-period-header">
                <span className="nkm-period-title-label">Period Values</span>
              </div>

              {viewType === "annually" && (
                <div className="nkm-row nkm-row--third">
                  <div className="nkm-field">
                    <label className="nkm-label">Year</label>
                    <input
                      className="nkm-input"
                      type="number"
                      placeholder={String(new Date().getFullYear())}
                      value={year}
                      onChange={(e) => handleYearChange(e.target.value)}
                      disabled={isSaving}
                    />
                  </div>
                </div>
              )}

              <div className="nkm-cols-grid">
                {cols.map((col) => (
                  <div key={col} className="nkm-col-field">
                    <label className="nkm-label nkm-label--col">{col}</label>
                    <input
                      className="nkm-input nkm-input--col"
                      placeholder="0"
                      value={values[col] ?? ""}
                      onChange={(e) => handleColValue(col, e.target.value)}
                      disabled={isSaving}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="nkm-footer">
          <button className="nkm-btn-cancel" onClick={onClose} disabled={isSaving}>Cancel</button>
          <button className="nkm-btn-create" onClick={handleSubmit} disabled={!canSubmit || isSaving}>
            {isSaving ? "Creating…" : "Create"}
          </button>
        </div>

      </div>
    </div>
  );
}

export default NewKPIModal;
