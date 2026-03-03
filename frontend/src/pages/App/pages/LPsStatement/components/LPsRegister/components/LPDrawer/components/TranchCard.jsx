import React from "react";
import { ChevronDownIcon, EuroCurrencyIcon, MoreActionsButton } from "../../../../../Icons.jsx";

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
      <div className="shares-mini-row" onClick={() => onSaveTranche(realIndex)} style={{ cursor: "pointer" }}>
        {/* Column 1: Share Type */}
        <div className="mini-row-column">
          <span className="mini-row-label">Type of share</span>
          <div className="share-badge">
            {selectedShare?.share_class_name || "-"}
          </div>
        </div>

        {/* Column 2: Currency */}
        <div className="mini-row-column">
          <span className="mini-row-label">Currency</span>
          <span className="mini-row-value">
            {selectedCurrency ? `${selectedCurrency.name} (${selectedCurrency.code})` : "-"}
          </span>
        </div>

        {/* Column 3: Commitment */}
        <div className="mini-row-column">
          <span className="mini-row-label">Amount</span>
          <span className="mini-row-value">
            {tranch.commitment ? `${Number(tranch.commitment).toLocaleString("fr-FR")} ${selectedCurrency?.symbol || ""}` : "-"}
          </span>
        </div>

        {/* Column 4: Closing */}
        <div className="mini-row-column">
          <span className="mini-row-label">Closing</span>
          <span className="mini-row-value">
            {selectedPeriod?.name || "-"}
          </span>
        </div>

        {/* Actions */}
        <div className="mini-row-dots">
          <MoreActionsButton/>
        </div>
      </div>
    );
  }

  // --- EXPANDED / FORM VIEW ---
  return (
    <div
      className={`lp-drawer-section shares-panel ${tranch.collapsed ? "shares-panel--collapsed" : ""}`}
      ref={isLast ? lastTrancheRef : null}
    >
      <div className="lp-drawer-grid-2">
        <div className="lp-drawer-field">
          <label className="lp-drawer-field-label">Type of share*</label>
          <div className="lp-drawer-field-input-with-icon">
            <select
              className="lp-drawer-field-input select-input"
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
            <span className="lp-drawer-field-icon lp-drawer-field-icon-chevron"><ChevronDownIcon /></span>
          </div>
        </div>

        <div className="lp-drawer-field">
          <label className="lp-drawer-field-label">Currency*</label>
          <div className="lp-drawer-field-input-with-icon">
            <select
              className="lp-drawer-field-input select-input" // This class is vital
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
            {/* This span will now be the only visible arrow */}
            <span className="lp-drawer-field-icon-chevron">
              <ChevronDownIcon />
            </span>
          </div>
        </div>
      </div>

      <div className="lp-drawer-grid-2">
        <div className="lp-drawer-field">
          <label className="lp-drawer-field-label">Amount*</label>
          <div className="lp-drawer-input-wrapper">
            <input
              className="lp-drawer-field-input lp-drawer-field-input--has-suffix"
              type="number"
              value={tranch.commitment}
              onChange={onUpdateField(realIndex, "commitment")}
              disabled={isSubmitting}
            />
            <span className="lp-drawer-field-icon-suffix">
              <EuroCurrencyIcon />
            </span>
          </div>
        </div>

        <div className="lp-drawer-field">
          <label className="lp-drawer-field-label">Closing *</label>
          <div className="lp-drawer-field-input-with-icon">
            <select
              className="lp-drawer-field-input select-input"
              value={tranch.closingId}
              onChange={onUpdateField(realIndex, "closingId")}
              disabled={isSubmitting}
            >
              <option value="" disabled hidden>Select Closing</option>
              {periods.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            <span className="lp-drawer-field-icon lp-drawer-field-icon-chevron"><ChevronDownIcon /></span>
          </div>
        </div>
      </div>

      <div className="shares-inner-footer">
        <button
          type="button"
          className="lp-drawer-btn-primary-wide shares-save-btn"
          onClick={() => onSaveTranche(realIndex)}
          disabled={isSubmitting}
        >
          Save
        </button>
      </div>
    </div>
  );
}