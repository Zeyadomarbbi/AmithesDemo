import React from "react";
import { ChevronDownIcon, EuroCurrencyIcon } from "../../../../../Icons.jsx";

export default function TranchCard({ 
  tranch, 
  index, 
  realIndex, 
  isLast, 
  lastTrancheRef, 
  classesLoading, 
  dbShareClasses, 
  currencies,
  currenciesLoading,
  periods, 
  isSubmitting, 
  onUpdateField, 
  onSaveTranche,
  totalTranches 
}) {

  // --- COLLAPSED / SUMMARY VIEW ---
  // Matches the style of shares-mini-row in NewLPDrawer
  if (tranch.collapsed) {
    const selectedShare = dbShareClasses?.find(s => String(s.share_class_id) === String(tranch.shareClassId));
    const selectedCurrency = currencies?.find(c => String(c.id) === String(tranch.currencyId));
    const selectedPeriod = periods?.find(p => String(p.id) === String(tranch.closingId));

    return (
      <div 
        className="shares-mini-row" 
        onClick={() => onSaveTranche(realIndex)} 
        style={{ cursor: "pointer" }}
      >
        <div>
          <span className="tag">{selectedShare?.share_class_name || "-"}</span>
        </div>
        <div className="currency-cell" title={selectedCurrency?.name}>
          {selectedCurrency ? `${selectedCurrency.name} (${selectedCurrency.code}) - ${selectedCurrency.symbol}` : "-"}
        </div>
        <div>
          {tranch.commitment ? `${Number(tranch.commitment).toLocaleString("fr-FR")} ${selectedCurrency?.symbol || ""}` : "-"}
        </div>
        <div>{selectedPeriod?.name || "-"}</div>
        <div className="dots">⋮</div>
      </div>
    );
  }

  // --- EXPANDED / FORM VIEW ---
  return (
    <div
      className={`drawer-section shares-panel ${tranch.collapsed ? "shares-panel--collapsed" : ""}`}
      ref={isLast ? lastTrancheRef : null}
    >
      <div className="drawer-section-title">
        Shares{totalTranches > 1 ? ` — Tranche ${index + 1}` : ""}
      </div>

      <div className="drawer-grid-2">
        <div className="field">
          <label className="field-label">Type of share*</label>
          <div className="field-input-with-icon">
            <select
              className="field-input select-input"
              value={tranch.shareClassId}
              onChange={onUpdateField(realIndex, "shareClassId")}
              disabled={isSubmitting}
            >
              <option value="" disabled hidden>
                {classesLoading ? "Loading..." : "Select Share Class"}
              </option>
              {dbShareClasses?.map((sc) => (
                <option key={sc.share_class_id} value={sc.share_class_id}>
                  {sc.share_class_name}
                </option>
              ))}
            </select>
            <span className="field-icon field-icon-chevron"><ChevronDownIcon /></span>
          </div>
        </div>

        <div className="field">
          <label className="field-label">Currency*</label>
          <div className="field-input-with-icon">
            <select
              className="field-input select-input"
              value={tranch.currencyId}
              onChange={onUpdateField(realIndex, "currencyId")}
              disabled={isSubmitting || currenciesLoading}
            >
              <option value="" disabled hidden>
                  {currenciesLoading ? "Loading..." : "Select Currency"}
              </option>
              {currencies?.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.code}) - {c.symbol}
                </option>
              ))}
            </select>
            <span className="field-icon field-icon-chevron"><ChevronDownIcon /></span>
          </div>
        </div>
      </div>

      <div className="drawer-grid-2">
        <div className="field field-input-with-suffix">
          <label className="field-label">Commitment*</label>
          <input
            className="field-input field-input--has-suffix"
            type="number"
            value={tranch.commitment}
            onChange={onUpdateField(realIndex, "commitment")}
            disabled={isSubmitting}
          />
          <span className="field-icon field-icon-suffix"><EuroCurrencyIcon /></span>
        </div>

        <div className="field">
          <label className="field-label">Closing *</label>
          <div className="field-input-with-icon">
            <select
              className="field-input select-input"
              value={tranch.closingId}
              onChange={onUpdateField(realIndex, "closingId")}
              disabled={isSubmitting}
            >
              <option value="" disabled hidden>Select Closing</option>
              {periods.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            <span className="field-icon field-icon-chevron"><ChevronDownIcon /></span>
          </div>
        </div>
      </div>

      <div className="shares-inner-footer">
        <button
          type="button"
          className="btn-primary-wide shares-save-btn"
          onClick={() => onSaveTranche(realIndex)}
          disabled={isSubmitting}
        >
          Save
        </button>
      </div>
    </div>
  );
}