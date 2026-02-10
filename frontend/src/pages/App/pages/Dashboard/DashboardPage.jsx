import React, { useEffect } from 'react';
import { Outlet, useMatch, useParams, useNavigate } from 'react-router-dom';
import { useFundData } from '../../hooks/Core/FundContext';
import { useTimeframes } from '../../hooks/Core/useTimeframes'; 
import './DashboardPage.css';

import DashboardHeader from './components/DashboardHeader/DashboardHeader';
import DashboardTabs from './components/DashboardTabs/DashboardTabs';

function DashboardPage() {
  const { fundId, timeframeId } = useParams();
  const navigate = useNavigate();
  const { funds } = useFundData();
  
  // Destructure setQuarters so we can update the list after a creation
  const { quarters, isLoading: tfLoading, setQuarters } = useTimeframes(fundId);
  const currentFund = funds.find(f => String(f.id) === String(fundId));

  const isKpiRoot = useMatch('/funds/:fundId/dashboard/kpi');
  const isKPIPath = useMatch('/funds/:fundId/dashboard/kpi/*');

  useEffect(() => {
    if (isKpiRoot && !tfLoading && !timeframeId && quarters.length > 0) {
      const latest = quarters[quarters.length - 1];
      if (latest) {
        navigate(`kpi/${latest.id}`, { replace: true });
      }
    }
  }, [isKpiRoot, quarters, timeframeId, navigate, tfLoading]);

  if (!currentFund) {
    return <div className="dashboard-loading">Loading Fund...</div>;
  }

  const handleTabChange = (tab) => {
    navigate(tab === 'KPI' ? 'kpi' : 'limits');
  };

  const handleTimeframeChange = (id) => {
    navigate(`kpi/${id}`);
  };

  return (
    <div className="dashboard-page">
      <DashboardHeader
        fundId={fundId}
        fundName={currentFund.name}
        showQuarterSelector={Boolean(isKPIPath)}
        onTimeframeChange={handleTimeframeChange}
        existingQuarters={quarters} 
        isQuartersLoading={tfLoading}
        setQuarters={setQuarters} // <--- PASS THIS
      />

      <DashboardTabs onTabChange={handleTabChange} />

      <div className="dashboard-content-frame">
        {!tfLoading && quarters.length === 0 && isKPIPath ? (
          <div className="zero-timeframes-state">
            <h3>No Timeframes Available</h3>
            <p>Please create a new timeframe using the selector above to view KPI data.</p>
          </div>
        ) : (
          <Outlet
            context={{
              fund: currentFund,
              fundId: fundId,
              timeframeId: timeframeId,
              hasTimeframes: quarters.length > 0
            }}
          />
        )}
      </div>
    </div>
  );
}

export default DashboardPage;