import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useOutletContext } from 'react-router-dom';
import './DashboardPage.css';

import DashboardHeader from './components/DashboardHeader/DashboardHeader';
import DashboardTabs from './components/DashboardTabs/DashboardTabs';
import KPIDashboard from './components/KPIDashboard/KPIDashboard';
import LimitsDashboard from './components/LimitsDashboard/LimitsDashboard';

// Helper function to safely split the "Qx-YYYY" string
const splitQuarterYear = (quarterYearString) => {
    if (!quarterYearString || typeof quarterYearString !== 'string') {
        return { quarter: null, year: null };
    }
    const parts = quarterYearString.split('-');
    // Expects ['Qx', 'YYYY']
    return {
        quarter: parts[0] || null,
        year: parts[1] || null
    };
};

function DashboardPage() {
    const { fundId, tab, quarter: urlQuarter } = useParams();
    const navigate = useNavigate();
    
    // 1. Retrieve funds from AppLayout context
    const { funds = [] } = useOutletContext() || {};

    // 2. Identify Current Fund
    const currentFund = funds.find(f => f.id.toString() === fundId?.toString());

    // 3. State for Quarter Selector: Stores the combined string (e.g., 'Q2-2024')
    const defaultQuarterYear = 'Q2-2024';
    const initialQuarterYear = tab === 'kpi' ? (urlQuarter || defaultQuarterYear) : null;
    const [selectedQuarterYear, setSelectedQuarterYear] = useState(initialQuarterYear);

    // 4. Extract separate quarter and year from the combined state
    const { quarter, year } = splitQuarterYear(selectedQuarterYear);

    // 5. Default Tab Logic
    const activeTab = tab ? (tab.toLowerCase() === 'kpi' ? 'KPI' : 'Limits') : 'KPI';

    // --- Handlers ---

    const handleTabChange = (newTab) => {
        if (!currentFund) return;

        if (newTab.toLowerCase() === 'kpi') {
            // Use the combined state for navigation
            navigate(`/funds/${currentFund.id}/dashboard/kpi/${selectedQuarterYear || defaultQuarterYear}`);
        } else {
            navigate(`/funds/${currentFund.id}/dashboard/limits`);
        }
    };

    const handleQuarterChange = (newQuarterYear) => {
        if (!currentFund) return;
        // Update the combined state
        setSelectedQuarterYear(newQuarterYear); 
        // Navigate using the new combined string
        navigate(`/funds/${currentFund.id}/dashboard/kpi/${newQuarterYear}`);
    };

    // --- Effects ---

    // Redirect if no tab is specified
    useEffect(() => {
        if (currentFund && !tab) {
            navigate(`/funds/${currentFund.id}/dashboard/kpi`, { replace: true });
        }
    }, [tab, currentFund, navigate]);

    // --- Render ---

    if (!currentFund) {
        return <div className="dashboard-loading">Loading Fund...</div>;
    }

    return (
        <div className="dashboard-page">
            <DashboardHeader 
                fundName={currentFund.name} 
                showQuarterSelector={tab === 'kpi'} 
                // Pass the combined string to the DashboardHeader/QuarterSelector
                selectedQuarter={selectedQuarterYear} 
                onQuarterChange={handleQuarterChange}
            />

            <DashboardTabs 
                activeTab={activeTab}      
                onTabChange={handleTabChange}      
            />
            
            <div className="dashboard-content-frame">
                {activeTab === 'KPI' ? 
                    <KPIDashboard 
                        fundId={fundId} 
                        // Pass the separated quarter and year strings to KPIDashboard
                        quarter={quarter}
                        year={year}
                    /> : 
                    <LimitsDashboard fundId={fundId} /> 
                }
            </div>
        </div>
    );
}

export default DashboardPage;