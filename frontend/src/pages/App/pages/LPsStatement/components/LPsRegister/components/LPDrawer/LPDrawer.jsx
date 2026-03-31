import React, { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import SearchableSelect from "../../../../../../../../components/SearchBar/SearchableSelect.jsx";
import SimpleDropdown from "../../../../../../../../components/SearchBar/SimpleDropdown/SimpleDropdown.jsx";
import { CloseIcon, PlusIcon } from "../../../../../../../../components/Icons/InteractiveIcons.jsx";
import { ChevronDoubleLeftIcon } from "../../../../../../../../components/Icons/DirectionIcons.jsx";
import { LocationIcon } from "../../../../../../../../components/Icons/MiscIcons.jsx";
import TranchCard from "./components/TranchCard.jsx";
import Toast from "../../../../../../components/Toast/Prompt.jsx";
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

export default function LPDrawer({ 
  lp, existingCommitments = [], open, onClose, onSave, periods = [],
  countries = [], countriesLoading = false,
  shareClasses: dbShareClasses = [], classesLoading = false,
  currencies = [], currenciesLoading = false,
  createCommitment,
  updateCommitment,
  deleteCommitment,
  createLimitedPartner,
  updateLimitedPartner,
  classColorMap = {}
}) {
  const { fundId } = useParams();
  const isEdit = !!lp;

  const [form, setForm] = useState(EMPTY_FORM);
  const [tranches, setTranches] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const lastTrancheRef = useRef(null);
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Prompt State
  const [promptConfig, setPromptConfig] = useState(null);

  useEffect(() => {
      if (!isEdit) return;

      const mappedTranches = existingCommitments.map((c, idx) => ({
          commitment_id: c.commitment_id,
          shareClassId: c.share_class_id || "",
          currencyId: c.currency_id || "",
          commitment: c.commitment_amount ? parseFloat(c.commitment_amount) : "",
          closingId: c.lps_fund_closing_period_id || "",
          collapsed: true,
          originalIndex: idx
      }));
      setTranches(mappedTranches);
  }, [existingCommitments, isEdit]);

  useEffect(() => {
      if (open && !isEdit) {
          const euroId = currencies?.find(c => c.code === "EUR")?.id ?? "";
          setForm(EMPTY_FORM);
          setTranches([{ ...EMPTY_TRANCHE, currencyId: euroId, originalIndex: 0 }]);
          setIsSubmitting(false);
      }
      if (open && isEdit) {
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
      }
      if (!open) {
        setIsExpanded(false);
        setPromptConfig(null);
      }
  }, [open, lp, isEdit, currencies]);

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
    const euroId = currencies?.find(c => c.code === "EUR")?.id ?? "";
    setTranches(prev => [...prev, { ...EMPTY_TRANCHE, currencyId: euroId, originalIndex: prev.length }]);
  };

  // -----------------------------------------------------
  // INTERCEPT: Final Save (Create LP, Edit LP, Save Tranches)
  // -----------------------------------------------------
  const confirmFinalSave = () => {
    if (!form.lpName) {
      alert("Please fill in the required fields (LP Name).");
      return;
    }
    
    setPromptConfig({
      type: "success",
      title: isEdit ? "Confirm Changes" : "Create New LP",
      message: isEdit 
        ? "Are you sure you want to save changes to this LP and its commitments?" 
        : "Are you sure you want to create this new Limited Partner?",
      confirmLabel: "Confirm",
      onConfirm: executeFinalSave
    });
  };

  const executeFinalSave = async () => {
    setPromptConfig(null);
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

      if (isEdit) {
        await updateLimitedPartner(currentLpId, lpPayload);
      } else {
        const lpResponse = await createLimitedPartner(lpPayload);
        currentLpId = lpResponse.lp_id;
      }

      const commitmentPromises = tranches.map(t => {
        if (!t.shareClassId || !t.currencyId || !t.closingId) return Promise.resolve();

        const payload = {
          lp_id: currentLpId,
          fund_id: parseInt(fundId, 10),
          share_class_id: parseInt(t.shareClassId, 10),
          currency_id: parseInt(t.currencyId, 10),
          lps_fund_closing_period_id: parseInt(t.closingId, 10),
          commitment_amount: parseFloat(t.commitment)
        };

        return t.commitment_id 
          ? updateCommitment(t.commitment_id, payload) 
          : createCommitment(payload);
      });

      await Promise.all(commitmentPromises);
      
      onSave?.(); 
      onClose();
      
    } catch (error) {
      console.error("Failed to save LP:", error);
      alert("An error occurred while saving.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // -----------------------------------------------------
  // INTERCEPT: Delete Tranche
  // -----------------------------------------------------
  const confirmDeleteTranche = (idx) => {
    setPromptConfig({
      type: "error",
      title: "Delete Commitment",
      message: "Are you sure you want to permanently delete this tranche?",
      confirmLabel: "Delete",
      onConfirm: () => executeDeleteTranche(idx)
    });
  };

  const executeDeleteTranche = async (idx) => {
    setPromptConfig(null);
    const t = tranches[idx];
    if (t.commitment_id) {
      try {
        await deleteCommitment(t.commitment_id);
      } catch (err) {
        alert("Failed to delete commitment.");
        return;
      }
    }
    setTranches(prev => prev.filter((_, i) => i !== idx));
  };

  const closePrompt = () => setPromptConfig(null);

  if (!open) return null;

  return (
    <div className="lp-drawer-backdrop">
      <aside 
        className={`lp-drawer ${isExpanded ? "lp-drawer--expanded" : ""}`}
        onClick={(e) => e.stopPropagation()}
      >
        <header className="lp-drawer-header">
          <div className="lp-drawer-header-actions">
            <button 
              type="button" 
              className="lp-drawer-back-btn" 
              onClick={() => setIsExpanded(prev => !prev)}
              style={{ transform: isExpanded ? "rotate(180deg)" : "none", transition: "transform 0.3s ease" }}
            >
              <ChevronDoubleLeftIcon />
            </button>
            <button 
              type="button" 
              className="lp-drawer-close-btn" 
              onClick={onClose}
            >
              <CloseIcon />
            </button>
          </div>
          
          <div className="lp-drawer-title-group">
            <h2 className="lp-drawer-title">{isEdit ? lp.name : "Adding a new LP"}</h2>
            {isEdit && <div className="lp-drawer-sub">Editing Limited Partner Details</div>}
          </div>
        </header>

        <div className="lp-drawer-content">
          <section className="lp-drawer-section">
            <h3 className="lp-drawer-section-title">LP information</h3>
            <div className="lp-drawer-field">
              <label className="lp-drawer-field-label">LP name<span className="lp-drawer-required">*</span></label>
              <input 
                className="lp-drawer-field-input" 
                value={form.lpName} 
                onChange={updateField("lpName")} 
                disabled={isSubmitting} 
              />
            </div>
            <div className="lp-drawer-field">
              <label className="lp-drawer-field-label">Adress<span className="lp-drawer-required"></span></label>
              <div className="lp-drawer-field-input-with-icon">
                <input 
                  className="lp-drawer-field-input" 
                  value={form.address} 
                  onChange={updateField("address")} 
                  disabled={isSubmitting} 
                />
                <span className="lp-drawer-field-icon"><LocationIcon /></span>
              </div>
            </div>
            <div className="lp-drawer-grid-3">
              <div className="lp-drawer-field">
                <label className="lp-drawer-field-label">City<span className="lp-drawer-required">*</span></label>
                <input 
                  className="lp-drawer-field-input" 
                  value={form.city} 
                  onChange={updateField("city")} 
                  disabled={isSubmitting} 
                />
              </div>
              <div className="lp-drawer-field">
                <label className="lp-drawer-field-label">Zip code<span className="lp-drawer-required">*</span></label>
                <input 
                  className="lp-drawer-field-input" 
                  value={form.zip} 
                  onChange={updateField("zip")} 
                  disabled={isSubmitting} 
                />
              </div>
              <div className="lp-drawer-field">
                <label className="lp-drawer-field-label">Country<span className="lp-drawer-required">*</span></label>
                  <SimpleDropdown
                      options={countries ?? []}
                      value={form.countryId}
                      onChange={(val) => setForm(prev => ({ ...prev, countryId: val }))}
                      placeholder="Select Country"
                      disabled={isSubmitting || countriesLoading}
                  />
              </div>
            </div>
          </section>

          <section className="lp-drawer-section">
            <h3 className="lp-drawer-section-title">Bank details</h3>
            <div className="lp-drawer-field">
              <label className="lp-drawer-field-label">IBAN<span className="lp-drawer-required">*</span></label>
              <input 
                className="lp-drawer-field-input" 
                value={form.iban} 
                onChange={updateField("iban")} 
                disabled={isSubmitting} 
              />
            </div>
            <div className="lp-drawer-grid-2">
              <div className="lp-drawer-field">
                <label className="lp-drawer-field-label">Bank name<span className="lp-drawer-required">*</span></label>
                <input 
                  className="lp-drawer-field-input" 
                  value={form.bankName} 
                  onChange={updateField("bankName")} 
                  disabled={isSubmitting} 
                />
              </div>
              <div className="lp-drawer-field">
                <label className="lp-drawer-field-label">SWIFT / BIC<span className="lp-drawer-required">*</span></label>
                <input 
                  className="lp-drawer-field-input" 
                  value={form.swift} 
                  onChange={updateField("swift")} 
                  disabled={isSubmitting} 
                />
              </div>
            </div>
          </section>
            
          <section className="lp-drawer-tranches-section">
            <h3 className="lp-drawer-section-title">Shares & Commitments ({tranches.length})</h3>
            {tranches.length > 0 && (
              <div className="lp-drawer-tranches-list">
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
                    onDeleteTranche={confirmDeleteTranche} 
                    onSaveTranche={handleSaveTranche}
                    classColorMap={classColorMap}
                  />
                ))}
              </div>
            )}
            <button 
              type="button" 
              className="lp-drawer-new-tranch-btn" 
              onClick={addNewTranche} 
              disabled={isSubmitting}
            >
              <span className="lp-drawer-new-tranch-plus"><PlusIcon /></span>
              <span className="lp-drawer-new-tranch-text">Commitment</span>
            </button>
          </section>
        </div>

        <footer className="lp-drawer-footer">
          <button 
            className="lp-drawer-btn-secondary-wide" 
            type="button" 
            onClick={onClose} 
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button 
            className="lp-drawer-btn-primary-wide" 
            type="button" 
            onClick={confirmFinalSave} 
            disabled={isSubmitting || !form.lpName}
          >
            {isSubmitting ? "Saving..." : isEdit ? "Save Changes" : "Create LP"}
          </button>
        </footer>
      </aside>

      {/* Render Prompt Modal conditionally */}
      {promptConfig && (
        <Toast
          type={promptConfig.type}
          title={promptConfig.title}
          message={promptConfig.message}
          confirmLabel={promptConfig.confirmLabel}
          onConfirm={promptConfig.onConfirm}
          onCancel={closePrompt}
        />
      )}
    </div>
  );
}