import React, { useMemo, useState, useEffect } from "react";
import SearchBar from "../../../../../../components/SearchBar/SearchBar";
import { useTableSort, SortableHeaderRenderer } from "../../../../../../components/Sort/TableSort";
import { TrashIcon, DownloadIcon, PlusIcon, MinusIcon } from "/src/components/Icons/InteractiveIcons";
import Toast from "../../../../components/Toast/Toast";
import { useToast } from "../../../../components/Toast/useToast";
import FilterModal from "./FilterModal";
import NewCompanyModal from "./NewCompanyModal";
import NewAlert from "./NewAlert";
import InfoTab from "./InfoDrawer/InfoTab/InfoTab";
import { useDealsBackend } from "./Deals_backend_work";
import { exportRowsToExcel } from "./exportUtils";
import "./Deals.css";

const DUMMY_STAGE_LOG = [
  { stage: "Sourcing",  date: "Jan 10, 2024", changedBy: "Hadeel" },
  { stage: "Briefing",  date: "Feb 03, 2024", changedBy: "Ziad Omar" },
  { stage: "IC 1",      date: "Mar 15, 2024", changedBy: "Ahmed Amer" },
  { stage: "IC 2",      date: "Apr 22, 2024", changedBy: "Ziad Omar" },
  { stage: "Invested",  date: "May 30, 2024", changedBy: "Hadeel" },
];


function getDealAlertLevel(alertList, now) {
  if (!alertList || alertList.length === 0) return null;
  const latest = alertList[alertList.length - 1];
  if (!latest.date) return null;
  const diff = now - new Date(latest.date).getTime();
  if (diff >= 24 * 60 * 60 * 1000) return "red";
  if (diff >= 0) return "yellow";
  return null;
}

const COLS = [
  { key: "name", label: "Name", center: false },
  { key: "code", label: "Code", center: false },
  { key: "fund", label: "Fund", center: false },
  { key: "status", label: "Status", center: false },
  { key: "stage", label: "Stage", center: true },
  { key: "sector", label: "Sector", center: false },
  { key: "ticket", label: "Ticket", center: false },
  { key: "currency", label: "Currency", center: true },
  { key: "country", label: "Geography", center: false },
];

const stageBadgeClass = (stage) => {
  const map = {
    Briefing: "stage-briefing",
    Dropped: "stage-dropped",
    "In portfolio": "stage-in-portfolio",
    Sourcing: "stage-sourcing",
    "IC 1": "stage-ic1",
    "IC 2": "stage-ic2",
    Invested: "stage-invested",
  };
  return map[stage] || "stage-default";
};

function Deals() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState([]);
  const [showFilter, setShowFilter] = useState(false);
  const [showNewCompany, setShowNewCompany] = useState(false);
  const [selectedDeal, setSelectedDeal] = useState(null);
  const [expandedDeals, setExpandedDeals] = useState(new Set());
  const [dealAlerts, setDealAlerts] = useState(new Map()); // dealId → [{ id, date, note }]
  const [showNewAlertFor, setShowNewAlertFor] = useState(null); // dealId
  const [dismissedDealAlertPopups, setDismissedDealAlertPopups] = useState(new Set());
  const [showDealAlertPopup, setShowDealAlertPopup] = useState(false);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(interval);
  }, []);

  const toggleExpand = (id) => {
    setExpandedDeals((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const { toast, showToast, closeToast } = useToast();
  const { deals, isLoading, isCreating, isDeleting, error, createDeal, deleteDeals, loadDeals } = useDealsBackend();

  const sourceDeals = useMemo(() => (Array.isArray(deals) ? deals : []), [deals]);
  const { sorted, sortKey, toggleSort } = useTableSort(sourceDeals, "name");

  const filtered = sorted.filter((deal) => {
    const q = searchQuery.trim().toLowerCase();
    return (
      String(deal.name || "").toLowerCase().includes(q) ||
      String(deal.code || "").toLowerCase().includes(q) ||
      String(deal.fund || "").toLowerCase().includes(q) ||
      String(deal.status || "").toLowerCase().includes(q) ||
      String(deal.stage || "").toLowerCase().includes(q) ||
      String(deal.sector || "").toLowerCase().includes(q) ||
      String(deal.country || "").toLowerCase().includes(q)
    );
  });

  const handleCreateAlert = (deal, { date, note }) => {
    const newAlert = { id: `alert-${Date.now()}`, date: date.getTime(), note };
    setDealAlerts((prev) => {
      const next = new Map(prev);
      next.set(deal.id, [...(prev.get(deal.id) || []), newAlert]);
      return next;
    });
    setShowNewAlertFor(null);
  };

  const activeDealAlertDeals = useMemo(() => {
    return filtered
      .map((deal) => {
        const level = getDealAlertLevel(dealAlerts.get(deal.id), now);
        if (!level) return null;
        if (dismissedDealAlertPopups.has(deal.id)) return null;
        const alertList = dealAlerts.get(deal.id) || [];
        const latest = alertList[alertList.length - 1];
        return { id: deal.id, name: deal.name, level, note: latest?.note || "" };
      })
      .filter(Boolean);
  }, [filtered, dealAlerts, now, dismissedDealAlertPopups]);

  useEffect(() => {
    if (activeDealAlertDeals.length > 0) setShowDealAlertPopup(true);
  }, [activeDealAlertDeals.length]);

  const handleDismissDealAlertPopup = () => {
    setShowDealAlertPopup(false);
    setDismissedDealAlertPopups((prev) => {
      const next = new Set(prev);
      activeDealAlertDeals.forEach((d) => next.add(d.id));
      return next;
    });
  };

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
        showToast({
          type: "error",
          title: "Nothing to export",
          message: "There are no deals available to download.",
        });
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

      showToast({
        type: "success",
        title: "Download started",
        message: `${exportRows.length} deal${exportRows.length === 1 ? "" : "s"} exported to Excel.`,
      });
    } catch (err) {
      showToast({
        type: "error",
        title: "Download failed",
        message: err.message || "Could not export deals.",
      });
    }
  };

  const handleDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!window.confirm(`Delete ${selectedIds.length} selected deal${selectedIds.length === 1 ? "" : "s"}?`)) return;
    try {
      const deletedIds = await deleteDeals(selectedIds);
      setSelectedIds((prev) => prev.filter((id) => !deletedIds.includes(id)));
      if (selectedDeal && deletedIds.includes(selectedDeal.id)) {
        setSelectedDeal(null);
      }
      showToast({
        type: "success",
        title: "Deals deleted",
        message: `${deletedIds.length} deal${deletedIds.length === 1 ? "" : "s"} deleted successfully.`,
      });
    } catch (err) {
      showToast({
        type: "error",
        title: "Delete failed",
        message: err.message || "Could not delete the selected deals.",
      });
    }
  };

  return (
    <div className="deals-wrapper">
      {showFilter && <FilterModal onClose={() => setShowFilter(false)} />}
      {showNewCompany && (
        <NewCompanyModal onClose={() => setShowNewCompany(false)} onNext={handleCreateDeal} />
      )}
      {showNewAlertFor && (
        <NewAlert
          dealName={showNewAlertFor.name}
          onClose={() => setShowNewAlertFor(null)}
          onSubmit={(data) => handleCreateAlert(showNewAlertFor, data)}
        />
      )}
      {selectedDeal && (
        <InfoTab
          deal={selectedDeal}
          onClose={() => setSelectedDeal(null)}
          onSaved={async () => {
            await loadDeals().catch(() => {});
          }}
        />
      )}

      <div className="deals-toolbar">
        <SearchBar placeholder="Search by name..." onSearch={setSearchQuery} />

        <div className="deals-toolbar-actions">
          <button className="deals-btn-outline" onClick={handleDelete} disabled={selectedIds.length === 0 || isDeleting}>
            <TrashIcon />
            {isDeleting ? "Deleting..." : "Delete"}
          </button>
          <button className="deals-btn-outline" onClick={handleDownload} disabled={isLoading || filtered.length === 0}>
            <DownloadIcon />
            Download
          </button>
          <button className="deals-btn-filter" onClick={() => setShowFilter(true)}>
            Filter
          </button>
          <button className="deals-btn-primary" onClick={() => setShowNewCompany(true)} disabled={isCreating}>
            <PlusIcon />
            {isCreating ? "Creating..." : "New company"}
          </button>
          <button
            className="deals-btn-primary"
            onClick={() => {
              const deal = filtered.find((d) => d.id === selectedIds[0]);
              if (deal) setShowNewAlertFor(deal);
            }}
            disabled={selectedIds.length !== 1}
          >
            <PlusIcon />
            New Alert
          </button>
        </div>
      </div>

      <div className="deals-table-container">
        <table className="deals-table">
          <thead>
            <tr>
              <th className="deals-th-checkbox">
                <input
                  type="checkbox"
                  className="deals-checkbox"
                  checked={allChecked}
                  onChange={toggleAll}
                />
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
                <td className="deals-td-left" colSpan={COLS.length + 1}>
                  Loading deals...
                </td>
              </tr>
            )}

            {!isLoading &&
              filtered.map((deal) => {
                const isExpanded = expandedDeals.has(deal.id);
                // DUMMY DATA — remove before connecting to backend
                const stageLog = deal.stageLog || DUMMY_STAGE_LOG;

                return (
                  <React.Fragment key={deal.id}>
                    <tr>
                      <td className="deals-td-checkbox">
                        <input
                          type="checkbox"
                          className="deals-checkbox"
                          checked={selectedIds.includes(deal.id)}
                          onChange={() => toggleRow(deal.id)}
                        />
                      </td>

                      <td className="deals-td-left">
                        <div className="deals-name-cell">
                          <button
                            type="button"
                            className="deals-expand-btn"
                            onClick={(e) => { e.stopPropagation(); toggleExpand(deal.id); }}
                            aria-expanded={isExpanded}
                            aria-label={isExpanded ? "Collapse status log" : "Expand status log"}
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
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault();
                                setSelectedDeal(deal);
                              }
                            }}
                          >
                            {deal.name}
                          </span>
                        </div>
                      </td>

                      <td className="deals-td-left">
                        <span className="deals-cell-text">{deal.code}</span>
                      </td>

                      <td className="deals-td-left">
                        <span className="deals-cell-text">{deal.fund}</span>
                      </td>

                      <td className="deals-td-left">
                        <span className="deals-cell-text">{deal.status}</span>
                      </td>

                      <td className="deals-td-center">
                        <span className={`deals-stage-badge ${stageBadgeClass(deal.stage)}`}>{deal.stage}</span>
                      </td>

                      <td className="deals-td-left">
                        <span className="deals-cell-text">{deal.sector}</span>
                      </td>

                      <td className="deals-td-left">
                        <span className="deals-cell-text">{deal.ticket}</span>
                      </td>

                      <td className="deals-td-center">
                        <span className="deals-cell-text">{deal.currency}</span>
                      </td>

                      <td className="deals-td-left">
                        <span className="deals-geography">
                          {deal.iso2 && (
                            <img
                              src={`https://flagcdn.com/40x30/${deal.iso2}.png`}
                              alt={deal.country}
                              className="country-flag-img"
                              width={20}
                              height={15}
                            />
                          )}
                          {deal.country}
                        </span>
                      </td>

                    </tr>

                    {isExpanded && (
                      <tr className="deals-status-log-row">
                        <td colSpan={COLS.length + 1} className="deals-status-log-cell">
                          <div className="deals-status-log-container">
                            <div className="deals-status-log-title">Stage Log</div>
                            <div className="deals-status-log-content">
                              {stageLog.length === 0 ? (
                                <p className="deals-status-log-empty">No stage history available yet.</p>
                              ) : (
                                <div className="deals-status-log-timeline">
                                  <div className="deals-status-log-track" />
                                  {stageLog.map((entry, i) => {
                                    const isLast = i === stageLog.length - 1;
                                    const alertLevel = isLast ? getDealAlertLevel(dealAlerts.get(deal.id), now) : null;
                                    return (
                                      <div key={i} className="deals-status-log-step">
                                        <div className={`deals-status-log-step-dot${alertLevel ? ` deals-status-log-step-dot--${alertLevel}` : ""}`} />
                                        <span className={`deals-stage-badge ${stageBadgeClass(entry.stage)}`}>
                                          {entry.stage}
                                        </span>
                                        {alertLevel && (
                                          <span className={`deals-stage-alert deals-stage-alert--${alertLevel}`}>
                                            {alertLevel === "yellow" ? "⚠ Pending" : "🔴 Overdue"}
                                          </span>
                                        )}
                                        <span className="deals-status-log-date">{entry.date}</span>
                                        {entry.changedBy && (
                                          <span className="deals-status-log-by">
                                            <span className="deals-status-log-avatar">
                                              {entry.changedBy.charAt(0).toUpperCase()}
                                            </span>
                                            {entry.changedBy}
                                          </span>
                                        )}
                                      </div>
                                    );
                                  })}
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
                  {searchQuery.trim()
                    ? "No deals match your search."
                    : "No deals found yet. Create your first deal to get started."}
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

      {showDealAlertPopup && activeDealAlertDeals.length > 0 && (
        <div className="deals-alert-popup">
          <div className="deals-alert-popup-header">
            <span className="deals-alert-popup-icon">🔔</span>
            <span className="deals-alert-popup-title">Deal Alert</span>
            <button className="deals-alert-popup-close" onClick={handleDismissDealAlertPopup} aria-label="Dismiss">×</button>
          </div>
          <div className="deals-alert-popup-body">
            <p className="deals-alert-popup-desc">
              The following deal{activeDealAlertDeals.length > 1 ? "s have" : " has"} a scheduled alert:
            </p>
            <ul className="deals-alert-popup-list">
              {activeDealAlertDeals.map((d) => (
                <li key={d.id} className={`deals-alert-popup-item${d.level === "red" ? " deals-alert-popup-item--red" : ""}`}>
                  <span className="deals-alert-popup-deal-name">{d.name}</span>
                  {d.note && (
                    <span className="deals-alert-popup-deal-meta">{d.note}</span>
                  )}
                </li>
              ))}
            </ul>
          </div>
          <div className="deals-alert-popup-footer">
            <button className="deals-alert-popup-btn" onClick={handleDismissDealAlertPopup}>
              Got it
            </button>
          </div>
        </div>
      )}

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

      {error && !toast && (
        <Toast type="error" title="Load failed" message={error} duration={0} onClose={() => {}} />
      )}
    </div>
  );
}

export default Deals;
