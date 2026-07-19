import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useTableSort, SortableHeaderRenderer } from "../../../../../../../components/Sort/TableSort";
import { TrashIcon, DownloadIcon, PlusIcon, MinusIcon, EditLineIcon } from "/src/components/Icons/InteractiveIcons";
import SearchBar from "/src/components/SearchBar/SearchBar";
import Toast from "../../../../../components/Toast/Toast";
import { useToast } from "../../../../../components/Toast/useToast";
import FilterModal from "./components/FilterModal";
import NewCompanyModal from "./components/NewCompanyModal";
import InfoTab from "../InfoDrawer/InfoTab/InfoTab";
import { useDealsBackend, useDealflowLookupOptions } from "../Deals_backend_work";
import useApi from "/src/hooks/api/useApi";
import { exportRowsToExcel } from "../exportUtils";
import StageLogModal, { toRawDate } from "./components/StageLogModal";
import "./Deals.css";

const COLS = [
  { key: "name", label: "Name", center: false },
  { key: "code", label: "Code", center: false },
  { key: "fund", label: "Fund", center: false },
  { key: "stage", label: "Stage", center: true },
  { key: "sector", label: "Sector", center: false },
  { key: "ticket", label: "Ticket", center: false },
  { key: "currency", label: "Currency", center: true },
  { key: "country", label: "Geography", center: false },
];

function getStageBadgeStyle(color) {
  if (!color) return {};
  const r = parseInt(color.slice(1, 3), 16);
  const g = parseInt(color.slice(3, 5), 16);
  const b = parseInt(color.slice(5, 7), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return {
    backgroundColor: color,
    color: luminance > 0.5 ? "#374151" : "#ffffff",
  };
}

function Deals() {
  const [search, setSearch] = useState("");
  const [keyword, setKeyword] = useState("");
  const [debouncedKeyword, setDebouncedKeyword] = useState("");
  const [selectedIds, setSelectedIds] = useState([]);
  const [showFilter, setShowFilter] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState({
    stage: [],
    fund: [],
    sector: [],
    country: [],
    status: [],
  });
  const [showNewCompany, setShowNewCompany] = useState(false);
  const [selectedDeal, setSelectedDeal] = useState(null);
  const [expandedDeals, setExpandedDeals] = useState(new Set());
  const [stageLogModal, setStageLogModal] = useState(null);

  const toggleExpand = (id) =>
    setExpandedDeals((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });

  const { toast, showToast, closeToast } = useToast();
  const api = useApi();
  const { deals, isLoading, isCreating, isDeleting, error, createDeal, deleteDeals, loadDeals } = useDealsBackend({
    keyword: debouncedKeyword,
  });
  const { stages, statuses, funds } = useDealflowLookupOptions();

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedKeyword(keyword.trim());
    }, 300);

    return () => window.clearTimeout(timeoutId);
  }, [keyword]);
  const stageColorMap = useMemo(
    () => Object.fromEntries(stages.filter((s) => s.color).map((s) => [s.name, s.color])),
    [stages]
  );

  const sourceDeals = useMemo(() => (Array.isArray(deals) ? deals : []), [deals]);
  const { sorted, sortKey, toggleSort } = useTableSort(sourceDeals, "name");
  const selectedDealRecord = useMemo(() => {
    if (!selectedDeal?.id) return null;
    return sourceDeals.find((deal) => deal.id === selectedDeal.id) || selectedDeal;
  }, [sourceDeals, selectedDeal]);

  const sectorOptions = useMemo(
    () => [...new Set(sourceDeals.map((d) => d.sector).filter(Boolean))].sort(),
    [sourceDeals]
  );
  const countryOptions = useMemo(
    () => [...new Set(sourceDeals.map((d) => d.country).filter(Boolean))].sort(),
    [sourceDeals]
  );
  const stageOptions = useMemo(() => stages.map((stage) => stage.name).filter(Boolean), [stages]);
  const fundOptions = useMemo(() => funds.map((fund) => fund.name).filter(Boolean), [funds]);
  const statusOptions = useMemo(() => statuses.map((status) => status.name).filter(Boolean), [statuses]);

  const getStageLog = useCallback(
    (deal) => (Array.isArray(deal?.stageLog) ? deal.stageLog : []),
    []
  );

  const handleSaveStageEntry = useCallback(async ({ stageId, rawDate }) => {
    if (!stageLogModal) return;
    const { dealId, editIndex } = stageLogModal;
    const isEdit = editIndex !== null && editIndex !== undefined;
    const deal = sourceDeals.find((d) => d.id === dealId);
    const current = deal ? getStageLog(deal) : [];
    const currentEntry = isEdit ? current[editIndex] : null;
    const stageOption = stages.find((item) => String(item.id) === String(stageId));

    if (!stageOption?.id) {
      showToast({ type: "error", title: "Stage missing", message: "Please select a valid stage." });
      return;
    }

    try {
      if (isEdit && currentEntry?.id) {
        await api.patch(`/api/dealflow/deals/${dealId}/stage-logs/${currentEntry.id}/`, {
          stage_id: stageOption.id,
          event_date: rawDate || null,
        });
      } else {
        await api.post(`/api/dealflow/deals/${dealId}/stage-logs/`, {
          stage_id: stageOption.id,
          event_date: rawDate || null,
        });
      }
      const reloadedDeals = await loadDeals();
      const refreshedDeal = Array.isArray(reloadedDeals)
        ? reloadedDeals.find((item) => item.id === dealId)
        : null;
      if (refreshedDeal && selectedDeal?.id === dealId) {
        setSelectedDeal(refreshedDeal);
      }
      setStageLogModal(null);
      showToast({
        type: "success",
        title: isEdit ? "Stage updated" : "Stage added",
        message: isEdit
          ? `The stage log entry was updated to "${stageOption.name}".`
          : `A new stage entry for "${stageOption.name}" was added successfully.`,
      });
    } catch (err) {
      showToast({
        type: "error",
        title: isEdit ? "Update failed" : "Add failed",
        message: err.message || "Could not save and reload the stage entry.",
      });
    }
  }, [stageLogModal, sourceDeals, stages, api, loadDeals, showToast, getStageLog, selectedDeal]);

  const handleDeleteStageEntry = useCallback(async (dealId, entryIndex) => {
    const deal = sourceDeals.find((d) => d.id === dealId);
    const current = deal ? getStageLog(deal) : [];
    const removed = current[entryIndex];
    if (!removed?.id) {
      showToast({
        type: "error",
        title: "Delete unavailable",
        message: "Only saved stage entries can be deleted.",
      });
      return;
    }

    try {
      await api.delete(`/api/dealflow/deals/${dealId}/stage-logs/${removed.id}/`);
      await loadDeals().catch(() => {});
      showToast({
        type: "success",
        title: "Stage removed",
        message: `The stage "${removed.stage}" was removed successfully.`,
      });
    } catch (err) {
      showToast({
        type: "error",
        title: "Delete failed",
        message: err.message || "Could not delete the stage entry.",
      });
    }
  }, [sourceDeals, api, loadDeals, showToast, getStageLog]);

  const stageLogModalInitialEntry = useMemo(() => {
    if (!stageLogModal || stageLogModal.editIndex === null) return null;
    const deal = sourceDeals.find((d) => d.id === stageLogModal.dealId);
    if (!deal) return null;
    const log = getStageLog(deal);
    const entry = log[stageLogModal.editIndex];
    if (!entry) return null;
    return {
      stage: entry.stage,
      stageId: entry.stageId || entry?.newStage?.id || null,
      rawDate: entry.rawDate || toRawDate(entry.date),
    };
  }, [stageLogModal, sourceDeals, getStageLog]);

  const filtered = sorted.filter((deal) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    const matchesSearch = (
      String(deal.name || "").toLowerCase().includes(q) ||
      String(deal.code || "").toLowerCase().includes(q) ||
      String(deal.fund || "").toLowerCase().includes(q) ||
      String(deal.status || "").toLowerCase().includes(q) ||
      String(deal.stage || "").toLowerCase().includes(q) ||
      String(deal.sector || "").toLowerCase().includes(q) ||
      String(deal.country || "").toLowerCase().includes(q)
    );
    if (!matchesSearch) return false;

    const matchesMultiFilter = (key, value) => {
      const selected = Array.isArray(selectedFilters[key]) ? selectedFilters[key] : [];
      if (selected.length === 0) return true;
      return selected.includes(value || "");
    };

    return (
      matchesMultiFilter("stage", deal.stage) &&
      matchesMultiFilter("fund", deal.fund) &&
      matchesMultiFilter("sector", deal.sector) &&
      matchesMultiFilter("country", deal.country) &&
      matchesMultiFilter("status", deal.status)
    );
  });

  const handleCreateDeal = async ({ companyName, codeName }) => {
    try {
      const createdDeal = await createDeal({ companyName, codeName });
      setShowNewCompany(false);
      setSelectedDeal(createdDeal);
      showToast({
        type: "success",
        title: "Deal created",
        message: `"${createdDeal.name}" has been created successfully.`,
      });
    } catch (err) {
      showToast({
        type: "error",
        title: "Creation failed",
        message: err.message || "Could not create the deal.",
      });
    }
  };

  const allChecked = filtered.length > 0 && filtered.every((deal) => selectedIds.includes(deal.id));
  const toggleAll = () => setSelectedIds(allChecked ? [] : filtered.map((deal) => deal.id));
  const toggleRow = (id) =>
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((rowId) => rowId !== id) : [...prev, id]));

  const handleDownload = () => {
    try {
      const selectedRows = filtered.filter((deal) => selectedIds.includes(deal.id));
      const exportRows = selectedRows.length > 0 ? selectedRows : filtered;
      if (exportRows.length === 0) {
        showToast({ type: "error", title: "Nothing to export", message: "There are no deals available to download." });
        return;
      }
      exportRowsToExcel({
        rows: exportRows,
        sheetName: "Deals",
        fileName: `dealflow_deals_${new Date().toISOString().slice(0, 10)}`,
        columns: [
          { header: "Name", value: (row) => row.name || "" },
          { header: "Code", value: (row) => row.code || "" },
          { header: "Fund", value: (row) => row.fund || "" },
          { header: "Status", value: (row) => row.status || "" },
          { header: "Stage", value: (row) => row.stage || "" },
          { header: "Sector", value: (row) => row.sector || "" },
          { header: "Ticket", value: (row) => row.ticket || "" },
          { header: "Currency", value: (row) => row.currency || "" },
          { header: "Geography", value: (row) => row.country || "" },
        ],
      });
      showToast({ type: "success", title: "Download started", message: `${exportRows.length} deal${exportRows.length === 1 ? "" : "s"} exported to Excel.` });
    } catch (err) {
      showToast({ type: "error", title: "Download failed", message: err.message || "Could not export deals." });
    }
  };

  const handleDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!window.confirm(`Delete ${selectedIds.length} selected deal${selectedIds.length === 1 ? "" : "s"}?`)) return;
    try {
      const deletedIds = await deleteDeals(selectedIds);
      setSelectedIds((prev) => prev.filter((id) => !deletedIds.includes(id)));
      if (selectedDeal && deletedIds.includes(selectedDeal.id)) setSelectedDeal(null);
      showToast({ type: "success", title: "Deals deleted", message: `${deletedIds.length} deal${deletedIds.length === 1 ? "" : "s"} deleted successfully.` });
    } catch (err) {
      showToast({ type: "error", title: "Delete failed", message: err.message || "Could not delete the selected deals." });
    }
  };

  return (
    <div className="deals-wrapper">
      {showFilter && (
        <FilterModal
          onClose={() => setShowFilter(false)}
          onApply={setSelectedFilters}
          initialSelected={selectedFilters}
          filters={{
            stage: stageOptions,
            fund: fundOptions,
            sector: sectorOptions,
            country: countryOptions,
            status: statusOptions,
          }}
        />
      )}
      {showNewCompany && (
        <NewCompanyModal onClose={() => setShowNewCompany(false)} onNext={handleCreateDeal} />
      )}
      {selectedDealRecord && (
        <InfoTab
          deal={selectedDealRecord}
          onClose={() => setSelectedDeal(null)}
          onSaved={async () => { await loadDeals().catch(() => {}); }}
        />
      )}

      <div className="deals-toolbar">
        <div className="deals-toolbar-searches">
          <SearchBar placeholder="Search deals..." onSearch={setSearch} />
          <SearchBar placeholder="Keyword search..." onSearch={setKeyword} />
        </div>
        <div className="deals-toolbar-actions">
          <button className="deals-btn-outline" onClick={handleDelete} disabled={selectedIds.length === 0 || isDeleting}>
            <TrashIcon />
            {isDeleting ? "Deleting..." : "Delete"}
          </button>
          <button className="deals-btn-outline" onClick={handleDownload} disabled={isLoading || filtered.length === 0}>
            <DownloadIcon />
            Download
          </button>
          <button className="deals-btn-filter" onClick={() => setShowFilter(true)}>Filter</button>
          <button className="deals-btn-primary" onClick={() => setShowNewCompany(true)} disabled={isCreating}>
            <PlusIcon />
            {isCreating ? "Creating..." : "New deal"}
          </button>
        </div>
      </div>

      <div className="deals-table-container">
        <table className="deals-table">
          <thead>
            <tr>
              <th className="deals-th-checkbox">
                <input type="checkbox" className="deals-checkbox" checked={allChecked} onChange={toggleAll} />
              </th>
              {COLS.map((col) => (
                <th key={col.key} className={col.center ? "" : "deals-th-left"}>
                  <SortableHeaderRenderer
                    label={col.label}
                    columnKey={col.key}
                    currentSortKey={sortKey}
                    toggleSort={toggleSort}
                    center={col.center}
                  />
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {isLoading && (
              <tr>
                <td className="deals-td-left" colSpan={COLS.length + 1}>Loading deals...</td>
              </tr>
            )}

            {!isLoading && filtered.map((deal) => {
              const isExpanded = expandedDeals.has(deal.id);
              const stageLog = getStageLog(deal);
              return (
                <React.Fragment key={deal.id}>
                  <tr>
                    <td className="deals-td-checkbox">
                      <input type="checkbox" className="deals-checkbox" checked={selectedIds.includes(deal.id)} onChange={() => toggleRow(deal.id)} />
                    </td>
                    <td className="deals-td-left">
                      <div className="deals-name-cell">
                        <button
                          type="button"
                          className="deals-expand-btn"
                          onClick={(e) => { e.stopPropagation(); toggleExpand(deal.id); }}
                          aria-expanded={isExpanded}
                          aria-label={isExpanded ? "Collapse stage log" : "Expand stage log"}
                        >
                          <span className="deals-expand-icon">
                            {isExpanded ? <MinusIcon /> : <PlusIcon />}
                          </span>
                        </button>
                        <span
                          className="deals-cell-text deals-name-link"
                          role="button"
                          tabIndex={0}
                          onClick={() => setSelectedDeal(deal)}
                          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setSelectedDeal(deal); } }}
                        >
                          {deal.name}
                        </span>
                      </div>
                    </td>
                    <td className="deals-td-left"><span className="deals-cell-text">{deal.code}</span></td>
                    <td className="deals-td-left"><span className="deals-cell-text">{deal.fund}</span></td>
                    <td className="deals-td-center">
                      <span className="deals-stage-badge" style={getStageBadgeStyle(stageColorMap[deal.stage])}>
                        {deal.stage}
                      </span>
                    </td>
                    <td className="deals-td-left"><span className="deals-cell-text">{deal.sector}</span></td>
                    <td className="deals-td-left"><span className="deals-cell-text">{deal.ticket}</span></td>
                    <td className="deals-td-center"><span className="deals-cell-text">{deal.currency}</span></td>
                    <td className="deals-td-left">
                      <span className="deals-geography">
                        {deal.iso2 && (
                          <img src={`https://flagcdn.com/40x30/${deal.iso2}.png`} alt={deal.country} className="country-flag-img" width={20} height={15} />
                        )}
                        {deal.country}
                      </span>
                    </td>
                  </tr>

                  {isExpanded && (
                    <tr className="deals-status-log-row">
                      <td colSpan={COLS.length + 1} className="deals-status-log-cell">
                        <div className="deals-status-log-container">
                          <div className="deals-status-log-title">
                            <button
                              type="button"
                              className="deals-sl-add-btn"
                              onClick={() => setStageLogModal({ dealId: deal.id, editIndex: null })}
                            >
                              <PlusIcon /> New Stage
                            </button>
                            <span>Stage Log</span>
                            <span />
                          </div>
                          <div className="deals-status-log-content">
                            {stageLog.length === 0 ? (
                              <p className="deals-status-log-empty">No stage history available yet.</p>
                            ) : (
                              <div className="deals-status-log-timeline">
                                <div className="deals-status-log-track" />
                                {stageLog.map((entry, i) => (
                                  <div key={i} className="deals-status-log-step">
                                    <div className="deals-status-log-step-dot" />
                                    <span className="deals-stage-badge" style={getStageBadgeStyle(stageColorMap[entry.stage])}>
                                      {entry.stage}
                                    </span>
                                    <span className="deals-status-log-date">{entry.date}</span>
                                    {entry.changedBy && (
                                      <span className="deals-status-log-by">
                                        <span className="deals-status-log-avatar">
                                          {entry.changedBy.charAt(0).toUpperCase()}
                                        </span>
                                        <span className="deals-status-log-by-content">
                                          <span>{entry.changedBy}</span>
                                          {entry.createdAtLabel && (
                                            <span className="deals-status-log-meta">{entry.createdAtLabel}</span>
                                          )}
                                        </span>
                                      </span>
                                    )}
                                    <div className="deals-sl-entry-actions">
                                      <button
                                        type="button"
                                        className="deals-sl-entry-btn"
                                        title="Edit stage"
                                        onClick={() => setStageLogModal({ dealId: deal.id, editIndex: i })}
                                      >
                                        <EditLineIcon />
                                      </button>
                                      <button
                                        type="button"
                                        className="deals-sl-entry-btn deals-sl-entry-btn--delete"
                                        title="Delete stage"
                                        onClick={() => handleDeleteStageEntry(deal.id, i)}
                                      >
                                        <TrashIcon />
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}

            {!isLoading && filtered.length === 0 && (
              <tr>
                <td className="deals-td-left" colSpan={COLS.length + 1}>
                  {search.trim() ? "No deals match your search." : "No deals found yet. Create your first deal to get started."}
                </td>
              </tr>
            )}
          </tbody>

          <tfoot>
            <tr className="deals-total-row">
              <td colSpan={COLS.length + 1}>
                {filtered.length} / {sourceDeals.length}
                {selectedIds.length > 0 && ` · ${selectedIds.length} selected`}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {stageLogModal && (
        <StageLogModal
          stages={stages}
          initialEntry={stageLogModalInitialEntry}
          onSave={handleSaveStageEntry}
          onClose={() => setStageLogModal(null)}
        />
      )}

      {toast && (
        <Toast key={toast.key} title={toast.title} message={toast.message} type={toast.type} duration={toast.duration} onClose={closeToast} />
      )}
      {error && !toast && (
        <Toast type="error" title="Load failed" message={error} duration={0} onClose={() => {}} />
      )}
    </div>
  );
}

export default Deals;
