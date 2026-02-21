import React, { useState } from 'react';
import { useParams, useNavigate, useLocation, Outlet } from 'react-router-dom';
import DrawerDetails from './components/DrawerDetails';
import useScenarioSynthesis from './utils/useScenarioSynthesis';
import './SynthesisDetailsDrawer.css';

function SynthesisDetailsDrawer() {
  const { fundId, synthesisId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [isExpanded, setIsExpanded] = useState(false);

  const { synthesis, loading, error } = useScenarioSynthesis(fundId, synthesisId);

  const { 
    synthesisTitle, 
    synthesisDescription,
    synthesisLinks
  } = location.state || {};
  console.log("synthesis", synthesis)
  const handleClose = () => {
    navigate(`/funds/${fundId}/scenario-dashboard`);
  };

  const handleToggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  if (loading) return (
    <div className="drawer-overlay" onClick={handleClose}>
      <div className={`drawer-container ${isExpanded ? 'expanded' : ''}`} onClick={(e) => e.stopPropagation()}>
        <div className="drawer-loading">Loading...</div>
      </div>
    </div>
  );

  if (error) return (
    <div className="drawer-overlay" onClick={handleClose}>
      <div className={`drawer-container ${isExpanded ? 'expanded' : ''}`} onClick={(e) => e.stopPropagation()}>
        <div className="drawer-error">Failed to load synthesis: {error}</div>
      </div>
    </div>
  );

  return (
    <div className="drawer-overlay" onClick={handleClose}>
      <div
        className={`drawer-container ${isExpanded ? 'expanded' : ''}`}
        onClick={(e) => e.stopPropagation()}
      >
        {synthesisId && !location.pathname.includes('child-tab-name') ? (
          <DrawerDetails
            onClose={handleClose}
            onExpand={handleToggleExpand}
            isExpanded={isExpanded}
            title={synthesis?.synthesis_name || synthesisTitle || `Synthesis #${synthesisId}`}
            description={synthesis?.description || synthesisDescription}
            synthesisLinks={synthesisLinks}
            scenarios={synthesis?.scenarios || []}
          />
        ) : (
          <Outlet />
        )}
      </div>
    </div>
  );
}

export default SynthesisDetailsDrawer;