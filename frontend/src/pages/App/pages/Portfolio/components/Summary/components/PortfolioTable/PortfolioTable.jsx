// PortfolioTable.jsx
import React, { useMemo } from "react";
import { useNumberFormatter, usePercentageFormatter, useMoicFormatter, useDateFormatter } from "../../../../../../../../components/useFormatter";
import { SortableHeaderRenderer } from "../../../../../../../../components/Sort/TableSort";
import { FilterColumnsIcon } from "../../../../../../../../components/Icons/InteractiveIcons";
import SimpleDropdown from "../../../../../../../../components/SearchBar/SimpleDropdown/SimpleDropdown"; 
import "./PortfolioTable.css";

export const DEFAULT_VISIBLE_COLUMN_KEYS = [
  "sector",
  "country",
  "cost",
  "dividends",
  "moicIncl",
  "moicExcl",
  "irr",
  "value",
  "gain",
];

export function useColumnOptions(getFlagUrl) {
  const formatNumber = useNumberFormatter();
  const formatPercentage = usePercentageFormatter();
  const formatMoic = useMoicFormatter();
  return useMemo(() => ([
    {
      key: "sector",
      label: "Sector",
      renderHeader: (sortKey, toggleSort) => (
        <SortableHeaderRenderer
          label="Sector"
          columnKey="sector"
          currentSortKey={sortKey}
          toggleSort={toggleSort}
          center={true}
        />
      ),
      renderCell: (row) => row.sector,
      renderSubtotal: () => <td />,
      renderTotalHeader: () => <th />,
      renderTotalCell: () => <td />,
    },
    {
      key: "country",
      label: "Geography",
      renderHeader: (sortKey, toggleSort, section) => (
        <SortableHeaderRenderer
          label="Geography"
          columnKey="country"
          currentSortKey={sortKey}
          toggleSort={toggleSort}
          center={true}
        />
      ),
      renderCell: (row) => (
        <div className="geography-cell">
          {getFlagUrl(row.country) && (
            <img
              src={getFlagUrl(row.country)}
              alt={row.country}
              className="country-flag-img"
            />
          )}
          <span>{row.country}</span>
        </div>
      ),
      renderSubtotal: () => <td />,
      renderTotalHeader: () => <th />,
      renderTotalCell: () => <td />,
    },
    {
      key: "ownership",
      label: "Ownership",
      renderHeader: (sortKey, toggleSort, section) => (
        <SortableHeaderRenderer
          label="Ownership"
          columnKey="ownership"
          currentSortKey={sortKey}
          toggleSort={toggleSort}
          center={true}
        />
      ),
      renderCell: (row) => formatPercentage(row.ownership),
      renderSubtotal: () => <td />,
      renderTotalHeader: () => <th />,
      renderTotalCell: () => <td />,
    },
    {
      key: "cost",
      label: "Cost",
      renderHeader: (sortKey, toggleSort, section) => (
        <SortableHeaderRenderer
          label={<>Cost </>}
          columnKey="cost"
          currentSortKey={sortKey}
          toggleSort={toggleSort}
          center={true}
        />
      ),
      renderCell: (row) => formatNumber(row.cost),
      renderSubtotal: (subtotal) => <td>{formatNumber(subtotal.cost)}</td>,
      renderTotalHeader: () => <th><>Total Cost </></th>,
      renderTotalCell: (summary) => <td>{formatNumber(summary.cost)}</td>,
    },
    {
      key: "dividends",
      label: "Dividends / Interests",
      renderHeader: (sortKey, toggleSort, section) => (
        <SortableHeaderRenderer
          label={<>Dividends / Interests </>}
          columnKey="dividends"
          currentSortKey={sortKey}
          toggleSort={toggleSort}
          center={true}
        />
      ),
      renderCell: (row) => formatNumber(row.dividends),
      renderSubtotal: (subtotal) => <td>{formatNumber(subtotal.dividends)}</td>,
      renderTotalHeader: () => <th><>Total Dividends / Interests </></th>,
      renderTotalCell: (summary) => <td>{formatNumber(summary.dividends)}</td>,
    },
    {
      key: "moicIncl",
      label: "MOIC (incl. dividends)",
      renderHeader: (sortKey, toggleSort, section) => (
        <SortableHeaderRenderer
          label={<>MOIC (incl. div)</>}
          columnKey="moicIncl"
          currentSortKey={sortKey}
          toggleSort={toggleSort}
          center={true}
        />
      ),
      renderCell: (row) => formatMoic(row.moicIncl),
      renderSubtotal: (subtotal) => <td>{formatMoic(subtotal.moicIncl)}</td>,
      renderTotalHeader: () => <th><>Total MOIC (incl. div)</></th>,
      renderTotalCell: (summary) => <td>{formatMoic(summary.moicIncl)}</td>,
    },
    {
      key: "moicExcl",
      label: "MOIC (excl. dividends)",
      renderHeader: (sortKey, toggleSort, section) => (
        <SortableHeaderRenderer
          label={<>MOIC (excl. div)</>}
          columnKey="moicExcl"
          currentSortKey={sortKey}
          toggleSort={toggleSort}
          center={true}
        />
      ),
      renderCell: (row) => formatMoic(row.moicExcl),
      renderSubtotal: (subtotal) => <td>{formatMoic(subtotal.moicExcl)}</td>,
      renderTotalHeader: () => <th><>Total MOIC (excl. div)</></th>,
      renderTotalCell: (summary) => <td>{formatMoic(summary.moicExcl)}</td>,
    },
    {
      key: "irr",
      label: "Gross IRR",
      renderHeader: (sortKey, toggleSort, section) => (
        <SortableHeaderRenderer
          label="Gross IRR"
          columnKey="irr"
          currentSortKey={sortKey}
          toggleSort={toggleSort}
          center={true}
        />
      ),
      renderCell: (row) => formatPercentage(row.irr * 100),
      renderSubtotal: (subtotal) => <td>{formatPercentage(subtotal.irr * 100)}</td>,
      renderTotalHeader: () => <th><>Total Gross IRR </></th>,
      renderTotalCell: (summary) => <td>{formatPercentage(summary.irr * 100)}</td>,
    },
    {
      key: "value",
      label: "Value",
      className: "col-highlight",
      renderHeader: (sortKey, toggleSort, section) => {
        const title = section?.key === "realized" ? "Exit Value" : "Fair Value";
        return (
          <SortableHeaderRenderer
            label={<>{title} </>}
            columnKey="value"
            currentSortKey={sortKey}
            toggleSort={toggleSort}
            center={true}
          />
        );
      },
      renderCell: (row) => formatNumber(row.status === "realized" ? row.exitValue : row.fairValue),
      renderSubtotal: (subtotal) => <td className="col-highlight">{formatNumber(subtotal.value)}</td>,
      renderTotalHeader: () => <th className="col-highlight"><>Total Value </></th>,
      renderTotalCell: (summary) => <td className="col-highlight">{formatNumber(summary.value)}</td>,
    },
    {
      key: "gain",
      label: "Gain",
      className: "col-highlight",
      renderHeader: (sortKey, toggleSort, section) => {
        const title = section?.gainLabel || "Gain";
        return (
          <SortableHeaderRenderer
            label={<>{title} </>}
            columnKey="gain"
            currentSortKey={sortKey}
            toggleSort={toggleSort}
            center={true}
          />
        );
      },
      renderCell: (row) => formatNumber(row.gain),
      renderSubtotal: (subtotal) => <td className="col-highlight">{formatNumber(subtotal.gain)}</td>,
      renderTotalHeader: () => <th className="col-highlight"><>Total Gain </></th>,
      renderTotalCell: (summary) => <td className="col-highlight">{formatNumber(summary.gain)}</td>,
    },
  ]), [getFlagUrl, formatNumber, formatPercentage]);
}

function PortfolioSubTable({ 
  sectionKey,
  section, 
  columnOptions, 
  onRowClick, 
  sectionVisibleKeys,
  setSectionVisibleKeys,
  isSummary = false,
  summaryData = null 
}) {
  const activeKeys = sectionVisibleKeys?.[sectionKey] || [];
  const formatDate = useDateFormatter();
  const visibleColumns = useMemo(() => 
    columnOptions.filter(col => activeKeys.includes(col.key)),
    [columnOptions, activeKeys]
  );

  const handleDropdownChange = (newKeys) => {
    setSectionVisibleKeys(prev => ({ ...prev, [sectionKey]: newKeys }));
  };

  return (
    <div className="portfolio-table-card">
      <div className="portfolio-section-header-standalone">
        <h2>
          {isSummary ? "Total Portfolio" : section.title}
          {!isSummary && <span className="portfolio-count">{section.rows.length}</span>}
        </h2>
        
        <div className="portfolio-columns-picker">
          <SimpleDropdown 
            options={columnOptions}
            value={activeKeys}
            onChange={handleDropdownChange}
            labelKey="label"
            valueKey="key"
            isSingle={false}
            isSearchBar={true}
            searchLabel="Filter columns"
            variant="icon"
            icon={<FilterColumnsIcon />}
          />
        </div>
      </div>

      <div className="portfolio-table-scroll">
        <table className="portfolio-table unified-portfolio-table">
          <colgroup>
            {visibleColumns.map(col => <col key={col.key} />)}
          </colgroup>
          
          <thead>
            <tr className="portfolio-section-headers-row">
              <th>
                <SortableHeaderRenderer
                  label="Name"
                  columnKey="name"
                  currentSortKey={isSummary ? null : section.sortKey}
                  toggleSort={isSummary ? () => {} : section.toggleSort}
                  center={false}
                />
              </th>
              {visibleColumns.map(col => (
                <th key={col.key}>
                  {col.renderHeader(
                    isSummary ? null : section.sortKey, 
                    isSummary ? () => {} : section.toggleSort, 
                    section
                  )}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {!isSummary ? (
              <>
                {section.rows.map(r => (
                  <tr key={r.id} className="pf-row-clickable" onClick={() => onRowClick(r)}>
                    <td className="pf-name-cell">
                      <div className="pf-name-main">{r.name}</div>
                      <div className="pf-name-sub">
                        {r.firstInvestmentDate ? formatDate(r.firstInvestmentDate) : "No Date"}
                      </div>
                    </td>
                    {visibleColumns.map(col => (
                      <td key={col.key}>{col.renderCell(r, section)}</td>
                    ))}
                  </tr>
                ))}
                <tr className="portfolio-subtotal-row">
                  <td>Sub Total</td>
                  {visibleColumns.map(col => (
                    <React.Fragment key={col.key}>
                      {col.renderSubtotal(section.subtotal, section)}
                    </React.Fragment>
                  ))}
                </tr>
              </>
            ) : (
              <tr className="portfolio-subtotal-row total-row">
                <td>Total</td>
                {visibleColumns.map(col => (
                  <React.Fragment key={col.key}>
                    {col.renderTotalCell(summaryData)}
                  </React.Fragment>
                ))}
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function PortfolioTable({
  sections,
  summary,
  columnOptions,
  sectionVisibleKeys,
  setSectionVisibleKeys,
  onRowClick,
}) {
  return (
    <section className="portfolio-section">
      {sections.map((section) => (
        <PortfolioSubTable 
          key={section.key}
          sectionKey={section.key}
          section={section}
          columnOptions={columnOptions}
          sectionVisibleKeys={sectionVisibleKeys}
          setSectionVisibleKeys={setSectionVisibleKeys}
          onRowClick={onRowClick}
        />
      ))}

      {summary && (
        <PortfolioSubTable 
          sectionKey="summary"
          isSummary
          summaryData={summary}
          columnOptions={columnOptions}
          sectionVisibleKeys={sectionVisibleKeys}
          setSectionVisibleKeys={setSectionVisibleKeys}
        />
      )}
    </section>
  );
}