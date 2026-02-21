import React, { useState } from 'react';
import { Outlet, useParams } from 'react-router-dom';
import { useScenarioHandlers } from '../../hooks/Scenarios/useScenarioHandlers';
import { useToast } from '../../components/Toast/useToast';
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

    return (
        <div className="scenarios-page-container">
            <div className="scenarios-frame-1">
                <h1 className="scenarios-title">Scenarios</h1>
            </div>

            <ScenarioControls
                onAddClick={() => actions.setIsModalOpen(true)}
                selectedScenarioCount={state.selectedScenarioIds.length}
                onCreateSynthesisClick={() => actions.setIsSynthesisModalOpen(true)}
            />

            <div className="scenarios-frame-3">
                <ScenarioList
                    title="List Of Scenario"
                    scenarios={state.scenarios}
                    selectedIds={state.selectedScenarioIds}
                    onToggleSelect={actions.toggleScenarioSelection}
                    onDelete={(id) => actions.handleDeleteScenario(id, (syntheses) => setConflictPrompt({ scenarioId: id, syntheses }))}
                />
            </div>

            <div className="scenarios-frame-4">
                <SynthesisList
                    title="Scenario Synthesis"
                    syntheses={state.syntheses}
                    onDelete={actions.handleDeleteSynthesis}
                />
            </div>

            {state.isModalOpen && (
                <AddNewScenarioModal
                    author={author}
                    onSave={actions.handleAddScenario}
                    onClose={() => actions.setIsModalOpen(false)}
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
    );
}
export default ScenariosPage;