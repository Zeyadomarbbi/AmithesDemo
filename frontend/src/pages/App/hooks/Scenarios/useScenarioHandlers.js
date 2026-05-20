import { useState, useEffect, useCallback } from 'react';
import useApi from "../../../../hooks/api/useApi";

export function useScenarioHandlers(fundId, author, apiRowToScenario, showToast) {
    const api = useApi();
    const [scenarios, setScenarios] = useState([]);
    const [syntheses, setSyntheses] = useState([]);
    const [selectedScenarioIds, setSelectedScenarioIds] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSynthesisModalOpen, setIsSynthesisModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isDeleting, setIsDeleting] = useState(false);
    const [error, setError] = useState(null);

    const fetchData = useCallback(async () => {
        if (!fundId) {
            setIsLoading(false);
            return;
        }
        
        setIsLoading(true);
        setError(null);
        
        try {
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
        } catch (err) {
            console.error("Error loading data:", err);
            const errorMessage = err.message || "Could not load scenarios or syntheses.";
            setError(errorMessage);
            showToast({ title: "Load Failed", message: errorMessage, type: "error" });
        } finally {
            setIsLoading(false);
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
            showToast({ title: "Creation Failed", message: error.message || "Failed to save scenario.", type: "error" });
        }
    };

    const handleEditScenario = async (id, updatedData) => {
        const payload = {
            scenario_name: updatedData.name,
            description: updatedData.description
        };

        try {
            const updatedRow = await api.patch(`/api/funds/${fundId}/scenario_list/${id}/`, payload);
            setScenarios(prev => prev.map(s => s.id === id ? apiRowToScenario(updatedRow) : s));
            showToast({ title: "Scenario Updated", message: `"${updatedData.name}" was updated successfully.`, type: "success" });
        } catch (error) {
            console.error("Update error:", error);
            showToast({ title: "Update Failed", message: error.message || "Failed to update scenario.", type: "error" });
            throw error;
        }
    };

    const handleDuplicateScenario = async (id, duplicateData) => {
        try {
            const payload = {
                scenario_name: duplicateData.name,
                description: duplicateData.description,
                created_by: author
            };
            const duplicatedRow = await api.post(`/api/funds/${fundId}/scenario_list/${id}/duplicate/`, payload);
            setScenarios(prev => [...prev, apiRowToScenario(duplicatedRow)]);
            showToast({ title: "Scenario Duplicated", message: `"${duplicateData.name}" created successfully.`, type: "success" });
        } catch (error) {
            console.error("Duplicate error:", error);
            showToast({ title: "Duplication Failed", message: error.message, type: "error" });
            throw error; // Throw to keep modal open on failure
        }
    };

    const handleDeleteScenario = async (idToDelete, onConflict) => {
            setIsDeleting(true); // Start loading
            try {
                await api.delete(`/api/funds/${fundId}/scenario_list/${idToDelete}/`);
                
                setScenarios(prev => prev.filter(s => s.id !== idToDelete));
                setSelectedScenarioIds(prev => prev.filter(id => id !== idToDelete));
                showToast({ title: "Scenario Deleted", message: "The scenario was removed.", type: "success" });
            } catch (error) {
                if (error.message.includes("409") || error.status === 409) {
                    onConflict?.([]); 
                    return;
                }
                showToast({ title: "Delete Failed", message: error.message, type: "error" });
            } finally {
                setIsDeleting(false); // Stop loading
            }
        };

    const handleForceDeleteScenario = async (idToDelete) => {
        setIsDeleting(true); // Start loading
        try {
            await api.delete(`/api/funds/${fundId}/scenario_list/${idToDelete}/`, {
                params: { force: "true" }
            });

            setScenarios(prev => prev.filter(s => s.id !== idToDelete));
            setSelectedScenarioIds(prev => prev.filter(id => id !== idToDelete));
            
            // Refresh syntheses...
            const synData = await api.get(`/api/funds/${fundId}/synthesis-details/`);
            setSyntheses(synData.map(syn => ({ /* mapping logic */ })));

            showToast({ title: "Deleted", message: "Scenario and linked syntheses were removed.", type: "success" });
        } catch (error) {
            showToast({ title: "Delete Failed", message: error.message, type: "error" });
        } finally {
            setIsDeleting(false); // Stop loading
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

    return {
        state: { 
            scenarios, syntheses, selectedScenarioIds, 
            isModalOpen, isSynthesisModalOpen, isLoading, error, isDeleting
        },
        actions: {
            setIsModalOpen, setIsSynthesisModalOpen,
            handleAddScenario, handleEditScenario, handleDuplicateScenario,
            handleDeleteScenario, handleForceDeleteScenario, toggleScenarioSelection,
            handleAddSynthesis, handleDeleteSynthesis
        }
    };
}