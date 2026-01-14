// src/pages/App/pages/LPsStatement/components/LpRegister/NewLPDrawer.jsx
import React, { useEffect, useRef, useState } from "react";
import "./NewLPDrawer.css";
import {
  ChevronDownIcon,
  CloseIcon,
  ChevronDoubleLeftIcon,
  LocationIcon,
  EuroCurrencyIcon,
} from "../Icons.jsx";

const EMPTY_FORM = {
  lpName: "",
  address: "",
  city: "",
  zip: "",
  country: "",
  iban: "",
  bankName: "",
  swift: "",
};

const EMPTY_TRANCHE = {
  shareType: "",
  currency: "",
  commitment: "",
  closing: "",
  collapsed: false, // controls shrink animation
};

function currencyLabel(code) {
  if (code === "EUR") return "Euros (€)";
  if (code === "USD") return "US Dollars ($)";
  return code || "";
}

function currencySymbol(code) {
  if (code === "EUR") return "€";
  if (code === "USD") return "$";
  return "";
}

// badge colors by class
function classColorFor(type) {
  if (type === "Class A1") return "tag-purple";
  if (type === "Class A2") return "tag-green";
  if (type === "Class B") return "tag-yellow";
  return "";
}

// `periods` drives Closing dropdown options (ONLY what you add in AddPeriodModal)
export default function NewLPDrawer({ open, onClose, onSave, periods = [] }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [tranches, setTranches] = useState([EMPTY_TRANCHE]);

  // rows that will go to LP Register mini-table (lp.sharesRows)
  const [sharesRows, setSharesRows] = useState([]);

  const lastTrancheRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    if (lastTrancheRef.current) {
      lastTrancheRef.current.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  }, [tranches.length, open]);

  // render saved (collapsed) tranches above the new one, without breaking indexes
  const orderedTranches = React.useMemo(() => {
    return tranches
      .map((t, originalIndex) => ({ ...t, originalIndex }))
      .sort((a, b) => Number(b.collapsed) - Number(a.collapsed));
  }, [tranches]);

  if (!open) return null;

  const updateField = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const updateTrancheField = (index, field) => (e) => {
    const val = e.target.value;
    setTranches((prev) =>
      prev.map((t, i) => (i === index ? { ...t, [field]: val } : t))
    );
  };

  const handleClose = () => {
    setForm(EMPTY_FORM);
    setTranches([EMPTY_TRANCHE]);
    setSharesRows([]);
    onClose?.();
  };

  const addNewTranche = () => {
    setTranches((prev) => [...prev, { ...EMPTY_TRANCHE }]);
  };

  // Save ONE tranche → collapse its box → add to mini table rows
  const handleSaveTranche = (idx) => {
    const t = tranches[idx] || EMPTY_TRANCHE;

    // basic guard (don’t save empty)
    if (!t.shareType && !t.currency && !t.commitment && !t.closing) return;

    const symbol = currencySymbol(t.currency);

    const row = {
      id: `row-${Date.now()}-${Math.random().toString(16).slice(2)}`, // ✅ stable key
      type: t.shareType || "-",
      currency: currencyLabel(t.currency),
      commitment:
        t.commitment === "" || t.commitment === null || t.commitment === undefined
          ? ""
          : `${t.commitment} ${symbol}`.trim(),
      closing: t.closing || "",
      classColor: classColorFor(t.shareType),
    };

    // 1) add row (newest on TOP)
    setSharesRows((prev) => [row, ...prev]);

    // 2) collapse this tranche box (shrink)
    setTranches((prev) =>
      prev.map((x, i) => (i === idx ? { ...x, collapsed: true } : x))
    );

    // 3) after animation, reset fields so if you open new tranche it’s clean
    window.setTimeout(() => {
      setTranches((prev) =>
        prev.map((x, i) =>
          i === idx ? { ...EMPTY_TRANCHE, collapsed: true } : x
        )
      );
    }, 220);
  };

  const handleSaveLP = () => {
    if (!form.lpName.trim()) return;

    onSave?.({
      ...form,
      sharesRows,
    });

    setForm(EMPTY_FORM);
    setTranches([EMPTY_TRANCHE]);
    setSharesRows([]);
    onClose?.();
  };

  return (
    <div className="drawer-backdrop" onClick={handleClose}>
      <div className="drawer" onClick={(e) => e.stopPropagation()}>
        {/* ===== HEADER ===== */}
        <div className="drawer-header">
          <button className="drawer-back-btn" type="button" onClick={handleClose}>
            <ChevronDoubleLeftIcon />
          </button>

          <h2 className="drawer-title">Adding a new LP</h2>

          <button
            className="drawer-close-btn"
            type="button"
            onClick={handleClose}
            aria-label="Close"
          >
            <CloseIcon />
          </button>
        </div>

        {/* ===== CONTENT ===== */}
        <div className="drawer-content">
          {/* --- LP informations --- */}
          <div className="drawer-section">
            <div className="drawer-section-title">LP informations</div>

            <div className="field">
              <label className="field-label">LP name*</label>
              <input
                className="field-input"
                value={form.lpName}
                onChange={updateField("lpName")}
              />
            </div>

            <div className="field field-with-icon">
              <label className="field-label">Adress*</label>
              <div className="field-input-with-icon">
                <input
                  className="field-input"
                  value={form.address}
                  onChange={updateField("address")}
                />
                <span className="field-icon">
                  <LocationIcon />
                </span>
              </div>
            </div>

            <div className="drawer-grid-3">
              <div className="field">
                <label className="field-label">City*</label>
                <input
                  className="field-input"
                  value={form.city}
                  onChange={updateField("city")}
                />
              </div>

              <div className="field">
                <label className="field-label">Zip code*</label>
                <input
                  className="field-input"
                  value={form.zip}
                  onChange={updateField("zip")}
                />
              </div>

              <div className="field">
                <label className="field-label">Country*</label>
                <div className="field-input-with-icon">
                  <input
                    className="field-input"
                    value={form.country}
                    onChange={updateField("country")}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* --- Bank details --- */}
          <div className="drawer-section">
            <div className="drawer-section-title">Bank details</div>

            <div className="field">
              <label className="field-label">IBAN*</label>
              <input
                className="field-input"
                value={form.iban}
                onChange={updateField("iban")}
              />
            </div>

            <div className="drawer-grid-2">
              <div className="field">
                <label className="field-label">Bank name*</label>
                <div className="field-input-with-icon">
                  <input
                    className="field-input"
                    value={form.bankName}
                    onChange={updateField("bankName")}
                  />
                </div>
              </div>

              <div className="field">
                <label className="field-label">SWIFT*</label>
                <input
                  className="field-input"
                  value={form.swift}
                  onChange={updateField("swift")}
                />
              </div>
            </div>
          </div>

          {/* Shares mini-table preview */}
          {sharesRows.length > 0 && (
            <section className="drawer-section" style={{ marginTop: 12 }}>
              <h3 className="drawer-section-title">Shares</h3>

              <div className="shares-mini-table">
                <div className="shares-mini-header">
                  <div>Type of share</div>
                  <div>Currency</div>
                  <div>Commitment</div>
                  <div>Closing</div>
                  <div />
                </div>

                {sharesRows.map((r) => (
                  <div className="shares-mini-row" key={r.id}>
                    <div>
                      <span className={`tag ${r.classColor || ""}`}>{r.type}</span>
                    </div>
                    <div>{r.currency}</div>
                    <div>{r.commitment}</div>
                    <div>{r.closing}</div>
                    <div className="dots">⋮</div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* tranche editor boxes */}
          {orderedTranches.map((t, idx) => {
            const realIndex = t.originalIndex;
            const isLast = idx === orderedTranches.length - 1;

            return (
              <div
                key={realIndex}
                className={`drawer-section shares-panel ${
                  t.collapsed ? "shares-panel--collapsed" : ""
                }`}
                ref={isLast ? lastTrancheRef : null}
              >
                <div className="drawer-section-title">
                  Shares{tranches.length > 1 ? ` — Tranche ${idx + 1}` : ""}
                </div>

                <div className="drawer-grid-2">
                  <div className="field">
                    <label className="field-label">Type of share*</label>
                    <div className="field-input-with-icon">
                      <select
                        className="field-input select-input"
                        value={t.shareType}
                        onChange={updateTrancheField(realIndex, "shareType")}
                      >
                        <option value="" disabled hidden>
                          Share Class
                        </option>
                        <option value="Class A1">Class A1</option>
                        <option value="Class A2">Class A2</option>
                        <option value="Class B">Class B</option>
                      </select>
                      <span className="field-icon field-icon-chevron">
                        <ChevronDownIcon />
                      </span>
                    </div>
                  </div>

                  <div className="field">
                    <label className="field-label">Currency*</label>
                    <div className="field-input-with-icon">
                      <select
                        className="field-input select-input"
                        value={t.currency}
                        onChange={updateTrancheField(realIndex, "currency")}
                      >
                        <option value="" disabled hidden>
                          Select Currency
                        </option>
                        <option value="EUR">EUR</option>
                        <option value="USD">USD</option>
                      </select>
                      <span className="field-icon field-icon-chevron">
                        <ChevronDownIcon />
                      </span>
                    </div>
                  </div>
                </div>

                <div className="drawer-grid-2">
                  <div className="field field-input-with-suffix">
                    <label className="field-label">Commitment*</label>
                    <input
                      className="field-input field-input--has-suffix"
                      type="number"
                      value={t.commitment}
                      onChange={updateTrancheField(realIndex, "commitment")}
                    />
                    <span className="field-icon field-icon-suffix">
                      <EuroCurrencyIcon />
                    </span>
                  </div>

                  <div className="field">
                    <label className="field-label">Closing *</label>
                    <div className="field-input-with-icon">
                      <select
                        className="field-input select-input"
                        value={t.closing}
                        onChange={updateTrancheField(realIndex, "closing")}
                      >
                        <option value="" disabled hidden>
                          Select Closing
                        </option>

                        {periods
                          .map((p) => (typeof p === "string" ? p : p?.name))
                          .filter(Boolean)
                          .map((label) => (
                            <option key={label} value={label}>
                              {label}
                            </option>
                          ))}
                      </select>
                      <span className="field-icon field-icon-chevron">
                        <ChevronDownIcon />
                      </span>
                    </div>
                  </div>
                </div>

                <div className="shares-inner-footer">
                  <button
                    type="button"
                    className="btn-primary-wide shares-save-btn"
                    onClick={() => handleSaveTranche(realIndex)}
                  >
                    Save
                  </button>
                </div>
              </div>
            );
          })}

          <button type="button" className="new-tranch-btn" onClick={addNewTranche}>
            <span className="new-tranch-plus">+</span>
            <span className="new-tranch-text">New Tranch</span>
          </button>
        </div>

        {/* ===== GLOBAL FOOTER ===== */}
        <div className="drawer-footer">
          <button className="btn-secondary-wide" type="button" onClick={handleClose}>
            Cancel
          </button>
          <button className="btn-primary-wide" type="button" onClick={handleSaveLP}>
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
  