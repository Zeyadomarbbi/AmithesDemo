import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useOutletContext } from 'react-router-dom';
import './DashboardPage.css';

import DashboardHeader from './components/DashboardHeader/DashboardHeader';
import DashboardTabs from './components/DashboardTabs/DashboardTabs';
import KPIDashboard from './components/KPIDashboard/KPIDashboard';
import LimitsDashboard from './components/LimitsDashboard/LimitsDashboard';

function DashboardPage() {
    const { fundId, tab, timeframeId: urlTimeframeId } = useParams();
    const navigate = useNavigate();

    const { funds = [] } = useOutletContext() || {};
    const currentFund = funds.find(f => String(f.id) === String(fundId));

    const [selectedTimeframeId, setSelectedTimeframeId] = useState(
        urlTimeframeId ? Number(urlTimeframeId) : null
    );

    const activeTab = tab?.toLowerCase() === 'limits' ? 'Limits' : 'KPI';

    // Synchronize local state with URL changes (Back/Forward buttons)
    useEffect(() => {
        if (urlTimeframeId) {
            setSelectedTimeframeId(Number(urlTimeframeId));
        }
    }, [urlTimeframeId]);

    // Handle initial redirect
    useEffect(() => {
        if (currentFund && !tab) {
            navigate(`/funds/${currentFund.id}/dashboard/kpi`, { replace: true });
        }
    }, [tab, currentFund, navigate]);

    const handleTabChange = (newTab) => {
        if (!currentFund) return;
        const target = newTab.toLowerCase();
        const path = target === 'kpi' && selectedTimeframeId 
            ? `kpi/${selectedTimeframeId}` 
            : target;
        
        navigate(`/funds/${currentFund.id}/dashboard/${path}`);
    };

    const handleTimeframeChange = (id) => {
        if (!currentFund) return;
        setSelectedTimeframeId(id);
        navigate(`/funds/${currentFund.id}/dashboard/kpi/${id}`);
    };

    if (!currentFund) {
        return <div className="dashboard-loading">Loading Fund...</div>;
    }

    return (
        <div className="dashboard-page">
            <DashboardHeader
                fundId={fundId}
                fundName={currentFund.name}
                showQuarterSelector={activeTab === 'KPI'}
                selectedTimeframeId={selectedTimeframeId}
                onTimeframeChange={handleTimeframeChange}
            />

            <DashboardTabs
                activeTab={activeTab}
                onTabChange={handleTabChange}
            />

            <div className="dashboard-content-frame">
                {activeTab === 'KPI' ? (
                    <KPIDashboard
                        fundId={fundId}
                        timeframeId={selectedTimeframeId}
                    />
                ) : (
                    <LimitsDashboard fundId={fundId} />
                )}
            </div>
        </div>
    );
}

export default DashboardPage;