import { Navigate, useParams, useLocation } from 'react-router-dom';
import { useFundData } from './FundContext';

const FundSetupGuard = ({ children }) => {
  const { fundId } = useParams();
  const { funds, isLoading } = useFundData();
  const location = useLocation();

  if (isLoading) return <div>Checking fund status...</div>;

  const fund = funds.find(f => String(f.id) === String(fundId));
  
  // 1. Identify if the user is currently in the Settings area
  const isSettingsPage = location.pathname.includes('/settings');

  /**
   * FIX: Only redirect to setup IF:
   * 1. The fund exists.
   * 2. The fund is NOT finalized (is_setup_complete is false).
   * 3. The user is trying to access a page OUTSIDE of settings (like Dashboard).
   */
  if (fund && fund.is_setup_complete === false && !isSettingsPage) {
    return <Navigate to={`/funds/${fundId}/settings/fund-identity`} replace />;
  }

  // If the fund IS complete, or they are already in settings, let them through
  return children;
};

export default FundSetupGuard;