import React, { useState, useMemo } from "react";
import { useTableSort, SortableHeaderRenderer } from '../../../../../../../components/Sort/TableSort';
import { useNumberFormatter, usePercentageFormatter } from '../../../../../../../components/useFormatter';
import { PlusIcon, MinusIcon } from "../../../Icons.jsx";
import './CapitalAccountTable.css'

function TableSpinner() {
    return (
        <div style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(255,255,255,0.75)',
            backdropFilter: 'blur(2px)',
            zIndex: 10,
            gap: 12,
        }}>
            <style>{`
                @keyframes spin { to { transform: rotate(360deg); } }
            `}</style>
            <div style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                border: '2.5px solid #e5e7eb',
                borderTopColor: '#6b7280',
                animation: 'spin 0.75s linear infinite',
            }} />
            <span style={{
                fontSize: 12,
                color: '#9ca3af',
                letterSpacing: '0.03em',
                fontWeight: 500,
            }}>
                Loading share classes…
            </span>
        </div>
    );
}

export default function CapitalAccountTable({ columns, data, navDetails, isLoading }) {
    const [isNavOpen, setIsNavOpen] = useState(false);
    const [isAdjustedOpen, setIsAdjustedOpen] = useState(false);
    const formatNumber = useNumberFormatter();
    const formatPercent = usePercentageFormatter();

    const { sorted: sortedData, sortKey, sortDir, toggleSort } = useTableSort(data, null);

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
            {isLoading && <TableSpinner />}

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
                        const isNavPerShareRow = row.kpi === "NAV per share";
                        const isNavRow = row.kpi === "NAV";

                        return (
                            <React.Fragment key={row.kpi}>
                                <tr
                                    className={
                                        "lp-cas-row" +
                                        ((row.isExpandable || isNavRow) ? " lp-cas-row--expandable" : "") +
                                        (isNavPerShareRow && isNavOpen ? " lp-cas-row--open" : "") +
                                        (isNavRow && isAdjustedOpen ? " lp-cas-row--open" : "")
                                    }
                                    onClick={
                                        isNavPerShareRow ? () => setIsNavOpen((p) => !p)
                                        : isNavRow ? () => setIsAdjustedOpen((p) => !p)
                                        : undefined
                                    }
                                >
                                    <td className="lp-cas-kpi-cell">
                                        {(isNavPerShareRow || isNavRow) && (
                                            <button
                                                type="button"
                                                className="lp-cas-expand-btn"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    if (isNavPerShareRow) setIsNavOpen((p) => !p);
                                                    if (isNavRow) setIsAdjustedOpen((p) => !p);
                                                }}
                                            >
                                                <span className="lp-cas-plus-icon">
                                                    {(isNavPerShareRow ? isNavOpen : isAdjustedOpen)
                                                        ? <MinusIcon />
                                                        : <PlusIcon />
                                                    }
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
                                    <tr className="lp-cas-adjusted-row">
                                        <td className="lp-cas-kpi-cell"><span>Adjusted NAV</span></td>
                                        {columns.map((col) => (
                                            <td key={col.key} className="lp-cas-value-cell">-</td>
                                        ))}
                                    </tr>
                                )}

                                {isNavPerShareRow && isNavOpen && (
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
                                                                    <td className="lp-cas-nav-td">{r.nominal}</td>
                                                                    <td className="lp-cas-nav-td">{r.hurdle}</td>
                                                                    <td className="lp-cas-nav-td">{r.catchup}</td>
                                                                    <td className="lp-cas-nav-td">{r.special}</td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </React.Fragment>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}