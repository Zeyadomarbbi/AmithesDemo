import React from "react";
import SearchableSelect from "../../../../../../../../../components/SearchBar/SearchableSelect.jsx";
import { useNumberFormatter } from "../../../../../../../../../components/useFormatter.js";
import { MoreActionsIcon } from "../../../../../../../../../components/Icons/InteractiveIcons.jsx";
import { EuroCurrencyIcon } from "../../../../../../../../../components/Icons/FinancialIcons.jsx";

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
  const formatNumber = useNumberFormatter();

  const updateField = (field) => (val) => {
    onUpdateField(realIndex, field)({ target: { value: val } });
  };

  // --- COLLAPSED / SUMMARY VIEW ---
  if (tranch.collapsed) {
    const selectedShare  = dbShareClasses?.find(s => String(s.share_class_id) === String(tranch.shareClassId));
    const selectedCurrency = currencies?.find(c => String(c.id) === String(tranch.currencyId));
    const selectedPeriod = periods?.find(p => String(p.id) === String(tranch.closingId));


    return (
      <div className="shares-mini-row" onClick={() => onSaveTranche(realIndex)} style={{ cursor: "pointer" }}>
        <div className="mini-row-column">
          <span className="mini-row-label">Type of share</span>
          <div className="share-badge">
            {selectedShare?.share_class_name || "-"}
          </div>
        </div>
        <div className="mini-row-column">
          <span className="mini-row-label">Currency</span>
          <span className="mini-row-value">
            {selectedCurrency ? `${selectedCurrency.name} (${selectedCurrency.code})` : "-"}
          </span>
        </div>
        <div className="mini-row-column">
          <span className="mini-row-label">Amount</span>
          <span className="mini-row-value">
            {tranch.commitment ? `${formatNumber(tranch.commitment)} ${selectedCurrency?.symbol || ""}` : "-"}
          </span>
        </div>
        <div className="mini-row-column">
          <span className="mini-row-label">Closing</span>
          <span className="mini-row-value">
            {selectedPeriod?.name || "-"}
          </span>
        </div>
        <div className="mini-row-dots">
          <MoreActionsIcon />
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
          <SearchableSelect
            options={dbShareClasses ?? []}
            value={tranch.shareClassId}
            onChange={updateField("shareClassId")}
            placeholder={classesLoading ? "Loading..." : "Select Share Class"}
            labelKey="share_class_name"
            valueKey="share_class_id"
            disabled={isSubmitting || classesLoading}
            triggerClassName="lp-drawer-field-input"
          />
        </div>

        <div className="lp-drawer-field">
          <label className="lp-drawer-field-label">Currency*</label>
          <SearchableSelect
            options={currencies ?? []}
            value={tranch.currencyId}
            onChange={updateField("currencyId")}
            placeholder={currenciesLoading ? "Loading..." : "Select Currency"}
            labelKey="name"
            valueKey="id"
            secondaryLabelKey="code"
            disabled={isSubmitting || currenciesLoading}
            triggerClassName="lp-drawer-field-input"
          />
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
              onWheel={(e) => e.target.blur()}
              placeholder="0.00"
              disabled={isSubmitting}
            />
            <span className="lp-drawer-field-icon-suffix">
              <EuroCurrencyIcon />
            </span>
          </div>
        </div>

        <div className="lp-drawer-field">
          <label className="lp-drawer-field-label">Closing*</label>
          <SearchableSelect
            options={periods ?? []}
            value={tranch.closingId}
            onChange={updateField("closingId")}
            placeholder="Select Closing"
            labelKey="name"
            valueKey="id"
            disabled={isSubmitting}
            triggerClassName="lp-drawer-field-input"
          />
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