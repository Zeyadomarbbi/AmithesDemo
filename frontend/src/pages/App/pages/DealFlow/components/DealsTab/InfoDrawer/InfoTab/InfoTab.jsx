import React, { useEffect, useMemo, useState } from "react";
import { CloseIcon, PlusIcon, TrashIcon, EditLineIcon } from "/src/components/Icons/InteractiveIcons";
import { ChevronDoubleLeftIcon } from "/src/components/Icons/DirectionIcons";
import SimpleDropdown from "/src/components/SearchBar/SimpleDropdown/SimpleDropdown.jsx";
import Toast from "../../../../../../components/Toast/Toast";
import { useToast } from "../../../../../../components/Toast/useToast";
import {
  mapDealDetailToForm,
  mapInfoFormToPayload,
  useDealInfoBackend,
  useDealflowLookupOptions,
} from "../../Deals_backend_work";
import EventsTab from "../EventsTab/EventsTab";
import CapTable from "../CapTab/CapTable";
import Dataroom from "../DataroomTab/Dataroom";
import KPIsTab from "../KPIsTab/KPIsTab";
import OtherTab from "../OtherTab/OtherTab";
import "./InfoTab.css";

const TABS = ["Information", "Events", "Cap table", "Dataroom", "KPIs", "Other"];

const createInitialForm = (deal) => ({
  dealName: deal?.name || "",
  codeName: deal?.code || "",
  sector: deal?.sectorId || null,
  businessDescription: "",
  status: deal?.statusId || null,
  stage: deal?.stageId || null,
  fund: deal?.fundId || null,
  ticket: deal?.ticketAmount ?? "",
  currency: deal?.currencyId || null,
  dealType: null,
  relevantInfo: "",
  externalContacts: [],
  legalForm: null,
  countryOfIncorporation: null,
  countryOfMainOperation: null,
  sourceType: null,
  contact: "",
  sponsors: "",
  sourcingRelevantInfo: "",
  exitType: null,
  exitRelevantInfo: "",
  website: "",
  registrationNumber: "",
  address: "",
  zipCode: "",
  city: "",
  country: null,
});

function SectionHeader({ label }) {
  return (
    <div className="it-section-header">
      <span className="it-section-label">{label}</span>
    </div>
  );
}

function normalizeNumericInput(value) {
  return String(value ?? "").replace(/[^\d.,-]/g, "");
}

function hasFormChanges(currentForm, loadedForm, lookupOptions) {
  return (
    JSON.stringify(mapInfoFormToPayload(currentForm, lookupOptions)) !==
    JSON.stringify(mapInfoFormToPayload(loadedForm, lookupOptions))
  );
}

function InfoTab({ deal, onClose, onSaved }) {
  const [activeTab, setActiveTab] = useState("Information");
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState(createInitialForm(deal));
  const [tabSave, setTabSave] = useState({ fn: null, cancelFn: null, isDirty: false, isSaving: false, isEditing: false });
  const { toast, showToast, closeToast } = useToast();

  const {
    detail,
    isLoading: isDetailLoading,
    isSaving,
    error: detailError,
    saveDealDetail,
  } = useDealInfoBackend(deal?.id);

  const {
    sectors,
    statuses,
    stages,
    sourceTypes,
    exitTypes,
    legalForms,
    countries,
    currencies,
    funds,
    isLoading: areLookupsLoading,
    error: lookupError,
  } = useDealflowLookupOptions();

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  useEffect(() => {
    if (detail) {
      setForm(mapDealDetailToForm(detail, { countries, currencies, funds }));
      return;
    }
    setForm(createInitialForm(deal));
  }, [detail, deal?.id, countries, currencies, funds]);

  useEffect(() => {
    if (detailError) {
      showToast({
        type: "error",
        title: "Load failed",
        message: detailError,
      });
    }
  }, [detailError, showToast]);

  useEffect(() => {
    if (lookupError) {
      showToast({
        type: "error",
        title: "Options failed",
        message: lookupError,
      });
    }
  }, [lookupError, showToast]);

  const currentTitle = useMemo(() => form.dealName || deal?.name || "Deal", [form.dealName, deal?.name]);
  const isBusy = isDetailLoading || areLookupsLoading || isSaving;
  const lookupOptions = useMemo(() => ({ countries, currencies, funds }), [countries, currencies, funds]);
  const loadedReferenceForm = detail
    ? mapDealDetailToForm(detail, lookupOptions)
    : createInitialForm(deal);
  const isDirty = hasFormChanges(form, loadedReferenceForm, lookupOptions);

  const handleCancelEdit = () => {
    setForm(detail ? mapDealDetailToForm(detail, lookupOptions) : createInitialForm(deal));
    setIsEditing(false);
  };

  const handleTabChange = (tab) => {
    if (isEditing && activeTab === "Information") handleCancelEdit();
    setActiveTab(tab);
  };

  const update = (key) => (e) =>
    setForm((prev) => ({
      ...prev,
      [key]: key === "ticket" ? normalizeNumericInput(e.target.value) : e.target.value,
    }));

  const updateDirect = (key) => (value) =>
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));

  const addExternalContact = () =>
    setForm((prev) => ({
      ...prev,
      externalContacts: [
        ...prev.externalContacts,
        { id: `ec-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, name: "", role: "", email: "", phone: "" },
      ],
    }));

  const updateExternalContact = (rowId, key, value) =>
    setForm((prev) => ({
      ...prev,
      externalContacts: prev.externalContacts.map((c) =>
        c.id === rowId ? { ...c, [key]: value } : c
      ),
    }));

  const removeExternalContact = (rowId) =>
    setForm((prev) => ({
      ...prev,
      externalContacts: prev.externalContacts.filter((c) => c.id !== rowId),
    }));

  const handleSave = async () => {
    try {
      const saved = await saveDealDetail(form, lookupOptions);
      setForm(mapDealDetailToForm(saved, lookupOptions));
      setIsEditing(false);
      showToast({
        type: "success",
        title: "Saved",
        message: `"${saved.dealName}" has been updated successfully.`,
      });
      await onSaved?.(saved);
    } catch (err) {
      showToast({
        type: "error",
        title: "Save failed",
        message: err.message || "Could not save deal information.",
      });
    }
  };

  return (
    <div className="it-overlay" onClick={onClose}>
      <aside className={`it-drawer${isExpanded ? " it-drawer--expanded" : ""}`} onClick={(e) => e.stopPropagation()}>
        <div className="it-header">
          <button
            className="it-expand-btn"
            onClick={() => setIsExpanded((prev) => !prev)}
            style={{ transform: isExpanded ? "rotate(180deg)" : "none", transition: "transform 0.3s ease" }}
          >
            <ChevronDoubleLeftIcon />
          </button>
          <h2 className="it-company-name">{currentTitle}</h2>
          {activeTab === "Information" && !isEditing && (
            <button className="it-edit-btn" onClick={() => setIsEditing(true)} disabled={isDetailLoading}>
              <EditLineIcon /> Edit
            </button>
          )}
          <button className="it-close-btn" onClick={onClose}>
            <CloseIcon />
          </button>
        </div>

        <div className="it-tabs">
          {TABS.map((tab) => (
            <button
              key={tab}
              className={`it-tab${activeTab === tab ? " active" : ""}`}
              onClick={() => handleTabChange(tab)}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="it-body">
          {activeTab === "Events" && <EventsTab dealId={deal?.id} />}
          {activeTab === "Cap table" && <CapTable dealId={deal?.id} onSaveStateChange={setTabSave} />}
          {activeTab === "Dataroom" && <Dataroom dealId={deal?.id} />}
          {activeTab === "KPIs" && <KPIsTab dealId={deal?.id} onSaveStateChange={setTabSave} />}
          {activeTab === "Other" && <OtherTab dealId={deal?.id} onSaveStateChange={setTabSave} />}

          {activeTab === "Information" && (
            <>
              <SectionHeader label="General information" />

              <div className="it-grid-3">
                <div className="it-field">
                  <label className="it-label">Deal Name</label>
                  <input className="it-input" value={form.dealName} onChange={update("dealName")} placeholder="Deal name" readOnly={!isEditing} />
                </div>
                <div className="it-field">
                  <label className="it-label">Code Name</label>
                  <input className="it-input" value={form.codeName} onChange={update("codeName")} placeholder="Code name" readOnly={!isEditing} />
                </div>
                <div className="it-field">
                  <label className="it-label">Sector</label>
                  <SimpleDropdown
                    options={sectors}
                    value={form.sector}
                    onChange={updateDirect("sector")}
                    placeholder="Please select a sector"
                    labelKey="name"
                    valueKey="id"
                    disabled={areLookupsLoading || !isEditing}
                  />
                </div>
              </div>

              <div className="it-field">
                <label className="it-label">Business description</label>
                <textarea
                  className="it-textarea"
                  value={form.businessDescription}
                  onChange={update("businessDescription")}
                  placeholder="Please describe the business activity"
                  readOnly={!isEditing}
                />
              </div>

              <div className="it-grid-3">
                <div className="it-field">
                  <label className="it-label">Status</label>
                  <SimpleDropdown
                    options={statuses}
                    value={form.status}
                    onChange={updateDirect("status")}
                    placeholder="Please select a status"
                    labelKey="name"
                    valueKey="id"
                    disabled={areLookupsLoading || !isEditing}
                  />
                </div>
                <div className="it-field">
                  <label className="it-label">Stage</label>
                  <SimpleDropdown
                    options={stages}
                    value={form.stage}
                    onChange={updateDirect("stage")}
                    placeholder="Please select a stage"
                    labelKey="name"
                    valueKey="id"
                    disabled={areLookupsLoading || !isEditing}
                  />
                </div>
                <div className="it-field">
                  <label className="it-label">Fund</label>
                  <SimpleDropdown
                    options={funds}
                    value={form.fund}
                    onChange={updateDirect("fund")}
                    placeholder="Please select a fund"
                    labelKey="name"
                    valueKey="id"
                    disabled={areLookupsLoading || !isEditing}
                  />
                </div>
              </div>

              <div className="it-grid-3">
                <div className="it-field">
                  <label className="it-label">Ticket (m)</label>
                  <input className="it-input" value={form.ticket} onChange={update("ticket")} placeholder="Please enter a ticket amount" readOnly={!isEditing} />
                </div>
                <div className="it-field">
                  <label className="it-label">Currency</label>
                  <SimpleDropdown
                    options={currencies}
                    value={form.currency}
                    onChange={updateDirect("currency")}
                    placeholder="Please select a currency"
                    labelKey="name"
                    valueKey="id"
                    disabled={areLookupsLoading || !isEditing}
                  />
                </div>
                <div className="it-field">
                  <label className="it-label">Deal type</label>
                  <SimpleDropdown
                    options={[{ id: "minority", name: "Minority" }, { id: "majority", name: "Majority" }]}
                    value={form.dealType}
                    onChange={updateDirect("dealType")}
                    placeholder="Please select a deal type"
                    labelKey="name"
                    valueKey="id"
                    disabled={!isEditing}
                  />
                </div>
              </div>

              <div className="it-grid-3">
                <div className="it-field">
                  <label className="it-label">Legal form</label>
                  <SimpleDropdown
                    options={legalForms}
                    value={form.legalForm}
                    onChange={updateDirect("legalForm")}
                    placeholder="Please select a legal form"
                    labelKey="name"
                    valueKey="id"
                    disabled={areLookupsLoading || !isEditing}
                  />
                </div>
                <div className="it-field">
                  <label className="it-label">Country of incorporation</label>
                  <SimpleDropdown
                    options={countries}
                    value={form.countryOfIncorporation}
                    onChange={updateDirect("countryOfIncorporation")}
                    placeholder="Please select a country"
                    labelKey="name"
                    valueKey="id"
                    disabled={areLookupsLoading || !isEditing}
                  />
                </div>
                <div className="it-field">
                  <label className="it-label">Country of main operation</label>
                  <SimpleDropdown
                    options={countries}
                    value={form.countryOfMainOperation}
                    onChange={updateDirect("countryOfMainOperation")}
                    placeholder="Please select a country"
                    labelKey="name"
                    valueKey="id"
                    disabled={areLookupsLoading || !isEditing}
                  />
                </div>
              </div>

              <div className="it-field">
                <label className="it-label">Relevant information</label>
                <textarea
                  className="it-textarea"
                  value={form.relevantInfo}
                  onChange={update("relevantInfo")}
                  placeholder="Please enter any relevant information"
                  readOnly={!isEditing}
                />
              </div>

              <SectionHeader label="Sourcing" />

              <div className="it-grid-2">
                <div className="it-field">
                  <label className="it-label">Source type</label>
                  <SimpleDropdown
                    options={sourceTypes}
                    value={form.sourceType}
                    onChange={updateDirect("sourceType")}
                    placeholder="Please select a source type"
                    labelKey="name"
                    valueKey="id"
                    disabled={areLookupsLoading || !isEditing}
                  />
                </div>
                <div className="it-field">
                  <label className="it-label">Contact</label>
                  <input className="it-input" value={form.contact} onChange={update("contact")} placeholder="Please enter a contact" readOnly={!isEditing} />
                </div>
              </div>

              <div className="it-field">
                <label className="it-label">Sponsor(s)</label>
                <input className="it-input" value={form.sponsors} onChange={update("sponsors")} placeholder="Please enter a sponsor" readOnly={!isEditing} />
              </div>

              <div className="it-field">
                <label className="it-label">Relevant information</label>
                <textarea
                  className="it-textarea"
                  value={form.sourcingRelevantInfo}
                  onChange={update("sourcingRelevantInfo")}
                  placeholder="Please enter any relevant information regarding the sourcing"
                  readOnly={!isEditing}
                />
              </div>

              <SectionHeader label="Exit details" />

              <div className="it-field">
                <label className="it-label">Exit type</label>
                <SimpleDropdown
                  options={exitTypes}
                  value={form.exitType}
                  onChange={updateDirect("exitType")}
                  placeholder="Please select an exit type"
                  labelKey="name"
                  valueKey="id"
                  disabled={areLookupsLoading || !isEditing}
                />
              </div>

              <div className="it-field">
                <label className="it-label">Relevant information</label>
                <textarea
                  className="it-textarea"
                  value={form.exitRelevantInfo}
                  onChange={update("exitRelevantInfo")}
                  placeholder="Please enter any relevant information regarding the exit"
                  readOnly={!isEditing}
                />
              </div>

              <SectionHeader label="Additional information" />

              <div className="it-grid-2">
                <div className="it-field">
                  <label className="it-label">Website</label>
                  <input className="it-input" value={form.website} onChange={update("website")} placeholder="Please enter a website" readOnly={!isEditing} />
                </div>
                <div className="it-field">
                  <label className="it-label">Registration number</label>
                  <input
                    className="it-input"
                    value={form.registrationNumber}
                    onChange={update("registrationNumber")}
                    placeholder="Please enter a registration number"
                    readOnly={!isEditing}
                  />
                </div>
              </div>

              <div className="it-grid-4">
                <div className="it-field">
                  <label className="it-label">Address</label>
                  <input className="it-input" value={form.address} onChange={update("address")} placeholder="Please enter an address" readOnly={!isEditing} />
                </div>
                <div className="it-field">
                  <label className="it-label">Zip Code</label>
                  <input className="it-input" value={form.zipCode} onChange={update("zipCode")} placeholder="Please enter a zip code" readOnly={!isEditing} />
                </div>
                <div className="it-field">
                  <label className="it-label">City</label>
                  <input className="it-input" value={form.city} onChange={update("city")} placeholder="Please enter a city" readOnly={!isEditing} />
                </div>
                <div className="it-field">
                  <label className="it-label">Country</label>
                  <SimpleDropdown
                    options={countries}
                    value={form.country}
                    onChange={updateDirect("country")}
                    placeholder="Please select a country"
                    labelKey="name"
                    valueKey="id"
                    disabled={areLookupsLoading || !isEditing}
                  />
                </div>
              </div>

              <SectionHeader label="External contacts" />

              <div className="it-team-container">
                <table className="it-team-table">
                  <thead>
                    <tr>
                      <th className="it-team-th">Name</th>
                      <th className="it-team-th">Role</th>
                      <th className="it-team-th">Email</th>
                      <th className="it-team-th">Phone</th>
                      {isEditing && <th className="it-team-th it-team-th--actions" />}
                    </tr>
                  </thead>
                  <tbody>
                    {form.externalContacts.map((contact) => (
                      <tr key={contact.id} className="it-team-row">
                        <td className="it-team-td">
                          <input
                            className="it-input"
                            value={contact.name}
                            onChange={(e) => updateExternalContact(contact.id, "name", e.target.value)}
                            placeholder="Full name"
                            readOnly={!isEditing}
                          />
                        </td>
                        <td className="it-team-td">
                          <input
                            className="it-input"
                            value={contact.role}
                            onChange={(e) => updateExternalContact(contact.id, "role", e.target.value)}
                            placeholder="e.g. CFO, CEO"
                            readOnly={!isEditing}
                          />
                        </td>
                        <td className="it-team-td">
                          <input
                            className="it-input"
                            type="email"
                            value={contact.email}
                            onChange={(e) => updateExternalContact(contact.id, "email", e.target.value)}
                            placeholder="email@example.com"
                            readOnly={!isEditing}
                          />
                        </td>
                        <td className="it-team-td">
                          <input
                            className="it-input"
                            type="tel"
                            value={contact.phone}
                            onChange={(e) => updateExternalContact(contact.id, "phone", e.target.value)}
                            placeholder="+1 234 567 890"
                            readOnly={!isEditing}
                          />
                        </td>
                        {isEditing && (
                          <td className="it-team-td it-team-td--actions">
                            <button
                              type="button"
                              className="it-team-icon-btn"
                              onClick={() => removeExternalContact(contact.id)}
                              aria-label="Remove contact"
                            >
                              <TrashIcon />
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                    {form.externalContacts.length === 0 && (
                      <tr className="it-team-row">
                        <td className="it-team-td it-team-empty" colSpan={isEditing ? 5 : 4}>
                          No external contacts added yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                  <tfoot>
                    <tr className="it-team-footer-row">
                      <td colSpan={isEditing ? 5 : 4} />
                    </tr>
                  </tfoot>
                </table>
                {isEditing && (
                  <button type="button" className="it-new-user-btn" onClick={addExternalContact}>
                    <PlusIcon /> New contact
                  </button>
                )}
              </div>
            </>
          )}
        </div>

        <div className="it-footer">
          {activeTab === "Information" && isEditing && (
            <>
              <button className="it-cancel-btn" onClick={handleCancelEdit}>
                Cancel
              </button>
              <button className="it-save-btn" onClick={handleSave} disabled={isBusy || !isDirty}>
                {isSaving ? "Saving..." : "Save"}
              </button>
            </>
          )}
          {(activeTab === "Cap table" || activeTab === "KPIs" || activeTab === "Other") && tabSave.isEditing && (
            <button className="it-cancel-btn" onClick={tabSave.cancelFn}>
              Cancel
            </button>
          )}
          {(activeTab === "Cap table" || activeTab === "KPIs" || activeTab === "Other") && tabSave.isEditing && (
            <button className="it-save-btn" onClick={tabSave.fn} disabled={tabSave.isSaving || !tabSave.isDirty}>
              {tabSave.isSaving ? "Saving..." : "Save"}
            </button>
          )}
          {(activeTab === "KPIs" || activeTab === "Other") && !tabSave.isEditing && (
            <button className="it-save-btn" onClick={tabSave.fn} disabled={tabSave.isSaving || !tabSave.isDirty}>
              {tabSave.isSaving ? "Saving..." : "Save"}
            </button>
          )}
        </div>

        {toast && (
          <Toast
            key={toast.key}
            title={toast.title}
            message={toast.message}
            type={toast.type}
            duration={toast.duration}
            onClose={closeToast}
          />
        )}
      </aside>
    </div>
  );
}

export default InfoTab;
