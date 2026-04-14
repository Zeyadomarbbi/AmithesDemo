// PortfolioTable.jsx
import React, { useMemo, useState } from "react";
import { useNumberFormatter, usePercentageFormatter } from "../../../../../../../../components/useFormatter";
import { SortableHeaderRenderer } from "../../../../../../../../components/Sort/TableSort";
// Adjust the path to where SimpleDropdown is located
import SimpleDropdown from "../../../../../../../../components/SearchBar/SimpleDropdown/SimpleDropdown"; 
import "./PortfolioTable.css";

export const DEFAULT_VISIBLE_COLUMN_KEYS = [
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

  return useMemo(() => ([
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
          label={<>Cost <span className="portfolioHeaderCurrency"></span></>}
          columnKey="cost"
          currentSortKey={sortKey}
          toggleSort={toggleSort}
          center={true}
        />
      ),
      renderCell: (row) => formatNumber(row.cost),
      renderSubtotal: (subtotal) => <td>{formatNumber(subtotal.cost)}</td>,
      renderTotalHeader: () => <th><>Total Cost <span className="portfolioHeaderCurrency"></span></></th>,
      renderTotalCell: (summary) => <td>{formatNumber(summary.cost)}</td>,
    },
    {
      key: "dividends",
      label: "Dividends / Interests",
      renderHeader: (sortKey, toggleSort, section) => (
        <SortableHeaderRenderer
          label={<>Dividends / Interests <span className="portfolioHeaderCurrency"></span></>}
          columnKey="dividends"
          currentSortKey={sortKey}
          toggleSort={toggleSort}
          center={true}
        />
      ),
      renderCell: (row) => formatNumber(row.dividends),
      renderSubtotal: (subtotal) => <td>{formatNumber(subtotal.dividends)}</td>,
      renderTotalHeader: () => <th><>Total Dividends / Interests <span className="portfolioHeaderCurrency"></span></></th>,
      renderTotalCell: (summary) => <td>{formatNumber(summary.dividends)}</td>,
    },
    {
      key: "moicIncl",
      label: "MOIC (incl. dividends)",
      renderHeader: (sortKey, toggleSort, section) => (
        <SortableHeaderRenderer
          label={<>MOIC <span className="portfolioHeaderCurrency"></span>(incl. div)</>}
          columnKey="moicIncl"
          currentSortKey={sortKey}
          toggleSort={toggleSort}
          center={true}
        />
      ),
      renderCell: (row) => formatNumber(row.moicIncl),
      renderSubtotal: (subtotal) => <td>{formatNumber(subtotal.moicIncl)}</td>,
      renderTotalHeader: () => <th><>Total MOIC <span className="portfolioHeaderCurrency"></span>(incl. div)</></th>,
      renderTotalCell: (summary) => <td>{formatNumber(summary.moicIncl)}</td>,
    },
    {
      key: "moicExcl",
      label: "MOIC (excl. dividends)",
      renderHeader: (sortKey, toggleSort, section) => (
        <SortableHeaderRenderer
          label={<>MOIC <span className="portfolioHeaderCurrency"></span>(excl. div)</>}
          columnKey="moicExcl"
          currentSortKey={sortKey}
          toggleSort={toggleSort}
          center={true}
        />
      ),
      renderCell: (row) => formatNumber(row.moicExcl),
      renderSubtotal: (subtotal) => <td>{formatNumber(subtotal.moicExcl)}</td>,
      renderTotalHeader: () => <th><>Total MOIC <span className="portfolioHeaderCurrency"></span>(excl. div)</></th>,
      renderTotalCell: (summary) => <td>{formatNumber(summary.moicExcl)}</td>,
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
      renderTotalHeader: () => <th><>Total Gross IRR <span className="portfolioHeaderCurrency"></span></></th>,
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
            label={<>{title} <span className="portfolioHeaderCurrency"></span></>}
            columnKey="value"
            currentSortKey={sortKey}
            toggleSort={toggleSort}
            center={true}
          />
        );
      },
      renderCell: (row) => formatNumber(row.status === "realized" ? row.exitValue : row.fairValue),
      renderSubtotal: (subtotal) => <td className="col-highlight">{formatNumber(subtotal.value)}</td>,
      renderTotalHeader: () => <th className="col-highlight"><>Total Value <span className="portfolioHeaderCurrency"></span></></th>,
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
            label={<>{title} <span className="portfolioHeaderCurrency"></span></>}
            columnKey="gain"
            currentSortKey={sortKey}
            toggleSort={toggleSort}
            center={false}
          />
        );
      },
      renderCell: (row) => formatNumber(row.gain),
      renderSubtotal: (subtotal) => <td className="col-highlight">{formatNumber(subtotal.gain)}</td>,
      renderTotalHeader: () => <th className="col-highlight"><>Total Gain <span className="portfolioHeaderCurrency"></span></></th>,
      renderTotalCell: (summary) => <td className="col-highlight">{formatNumber(summary.gain)}</td>,
    },
  ]), [getFlagUrl, formatNumber, formatPercentage]);
}

function PortfolioSubTable({ 
  section, 
  columnOptions, 
  onRowClick, 
  isSummary = false,
  summaryData = null 
}) {
  const [visibleColumnKeys, setVisibleColumnKeys] = useState(DEFAULT_VISIBLE_COLUMN_KEYS);

  const visibleColumns = useMemo(() => 
    columnOptions.filter(col => visibleColumnKeys.includes(col.key)),
    [columnOptions, visibleColumnKeys]
  );

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
            value={visibleColumnKeys}
            onChange={setVisibleColumnKeys}
            labelKey="label"
            valueKey="key"
            isSingle={false}
            isSearchBar={true}
            placeholder="Select Columns"
            searchLabel="Filter columns"
          />
        </div>
      </div>

      <div className="portfolio-table-scroll">
        <table className="portfolio-table unified-portfolio-table">
          <colgroup>
            <col style={{ minWidth: "200px" }} />
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
                  <tr key={r.id}>
                    <td className="name-cell" onClick={() => onRowClick(r)}>
                      <div className="name-main">{r.name}</div>
                      <div className="name-sub">{r.sector}</div>
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
  onRowClick,
}) {
  return (
    <section className="portfolio-section">
      {sections.map((section) => (
        <PortfolioSubTable 
          key={section.key}
          section={section}
          columnOptions={columnOptions}
          onRowClick={onRowClick}
        />
      ))}

      {summary && (
        <PortfolioSubTable 
          isSummary
          summaryData={summary}
          columnOptions={columnOptions}
        />
      )}
    </section>
  );
}