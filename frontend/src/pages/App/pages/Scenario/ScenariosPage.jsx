import React from 'react';
import { Outlet, useMatch, useParams, useNavigate } from 'react-router-dom';
import { useScenarioHandlers } from '../../hooks/Scenarios/useScenarioHandlers';
import AddNewScenarioModal from './components/ScenarioControls/AddNewScenarioModal/AddNewScenarioModal';
import CreateSynthesisModal from './components/ScenarioControls/CreateSynthesisModal/CreateSynthesisModal';
import ScenarioList from './components/ScenarioList/ScenarioList';
import SynthesisList from './components/SynthesisList/SynthesisList';
import ScenarioControls from './components/ScenarioControls/ScenarioControls';
import './ScenariosPage.css'; 

// Move outside component to prevent re-creation
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
    const { state, actions } = useScenarioHandlers(fundId, author, apiRowToScenario);
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
                    onDelete={actions.handleDeleteScenario}
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
            
            <Outlet
            context={{
                fundId: fundId
            }}
            />
        </div>
    );
}

export default ScenariosPage;