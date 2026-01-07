import { useState, useEffect } from 'react';

export function useScenarioHandlers(fundId, author, apiRowToScenario) {
    const [scenarios, setScenarios] = useState([]);
    const [syntheses, setSyntheses] = useState([]);
    const [selectedScenarioIds, setSelectedScenarioIds] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSynthesisModalOpen, setIsSynthesisModalOpen] = useState(false);

    // Fetching Logic for Scenarios and Syntheses
    useEffect(() => {
        if (!fundId) return;
        
        const fetchData = async () => {
            try {
                // Fetch Scenarios
                const scResp = await fetch(`http://127.0.0.1:8000/api/funds/${fundId}/scenarios/`);
                if (!scResp.ok) throw new Error("Failed to fetch scenarios");
                const scData = await scResp.json();
                setScenarios(scData.map(apiRowToScenario));

                // Fetch Syntheses from Backend
                const synResp = await fetch(`http://127.0.0.1:8000/api/funds/${fundId}/synthesis/`);
                if (!synResp.ok) throw new Error("Failed to fetch syntheses");
                const synData = await synResp.json();
                
                // Map backend synthesis data to frontend structure
                const formattedSyntheses = synData.map(syn => ({
                    id: syn.synthesis_id,
                    fundId: syn.fund,
                    title: syn.synthesis_name,
                    author: syn.created_by,
                    description: syn.description,
                    createdDate: new Date(syn.created_at).toLocaleDateString("de-CH"),
                    // 'scenarios' field comes from the nested serializer
                    links: syn.scenarios?.map(s => s.scenario_name) || []
                }));
                
                setSyntheses(formattedSyntheses);
            } catch (error) {
                console.error("Error loading data:", error);
            }
        };
        
        fetchData();
    }, [fundId]);

    // Scenario Handlers
    const handleAddScenario = async (newScenarioData) => {
        const payload = { 
            scenario_name: newScenarioData.name, 
            description: newScenarioData.description, 
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
            setScenarios(prev => [...prev, apiRowToScenario(savedRow)]);
            setIsModalOpen(false);
        } catch (error) {
            console.error("Persistence error:", error);
        }
    };

    const handleDeleteScenario = (idToDelete) => {
        setScenarios(prev => prev.filter(s => s.id !== idToDelete));
        setSelectedScenarioIds(prev => prev.filter(id => id !== idToDelete));
    };

    const toggleScenarioSelection = (id) => {
        setSelectedScenarioIds(prev => 
            prev.includes(id) ? prev.filter(sid => sid !== id) : [...prev, id]
        );
    };

    // Synthesis Handlers with Backend Persistence
    const handleAddSynthesis = async (newSynthesisData) => {
        const payload = {
            synthesis_name: newSynthesisData.name,
            description: newSynthesisData.description,
            scenario_ids: selectedScenarioIds,
            created_by: author
        };

        try {
            const response = await fetch(`http://127.0.0.1:8000/api/funds/${fundId}/synthesis/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const errorData = await response.json();
                alert(errorData.synthesis_name || "Failed to save synthesis");
                return;
            }

            const savedRow = await response.json();

            const formattedSynthesis = {
                id: savedRow.synthesis_id,
                fundId: savedRow.fund,
                title: savedRow.synthesis_name,
                author: savedRow.created_by,
                description: savedRow.description,
                createdDate: new Date(savedRow.created_at).toLocaleDateString("de-CH"),
                links: savedRow.scenarios?.map(s => s.scenario_name) || newSynthesisData.scenarioTitles
            };

            setSyntheses(prev => [...prev, formattedSynthesis]);
            setSelectedScenarioIds([]);
            setIsSynthesisModalOpen(false);
        } catch (error) {
            console.error("Synthesis persistence error:", error);
        }
    };

    const handleDeleteSynthesis = async (id) => {
        // Implementation for DELETE request to backend should be added here
        setSyntheses(prev => prev.filter(s => s.id !== id));
    };

    return {
        state: { scenarios, syntheses, selectedScenarioIds, isModalOpen, isSynthesisModalOpen },
        actions: { 
            setIsModalOpen, 
            setIsSynthesisModalOpen, 
            handleAddScenario, 
            handleDeleteScenario, 
            toggleScenarioSelection, 
            handleAddSynthesis, 
            handleDeleteSynthesis 
        }
    };
}