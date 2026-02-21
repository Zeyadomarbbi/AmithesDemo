import { useState, useEffect } from 'react';
import { API_BASE_URL } from '../useApi';

export function useScenarioHandlers(fundId, author, apiRowToScenario, showToast) {
    const [scenarios, setScenarios] = useState([]);
    const [syntheses, setSyntheses] = useState([]);
    const [selectedScenarioIds, setSelectedScenarioIds] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSynthesisModalOpen, setIsSynthesisModalOpen] = useState(false);

    useEffect(() => {
        if (!fundId) return;

        const fetchData = async () => {
            try {
                const scResp = await fetch(`${API_BASE_URL}/api/funds/${fundId}/scenario_list/`);
                if (!scResp.ok) throw new Error("Failed to fetch scenarios");
                const scData = await scResp.json();
                setScenarios(scData.map(apiRowToScenario));

                const synResp = await fetch(`${API_BASE_URL}/api/funds/${fundId}/synthesis-details/`);
                if (!synResp.ok) throw new Error("Failed to fetch syntheses");
                const synData = await synResp.json();

                const formattedSyntheses = synData.map(syn => ({
                    id: syn.synthesis_id,
                    fundId: syn.fund,
                    title: syn.synthesis_name,
                    author: syn.created_by,
                    description: syn.description,
                    createdDate: new Date(syn.created_at).toLocaleDateString("de-CH"),
                    links: syn.scenarios?.map(s => s.scenario_name) || []
                }));

                setSyntheses(formattedSyntheses);
            } catch (error) {
                console.error("Error loading data:", error);
                showToast({ title: "Load Failed", message: "Could not load scenarios or syntheses.", type: "error" });
            }
        };

        fetchData();
    }, [fundId]);

    const handleAddScenario = async (newScenarioData) => {
        const payload = {
            scenario_name: newScenarioData.name,
            description: newScenarioData.description,
            created_by: author
        };

        try {
            const response = await fetch(`${API_BASE_URL}/api/funds/${fundId}/scenario_list/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const errorData = await response.json();
                showToast({
                    title: "Creation Failed",
                    message: errorData.scenario_name || "Failed to save scenario.",
                    type: "error"
                });
                return;
            }

            const savedRow = await response.json();
            setScenarios(prev => [...prev, apiRowToScenario(savedRow)]);
            setIsModalOpen(false);
            showToast({ title: "Scenario Created", message: `"${newScenarioData.name}" was added successfully.`, type: "success" });
        } catch (error) {
            console.error("Persistence error:", error);
            showToast({ title: "Error", message: "An unexpected error occurred while saving the scenario.", type: "error" });
        }
    };

    const handleDeleteScenario = async (idToDelete, onConflict) => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/funds/${fundId}/scenario_list/${idToDelete}/`, {
                method: 'DELETE',
            });

            if (response.status === 409) {
                const errorData = await response.json();
                onConflict?.(errorData.syntheses || []);
                return;
            }

            if (!response.ok) throw new Error("Failed to delete scenario from the database.");

            setScenarios(prev => prev.filter(s => s.id !== idToDelete));
            setSelectedScenarioIds(prev => prev.filter(id => id !== idToDelete));
            showToast({ title: "Scenario Deleted", message: "The scenario was removed.", type: "success" });
        } catch (error) {
            console.error("Delete scenario error:", error);
            showToast({ title: "Delete Failed", message: "Could not delete scenario. Please try again.", type: "error" });
        }
    };

    const toggleScenarioSelection = (id) => {
        setSelectedScenarioIds(prev =>
            prev.includes(id) ? prev.filter(sid => sid !== id) : [...prev, id]
        );
    };

    const handleAddSynthesis = async (newSynthesisData) => {
        const payload = {
            synthesis_name: newSynthesisData.name,
            description: newSynthesisData.description,
            scenario_ids: selectedScenarioIds,
            created_by: author
        };

        try {
            const response = await fetch(`${API_BASE_URL}/api/funds/${fundId}/synthesis-details/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const errorData = await response.json();
                showToast({
                    title: "Synthesis Failed",
                    message: errorData.synthesis_name || "Failed to save synthesis.",
                    type: "error"
                });
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
            showToast({ title: "Synthesis Created", message: `"${newSynthesisData.name}" was created successfully.`, type: "success" });
        } catch (error) {
            console.error("Synthesis persistence error:", error);
            showToast({ title: "Error", message: "An unexpected error occurred while saving the synthesis.", type: "error" });
        }
    };

    const handleDeleteSynthesis = async (idToDelete) => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/funds/${fundId}/synthesis-details/${idToDelete}/`, {
                method: 'DELETE',
            });

            if (!response.ok) throw new Error("Failed to delete synthesis from the database.");

            setSyntheses(prev => prev.filter(s => s.id !== idToDelete));
            showToast({ title: "Synthesis Deleted", message: "The synthesis was removed.", type: "success" });
        } catch (error) {
            console.error("Delete synthesis error:", error);
            showToast({ title: "Delete Failed", message: "Could not delete synthesis. Please try again.", type: "error" });
        }
    };

    const handleForceDeleteScenario = async (idToDelete) => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/funds/${fundId}/scenario_list/${idToDelete}/?force=true`, {
                method: 'DELETE',
            });

            if (!response.ok) throw new Error("Failed to force delete scenario.");

            setScenarios(prev => prev.filter(s => s.id !== idToDelete));
            setSelectedScenarioIds(prev => prev.filter(id => id !== idToDelete));

            const synResp = await fetch(`${API_BASE_URL}/api/funds/${fundId}/synthesis-details/`);
            if (synResp.ok) {
                const synData = await synResp.json();
                setSyntheses(synData.map(syn => ({
                    id: syn.synthesis_id,
                    fundId: syn.fund_id,
                    title: syn.synthesis_name,
                    author: syn.created_by,
                    description: syn.description,
                    createdDate: new Date(syn.created_at).toLocaleDateString("de-CH"),
                    links: syn.scenarios?.map(s => s.scenario_name) || []
                })));
            }

            showToast({ title: "Deleted", message: "Scenario and linked syntheses were removed.", type: "success" });
        } catch (error) {
            console.error("Force delete error:", error);
            showToast({ title: "Delete Failed", message: "Could not delete. Please try again.", type: "error" });
        }
    };

    return {
        state: { scenarios, syntheses, selectedScenarioIds, isModalOpen, isSynthesisModalOpen },
        actions: {
            setIsModalOpen,
            setIsSynthesisModalOpen,
            handleAddScenario,
            handleDeleteScenario,
            handleForceDeleteScenario,
            toggleScenarioSelection,
            handleAddSynthesis,
            handleDeleteSynthesis
        }
    };
}