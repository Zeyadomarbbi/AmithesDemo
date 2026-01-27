import { Outlet, useMatch, useParams, useNavigate } from 'react-router-dom';

import { useFundData } from '../../hooks/useFundData';     // <--- ADD THIS IMPORT
import './DashboardPage.css';

import DashboardHeader from './components/DashboardHeader/DashboardHeader';
import DashboardTabs from './components/DashboardTabs/DashboardTabs';

function DashboardPage() {
  const { fundId } = useParams();
  const navigate = useNavigate();
  const { funds } = useFundData();

  const currentFund = funds.find(f => String(f.id) === String(fundId));
  const isKPI = useMatch('/funds/:fundId/dashboard/kpi/*');
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
        showQuarterSelector={Boolean(isKPI)}
        onTimeframeChange={handleTimeframeChange}
      />

      <DashboardTabs onTabChange={handleTabChange} />

      <div className="dashboard-content-frame">
        <Outlet
          context={{
            fund: currentFund,
            fundId: fundId,
          }}
        />
      </div>
    </div>
  );
}

export default DashboardPage;