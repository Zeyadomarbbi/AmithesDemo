import React, { useState } from 'react';
import { useParams, useNavigate, useLocation, Outlet } from 'react-router-dom';
import DrawerHeader from './components/Header/DrawerHeader';
import DrawerTable from './components/Table/DrawerTable';
import './SynthesisDetailsDrawer.css';

function SynthesisDetailsDrawer() {
  const { fundId, synthesisId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [isExpanded, setIsExpanded] = useState(false);
    
  const { 
      synthesisTitle, 
      synthesisDescription,
      synthesisLinks
  } = location.state || {}; 

  const handleClose = () => {
    // Navigate back to the parent Scenarios page
    navigate(`/funds/${fundId}/scenario-dashboard`);
  };

  const handleToggleExpand = () => {
    setIsExpanded(!isExpanded);
  };
  
  return (
    <div className="drawer-overlay" onClick={handleClose}>
      <div 
        className={`drawer-container ${isExpanded ? 'expanded' : ''}`} 
        onClick={(e) => e.stopPropagation()}
      >
        
        <DrawerHeader 
            onClose={handleClose} 
            onExpand={handleToggleExpand} 
            title={synthesisTitle || `Synthesis #${synthesisId}`} 
            description={synthesisDescription}
        />

        {/* If you are on the base route /synthesis-details/:id, show the table.
          If you navigate to a child route, the Outlet will render that child instead.
        */}
        <div className="drawer-content">
            {synthesisId && !location.pathname.includes('child-tab-name') ? (
                <DrawerTable synthesisLinks={synthesisLinks} /> 
            ) : (
                <Outlet />
            )}
        </div>

      </div>
    </div>
  );
}

export default SynthesisDetailsDrawer;