import React, { useMemo, useRef, useEffect } from "react";
import { useNumberFormatter, usePercentageFormatter, useDateFormatter } from "../../../../../../../../components/useFormatter";
import { useTableSort, SortableHeaderRenderer } from "../../../../../../../../components/Sort/TableSort";
import { FilterColumnsIcon } from "../../../../../../../../components/Icons/InteractiveIcons";
import "./PortfolioTable.css";

const toNumber = (v) =>
  Number(String(v ?? "").replace(/,/g, "").trim()) || 0;

const calcValue = (row) =>
  toNumber(row.fairValue !== null && row.fairValue !== undefined ? row.fairValue : row.exitValue);

const calcDividendsTotal = (row) => toNumber(row.dividends) + toNumber(row.interests);

const calcGain = (row) => calcValue(row) + calcDividendsTotal(row) - toNumber(row.cost);

const calcMoicIncl = (row) =>
  row.moicIncl !== undefined ? toNumber(row.moicIncl) : 0;

export { calcValue, calcDividendsTotal, calcGain, calcMoicIncl };

export const DEFAULT_VISIBLE_COLUMN_KEYS = [
  "country",
  "ownership",
  "cost",
  "dividends",
  "moic",
  "irr",
  "fairValue",
  "gain",
];

export function useColumnOptions(getFlagUrl) {
  const formatNumber = useNumberFormatter();
  const formatPercentage = usePercentageFormatter();
  const formatDate = useDateFormatter();

  return useMemo(() => ([
    {
      key: "country",
      label: "Geography",
      width: "140px",
      renderHeader: (sortKey, toggleSort) => (
        <SortableHeaderRenderer
          label="Geography"
          columnKey="country"
          currentSortKey={sortKey}
          toggleSort={toggleSort}
          center={false}
        />
      ),
      renderCell: (row) => (
        <div className="geography-cell">
          {getFlagUrl(row.country) && (
            <img
              src={getFlagUrl(row.country)}
              alt={row.country}
              className="country-flag-img"
              width={20}
              height={15}
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
      width: "120px",
      renderHeader: (sortKey, toggleSort) => (
        <SortableHeaderRenderer
          label="Ownership"
          columnKey="ownership"
          currentSortKey={sortKey}
          toggleSort={toggleSort}
          center={false}
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
      width: "130px",
      renderHeader: (sortKey, toggleSort) => (
        <SortableHeaderRenderer
          label={<>Cost <span className="portfolioHeaderCurrency"></span></>}
          columnKey="cost"
          currentSortKey={sortKey}
          toggleSort={toggleSort}
          center={false}
        />
      ),
      renderCell: (row) => formatNumber(row.cost),
      renderSubtotal: (subtotal) => <td>{formatNumber(subtotal.cost)}</td>,
      renderTotalHeader: () => <th><>Total Cost <span className="portfolioHeaderCurrency"></span></></th>,
      renderTotalCell: (summary) => <td>{formatNumber(summary.cost)}</td>,
    },
    {
      key: "dividends",
      label: "Dividend/Interests",
      width: "190px",
      renderHeader: (sortKey, toggleSort) => (
        <SortableHeaderRenderer
          label={<>Dividends / Interests <span className="portfolioHeaderCurrency"></span></>}
          columnKey="dividends"
          currentSortKey={sortKey}
          toggleSort={toggleSort}
          center={false}
        />
      ),
      renderCell: (row) => formatNumber(calcDividendsTotal(row)),
      renderSubtotal: (subtotal) => <td>{formatNumber(subtotal.dividends)}</td>,
      renderTotalHeader: () => <th><>Total Dividends / Interests <span className="portfolioHeaderCurrency"></span></></th>,
      renderTotalCell: (summary) => <td>{formatNumber(summary.dividends)}</td>,
    },
    {
      key: "moic",
      label: "MOIC",
      width: "180px",
      renderHeader: (sortKey, toggleSort) => (
        <SortableHeaderRenderer
          label={<>MOIC <span className="portfolioHeaderCurrency"></span></>}
          columnKey="moicIncl"
          currentSortKey={sortKey}
          toggleSort={toggleSort}
          center={false}
        />
      ),
      renderCell: (row) => formatNumber(calcMoicIncl(row)),
      renderSubtotal: (subtotal) => <td>{formatNumber(subtotal.moicIncl)}</td>,
      renderTotalHeader: () => <th><>Total MOIC <span className="portfolioHeaderCurrency"></span></></th>,
      renderTotalCell: (summary) => <td>{formatNumber(summary.moicIncl)}</td>,
    },
    {
      key: "irr",
      label: "Gross IRR",
      width: "150px",
      renderHeader: (sortKey, toggleSort) => (
        <SortableHeaderRenderer
          label="Gross IRR"
          columnKey="irr"
          currentSortKey={sortKey}
          toggleSort={toggleSort}
          center={false}
        />
      ),
      renderCell: (row) => formatPercentage(toNumber(row.irr) * 100),
      renderSubtotal: (subtotal) => <td>{formatPercentage(toNumber(subtotal.irr) * 100)}</td>,
      renderTotalHeader: () => <th><>Total Gross IRR <span className="portfolioHeaderCurrency"></span></></th>,
      renderTotalCell: (summary) => <td>{formatPercentage(toNumber(summary.irr) * 100)}</td>,
    },
    {
      key: "fairValue",
      label: "Fair Value",
      width: "160px",
      className: "col-highlight",
      renderHeader: (sortKey, toggleSort) => (
        <SortableHeaderRenderer
          label={<>Fair Value <span className="portfolioHeaderCurrency"></span></>}
          columnKey="fairValue"
          currentSortKey={sortKey}
          toggleSort={toggleSort}
          center={false}
        />
      ),
      renderCell: (row) => formatNumber(calcValue(row)),
      renderSubtotal: (subtotal) => <td className="col-highlight">{formatNumber(subtotal.value)}</td>,
      renderTotalHeader: () => <th className="col-highlight"><>Total Fair Value <span className="portfolioHeaderCurrency"></span></></th>,
      renderTotalCell: (summary) => <td className="col-highlight">{formatNumber(summary.value)}</td>,
    },
    {
      key: "gain",
      label: "Unrealized gain",
      width: "160px",
      className: "col-highlight",
      renderHeader: (sortKey, toggleSort, gainLabel) => (
        <SortableHeaderRenderer
          label={<>{gainLabel} <span className="portfolioHeaderCurrency"></span></>}
          columnKey="unrealizedGain"
          currentSortKey={sortKey}
          toggleSort={toggleSort}
          center={false}
        />
      ),
      renderCell: (row) => formatNumber(calcGain(row)),
      renderSubtotal: (subtotal) => <td className="col-highlight">{formatNumber(subtotal.gain)}</td>,
      renderTotalHeader: () => <th className="col-highlight"><>Total Gain <span className="portfolioHeaderCurrency"></span></></th>,
      renderTotalCell: (summary) => <td className="col-highlight">{formatNumber(summary.gain)}</td>,
    },
  ]), [getFlagUrl, formatNumber, formatPercentage]);
}

export function ColumnPicker({ columnOptions, visibleColumnKeys, onToggle, menuKey, openMenuKey, onOpenMenuKey }) {
  const ref = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        onOpenMenuKey(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onOpenMenuKey]);

  const isOpen = openMenuKey === menuKey;

  return (
    <div
      className="quarter-selector-container portfolio-columns-picker"
      ref={isOpen ? ref : null}
    >
      <button
        type="button"
        className={`quarter-selector-button portfolio-columns-trigger${isOpen ? " active" : ""}`}
        onClick={(e) => {
          e.stopPropagation();
          onOpenMenuKey(isOpen ? null : menuKey);
        }}
        aria-label="Select visible columns"
        title="Select visible columns"
      >
        <FilterColumnsIcon />
      </button>
      {isOpen && (
        <div
          className="quarter-dropdown portfolio-columns-menu"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="quarter-list portfolio-columns-list">
            {columnOptions.map((column) => {
              const checked = visibleColumnKeys.includes(column.key);
              return (
                <label
                  key={column.key}
                  className={`quarter-item portfolio-columns-option${checked ? " selected checked" : ""}`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => onToggle(column.key)}
                  />
                  <div
                    className={`qs-checkbox portfolio-columns-checkbox ${checked ? "checked" : ""}`}
                    aria-hidden="true"
                  />
                  <div className="quarter-item-content">
                    <span className="item-label-bold portfolio-columns-label">{column.label}</span>
                  </div>
                </label>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export function PortfolioTable({
  title,
  count,
  rows,
  subtotal,
  summary,
  initialSortKey = "name",
  gainLabel,
  visibleColumns,
  columnOptions,
  visibleColumnKeys,
  onToggleColumn,
  openMenuKey,
  onOpenMenuKey,
  menuKey,
  onRowClick,
  showTotalRow = false,
}) {
  const { sorted, sortKey, toggleSort } = useTableSort(rows, initialSortKey);

  const renderColGroup = () => (
    <colgroup>
      <col style={{ width: "220px" }} />
      {visibleColumns.map((column) => (
        <col key={column.key} style={{ width: column.width, minWidth: column.width }} />
      ))}
    </colgroup>
  );

  const renderHeaders = () => (
    <tr>
      <th>
        <SortableHeaderRenderer
          label="Name"
          columnKey="name"
          currentSortKey={sortKey}
          toggleSort={toggleSort}
          center={false}
        />
      </th>
      {visibleColumns.map((column) => (
        <th key={column.key} className={column.className || ""}>
          {column.renderHeader(sortKey, toggleSort, gainLabel)}
        </th>
      ))}
    </tr>
  );

  const renderBody = () => (
    <>
      {sorted.map((r) => (
        <tr key={r.id}>
          <td className="name-cell" onClick={() => onRowClick(r)}>
            <div className="name-main">{r.name}</div>
            <div className="name-sub">{r.sector}</div>
          </td>
          {visibleColumns.map((column) => (
            <td key={`${r.id}-${column.key}`} className={column.className || ""}>
              {column.renderCell(r)}
            </td>
          ))}
        </tr>
      ))}
    </>
  );

  const renderSubtotal = () => (
    <tr className="portfolio-subtotal-row">
      <td className="subtotal-name-cell">Sub Total</td>
      {visibleColumns.map((column) => (
        <React.Fragment key={`subtotal-${column.key}`}>
          {column.renderSubtotal(subtotal)}
        </React.Fragment>
      ))}
    </tr>
  );

  if (showTotalRow) {
    return (
      <section className="portfolio-total-section">
        <div className="portfolio-table-scroll">
          <table className="portfolio-table total-table">
            {renderColGroup()}
            <thead>
              <tr>
                <th />
                {visibleColumns.map((column) => (
                  <React.Fragment key={`total-header-${column.key}`}>
                    {column.renderTotalHeader()}
                  </React.Fragment>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr className="portfolio-subtotal-row total-row">
                <td className="subtotal-name-cell">Total</td>
                {visibleColumns.map((column) => (
                  <React.Fragment key={`total-cell-${column.key}`}>
                    {column.renderTotalCell(summary)}
                  </React.Fragment>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    );
  }

  return (
    <section className="portfolio-section">
      <div className="portfolio-table-card">
        <div className="portfolio-section-header">
          <h2>
            {title}
            <span className="portfolio-count">{count}</span>
          </h2>
          <ColumnPicker
            columnOptions={columnOptions}
            visibleColumnKeys={visibleColumnKeys}
            onToggle={onToggleColumn}
            menuKey={menuKey}
            openMenuKey={openMenuKey}
            onOpenMenuKey={onOpenMenuKey}
          />
        </div>
        <div className="portfolio-table-scroll">
          <table className="portfolio-table">
            {renderColGroup()}
            <thead>{renderHeaders()}</thead>
            <tbody>
              {renderBody()}
              {renderSubtotal()}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}