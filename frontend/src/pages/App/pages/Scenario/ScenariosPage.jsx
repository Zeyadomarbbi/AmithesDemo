import React, { useState } from 'react';
import { Outlet, useParams } from 'react-router-dom';
import { useScenarioHandlers } from '../../hooks/Scenarios/useScenarioHandlers';
import { useToast } from '../../components/Toast/useToast';
import { PageSpinner, PageError, PageNoData } from '../../../../components/LoadingScreens/LoadingScreens';
import Toast from '../../components/Toast/Toast';
import Prompt from '../../components/Toast/Prompt';
import AddNewScenarioModal from './components/ScenarioControls/AddNewScenarioModal/AddNewScenarioModal';
import CreateSynthesisModal from './components/ScenarioControls/CreateSynthesisModal/CreateSynthesisModal';
import ScenarioList from './components/ScenarioList/ScenarioList';
import SynthesisList from './components/SynthesisList/SynthesisList';
import ScenarioControls from './components/ScenarioControls/ScenarioControls';
import './ScenariosPage.css';

function apiRowToScenario(row) {
    return {
        id: row.scenario_id,
        fundId: row.fund_id,
        title: row.scenario_name,
        author: row.created_by,
        description: row.description,
        createdDate: new Date(row.created_at).toLocaleDateString('fr-FR', {
            day: '2-digit', month: '2-digit', year: '2-digit'
        }).replace(/\//g, '.')
    };
}

function ScenariosPage() {
    const { fundId } = useParams();
    const author = "Abdelrahman Rabah";

    const { toast, showToast, closeToast } = useToast();
    const { state, actions } = useScenarioHandlers(fundId, author, apiRowToScenario, showToast);
    const [conflictPrompt, setConflictPrompt] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [editingScenario, setEditingScenario] = useState(null);
    const [duplicatingScenario, setDuplicatingScenario] = useState(null);

    if (state.isLoading) {
    return (
        <div
        style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(255,255,255,0.75)',
            backdropFilter: 'blur(2px)',
            zIndex: 10,
            borderRadius: '8px',
        }}
        >
        <PageSpinner label="Loading scenarios and syntheses..." />
        </div>
    );
    }
    if (state.error) {
        return <PageError message={state.error} />;
    }

    const normalizedQuery = searchQuery.toLowerCase();

    const filteredScenarios = state.scenarios.filter(s =>
        s.title?.toLowerCase().includes(normalizedQuery) ||
        s.description?.toLowerCase().includes(normalizedQuery)
    );

    const filteredSyntheses = state.syntheses.filter(s =>
        s.title?.toLowerCase().includes(normalizedQuery) ||
        s.description?.toLowerCase().includes(normalizedQuery)
    );

    const hasNoData = filteredScenarios.length === 0 && filteredSyntheses.length === 0;
    
    return (
        <div className="scenarios-page">
            {state.isDeleting && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: '100vw',
                    height: '100vh',
                    backgroundColor: 'rgba(0, 0, 0, 0.4)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 9999,
                    backdropFilter: 'blur(2px)'
                }}>
                    <PageSpinner 
                        label="Deleting scenario and cleaning up data..." 
                        textColor="#000000" 
                    />
                </div>
            )}
            <div className="scenarios-page-container">
                <div className="scenarios-page-header">
                    <h1 className="scenarios-page-title">Scenarios</h1>
                </div>

                <div className="scenarios-page-content-area">
                    <ScenarioControls
                        onAddClick={() => actions.setIsModalOpen(true)}
                        selectedScenarioCount={state.selectedScenarioIds.length}
                        onCreateSynthesisClick={() => actions.setIsSynthesisModalOpen(true)}
                        onSearch={setSearchQuery}
                    />

                    {hasNoData ? (
                        <PageNoData 
                            message={searchQuery 
                                ? `No results matching "${searchQuery}"` 
                                : "Start by creating your first scenario."
                            } 
                        />
                    ) : (
                        <>
                            <div className="scenarios-frame-3">
                                <ScenarioList
                                    title="List Of Scenario"
                                    scenarios={filteredScenarios}
                                    selectedIds={state.selectedScenarioIds}
                                    onToggleSelect={actions.toggleScenarioSelection}
                                    onDelete={(id) => actions.handleDeleteScenario(id, (syntheses) => setConflictPrompt({ scenarioId: id, syntheses }))}
                                    onEdit={(id) => {
                                        const target = state.scenarios.find(s => s.id === id);
                                        setEditingScenario(target);
                                    }}
                                    onDuplicate={(id) => {
                                        const target = state.scenarios.find(s => s.id === id);
                                        setDuplicatingScenario(target);
                                    }}
                                />
                            </div>

                            <div className="scenarios-frame-4">
                                <SynthesisList
                                    title="Scenario Synthesis"
                                    syntheses={filteredSyntheses}
                                    onDelete={actions.handleDeleteSynthesis}
                                />
                            </div>
                        </>
                    )}

                    {state.isModalOpen && (
                        <AddNewScenarioModal
                            author={author}
                            onSave={actions.handleAddScenario}
                            onClose={() => actions.setIsModalOpen(false)}
                        />
                    )}

                    {editingScenario && (
                        <AddNewScenarioModal
                            author={author}
                            initialData={editingScenario}
                            onSave={async (updatedData) => {
                                try {
                                    await actions.handleEditScenario(editingScenario.id, updatedData);
                                    setEditingScenario(null);
                                } catch (error) {}
                            }}
                            onClose={() => setEditingScenario(null)}
                        />
                    )}

                    {duplicatingScenario && (
                        <AddNewScenarioModal
                            author={author}
                            initialData={duplicatingScenario}
                            isDuplicate={true}
                            onSave={async (newData) => {
                                try {
                                    await actions.handleDuplicateScenario(duplicatingScenario.id, newData);
                                    setDuplicatingScenario(null);
                                } catch (error) {}
                            }}
                            onClose={() => setDuplicatingScenario(null)}
                        />
                    )}

                    {state.isSynthesisModalOpen && (
                        <CreateSynthesisModal
                            selectedScenarioIds={state.selectedScenarioIds}
                            allScenarios={state.scenarios}
                            onSave={actions.handleAddSynthesis}
                            onClose={() => actions.setIsSynthesisModalOpen(false)}
                        />
                    )}

                    {conflictPrompt && (
                        <Prompt
                            type="error"
                            title="Scenario In Use"
                            message={`This scenario is linked to: ${conflictPrompt.syntheses.join(', ')}. Confirming will delete the scenario and those syntheses permanently.`}
                            confirmLabel="Delete All"
                            cancelLabel="Cancel"
                            onConfirm={() => {
                                actions.handleForceDeleteScenario(conflictPrompt.scenarioId);
                                setConflictPrompt(null);
                            }}
                            onCancel={() => setConflictPrompt(null)}
                        />
                    )}

                    {toast && (
                        <Toast
                            key={toast.key}
                            title={toast.title}
                            message={toast.message}
                            type={toast.type}
                            duration={toast.duration}
                            onClose={closeToast}
                        />
                    )}

                    <Outlet context={{ fundId }} />
                </div>
            </div>
        </div>
    );
}
export default ScenariosPage;