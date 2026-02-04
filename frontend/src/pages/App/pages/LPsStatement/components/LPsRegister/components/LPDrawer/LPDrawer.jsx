import React, { useEffect, useRef, useState, useMemo } from "react";
import { useParams } from "react-router-dom";
import { 
  CloseIcon, 
  ChevronDoubleLeftIcon, 
  ChevronDownIcon,
  LocationIcon 
} from "../../../../../Icons.jsx";

/* Hooks */
import { useCountries } from "../../../../../../../hooks/Reference/useCountries.js";
import { useShareClasses } from "../../../../../../../hooks/useShareClass.js";
import { useCurrencies } from "../../../../../../../hooks/Reference/useCurrencies.js";
import { useLimitedPartners } from "../../../../../../../hooks/LPsStatement/useLimitedPartners.jsx";
import { useLimitedPartnerFundCommitment } from "../../../../../../../hooks/LPsStatement/useLimitedPartnerFundCommitment.jsx";

/* Components */
import TranchCard from "./components/TranchCard.jsx";

/* Styles */
import "./LPDrawer.css";

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

const EMPTY_TRANCHE = {
  shareClassId: "",
  currencyId: "",
  commitment: "",
  closingId: "",
  collapsed: false,
};

export default function LPDrawer({ lp, existingCommitments = [], open, onClose, onSave, periods = [] }) {
  const { fundId } = useParams();
  const isEdit = !!lp;

  /* --- API Hooks --- */
  const { countries, isLoading: countriesLoading } = useCountries();
  const { data: dbShareClasses, isLoading: classesLoading } = useShareClasses(fundId);
  const { currencies, isLoading: currenciesLoading } = useCurrencies();
  const { createLimitedPartner, updateLimitedPartner } = useLimitedPartners();
  const { createCommitment, updateCommitment } = useLimitedPartnerFundCommitment(fundId);

  /* --- Local State --- */
  const [form, setForm] = useState(EMPTY_FORM);
  const [tranches, setTranches] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const lastTrancheRef = useRef(null);

  /**
   * Sync prop to state when drawer opens.
   */
  useEffect(() => {
    if (!open) return;

    if (isEdit) {
      setForm({
        lpName: lp.name || "",
        address: lp.address || "",
        city: lp.city || "",
        zip: lp.zip_code || "",
        countryId: lp.country_id || lp.country || "",
        iban: lp.iban || "",
        bankName: lp.bank_name || "",
        swift: lp.swift || "",
      });

      const mappedTranches = existingCommitments.map((c, idx) => ({
        commitment_id: c.commitment_id,
        shareClassId: c.share_class || "",
        currencyId: c.currency || "",
        commitment: c.commitment_amount ? parseFloat(c.commitment_amount) : "",
        closingId: c.closing_period || "",
        collapsed: true, // Collapse existing ones by default in Edit mode
        originalIndex: idx
      }));
      setTranches(mappedTranches);
    } else {
      setForm(EMPTY_FORM);
      setTranches([{ ...EMPTY_TRANCHE }]);
    }
  }, [lp, existingCommitments, open, isEdit]);

  /* --- Handlers --- */
  const updateField = (field) => (e) => {
    setForm(prev => ({ ...prev, [field]: e.target.value }));
  };

  const updateTrancheField = (index, field) => (e) => {
    const val = e.target.value;
    setTranches(prev => prev.map((t, i) => (i === index ? { ...t, [field]: val } : t)));
  };

  const handleSaveTranche = (idx) => {
    const t = tranches[idx];
    if (!t.shareClassId || !t.currencyId || !t.commitment || !t.closingId) {
      alert("Please fill all required fields.");
      return;
    }
    setTranches(prev => prev.map((x, i) => (i === idx ? { ...x, collapsed: !x.collapsed } : x)));
  };

  const addNewTranche = () => {
    setTranches(prev => [...prev, { ...EMPTY_TRANCHE, originalIndex: prev.length }]);
  };

  const handleFinalSave = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
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

      let currentLpId = lp?.lp_id;

      // 1. Create or Update the LP Meta
      if (isEdit) {
        await updateLimitedPartner(currentLpId, lpPayload);
      } else {
        const lpResponse = await createLimitedPartner(lpPayload);
        currentLpId = lpResponse.lp_id;
      }

      // 2. Process all Tranches
      const commitmentPromises = tranches.map(t => {
        if (!t.shareClassId || !t.currencyId || !t.closingId) return Promise.resolve();

        const payload = {
          lp: currentLpId,
          fund: parseInt(fundId, 10),
          share_class: parseInt(t.shareClassId, 10),
          currency: parseInt(t.currencyId, 10),
          closing_period: parseInt(t.closingId, 10),
          commitment_amount: parseFloat(t.commitment)
        };

        return t.commitment_id 
          ? updateCommitment(t.commitment_id, payload) 
          : createCommitment(payload);
      });

      await Promise.all(commitmentPromises);
      
      onSave?.(); 
      onClose();
    } catch (err) {
      console.error("Save failed:", err);
      alert("Failed to save: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <div className="drawer-backdrop" onClick={onClose}>
      <aside className="drawer lp-drawer" onClick={(e) => e.stopPropagation()}>
        <header className="drawer-header">
          <button className="drawer-back-btn" type="button" onClick={onClose}>
            <ChevronDoubleLeftIcon />
          </button>
          <div className="lp-drawer-title-group">
            <h2 className="drawer-title">{isEdit ? lp.name : "Adding a new LP"}</h2>
            {isEdit && <div className="lp-drawer-sub">Editing Limited Partner Details</div>}
          </div>
          <button className="drawer-close-btn" type="button" onClick={onClose}>
            <CloseIcon />
          </button>
        </header>

        <div className="drawer-content">
          <section className="drawer-section">
            <h3 className="drawer-section-title">LP informations</h3>
            <div className="field">
              <label className="field-label">LP name*</label>
              <input className="field-input" value={form.lpName} onChange={updateField("lpName")} disabled={isSubmitting} />
            </div>
            <div className="field">
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
                    <option value="" disabled hidden>Select Country</option>
                    {countries?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                  <span className="field-icon field-icon-chevron"><ChevronDownIcon /></span>
                </div>
              </div>
            </div>
          </section>

          <section className="drawer-section">
            <h3 className="drawer-section-title">Bank details</h3>
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
                <label className="field-label">SWIFT / BIC*</label>
                <input className="field-input" value={form.swift} onChange={updateField("swift")} disabled={isSubmitting} />
              </div>
            </div>
          </section>

          <section className="drawer-section">
            <h3 className="drawer-section-title">Shares & Tranches</h3>
            <div className="tranches-list">
              {tranches.map((t, idx) => (
                <TranchCard 
                  key={t.commitment_id || `tranch-${idx}`}
                  tranch={t}
                  index={idx}
                  realIndex={idx}
                  isLast={idx === tranches.length - 1}
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
            </div>
            <button type="button" className="new-tranch-btn" onClick={addNewTranche} disabled={isSubmitting}>
              <span className="new-tranch-plus">+</span>
              <span className="new-tranch-text">New Tranche</span>
            </button>
          </section>
        </div>

        <footer className="drawer-footer">
          <button className="btn-secondary-wide" type="button" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </button>
          <button className="btn-primary-wide" type="button" onClick={handleFinalSave} disabled={isSubmitting || !form.lpName}>
            {isSubmitting ? "Saving..." : isEdit ? "Save Changes" : "Create LP"}
          </button>
        </footer>
      </aside>
    </div>
  );
}