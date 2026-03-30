import React, { useState } from "react";
import { useTableSort, SortableHeaderRenderer } from '../../../../../../../components/Sort/TableSort';
import { useNumberFormatter, usePercentageFormatter } from '../../../../../../../components/useFormatter';
import { PlusIcon, MinusIcon, EditLineIcon  } from "../../../../../../../components/Icons/InteractiveIcons.jsx";
import './CapitalAccountTable.css'

export default function CapitalAccountTable({ columns, data, navDetails, isLoading, adjustedNavValues, setAdjustedNavValues, onSaveAdjustedNav }) {
    const [isAdjustedOpen, setIsAdjustedOpen] = useState(false);

    const formatNumber = useNumberFormatter();
    const formatPercent = usePercentageFormatter();

    const { sorted: sortedData, sortKey, toggleSort } = useTableSort(data, null);
    const [editingCell, setEditingCell] = useState(null);
    const formatValue = (value, suffix) => {
        if (value === null || value === undefined || value === '') return '-';
        switch (suffix) {
            case '%':  return formatPercent(value);
            case 'x':  return `${Number(value).toFixed(2)}x`;
            default:   return formatNumber(value);
        }
    };

    // The new metrics we want to display as rows in the expanded view
    const waterfallMetrics = [
        { key: 'nominal', label: 'Nominal' },
        { key: 'hurdle',  label: 'Hurdle' },
        { key: 'catchup', label: 'Catch-up' },
        { key: 'special', label: 'Special Return' }
    ];

    return (
        <div className="lp-cas-table-wrapper" style={{ position: 'relative' }}>
            <table className="lp-cas-table">
                <thead>
                    <tr>
                        <th className="lp-cas-kpi-header">
                            <SortableHeaderRenderer
                                label="KPIs"
                                columnKey="kpi"
                                currentSortKey={sortKey}
                                toggleSort={toggleSort}
                                center={false}
                                showCurrency={false}
                            />
                        </th>
                        {columns.map((col) => (
                            <th key={col.key} className="lp-cas-header-cell">
                                <SortableHeaderRenderer
                                    label={col.label}
                                    columnKey={col.key}
                                    currentSortKey={sortKey}
                                    toggleSort={toggleSort}
                                    center={true}
                                    showCurrency={true}
                                />
                            </th>
                        ))}
                    </tr>
                </thead>

                <tbody>
                    {sortedData.map((row) => {
                        const isNavRow = row.kpi === "NAV";

                        return (
                            <React.Fragment key={row.kpi}>
                                <tr
                                    className={
                                        "lp-cas-row" +
                                        (isNavRow ? " lp-cas-row--expandable" : "") +
                                        (isNavRow && isAdjustedOpen ? " lp-cas-row--open" : "")
                                    }
                                    onClick={isNavRow ? () => setIsAdjustedOpen((p) => !p) : undefined}
                                >
                                    <td className="lp-cas-kpi-cell">
                                        {isNavRow && (
                                            <button
                                                type="button"
                                                className="lp-cas-expand-btn"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setIsAdjustedOpen((p) => !p);
                                                }}
                                            >
                                                <span className="lp-cas-plus-icon">
                                                    {isAdjustedOpen ? <MinusIcon /> : <PlusIcon />}
                                                </span>
                                            </button>
                                        )}
                                        <span>{row.kpi}</span>
                                    </td>

                                    {columns.map((col) => (
                                        <td key={col.key} className="lp-cas-value-cell">
                                            {formatValue(row.values[col.key], row.suffix)}
                                        </td>
                                    ))}
                                </tr>

                                {isNavRow && isAdjustedOpen && (
                                    <>
                                        {/* Adjusted NAV Editable Row */}
                                       {/* Adjusted NAV Editable Row */}
                                        <tr className="lp-cas-adjusted-row">
                                            <td className="lp-cas-kpi-cell">
                                                <span style={{ paddingLeft: '2rem' }}>Adjusted NAV</span>
                                            </td>
                                            {columns.map((col) => {
                                                const value = adjustedNavValues[col.key];
                                                const isEditing = editingCell === col.key;

                                                return (
                                                    <td key={col.key} className="lp-cas-value-cell">
                                                        {isEditing ? (
                                                            <input
                                                                type="number"
                                                                className="lp-cas-adjusted-input"
                                                                autoFocus
                                                                value={value ?? ""}
                                                                onChange={(e) => {
                                                                    const val = e.target.value;
                                                                    setAdjustedNavValues((prev) => ({
                                                                        ...prev,
                                                                        [col.key]: val === "" ? "" : Number(val),
                                                                    }));
                                                                }}
                                                                onBlur={() => {
                                                                    setEditingCell(null);
                                                                    onSaveAdjustedNav?.(adjustedNavValues);
                                                                }}
                                                                onKeyDown={(e) => {
                                                                    if (e.key === "Enter" || e.key === "Escape") setEditingCell(null);
                                                                }}
                                                            />
                                                        ) : (
                                                            <div className="lp-cas-adjusted-display">
                                                                <span>{value != null && value !== "" ? formatNumber(value) : "-"}</span>
                                                                <button
                                                                    type="button"
                                                                    className="pnl-edit-btn"
                                                                    onClick={() => setEditingCell(col.key)}
                                                                >
                                                                    <EditLineIcon />
                                                                </button>
                                                            </div>
                                                        )}
                                                    </td>
                                                );
                                            })}
                                        </tr>

                                        {/* Insert Spacer Row Here */}
                                        <tr className="lp-cas-spacer-row">
                                            <td colSpan={columns.length + 1}></td>
                                        </tr>

                                        {/* Waterfall Details Aligned to Columns */}
                                        {waterfallMetrics.map((metric) => (
                                            <tr key={metric.key} className="lp-cas-waterfall-row">
                                                <td className="lp-cas-kpi-cell">
                                                    <span style={{ paddingLeft: '2rem', color: 'var(--text-secondary, #666)' }}>
                                                        {metric.label}
                                                    </span>
                                                </td>
                                                {columns.map((col) => {
                                                    // Map the column key ("total", "Class A") back to the navDetails label ("Fund", "Class A")
                                                    const targetLabel = col.key === "total" ? "Fund" : col.key;
                                                    const colData = navDetails.find((d) => d.label === targetLabel);
                                                    const val = colData ? colData[metric.key] : null;

                                                    return (
                                                        <td key={col.key} className="lp-cas-value-cell">
                                                            {formatValue(val)}
                                                        </td>
                                                    );
                                                })}
                                            </tr>
                                        ))}
                                    </>
                                )}
                            </React.Fragment>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}