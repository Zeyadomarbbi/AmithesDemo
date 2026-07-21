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
  useDealflowFieldConfig,
  useDealInfoBackend,
  useDealflowLookupOptions,
} from "../../Deals_backend_work";
import EventsTab from "../EventsTab/EventsTab";
import CapTable from "../CapTab/CapTable";
import Dataroom from "../DataroomTab/Dataroom";
import KPIsTab from "../KPIsTab/KPIsTab";
import OtherTab from "../OtherTab/OtherTab";
import "./InfoTab.css";

const VISIBLE_TABS = ["Information"];
const NUMERIC_FIELDS = new Set(["ticket", "cashInAmount", "cashOutAmount", "coInvestorTicket"]);
const YES_NO_OPTIONS = [
  { id: "yes", name: "Yes" },
  { id: "no", name: "No" },
];
const DEFAULT_MANDATORY_FIELDS = {
  deal_name: true,
  code_name: true,
  deal_stage: true,
  legal_form: false,
  pipeline_entry_date: false,
  latest_update: false,
  status: true,
  status_reason: true,
  fund: true,
  country_hq: true,
  sector: true,
  business_description: true,
  value_creation_potential: false,
  sourcing: true,
  deal_team: true,
  external_contacts: true,
  countries_of_operations: false,
  region_of_operations: false,
  operation_type: true,
  amethis_ticket: true,
  ticket_currency: true,
  cash_in: false,
  cash_out: false,
  investment_instrument: false,
  investment_instrument_other: true,
  co_investor: true,
  co_investor_type: true,
  co_investor_ticket: true,
  investment_type: true,
  exit_route: true,
  exit_counterparty: false,
  exit_counterparty_other: true,
  exit_horizon: true,
  two_x_challenge: false,
  esg_risk: false,
  esg_notes: false,
  additional_notes: false,
  emerging_market_thesis: false,
};

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
  countriesOfOperations: [],
  regionOfOperations: [],
  valueCreationPotential: "",
  sourceType: null,
  operationType: null,
  cashInAmount: "",
  cashOutAmount: "",
  investmentInstruments: [],
  investmentInstrumentOtherText: "",
  coInvestor: "",
  coInvestorType: null,
  coInvestorTicket: "",
  dealType: null,
  exitRoute: null,
  exitCounterparty: [],
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

function FieldLabel({ children, required = false }) {
  return (
    <label className="it-label">
      {children}
      {required && <span className="it-label-required"> *</span>}
    </label>
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

function MultiSelectField({ label, options, values, onToggle, disabled, required = false, emptyText = "No options available yet." }) {
  return (
    <div className="it-field">
      <FieldLabel required={required}>{label}</FieldLabel>
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
          <div className="it-multi-select-empty">{emptyText}</div>
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
  const { fields: fieldConfig } = useDealflowFieldConfig();

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
    regionOptions,
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
  const mandatoryFieldMap = useMemo(() => {
    const next = { ...DEFAULT_MANDATORY_FIELDS };
    for (const field of Array.isArray(fieldConfig) ? fieldConfig : []) {
      if (!field?.fieldKey) continue;
      next[field.fieldKey] = Boolean(field.isMandatory);
    }
    return next;
  }, [fieldConfig]);
  const isMandatoryField = useCallback((fieldKey) => Boolean(mandatoryFieldMap[fieldKey]), [mandatoryFieldMap]);

  const selectedStatus = useMemo(() => getOptionById(statuses, form.status), [statuses, form.status]);
  const selectedExitCounterpartyOptions = useMemo(
    () => (Array.isArray(exitCounterparties) ? exitCounterparties : []).filter((option) =>
      (Array.isArray(form.exitCounterparty) ? form.exitCounterparty : []).includes(option.id)
    ),
    [exitCounterparties, form.exitCounterparty]
  );
  const selectedFund = useMemo(() => getOptionById(funds, form.fund), [funds, form.fund]);
  const selectedInvestmentInstrumentOptions = useMemo(
    () => (Array.isArray(investmentInstruments) ? investmentInstruments : []).filter((option) =>
      (Array.isArray(form.investmentInstruments) ? form.investmentInstruments : []).includes(option.id)
    ),
    [investmentInstruments, form.investmentInstruments]
  );
  const showStatusReason = optionMatches(selectedStatus, ["ON_HOLD", "DROPPED"]);
  const showCoInvestorFields = form.coInvestor === "yes";
  const showExitCounterpartyOther = selectedExitCounterpartyOptions.some((option) => optionMatches(option, ["OTHER"]));
  const showInvestmentInstrumentOther = selectedInvestmentInstrumentOptions.some((option) => optionMatches(option, ["OTHER"]));
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
      const nextValues = current.includes(instrumentId)
        ? current.filter((id) => id !== instrumentId)
        : [...current, instrumentId];
      const selectedOptions = (Array.isArray(investmentInstruments) ? investmentInstruments : []).filter((option) =>
        nextValues.includes(option.id)
      );
      return {
        ...prev,
        investmentInstruments: nextValues,
        investmentInstrumentOtherText: selectedOptions.some((option) => optionMatches(option, ["OTHER"]))
          ? prev.investmentInstrumentOtherText
          : "",
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
    if (isMandatoryField("deal_name") && !String(form.dealName || "").trim()) return "Deal Name is required.";
    if (isMandatoryField("code_name") && !String(form.codeName || "").trim()) return "Code Name is required.";
    if (isMandatoryField("deal_stage") && !form.stage) return "Deal Stage is required.";
    if (isMandatoryField("status") && !form.status) return "Status is required.";
    if (showStatusReason && isMandatoryField("status_reason") && !String(form.statusReason || "").trim()) return "Please provide the reason for this status.";
    if (isMandatoryField("fund") && !form.fund) return "Fund is required.";
    if (isMandatoryField("country_hq") && !form.country) return "Country (HQ) is required.";
    if (isMandatoryField("sector") && !form.sector) return "Sector is required.";
    if (isMandatoryField("legal_form") && !form.legalForm) return "Legal Form is required.";
    if (isMandatoryField("business_description") && !String(form.businessDescription || "").trim()) return "Business Description is required.";
    if (isMandatoryField("sourcing") && !form.sourceType) return "Sourcing is required.";
    if (isMandatoryField("operation_type") && !form.operationType) return "Operation Type is required.";
    if (isMandatoryField("amethis_ticket") && !String(form.ticket || "").trim()) return "Amethis Ticket is required.";
    if (isMandatoryField("ticket_currency") && !form.currency) return "Ticket Currency is required.";
    if (isMandatoryField("cash_in") && !String(form.cashInAmount || "").trim()) return "Cash-in is required.";
    if (isMandatoryField("cash_out") && !String(form.cashOutAmount || "").trim()) return "Cash-out is required.";
    if (isMandatoryField("countries_of_operations") && !(Array.isArray(form.countriesOfOperations) && form.countriesOfOperations.length > 0)) {
      return "Countries of Operations is required.";
    }
    if (isMandatoryField("region_of_operations") && !(Array.isArray(form.regionOfOperations) && form.regionOfOperations.length > 0)) {
      return "Region of Operations is required.";
    }
    if (isMandatoryField("investment_instrument") && !(Array.isArray(form.investmentInstruments) && form.investmentInstruments.length > 0)) {
      return "Investment Instrument is required.";
    }
    if (showInvestmentInstrumentOther && isMandatoryField("investment_instrument_other") && !String(form.investmentInstrumentOtherText || "").trim()) {
      return "Please specify the other investment instrument.";
    }
    if (isMandatoryField("co_investor") && !form.coInvestor) return "Co-investor is required.";
    if (showCoInvestorFields && isMandatoryField("co_investor_type") && !form.coInvestorType) return "Co-investor Type is required.";
    if (showCoInvestorFields && isMandatoryField("co_investor_ticket") && !String(form.coInvestorTicket || "").trim()) return "Co-investor Ticket is required.";
    if (isMandatoryField("investment_type") && !form.dealType) return "Investment Type is required.";
    if (isMandatoryField("exit_route") && !form.exitRoute) return "Exit Route is required.";
    if (isMandatoryField("exit_counterparty") && !(Array.isArray(form.exitCounterparty) && form.exitCounterparty.length > 0)) {
      return "Exit Counterparty is required.";
    }
    if (showExitCounterpartyOther && isMandatoryField("exit_counterparty_other") && !String(form.exitCounterpartyOther || "").trim()) {
      return "Please specify the Exit Counterparty.";
    }
    if (isMandatoryField("exit_horizon") && !form.exitHorizon) return "Exit Horizon is required.";
    const hasValidTeamMember = (Array.isArray(form.teamMembers) ? form.teamMembers : []).some(
      (member) => member?.userId && member?.roleId
    );
    if (isMandatoryField("deal_team") && !hasValidTeamMember) return "Deal Team & Support is required.";
    const hasValidExternalContact = (Array.isArray(form.externalContacts) ? form.externalContacts : []).some(
      (contact) => String(contact?.name || "").trim()
    );
    if (isMandatoryField("external_contacts") && !hasValidExternalContact) return "External Contacts is required.";
    return null;
  }, [form, isMandatoryField, showCoInvestorFields, showExitCounterpartyOther, showInvestmentInstrumentOther, showStatusReason]);

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
                  <FieldLabel required={isMandatoryField("deal_name")}>Deal Name</FieldLabel>
                  <input className="it-input" value={form.dealName} onChange={update("dealName")} placeholder="Deal name" readOnly={!isEditing} />
                </div>
                <div className="it-field">
                  <FieldLabel required={isMandatoryField("code_name")}>Code Name</FieldLabel>
                  <input className="it-input" value={form.codeName} onChange={update("codeName")} placeholder="Code name" readOnly={!isEditing} />
                </div>
                <div className="it-field">
                  <FieldLabel required={isMandatoryField("deal_stage")}>Deal Stage</FieldLabel>
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
                  <FieldLabel required={isMandatoryField("legal_form")}>Legal Form</FieldLabel>
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
                  <FieldLabel>Pipeline Entry Date</FieldLabel>
                  <input className="it-input" value={formatDateLabel(form.pipelineEntryDate)} readOnly />
                </div>
                <div className="it-field">
                  <FieldLabel>Latest Update</FieldLabel>
                  <input
                    className="it-input"
                    value={latestUpdateBy ? `${latestUpdateLabel} by ${latestUpdateBy}` : latestUpdateLabel}
                    readOnly
                  />
                </div>
              </div>

              <div className="it-grid-3">
                <div className="it-field">
                  <FieldLabel required={isMandatoryField("status")}>Status</FieldLabel>
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
                  <FieldLabel required={isMandatoryField("countries_of_operations")}>Countries of Operations</FieldLabel>
                  <SimpleDropdown
                    options={countries}
                    value={Array.isArray(form.countriesOfOperations) ? form.countriesOfOperations : []}
                    onChange={updateDirect("countriesOfOperations")}
                    placeholder="Select countries of operations"
                    labelKey="name"
                    valueKey="id"
                    disabled={areLookupsLoading || !isEditing}
                    isSingle={false}
                    searchLabel="Search countries..."
                  />
                </div>
                <div className="it-field">
                  <FieldLabel required={isMandatoryField("region_of_operations")}>Region of Operations</FieldLabel>
                  <SimpleDropdown
                    options={regionOptions}
                    value={Array.isArray(form.regionOfOperations) ? form.regionOfOperations : []}
                    onChange={updateDirect("regionOfOperations")}
                    placeholder="Please select regions"
                    labelKey="name"
                    valueKey="id"
                    disabled={areLookupsLoading || !isEditing}
                    isSingle={false}
                    searchLabel="Search regions..."
                  />
                </div>
              </div>

              <div className="it-grid-3">
                <div className="it-field">
                  <FieldLabel required={isMandatoryField("fund")}>Fund</FieldLabel>
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
                  <FieldLabel required={isMandatoryField("status_reason")}>Reason</FieldLabel>
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
                  <FieldLabel required={isMandatoryField("country_hq")}>Country (HQ)</FieldLabel>
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
                  <FieldLabel required={isMandatoryField("sector")}>Sector</FieldLabel>
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
                  <FieldLabel required={isMandatoryField("sourcing")}>Sourcing</FieldLabel>
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
                <FieldLabel required={isMandatoryField("business_description")}>Business Description</FieldLabel>
                <textarea
                  className="it-textarea it-textarea--lg"
                  value={form.businessDescription}
                  onChange={update("businessDescription")}
                  placeholder="Describe the business activity"
                  readOnly={!isEditing}
                />
              </div>

              <div className="it-field">
                <FieldLabel>Value Creation Potential</FieldLabel>
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
                  <FieldLabel required={isMandatoryField("operation_type")}>Operation Type</FieldLabel>
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
                  <FieldLabel required={isMandatoryField("amethis_ticket")}>Amethis Ticket (m)</FieldLabel>
                  <input
                    className="it-input"
                    value={form.ticket}
                    onChange={update("ticket")}
                    placeholder="Enter the Amethis ticket"
                    readOnly={!isEditing}
                  />
                </div>
                <div className="it-field">
                  <FieldLabel required={isMandatoryField("ticket_currency")}>Currency</FieldLabel>
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
                  <FieldLabel required={isMandatoryField("cash_in")}>Cash-in</FieldLabel>
                  <input
                    className="it-input"
                    value={form.cashInAmount}
                    onChange={update("cashInAmount")}
                    placeholder="Cash-in amount"
                    readOnly={!isEditing}
                  />
                </div>
                <div className="it-field">
                  <FieldLabel required={isMandatoryField("cash_out")}>Cash-out</FieldLabel>
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
                required={isMandatoryField("investment_instrument")}
                emptyText="No investment instruments available yet."
              />

              {showInvestmentInstrumentOther && (
                <div className="it-field">
                  <FieldLabel required={isMandatoryField("investment_instrument_other")}>Other Investment Instrument</FieldLabel>
                  <input
                    className="it-input"
                    value={form.investmentInstrumentOtherText}
                    onChange={update("investmentInstrumentOtherText")}
                    placeholder="Please specify the instrument"
                    readOnly={!isEditing}
                  />
                </div>
              )}

              <div className="it-grid-3">
                <div className="it-field">
                  <FieldLabel required={isMandatoryField("co_investor")}>Co-investor</FieldLabel>
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
                  <FieldLabel required={isMandatoryField("investment_type")}>Investment Type</FieldLabel>
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
                    <FieldLabel required={isMandatoryField("co_investor_type")}>Co-investor Type</FieldLabel>
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
                    <FieldLabel required={isMandatoryField("co_investor_ticket")}>Co-investor Ticket (m)</FieldLabel>
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
                  <FieldLabel required={isMandatoryField("exit_route")}>Exit Route</FieldLabel>
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
                  <FieldLabel required={isMandatoryField("exit_counterparty")}>Exit Counterparty</FieldLabel>
                  <SimpleDropdown
                    options={exitCounterparties}
                    value={form.exitCounterparty}
                    onChange={updateDirect("exitCounterparty")}
                    placeholder="Please select an exit counterparty"
                    labelKey="name"
                    valueKey="id"
                    disabled={areLookupsLoading || !isEditing}
                    isSingle={false}
                    searchLabel="Search counterparties..."
                  />
                </div>
                <div className="it-field">
                  <FieldLabel required={isMandatoryField("exit_horizon")}>Exit Horizon</FieldLabel>
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
                  <FieldLabel required={isMandatoryField("exit_counterparty_other")}>Other Exit Counterparty</FieldLabel>
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
                  <FieldLabel required={isMandatoryField("two_x_challenge")}>2X Challenge</FieldLabel>
                  <input
                    className="it-input"
                    value={form.twoXChallenge}
                    onChange={update("twoXChallenge")}
                    placeholder="Enter 2X Challenge information"
                    readOnly={!isEditing}
                  />
                </div>
                <div className="it-field">
                  <FieldLabel required={isMandatoryField("esg_risk")}>E&S Risk</FieldLabel>
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
                <FieldLabel required={isMandatoryField("esg_notes")}>Notes</FieldLabel>
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
                <FieldLabel required={isMandatoryField("additional_notes")}>Notes</FieldLabel>
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
                  <FieldLabel required={isMandatoryField("emerging_market_thesis")}>Emerging Market Thesis</FieldLabel>
                  <textarea
                    className="it-textarea"
                    value={form.emergingMarketThesis}
                    onChange={update("emergingMarketThesis")}
                    placeholder="Describe the emerging market thesis"
                    readOnly={!isEditing}
                  />
                </div>
              )}

              <SectionHeader label={`Deal Team & Support${isMandatoryField("deal_team") ? " *" : ""}`} />

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

              <SectionHeader label={`External Contacts${isMandatoryField("external_contacts") ? " *" : ""}`} />

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
