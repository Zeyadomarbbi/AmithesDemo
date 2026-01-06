import React, { useState, useEffect } from 'react';
// 1. Import Outlet here
import { useParams, Outlet } from 'react-router-dom'; 
import AddNewScenarioModal from './components/ScenarioControls/AddNewScenarioModal/AddNewScenarioModal';
import CreateSynthesisModal from './components/ScenarioControls/CreateSynthesisModal/CreateSynthesisModal';
import ScenarioList from './components/ScenarioList/ScenarioList';
import SynthesisList from './components/SynthesisList/SynthesisList';
import ScenarioControls from './components/ScenarioControls/ScenarioControls';

import './ScenariosPage.css'; 

function apiRowToScenario(row) {
    return {
        id: row.scenario_id,             // database primary key
        fundId: row.fund_id,             // database foreign key
        title: row.scenario_name,        // Maps 'scenario_name' to 'title'
        author: row.created_by,          // Maps 'created_by' to 'author'
        description: row.description,    // database field
        // Formats ISO date to your current DD.MM.YY format
        createdDate: new Date(row.created_at).toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: '2-digit'
        }).replace(/\//g, '.')
    };
}

function ScenariosPage() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSynthesisModalOpen, setIsSynthesisModalOpen] = useState(false); // <--- NEW STATE
    const [scenarios, setScenarios] = useState([]);
    const [syntheses, setSyntheses] = useState([]);
    const { fundId } = useParams();
    const [selectedScenarioIds, setSelectedScenarioIds] = useState([]);
    const author = "Abdelrahman Rabah"
    useEffect(() => {
        if (!fundId) return;

        const fetchScenarios = async () => {
            try {
                const response = await fetch(`http://127.0.0.1:8000/api/funds/${fundId}/scenarios/`);
                
                if (!response.ok) {
                    throw new Error("Failed to fetch scenarios");
                }

                const data = await response.json();
                
                // Transform backend rows to frontend format
                const transformedScenarios = data.map(apiRowToScenario);
                
                setScenarios(transformedScenarios);
            } catch (error) {
                console.error("Error loading scenarios:", error);
            }
        };

        fetchScenarios();

        // Synthesis mock data remains as is for now
        const allSyntheses = [
            { id: 1, fundId: 1, title: "Exit Strategy Review", createdDate: "08.04.25", author: "Yann Maurice", links: ["Scenario Optimistic", "Secondary Sale"], description: "Detailed analysis of potential fund exit strategies and Q4 projections." },
            { id: 2, fundId: 2, title: "Q2 Committee Pitch", author: "Yann Maurice", links: ["Scenario Status Quo", "Scenario Expansion Round"], description: "Presentation slides summarizing portfolio performance for the Q2 committee." },
            { id: 3, fundId: 1, title: "Base vs Stress vs Optimistic", author: "Yann Maurice", links: ["@Scenario1", "@Scenario1", "@Scenario1"], description: "A three-way comparison of market scenarios impact on fund valuations." },
            { id: 4, fundId: 1, title: "Base vs Stress vs Optimistic 2", author: author, links: ["@Scenario1", "@Scenario1", "@Scenario1"], description: "Follow-up analysis addressing committee feedback from the previous quarter." }
        ];
        
        const currentFundId = parseInt(fundId);
        setSyntheses(allSyntheses.filter(s => s.fundId === currentFundId));

    }, [fundId]);
    const handleAddScenario = async (newScenarioData) => {
    // 1. Prepare data for Django Serializer
        const payload = {
            scenario_name: newScenarioData.name,
            description: newScenarioData.description,
            // Optional: If you update your Serializer/View to accept 'created_by' from the body
            created_by: author 
        };

        try {
            const response = await fetch(`http://127.0.0.1:8000/api/funds/${fundId}/scenarios/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const errorData = await response.json();
                alert(errorData.scenario_name || "Failed to save scenario");
                return;
            }

            const savedRow = await response.json();

            // 2. Transform the row, ensuring the frontend 'author' matches the saved record
            const formattedScenario = apiRowToScenario(savedRow);

            // 3. Update local state
            setScenarios(prev => [...prev, formattedScenario]);
            setIsModalOpen(false);

        } catch (error) {
            console.error("Persistence error:", error);
        }
    };

    const handleAddSynthesis = (newSynthesisData) => {
        // 1. Determine a new unique ID (In a real app, this comes from the database/API response)
        const newId = syntheses.length > 0 ? Math.max(...syntheses.map(s => s.id)) + 1 : 1;
        const getFormattedDate = () => {
            const date = new Date();
            const day = String(date.getDate()).padStart(2, '0');
            const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed
            const year = String(date.getFullYear()).slice(-2); // Get last two digits of the year
            return `${day}.${month}.${year}`;
        };
        
        // 2. Format the new synthesis object
        const newSynthesis = {
            id: newId,
            fundId: parseInt(fundId) || 1, 
            title: newSynthesisData.name,
            author: author, 
            links: newSynthesisData.scenarioTitles, 
            description: newSynthesisData.description,
            
            // MODIFICATION HERE: Use the new format function
            createdDate: getFormattedDate(), 
        };

        // 3. Update the state
        setSyntheses(prevSyntheses => [...prevSyntheses, newSynthesis]);
        setSelectedScenarioIds([]);
        setIsSynthesisModalOpen(false);
    };

    const handleDeleteScenario = (idToDelete) => {
        // Filter the scenarios list to remove the scenario with idToDelete
        setScenarios(prevScenarios => 
            prevScenarios.filter(scenario => scenario.id !== idToDelete)
        );
        // Also remove from selected IDs if it was selected
        setSelectedScenarioIds(prev => 
            prev.filter(selectedId => selectedId !== idToDelete)
        );
    };

    const handleDeleteSynthesis = (idToDelete) => {
        // Filter the syntheses list to remove the synthesis with idToDelete
        setSyntheses(prevSyntheses => 
            prevSyntheses.filter(synthesis => synthesis.id !== idToDelete)
        );
    };  

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
            
            <ScenarioControls 
                onAddClick={() => setIsModalOpen(true)}
                selectedScenarioCount={selectedScenarioIds.length}
                onCreateSynthesisClick={() => setIsSynthesisModalOpen(true)} 
            />

            <div className="scenarios-frame-3">
                <ScenarioList 
                    title="List Of Scenario" 
                    scenarios={scenarios} 
                    selectedIds={selectedScenarioIds}
                    onToggleSelect={toggleScenarioSelection}
                    onDelete={handleDeleteScenario}
                />
            </div>

            <div className="scenarios-frame-4">
                <SynthesisList 
                    title="Scenario Synthesis" 
                    syntheses={syntheses}
                    onDelete={handleDeleteSynthesis}
                />
            </div>
            {/* For Scenario Creation */}
            {isModalOpen && (
                <AddNewScenarioModal 
                    author={author} // Pass the current user
                    onSave={handleAddScenario} // New save handler
                    onClose={() => setIsModalOpen(false)}
                />
            )}
            {/* For Synthesis Creation */}
            {isSynthesisModalOpen && (
                 <CreateSynthesisModal 
                    selectedScenarioIds={selectedScenarioIds} 
                    allScenarios={scenarios} // Pass available scenarios to look up titles/details
                    onSave={handleAddSynthesis} // <--- NEW PROP
                    onClose={() => setIsSynthesisModalOpen(false)}
                 />
            )}
            <Outlet />

        </div>
    );
}

export default ScenariosPage;