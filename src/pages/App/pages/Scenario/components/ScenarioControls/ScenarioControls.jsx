import React from 'react';
import './ScenarioControls.css';

// Update path to Icons based on your folder structure
import { SearchIcon, PlusIcon } from './Icons'; 

function ScenarioControls({ onAddClick }) {
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

        {/* --- Right Group: Add Button --- */}
        {/* 3. Add New Scenario Button */}
        <button className="add-scenario-button" onClick={onAddClick}>
            <PlusIcon />
            <span>Add new scenario</span>
        </button>

    </div>
  );
}

export default ScenarioControls;