import React, { useCallback, useEffect, useMemo, useState } from "react";
import { CloseIcon, PlusIcon, TrashIcon, EditLineIcon } from "/src/components/Icons/InteractiveIcons";
import { ChevronDoubleLeftIcon } from "/src/components/Icons/DirectionIcons";
import SimpleDropdown from "/src/components/SearchBar/SimpleDropdown/SimpleDropdown.jsx";
import Toast from "../../../../../../components/Toast/Toast";
import { useToast } from "../../../../../../components/Toast/useToast";
import useApi from "/src/hooks/api/useApi";
import {
  mapDealDetailToForm,
  mapInfoFormToPayload,
  useDealExternalContactsBackend,
  useDealInfoBackend,
  useDealflowLookupOptions,
} from "../../Deals_backend_work";
import EventsTab from "../EventsTab/EventsTab";
import CapTable from "../CapTab/CapTable";
import Dataroom from "../DataroomTab/Dataroom";
import KPIsTab from "../KPIsTab/KPIsTab";
import OtherTab from "../OtherTab/OtherTab";
import "./InfoTab.css";

const VISIBLE_TABS = ["Information", "Events", "Cap table", "Dataroom", "Other"];
const NUMERIC_FIELDS = new Set(["ticket", "cashInAmount", "cashOutAmount", "coInvestorTicket"]);
const YES_NO_OPTIONS = [
  { id: "yes", name: "Yes" },
  { id: "no", name: "No" },
];

const createInitialForm = (deal) => ({
  dealName: deal?.name || "",
  codeName: deal?.code || "",
  sector: deal?.sectorId || null,
  businessDescription: "",
  status: deal?.statusId || null,
  statusReason: "",
  stage: deal?.stageId || null,
  fund: deal?.fundId || null,
  ticket: deal?.ticketAmount ?? "",
  currency: deal?.currencyId || null,
  pipelineEntryDate: "",
  latestUpdateAt: "",
  latestUpdateByName: "",
  legalForm: null,
  countriesOfOperations: "",
  valueCreationPotential: "",
  sourceType: null,
  operationType: null,
  cashInAmount: "",
  cashOutAmount: "",
  investmentInstruments: [],
  coInvestor: "",
  coInvestorType: null,
  coInvestorTicket: "",
  dealType: null,
  exitRoute: null,
  exitCounterparty: null,
  exitCounterpartyOther: "",
  exitHorizon: null,
  twoXChallenge: "",
  esgRisk: null,
  esgNotes: "",
  additionalNotes: "",
  emergingMarketThesis: "",
  teamMembers: [],
  externalContacts: [],

  // Legacy fields are kept in state and payload for backward compatibility.
  relevantInfo: "",
  countryOfIncorporation: null,
  countryOfMainOperation: null,
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

function formatDateLabel(value) {
  if (!value) return "";
  const parsed = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(parsed.getTime())) return String(value);
  return parsed.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatDateTimeLabel(value) {
  if (!value) return "";
  const parsed = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(parsed.getTime())) return String(value);
  return parsed.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getOptionById(options, value) {
  return (Array.isArray(options) ? options : []).find((option) => String(option?.id) === String(value)) || null;
}

function optionMatches(option, codes = []) {
  if (!option) return false;
  const candidates = [option?.code, option?.name]
    .map((value) => String(value || "").trim().toUpperCase().replace(/\s+/g, "_").replace(/-/g, "_"));
  return codes.some((code) => candidates.includes(String(code || "").trim().toUpperCase()));
}

function normalizeExternalContactsForCompare(contacts) {
  return (Array.isArray(contacts) ? contacts : [])
    .map((contact, index) => ({
      id: contact?.id ?? null,
      name: String(contact?.name ?? "").trim(),
      role: String(contact?.role ?? "").trim(),
      email: String(contact?.email ?? "").trim(),
      phone: String(contact?.phone ?? "").trim(),
      notes: String(contact?.notes ?? "").trim(),
      displayOrder: contact?.displayOrder ?? contact?.display_order ?? index + 1,
    }))
    .filter((contact) => contact.name || contact.role || contact.email || contact.phone || contact.notes);
}

function hasFormChanges(currentForm, loadedForm, lookupOptions) {
  return (
    JSON.stringify(mapInfoFormToPayload(currentForm, lookupOptions)) !==
      JSON.stringify(mapInfoFormToPayload(loadedForm, lookupOptions)) ||
    JSON.stringify(normalizeExternalContactsForCompare(currentForm?.externalContacts)) !==
      JSON.stringify(normalizeExternalContactsForCompare(loadedForm?.externalContacts))
  );
}

function MultiSelectField({ label, options, values, onToggle, disabled }) {
  return (
    <div className="it-field">
      <label className="it-label">{label}</label>
      <div className={`it-multi-select${disabled ? " it-multi-select--disabled" : ""}`}>
        {(Array.isArray(options) ? options : []).map((option) => {
          const isChecked = values.includes(option.id);
          return (
            <label key={option.id} className={`it-checkbox-pill${isChecked ? " is-checked" : ""}`}>
              <input
                type="checkbox"
                checked={isChecked}
                disabled={disabled}
                onChange={() => onToggle(option.id)}
              />
              <span>{option.name}</span>
            </label>
          );
        })}
        {(!Array.isArray(options) || options.length === 0) && (
          <div className="it-multi-select-empty">No instruments available yet.</div>
        )}
      </div>
    </div>
  );
}

function InfoTab({ deal, onClose, onSaved }) {
  const [activeTab, setActiveTab] = useState("Information");
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState(createInitialForm(deal));
  const [tabSave, setTabSave] = useState({ fn: null, cancelFn: null, isDirty: false, isSaving: false, isEditing: false });
  const [isCreatingTeamUser, setIsCreatingTeamUser] = useState(false);
  const [isCreatingTeamRole, setIsCreatingTeamRole] = useState(false);
  const { toast, showToast, closeToast } = useToast();
  const api = useApi();

  const {
    detail,
    isLoading: isDetailLoading,
    isSaving,
    error: detailError,
    loadDealDetail,
    saveDealDetail,
  } = useDealInfoBackend(deal?.id);

  const {
    contacts: externalContacts,
    isLoading: areExternalContactsLoading,
    isSaving: areExternalContactsSaving,
    error: externalContactsError,
    loadExternalContacts,
    createExternalContact,
    updateExternalContact,
    deleteExternalContact,
  } = useDealExternalContactsBackend(deal?.id);

  const {
    sectors,
    statuses,
    stages,
    sourceTypes,
    operationTypes,
    coInvestorTypes,
    exitRoutes,
    exitCounterparties,
    exitHorizons,
    esgRisks,
    investmentInstruments,
    dealTypes,
    legalForms,
    countries,
    currencies,
    funds,
    teamRoles,
    dealflowUsers,
    isLoading: areLookupsLoading,
    isSaving: areLookupsSaving,
    error: lookupError,
    createDealflowUser,
    createTeamRole,
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
    setForm((prev) => ({
      ...prev,
      externalContacts: Array.isArray(externalContacts) ? externalContacts : [],
    }));
  }, [externalContacts]);

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

  useEffect(() => {
    if (externalContactsError) {
      showToast({
        type: "error",
        title: "External contacts failed",
        message: externalContactsError,
      });
    }
  }, [externalContactsError, showToast]);

  const currentTitle = useMemo(() => form.dealName || deal?.name || "Deal", [form.dealName, deal?.name]);
  const isBusy = isDetailLoading || areLookupsLoading || areExternalContactsLoading || isSaving || areExternalContactsSaving;
  const lookupOptions = useMemo(() => ({ countries, currencies, funds }), [countries, currencies, funds]);
  const loadedReferenceForm = useMemo(() => {
    const base = detail
      ? mapDealDetailToForm(detail, lookupOptions)
      : createInitialForm(deal);
    return {
      ...base,
      externalContacts: Array.isArray(externalContacts) ? externalContacts : [],
    };
  }, [detail, lookupOptions, deal, externalContacts]);
  const isDirty = hasFormChanges(form, loadedReferenceForm, lookupOptions);

  const selectedStatus = useMemo(() => getOptionById(statuses, form.status), [statuses, form.status]);
  const selectedExitCounterparty = useMemo(
    () => getOptionById(exitCounterparties, form.exitCounterparty),
    [exitCounterparties, form.exitCounterparty]
  );
  const selectedFund = useMemo(() => getOptionById(funds, form.fund), [funds, form.fund]);
  const showStatusReason = optionMatches(selectedStatus, ["ON_HOLD", "DROPPED"]);
  const showCoInvestorFields = form.coInvestor === "yes";
  const showExitCounterpartyOther = optionMatches(selectedExitCounterparty, ["OTHER"]);
  const showEmergingMarketThesis = String(selectedFund?.name || "").toUpperCase().includes("AEE");
  const latestUpdateLabel = form.latestUpdateAt ? formatDateTimeLabel(form.latestUpdateAt) : "";
  const latestUpdateBy = String(form.latestUpdateByName || "").trim();

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
      [key]: NUMERIC_FIELDS.has(key) ? normalizeNumericInput(e.target.value) : e.target.value,
    }));

  const updateDirect = (key) => (value) =>
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));

  const toggleInvestmentInstrument = (instrumentId) =>
    setForm((prev) => {
      const current = Array.isArray(prev.investmentInstruments) ? prev.investmentInstruments : [];
      return {
        ...prev,
        investmentInstruments: current.includes(instrumentId)
          ? current.filter((id) => id !== instrumentId)
          : [...current, instrumentId],
      };
    });

  const addTeamMember = () =>
    setForm((prev) => ({
      ...prev,
      teamMembers: [
        ...prev.teamMembers,
        { id: `tm-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, userId: null, roleId: null, positionOrder: "" },
      ],
    }));

  const updateTeamMember = (rowId, key, value) =>
    setForm((prev) => ({
      ...prev,
      teamMembers: prev.teamMembers.map((member) => (member.id === rowId ? { ...member, [key]: value } : member)),
    }));

  const removeTeamMember = (rowId) =>
    setForm((prev) => ({
      ...prev,
      teamMembers: prev.teamMembers.filter((member) => member.id !== rowId),
    }));

  const addExternalContact = () =>
    setForm((prev) => ({
      ...prev,
      externalContacts: [
        ...prev.externalContacts,
        {
          id: `ec-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          name: "",
          role: "",
          email: "",
          phone: "",
          notes: "",
          displayOrder: prev.externalContacts.length + 1,
        },
      ],
    }));

  const updateExternalContactField = (rowId, key, value) =>
    setForm((prev) => ({
      ...prev,
      externalContacts: prev.externalContacts.map((contact) =>
        contact.id === rowId ? { ...contact, [key]: value } : contact
      ),
    }));

  const removeExternalContact = (rowId) =>
    setForm((prev) => ({
      ...prev,
      externalContacts: prev.externalContacts.filter((contact) => contact.id !== rowId),
    }));

  const syncExternalContacts = useCallback(async (nextContacts, previousContacts) => {
    const previousById = new Map(
      normalizeExternalContactsForCompare(previousContacts)
        .filter((contact) => contact.id)
        .map((contact) => [String(contact.id), contact])
    );
    const nextNormalized = normalizeExternalContactsForCompare(nextContacts);
    const nextIds = new Set(nextNormalized.filter((contact) => contact.id).map((contact) => String(contact.id)));

    for (let index = 0; index < nextNormalized.length; index += 1) {
      const contact = nextNormalized[index];
      const payload = {
        name: contact.name,
        role: contact.role,
        email: contact.email,
        phone: contact.phone,
        notes: contact.notes,
        display_order: index + 1,
      };

      if (contact.id && previousById.has(String(contact.id))) {
        await updateExternalContact(contact.id, payload);
      } else {
        await createExternalContact(payload);
      }
    }

    for (const previousContact of normalizeExternalContactsForCompare(previousContacts)) {
      if (!previousContact.id || nextIds.has(String(previousContact.id))) continue;
      await deleteExternalContact(previousContact.id);
    }

    return loadExternalContacts();
  }, [createExternalContact, updateExternalContact, deleteExternalContact, loadExternalContacts]);

  const validateInformationForm = useCallback(() => {
    if (!String(form.dealName || "").trim()) return "Deal Name is required.";
    if (!String(form.codeName || "").trim()) return "Code Name is required.";
    if (!form.stage) return "Deal Stage is required.";
    if (!form.legalForm) return "Legal Form is required.";
    if (!form.status) return "Status is required.";
    if (showStatusReason && !String(form.statusReason || "").trim()) return "Please provide the reason for this status.";
    if (!String(form.countriesOfOperations || "").trim()) return "Countries of Operations is required.";
    if (!form.fund) return "Fund is required.";
    if (!form.country) return "Country (HQ) is required.";
    if (!form.sector) return "Sector is required.";
    if (!String(form.businessDescription || "").trim()) return "Business Description is required.";
    if (!form.sourceType) return "Sourcing is required.";
    if (!form.operationType) return "Operation Type is required.";
    if (!String(form.ticket || "").trim()) return "Amethis Ticket is required.";
    if (!form.coInvestor) return "Co-investor is required.";
    if (showCoInvestorFields && !form.coInvestorType) return "Co-investor Type is required.";
    if (showCoInvestorFields && !String(form.coInvestorTicket || "").trim()) return "Co-investor Ticket is required.";
    if (!form.dealType) return "Investment Type is required.";
    if (!form.exitRoute) return "Exit Route is required.";
    if (!form.exitCounterparty) return "Exit Counterparty is required.";
    if (showExitCounterpartyOther && !String(form.exitCounterpartyOther || "").trim()) {
      return "Please specify the Exit Counterparty.";
    }
    if (!form.exitHorizon) return "Exit Horizon is required.";
    return null;
  }, [form, showCoInvestorFields, showExitCounterpartyOther, showStatusReason]);

  const handleSave = async () => {
    const validationMessage = validateInformationForm();
    if (validationMessage) {
      showToast({
        type: "error",
        title: "Missing information",
        message: validationMessage,
      });
      return;
    }

    const prevStageId = loadedReferenceForm.stage;
    const nextStageId = form.stage;
    const stageChanged = prevStageId !== nextStageId && nextStageId;

    try {
      const saved = await saveDealDetail(form, lookupOptions);
      const syncedExternalContacts = await syncExternalContacts(form.externalContacts, loadedReferenceForm.externalContacts);
      const refreshed = await loadDealDetail().catch(() => saved);
      const nextForm = mapDealDetailToForm(refreshed || saved, lookupOptions);
      setForm({
        ...nextForm,
        externalContacts: Array.isArray(syncedExternalContacts) ? syncedExternalContacts : nextForm.externalContacts,
      });
      setIsEditing(false);
      showToast({
        type: "success",
        title: "Saved",
        message: `"${saved.dealName}" has been updated successfully.`,
      });
      if (stageChanged && deal?.id) {
        const today = new Date().toISOString().slice(0, 10);
        await api.post(`/api/dealflow/deals/${deal.id}/stage-logs/`, {
          stage_id: nextStageId,
          event_date: today,
        }).catch(() => {});
      }
      await onSaved?.(refreshed || saved);
    } catch (err) {
      showToast({
        type: "error",
        title: "Save failed",
        message: err.message || "Could not save deal information.",
      });
    }
  };

  const handleCreateTeamUser = useCallback(async (payload) => {
    const normalizedName = String(payload?.name || "").trim();
    const normalizedEmail = String(payload?.email || "").trim();
    if (!normalizedName) return null;
    if (!normalizedEmail) {
      showToast({
        type: "error",
        title: "Email required",
        message: "Please enter an email for the new user.",
      });
      return null;
    }

    setIsCreatingTeamUser(true);
    try {
      const created = await createDealflowUser({
        name: normalizedName,
        email: normalizedEmail,
        role: "Member",
      });
      showToast({
        type: "success",
        title: "User created",
        message: `"${created.name}" has been added successfully.`,
      });
      return created.id;
    } catch (err) {
      showToast({
        type: "error",
        title: "User creation failed",
        message: err.message || "Could not create the user.",
      });
      return null;
    } finally {
      setIsCreatingTeamUser(false);
    }
  }, [createDealflowUser, showToast]);

  const handleCreateTeamRole = useCallback(async (payload) => {
    const normalizedName = String(payload?.name || payload || "").trim();
    if (!normalizedName) return null;

    setIsCreatingTeamRole(true);
    try {
      const created = await createTeamRole(normalizedName);
      showToast({
        type: "success",
        title: "Position created",
        message: `"${created.name}" has been added successfully.`,
      });
      return created.id;
    } catch (err) {
      showToast({
        type: "error",
        title: "Position creation failed",
        message: err.message || "Could not create the position.",
      });
      return null;
    } finally {
      setIsCreatingTeamRole(false);
    }
  }, [createTeamRole, showToast]);

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
          {VISIBLE_TABS.map((tab) => (
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
          {activeTab === "Events" && (
            <EventsTab
              dealId={deal?.id}
              onSaved={async () => {
                const refreshed = await loadDealDetail().catch(() => null);
                await onSaved?.(refreshed || detail || deal);
              }}
            />
          )}
          {activeTab === "Cap table" && <CapTable dealId={deal?.id} onSaveStateChange={setTabSave} />}
          {activeTab === "Dataroom" && <Dataroom dealId={deal?.id} />}
          {activeTab === "Other" && <OtherTab dealId={deal?.id} onSaveStateChange={setTabSave} />}

          {activeTab === "Information" && (
            <>
              <SectionHeader label="General Information" />

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
                  <label className="it-label">Deal Stage</label>
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
              </div>

              <div className="it-grid-3">
                <div className="it-field">
                  <label className="it-label">Legal Form</label>
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
                  <label className="it-label">Pipeline Entry Date</label>
                  <input className="it-input" value={formatDateLabel(form.pipelineEntryDate)} readOnly />
                </div>
                <div className="it-field">
                  <label className="it-label">Latest Update</label>
                  <input
                    className="it-input"
                    value={latestUpdateBy ? `${latestUpdateLabel} by ${latestUpdateBy}` : latestUpdateLabel}
                    readOnly
                  />
                </div>
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
                  <label className="it-label">Countries of Operations</label>
                  <input
                    className="it-input"
                    value={form.countriesOfOperations}
                    onChange={update("countriesOfOperations")}
                    placeholder="List countries of operations"
                    readOnly={!isEditing}
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

              {showStatusReason && (
                <div className="it-field">
                  <label className="it-label">Status Reason</label>
                  <textarea
                    className="it-textarea"
                    value={form.statusReason}
                    onChange={update("statusReason")}
                    placeholder="Provide the reason for this status"
                    readOnly={!isEditing}
                  />
                </div>
              )}

              <div className="it-grid-3">
                <div className="it-field">
                  <label className="it-label">Country (HQ)</label>
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
                <div className="it-field">
                  <label className="it-label">Sourcing</label>
                  <SimpleDropdown
                    options={sourceTypes}
                    value={form.sourceType}
                    onChange={updateDirect("sourceType")}
                    placeholder="Please select a sourcing type"
                    labelKey="name"
                    valueKey="id"
                    disabled={areLookupsLoading || !isEditing}
                  />
                </div>
              </div>

              <div className="it-field">
                <label className="it-label">Business Description</label>
                <textarea
                  className="it-textarea it-textarea--lg"
                  value={form.businessDescription}
                  onChange={update("businessDescription")}
                  placeholder="Describe the business activity"
                  readOnly={!isEditing}
                />
              </div>

              <div className="it-field">
                <label className="it-label">Value Creation Potential</label>
                <textarea
                  className="it-textarea"
                  value={form.valueCreationPotential}
                  onChange={update("valueCreationPotential")}
                  placeholder="Describe the value creation potential"
                  readOnly={!isEditing}
                />
              </div>

              <div className="it-grid-3">
                <div className="it-field">
                  <label className="it-label">Operation Type</label>
                  <SimpleDropdown
                    options={operationTypes}
                    value={form.operationType}
                    onChange={updateDirect("operationType")}
                    placeholder="Please select an operation type"
                    labelKey="name"
                    valueKey="id"
                    disabled={areLookupsLoading || !isEditing}
                  />
                </div>
              </div>

              <SectionHeader label="Investment & Deal Economics" />

              <div className="it-grid-3">
                <div className="it-field">
                  <label className="it-label">Amethis Ticket (m)</label>
                  <input
                    className="it-input"
                    value={form.ticket}
                    onChange={update("ticket")}
                    placeholder="Enter the Amethis ticket"
                    readOnly={!isEditing}
                  />
                </div>
                <div className="it-field">
                  <label className="it-label">Cash-in</label>
                  <input
                    className="it-input"
                    value={form.cashInAmount}
                    onChange={update("cashInAmount")}
                    placeholder="Cash-in amount"
                    readOnly={!isEditing}
                  />
                </div>
                <div className="it-field">
                  <label className="it-label">Cash-out</label>
                  <input
                    className="it-input"
                    value={form.cashOutAmount}
                    onChange={update("cashOutAmount")}
                    placeholder="Cash-out amount"
                    readOnly={!isEditing}
                  />
                </div>
              </div>

              <MultiSelectField
                label="Investment Instrument"
                options={investmentInstruments}
                values={Array.isArray(form.investmentInstruments) ? form.investmentInstruments : []}
                onToggle={toggleInvestmentInstrument}
                disabled={!isEditing}
              />

              <div className="it-grid-3">
                <div className="it-field">
                  <label className="it-label">Co-investor</label>
                  <SimpleDropdown
                    options={YES_NO_OPTIONS}
                    value={form.coInvestor}
                    onChange={updateDirect("coInvestor")}
                    placeholder="Please choose"
                    labelKey="name"
                    valueKey="id"
                    disabled={!isEditing}
                  />
                </div>
                <div className="it-field">
                  <label className="it-label">Investment Type</label>
                  <SimpleDropdown
                    options={dealTypes}
                    value={form.dealType}
                    onChange={updateDirect("dealType")}
                    placeholder="Please select an investment type"
                    labelKey="name"
                    valueKey="id"
                    disabled={areLookupsLoading || !isEditing}
                  />
                </div>
              </div>

              {showCoInvestorFields && (
                <div className="it-grid-3">
                  <div className="it-field">
                    <label className="it-label">Co-investor Type</label>
                    <SimpleDropdown
                      options={coInvestorTypes}
                      value={form.coInvestorType}
                      onChange={updateDirect("coInvestorType")}
                      placeholder="Please select a co-investor type"
                      labelKey="name"
                      valueKey="id"
                      disabled={areLookupsLoading || !isEditing}
                    />
                  </div>
                  <div className="it-field">
                    <label className="it-label">Co-investor Ticket (m)</label>
                    <input
                      className="it-input"
                      value={form.coInvestorTicket}
                      onChange={update("coInvestorTicket")}
                      placeholder="Enter the co-investor ticket"
                      readOnly={!isEditing}
                    />
                  </div>
                </div>
              )}

              <SectionHeader label="Exit" />

              <div className="it-grid-3">
                <div className="it-field">
                  <label className="it-label">Exit Route</label>
                  <SimpleDropdown
                    options={exitRoutes}
                    value={form.exitRoute}
                    onChange={updateDirect("exitRoute")}
                    placeholder="Please select an exit route"
                    labelKey="name"
                    valueKey="id"
                    disabled={areLookupsLoading || !isEditing}
                  />
                </div>
                <div className="it-field">
                  <label className="it-label">Exit Counterparty</label>
                  <SimpleDropdown
                    options={exitCounterparties}
                    value={form.exitCounterparty}
                    onChange={updateDirect("exitCounterparty")}
                    placeholder="Please select an exit counterparty"
                    labelKey="name"
                    valueKey="id"
                    disabled={areLookupsLoading || !isEditing}
                  />
                </div>
                <div className="it-field">
                  <label className="it-label">Exit Horizon</label>
                  <SimpleDropdown
                    options={exitHorizons}
                    value={form.exitHorizon}
                    onChange={updateDirect("exitHorizon")}
                    placeholder="Please select an exit horizon"
                    labelKey="name"
                    valueKey="id"
                    disabled={areLookupsLoading || !isEditing}
                  />
                </div>
              </div>

              {showExitCounterpartyOther && (
                <div className="it-field">
                  <label className="it-label">Other Exit Counterparty</label>
                  <input
                    className="it-input"
                    value={form.exitCounterpartyOther}
                    onChange={update("exitCounterpartyOther")}
                    placeholder="Please specify the counterparty"
                    readOnly={!isEditing}
                  />
                </div>
              )}

              <SectionHeader label="ESG & Impact" />

              <div className="it-grid-2">
                <div className="it-field">
                  <label className="it-label">2X Challenge</label>
                  <input
                    className="it-input"
                    value={form.twoXChallenge}
                    onChange={update("twoXChallenge")}
                    placeholder="Enter 2X Challenge information"
                    readOnly={!isEditing}
                  />
                </div>
                <div className="it-field">
                  <label className="it-label">E&S Risk</label>
                  <SimpleDropdown
                    options={esgRisks}
                    value={form.esgRisk}
                    onChange={updateDirect("esgRisk")}
                    placeholder="Please select an E&S risk"
                    labelKey="name"
                    valueKey="id"
                    disabled={areLookupsLoading || !isEditing}
                  />
                </div>
              </div>

              <div className="it-field">
                <label className="it-label">Notes</label>
                <textarea
                  className="it-textarea"
                  value={form.esgNotes}
                  onChange={update("esgNotes")}
                  placeholder="Add ESG and impact notes"
                  readOnly={!isEditing}
                />
              </div>

              <SectionHeader label="Additional Information" />

              <div className="it-field">
                <label className="it-label">Notes</label>
                <textarea
                  className="it-textarea it-textarea--lg"
                  value={form.additionalNotes}
                  onChange={update("additionalNotes")}
                  placeholder="Add any additional notes"
                  readOnly={!isEditing}
                />
              </div>

              {showEmergingMarketThesis && (
                <div className="it-field">
                  <label className="it-label">Emerging Market Thesis</label>
                  <textarea
                    className="it-textarea"
                    value={form.emergingMarketThesis}
                    onChange={update("emergingMarketThesis")}
                    placeholder="Describe the emerging market thesis"
                    readOnly={!isEditing}
                  />
                </div>
              )}

              <SectionHeader label="Deal Team & Support" />

              <div className="it-team-container">
                <table className="it-team-table">
                  <thead>
                    <tr>
                      <th className="it-team-th">Name</th>
                      <th className="it-team-th">Position</th>
                      {isEditing && <th className="it-team-th it-team-th--actions" />}
                    </tr>
                  </thead>
                  <tbody>
                    {form.teamMembers.map((member) => (
                      <tr key={member.id} className="it-team-row">
                        <td className="it-team-td">
                          <SimpleDropdown
                            options={dealflowUsers}
                            value={member.userId}
                            onChange={(value) => updateTeamMember(member.id, "userId", value)}
                            placeholder="Select a person"
                            labelKey="name"
                            valueKey="id"
                            disabled={(areLookupsLoading || areLookupsSaving) || !isEditing}
                            createOptionLabel="Add user"
                            onCreateOption={handleCreateTeamUser}
                            isCreatingOption={isCreatingTeamUser}
                            createFields={[
                              { key: "name", label: "Name", placeholder: "Full name", required: true },
                              { key: "email", label: "Email", placeholder: "Email address", required: true, type: "email" },
                            ]}
                          />
                        </td>
                        <td className="it-team-td">
                          <SimpleDropdown
                            options={teamRoles}
                            value={member.roleId}
                            onChange={(value) => updateTeamMember(member.id, "roleId", value)}
                            placeholder="Select a position"
                            labelKey="name"
                            valueKey="id"
                            disabled={(areLookupsLoading || areLookupsSaving) || !isEditing}
                            createOptionLabel="Add position"
                            onCreateOption={handleCreateTeamRole}
                            isCreatingOption={isCreatingTeamRole}
                            createFields={[
                              { key: "name", label: "Position", placeholder: "Position name", required: true },
                            ]}
                          />
                        </td>
                        {isEditing && (
                          <td className="it-team-td it-team-td--actions">
                            <button
                              type="button"
                              className="it-team-icon-btn"
                              onClick={() => removeTeamMember(member.id)}
                              aria-label="Remove member"
                            >
                              <TrashIcon />
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                    {form.teamMembers.length === 0 && (
                      <tr className="it-team-row">
                        <td className="it-team-td it-team-empty" colSpan={isEditing ? 3 : 2}>
                          No deal team members added yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                  <tfoot>
                    <tr className="it-team-footer-row">
                      <td colSpan={isEditing ? 3 : 2} />
                    </tr>
                  </tfoot>
                </table>
                {isEditing && (
                  <button type="button" className="it-new-user-btn" onClick={addTeamMember}>
                    <PlusIcon /> Add member
                  </button>
                )}
              </div>

              <SectionHeader label="External Contacts" />

              <div className="it-team-container">
                <table className="it-team-table it-team-table--wide">
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
                            onChange={(e) => updateExternalContactField(contact.id, "name", e.target.value)}
                            placeholder="Full name"
                            readOnly={!isEditing}
                          />
                        </td>
                        <td className="it-team-td">
                          <input
                            className="it-input"
                            value={contact.role}
                            onChange={(e) => updateExternalContactField(contact.id, "role", e.target.value)}
                            placeholder="e.g. CFO, CEO"
                            readOnly={!isEditing}
                          />
                        </td>
                        <td className="it-team-td">
                          <input
                            className="it-input"
                            type="email"
                            value={contact.email}
                            onChange={(e) => updateExternalContactField(contact.id, "email", e.target.value)}
                            placeholder="email@example.com"
                            readOnly={!isEditing}
                          />
                        </td>
                        <td className="it-team-td">
                          <input
                            className="it-input"
                            type="tel"
                            value={contact.phone}
                            onChange={(e) => updateExternalContactField(contact.id, "phone", e.target.value)}
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

              <SectionHeader label="KPIs & Configuration" />

              <div className="it-kpi-embed">
                <KPIsTab dealId={deal?.id} />
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
          {(activeTab === "Cap table" || activeTab === "Other") && tabSave.isEditing && (
            <button className="it-cancel-btn" onClick={tabSave.cancelFn}>
              Cancel
            </button>
          )}
          {(activeTab === "Cap table" || activeTab === "Other") && tabSave.isEditing && (
            <button className="it-save-btn" onClick={tabSave.fn} disabled={tabSave.isSaving || !tabSave.isDirty}>
              {tabSave.isSaving ? "Saving..." : "Save"}
            </button>
          )}
          {activeTab === "Other" && !tabSave.isEditing && (
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
