/* src/features/Scenarios/components/SynthesisList/Details/SynthesisDetailsDrawer.jsx */

import React, { useState } from 'react'; // Removed useMemo
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import DrawerHeader from './components/Header/DrawerHeader';
import DrawerTable from './components/Table/DrawerTable';
import './SynthesisDetailsDrawer.css';

function SynthesisDetailsDrawer() {
  const { fundId, synthesisId } = useParams();
  const navigate = useNavigate();
  const location = useLocation(); // Retrieve location object
  
  const [isExpanded, setIsExpanded] = useState(false);
    
    // Retrieve data passed from the SynthesisCard via the 'state' prop
    // Fallback to empty string for safety if navigating directly via URL
    const { 
        synthesisTitle, 
        synthesisAuthor,
        synthesisCreatedDate,
        synthesisLinks,
        synthesisDescription // Assuming description is passed here now
    } = location.state || {}; // Destructure, using || {} ensures it defaults to an empty object

  const handleClose = () => {
    navigate(`/funds/${fundId}/scenarios`);
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
            title={synthesisTitle} 
            description={synthesisDescription}
        />

        <DrawerTable 
             // Pass links and other necessary props to the table
             synthesisLinks={synthesisLinks} 
        /> 

      </div>
    </div>
  );
}

export default SynthesisDetailsDrawer;