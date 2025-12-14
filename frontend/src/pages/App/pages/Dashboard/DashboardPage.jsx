import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useOutletContext } from 'react-router-dom';
import './DashboardPage.css';

import DashboardHeader from './components/DashboardHeader/DashboardHeader';
import DashboardTabs from './components/DashboardTabs/DashboardTabs';
import KPIDashboard from './components/KPIDashboard/KPIDashboard';
import LimitsDashboard from './components/LimitsDashboard/LimitsDashboard';

function DashboardPage() {
  const { fundId, tab, quarter } = useParams();
  const navigate = useNavigate();
  
  // 1. Retrieve funds from AppLayout context
  const { funds = [] } = useOutletContext() || {};

  // 2. Identify Current Fund
  const currentFund = funds.find(f => f.id.toString() === fundId?.toString());

  // 3. State for Quarter Selector
  const [selectedQuarter, setSelectedQuarter] = useState(tab === 'kpi' ? (quarter || 'Q2-2024') : null);

  // 4. Default Tab Logic
  const activeTab = tab ? (tab.toLowerCase() === 'kpi' ? 'KPI' : 'Limits') : 'KPI';

  // --- Handlers ---

  const handleTabChange = (newTab) => {
    if (!currentFund) return;

    if (newTab.toLowerCase() === 'kpi') {
      navigate(`/funds/${currentFund.id}/dashboard/kpi/${selectedQuarter || 'Q2-2024'}`);
    } else {
      navigate(`/funds/${currentFund.id}/dashboard/limits`);
    }
  };

  const handleQuarterChange = (newQuarter) => {
    if (!currentFund) return;
    setSelectedQuarter(newQuarter);
    navigate(`/funds/${currentFund.id}/dashboard/kpi/${newQuarter}`);
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
        selectedQuarter={selectedQuarter} 
        onQuarterChange={handleQuarterChange}
      />

      <DashboardTabs 
        activeTab={activeTab}      
        onTabChange={handleTabChange}      
      />
      
      <div className="dashboard-content-frame">
        {activeTab === 'KPI' ? 
          <KPIDashboard fundId={fundId} /> : 
          <LimitsDashboard fundId={fundId} /> // PASS fundId HERE
        }
      </div>
    </div>
  );
}

export default DashboardPage;