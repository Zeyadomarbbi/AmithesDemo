import React from 'react';
import { useParams } from 'react-router-dom';
import QuarterSelector from '../../../../../../components/QuarterSelection/QuarterSelector'; 
import { saveNewTimeframe } from '../../../../hooks/Core/useTimeframes';
import './DashboardHeader.css';

function DashboardHeader({ 
    fundId, 
    fundName, 
    showQuarterSelector, 
    onTimeframeChange,
    existingQuarters,
    isQuartersLoading,
    setQuarters // <--- RECEIVE THIS
}) {
    const { timeframeId } = useParams();

    const handleSaveNew = async (newTimeframe) => {
        try {
            const formatted = await saveNewTimeframe(fundId, newTimeframe);
            
            // Update the state immediately so it appears in the dropdown
            if (setQuarters) {
                setQuarters(prev => {
                    const updated = [...prev, formatted];
                    // Re-sort so that oldest is top and latest is bottom
                    return updated.sort((a, b) => new Date(a.date) - new Date(b.date));
                });
            }

            // Redirect to the newly created timeframe
            onTimeframeChange(formatted.id);
        } catch (error) {
            console.error("Dashboard Header: Persistence error:", error);
        }
    };

    return (
        <div className="dashboard-header-frame">
            <h1 className="welcome-text">Welcome on {fundName}</h1>
            {showQuarterSelector && (
                <div className="header-actions">
                    <QuarterSelector 
                        options={existingQuarters || []}
                        selected={timeframeId ? Number(timeframeId) : null}
                        onChange={onTimeframeChange}
                        onSaveNew={handleSaveNew}
                        isLoading={isQuartersLoading}
                        isSingle={true}
                    />
                </div>
            )}
        </div>
    );
}

export default DashboardHeader;