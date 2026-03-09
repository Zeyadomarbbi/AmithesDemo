import React, { useEffect } from 'react';
import { Outlet, useMatch, useParams, useNavigate } from 'react-router-dom';
import DashboardHeader from './components/DashboardHeader/DashboardHeader';
import DashboardTabs from './components/DashboardTabs/DashboardTabs';
import { useFundData } from '../../hooks/Core/FundContext';
import { TimeframeProvider, useTimeframeContext } from '../../hooks/Core/TimeframeContext';
import './DashboardPage.css';

function DashboardContent() {
  const { fundId, timeframeId } = useParams();
  const navigate = useNavigate();
  const { funds } = useFundData();
  const { quarters, isLoading: tfLoading } = useTimeframeContext();
  
  const currentFund = funds.find(f => String(f.id) === String(fundId));
  const isKpiRoot = useMatch('/funds/:fundId/dashboard/kpi');
  const isKPIPath = useMatch('/funds/:fundId/dashboard/kpi/*');

  useEffect(() => {
    if (isKpiRoot && !tfLoading && !timeframeId && quarters.length > 0) {
      const latest = quarters[quarters.length - 1];
      if (latest) navigate(`kpi/${latest.id}`, { replace: true });
    }
  }, [isKpiRoot, quarters, timeframeId, navigate, tfLoading]);

  if (!currentFund) {
    return <div className="dashboard-loading">Loading Fund...</div>;
  }

  return (
    <div className="dashboard-page">
      <DashboardHeader
        fundName={currentFund.name}
        showQuarterSelector={Boolean(isKPIPath)}
        onTimeframeChange={(id) => navigate(`kpi/${id}`)}
      />
      <DashboardTabs onTabChange={(tab) => navigate(tab === 'KPI' ? 'kpi' : 'limits')} />
      <div className="dashboard-content-frame">
        {!tfLoading && quarters.length === 0 && isKPIPath ? (
          <div className="zero-timeframes-state">
            <h3>No Timeframes Available</h3>
            <p>Please create a new timeframe using the selector above to view KPI data.</p>
          </div>
        ) : (
          <Outlet context={{ fund: currentFund, fundId, timeframeId, hasTimeframes: quarters.length > 0 }} />
        )}
      </div>
    </div>
  );
}

function DashboardPage() {
  const { fundId } = useParams();

  return (
    <TimeframeProvider fundId={fundId}>
      <DashboardContent />
    </TimeframeProvider>
  );
}

export default DashboardPage;