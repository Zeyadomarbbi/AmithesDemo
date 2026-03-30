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
                            <tr className="lp-cas-adjusted-row">
                                <td className="lp-cas-kpi-cell"><span>Adjusted NAV</span></td>
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

                                        <tr className="lp-cas-nav-details-row">
                                            <td colSpan={columns.length + 1}>
                                                <div className="lp-cas-nav-details">
                                                    <div className="lp-cas-nav-details-inner">
                                                        <table className="lp-cas-nav-details-table">
                                                            <thead>
                                                                <tr>
                                                                    <th className="lp-cas-nav-th lp-cas-nav-th--first"></th>
                                                                    <th className="lp-cas-nav-th">Nominal <span className="lp-cas-nav-th-euro">(€)</span></th>
                                                                    <th className="lp-cas-nav-th">Hurdle <span className="lp-cas-nav-th-euro">(€)</span></th>
                                                                    <th className="lp-cas-nav-th">Catch-up <span className="lp-cas-nav-th-euro">(€)</span></th>
                                                                    <th className="lp-cas-nav-th">Special return <span className="lp-cas-nav-th-euro">(€)</span></th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {navDetails.map((r) => (
                                                                    <tr key={r.label}>
                                                                        <td className="lp-cas-nav-td lp-cas-nav-td--label">{r.label}</td>
                                                                        <td className="lp-cas-nav-td">{formatValue(r.nominal)}</td>
                                                                        <td className="lp-cas-nav-td">{formatValue(r.hurdle)}</td>
                                                                        <td className="lp-cas-nav-td">{formatValue(r.catchup)}</td>
                                                                        <td className="lp-cas-nav-td">{formatValue(r.special)}</td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
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