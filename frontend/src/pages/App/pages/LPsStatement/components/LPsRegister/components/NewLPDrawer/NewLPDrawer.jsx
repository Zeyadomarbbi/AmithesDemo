// src/pages/App/pages/LPsStatement/components/NewLPDrawer/NewLPDrawer.jsx
import React, { useEffect, useRef, useState, useMemo } from "react";
import { useParams } from "react-router-dom";
import "./NewLPDrawer.css";
import {
  CloseIcon,
  ChevronDoubleLeftIcon,
  LocationIcon,
  ChevronDownIcon
} from "../../../../Icons.jsx";
import { useShareClasses } from "../../../../../../hooks/useShareClass.js";
import { useCurrencies } from "../../../../../../hooks/Reference/useCurrencies.js";
import { useCountries } from "../../../../../../hooks/Reference/useCountries.js";
import { useLimitedPartners } from "../../../../../../hooks/LPsStatement/useLimitedPartners.jsx";
// 1. Import the new hook
import { useLimitedPartnerFundCommitment } from "../../../../../../hooks/LPsStatement/useLimitedPartnerFundCommitment.jsx";

import TranchCard from "./components/TranchCard.jsx";

const EMPTY_FORM = {
  lpName: "",
  address: "",
  city: "",
  zip: "",
  countryId: "",
  iban: "",
  bankName: "",
  swift: "",
};

// 2. Updated to use IDs to match Backend Foreign Keys
const EMPTY_TRANCHE = {
  shareClassId: "", // Changed from shareType
  currencyId: "",
  commitment: "",
  closingId: "",    // Changed from closing
  collapsed: false,
};


export default function NewLPDrawer({ open, onClose, onSave, periods = [] }) {
  const { fundId } = useParams();
  
  // State
  const [form, setForm] = useState(EMPTY_FORM);
  const [tranches, setTranches] = useState([]); 
  const [sharesRows, setSharesRows] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Hooks
  const { data: dbShareClasses, isLoading: classesLoading } = useShareClasses(fundId);
  const { currencies, isLoading: currenciesLoading } = useCurrencies();
  const { countries, isLoading: countriesLoading } = useCountries();
  const { createLimitedPartner } = useLimitedPartners();
  
  // 3. Initialize Commitment Hook
  const { createCommitment } = useLimitedPartnerFundCommitment(fundId);

  const lastTrancheRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    if (lastTrancheRef.current) {
      lastTrancheRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [tranches.length, open]);

  const orderedTranches = useMemo(() => {
    return tranches
      .map((t, originalIndex) => ({ ...t, originalIndex }))
      .sort((a, b) => Number(b.collapsed) - Number(a.collapsed));
  }, [tranches]);

  const isFormValid = useMemo(() => {
    return form.lpName.trim() !== "" && sharesRows.length > 0;
  }, [form.lpName, sharesRows]);

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
    setTranches([]);
    setSharesRows([]);
    setIsSubmitting(false);
    onClose?.();
  };

  const addNewTranche = () => {
    setTranches((prev) => [...prev, { ...EMPTY_TRANCHE }]);
  };

  // 4. Update Logic to Look up Names for UI, but keep IDs for Data
  const handleSaveTranche = (idx) => {
    const t = tranches[idx] || EMPTY_TRANCHE;
    
    // Validation: Check if IDs exist
    if (!t.shareClassId || !t.currencyId || !t.commitment || !t.closingId) return;

    // --- LOOKUPS FOR UI DISPLAY ---
    const selectedCurrency = currencies.find(c => String(c.id) === String(t.currencyId));
    const selectedShare = dbShareClasses.find(s => String(s.share_class_id) === String(t.shareClassId));
    const selectedPeriod = periods.find(p => String(p.id) === String(t.closingId)); // periods assumed to have .id from parent

    const symbol = selectedCurrency?.symbol || "";
    const currencyDisplay = selectedCurrency 
        ? `${selectedCurrency.name} (${selectedCurrency.code}) - ${selectedCurrency.symbol}`
        : "";
    const shareName = selectedShare?.share_class_name || "-";
    const closingName = selectedPeriod?.name || "-";

    const row = {
      id: `row-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      
      // UI DISPLAY VALUES
      type: shareName,
      currency: currencyDisplay,
      commitment: `${Number(t.commitment).toLocaleString("fr-FR")} ${symbol}`.trim(),
      closing: closingName,
      classColor: "", 

      // HIDDEN DATA VALUES (For API)
      rawShareClassId: t.shareClassId,
      rawCurrencyId: t.currencyId,
      rawClosingId: t.closingId,
      rawCommitment: t.commitment
    };

    setSharesRows((prev) => [row, ...prev]);
    setTranches((prev) =>
      prev.map((x, i) => (i === idx ? { ...x, collapsed: true } : x))
    );

    window.setTimeout(() => {
      setTranches((prev) =>
        prev.map((x, i) =>
          i === idx ? { ...EMPTY_TRANCHE, collapsed: true } : x
        )
      );
    }, 220);
  };

  // 5. Final Save: Create LP -> Then Create Commitments
  const handleSaveLP = async () => {
    if (!isFormValid || isSubmitting) return;

    setIsSubmitting(true);
    try {
      // A. Prepare LP Payload
      const lpPayload = {
        name: form.lpName,
        address: form.address,
        city: form.city,
        zip_code: form.zip,
        country: parseInt(form.countryId, 10), 
        iban: form.iban,
        bank_name: form.bankName,
        swift: form.swift,
      };

      console.log("payload", lpPayload)
      // B. Create LP
      const lpResponse = await createLimitedPartner(lpPayload);
      const newLpId = lpResponse.lp_id; // Ensure this matches your API response field

      // C. Loop through saved rows and create commitments
      // We use Promise.all to do them in parallel
      const commitmentPromises = sharesRows.map(row => {
        const commitmentPayload = {
            lp: newLpId,
            fund: parseInt(fundId, 10),
            share_class: parseInt(row.rawShareClassId, 10),
            currency: parseInt(row.rawCurrencyId, 10),
            closing_period: parseInt(row.rawClosingId, 10),
            commitment_amount: parseFloat(row.rawCommitment)
        };
        return createCommitment(commitmentPayload);
      });

      await Promise.all(commitmentPromises);

      // D. Close
      handleClose();
    } catch (err) {
      // The error message now contains the server response
      console.error("Failed to create LP:", err);
      alert(`Error creating LP: ${err.message}`); 
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="drawer-backdrop" onClick={handleClose}>
      <div className="drawer" onClick={(e) => e.stopPropagation()}>
        <div className="drawer-header">
          <button className="drawer-back-btn" type="button" onClick={handleClose}>
            <ChevronDoubleLeftIcon />
          </button>
          <h2 className="drawer-title">Adding a new LP</h2>
          <button className="drawer-close-btn" type="button" onClick={handleClose}>
            <CloseIcon />
          </button>
        </div>

        <div className="drawer-content">
          {/* LP Informations */}
          <div className="drawer-section">
            <div className="drawer-section-title">LP informations</div>
            <div className="field">
              <label className="field-label">LP name*</label>
              <input className="field-input" value={form.lpName} onChange={updateField("lpName")} disabled={isSubmitting} />
            </div>
            <div className="field field-with-icon">
              <label className="field-label">Adress*</label>
              <div className="field-input-with-icon">
                <input className="field-input" value={form.address} onChange={updateField("address")} disabled={isSubmitting} />
                <span className="field-icon"><LocationIcon /></span>
              </div>
            </div>
            <div className="drawer-grid-3">
              <div className="field">
                <label className="field-label">City*</label>
                <input className="field-input" value={form.city} onChange={updateField("city")} disabled={isSubmitting} />
              </div>
              <div className="field">
                <label className="field-label">Zip code*</label>
                <input className="field-input" value={form.zip} onChange={updateField("zip")} disabled={isSubmitting} />
              </div>
              <div className="field">
                <label className="field-label">Country*</label>
                <div className="field-input-with-icon">
                    <select 
                        className="field-input select-input" 
                        value={form.countryId} 
                        onChange={updateField("countryId")} 
                        disabled={isSubmitting || countriesLoading}
                    >
                        <option value="" disabled hidden>{countriesLoading ? "Loading..." : "Select Country"}</option>
                        {countries?.map(c => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                    </select>
                    <span className="field-icon field-icon-chevron"><ChevronDownIcon /></span>
                </div>
              </div>
            </div>
          </div>

          {/* Bank Details */}
          <div className="drawer-section">
            <div className="drawer-section-title">Bank details</div>
            <div className="field">
              <label className="field-label">IBAN*</label>
              <input className="field-input" value={form.iban} onChange={updateField("iban")} disabled={isSubmitting} />
            </div>
            <div className="drawer-grid-2">
              <div className="field">
                <label className="field-label">Bank name*</label>
                <input className="field-input" value={form.bankName} onChange={updateField("bankName")} disabled={isSubmitting} />
              </div>
              <div className="field">
                <label className="field-label">SWIFT*</label>
                <input className="field-input" value={form.swift} onChange={updateField("swift")} disabled={isSubmitting} />
              </div>
            </div>
          </div>

          {/* Saved Shares Summary */}
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
                    <div><span className="tag">{r.type}</span></div>
                    <div className="currency-cell" title={r.currency}>{r.currency}</div>
                    <div>{r.commitment}</div>
                    <div>{r.closing}</div>
                    <div className="dots">⋮</div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Active Tranche Inputs */}
          {orderedTranches.map((t, idx) => (
            <TranchCard 
              key={t.originalIndex}
              tranch={t}
              index={idx}
              realIndex={t.originalIndex}
              isLast={idx === orderedTranches.length - 1}
              lastTrancheRef={lastTrancheRef}
              classesLoading={classesLoading}
              dbShareClasses={dbShareClasses}
              currencies={currencies}
              currenciesLoading={currenciesLoading}
              periods={periods}
              isSubmitting={isSubmitting}
              onUpdateField={updateTrancheField}
              onSaveTranche={handleSaveTranche}
              totalTranches={tranches.length}
            />
          ))}

          <button type="button" className="new-tranch-btn" onClick={addNewTranche} disabled={isSubmitting}>
            <span className="new-tranch-plus">+</span>
            <span className="new-tranch-text">New Tranch</span>
          </button>
        </div>

        <div className="drawer-footer">
          <button className="btn-secondary-wide" type="button" onClick={handleClose} disabled={isSubmitting}>Cancel</button>
          <button 
            className="btn-primary-wide" 
            type="button" 
            onClick={handleSaveLP} 
            disabled={isSubmitting || !isFormValid}
          >
            {isSubmitting ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}