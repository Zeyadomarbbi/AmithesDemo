import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, Cell 
} from 'recharts';
import { useFundData } from "../../../../../../hooks/Core/FundContext";
import { ChevronDownIcon } from "../../Icons";
import QuarterSelector from "../../../../../../../../components/QuarterSelection/QuarterSelector";
import { useTimeframes, apiRowToQuarter, saveNewTimeframe, useTimeframeNavigation } from '../../../../../../hooks/Core/useTimeframes';
import { FX_DEALS_DATA } from "../../../../portfolioData";
import "./FxChartsView.css";

const parseValue = (val) => {
  if (!val || val === "-") return 0;
  return parseFloat(val.replace(/\s/g, "").replace("−", "-"));
};

const FxChartsView = ({ fundId }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const { funds, isLoading: isFundsLoading } = useFundData();
    const { quarters, isLoading: isQuartersLoading, setQuarters } = useTimeframes(fundId);
    
    const queryParams = new URLSearchParams(location.search);
    // Renamed for clarity and used as the source of truth
    const selectedTimeframeIds = queryParams.get("timeframes")?.split(",").map(Number) || [];

    const [selectedInvestmentIdx, setSelectedInvestmentIdx] = useState(0); 
    const [isInvDropdownOpen, setIsInvDropdownOpen] = useState(false);
    const { toggleTimeframe } = useTimeframeNavigation(location, navigate);

    const handleSaveNew = async (newTimeframe) => {
        try {
            const formatted = await saveNewTimeframe(fundId, newTimeframe);
            // 1. Update local list
            setQuarters(prev => [...prev, formatted]);
            // 2. Add the new timeframe to the current selection in URL
            toggleTimeframe(selectedTimeframeIds, formatted.id);
        } catch (error) {
            console.error("FX View: Persistence error:", error);
        }
    };

    // Corrected variable reference to selectedTimeframeIds
    const handleToggleTimeframe = (id) => { 
        toggleTimeframe(selectedTimeframeIds, id);
    };

    const fundInvestments = FX_DEALS_DATA[fundId] || FX_DEALS_DATA[Number(fundId)] || [];
    const activeInvestment = fundInvestments[selectedInvestmentIdx];

    useEffect(() => {
        // Auto-select all if nothing is selected in URL
        if (quarters.length > 0 && selectedTimeframeIds.length === 0) {
            const allIds = quarters.map(q => q.id).join(",");
            navigate(`${location.pathname}?timeframes=${allIds}`, { replace: true });
        }
    }, [quarters, selectedTimeframeIds.length, navigate, location.pathname]);

    if (isFundsLoading) return null;

    const currentFund = funds.find((f) => String(f.id) === String(fundId));
    const symbol = currentFund?.currencySymbol || "€";

    // --- Chart Data Processing ---
    const chartData = quarters
        .filter(q => selectedTimeframeIds.includes(q.id))
        .map(q => {
            const availableImpactKeys = activeInvestment?.rows?.[0] 
                ? Object.keys(activeInvestment.rows[0]).filter(k => k.startsWith('impact') && k !== 'impactInception')
                : [];

            // Match "Q1 2026" to "impactQ12026"
            const labelClean = q.display_label.replace(/\s/g, "");
            const expectedKey = `impact${labelClean}`;
            
            const actualKey = availableImpactKeys.find(
                k => k.toLowerCase() === expectedKey.toLowerCase()
            );
            
            const totalImpact = (actualKey && activeInvestment?.rows)
                ? activeInvestment.rows.reduce((sum, row) => sum + parseValue(row[actualKey]), 0)
                : 0;

            return {
                ...q,
                value: Number((totalImpact / 1000000).toFixed(2))
            };
        });

    return (
        <section className="fx-charts-section">
            <div className="fx-charts-filters-row">
                {/* Investment Dropdown */}
                <div className="quarter-selector-container">
                    <div 
                        className={`quarter-selector-button ${isInvDropdownOpen ? 'active' : ''}`} 
                        onClick={() => setIsInvDropdownOpen(!isInvDropdownOpen)}
                    >
                        <div className="quarter-text-group">
                            <span className="quarter-part">{activeInvestment?.title || "Investment"}</span>
                        </div>
                        <div className={`quarter-icon ${isInvDropdownOpen ? 'open' : ''}`}>
                            <ChevronDownIcon />
                        </div>
                    </div>
                    
                    {isInvDropdownOpen && (
                        <div className="quarter-dropdown">
                            <div className="quarter-list">
                                {fundInvestments.map((inv, idx) => (
                                    <div 
                                        key={idx} 
                                        className={`quarter-item ${selectedInvestmentIdx === idx ? 'selected' : ''}`}
                                        onClick={() => {
                                            setSelectedInvestmentIdx(idx);
                                            setIsInvDropdownOpen(false);
                                        }}
                                    >
                                        <span className="item-label-bold">{inv.title}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Currency Dropdown (Placeholder) */}
                <div className="quarter-selector-container disabled-dropdown">
                    <div className="quarter-selector-button">
                        <div className="quarter-text-group">
                            <span className="quarter-part">Currency</span>
                        </div>
                        <div className="quarter-icon">
                            <ChevronDownIcon />
                        </div>
                    </div>
                </div>
                
                {/* Real Quarter Selector */}
                <QuarterSelector 
                    options={quarters}
                    selected={selectedTimeframeIds}
                    onChange={handleToggleTimeframe}
                    onSaveNew={handleSaveNew}
                    isLoading={isQuartersLoading}
                    isSingle={false}
                />
            </div>

            <div className="fx-charts-card">
                <div className="fx-charts-header">
                    <div className="fx-charts-title">FX Gains / Losses (m{symbol})</div>
                </div>
                <div className="fx-charts-container">
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                            <XAxis 
                                dataKey="display_label" 
                                axisLine={false} 
                                tickLine={false} 
                                dy={10} 
                                tick={{ fill: '#6B7280', fontSize: 12 }}
                            />
                            <YAxis 
                                axisLine={false} 
                                tickLine={false} 
                                tick={{ fill: '#6B7280', fontSize: 12 }}
                            />
                            <Tooltip 
                                cursor={{ fill: '#F9FAFB' }}
                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                            />
                            <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={40}>
                                {chartData.map((entry, index) => (
                                    <Cell 
                                        key={`cell-${index}`} 
                                        fill={entry.value >= 0 ? "#818CF8" : "#EF4444"} // Blue for gains, Red for losses
                                    />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </section>
    );
};

export default FxChartsView;