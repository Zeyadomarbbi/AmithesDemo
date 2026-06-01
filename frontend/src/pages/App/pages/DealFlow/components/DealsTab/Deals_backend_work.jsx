import { useCallback, useEffect, useMemo, useState } from "react";
import useApi from "../../../../../../hooks/api/useApi";
import { useCountries } from "../../../../hooks/Reference/useCountries";
import { useCurrencies } from "../../../../hooks/Reference/useCurrencies";

const DEALFLOW_DEALS_ENDPOINT = "/api/dealflow/deals/";
const DEALFLOW_TAXONOMY_ENDPOINT = "/api/dealflow/taxonomy/";
const DEALFLOW_FUNDS_ENDPOINT = "/api/dealflow/funds/";
const DEALFLOW_USERS_ENDPOINT = "/api/dealflow/users/";
const SHARED_FUNDS_ENDPOINT = "/api/funds/";

function toSafeArray(value) {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.results)) return value.results;
  if (Array.isArray(value?.rows)) return value.rows;
  return [];
}

function pickName(row) {
  return (
    row?.name ??
    row?.deal_name ??
    row?.company_name ??
    row?.company?.name ??
    ""
  );
}

function pickCode(row) {
  return (
    row?.code ??
    row?.deal_code ??
    row?.company_code ??
    row?.company?.code ??
    ""
  );
}

function pickFundName(row) {
  return (
    row?.fund_name ??
    row?.fundLabel ??
    row?.fund_info?.name ??
    row?.fund_details?.name ??
    row?.fund_obj?.name ??
    row?.fund_data?.name ??
    row?.fundRelation?.name ??
    row?.fundRecord?.name ??
    row?.fundItem?.name ??
    row?.fundEntity?.name ??
    row?.fundModel?.name ??
    row?.fundObject?.name ??
    row?.fundNested?.name ??
    row?.fund_row?.name ??
    row?.fundRow?.name ??
    row?.fundRef?.name ??
    row?.fund_value?.name ??
    row?.fundValue?.name ??
    row?.fundMeta?.name ??
    row?.fund_meta?.name ??
    row?.fund_rel?.name ??
    row?.fund_data_row?.name ??
    row?.fund_data_obj?.name ??
    row?.fundJoined?.name ??
    row?.fund_lookup?.name ??
    row?.fundLookup?.name ??
    row?.fundJoinedRow?.name ??
    row?.fund_joined?.name ??
    row?.fundRelationRow?.name ??
    row?.fund_record?.name ??
    row?.fund?.name ??
    ""
  );
}

function pickTaxonomyName(row, keys) {
  for (const key of keys) {
    const direct = row?.[key];
    if (typeof direct === "string" && direct.trim()) return direct;
    if (direct && typeof direct === "object") {
      if (typeof direct.name === "string" && direct.name.trim()) return direct.name;
      if (typeof direct.label === "string" && direct.label.trim()) return direct.label;
    }
  }
  return "";
}

function pickCountryInfo(row) {
  const countryObject =
    row?.country ??
    row?.geography ??
    row?.country_details ??
    row?.country_info ??
    row?.geography_info ??
    row?.company?.country ??
    row?.company?.country_of_main_operation ??
    row?.country_of_main_operation ??
    null;

  const countryName =
    (typeof countryObject === "object" && (countryObject?.name || countryObject?.label)) ||
    row?.country_name ||
    row?.geography_name ||
    row?.country_code ||
    row?.country ||
    "";

  const iso2 =
    (typeof countryObject === "object" && (countryObject?.iso2 || countryObject?.code)) ||
    row?.country_iso2 ||
    row?.iso2 ||
    "";

  return {
    name: typeof countryName === "string" ? countryName : "",
    iso2: typeof iso2 === "string" ? iso2.toLowerCase() : "",
  };
}

function formatTicketAmount(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return "";
  return numeric.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

function normalizeDealRow(row) {
  const country = pickCountryInfo(row);
  const ticketAmount =
    row?.ticket_amount ??
    row?.ticketAmount ??
    row?.investment_amount ??
    row?.amount ??
    null;

  return {
    id: row?.id ?? row?.deal_id ?? row?.uuid ?? null,
    name: pickName(row),
    code: pickCode(row),
    fund: pickFundName(row),
    fundId: row?.fund_id ?? row?.fundId ?? row?.fund?.id ?? null,
    status: pickTaxonomyName(row, ["status_name", "status", "status_item", "status_details"]),
    statusId: row?.status_id ?? row?.statusId ?? row?.status?.id ?? null,
    stage: pickTaxonomyName(row, ["stage_name", "stage", "stage_item", "stage_details"]),
    stageId: row?.stage_id ?? row?.stageId ?? row?.stage?.id ?? null,
    sector: pickTaxonomyName(row, ["sector_name", "sector", "sector_item", "sector_details", "company_sector"]),
    sectorId: row?.sector_id ?? row?.sectorId ?? row?.company?.sector_id ?? null,
    ticket: formatTicketAmount(ticketAmount),
    ticketAmount,
    currency:
      pickTaxonomyName(row, ["currency_name", "currency", "currency_item", "currency_details"]) ||
      row?.currency_code ||
      "",
    currencyId: row?.currency_id ?? row?.currencyId ?? row?.currency?.id ?? null,
    iso2: country.iso2,
    country: country.name,
    companyId: row?.company_id ?? row?.companyId ?? row?.company?.id ?? null,
    createdBy: row?.created_by ?? row?.createdBy ?? null,
    createdAt: row?.created_at ?? row?.createdAt ?? null,
    updatedAt: row?.updated_at ?? row?.updatedAt ?? null,
    rawDeal: row,
    rawCompany: row?.company ?? null,
  };
}

function normalizeDealList(payload) {
  return toSafeArray(payload)
    .map(normalizeDealRow)
    .filter((row) => row.id);
}

function enrichDealListRows(rows, countries, currencies) {
  const countryById = new Map(
    toSafeArray(countries)
      .filter((row) => row?.dealflowId || row?.id)
      .map((row) => [String(row.dealflowId || row.id), row])
  );
  const currencyById = new Map(
    toSafeArray(currencies)
      .filter((row) => row?.dealflowId || row?.id)
      .map((row) => [String(row.dealflowId || row.id), row])
  );

  return toSafeArray(rows).map((row) => {
    const countryMatch = row?.rawDeal?.country_id ? countryById.get(String(row.rawDeal.country_id)) : null;
    const currencyMatch = row?.currencyId ? currencyById.get(String(row.currencyId)) : null;
    const mappedIso2 =
      countryMatch?.raw?.iso2 ||
      countryMatch?.raw?.iso2_code ||
      countryMatch?.raw?.code ||
      row?.iso2 ||
      "";

    return {
      ...row,
      country: row?.country || countryMatch?.name || "",
      iso2: String(mappedIso2 || "").trim().toLowerCase(),
      currency: row?.currency || currencyMatch?.name || "",
    };
  });
}

function formatDropdownOptions(rows, { labelBuilder = null } = {}) {
  return toSafeArray(rows).map((row) => ({
    id: row?.id,
    name: typeof labelBuilder === "function" ? labelBuilder(row) : row?.name || row?.code || "",
    code: row?.code || "",
    color: row?.color || "",
    dealflowId: row?.dealflowId ?? row?.raw?.dealflowId ?? null,
    raw: row,
  }));
}

function normalizeLookupText(value) {
  return String(value ?? "").trim().toLowerCase();
}

function isUuidLike(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    String(value ?? "").trim()
  );
}

function buildTaxonomyMatchMaps(rows) {
  const byCode = new Map();
  const byName = new Map();

  toSafeArray(rows).forEach((row) => {
    const code = normalizeLookupText(row?.code);
    const name = normalizeLookupText(row?.name);
    if (code) byCode.set(code, row);
    if (name) byName.set(name, row);
  });

  return { byCode, byName };
}

function mapSharedOptionToDealflowId(rows, taxonomyRows, kind) {
  const { byCode, byName } = buildTaxonomyMatchMaps(taxonomyRows);

  return toSafeArray(rows).map((row) => {
    const possibleCodes =
      kind === "country"
        ? [row?.code, row?.iso2, row?.iso2_code, row?.iso3, row?.iso3_code]
        : [row?.code, row?.currency_code, row?.iso_code];

    const possibleNames =
      kind === "country"
        ? [row?.name, row?.country_name]
        : [row?.name, row?.currency_name];

    const matchedByCode = possibleCodes
      .map((value) => byCode.get(normalizeLookupText(value)))
      .find(Boolean);

    const matchedByName = possibleNames
      .map((value) => byName.get(normalizeLookupText(value)))
      .find(Boolean);

    const matched = matchedByCode || matchedByName;

    return {
      ...row,
      id: row?.id ?? null,
      dealflowId: matched?.id ?? null,
      code: row?.code || row?.iso2 || row?.currency_code || "",
    };
  });
}

function mapSharedFundsToDealflowId(rows, dealflowFunds) {
  const dealflowByName = new Map();

  toSafeArray(dealflowFunds).forEach((row) => {
    const name = normalizeLookupText(row?.name);
    if (name) dealflowByName.set(name, row);
  });

  return toSafeArray(rows).map((row) => {
    const legalName = row?.legal_name ?? row?.name ?? "";
    const shortName = row?.short_name ?? row?.shortName ?? "";
    const matched =
      dealflowByName.get(normalizeLookupText(legalName)) ||
      dealflowByName.get(normalizeLookupText(shortName)) ||
      null;

    return {
      ...row,
      id: row?.fund_id ?? row?.id ?? null,
      name: legalName || shortName || "",
      code: shortName || "",
      dealflowId: matched?.id ?? null,
    };
  });
}

function findOptionBySourceId(options, value) {
  const normalized = String(value ?? "").trim();
  if (!normalized) return null;
  return toSafeArray(options).find((option) => String(option?.id ?? "").trim() === normalized) || null;
}

function findOptionByDealflowId(options, value) {
  const normalized = String(value ?? "").trim();
  if (!normalized) return null;
  return (
    toSafeArray(options).find(
      (option) =>
        String(option?.dealflowId ?? "").trim() === normalized ||
        String(option?.id ?? "").trim() === normalized
    ) || null
  );
}

function mapSourceIdToDealflowId(value, options) {
  if (["", null, undefined].includes(value)) return null;
  if (isUuidLike(value)) return String(value);
  return findOptionBySourceId(options, value)?.dealflowId ?? null;
}

function mapDealflowIdToSourceId(value, options) {
  if (["", null, undefined].includes(value)) return null;
  if (!isUuidLike(value)) return value;
  return findOptionByDealflowId(options, value)?.id ?? null;
}

function mapDealflowFundIdToSourceId(value, options, fallbackName = "") {
  const directMatch = mapDealflowIdToSourceId(value, options);
  if (directMatch) return directMatch;

  const normalizedFallbackName = normalizeLookupText(fallbackName);
  if (!normalizedFallbackName) return null;

  return (
    toSafeArray(options).find((option) => {
      const raw = option?.raw || {};
      return (
        normalizeLookupText(option?.name) === normalizedFallbackName ||
        normalizeLookupText(raw?.legal_name) === normalizedFallbackName ||
        normalizeLookupText(raw?.short_name) === normalizedFallbackName
      );
    })?.id ?? null
  );
}

function normalizeDealDetail(payload) {
  const row = payload || {};

  return {
    id: row?.id ?? row?.deal_id ?? null,
    dealName: row?.name ?? "",
    codeName: row?.code ?? "",
    sector: row?.company?.sector_id ?? row?.sector?.id ?? null,
    businessDescription: row?.company?.business_activity ?? "",
    status: row?.status?.id ?? row?.status_id ?? null,
    stage: row?.stage?.id ?? row?.stage_id ?? null,
    fund: row?.fund?.id ?? row?.fund_id ?? null,
    fundName: row?.fund?.name ?? "",
    ticket: row?.ticket_amount ?? "",
    currency: row?.currency?.id ?? row?.currency_id ?? null,
    legalForm: row?.company?.legal_form_id ?? row?.legal_form?.id ?? null,
    countryOfIncorporation: row?.company?.country_of_incorporation_id ?? row?.country_of_incorporation?.id ?? null,
    countryOfMainOperation: row?.company?.country_of_main_operation_id ?? row?.country_of_main_operation?.id ?? null,
    sourceType: row?.source_type?.id ?? row?.source_type_id ?? null,
    contact: row?.contact?.name ?? "",
    sponsors: row?.company?.sponsor ?? "",
    sourcingRelevantInfo: row?.sourcing_relevant_information ?? "",
    exitType: row?.exit_type?.id ?? row?.exit_type_id ?? null,
    exitRelevantInfo: row?.exit_relevant_information ?? "",
    website: row?.company?.website ?? "",
    registrationNumber: row?.company?.registration_number ?? "",
    address: row?.company?.address ?? "",
    zipCode: row?.company?.zip_code ?? "",
    city: row?.company?.city ?? "",
    country: row?.company?.address_country_id ?? row?.address_country?.id ?? null,
    teamMembers: toSafeArray(row?.team_members).map(normalizeDealTeamMember),
    raw: row,
  };
}

function formatDateForApi(value) {
  if (!value) return null;
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
    const asDate = new Date(trimmed);
    if (Number.isNaN(asDate.getTime())) return null;
    return asDate.toISOString().slice(0, 10);
  }
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10);
  }
  return null;
}

function parseApiDate(value) {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function normalizeDealEvent(row) {
  return {
    id: row?.id ?? null,
    title: row?.title ?? "",
    description: row?.description ?? "",
    eventDate: row?.event_date ?? "",
    eventDateObject: parseApiDate(row?.event_date),
    eventTypeId: row?.event_type?.id ?? row?.event_type_id ?? null,
    eventTypeName: row?.event_type?.name ?? "",
    eventTypeColor: row?.event_type?.color ?? "",
    createdByName: row?.created_by_user?.name ?? "",
    createdAt: row?.created_at ?? null,
    updatedAt: row?.updated_at ?? null,
    documentsCount: Number(row?.documents_count ?? row?.documents?.length ?? 0),
    documents: toSafeArray(row?.documents).map((doc) => ({
      id: doc?.id ?? null,
      name: doc?.name || doc?.file_name || "",
      fileName: doc?.file_name || "",
      fileUrl: doc?.file_url || "",
      fileExtension: doc?.file_extension || "",
      documentDate: doc?.document_date || null,
    })),
  };
}

function normalizeDealEvents(payload) {
  return toSafeArray(payload).map(normalizeDealEvent).filter((event) => event.id);
}

function normalizeCapTableEntry(row) {
  return {
    id: row?.id ?? null,
    snapshotId: row?.snapshot_id ?? null,
    shareholderName: row?.shareholder_name ?? "",
    comment: row?.comment ?? "",
    seriesA: row?.series_a_shares ?? "",
    seriesB: row?.series_b_shares ?? "",
    common: row?.common_shares ?? "",
    preferred: row?.preferred_shares ?? "",
    seed: row?.seed_shares ?? "",
    esop: row?.esop_shares ?? "",
    nonFullyDilutedPercentage: row?.non_fully_diluted_percentage ?? "",
    fullyDilutedPercentage: row?.fully_diluted_percentage ?? "",
    createdAt: row?.created_at ?? null,
    updatedAt: row?.updated_at ?? null,
  };
}

function normalizeCapTableSnapshot(row) {
  return {
    id: row?.id ?? null,
    dealId: row?.deal_id ?? null,
    companyId: row?.company_id ?? null,
    name: row?.name ?? "",
    snapshotDate: row?.snapshot_date ?? "",
    snapshotDateObject: parseApiDate(row?.snapshot_date),
    entries: toSafeArray(row?.entries).map(normalizeCapTableEntry),
    createdAt: row?.created_at ?? null,
    updatedAt: row?.updated_at ?? null,
  };
}

function normalizeCapTableSnapshots(payload) {
  return toSafeArray(payload).map(normalizeCapTableSnapshot).filter((snapshot) => snapshot.id);
}

function normalizeDealDocument(row) {
  return {
    id: row?.id ?? null,
    dealId: row?.deal_id ?? null,
    eventId: row?.event_id ?? null,
    companyId: row?.company_id ?? null,
    name: row?.name ?? "",
    docTypeId: row?.doc_type?.id ?? row?.doc_type_id ?? null,
    docTypeName: row?.doc_type?.name ?? "",
    docTypeColor: row?.doc_type?.color ?? "",
    fileName: row?.file_name ?? "",
    fileExtension: row?.file_extension ?? "",
    fileMimeType: row?.file_mime_type ?? "",
    fileSize: row?.file_size ?? null,
    fileUrl: row?.file_url ?? "",
    documentDate: row?.document_date ?? "",
    documentDateObject: parseApiDate(row?.document_date),
    uploadedByName: row?.uploaded_by_user?.name ?? "",
    uploadedAt: row?.uploaded_at ?? null,
    eventTitle: row?.event?.title ?? "",
  };
}

function normalizeDealDocuments(payload) {
  return toSafeArray(payload).map(normalizeDealDocument).filter((document) => document.id);
}

function normalizeKpiEntry(row) {
  return {
    id: row?.id ?? null,
    periodId: row?.period_id ?? null,
    dealId: row?.deal_id ?? null,
    companyId: row?.company_id ?? null,
    kpiName: row?.kpi_name ?? "",
    kpiCategoryId: row?.kpi_category?.id ?? row?.kpi_category_id ?? null,
    kpiCategoryName: row?.kpi_category?.name ?? "",
    kpiCategoryColor: row?.kpi_category?.color ?? "",
    value: row?.value ?? "",
    unit: row?.unit ?? "",
    displayOrder: row?.display_order ?? "",
    createdAt: row?.created_at ?? null,
    updatedAt: row?.updated_at ?? null,
  };
}

function normalizeKpiPeriod(row) {
  return {
    id: row?.id ?? null,
    dealId: row?.deal_id ?? null,
    companyId: row?.company_id ?? null,
    name: row?.name ?? "",
    startDate: row?.start_date ?? "",
    endDate: row?.end_date ?? "",
    startDateObject: parseApiDate(row?.start_date),
    endDateObject: parseApiDate(row?.end_date),
    currencyId: row?.currency?.id ?? row?.currency_id ?? null,
    currencyName: row?.currency?.name ?? "",
    currencyCode: row?.currency?.code ?? "",
    displayOrder: row?.display_order ?? "",
    createdAt: row?.created_at ?? null,
    updatedAt: row?.updated_at ?? null,
    entries: toSafeArray(row?.entries).map(normalizeKpiEntry),
  };
}

function normalizeKpiPeriods(payload) {
  return toSafeArray(payload).map(normalizeKpiPeriod).filter((period) => period.id);
}

function normalizeBoardMember(row) {
  return {
    id: row?.id ?? null,
    boardSnapshotId: row?.board_snapshot_id ?? null,
    name: row?.name ?? "",
    numberOfSeats: row?.number_of_seats ?? "",
    dateIn: row?.date_in ?? "",
    dateOut: row?.date_out ?? "",
    dateInObject: parseApiDate(row?.date_in),
    dateOutObject: parseApiDate(row?.date_out),
    createdAt: row?.created_at ?? null,
    updatedAt: row?.updated_at ?? null,
  };
}

function normalizeBoardSnapshot(row) {
  return {
    id: row?.id ?? null,
    dealId: row?.deal_id ?? null,
    companyId: row?.company_id ?? null,
    name: row?.name ?? "",
    snapshotDate: row?.snapshot_date ?? "",
    snapshotDateObject: parseApiDate(row?.snapshot_date),
    members: toSafeArray(row?.members).map(normalizeBoardMember),
    createdAt: row?.created_at ?? null,
    updatedAt: row?.updated_at ?? null,
  };
}

function normalizeBoardSnapshots(payload) {
  return toSafeArray(payload).map(normalizeBoardSnapshot).filter((snapshot) => snapshot.id);
}

function normalizeDealTeamMember(row) {
  return {
    id: row?.id ?? null,
    dealId: row?.deal_id ?? null,
    userId: row?.user?.id ?? row?.user_id ?? null,
    userName: row?.user?.name ?? "",
    userEmail: row?.user?.email ?? "",
    roleId: row?.role?.id ?? row?.role_id ?? null,
    roleName: row?.role?.name ?? "",
    positionOrder: row?.position_order ?? "",
    createdAt: row?.created_at ?? null,
    updatedAt: row?.updated_at ?? null,
  };
}

function extractDocumentMetadata(file) {
  if (!file) return null;
  const fileName = String(file.name || "").trim();
  if (!fileName) return null;
  const lastDotIndex = fileName.lastIndexOf(".");
  const fileExtension = lastDotIndex >= 0 ? fileName.slice(lastDotIndex + 1).toLowerCase() : "";

  return {
    name: fileName,
    file_name: fileName,
    file_extension: fileExtension || null,
    file_mime_type: file.type || null,
    file_size: Number.isFinite(file.size) ? file.size : null,
  };
}

function normalizeTeamMembersForPayload(teamMembers) {
  return toSafeArray(teamMembers)
    .map((member, index) => {
      const userId = member?.userId ?? member?.user_id ?? null;
      const roleId = member?.roleId ?? member?.role_id ?? null;
      const positionOrderValue = member?.positionOrder ?? member?.position_order ?? "";
      const parsedPositionOrder = Number.parseInt(String(positionOrderValue ?? "").trim(), 10);
      return {
        id: member?.id ?? null,
        user_id: userId || null,
        role_id: roleId || null,
        position_order: Number.isFinite(parsedPositionOrder) ? parsedPositionOrder : index + 1,
      };
    })
    .filter((member) => member.user_id && member.role_id);
}

export function mapDealDetailToForm(detail, { countries = [], currencies = [], funds = [] } = {}) {
  if (!detail) return null;

  return {
    ...detail,
    fund: mapDealflowFundIdToSourceId(detail.fund, funds, detail?.fundLabel || detail?.fundName || detail?.fund?.name),
    currency: mapDealflowIdToSourceId(detail.currency, currencies),
    countryOfIncorporation: mapDealflowIdToSourceId(detail.countryOfIncorporation, countries),
    countryOfMainOperation: mapDealflowIdToSourceId(detail.countryOfMainOperation, countries),
    country: mapDealflowIdToSourceId(detail.country, countries),
    teamMembers: toSafeArray(detail.teamMembers).map((member) => ({
      ...member,
      positionOrder: member?.positionOrder ?? "",
    })),
    externalContacts: toSafeArray(detail.externalContacts),
  };
}

export function mapInfoFormToPayload(form, { countries = [], currencies = [] } = {}) {
  const normalizeText = (value) => String(value ?? "").trim();
  const normalizeNullable = (value) => (value === "" || value === null || value === undefined ? null : value);
  const normalizeNumber = (value) => {
    const cleaned = String(value ?? "").replace(/,/g, "").trim();
    if (!cleaned) return null;
    const numeric = Number(cleaned);
    return Number.isFinite(numeric) ? numeric : null;
  };

  return {
    deal_name: normalizeText(form.dealName),
    code_name: normalizeText(form.codeName),
    sector_id: normalizeNullable(form.sector),
    business_description: normalizeText(form.businessDescription),
    status_id: normalizeNullable(form.status),
    stage_id: normalizeNullable(form.stage),
    fund_id: normalizeNullable(form.fund),
    ticket_amount: normalizeNumber(form.ticket),
    currency_id: normalizeNullable(form.currency),
    legal_form_id: normalizeNullable(form.legalForm),
    country_of_incorporation_id: normalizeNullable(form.countryOfIncorporation),
    country_of_main_operation_id: normalizeNullable(form.countryOfMainOperation),
    source_type_id: normalizeNullable(form.sourceType),
    contact_name: normalizeText(form.contact),
    sponsors: normalizeText(form.sponsors),
    sourcing_relevant_information: normalizeText(form.sourcingRelevantInfo),
    exit_type_id: normalizeNullable(form.exitType),
    exit_relevant_information: normalizeText(form.exitRelevantInfo),
    website: normalizeText(form.website),
    registration_number: normalizeText(form.registrationNumber),
    address: normalizeText(form.address),
    zip_code: normalizeText(form.zipCode),
    city: normalizeText(form.city),
    address_country_id: normalizeNullable(form.country),
    team_members: normalizeTeamMembersForPayload(form.teamMembers),
  };
}

export function useDealsBackend() {
  const api = useApi();
  const { countries: lookupCountries, currencies: lookupCurrencies } = useDealflowLookupOptions();
  const [deals, setDeals] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState(null);

  const loadDeals = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const payload = await api.get(DEALFLOW_DEALS_ENDPOINT);
      const normalized = enrichDealListRows(
        normalizeDealList(payload),
        lookupCountries,
        lookupCurrencies
      );
      setDeals(normalized);
      return normalized;
    } catch (err) {
      setError(err.message || "Failed to load deals.");
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [api, lookupCountries, lookupCurrencies]);

  const createDeal = useCallback(async ({ companyName, codeName }) => {
    const name = String(companyName || "").trim();
    const code = String(codeName || "").trim();

    if (!name) throw new Error("Company name is required.");
    if (!code) throw new Error("Code name is required.");

    setIsCreating(true);
    setError(null);
    try {
      const payload = await api.post(DEALFLOW_DEALS_ENDPOINT, {
        company_name: name,
        code_name: code,
      });

      const createdDeal = normalizeDealRow(payload);
      setDeals((prev) => {
        const withoutDuplicate = prev.filter((row) => row.id !== createdDeal.id);
        return createdDeal.id ? [createdDeal, ...withoutDuplicate] : withoutDuplicate;
      });

      return createdDeal;
    } catch (err) {
      setError(err.message || "Failed to create deal.");
      throw err;
    } finally {
      setIsCreating(false);
    }
  }, [api]);

  const deleteDeals = useCallback(async (dealIds) => {
    const ids = toSafeArray(dealIds).filter(Boolean);
    if (ids.length === 0) return [];
    setIsDeleting(true);
    setError(null);
    try {
      for (const dealId of ids) {
        await api.delete(`${DEALFLOW_DEALS_ENDPOINT}${dealId}/`);
      }
      setDeals((prev) => prev.filter((deal) => !ids.includes(deal.id)));
      return ids;
    } catch (err) {
      setError(err.message || "Failed to delete deals.");
      throw err;
    } finally {
      setIsDeleting(false);
    }
  }, [api]);

  useEffect(() => {
    loadDeals().catch(() => {});
  }, [loadDeals]);

  return useMemo(
    () => ({
      deals,
      isLoading,
      isCreating,
      isDeleting,
      error,
      loadDeals,
      createDeal,
      deleteDeals,
    }),
    [deals, isLoading, isCreating, isDeleting, error, loadDeals, createDeal, deleteDeals]
  );
}

export function useDealInfoBackend(dealId) {
  const api = useApi();
  const [detail, setDetail] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);

  const loadDealDetail = useCallback(async () => {
    if (!dealId) return null;
    setIsLoading(true);
    setError(null);
    try {
      const payload = await api.get(`${DEALFLOW_DEALS_ENDPOINT}${dealId}/`);
      const normalized = normalizeDealDetail(payload);
      setDetail(normalized);
      return normalized;
    } catch (err) {
      setError(err.message || "Failed to load deal information.");
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [api, dealId]);

  const saveDealDetail = useCallback(async (form, lookupOptions = {}) => {
    if (!dealId) throw new Error("Missing deal id.");
    setIsSaving(true);
    setError(null);
    try {
      const payload = await api.patch(
        `${DEALFLOW_DEALS_ENDPOINT}${dealId}/`,
        mapInfoFormToPayload(form, lookupOptions)
      );
      const normalized = normalizeDealDetail(payload);
      setDetail(normalized);
      return normalized;
    } catch (err) {
      setError(err.message || "Failed to save deal information.");
      throw err;
    } finally {
      setIsSaving(false);
    }
  }, [api, dealId]);

  useEffect(() => {
    loadDealDetail().catch(() => {});
  }, [loadDealDetail]);

  return useMemo(
    () => ({
      detail,
      isLoading,
      isSaving,
      error,
      loadDealDetail,
      saveDealDetail,
    }),
    [detail, isLoading, isSaving, error, loadDealDetail, saveDealDetail]
  );
}

export function useDealEventsBackend(dealId) {
  const api = useApi();
  const [events, setEvents] = useState([]);
  const [eventTypes, setEventTypes] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);

  const loadEvents = useCallback(async () => {
    if (!dealId) return [];
    setIsLoading(true);
    setError(null);
    try {
      const payload = await api.get(`${DEALFLOW_DEALS_ENDPOINT}${dealId}/events/`);
      const normalized = normalizeDealEvents(payload);
      setEvents(normalized);
      return normalized;
    } catch (err) {
      setError(err.message || "Failed to load deal events.");
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [api, dealId]);

  const loadEventTypes = useCallback(async () => {
    try {
      const payload = await api.get(`${DEALFLOW_TAXONOMY_ENDPOINT}?type=event_type`);
      const normalized = formatDropdownOptions(payload);
      setEventTypes(normalized);
      return normalized;
    } catch (err) {
      setError(err.message || "Failed to load event types.");
      throw err;
    }
  }, [api]);

  const createEvent = useCallback(async (form) => {
    if (!dealId) throw new Error("Missing deal id.");
    setIsSaving(true);
    setError(null);
    try {
      const payload = await api.post(`${DEALFLOW_DEALS_ENDPOINT}${dealId}/events/`, {
        title: String(form?.title || "").trim(),
        description: String(form?.description || "").trim(),
        event_date: formatDateForApi(form?.eventDate),
        event_type_id: form?.eventTypeId || null,
        document: extractDocumentMetadata(form?.file),
      });
      const normalized = normalizeDealEvent(payload);
      setEvents((prev) => [normalized, ...prev.filter((event) => event.id !== normalized.id)]);
      return normalized;
    } catch (err) {
      setError(err.message || "Failed to create event.");
      throw err;
    } finally {
      setIsSaving(false);
    }
  }, [api, dealId]);

  const updateEvent = useCallback(async (eventId, form) => {
    if (!dealId || !eventId) throw new Error("Missing event information.");
    setIsSaving(true);
    setError(null);
    try {
      const payload = await api.patch(`${DEALFLOW_DEALS_ENDPOINT}${dealId}/events/${eventId}/`, {
        title: String(form?.title || "").trim(),
        description: String(form?.description || "").trim(),
        event_date: formatDateForApi(form?.eventDate),
        event_type_id: form?.eventTypeId || null,
      });
      const normalized = normalizeDealEvent(payload);
      setEvents((prev) => prev.map((event) => (event.id === normalized.id ? normalized : event)));
      return normalized;
    } catch (err) {
      setError(err.message || "Failed to update event.");
      throw err;
    } finally {
      setIsSaving(false);
    }
  }, [api, dealId]);

  const deleteEvent = useCallback(async (eventId) => {
    if (!dealId || !eventId) throw new Error("Missing event information.");
    setIsSaving(true);
    setError(null);
    try {
      await api.delete(`${DEALFLOW_DEALS_ENDPOINT}${dealId}/events/${eventId}/`);
      setEvents((prev) => prev.filter((event) => event.id !== eventId));
      return true;
    } catch (err) {
      setError(err.message || "Failed to delete event.");
      throw err;
    } finally {
      setIsSaving(false);
    }
  }, [api, dealId]);

  useEffect(() => {
    loadEventTypes().catch(() => {});
  }, [loadEventTypes]);

  useEffect(() => {
    loadEvents().catch(() => {});
  }, [loadEvents]);

  return useMemo(
    () => ({
      events,
      eventTypes,
      isLoading,
      isSaving,
      error,
      loadEvents,
      loadEventTypes,
      createEvent,
      updateEvent,
      deleteEvent,
    }),
    [events, eventTypes, isLoading, isSaving, error, loadEvents, loadEventTypes, createEvent, updateEvent, deleteEvent]
  );
}

export function useCapTableBackend(dealId) {
  const api = useApi();
  const [snapshots, setSnapshots] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);

  const loadCapTable = useCallback(async () => {
    if (!dealId) return [];
    setIsLoading(true);
    setError(null);
    try {
      const payload = await api.get(`${DEALFLOW_DEALS_ENDPOINT}${dealId}/cap-table/`);
      const normalized = normalizeCapTableSnapshots(payload);
      setSnapshots(normalized);
      return normalized;
    } catch (err) {
      setError(err.message || "Failed to load cap table.");
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [api, dealId]);

  const createSnapshot = useCallback(async ({ name, snapshotDate }) => {
    if (!dealId) throw new Error("Missing deal id.");
    setIsSaving(true);
    setError(null);
    try {
      const payload = await api.post(`${DEALFLOW_DEALS_ENDPOINT}${dealId}/cap-table/`, {
        name: String(name || "").trim(),
        snapshot_date: formatDateForApi(snapshotDate),
      });
      const normalized = normalizeCapTableSnapshot(payload);
      setSnapshots((prev) => [...prev, normalized].sort((a, b) => String(a.snapshotDate || "").localeCompare(String(b.snapshotDate || ""))));
      return normalized;
    } catch (err) {
      setError(err.message || "Failed to create cap table snapshot.");
      throw err;
    } finally {
      setIsSaving(false);
    }
  }, [api, dealId]);

  const updateSnapshot = useCallback(async (snapshotId, { name, snapshotDate }) => {
    if (!dealId || !snapshotId) throw new Error("Missing snapshot information.");
    setIsSaving(true);
    setError(null);
    try {
      const payload = await api.patch(`${DEALFLOW_DEALS_ENDPOINT}${dealId}/cap-table/${snapshotId}/`, {
        name: String(name || "").trim(),
        snapshot_date: formatDateForApi(snapshotDate),
      });
      const normalized = normalizeCapTableSnapshot(payload);
      setSnapshots((prev) => prev.map((snapshot) => (snapshot.id === normalized.id ? normalized : snapshot)));
      return normalized;
    } catch (err) {
      setError(err.message || "Failed to update snapshot.");
      throw err;
    } finally {
      setIsSaving(false);
    }
  }, [api, dealId]);

  const deleteSnapshot = useCallback(async (snapshotId) => {
    if (!dealId || !snapshotId) throw new Error("Missing snapshot information.");
    setIsSaving(true);
    setError(null);
    try {
      await api.delete(`${DEALFLOW_DEALS_ENDPOINT}${dealId}/cap-table/${snapshotId}/`);
      setSnapshots((prev) => prev.filter((snapshot) => snapshot.id !== snapshotId));
      return true;
    } catch (err) {
      setError(err.message || "Failed to delete snapshot.");
      throw err;
    } finally {
      setIsSaving(false);
    }
  }, [api, dealId]);

  const createEntry = useCallback(async (snapshotId, payload) => {
    if (!dealId || !snapshotId) throw new Error("Missing snapshot information.");
    setIsSaving(true);
    setError(null);
    try {
      const response = await api.post(`${DEALFLOW_DEALS_ENDPOINT}${dealId}/cap-table/${snapshotId}/entries/`, {
        shareholder_name: payload.shareholderName,
        comment: payload.comment,
        series_a_shares: payload.seriesA,
        series_b_shares: payload.seriesB,
        common_shares: payload.common,
        preferred_shares: payload.preferred,
        seed_shares: payload.seed,
        esop_shares: payload.esop,
        non_fully_diluted_percentage: payload.nonFullyDilutedPercentage,
        fully_diluted_percentage: payload.fullyDilutedPercentage,
      });
      const normalized = normalizeCapTableEntry(response);
      setSnapshots((prev) =>
        prev.map((snapshot) =>
          snapshot.id === snapshotId
            ? { ...snapshot, entries: [...snapshot.entries, normalized] }
            : snapshot
        )
      );
      return normalized;
    } catch (err) {
      setError(err.message || "Failed to create cap table entry.");
      throw err;
    } finally {
      setIsSaving(false);
    }
  }, [api, dealId]);

  const updateEntry = useCallback(async (entryId, payload) => {
    if (!dealId || !entryId) throw new Error("Missing entry information.");
    setIsSaving(true);
    setError(null);
    try {
      const response = await api.patch(`${DEALFLOW_DEALS_ENDPOINT}${dealId}/cap-table/entries/${entryId}/`, {
        shareholder_name: payload.shareholderName,
        comment: payload.comment,
        series_a_shares: payload.seriesA,
        series_b_shares: payload.seriesB,
        common_shares: payload.common,
        preferred_shares: payload.preferred,
        seed_shares: payload.seed,
        esop_shares: payload.esop,
        non_fully_diluted_percentage: payload.nonFullyDilutedPercentage,
        fully_diluted_percentage: payload.fullyDilutedPercentage,
      });
      const normalized = normalizeCapTableEntry(response);
      setSnapshots((prev) =>
        prev.map((snapshot) => ({
          ...snapshot,
          entries: snapshot.entries.map((entry) => (entry.id === normalized.id ? normalized : entry)),
        }))
      );
      return normalized;
    } catch (err) {
      setError(err.message || "Failed to update cap table entry.");
      throw err;
    } finally {
      setIsSaving(false);
    }
  }, [api, dealId]);

  const deleteEntry = useCallback(async (entryId) => {
    if (!dealId || !entryId) throw new Error("Missing entry information.");
    setIsSaving(true);
    setError(null);
    try {
      await api.delete(`${DEALFLOW_DEALS_ENDPOINT}${dealId}/cap-table/entries/${entryId}/`);
      setSnapshots((prev) =>
        prev.map((snapshot) => ({
          ...snapshot,
          entries: snapshot.entries.filter((entry) => entry.id !== entryId),
        }))
      );
      return true;
    } catch (err) {
      setError(err.message || "Failed to delete cap table entry.");
      throw err;
    } finally {
      setIsSaving(false);
    }
  }, [api, dealId]);

  useEffect(() => {
    loadCapTable().catch(() => {});
  }, [loadCapTable]);

  return useMemo(
    () => ({
      snapshots,
      isLoading,
      isSaving,
      error,
      loadCapTable,
      createSnapshot,
      updateSnapshot,
      deleteSnapshot,
      createEntry,
      updateEntry,
      deleteEntry,
    }),
    [snapshots, isLoading, isSaving, error, loadCapTable, createSnapshot, updateSnapshot, deleteSnapshot, createEntry, updateEntry, deleteEntry]
  );
}

export function useDataroomBackend(dealId) {
  const api = useApi();
  const [documents, setDocuments] = useState([]);
  const [documentTypes, setDocumentTypes] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);

  const loadDocuments = useCallback(async () => {
    if (!dealId) return [];
    setIsLoading(true);
    setError(null);
    try {
      const payload = await api.get(`${DEALFLOW_DEALS_ENDPOINT}${dealId}/documents/`);
      const normalized = normalizeDealDocuments(payload);
      setDocuments(normalized);
      return normalized;
    } catch (err) {
      setError(err.message || "Failed to load dataroom documents.");
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [api, dealId]);

  const loadDocumentTypes = useCallback(async () => {
    try {
      const payload = await api.get(`${DEALFLOW_TAXONOMY_ENDPOINT}?type=doc_type`);
      const normalized = formatDropdownOptions(payload);
      setDocumentTypes(normalized);
      return normalized;
    } catch (err) {
      setError(err.message || "Failed to load document types.");
      throw err;
    }
  }, [api]);

  const createDocument = useCallback(async ({ file, name, docTypeId, documentDate }) => {
    if (!dealId) throw new Error("Missing deal id.");
    const metadata = extractDocumentMetadata(file);
    if (!metadata?.file_name) throw new Error("A file is required.");
    setIsSaving(true);
    setError(null);
    try {
      const payload = await api.post(`${DEALFLOW_DEALS_ENDPOINT}${dealId}/documents/`, {
        name: String(name || metadata.name || "").trim(),
        doc_type_id: docTypeId || null,
        document_date: formatDateForApi(documentDate),
        ...metadata,
        file_url: null,
      });
      const normalized = normalizeDealDocument(payload);
      setDocuments((prev) => [normalized, ...prev.filter((document) => document.id !== normalized.id)]);
      return normalized;
    } catch (err) {
      setError(err.message || "Failed to create document.");
      throw err;
    } finally {
      setIsSaving(false);
    }
  }, [api, dealId]);

  const updateDocument = useCallback(async (documentId, payload) => {
    if (!dealId || !documentId) throw new Error("Missing document information.");
    setIsSaving(true);
    setError(null);
    try {
      const response = await api.patch(`${DEALFLOW_DEALS_ENDPOINT}${dealId}/documents/${documentId}/`, {
        name: String(payload?.name || "").trim(),
        doc_type_id: payload?.docTypeId || null,
        document_date: formatDateForApi(payload?.documentDate),
      });
      const normalized = normalizeDealDocument(response);
      setDocuments((prev) => prev.map((document) => (document.id === normalized.id ? normalized : document)));
      return normalized;
    } catch (err) {
      setError(err.message || "Failed to update document.");
      throw err;
    } finally {
      setIsSaving(false);
    }
  }, [api, dealId]);

  const deleteDocument = useCallback(async (documentId) => {
    if (!dealId || !documentId) throw new Error("Missing document information.");
    setIsSaving(true);
    setError(null);
    try {
      await api.delete(`${DEALFLOW_DEALS_ENDPOINT}${dealId}/documents/${documentId}/`);
      setDocuments((prev) => prev.filter((document) => document.id !== documentId));
      return true;
    } catch (err) {
      setError(err.message || "Failed to delete document.");
      throw err;
    } finally {
      setIsSaving(false);
    }
  }, [api, dealId]);

  useEffect(() => {
    loadDocumentTypes().catch(() => {});
  }, [loadDocumentTypes]);

  useEffect(() => {
    loadDocuments().catch(() => {});
  }, [loadDocuments]);

  return useMemo(
    () => ({
      documents,
      documentTypes,
      isLoading,
      isSaving,
      error,
      loadDocuments,
      loadDocumentTypes,
      createDocument,
      updateDocument,
      deleteDocument,
    }),
    [documents, documentTypes, isLoading, isSaving, error, loadDocuments, loadDocumentTypes, createDocument, updateDocument, deleteDocument]
  );
}

export function useKpisBackend(dealId) {
  const api = useApi();
  const [periods, setPeriods] = useState([]);
  const [kpiCategories, setKpiCategories] = useState([]);
  const [currencies, setCurrencies] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);

  const loadKpis = useCallback(async () => {
    if (!dealId) return [];
    setIsLoading(true);
    setError(null);
    try {
      const payload = await api.get(`${DEALFLOW_DEALS_ENDPOINT}${dealId}/kpis/`);
      const normalized = normalizeKpiPeriods(payload);
      setPeriods(normalized);
      return normalized;
    } catch (err) {
      setError(err.message || "Failed to load KPIs.");
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [api, dealId]);

  const loadKpiLookups = useCallback(async () => {
    try {
      const [categoriesPayload, currenciesPayload] = await Promise.all([
        api.get(`${DEALFLOW_TAXONOMY_ENDPOINT}?type=kpi_category`),
        api.get(`${DEALFLOW_TAXONOMY_ENDPOINT}?type=currency`),
      ]);
      setKpiCategories(formatDropdownOptions(categoriesPayload));
      setCurrencies(formatDropdownOptions(currenciesPayload, {
        labelBuilder: (row) => {
          const name = row?.name || "";
          const code = row?.code || "";
          return code ? `${name} (${code})` : name;
        },
      }));
    } catch (err) {
      setError(err.message || "Failed to load KPI lookups.");
      throw err;
    }
  }, [api]);

  const createPeriod = useCallback(async (payload) => {
    if (!dealId) throw new Error("Missing deal id.");
    setIsSaving(true);
    setError(null);
    try {
      const response = await api.post(`${DEALFLOW_DEALS_ENDPOINT}${dealId}/kpis/`, {
        name: String(payload?.name || "").trim(),
        start_date: formatDateForApi(payload?.startDate),
        end_date: formatDateForApi(payload?.endDate),
        currency_id: payload?.currencyId || null,
        display_order: payload?.displayOrder === "" ? null : payload?.displayOrder ?? null,
      });
      const normalized = normalizeKpiPeriod(response);
      setPeriods((prev) => [...prev, normalized]);
      return normalized;
    } catch (err) {
      setError(err.message || "Failed to create KPI period.");
      throw err;
    } finally {
      setIsSaving(false);
    }
  }, [api, dealId]);

  const updatePeriod = useCallback(async (periodId, payload) => {
    if (!dealId || !periodId) throw new Error("Missing KPI period information.");
    setIsSaving(true);
    setError(null);
    try {
      const response = await api.patch(`${DEALFLOW_DEALS_ENDPOINT}${dealId}/kpis/${periodId}/`, {
        name: String(payload?.name || "").trim(),
        start_date: formatDateForApi(payload?.startDate),
        end_date: formatDateForApi(payload?.endDate),
        currency_id: payload?.currencyId || null,
        display_order: payload?.displayOrder === "" ? null : payload?.displayOrder ?? null,
      });
      const normalized = normalizeKpiPeriod(response);
      setPeriods((prev) => prev.map((period) => (period.id === normalized.id ? normalized : period)));
      return normalized;
    } catch (err) {
      setError(err.message || "Failed to update KPI period.");
      throw err;
    } finally {
      setIsSaving(false);
    }
  }, [api, dealId]);

  const deletePeriod = useCallback(async (periodId) => {
    if (!dealId || !periodId) throw new Error("Missing KPI period information.");
    setIsSaving(true);
    setError(null);
    try {
      await api.delete(`${DEALFLOW_DEALS_ENDPOINT}${dealId}/kpis/${periodId}/`);
      setPeriods((prev) => prev.filter((period) => period.id !== periodId));
      return true;
    } catch (err) {
      setError(err.message || "Failed to delete KPI period.");
      throw err;
    } finally {
      setIsSaving(false);
    }
  }, [api, dealId]);

  const createEntry = useCallback(async (periodId, payload) => {
    if (!dealId || !periodId) throw new Error("Missing KPI period information.");
    setIsSaving(true);
    setError(null);
    try {
      const response = await api.post(`${DEALFLOW_DEALS_ENDPOINT}${dealId}/kpis/${periodId}/entries/`, {
        kpi_name: String(payload?.kpiName || "").trim(),
        kpi_category_id: payload?.kpiCategoryId || null,
        value: payload?.value === "" ? null : payload?.value,
        unit: String(payload?.unit || "").trim(),
        display_order: payload?.displayOrder === "" ? null : payload?.displayOrder ?? null,
      });
      const normalized = normalizeKpiEntry(response);
      setPeriods((prev) =>
        prev.map((period) =>
          period.id === periodId ? { ...period, entries: [...period.entries, normalized] } : period
        )
      );
      return normalized;
    } catch (err) {
      setError(err.message || "Failed to create KPI entry.");
      throw err;
    } finally {
      setIsSaving(false);
    }
  }, [api, dealId]);

  const updateEntry = useCallback(async (entryId, payload) => {
    if (!dealId || !entryId) throw new Error("Missing KPI entry information.");
    setIsSaving(true);
    setError(null);
    try {
      const response = await api.patch(`${DEALFLOW_DEALS_ENDPOINT}${dealId}/kpis/entries/${entryId}/`, {
        kpi_name: String(payload?.kpiName || "").trim(),
        kpi_category_id: payload?.kpiCategoryId || null,
        value: payload?.value === "" ? null : payload?.value,
        unit: String(payload?.unit || "").trim(),
        display_order: payload?.displayOrder === "" ? null : payload?.displayOrder ?? null,
      });
      const normalized = normalizeKpiEntry(response);
      setPeriods((prev) =>
        prev.map((period) => ({
          ...period,
          entries: period.entries.map((entry) => (entry.id === normalized.id ? normalized : entry)),
        }))
      );
      return normalized;
    } catch (err) {
      setError(err.message || "Failed to update KPI entry.");
      throw err;
    } finally {
      setIsSaving(false);
    }
  }, [api, dealId]);

  const deleteEntry = useCallback(async (entryId) => {
    if (!dealId || !entryId) throw new Error("Missing KPI entry information.");
    setIsSaving(true);
    setError(null);
    try {
      await api.delete(`${DEALFLOW_DEALS_ENDPOINT}${dealId}/kpis/entries/${entryId}/`);
      setPeriods((prev) =>
        prev.map((period) => ({
          ...period,
          entries: period.entries.filter((entry) => entry.id !== entryId),
        }))
      );
      return true;
    } catch (err) {
      setError(err.message || "Failed to delete KPI entry.");
      throw err;
    } finally {
      setIsSaving(false);
    }
  }, [api, dealId]);

  useEffect(() => {
    loadKpiLookups().catch(() => {});
  }, [loadKpiLookups]);

  useEffect(() => {
    loadKpis().catch(() => {});
  }, [loadKpis]);

  return useMemo(
    () => ({
      periods,
      kpiCategories,
      currencies,
      isLoading,
      isSaving,
      error,
      loadKpis,
      createPeriod,
      updatePeriod,
      deletePeriod,
      createEntry,
      updateEntry,
      deleteEntry,
    }),
    [periods, kpiCategories, currencies, isLoading, isSaving, error, loadKpis, createPeriod, updatePeriod, deletePeriod, createEntry, updateEntry, deleteEntry]
  );
}

export function useBoardBackend(dealId) {
  const api = useApi();
  const [snapshots, setSnapshots] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);

  const loadBoard = useCallback(async () => {
    if (!dealId) return [];
    setIsLoading(true);
    setError(null);
    try {
      const payload = await api.get(`${DEALFLOW_DEALS_ENDPOINT}${dealId}/board/`);
      const normalized = normalizeBoardSnapshots(payload);
      setSnapshots(normalized);
      return normalized;
    } catch (err) {
      setError(err.message || "Failed to load board snapshots.");
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [api, dealId]);

  const createSnapshot = useCallback(async ({ name, snapshotDate }) => {
    if (!dealId) throw new Error("Missing deal id.");
    setIsSaving(true);
    setError(null);
    try {
      const payload = await api.post(`${DEALFLOW_DEALS_ENDPOINT}${dealId}/board/`, {
        name: String(name || "").trim(),
        snapshot_date: formatDateForApi(snapshotDate),
      });
      const normalized = normalizeBoardSnapshot(payload);
      setSnapshots((prev) => [...prev, normalized]);
      return normalized;
    } catch (err) {
      setError(err.message || "Failed to create board snapshot.");
      throw err;
    } finally {
      setIsSaving(false);
    }
  }, [api, dealId]);

  const updateSnapshot = useCallback(async (snapshotId, { name, snapshotDate }) => {
    if (!dealId || !snapshotId) throw new Error("Missing board snapshot information.");
    setIsSaving(true);
    setError(null);
    try {
      const payload = await api.patch(`${DEALFLOW_DEALS_ENDPOINT}${dealId}/board/${snapshotId}/`, {
        name: String(name || "").trim(),
        snapshot_date: formatDateForApi(snapshotDate),
      });
      const normalized = normalizeBoardSnapshot(payload);
      setSnapshots((prev) => prev.map((snapshot) => (snapshot.id === normalized.id ? normalized : snapshot)));
      return normalized;
    } catch (err) {
      setError(err.message || "Failed to update board snapshot.");
      throw err;
    } finally {
      setIsSaving(false);
    }
  }, [api, dealId]);

  const deleteSnapshot = useCallback(async (snapshotId) => {
    if (!dealId || !snapshotId) throw new Error("Missing board snapshot information.");
    setIsSaving(true);
    setError(null);
    try {
      await api.delete(`${DEALFLOW_DEALS_ENDPOINT}${dealId}/board/${snapshotId}/`);
      setSnapshots((prev) => prev.filter((snapshot) => snapshot.id !== snapshotId));
      return true;
    } catch (err) {
      setError(err.message || "Failed to delete board snapshot.");
      throw err;
    } finally {
      setIsSaving(false);
    }
  }, [api, dealId]);

  const createMember = useCallback(async (snapshotId, payload) => {
    if (!dealId || !snapshotId) throw new Error("Missing board snapshot information.");
    setIsSaving(true);
    setError(null);
    try {
      const response = await api.post(`${DEALFLOW_DEALS_ENDPOINT}${dealId}/board/${snapshotId}/members/`, {
        name: String(payload?.name || "").trim(),
        number_of_seats: payload?.numberOfSeats === "" ? null : payload?.numberOfSeats,
        date_in: formatDateForApi(payload?.dateIn),
        date_out: formatDateForApi(payload?.dateOut),
      });
      const normalized = normalizeBoardMember(response);
      setSnapshots((prev) =>
        prev.map((snapshot) =>
          snapshot.id === snapshotId ? { ...snapshot, members: [...snapshot.members, normalized] } : snapshot
        )
      );
      return normalized;
    } catch (err) {
      setError(err.message || "Failed to create board member.");
      throw err;
    } finally {
      setIsSaving(false);
    }
  }, [api, dealId]);

  const updateMember = useCallback(async (memberId, payload) => {
    if (!dealId || !memberId) throw new Error("Missing board member information.");
    setIsSaving(true);
    setError(null);
    try {
      const response = await api.patch(`${DEALFLOW_DEALS_ENDPOINT}${dealId}/board/members/${memberId}/`, {
        name: String(payload?.name || "").trim(),
        number_of_seats: payload?.numberOfSeats === "" ? null : payload?.numberOfSeats,
        date_in: formatDateForApi(payload?.dateIn),
        date_out: formatDateForApi(payload?.dateOut),
      });
      const normalized = normalizeBoardMember(response);
      setSnapshots((prev) =>
        prev.map((snapshot) => ({
          ...snapshot,
          members: snapshot.members.map((member) => (member.id === normalized.id ? normalized : member)),
        }))
      );
      return normalized;
    } catch (err) {
      setError(err.message || "Failed to update board member.");
      throw err;
    } finally {
      setIsSaving(false);
    }
  }, [api, dealId]);

  const deleteMember = useCallback(async (memberId) => {
    if (!dealId || !memberId) throw new Error("Missing board member information.");
    setIsSaving(true);
    setError(null);
    try {
      await api.delete(`${DEALFLOW_DEALS_ENDPOINT}${dealId}/board/members/${memberId}/`);
      setSnapshots((prev) =>
        prev.map((snapshot) => ({
          ...snapshot,
          members: snapshot.members.filter((member) => member.id !== memberId),
        }))
      );
      return true;
    } catch (err) {
      setError(err.message || "Failed to delete board member.");
      throw err;
    } finally {
      setIsSaving(false);
    }
  }, [api, dealId]);

  useEffect(() => {
    loadBoard().catch(() => {});
  }, [loadBoard]);

  return useMemo(
    () => ({
      snapshots,
      isLoading,
      isSaving,
      error,
      loadBoard,
      createSnapshot,
      updateSnapshot,
      deleteSnapshot,
      createMember,
      updateMember,
      deleteMember,
    }),
    [snapshots, isLoading, isSaving, error, loadBoard, createSnapshot, updateSnapshot, deleteSnapshot, createMember, updateMember, deleteMember]
  );
}

export function useDealflowLookupOptions() {
  const api = useApi();
  const { countries: sharedCountries = [], isLoading: countriesLoading } = useCountries();
  const { currencies: sharedCurrencies = [], isLoading: currenciesLoading } = useCurrencies();
  const [options, setOptions] = useState({
    sectors: [],
    statuses: [],
    stages: [],
    sourceTypes: [],
    exitTypes: [],
    legalForms: [],
    teamRoles: [],
    dealflowUsers: [],
    funds: [],
    dealflowCountries: [],
    dealflowCurrencies: [],
    dealflowFunds: [],
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadOptions = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [
        sectors,
        statuses,
        stages,
        sourceTypes,
        exitTypes,
        legalForms,
        teamRoles,
        dealflowUsers,
        dealflowCountries,
        dealflowCurrencies,
        dealflowFunds,
        sharedFunds,
      ] = await Promise.all([
        api.get(`${DEALFLOW_TAXONOMY_ENDPOINT}?type=sector`),
        api.get(`${DEALFLOW_TAXONOMY_ENDPOINT}?type=status`),
        api.get(`${DEALFLOW_TAXONOMY_ENDPOINT}?type=stage`),
        api.get(`${DEALFLOW_TAXONOMY_ENDPOINT}?type=source_type`),
        api.get(`${DEALFLOW_TAXONOMY_ENDPOINT}?type=exit_type`),
        api.get(`${DEALFLOW_TAXONOMY_ENDPOINT}?type=legal_form`),
        api.get(`${DEALFLOW_TAXONOMY_ENDPOINT}?type=team_role`),
        api.get(DEALFLOW_USERS_ENDPOINT),
        api.get(`${DEALFLOW_TAXONOMY_ENDPOINT}?type=country`),
        api.get(`${DEALFLOW_TAXONOMY_ENDPOINT}?type=currency`),
        api.get(DEALFLOW_FUNDS_ENDPOINT),
        api.get(SHARED_FUNDS_ENDPOINT),
      ]);

      setOptions({
        sectors: formatDropdownOptions(sectors),
        statuses: formatDropdownOptions(statuses),
        stages: formatDropdownOptions(stages),
        sourceTypes: formatDropdownOptions(sourceTypes),
        exitTypes: formatDropdownOptions(exitTypes),
        legalForms: formatDropdownOptions(legalForms),
        teamRoles: formatDropdownOptions(teamRoles),
        dealflowUsers: formatDropdownOptions(dealflowUsers, {
          labelBuilder: (row) => {
            const name = row?.name || "";
            const role = row?.role || "";
            return role ? `${name} (${role})` : name;
          },
        }),
        funds: formatDropdownOptions(
          mapSharedFundsToDealflowId(sharedFunds, dealflowFunds),
          {
            labelBuilder: (row) => row?.name || row?.legal_name || row?.short_name || "",
          }
        ),
        dealflowCountries: toSafeArray(dealflowCountries),
        dealflowCurrencies: toSafeArray(dealflowCurrencies),
        dealflowFunds: toSafeArray(dealflowFunds),
      });
    } catch (err) {
      setError(err.message || "Failed to load DealFlow options.");
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [api]);

  useEffect(() => {
    loadOptions().catch(() => {});
  }, [loadOptions]);

  const mappedCountries = useMemo(
    () =>
      formatDropdownOptions(
        mapSharedOptionToDealflowId(sharedCountries, options.dealflowCountries, "country")
      ),
    [sharedCountries, options.dealflowCountries]
  );
  const mappedCurrencies = useMemo(
    () =>
      formatDropdownOptions(
        mapSharedOptionToDealflowId(sharedCurrencies, options.dealflowCurrencies, "currency"),
        {
          labelBuilder: (row) => {
            const name = row?.name || row?.currency_name || "";
            const code = row?.code || row?.currency_code || row?.iso_code || "";
            return code ? `${name} (${code})` : name;
          },
        }
      ),
    [sharedCurrencies, options.dealflowCurrencies]
  );

  return useMemo(
    () => ({
      ...options,
      countries: mappedCountries,
      currencies: mappedCurrencies,
      isLoading: isLoading || countriesLoading || currenciesLoading,
      error,
      reload: loadOptions,
    }),
    [options, mappedCountries, mappedCurrencies, isLoading, countriesLoading, currenciesLoading, error, loadOptions]
  );
}
