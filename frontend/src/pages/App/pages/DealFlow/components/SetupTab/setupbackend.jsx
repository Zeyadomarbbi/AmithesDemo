import { useCallback, useEffect, useMemo, useState } from "react";
import useApi from "../../../../../../hooks/api/useApi";

const DEALFLOW_SETUP_ENDPOINT = "/api/dealflow/setup/";

export const SETUP_CATEGORIES = [
  { key: "status", label: "Status", itemLabel: "status", taxonomyType: "status", hasColor: false },
  { key: "stage", label: "Stage", itemLabel: "stage", taxonomyType: "stage", hasColor: true },
  { key: "source", label: "Source", itemLabel: "source type", taxonomyType: "source_type", hasColor: false },
  { key: "doctype", label: "Type of document", itemLabel: "type of document", taxonomyType: "doc_type", hasColor: true },
  { key: "sector", label: "Sector", itemLabel: "sector", taxonomyType: "sector", hasColor: false },
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
    }),
    [items, isLoading, isSaving, error, loadItems, createItem, updateItem, toggleItemActive]
  );
}
