import React, { useState } from 'react';
import { useActiveFund } from '../../hooks/useActiveFund';
import './DashboardPage.css';

// Import the new components
import DashboardHeader from './components/DashboardHeader/DashboardHeader';
import DashboardTabs from './components/DashboardTabs/DashboardTabs';
import KPIDashboard from './components/KPIDashboard/KPIDashboard';
import LimitsDashboard from './components/LimitsDashboard/LimitsDashboard';

function DashboardPage() {
  const activeFundId = useActiveFund();
  // 1. State for the active tab (Default to 'KPI')
  const [activeTab, setActiveTab] = useState('KPI');

  const funds = [
    { id: 1, name: 'Asterium Fund I', code: 'AST' },
    { id: 2, name: 'Lynx Capital II', code: 'LYN' },
    { id: 3, name: 'Orion Partners III', code: 'ORI' },
    { id: 4, name: 'Silvergate Ventures', code: 'SIL' },
    { id: 5, name: 'Huron Growth Fund', code: 'HUR' },
    { id: 6, name: 'Pioneer Equity I', code: 'PIO' },
  ];
  const currentFund = funds.find(f => f.id.toString() === activeFundId.toString()) || funds[0];

  return (
    <div className="dashboard-page">
      
      {/* FRAME 1: Header */}
      <DashboardHeader 
        fundName={currentFund.name} 
        // Logic: Show quarter selector ONLY if activeTab is 'KPI'
        showQuarterSelector={activeTab === 'KPI'} 
      />

      {/* FRAME 2: Tabs */}
      <DashboardTabs 
        activeTab={activeTab} 
        onTabChange={setActiveTab} 
      />

      {/* FRAME 3: Content (Switch based on state) */}
      <div className="dashboard-content-frame">
        {activeTab === 'KPI' ? <KPIDashboard /> : <LimitsDashboard />}
      </div>

    </div>
  );
}

export default DashboardPage;