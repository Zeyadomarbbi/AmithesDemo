import React, { useState } from 'react';
import SimulationResults from './SimulationResults/SimulationResults';
import RealizedPortfolio from './RealizedPortfolio/RealizedPortfolio';
import InvestedPortfolio from './InvestedPortfolio/InvestedPortfolio';
import ProjectedPortfolio from './ProjectedPortfolio/ProjectedPortfolio';
// --- IMPORT THE NEW MODAL ---
import TargetSelectionModal from './TargetSelectionModal/TargetSelectionModal';
import './Portfolio.css';

// Static Data for Realized Portfolio
const realizedData = [
    { id: 1, name: "Terapia Group", date: "30.06.20", duration: "5 yrs", cost: "6 000 000", exitVal: "12 000 000", irr: "12.54%", moic: "2.00x" }
];

function Portfolio({ scenarioId }) {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [activeMode, setActiveMode] = useState(null);
    
    // --- NEW STATE FOR MODAL ---
    const [isTargetModalOpen, setIsTargetModalOpen] = useState(false);
    const [targetData, setTargetData] = useState(null); // Store saved data here

    const handleToggle = (mode) => {
        // Mutual exclusivity logic remains in the parent
        setActiveMode(prev => prev === mode ? null : mode);
    };

    // --- UPDATED HANDLER FOR THE BUTTON ---
    const handleOpenTargetModal = () => {
        console.log("Opening Target Selection Modal");
        setIsTargetModalOpen(true);
    };

    // --- NEW HANDLERS FOR MODAL ---
    const handleCloseTargetModal = () => {
        setIsTargetModalOpen(false);
    };

    const handleSaveTargetData = (data) => {
        console.log("Target Data Saved:", data);
        setTargetData(data);
        // You can perform further actions with the saved data here,
        // like sending it to an API or updating other components.
    };

    return (
        <div className="portfolio-page-layout">
            
            {/* === LEFT COLUMN: MAIN CONTENT === */}
            <div className="portfolio-main-content">
                <div className="portfolio-tab-container">
                    
                    {/* === TOGGLE CONTROLS SECTION === */}
                    <div className="portfolio-controls-header">
                        
                        {/* LEFT GROUP: Toggles */}
                        <div className="control-toggles-group">
                            {/* Toggle 1: Sensitivity Table */}
                            <div 
                                className="toggle-group" 
                                onClick={() => handleToggle('sensitivity')}
                            >
                                <div className={`toggle-track ${activeMode === 'sensitivity' ? 'active' : ''}`}>
                                    <div className="toggle-knob"></div>
                                </div>
                                <span className="toggle-label">Sensitivity table</span>
                            </div>

                            {/* Toggle 2: Target Mode */}
                            <div 
                                className="toggle-group" 
                                onClick={() => handleToggle('target')}
                            >
                                <div className={`toggle-track ${activeMode === 'target' ? 'active' : ''}`}>
                                    <div className="toggle-knob"></div>
                                </div>
                                <span className="toggle-label">Target mode</span>
                            </div>
                        </div>

                        {/* RIGHT GROUP: Choose Target Button (Conditional) */}
                        {activeMode === 'target' && (
                            <button 
                                className="destructive-btn-md" 
                                // --- UPDATED ONCLICK HANDLER ---
                                onClick={handleOpenTargetModal}
                            >
                                {/* The provided CSS hides the icons, using only the text span */}
                                <span>Choose a Target</span> 
                            </button>
                        )}
                    </div>

                    {/* SECTION 1: REALIZED PORTFOLIO */}
                    <RealizedPortfolio realizedData={realizedData} />

                    {/* SECTION 2: INVESTED PORTFOLIO */}
                    <InvestedPortfolio activeMode={activeMode} />

                    {/* SECTION 3: PROJECTED PORTFOLIO */}
                    <ProjectedPortfolio activeMode={activeMode} />

                </div>
            </div>

            {/* === RIGHT COLUMN: SIMULATION RESULTS === */}
            <div className={`portfolio-side-panel ${isCollapsed ? 'collapsed' : 'expanded'}`}>
                <SimulationResults 
                    isCollapsed={isCollapsed}
                    onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
                />
            </div>

            {/* --- RENDER THE MODAL --- */}
            <TargetSelectionModal 
                isOpen={isTargetModalOpen}
                onClose={handleCloseTargetModal}
                onSave={handleSaveTargetData}
            />
        </div>
    );
}

export default Portfolio;