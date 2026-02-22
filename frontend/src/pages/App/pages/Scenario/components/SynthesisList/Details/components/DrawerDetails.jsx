import React, { useState, useMemo } from 'react';
import { useTableSort, SortableHeaderRenderer } from '../../../../../../../../components/Sort/TableSort';
import { DoubleArrowLeftIcon, MaximizeIcon, PlusIcon, MinusIcon, CloseIcon } from '../../Icons';
import { useNumberFormatter, usePercentageFormatter } from '../../../../../../../../components/useFormatter';
import useScenarioSynthesisKPIs from './useScenarioSynthesisKPIs';
import './DrawerDetails.css';

export default function DrawerDetails({ 
    onClose, onExpand, title, description, scenarios = [], fundId, synthesisId, blueprint = [] 
}) {
    const [expandedRowId, setExpandedRowId] = useState(null);
    const formatNumber = useNumberFormatter();
    const formatPercent = usePercentageFormatter();
    
    // Fetch calculation data
    const { kpiData, loading, error } = useScenarioSynthesisKPIs(fundId, synthesisId);
    console.log("kpiData", kpiData)
    // Merge fetched data into static blueprint
    const populatedRows = useMemo(() => {
        return blueprint.map((bpRow, index) => {
            const fetchedRow = (kpiData || []).find(k => k.id === bpRow.id);
            return {
                ...bpRow,
                originalIndex: index, // Optional: useful if you want to sort back to default later
                data: fetchedRow ? fetchedRow.data : {},
                subRows: fetchedRow ? fetchedRow.subRows : [] 
            };
        });
    }, [blueprint, kpiData]);

    const { sorted: sortedRows, sortKey, sortDir, toggleSort } = useTableSort(populatedRows, null);
    const formatValue = (value, type) => {
        if (value === null || value === undefined) return 'n.a';
        switch (type) {
            case 'pct':      return formatPercent(value * 100);
            case 'multiple': return `${value.toFixed(2)}x`;
            case 'years':    return `${value} years`;
            case 'number':   return formatNumber(value);
            case 'na':       return 'n.a';
            default:         return value;
        }
    };

    const toggleRow = (kpiId) => setExpandedRowId(prevId => prevId === kpiId ? null : kpiId);

    const scenarioColumns = scenarios.map((scenario, index) => ({
        id: scenario.scenario_id,
        title: scenario.scenario_name,
        index,
    }));
    
    return (
        <div className="scenario-synthesis-drawer-details-wrapper">
            <div className="scenario-synthesis-drawer-header-wrapper">
                <div className="scenario-synthesis-header-content">
                    <div className="scenario-synthesis-header-icon-btn" onClick={onExpand}>
                        <MaximizeIcon />
                    </div>
                    <div className="scenario-synthesis-header-text-frame">
                        <div className="scenario-synthesis-header-titles-col">
                            <span className="scenario-synthesis-header-main-title">{title}</span>
                            <span className="scenario-synthesis-header-sub-title">{description}</span>
                        </div>
                    </div>

                    <div className="scenario-synthesis-header-icon-btn" onClick={onClose}>
                        <CloseIcon />
                    </div>
                </div>
                <div className="scenario-synthesis-header-bottom-pad"></div>
            </div>

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
                                                {/* Use scenario.id here, and handle loading/error states */}
                                                {error ? "Error" : loading ? "..." : formatValue(kpi.data[scenario.id], kpi.type)}
                                            </td>
                                        ))}
                                    </tr>
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
                                                    {/* Use scenario.id here, and handle loading/error states */}
                                                    {error ? "Error" : loading ? "..." : formatValue(subRow.data[scenario.id], subRow.type ?? kpi.type)}
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