import { useCallback, useEffect, useMemo, useState } from "react";
import useApi from "../../../../../../hooks/api/useApi";

const DEALFLOW_SETUP_ENDPOINT = "/api/dealflow/setup/";
const DEALFLOW_USERS_ENDPOINT = "/api/dealflow/users/";

export const DEAL_TEAM_KEY = "deal_team";

export const SETUP_CATEGORIES = [
  { key: "stage", label: "Stage", itemLabel: "stage", taxonomyType: "stage", hasColor: true },
  { key: "status", label: "Status", itemLabel: "status", taxonomyType: "status", hasColor: true },
  { key: "source", label: "Source", itemLabel: "source type", taxonomyType: "source_type", hasColor: false },
  { key: "legal_form", label: "Legal Form", itemLabel: "legal form", taxonomyType: "legal_form", hasColor: false },
  { key: "doctype", label: "Type of document", itemLabel: "type of document", taxonomyType: "doc_type", hasColor: true },
  { key: "sector", label: "Sector", itemLabel: "sector", taxonomyType: "sector", hasColor: false },
  { key: "operation_type", label: "Operation Type", itemLabel: "operation type", taxonomyType: "operation_type", hasColor: false },
  { key: "investment_instrument", label: "Investment Instrument", itemLabel: "investment instrument", taxonomyType: "investment_instrument", hasColor: false },
  { key: "co_investor_type", label: "Co-investor Type", itemLabel: "co-investor type", taxonomyType: "co_investor_type", hasColor: false },
  { key: "deal_type", label: "Investment Type", itemLabel: "investment type", taxonomyType: "deal_type", hasColor: false },
  { key: "exit_route", label: "Exit Route", itemLabel: "exit route", taxonomyType: "exit_route", hasColor: false },
  { key: "exit_counterparty", label: "Exit Counterparty", itemLabel: "exit counterparty", taxonomyType: "exit_counterparty", hasColor: false },
  { key: "exit_horizon", label: "Exit Horizon", itemLabel: "exit horizon", taxonomyType: "exit_horizon", hasColor: false },
  { key: "esg_risk", label: "E&S Risk", itemLabel: "risk level", taxonomyType: "esg_risk", hasColor: false },
  { key: "team_role", label: "Deal Team Positions", itemLabel: "position", taxonomyType: "team_role", hasColor: false },
];

function toSafeArray(value) {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.results)) return value.results;
  if (Array.isArray(value?.rows)) return value.rows;
  return [];
}

function normalizeSetupItem(row) {
  return {
    id: row?.id ?? null,
    type: row?.type ?? "",
    name: row?.name ?? "",
    code: row?.code ?? "",
    displayOrder: row?.display_order ?? "",
    color: row?.color ?? "",
    isActive: row?.is_active !== false,
    createdAt: row?.created_at ?? null,
    updatedAt: row?.updated_at ?? null,
  };
}

function normalizeSetupItems(payload) {
  return toSafeArray(payload).map(normalizeSetupItem).filter((item) => item.id);
}

export function buildSetupCode(name) {
  return String(name || "")
    .trim()
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .replace(/_+/g, "_")
    .toUpperCase();
}

export function useSetupBackend(activeType) {
  const api = useApi();
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);

  const loadItems = useCallback(async () => {
    if (!activeType) {
      setItems([]);
      return [];
    }
    setIsLoading(true);
    setError(null);
    try {
      const payload = await api.get(`${DEALFLOW_SETUP_ENDPOINT}${activeType}/`);
      const normalized = normalizeSetupItems(payload);
      setItems(normalized);
      return normalized;
    } catch (err) {
      setError(err.message || "Failed to load setup items.");
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [api, activeType]);

  const createItem = useCallback(async (payload) => {
    if (!activeType) throw new Error("Missing setup type.");
    setIsSaving(true);
    setError(null);
    try {
      const response = await api.post(`${DEALFLOW_SETUP_ENDPOINT}${activeType}/`, {
        name: String(payload?.name || "").trim(),
        code: String(payload?.code || "").trim().toUpperCase(),
        display_order: payload?.displayOrder === "" ? null : payload?.displayOrder ?? null,
        color: String(payload?.color || "").trim() || null,
        is_active: payload?.isActive !== false,
      });
      const normalized = normalizeSetupItem(response);
      setItems((prev) =>
        [...prev.filter((item) => item.id !== normalized.id), normalized].sort((a, b) => {
          const orderA = a.displayOrder === "" || a.displayOrder === null ? Number.MAX_SAFE_INTEGER : Number(a.displayOrder);
          const orderB = b.displayOrder === "" || b.displayOrder === null ? Number.MAX_SAFE_INTEGER : Number(b.displayOrder);
          if (orderA !== orderB) return orderA - orderB;
          return String(a.name || "").localeCompare(String(b.name || ""));
        })
      );
      return normalized;
    } catch (err) {
      setError(err.message || "Failed to create setup item.");
      throw err;
    } finally {
      setIsSaving(false);
    }
  }, [api, activeType]);

  const updateItem = useCallback(async (itemId, payload) => {
    if (!activeType || !itemId) throw new Error("Missing setup item information.");
    setIsSaving(true);
    setError(null);
    try {
      const response = await api.patch(`${DEALFLOW_SETUP_ENDPOINT}${activeType}/${itemId}/`, {
        name: String(payload?.name || "").trim(),
        code: String(payload?.code || "").trim().toUpperCase(),
        display_order: payload?.displayOrder === "" ? null : payload?.displayOrder ?? null,
        color: String(payload?.color || "").trim() || null,
        is_active: payload?.isActive !== false,
      });
      const normalized = normalizeSetupItem(response);
      setItems((prev) =>
        prev
          .map((item) => (item.id === normalized.id ? normalized : item))
          .sort((a, b) => {
            const orderA = a.displayOrder === "" || a.displayOrder === null ? Number.MAX_SAFE_INTEGER : Number(a.displayOrder);
            const orderB = b.displayOrder === "" || b.displayOrder === null ? Number.MAX_SAFE_INTEGER : Number(b.displayOrder);
            if (orderA !== orderB) return orderA - orderB;
            return String(a.name || "").localeCompare(String(b.name || ""));
          })
      );
      return normalized;
    } catch (err) {
      setError(err.message || "Failed to update setup item.");
      throw err;
    } finally {
      setIsSaving(false);
    }
  }, [api, activeType]);

  const toggleItemActive = useCallback(async (item) => {
    if (!item?.id) throw new Error("Missing setup item.");
    return updateItem(item.id, {
      name: item.name,
      code: item.code,
      displayOrder: item.displayOrder,
      color: item.color,
      isActive: !item.isActive,
    });
  }, [updateItem]);

  const deleteItem = useCallback(async (itemId) => {
    if (!activeType || !itemId) throw new Error("Missing setup item information.");
    setIsSaving(true);
    setError(null);
    try {
      await api.delete(`${DEALFLOW_SETUP_ENDPOINT}${activeType}/${itemId}/`);
      setItems((prev) => prev.filter((item) => item.id !== itemId));
      return true;
    } catch (err) {
      setError(err.message || "Failed to delete setup item.");
      throw err;
    } finally {
      setIsSaving(false);
    }
  }, [api, activeType]);

  useEffect(() => {
    loadItems().catch(() => {});
  }, [loadItems]);

  return useMemo(
    () => ({
      items,
      isLoading,
      isSaving,
      error,
      loadItems,
      createItem,
      updateItem,
      toggleItemActive,
      deleteItem,
    }),
    [items, isLoading, isSaving, error, loadItems, createItem, updateItem, toggleItemActive, deleteItem]
  );
}

function normalizeUser(row) {
  return {
    id: row?.id ?? null,
    name: row?.name ?? row?.full_name ?? row?.username ?? "",
    email: row?.email ?? "",
  };
}

export function useDealTeamBackend() {
  const api = useApi();
  const [members, setMembers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);

  const loadMembers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const payload = await api.get(DEALFLOW_USERS_ENDPOINT);
      setMembers(toSafeArray(payload).map(normalizeUser).filter((u) => u.id));
    } catch (err) {
      setError(err.message || "Failed to load team members.");
    } finally {
      setIsLoading(false);
    }
  }, [api]);

  const createMember = useCallback(async (payload) => {
    setIsSaving(true);
    setError(null);
    try {
      const response = await api.post(DEALFLOW_USERS_ENDPOINT, {
        name: String(payload?.name || "").trim(),
        email: String(payload?.email || "").trim(),
      });
      const normalized = normalizeUser(response);
      setMembers((prev) =>
        [...prev.filter((m) => m.id !== normalized.id), normalized].sort((a, b) =>
          String(a.name).localeCompare(String(b.name))
        )
      );
      return normalized;
    } catch (err) {
      setError(err.message || "Failed to add team member.");
      throw err;
    } finally {
      setIsSaving(false);
    }
  }, [api]);

  const updateMember = useCallback(async (memberId, payload) => {
    setIsSaving(true);
    setError(null);
    try {
      const response = await api.patch(`${DEALFLOW_USERS_ENDPOINT}${memberId}/`, {
        name: String(payload?.name || "").trim(),
        email: String(payload?.email || "").trim(),
      });
      const normalized = normalizeUser(response);
      setMembers((prev) =>
        prev
          .map((m) => (m.id === normalized.id ? normalized : m))
          .sort((a, b) => String(a.name).localeCompare(String(b.name)))
      );
      return normalized;
    } catch (err) {
      setError(err.message || "Failed to update team member.");
      throw err;
    } finally {
      setIsSaving(false);
    }
  }, [api]);

  const deleteMember = useCallback(async (memberId) => {
    setIsSaving(true);
    setError(null);
    try {
      await api.delete(`${DEALFLOW_USERS_ENDPOINT}${memberId}/`);
      setMembers((prev) => prev.filter((m) => m.id !== memberId));
    } catch (err) {
      setError(err.message || "Failed to remove team member.");
      throw err;
    } finally {
      setIsSaving(false);
    }
  }, [api]);

  useEffect(() => {
    loadMembers().catch(() => {});
  }, [loadMembers]);

  return useMemo(
    () => ({ members, isLoading, isSaving, error, createMember, updateMember, deleteMember }),
    [members, isLoading, isSaving, error, createMember, updateMember, deleteMember]
  );
}
