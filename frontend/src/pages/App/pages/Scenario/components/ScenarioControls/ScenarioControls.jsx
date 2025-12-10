import React from 'react';
import './ScenarioControls.css';

// Update path to Icons based on your folder structure
import { SearchIcon, PlusIcon } from './Icons'; 

function ScenarioControls({ onAddClick, selectedScenarioCount, onCreateSynthesisClick }) { 
    const isSynthesisButtonVisible = selectedScenarioCount > 0;

    return (
        <div className="scenarios-frame-2">
            
            {/* --- Left Group --- */}
            <div className="scenarios-controls-left">
                
                {/* 1. Search Bar */}
                <div className="scenarios-search-bar">
                    <div className="scenarios-search-icon-wrapper">
                       <SearchIcon />
                    </div>
                    <input 
                        type="text" 
                        placeholder="Search by scenario..." 
                        className="scenarios-search-input" 
                    />
                </div>

                {/* 2. Created By Badge */}
                <div className="created-by-badge">
                    <span>Created by you</span>
                </div>
                
            </div>

            {/* --- Right Group: Buttons --- */}
            <div className="scenarios-controls-right">
            
                {/* NEW BUTTON: Create Scenario Synthesis (Visible when selectedScenarioCount > 0) */}
                {isSynthesisButtonVisible && (
                    <button 
                        className="create-synthesis-button"
                        onClick={onCreateSynthesisClick} // <--- ATTACH HANDLER HERE
                    > 
                        <PlusIcon /> 
                        <span>Create Scenario Synthesis</span>
                    </button>
                )}

                {/* 3. Add New Scenario Button (Existing) */}
                <button className="add-scenario-button" onClick={onAddClick}>
                    <PlusIcon />
                    <span>Add new scenario</span>
                </button>
            
            </div>
        </div>
    );
}

export default ScenarioControls;