import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import AddNewScenarioModal from './components/ScenarioControls/AddNewScenarioModal/AddNewScenarioModal';
import ScenarioList from './components/ScenarioList/ScenarioList';
import SynthesisList from './components/SynthesisList/SynthesisList';
import ScenarioControls from './components/ScenarioControls/ScenarioControls'; // Import the new component


import './ScenariosPage.css'; 

function ScenariosPage() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [scenarios, setScenarios] = useState([]);
    const [syntheses, setSyntheses] = useState([]);
    const { fundId } = useParams();

    useEffect(() => {
      console.log(`Fetching scenarios for fund ID: ${fundId}`);
      // ... (Data fetching logic remains the same) ...
      const allScenarios = [
          { id: 1, fundId: 1, title: "Asterium - Optimistic", createdDate: "19.03.24", author: "Mathieu Rigot" },
          { id: 2, fundId: 1, title: "Asterium - Status Quo", createdDate: "12.04.25", author: "Yann Maurice" },
          { id: 3, fundId: 2, title: "Lynx - Early Exit", createdDate: "08.04.25", author: "Mathieu Rigot" },
          { id: 4, fundId: 2, title: "Lynx - Secondary Sale", createdDate: "19.03.24", author: "Mathieu Rigot" },
          { id: 5, fundId: 1, title: "Scenario Expansion Round", createdDate: "19.03.24", author: "Mathieu Rigot" },
          { id: 6, fundId: 1, title: "Scenario Strategic Acquisition", createdDate: "19.03.24", author: "Mathieu Rigot" }
      ];
      const allSyntheses = [
          { id: 1, fundId: 1, title: "Exit Strategy Review", author: "Yann Maurice", links: ["Scenario Optimistic", "Secondary Sale"] },
          { id: 2, fundId: 2, title: "Q2 Committee Pitch", author: "Yann Maurice", links: ["Scenario Status Quo", "Scenario Expansion Round"] },
          { id: 3, fundId: 1, title: "Base vs Stress vs Optimistic", author: "Yann Maurice", links: ["@Scenario1", "@Scenario1", "@Scenario1"] }
      ];
      const currentFundId = parseInt(fundId) || 1; 
      setScenarios(allScenarios.filter(s => s.fundId === currentFundId));
      setSyntheses(allSyntheses.filter(s => s.fundId === currentFundId));
      
    }, [fundId]);

    const openModal = () => setIsModalOpen(true);
    const closeModal = () => setIsModalOpen(false);

    return (
        <div className="scenarios-page-container">
            
            {/* === FRAME 1: Header Title === */}
            <div className="scenarios-frame-1">
                <h1 className="scenarios-title">Scenarios</h1>
            </div>

            {/* === FRAME 2: Search & Controls (Coming Soon) === */}
            <ScenarioControls onAddClick={openModal} />

            {/* === FRAME 3: List of Scenarios (Coming Soon) === */}
            <div className="scenarios-frame-3">
                <ScenarioList title="List of scenario" scenarios={scenarios} />
            </div>

            {/* === FRAME 4: Synthesis (Coming Soon) === */}
            <div className="scenarios-frame-4">
                <SynthesisList title="Scenario synthesis" syntheses={syntheses} />
            </div>

            {/* Modal */}
            {isModalOpen && <AddNewScenarioModal onClose={closeModal} />}
        </div>
    );
}

export default ScenariosPage;