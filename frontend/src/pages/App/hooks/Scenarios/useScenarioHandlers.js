import { useState, useEffect, useCallback } from 'react';
import useApi from "../api/useApi";

export function useScenarioHandlers(fundId, author, apiRowToScenario, showToast) {
    const api = useApi();
    const [scenarios, setScenarios] = useState([]);
    const [syntheses, setSyntheses] = useState([]);
    const [selectedScenarioIds, setSelectedScenarioIds] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSynthesisModalOpen, setIsSynthesisModalOpen] = useState(false);

    const fetchData = useCallback(async () => {
        if (!fundId) return;
        try {
            // Simultaneous fetching using the api engine
            const [scData, synData] = await Promise.all([
                api.get(`/api/funds/${fundId}/scenario_list/`),
                api.get(`/api/funds/${fundId}/synthesis-details/`)
            ]);

            setScenarios(scData.map(apiRowToScenario));

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
            showToast({ 
                title: "Load Failed", 
                message: error.message || "Could not load scenarios or syntheses.", 
                type: "error" 
            });
        }
    }, [fundId, api, apiRowToScenario, showToast]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleAddScenario = async (newScenarioData) => {
        const payload = {
            scenario_name: newScenarioData.name,
            description: newScenarioData.description,
            created_by: author
        };

        try {
            const savedRow = await api.post(`/api/funds/${fundId}/scenario_list/`, payload);
            setScenarios(prev => [...prev, apiRowToScenario(savedRow)]);
            setIsModalOpen(false);
            showToast({ title: "Scenario Created", message: `"${newScenarioData.name}" was added successfully.`, type: "success" });
        } catch (error) {
            console.error("Persistence error:", error);
            showToast({ 
                title: "Creation Failed", 
                message: error.message || "Failed to save scenario.", 
                type: "error" 
            });
        }
    };

    const handleDeleteScenario = async (idToDelete, onConflict) => {
        try {
            await api.delete(`/api/funds/${fundId}/scenario_list/${idToDelete}/`);
            
            setScenarios(prev => prev.filter(s => s.id !== idToDelete));
            setSelectedScenarioIds(prev => prev.filter(id => id !== idToDelete));
            showToast({ title: "Scenario Deleted", message: "The scenario was removed.", type: "success" });
        } catch (error) {
            // Specific handling for Django 409 Conflict (Linked Syntheses)
            if (error.message.includes("409") || error.status === 409) {
                // Note: Ensure your api engine passes the error data if you need the synthesis list
                onConflict?.([]); 
                return;
            }
            console.error("Delete scenario error:", error);
            showToast({ title: "Delete Failed", message: error.message, type: "error" });
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
            const savedRow = await api.post(`/api/funds/${fundId}/synthesis-details/`, payload);

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
            showToast({ title: "Error", message: error.message, type: "error" });
        }
    };

    const handleDeleteSynthesis = async (idToDelete) => {
        try {
            await api.delete(`/api/funds/${fundId}/synthesis-details/${idToDelete}/`);
            setSyntheses(prev => prev.filter(s => s.id !== idToDelete));
            showToast({ title: "Synthesis Deleted", message: "The synthesis was removed.", type: "success" });
        } catch (error) {
            console.error("Delete synthesis error:", error);
            showToast({ title: "Delete Failed", message: error.message, type: "error" });
        }
    };

    const handleForceDeleteScenario = async (idToDelete) => {
        try {
            await api.delete(`/api/funds/${fundId}/scenario_list/${idToDelete}/`, {
                params: { force: "true" } // or append to string if api engine doesn't handle params
            });

            setScenarios(prev => prev.filter(s => s.id !== idToDelete));
            setSelectedScenarioIds(prev => prev.filter(id => id !== idToDelete));

            // Refresh syntheses to reflect the removal of linked items
            const synData = await api.get(`/api/funds/${fundId}/synthesis-details/`);
            setSyntheses(synData.map(syn => ({
                id: syn.synthesis_id,
                fundId: syn.fund_id,
                title: syn.synthesis_name,
                author: syn.created_by,
                description: syn.description,
                createdDate: new Date(syn.created_at).toLocaleDateString("de-CH"),
                links: syn.scenarios?.map(s => s.scenario_name) || []
            })));

            showToast({ title: "Deleted", message: "Scenario and linked syntheses were removed.", type: "success" });
        } catch (error) {
            console.error("Force delete error:", error);
            showToast({ title: "Delete Failed", message: error.message, type: "error" });
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