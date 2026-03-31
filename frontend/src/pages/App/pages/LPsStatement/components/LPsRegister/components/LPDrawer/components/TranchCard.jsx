import React, { useRef, useState, useEffect } from "react";
import SimpleDropdown from "../../../../../../../../../components/SearchBar/SimpleDropdown/SimpleDropdown.jsx";
import { useNumberFormatter } from "../../../../../../../../../components/useFormatter.js";
import { MoreActionsIcon, EditIcon, DeleteIcon } from "../../../../../../../../../components/Icons/InteractiveIcons.jsx";
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
  onDeleteTranche,
  classColorMap = {}
}) {
  const formatNumber = useNumberFormatter();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const updateField = (field) => (val) => {
    onUpdateField(realIndex, field)({ target: { value: val } });
  };

  // --- COLLAPSED / SUMMARY VIEW ---
  if (tranch.collapsed) {
    const selectedShare = dbShareClasses?.find(s => String(s.share_class_id) === String(tranch.shareClassId));
    const selectedCurrency = currencies?.find(c => String(c.id) === String(tranch.currencyId));
    const selectedPeriod = periods?.find(p => String(p.id) === String(tranch.closingId));
    const shareStyle = classColorMap[selectedShare?.share_class_name] || {};

    return (
      <>
        <div className="shares-mini-row">
          <div className="mini-row-column">
            <span className="mini-row-label">Type of share</span>
            <div
              className="share-badge"
              style={{ background: shareStyle.bg, color: shareStyle.color }}
            >
              {selectedShare?.share_class_name || "-"}
            </div>
          </div>
          <div className="mini-row-column">
            <span className="mini-row-label">Currency</span>
            <span className="mini-row-value">
              {selectedCurrency ? (
                <>
                  {selectedCurrency.name}
                  <span className="mini-row-hint">({selectedCurrency.code})</span>
                </>
              ) : "-"}
            </span>
          </div>
          <div className="mini-row-column">
            <span className="mini-row-label">Amount</span>
            <span className="mini-row-value">
              {tranch.commitment ? (
                <>
                  {formatNumber(tranch.commitment)}
                  <span className="mini-row-hint">({selectedCurrency?.symbol || ""})</span>
                </>
              ) : "-"}
            </span>
          </div>
          <div className="mini-row-column">
            <span className="mini-row-label">Closing</span>
            <span className="mini-row-value">
              {selectedPeriod?.name || "-"}
            </span>
          </div>

          <div className="mini-row-dots" ref={menuRef}>
            <button
              className="mini-row-more-btn"
              onClick={(e) => { e.stopPropagation(); setMenuOpen(prev => !prev); }}
            >
              <MoreActionsIcon />
            </button>
            {menuOpen && (
              <div className="mini-row-menu">
                <div
                  className="mini-row-menu-item"
                  onClick={(e) => {
                    e.stopPropagation();
                    setMenuOpen(false);
                    onSaveTranche(realIndex);
                  }}
                >
                  <EditIcon />
                  <span>Edit</span>
                </div>
                <div
                  className="mini-row-menu-item mini-row-menu-item--danger"
                  onClick={(e) => {
                    e.stopPropagation();
                    setMenuOpen(false);
                    onDeleteTranche(realIndex);
                  }}
                >
                  <DeleteIcon />
                  <span>Delete</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </>
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
            <SimpleDropdown
                options={dbShareClasses ?? []}
                value={tranch.shareClassId}
                onChange={updateField("shareClassId")}
                placeholder={classesLoading ? "Loading..." : "Select Share Class"}
                labelKey="share_class_name"
                valueKey="share_class_id"
                disabled={isSubmitting || classesLoading}
            />
        </div>

        <div className="lp-drawer-field">
          <label className="lp-drawer-field-label">Currency*</label>
            <SimpleDropdown
                options={(currencies ?? []).map((c) => ({
                    id: c.id,
                    name: `${c.currency_name || c.name} (${c.currency_code || c.code} — ${c.currency_symbol || c.symbol})`,
                }))}
                value={tranch.currencyId}
                onChange={updateField("currencyId")}
                placeholder={currenciesLoading ? "Loading..." : "Select Currency"}
                disabled={isSubmitting || currenciesLoading}
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
            <SimpleDropdown
                options={periods ?? []}
                value={tranch.closingId}
                onChange={updateField("closingId")}
                placeholder="Select Closing"
                disabled={isSubmitting}
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