import React, { useState, useMemo } from 'react';
import { useTableSort, SortableHeaderRenderer } from '../../../../../../../../components/Sort/TableSort';
import { DoubleArrowLeftIcon } from '/src/components/Icons/DirectionIcons';
import { MaximizeIcon, PlusIcon, MinusIcon, CloseIcon } from '/src/components/Icons/InteractiveIcons';
import { useNumberFormatter, usePercentageFormatter } from '../../../../../../../../components/useFormatter';
import useScenarioSynthesisKPIs from './useScenarioSynthesisKPIs';
import './DrawerDetails.css';

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
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
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
                Computing scenarios…
            </span>
        </div>
    );
}

export default function DrawerDetails({ 
    onClose, onExpand, title, description, scenarios = [], fundId, synthesisId, blueprint = [] 
}) {
    const [expandedRowId, setExpandedRowId] = useState(null);
    const formatNumber = useNumberFormatter();
    const formatPercent = usePercentageFormatter();
    
    const { kpiData, loading, error } = useScenarioSynthesisKPIs(fundId, synthesisId);

    const populatedRows = useMemo(() => {
        return blueprint.map((bpRow, index) => {
            const fetchedRow = (kpiData || []).find(k => k.id === bpRow.id);
            return {
                ...bpRow,
                originalIndex: index,
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
            case 'years':    return `${value.toFixed(2)} years`;
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

            <div className="scenario-synthesis-drawer-table-wrapper" style={{ position: 'relative' }}>
                {loading && <TableSpinner />}

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
                                    />
                                </th>
                                {scenarioColumns.map((scenario) => (
                                    <th key={scenario.id} className="scenario-synthesis-scenario-header-cell">
                                        <SortableHeaderRenderer
                                            label={scenario.title}
                                            columnKey={`scenario_${scenario.id}`}
                                            currentSortKey={null}
                                            toggleSort={() => {}}
                                            center={false}
                                            showSortIcon={false}
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
                                                {error ? "Error" : formatValue(kpi.data[scenario.id], kpi.type)}
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
                                                    {error ? "Error" : formatValue(subRow.data[scenario.id], subRow.type ?? kpi.type)}
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