// DrawerTable.jsx

import React, { useState } from 'react'; // Import useState
import { SortIcon, PlusIcon } from '../../../Icons';
import './DrawerTable.css';


// --- Static Mock Data (Simplified mapping to use index 0, 1, 2 for scenarios) ---
const STATIC_KPI_DATA = [
    { id: 'irr_net', name: 'Fund Net IRR', unit: '(€)', data: { 0: '8.00%', 1: '8.00%', 2: '8.00%' } },
    { id: 'irr_share_a', name: 'Shares A IRR', unit: '(€)', data: { 0: '8.00%', 1: '8.00%', 2: '8.00%' } },
    { id: 'irr_share_b', name: 'Shares B IRR', unit: '(€)', data: { 0: '8.00%', 1: '8.00%', 2: '8.00%' } },
    { id: 'irr_portfolio', name: 'Portfolio IRR', unit: '(€)', data: { 0: '16.00%', 1: '8.00%', 2: '8.00%' } },
    { id: 'tvpi_fund', name: 'Fund TVPI', unit: 'x', data: { 0: '1.55x', 1: '8.00%', 2: '8.00%' } },
    { id: 'tvpi_share_a', name: 'Shares A TVPI', unit: 'x', data: { 0: '1.45x', 1: '8.00%', 2: '8.00%' } },
    { id: 'tvpi_share_b', name: 'Shares B TVPI', unit: 'x', data: { 0: '3.55x', 1: '8.00%', 2: '8.00%' } },
    
    // Portfolio MOIC Parent Item
    { 
        id: 'moic_portfolio', 
        name: 'Portfolio MOIC', 
        unit: 'x', 
        data: { 0: '1.75x', 1: '1.75x', 2: '1.75x' }, 
        isExpandable: true,
        // NESTED ROWS (Based on image_ed9354.png)
        subRows: [
            { name: 'Vantech AI', subUnit: 'Tech', data: { 0: '1.75x', 1: '1.75x', 2: '1.75x' } },
            { name: 'Vantech AI', subUnit: 'Tech', data: { 0: '1.75x', 1: '1.75x', 2: '1.75x' } },
            { name: 'Vantech AI', subUnit: 'Tech', data: { 0: '1.75x', 1: '1.75x', 2: '1.75x' } },
            { name: 'Vantech AI', subUnit: 'Tech', data: { 0: '1.75x', 1: '1.75x', 2: '1.75x' } },
        ]
    },
    
    // Average Duration Parent Item
    { 
        id: 'duration_avg', 
        name: 'Average duration', 
        unit: 'years', 
        data: { 0: '4,7 years', 1: '4,7 years', 2: '4,7 years' }, 
        isExpandable: true,
        // NESTED ROWS (Based on the new requested data: 3, 3.5, 4, 4.5, 5)
        subRows: [
            { name: 'Share A duration', data: { 0: '3 years', 1: '3 years', 2: '3 years' } },
            { name: 'Share B duration', data: { 0: '3.5 years', 1: '3.5 years', 2: '3.5 years' } },
            { name: 'Share C duration', data: { 0: '4 years', 1: '4 years', 2: '4 years' } },
            { name: 'Share D duration', data: { 0: '4.5 years', 1: '4.5 years', 2: '4.5 years' } },
            { name: 'Share E duration', data: { 0: '5 years', 1: '5 years', 2: '5 years' } },
        ]
    },
    
    { id: 'bridge', name: 'Bridge', unit: 'n.a', data: { 0: 'n.a', 1: '8.00%', 2: '8.00%' }, isExpandable: true },
    { id: 'hurdle', name: 'Hurdle', unit: '(€)', data: { 0: '35,000,000', 1: '8.00%', 2: '8.00%' } },
    { id: 'distributed_total', name: 'Total distributed', unit: '(€)', data: { 0: '150,000,000', 1: '8.00%', 2: '8.00%' } },
    { id: 'management_fees', name: 'Management fees', unit: '(€)', data: { 0: '12,000,000', 1: '8.00%', 2: '8.00%' } },
    { id: 'due_diligence_fees', name: 'Due diligence fees', unit: '(€)', data: { 0: '2,000,000', 1: '8.00%', 2: '8.00%' } },
];


function DrawerTable({ synthesisLinks }) {
    
    // State to track which expandable row is currently open (stores the KPI id)
    const [expandedRowId, setExpandedRowId] = useState(null);

    const toggleRow = (kpiId) => {
        setExpandedRowId(prevId => prevId === kpiId ? null : kpiId);
    };

    const scenarioColumns = synthesisLinks && synthesisLinks.length > 0
        ? synthesisLinks.map((name, index) => ({ 
            id: index, 
            title: name 
        }))
        : []; 

    const tableData = STATIC_KPI_DATA;
    
    return (
        <div className="drawer-table-wrapper">
            <div className="table-container">
                <table className="synthesis-table">
                    
                    {/* --- TABLE HEADER --- */}
                    <thead className="synthesis-table-header">
                        <tr>
                            <th className="kpi-header-cell">
                                <div className="kpi-header-content">
                                    <span>KPI</span>
                                    <span className="unit-label">(€)</span>
                                    <SortIcon className="sort-icon" />
                                </div>
                            </th>
                            
                            {scenarioColumns.map((scenario) => (
                                <th key={scenario.id} className="scenario-header-cell">
                                    <div className="scenario-header-content">
                                        <span>{scenario.title}</span>
                                        <span className="unit-label">(€)</span>
                                        <SortIcon className="sort-icon" />
                                    </div>
                                </th>
                            ))}
                        </tr>
                    </thead>

                    {/* --- TABLE BODY --- */}
                    <tbody className="synthesis-table-body">
                        {tableData.map((kpi) => (
                            <React.Fragment key={kpi.id}>
                                {/* --- PARENT ROW --- */}
                                <tr 
                                    className={`kpi-row ${kpi.isExpandable ? 'clickable' : ''} ${expandedRowId === kpi.id ? 'expanded-parent' : ''}`}
                                    onClick={kpi.isExpandable ? () => toggleRow(kpi.id) : undefined}
                                >
                                    {/* 1. KPI Name Cell */}
                                    <td className={`kpi-name-cell ${kpi.isExpandable ? 'expandable' : ''}`}>
                                        {/* NEW WRAPPER DIV */}
                                        <div className="cell-flex-wrapper"> 
                                            {kpi.isExpandable && 
                                                <span className="plus-icon-wrapper">
                                                    <PlusIcon className={`plus-icon ${expandedRowId === kpi.id ? 'rotated' : ''}`} />
                                                </span>
                                            }
                                            <span className="kpi-name-text">{kpi.name}</span>
                                        </div>
                                    </td>

                                    {/* 2. KPI Value Cells (Parent Values) */}
                                    {scenarioColumns.map((scenario) => (
                                        <td key={scenario.id} className="kpi-value-cell">
                                            {kpi.data[scenario.id] || 'N/A'} 
                                        </td>
                                    ))}
                                </tr>

                                {/* --- SUB-ROWS (Conditional Rendering) --- */}
                                {expandedRowId === kpi.id && kpi.subRows && kpi.subRows.map((subRow, subIndex) => (
                                    <tr key={`${kpi.id}-${subIndex}`} className="sub-kpi-row">
                                        {/* 1. Sub-KPI Name Cell (Indented) */}
                                        <td className="sub-kpi-name-cell">
                                            {/* NEW WRAPPER DIV */}
                                            <div className="sub-cell-flex-wrapper">
                                                {subRow.name}
                                                {subRow.subUnit && <span className="sub-unit-tag">{subRow.subUnit}</span>}
                                            </div>
                                        </td>

                                        {/* 2. Sub-KPI Value Cells */}
                                        {scenarioColumns.map((scenario) => (
                                            <td key={scenario.id} className="sub-kpi-value-cell">
                                                {subRow.data[scenario.id] || 'N/A'}
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
    );
}

export default DrawerTable;