import React from 'react';
import { useParams } from 'react-router-dom';
import QuarterSelector from '../../../../../../components/QuarterSelection/QuarterSelector'; // Import the new component
import { useTimeframes, apiRowToQuarter } from '../../../../../../components/QuarterSelection/useTimeframes';
import './DashboardHeader.css';

function DashboardHeader({ fundId, fundName, showQuarterSelector, onTimeframeChange }) {
    const { quarters, isLoading, setQuarters } = useTimeframes(fundId);
    const { timeframeId } = useParams();
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
            onTimeframeChange(formatted.id); 
        } catch (error) {
            console.error("Persistence error:", error);
        }
    };

    return (
        <div className="dashboard-header-frame">
            <h1 className="welcome-text">Welcome on {fundName}</h1>
            {showQuarterSelector && (
                <div className="header-actions">
                    <QuarterSelector 
                        options={quarters}
                        selected={timeframeId ? Number(timeframeId) : null}
                        onChange={onTimeframeChange}
                        onSaveNew={handleSaveNew}
                        isLoading={isLoading}
                        isSingle={true}
                    />
                </div>
            )}
        </div>
    );
}

export default DashboardHeader;