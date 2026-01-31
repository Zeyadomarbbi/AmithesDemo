import React from 'react';
import { useParams } from 'react-router-dom';
import QuarterSelector from '../../../../../../components/QuarterSelection/QuarterSelector'; // Import the new component
import { useTimeframes, apiRowToQuarter, saveNewTimeframe, useTimeframeNavigation } from '../../../../hooks/Core/useTimeframes';
import './DashboardHeader.css';

function DashboardHeader({ fundId, fundName, showQuarterSelector, onTimeframeChange }) {
    const { quarters, isLoading, setQuarters } = useTimeframes(fundId);
    const { timeframeId } = useParams();
    const handleSaveNew = async (newTimeframe) => {
        try {
            const formatted = await saveNewTimeframe(fundId, newTimeframe);
            setQuarters(prev => [...prev, formatted]);
            onTimeframeChange(formatted.id);
        } catch (error) {
            console.error("Compare Tab: Persistence error:", error);
        }
    };
    console.log('DashboardHeader render:', { fundId, fundName, timeframeId, quarters });

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