import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, Cell 
} from 'recharts';
import { useFundData } from "../../../../../../hooks/useFundData";
import { ChevronDownIcon } from "../../Icons";
import QuarterSelector from "../../../../../../../../components/QuarterSelection/QuarterSelector";
import { useTimeframes, apiRowToQuarter } from '../../../../../../../../components/QuarterSelection/useTimeframes';
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
    const selectedIdsFromUrl = queryParams.get("timeframes")?.split(",").map(Number) || [];

    const [selectedInvestmentIdx, setSelectedInvestmentIdx] = useState(0); 
    const [isInvDropdownOpen, setIsInvDropdownOpen] = useState(false);

    const handleSaveNew = async (newTimeframe) => {
        const payload = {
            fund: fundId,
            display_label: newTimeframe.name,
            full_date: newTimeframe.endDate.toISOString().split('T')[0] 
        };

        try {
            const response = await fetch(`https://dual-pam-bbi-59551b8d.koyeb.app/api/funds/${fundId}/timeframes/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) throw new Error("Persistence failed");

            const savedRow = await response.json();
            const formatted = apiRowToQuarter(savedRow);

            setQuarters(prev => [...prev, formatted]);
            
            const updatedIds = [...selectedIdsFromUrl, formatted.id];
            navigate(`${location.pathname}?timeframes=${updatedIds.join(",")}`);
        } catch (error) {
            console.error("Persistence error:", error);
        }
    };

    const fundInvestments = FX_DEALS_DATA[fundId] || FX_DEALS_DATA[Number(fundId)] || [];
    const activeInvestment = fundInvestments[selectedInvestmentIdx];

    useEffect(() => {
        if (quarters.length > 0 && selectedIdsFromUrl.length === 0) {
            const allIds = quarters.map(q => q.id).join(",");
            navigate(`${location.pathname}?timeframes=${allIds}`, { replace: true });
        }
    }, [quarters, selectedIdsFromUrl, navigate, location.pathname]);

    if (isFundsLoading) return null;

    const currentFund = funds.find((f) => String(f.id) === String(fundId));
    const symbol = currentFund?.currencySymbol || "€";

    const chartData = quarters
        .filter(q => selectedIdsFromUrl.includes(q.id))
        .map(q => {
            const availableImpactKeys = activeInvestment?.rows?.[0] 
            ? Object.keys(activeInvestment.rows[0]).filter(k => k.startsWith('impact') && k !== 'impactInception')
            : [];

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

    const handleToggleTimeframe = (id) => {
        let newIds;
        if (selectedIdsFromUrl.includes(id)) {
            newIds = selectedIdsFromUrl.filter(item => item !== id);
        } else {
            newIds = [...selectedIdsFromUrl, id];
        }
        navigate(`${location.pathname}?timeframes=${newIds.join(",")}`);
    };

    return (
        <section className="fx-charts-section">
            <div className="fx-charts-filters-row">
                {/* INVESTMENT DROPDOWN WITH QUARTER SELECTOR STYLING */}
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

                {/* CURRENCY DROPDOWN (DISABLED) */}
                <div className="quarter-selector-container" style={{ opacity: 0.5, cursor: 'not-allowed' }}>
                    <div className="quarter-selector-button">
                        <div className="quarter-text-group">
                            <span className="quarter-part">Currency</span>
                        </div>
                        <div className="quarter-icon">
                            <ChevronDownIcon />
                        </div>
                    </div>
                </div>
                
                <QuarterSelector 
                    options={quarters}
                    selected={selectedIdsFromUrl}
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
                            <XAxis dataKey="display_label" axisLine={false} tickLine={false} dy={10} />
                            <YAxis axisLine={false} tickLine={false} />
                            <Tooltip cursor={{ fill: '#F9FAFB' }} />
                            <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={40}>
                                {chartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={index % 2 === 0 ? "#818CF8" : "#C084FC"} />
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