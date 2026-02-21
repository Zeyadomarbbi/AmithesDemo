import React, { useState } from 'react';
import { useTableSort, SortableHeaderRenderer } from '../../../../../../../../components/Sort/TableSort';
import { DoubleArrowLeftIcon, MaximizeIcon, PlusIcon, MinusIcon } from '../../Icons';
import { useNumberFormatter, usePercentageFormatter } from '../../../../../../../../components/useFormatter';
import './DrawerDetails.css';


// --- Static Mock Data ---
const STATIC_KPI_DATA = [
    { id: 'irr_net', name: 'Fund Net IRR', type: 'pct', data: { 0: 8.00, 1: 8.00, 2: 8.00 } },
    { id: 'irr_share_a', name: 'Shares A IRR', type: 'pct', data: { 0: 8.00, 1: 8.00, 2: 8.00 } },
    { id: 'irr_share_b', name: 'Shares B IRR', type: 'pct', data: { 0: 8.00, 1: 8.00, 2: 8.00 } },
    { id: 'irr_portfolio', name: 'Portfolio IRR', type: 'pct', data: { 0: 16.00, 1: 8.00, 2: 8.00 } },
    { id: 'tvpi_fund', name: 'Fund TVPI', type: 'multiple', data: { 0: 1.55, 1: 1.55, 2: 1.55 } },
    { id: 'tvpi_share_a', name: 'Shares A TVPI', type: 'multiple', data: { 0: 1.45, 1: 1.45, 2: 1.45 } },
    { id: 'tvpi_share_b', name: 'Shares B TVPI', type: 'multiple', data: { 0: 3.55, 1: 3.55, 2: 3.55 } },
    {
        id: 'moic_portfolio',
        name: 'Portfolio MOIC',
        type: 'multiple',
        data: { 0: 1.75, 1: 1.75, 2: 1.75 },
        isExpandable: true,
        subRows: [
            { name: 'Vantech AI', subUnit: 'Tech', type: 'multiple', data: { 0: 1.75, 1: 1.75, 2: 1.75 } },
            { name: 'Vantech AI', subUnit: 'Tech', type: 'multiple', data: { 0: 1.75, 1: 1.75, 2: 1.75 } },
            { name: 'Vantech AI', subUnit: 'Tech', type: 'multiple', data: { 0: 1.75, 1: 1.75, 2: 1.75 } },
            { name: 'Vantech AI', subUnit: 'Tech', type: 'multiple', data: { 0: 1.75, 1: 1.75, 2: 1.75 } },
        ]
    },
    {
        id: 'duration_avg',
        name: 'Average duration',
        type: 'years',
        data: { 0: 4.7, 1: 4.7, 2: 4.7 },
        isExpandable: true,
        subRows: [
            { name: 'Share A duration', type: 'years', data: { 0: 3, 1: 3, 2: 3 } },
            { name: 'Share B duration', type: 'years', data: { 0: 3.5, 1: 3.5, 2: 3.5 } },
            { name: 'Share C duration', type: 'years', data: { 0: 4, 1: 4, 2: 4 } },
            { name: 'Share D duration', type: 'years', data: { 0: 4.5, 1: 4.5, 2: 4.5 } },
            { name: 'Share E duration', type: 'years', data: { 0: 5, 1: 5, 2: 5 } },
        ]
    },
    { id: 'bridge', name: 'Bridge', type: 'na', data: { 0: null, 1: null, 2: null }, isExpandable: true },
    { id: 'hurdle', name: 'Hurdle', type: 'number', data: { 0: 35000000, 1: 35000000, 2: 35000000 } },
    { id: 'distributed_total', name: 'Total distributed', type: 'number', data: { 0: 150000000, 1: 150000000, 2: 150000000 } },
    { id: 'management_fees', name: 'Management fees', type: 'number', data: { 0: 12000000, 1: 12000000, 2: 12000000 } },
    { id: 'due_diligence_fees', name: 'Due diligence fees', type: 'number', data: { 0: 2000000, 1: 2000000, 2: 2000000 } },
];


function DrawerDetails({ onClose, onExpand, title, description, scenarios = [] }) {

    const [expandedRowId, setExpandedRowId] = useState(null);
    const { sorted: sortedRows, sortKey, sortDir, toggleSort } = useTableSort(STATIC_KPI_DATA, "name");
    const formatNumber = useNumberFormatter();
    const formatPercent = usePercentageFormatter();

    const formatValue = (value, type) => {
        if (value === null || value === undefined) return 'n.a';
        switch (type) {
            case 'pct':      return formatPercent(value / 100);
            case 'multiple': return `${value.toFixed(2)}x`;
            case 'years':    return `${value} years`;
            case 'number':   return formatNumber(value);
            case 'na':       return 'n.a';
            default:         return value;
        }
    };

    const toggleRow = (kpiId) => {
        setExpandedRowId(prevId => prevId === kpiId ? null : kpiId);
    };

    const scenarioColumns = scenarios.map((scenario, index) => ({
        id: scenario.scenario_id,
        title: scenario.scenario_name,
        index,
    }));

    return (
        <div className="scenario-synthesis-drawer-details-wrapper">

            {/* --- HEADER --- */}
            <div className="scenario-synthesis-drawer-header-wrapper">
                <div className="scenario-synthesis-header-content">

                    <div className="scenario-synthesis-header-icon-btn" onClick={onClose}>
                        <DoubleArrowLeftIcon />
                    </div>

                    <div className="scenario-synthesis-header-text-frame">
                        <div className="scenario-synthesis-header-titles-col">
                            <span className="scenario-synthesis-header-main-title">{title}</span>
                            <span className="scenario-synthesis-header-sub-title">{description}</span>
                        </div>
                    </div>

                    <div className="scenario-synthesis-header-icon-btn" onClick={onExpand}>
                        <MaximizeIcon />
                    </div>

                </div>
                <div className="scenario-synthesis-header-bottom-pad"></div>
            </div>

            {/* --- TABLE --- */}
            <div className="scenario-synthesis-drawer-table-wrapper">
                <div className="scenario-synthesis-table-container">
                    <table className="scenario-synthesis-table">

                        <thead className="scenario-synthesis-table-header">
                            <tr>
                                <th className="scenario-synthesis-kpi-header-cell">
                                    <SortableHeaderRenderer
                                        label="KPI"
                                        columnKey="name"
                                        currentSortKey={sortKey}
                                        toggleSort={toggleSort}
                                        center={false}
                                        showCurrency={false}
                                    />
                                </th>

                                {scenarioColumns.map((scenario) => (
                                    <th key={scenario.id} className="scenario-synthesis-scenario-header-cell">
                                        <SortableHeaderRenderer
                                            label={scenario.title}
                                            columnKey={`scenario_${scenario.id}`}
                                            currentSortKey={sortKey}
                                            toggleSort={toggleSort}
                                            center={false}
                                            showCurrency={true}
                                        />
                                    </th>
                                ))}
                            </tr>
                        </thead>

                        <tbody className="scenario-synthesis-table-body">
                            {sortedRows.map((kpi) => (
                                <React.Fragment key={kpi.id}>
                                    {/* --- PARENT ROW --- */}
                                    <tr
                                        className={`scenario-synthesis-kpi-row ${kpi.isExpandable ? 'scenario-synthesis-clickable' : ''} ${expandedRowId === kpi.id ? 'scenario-synthesis-expanded-parent' : ''}`}
                                        onClick={kpi.isExpandable ? () => toggleRow(kpi.id) : undefined}
                                    >
                                        <td className={`scenario-synthesis-kpi-name-cell ${kpi.isExpandable ? 'scenario-synthesis-expandable' : ''}`}>
                                            <div className="scenario-synthesis-cell-flex-wrapper">
                                                {kpi.isExpandable &&
                                                    <span className="scenario-synthesis-plus-icon-wrapper">
                                                        {expandedRowId === kpi.id
                                                            ? <MinusIcon className="scenario-synthesis-plus-icon" />
                                                            : <PlusIcon className="scenario-synthesis-plus-icon" />
                                                        }
                                                    </span>
                                                }
                                                <span className="scenario-synthesis-kpi-name-text">{kpi.name}</span>
                                            </div>
                                        </td>

                                        {scenarioColumns.map((scenario) => (
                                            <td key={scenario.id} className="scenario-synthesis-kpi-value-cell">
                                                {formatValue(kpi.data[scenario.index], kpi.type)}
                                            </td>
                                        ))}
                                    </tr>

                                    {/* --- SUB-ROWS --- */}
                                    {expandedRowId === kpi.id && kpi.subRows && kpi.subRows.map((subRow, subIndex) => (
                                        <tr key={`${kpi.id}-${subIndex}`} className="scenario-synthesis-sub-kpi-row">
                                            <td className="scenario-synthesis-sub-kpi-name-cell">
                                                <div className="scenario-synthesis-sub-cell-flex-wrapper">
                                                    {subRow.name}
                                                    {subRow.subUnit && <span className="scenario-synthesis-sub-unit-tag">{subRow.subUnit}</span>}
                                                </div>
                                            </td>

                                            {scenarioColumns.map((scenario) => (
                                                <td key={scenario.id} className="scenario-synthesis-sub-kpi-value-cell">
                                                    {formatValue(subRow.data[scenario.index], subRow.type ?? kpi.type)}
                                                </td>
                                            ))}
                                        </tr>
                                    ))}

                                </React.Fragment>
                            ))}
                        </tbody>

                    </table>
                </div>
            </div>

        </div>
    );
}

export default DrawerDetails;