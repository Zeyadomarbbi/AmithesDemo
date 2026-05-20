import React, { useMemo, useState } from "react";
import SearchBar from "../../../../../../components/SearchBar/SearchBar";
import { useTableSort, SortableHeaderRenderer } from "../../../../../../components/Sort/TableSort";
import { TrashIcon, DownloadIcon, PlusIcon } from "/src/components/Icons/InteractiveIcons";
import Toast from "../../../../components/Toast/Toast";
import { useToast } from "../../../../components/Toast/useToast";
import FilterModal from "./FilterModal";
import NewCompanyModal from "./NewCompanyModal";
import InfoTab from "./InfoDrawer/InfoTab/InfoTab";
import { useDealsBackend } from "./Deals_backend_work";
import { exportRowsToExcel } from "./exportUtils";
import "./Deals.css";

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
              filtered.map((deal) => (
                <tr key={deal.id}>
                  <td className="deals-td-checkbox">
                    <input
                      type="checkbox"
                      className="deals-checkbox"
                      checked={selectedIds.includes(deal.id)}
                      onChange={() => toggleRow(deal.id)}
                    />
                  </td>

                  <td className="deals-td-left">
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
              ))}

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
