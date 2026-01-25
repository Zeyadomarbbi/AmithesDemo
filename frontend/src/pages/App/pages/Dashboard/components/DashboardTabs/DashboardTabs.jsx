import { useMatch } from 'react-router-dom';
import './DashboardTabs.css';

function DashboardTabs({ onTabChange }) {
  const isKPI = useMatch('/funds/:fundId/dashboard/kpi/*');
  const isLimits = useMatch('/funds/:fundId/dashboard/limits');

  return (
    <div className="dashboard-tabs-frame">
      <button
        className={`dashboard-tab-item ${isKPI ? 'active' : ''}`}
        onClick={() => onTabChange('KPI')}
      >
        KPI
      </button>

      <button
        className={`dashboard-tab-item ${isLimits ? 'active' : ''}`}
        onClick={() => onTabChange('Limits')}
      >
        Limits
      </button>
    </div>
  );
}

export default DashboardTabs;
