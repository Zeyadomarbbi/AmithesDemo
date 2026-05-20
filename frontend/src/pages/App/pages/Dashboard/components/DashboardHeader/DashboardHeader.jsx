import React from 'react';
import { useParams } from 'react-router-dom';
import TimeframeSelector from '../../../../../../components/QuarterSelection/TimeframeSelector';
import './DashboardHeader.css';

function DashboardHeader({ fundName, showQuarterSelector, onTimeframeChange }) {
    const { timeframeId } = useParams();

    return (
        <div className="dashboard-header-frame">
            <h1 className="welcome-text">Welcome on {fundName}</h1>
            {showQuarterSelector && (
                <div className="header-actions">
                    <TimeframeSelector
                        selected={timeframeId ? Number(timeframeId) : null}
                        onChange={onTimeframeChange}
                        isSingle={true}
                    />
                </div>
            )}
        </div>
    );
}

export default DashboardHeader;