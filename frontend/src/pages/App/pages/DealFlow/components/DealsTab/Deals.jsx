import React, { useState } from "react";
import SearchBar from "../../../../../../components/SearchBar/SearchBar";
import { useTableSort, SortableHeaderRenderer } from "../../../../../../components/Sort/TableSort";
import { TrashIcon, DownloadIcon, PlusIcon } from "/src/components/Icons/InteractiveIcons";
import FilterModal from "./FilterModal";
import NewCompanyModal from "./NewCompanyModal";
import InfoTab from "./InfoDrawer/InfoTab/InfoTab";
import "./Deals.css";

const DEALS_DATA = [
  { id: 1, name: "Medisis", code: "Medisis", fund: "Fund III", status: "Live",     stage: "Briefing",      sector: "Materials", ticket: "10,000,000", currency: "EUR", iso2: "fr", country: "France" },
  { id: 2, name: "Medisis", code: "Medisis", fund: "Fund III", status: "Dropped",  stage: "Dropped",       sector: "Materials", ticket: "10,000,000", currency: "EUR", iso2: "fr", country: "France" },
  { id: 3, name: "Medisis", code: "Medisis", fund: "Fund III", status: "Invested", stage: "In portfolio",  sector: "Materials", ticket: "10,000,000", currency: "EUR", iso2: "fr", country: "France" },
  { id: 4, name: "Medisis", code: "Medisis", fund: "Fund III", status: "Dropped",  stage: "Dropped",       sector: "Materials", ticket: "10,000,000", currency: "EUR", iso2: "fr", country: "France" },
  { id: 5, name: "Medisis", code: "Medisis", fund: "Fund III", status: "Live",     stage: "Sourcing",      sector: "Materials", ticket: "10,000,000", currency: "EUR", iso2: "fr", country: "France" },
  { id: 6, name: "Medisis", code: "Medisis", fund: "Fund III", status: "Live",     stage: "IC 1",          sector: "Materials", ticket: "10,000,000", currency: "EUR", iso2: "fr", country: "France" },
  { id: 7, name: "Medisis", code: "Medisis", fund: "Fund III", status: "Live",     stage: "IC 1",          sector: "Materials", ticket: "10,000,000", currency: "EUR", iso2: "fr", country: "France" },
];

const COLS = [
  { key: "name",     label: "Name",      center: false },
  { key: "code",     label: "Code",      center: false },
  { key: "fund",     label: "Fund",      center: false },
  { key: "status",   label: "Status",    center: false },
  { key: "stage",    label: "Stage",     center: true  },
  { key: "sector",   label: "Sector",    center: false },
  { key: "ticket",   label: "Ticket",    center: false },
  { key: "currency", label: "Currency",  center: true  },
  { key: "country",  label: "Geography", center: false },
];

const stageBadgeClass = (stage) => {
  const map = {
    "Briefing":     "stage-briefing",
    "Dropped":      "stage-dropped",
    "In portfolio": "stage-in-portfolio",
    "Sourcing":     "stage-sourcing",
    "IC 1":         "stage-ic1",
    "IC 2":         "stage-ic2",
    "Invested":     "stage-invested",
  };
  return map[stage] || "stage-default";
};

function Deals() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState([]);
  const [showFilter, setShowFilter] = useState(false);
  const [showNewCompany, setShowNewCompany] = useState(false);
  const [selectedDeal, setSelectedDeal] = useState(null);

  const { sorted, sortKey, toggleSort } = useTableSort(DEALS_DATA, "name");

  const filtered = sorted.filter((d) => {
    const q = searchQuery.trim().toLowerCase();
    return (
      d.name.toLowerCase().includes(q) ||
      d.code.toLowerCase().includes(q) ||
      d.fund.toLowerCase().includes(q) ||
      d.status.toLowerCase().includes(q) ||
      d.stage.toLowerCase().includes(q) ||
      d.sector.toLowerCase().includes(q) ||
      d.country.toLowerCase().includes(q)
    );
  });

  const allChecked = filtered.length > 0 && filtered.every((d) => selectedIds.includes(d.id));

  const toggleAll = () =>
    setSelectedIds(allChecked ? [] : filtered.map((d) => d.id));

  const toggleRow = (id) =>
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );

  return (
    <div className="deals-wrapper">
      {showFilter && (
        <FilterModal onClose={() => setShowFilter(false)} />
      )}
      {showNewCompany && (
        <NewCompanyModal onClose={() => setShowNewCompany(false)} />
      )}
      {selectedDeal && (
        <InfoTab deal={selectedDeal} onClose={() => setSelectedDeal(null)} />
      )}

      {/* Toolbar */}
      <div className="deals-toolbar">
        <SearchBar placeholder="Search by name..." onSearch={setSearchQuery} />

        <div className="deals-toolbar-actions">
          <button className="deals-btn-outline">
            <TrashIcon />
            Delete
          </button>
          <button className="deals-btn-outline">
            <DownloadIcon />
            Download
          </button>
          <button className="deals-btn-filter" onClick={() => setShowFilter(true)}>Filter</button>
          <button className="deals-btn-primary" onClick={() => setShowNewCompany(true)}>
            <PlusIcon />
            New company
          </button>
        </div>
      </div>

      {/* Table */}
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
                <th
                  key={col.key}
                  className={col.center ? "" : "deals-th-left"}
                >
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
            {filtered.map((deal) => (
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
                  <span className={`deals-stage-badge ${stageBadgeClass(deal.stage)}`}>
                    {deal.stage}
                  </span>
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
          </tbody>

          <tfoot>
            <tr className="deals-total-row">
              <td colSpan={COLS.length + 1}>
                {filtered.length} / {DEALS_DATA.length}
                {selectedIds.length > 0 && ` · ${selectedIds.length} selected`}
              </td>
            </tr>
          </tfoot>

        </table>
      </div>
    </div>
  );
}

export default Deals;
