import React, { useEffect, useMemo, useState } from "react";
import { CloseIcon, PlusIcon, TrashIcon } from "/src/components/Icons/InteractiveIcons";
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
  teamMembers: [],
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

function normalizePositiveIntegerInput(value) {
  return String(value ?? "").replace(/[^\d]/g, "");
}

function buildInitials(name) {
  return String(name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("") || "U";
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
  const [form, setForm] = useState(createInitialForm(deal));
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
    teamRoles,
    dealflowUsers,
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

  const updateTeamMember = (rowId, key, value) =>
    setForm((prev) => ({
      ...prev,
      teamMembers: prev.teamMembers.map((member) =>
        member.id === rowId
          ? {
              ...member,
              [key]: key === "positionOrder" ? normalizePositiveIntegerInput(value) : value,
            }
          : member
      ),
    }));

  const addTeamMember = () =>
    setForm((prev) => ({
      ...prev,
      teamMembers: [
        ...prev.teamMembers,
        {
          id: `new-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          userId: null,
          roleId: null,
          positionOrder: String(prev.teamMembers.length + 1),
          userName: "",
          roleName: "",
        },
      ],
    }));

  const removeTeamMember = (rowId) =>
    setForm((prev) => ({
      ...prev,
      teamMembers: prev.teamMembers.filter((member) => member.id !== rowId),
    }));

  const teamRows = useMemo(
    () =>
      form.teamMembers.map((member) => {
        const selectedUser = dealflowUsers.find((option) => option.id === member.userId);
        const selectedRole = teamRoles.find((option) => option.id === member.roleId);
        return {
          ...member,
          userName: selectedUser?.raw?.name || member.userName || "",
          userLabel: selectedUser?.name || member.userName || "",
          roleName: selectedRole?.raw?.name || member.roleName || "",
        };
      }),
    [form.teamMembers, dealflowUsers, teamRoles]
  );

  const handleSave = async () => {
    try {
      const saved = await saveDealDetail(form, lookupOptions);
      setForm(mapDealDetailToForm(saved, lookupOptions));
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
          <button className="it-close-btn" onClick={onClose}>
            <CloseIcon />
          </button>
        </div>

        <div className="it-tabs">
          {TABS.map((tab) => (
            <button
              key={tab}
              className={`it-tab${activeTab === tab ? " active" : ""}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="it-body">
          {activeTab === "Events" && <EventsTab dealId={deal?.id} />}
          {activeTab === "Cap table" && <CapTable dealId={deal?.id} />}
          {activeTab === "Dataroom" && <Dataroom dealId={deal?.id} />}
          {activeTab === "KPIs" && <KPIsTab dealId={deal?.id} />}
          {activeTab === "Other" && <OtherTab dealId={deal?.id} />}

          {activeTab === "Information" && (
            <>
              <SectionHeader label="General information" />

              <div className="it-grid-3">
                <div className="it-field">
                  <label className="it-label">Deal Name</label>
                  <input className="it-input" value={form.dealName} onChange={update("dealName")} placeholder="Deal name" />
                </div>
                <div className="it-field">
                  <label className="it-label">Code Name</label>
                  <input className="it-input" value={form.codeName} onChange={update("codeName")} placeholder="Code name" />
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
                    disabled={areLookupsLoading}
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
                    disabled={areLookupsLoading}
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
                    disabled={areLookupsLoading}
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
                    disabled={areLookupsLoading}
                  />
                </div>
              </div>

              <div className="it-grid-2">
                <div className="it-field">
                  <label className="it-label">Ticket</label>
                  <input className="it-input" value={form.ticket} onChange={update("ticket")} placeholder="Please enter a ticket amount" />
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
                    disabled={areLookupsLoading}
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
                    disabled={areLookupsLoading}
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
                    disabled={areLookupsLoading}
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
                    disabled={areLookupsLoading}
                  />
                </div>
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
                    disabled={areLookupsLoading}
                  />
                </div>
                <div className="it-field">
                  <label className="it-label">Contact</label>
                  <input className="it-input" value={form.contact} onChange={update("contact")} placeholder="Please enter a contact" />
                </div>
              </div>

              <div className="it-field">
                <label className="it-label">Sponsor(s)</label>
                <input className="it-input" value={form.sponsors} onChange={update("sponsors")} placeholder="Please enter a sponsor" />
              </div>

              <div className="it-field">
                <label className="it-label">Relevant information</label>
                <textarea
                  className="it-textarea"
                  value={form.sourcingRelevantInfo}
                  onChange={update("sourcingRelevantInfo")}
                  placeholder="Please enter any relevant information regarding the sourcing"
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
                  disabled={areLookupsLoading}
                />
              </div>

              <div className="it-field">
                <label className="it-label">Relevant information</label>
                <textarea
                  className="it-textarea"
                  value={form.exitRelevantInfo}
                  onChange={update("exitRelevantInfo")}
                  placeholder="Please enter any relevant information regarding the exit"
                />
              </div>

              <SectionHeader label="Additional information" />

              <div className="it-grid-2">
                <div className="it-field">
                  <label className="it-label">Website</label>
                  <input className="it-input" value={form.website} onChange={update("website")} placeholder="Please enter a website" />
                </div>
                <div className="it-field">
                  <label className="it-label">Registration number</label>
                  <input
                    className="it-input"
                    value={form.registrationNumber}
                    onChange={update("registrationNumber")}
                    placeholder="Please enter a registration number"
                  />
                </div>
              </div>

              <div className="it-grid-4">
                <div className="it-field">
                  <label className="it-label">Address</label>
                  <input className="it-input" value={form.address} onChange={update("address")} placeholder="Please enter an address" />
                </div>
                <div className="it-field">
                  <label className="it-label">Zip Code</label>
                  <input className="it-input" value={form.zipCode} onChange={update("zipCode")} placeholder="Please enter a zip code" />
                </div>
                <div className="it-field">
                  <label className="it-label">City</label>
                  <input className="it-input" value={form.city} onChange={update("city")} placeholder="Please enter a city" />
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
                    disabled={areLookupsLoading}
                  />
                </div>
              </div>

              <SectionHeader label="Deal team & support" />

              <div className="it-team-container">
                <table className="it-team-table">
                  <thead>
                    <tr>
                      <th className="it-team-th">User</th>
                      <th className="it-team-th">Position</th>
                      <th className="it-team-th">Order</th>
                      <th className="it-team-th it-team-th--actions" />
                    </tr>
                  </thead>
                  <tbody>
                    {teamRows.map((member) => (
                      <tr key={member.id} className="it-team-row">
                        <td className="it-team-td">
                          <div className="it-user-cell">
                            <span className="it-user-avatar">{buildInitials(member.userName || member.userLabel)}</span>
                            <div className="it-team-select-wrap">
                              <SimpleDropdown
                                options={dealflowUsers}
                                value={member.userId}
                                onChange={(value) => updateTeamMember(member.id, "userId", value)}
                                placeholder="Select a user"
                                labelKey="name"
                                valueKey="id"
                                disabled={areLookupsLoading}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="it-team-td">
                          <SimpleDropdown
                            options={teamRoles}
                            value={member.roleId}
                            onChange={(value) => updateTeamMember(member.id, "roleId", value)}
                            placeholder="Select a role"
                            labelKey="name"
                            valueKey="id"
                            disabled={areLookupsLoading}
                          />
                        </td>
                        <td className="it-team-td">
                          <input
                            className="it-input it-team-order-input"
                            value={member.positionOrder}
                            onChange={(e) => updateTeamMember(member.id, "positionOrder", e.target.value)}
                            placeholder="1"
                          />
                        </td>
                        <td className="it-team-td it-team-td--actions">
                          <button
                            type="button"
                            className="it-team-icon-btn"
                            onClick={() => removeTeamMember(member.id)}
                            aria-label="Remove user"
                          >
                            <TrashIcon />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {teamRows.length === 0 && (
                      <tr className="it-team-row">
                        <td className="it-team-td it-team-empty" colSpan={4}>
                          No team members added yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                  <tfoot>
                    <tr className="it-team-footer-row">
                      <td colSpan={4} />
                    </tr>
                  </tfoot>
                </table>
                <button type="button" className="it-new-user-btn" onClick={addTeamMember}>
                  <PlusIcon /> New user
                </button>
              </div>
            </>
          )}
        </div>

        <div className="it-footer">
          {activeTab === "Information" && (
            <button className="it-save-btn" onClick={handleSave} disabled={isBusy || !isDirty}>
              {isSaving ? "Saving..." : isDetailLoading ? "Loading..." : "Save"}
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
