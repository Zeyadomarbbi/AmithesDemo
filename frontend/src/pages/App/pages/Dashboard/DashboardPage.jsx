import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useActiveFund } from '../../hooks/useActiveFund';
import './DashboardPage.css';

import DashboardHeader from './components/DashboardHeader/DashboardHeader';
import DashboardTabs from './components/DashboardTabs/DashboardTabs';
import KPIDashboard from './components/KPIDashboard/KPIDashboard';
import LimitsDashboard from './components/LimitsDashboard/LimitsDashboard';

function DashboardPage() {
  const { fundId, tab, quarter } = useParams();  // tab will be 'kpi' or 'limits'
  const navigate = useNavigate();
  const location = useLocation();
  const activeFundId = useActiveFund();
  const [selectedQuarter, setSelectedQuarter] = useState(tab === 'kpi' ? (quarter || 'Q2-2024') : null);
  const funds = [
    { id: 1, name: 'Asterium Fund I', code: 'AST' },
    { id: 2, name: 'Lynx Capital II', code: 'LYN' },
    { id: 3, name: 'Orion Partners III', code: 'ORI' },
    { id: 4, name: 'Silvergate Ventures', code: 'SIL' },
    { id: 5, name: 'Huron Growth Fund', code: 'HUR' },
    { id: 6, name: 'Pioneer Equity I', code: 'PIO' },
  ];

  const currentFund = funds.find(f => f.id.toString() === fundId?.toString()) || funds[0];

  // Default tab if URL has no tab
  const activeTab = tab ? (tab.toLowerCase() === 'kpi' ? 'KPI' : 'Limits') : 'KPI';

  // Handle tab change
  const handleTabChange = (newTab) => {
    if (newTab.toLowerCase() === 'kpi') {
      navigate(`/funds/${fundId}/dashboard/kpi/${selectedQuarter || 'Q2-2024'}`);
    } else {
      navigate(`/funds/${fundId}/dashboard/limits`);
    }
  };

  // Handle quarter change (KPI only)
  const handleQuarterChange = (newQuarter) => {
    setSelectedQuarter(newQuarter);
    navigate(`/funds/${fundId}/dashboard/kpi/${newQuarter}`);
  };

  // If user visits /funds/:fundId/dashboard without tab, redirect to KPI
  useEffect(() => {
    if (!tab) {
      navigate(`/funds/${currentFund.id}/dashboard/kpi`, { replace: true });
    }
  }, [tab, currentFund.id, navigate]);

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
        {activeTab === 'KPI' ? <KPIDashboard /> : <LimitsDashboard />}
      </div>
    </div>
  );
}

export default DashboardPage;
