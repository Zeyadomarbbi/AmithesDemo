/* src/features/Scenarios/components/SynthesisList/Details/SynthesisDetailsDrawer.jsx */

import React, { useMemo, useState } from 'react'; // 1. Import useState
import { useParams, useNavigate } from 'react-router-dom';
import DrawerHeader from './components/Header/DrawerHeader';
import DrawerTable from './components/Table/DrawerTable';
import './SynthesisDetailsDrawer.css';

function SynthesisDetailsDrawer() {
  const { fundId, synthesisId } = useParams();
  const navigate = useNavigate();
  
  // 2. Add State for expansion
  const [isExpanded, setIsExpanded] = useState(false);

  const handleClose = () => {
    navigate(`/funds/${fundId}/scenarios`);
  };

  const handleToggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  // Mock Data Logic (same as before)
  const mockSyntheses = [
    { id: 1, title: "Exit Strategy Review", description: "Analyzing exit paths for Q4." },
    { id: 2, title: "Q2 Committee Pitch", description: "Preparation for the investment committee." },
    { id: 3, title: "Base vs Stress vs Optimistic", description: "Comparative analysis of all scenarios." }
  ];

  const currentSynthesis = useMemo(() => {
    return mockSyntheses.find(s => s.id === parseInt(synthesisId));
  }, [synthesisId]);

  const displayTitle = currentSynthesis ? currentSynthesis.title : "Unknown Synthesis";
  const displaySubtitle = currentSynthesis ? currentSynthesis.description : "";

  return (
    <div className="drawer-overlay" onClick={handleClose}>
      {/* 3. Apply the 'expanded' class conditionally */}
      <div 
        className={`drawer-container ${isExpanded ? 'expanded' : ''}`} 
        onClick={(e) => e.stopPropagation()}
      >
        
        <DrawerHeader 
            onClose={handleClose} 
            onExpand={handleToggleExpand} // 4. Pass the handler
            title={displayTitle} 
            subtitle={displaySubtitle} 
        />

        <DrawerTable /> 

      </div>
    </div>
  );
}

export default SynthesisDetailsDrawer;