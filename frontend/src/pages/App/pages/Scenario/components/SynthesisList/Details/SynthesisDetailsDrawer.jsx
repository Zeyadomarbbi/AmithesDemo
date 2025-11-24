import React, { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DrawerHeader from './components/DrawerHeader';
import DrawerTable from './components/DrawerTable';
import './SynthesisDetailsDrawer.css';

function SynthesisDetailsDrawer() {
  const { fundId, synthesisId } = useParams();
  const navigate = useNavigate();

  const handleClose = () => {
    navigate(`/funds/${fundId}/scenarios`);
  };

  // 1. MOCK DATA: The list of syntheses (This would normally come from an API or Context)
  const mockSyntheses = [
    { id: 1, title: "Exit Strategy Review", author: "Yann Maurice", description: "Analyzing exit paths for Q4." },
    { id: 2, title: "Q2 Committee Pitch", author: "Mathieu Rigot", description: "Preparation for the investment committee." },
    { id: 3, title: "Base vs Stress vs Optimistic", author: "Yann Maurice", description: "Comparative analysis of all scenarios." }
  ];

  // 2. FIND THE CURRENT SYNTHESIS
  const currentSynthesis = useMemo(() => {
    return mockSyntheses.find(s => s.id === parseInt(synthesisId));
  }, [synthesisId]);

  // Default fallback if ID doesn't exist
  const displayTitle = currentSynthesis ? currentSynthesis.title : "Unknown Synthesis";
  const displaySubtitle = currentSynthesis ? currentSynthesis.description : "";

  // Mock Table Data (unchanged)
  const tableRows = [
    { id: 1, name: "Nomlong prénom", val1: "42", val2: "42", val3: "42", type: "arrow" },
    { id: 2, name: "Nomlong prénom", val1: "35", val2: "42", val3: "42", type: "none" },
    { id: 3, name: "Nomlong prénom", val1: "62", val2: "62", val3: "62", type: "plus" },
    { id: 4, name: "Nomlong prénom", val1: "35", val2: "42", val3: "42", type: "arrow" },
  ];

  return (
    <div className="drawer-overlay" onClick={handleClose}>
      <div className="drawer-container" onClick={(e) => e.stopPropagation()}>
        
        {/* 3. PASS THE DATA TO HEADER */}
        <DrawerHeader 
            onClose={handleClose} 
            title={displayTitle} 
            subtitle={displaySubtitle} 
        />

        <DrawerTable rows={tableRows} />

      </div>
    </div>
  );
}

export default SynthesisDetailsDrawer;