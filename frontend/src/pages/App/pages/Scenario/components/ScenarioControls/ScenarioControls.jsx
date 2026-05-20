import React from 'react';
import { PlusIconWhite, PlusIcon } from '/src/components/Icons/InteractiveIcons'; 
import { PermissionGate } from '../../../../../../hooks/Auth/PermissionGate'; // Import PermissionGate
import SearchBar from '../../../../../../components/SearchBar/SearchBar'
import './ScenarioControls.css';

// Update path to Icons based on your folder structure

function ScenarioControls({ onAddClick, selectedScenarioCount, onCreateSynthesisClick, onSearch }) {
    const isSynthesisButtonVisible = selectedScenarioCount > 0;

    return (
        <div className="scenarios-frame-2">
            <div className="scenarios-controls-left">

                <SearchBar
                    placeholder="Search by scenario..."
                    onSearch={onSearch}
                />

                <div className="created-by-badge">
                    <span>Created by you</span>
                </div>

            </div>
            <PermissionGate>
                <div className="scenarios-controls-right">
                    {isSynthesisButtonVisible && (
                        <button className="create-synthesis-button" onClick={onCreateSynthesisClick}>
                            <PlusIcon />
                            <span>Create Scenario Synthesis</span>
                        </button>
                    )}
                    <button className="add-scenario-button" onClick={onAddClick}>
                        < PlusIconWhite />
                        <span>Add new scenario</span>
                    </button>
                </div>
            </PermissionGate>
        </div>
    );
}
export default ScenarioControls;