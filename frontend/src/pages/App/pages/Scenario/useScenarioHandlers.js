import { useState, useEffect } from 'react';

export function useScenarioHandlers(fundId, author, apiRowToScenario) {
    const [scenarios, setScenarios] = useState([]);
    const [syntheses, setSyntheses] = useState([]);
    const [selectedScenarioIds, setSelectedScenarioIds] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSynthesisModalOpen, setIsSynthesisModalOpen] = useState(false);

    // Fetching Logic
    useEffect(() => {
        if (!fundId) return;
        
        const fetchScenarios = async () => {
            try {
                const response = await fetch(`http://127.0.0.1:8000/api/funds/${fundId}/scenarios/`);
                if (!response.ok) throw new Error("Failed to fetch scenarios");
                const data = await response.json();
                setScenarios(data.map(apiRowToScenario));
            } catch (error) {
                console.error("Error loading scenarios:", error);
            }
        };
        
        fetchScenarios();
        
        // Mock syntheses
        const allSyntheses = [
            { id: 1, fundId: 1, title: "Exit Strategy Review", createdDate: "08.04.25", author: "Yann Maurice", links: ["Scenario Optimistic", "Secondary Sale"], description: "Detailed analysis of potential fund exit strategies and Q4 projections." },
            { id: 2, fundId: 2, title: "Q2 Committee Pitch", author: "Yann Maurice", links: ["Scenario Status Quo", "Scenario Expansion Round"], description: "Presentation slides summarizing portfolio performance for the Q2 committee." },
            { id: 3, fundId: 1, title: "Base vs Stress vs Optimistic", author: "Yann Maurice", links: ["@Scenario1", "@Scenario1", "@Scenario1"], description: "A three-way comparison of market scenarios impact on fund valuations." },
            { id: 4, fundId: 1, title: "Base vs Stress vs Optimistic 2", author: author, links: ["@Scenario1", "@Scenario1", "@Scenario1"], description: "Follow-up analysis addressing committee feedback from the previous quarter." }
        ];
        
        const currentFundId = parseInt(fundId);
        setSyntheses(allSyntheses.filter(s => s.fundId === currentFundId));
    }, [fundId]); // Removed apiRowToScenario from dependencies

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

    // Synthesis Handlers
    const handleAddSynthesis = (newSynthesisData) => {
        const newId = syntheses.length > 0 ? Math.max(...syntheses.map(s => s.id)) + 1 : 1;
        
        const getFormattedDate = () => {
            const date = new Date();
            const day = String(date.getDate()).padStart(2, '0');
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const year = String(date.getFullYear()).slice(-2);
            return `${day}.${month}.${year}`;
        };
        
        const newSynthesis = { 
            id: newId, 
            fundId: parseInt(fundId), 
            title: newSynthesisData.name, 
            author, 
            links: newSynthesisData.scenarioTitles, 
            description: newSynthesisData.description, 
            createdDate: getFormattedDate()
        };
        
        setSyntheses(prev => [...prev, newSynthesis]);
        setSelectedScenarioIds([]);
        setIsSynthesisModalOpen(false);
    };

    const handleDeleteSynthesis = (id) => setSyntheses(prev => prev.filter(s => s.id !== id));

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