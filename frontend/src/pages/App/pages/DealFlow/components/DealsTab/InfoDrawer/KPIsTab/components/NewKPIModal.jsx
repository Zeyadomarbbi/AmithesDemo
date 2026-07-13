import React, { useMemo, useState } from "react";
import { CloseIcon } from "/src/components/Icons/InteractiveIcons";
import SimpleDropdown from "/src/components/SearchBar/SimpleDropdown/SimpleDropdown.jsx";
import "./NewKPIModal.css";

function getValueColumns(periodType, year) {
  const normalizedType = String(periodType || "").toUpperCase();
  const resolvedYear = Number(year) || new Date().getFullYear();

  if (normalizedType === "ANNUALLY") {
    return [
      { key: "annualY1Value", label: String(resolvedYear - 3) },
      { key: "annualY2Value", label: String(resolvedYear - 2) },
      { key: "annualY3Value", label: String(resolvedYear - 1) },
      { key: "annualY4Value", label: String(resolvedYear) },
    ];
  }

  if (normalizedType === "SEMI_ANNUALLY") {
    return [
      { key: "h1Value", label: "H1" },
      { key: "h2Value", label: "H2" },
    ];
  }

  return [
    { key: "q1Value", label: "Q1" },
    { key: "q2Value", label: "Q2" },
    { key: "q3Value", label: "Q3" },
    { key: "q4Value", label: "Q4" },
  ];
}

function NewKPIModal({
  currencies = [],
  periodTypes = [],
  year: periodYear,
  isSaving = false,
  onClose,
  onSubmit,
}) {
  const [kpiName, setKpiName] = useState("");
  const [periodType, setPeriodType] = useState("QUARTERLY");
  const [currencyId, setCurrencyId] = useState(null);
  const [unit, setUnit] = useState("");
  const [values, setValues] = useState({});

  const valueColumns = useMemo(() => getValueColumns(periodType, periodYear), [periodType, periodYear]);
  const canSubmit = kpiName.trim() !== "" && !!periodType;

  const handleChangeValue = (key, value) => {
    setValues((prev) => ({ ...prev, [key]: value.replace(/[^\d.,-]/g, "") }));
  };

  const handleSubmit = () => {
    if (!canSubmit) return;
    onSubmit?.({
      kpiName: kpiName.trim(),
      periodType,
      currencyId,
      unit: unit.trim(),
      q1Value: values.q1Value ?? null,
      q2Value: values.q2Value ?? null,
      q3Value: values.q3Value ?? null,
      q4Value: values.q4Value ?? null,
      h1Value: values.h1Value ?? null,
      h2Value: values.h2Value ?? null,
      annualY1Value: values.annualY1Value ?? null,
      annualY2Value: values.annualY2Value ?? null,
      annualY3Value: values.annualY3Value ?? null,
      annualY4Value: values.annualY4Value ?? null,
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
          </div>

          <div className="nkm-row">
            <div className="nkm-field">
              <label className="nkm-label">Period *</label>
              <SimpleDropdown
                options={periodTypes}
                value={periodType}
                onChange={(value) => {
                  setPeriodType(value);
                  setValues({});
                }}
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
                placeholder="EUR, %, count..."
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
              />
            </div>
          </div>

          <div className="nkm-period-section">
            <div className="nkm-period-header">
              <span className="nkm-period-title-label">Period Values</span>
            </div>

            <div className="nkm-cols-grid">
              {valueColumns.map((column) => (
                <div key={column.key} className="nkm-col-field">
                  <label className="nkm-label nkm-label--col">{column.label}</label>
                  <input
                    className="nkm-input nkm-input--col"
                    placeholder="0"
                    value={values[column.key] ?? ""}
                    onChange={(e) => handleChangeValue(column.key, e.target.value)}
                    disabled={isSaving}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="nkm-footer">
          <button className="nkm-btn-cancel" onClick={onClose} disabled={isSaving}>Cancel</button>
          <button className="nkm-btn-create" onClick={handleSubmit} disabled={!canSubmit || isSaving}>
            {isSaving ? "Creating..." : "Create"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default NewKPIModal;
