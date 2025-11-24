import React, { useState, useEffect } from 'react';
// 1. Import Outlet here
import { useParams, Outlet } from 'react-router-dom'; 
import AddNewScenarioModal from './components/ScenarioControls/AddNewScenarioModal/AddNewScenarioModal';
import ScenarioList from './components/ScenarioList/ScenarioList';
import SynthesisList from './components/SynthesisList/SynthesisList';
import ScenarioControls from './components/ScenarioControls/ScenarioControls';

import './ScenariosPage.css'; 

function ScenariosPage() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [scenarios, setScenarios] = useState([]);
    const [syntheses, setSyntheses] = useState([]);
    const { fundId } = useParams();
    const [selectedScenarioIds, setSelectedScenarioIds] = useState([]);

    useEffect(() => {
        // ... (Your data fetching logic remains the same) ...
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

    const toggleScenarioSelection = (id) => {
        setSelectedScenarioIds(prev => 
            prev.includes(id) 
                ? prev.filter(scenarioId => scenarioId !== id) 
                : [...prev, id] 
        );
    };

    return (
        <div className="scenarios-page-container">
            <div className="scenarios-frame-1">
                <h1 className="scenarios-title">Scenarios</h1>
            </div>
            
            <ScenarioControls onAddClick={() => setIsModalOpen(true)} />

            <div className="scenarios-frame-3">
                <ScenarioList 
                    title="List of scenario" 
                    scenarios={scenarios} 
                    selectedIds={selectedScenarioIds}
                    onToggleSelect={toggleScenarioSelection}
                />
            </div>

            <div className="scenarios-frame-4">
                <SynthesisList title="Scenario synthesis" syntheses={syntheses} />
            </div>

            {isModalOpen && <AddNewScenarioModal onClose={() => setIsModalOpen(false)} />}

            {/* 2. ADD THE OUTLET HERE 
               This is where <SynthesisDetailsDrawer /> will render 
               when the URL matches /synthesis/:id
            */}
            <Outlet />

        </div>
    );
}

export default ScenariosPage;