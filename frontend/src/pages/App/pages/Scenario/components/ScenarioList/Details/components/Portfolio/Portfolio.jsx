import React, { useState } from 'react';
    import RealizedPortfolio from './RealizedPortfolio/RealizedPortfolio';
import InvestedPortfolio from './InvestedPortfolio/InvestedPortfolio';
import ProjectedPortfolio from './ProjectedPortfolio/ProjectedPortfolio';
// --- IMPORT THE NEW MODAL ---
import TargetSelectionModal from './TargetSelectionModal/TargetSelectionModal';
import './Portfolio.css';

// Static Data for Realized Portfolio
const DEFAULT_REALIZED_DATA = [
    { 
        id: 1, 
        name: "Terapia Group", 
        date: "30.06.20", 
        duration: "5 yrs", 
        cost: "6 000 000", 
        exitVal: "12 000 000", 
        dividends: "1 000 000", 
        exitDate: "30.06.2025",    
        irr: "12.54%", 
        moic: "2.00x" 
    },
    { 
        id: 2, 
        name: "Alpha Corp", 
        date: "01.01.19", 
        duration: "4 yrs", 
        cost: "10 000 000", 
        exitVal: "25 000 000", 
        dividends: "500 000",
        exitDate: "01.01.2023",
        irr: "25.00%", 
        moic: "2.55x" 
    }
];

const MOCK_INVESTED_DATA = [
    { 
        id: 1,
        name: "Vantech AI",
        date: "30.06.21",
        duration: "3 yrs",
        cost: "8 000 000",
        exit_value: "20 000 000",
        dividends: "-",
        irr: "18.40%",
        moic: "2.50x",
        exitDate: "07.08.26"
    },
    { 
        id: 2,
        name: "Alyra BioTech",
        date: "30.06.22",
        duration: "2 yrs",
        cost: "7 000 000",
        exit_value: "10 500 000",
        dividends: "100000",
        irr: "10.10%",
        moic: "1.51x",
        exitDate: "07.08.27"
    },
    { 
        id: 3,
        name: "NeoGrid",
        date: "30.06.23",
        duration: "1 yr",
        cost: "9 000 000",
        exit_value: "18 000 000",
        dividends: "-",
        irr: "22.00%",
        moic: "2.02x",
        exitDate: "07.08.28"
    },
    { 
        id: 4,
        name: "Medisis",
        date: "30.06.24",
        duration: "0 yrs",
        cost: "10 000 000",
        exit_value: "30 000 000",
        dividends: "-",
        irr: "30.00%",
        moic: "3.00x",
        exitDate: "07.08.29"
    }
];

const MOCK_PROJECTED_DATA = [
    { 
        id: 1,
        name: "Solenix...",
        date: "", 
        duration: "-", 
        cost: "8 000 000",
        exit_value: "16 000 000",
        dividends: "150 000",
        irr: "12.45%",
        moic: "2.00x",
        exitDate: "07.08.25"
        // implicitly isNew: undefined (falsy)
    }
];

function Portfolio({ scenarioId }) {
    const [activeMode, setActiveMode] = useState(null);
    const [isTargetModalOpen, setIsTargetModalOpen] = useState(false);
    const [targetData, setTargetData] = useState(null);

    const handleToggle = (mode) => {
        setActiveMode(prev => prev === mode ? null : mode);
    };

    const handleOpenTargetModal = () => setIsTargetModalOpen(true);
    const handleCloseTargetModal = () => setIsTargetModalOpen(false);

    const handleSaveTargetData = (data) => {
        setTargetData(data);
        setIsTargetModalOpen(false);
    };

    return (
        <div className="portfolio-tab-container">
            {/* === TOGGLE CONTROLS SECTION === */}
            <div className="portfolio-controls-header">
                <div className="control-toggles-group">
                    <div className="toggle-group" onClick={() => handleToggle('sensitivity')}>
                        <div className={`toggle-track ${activeMode === 'sensitivity' ? 'active' : ''}`}>
                            <div className="toggle-knob"></div>
                        </div>
                        <span className="toggle-label">Sensitivity table</span>
                    </div>

                    <div className="toggle-group" onClick={() => handleToggle('target')}>
                        <div className={`toggle-track ${activeMode === 'target' ? 'active' : ''}`}>
                            <div className="toggle-knob"></div>
                        </div>
                        <span className="toggle-label">Target mode</span>
                    </div>
                </div>

                {activeMode === 'target' && (
                    <button className="destructive-btn-md" onClick={handleOpenTargetModal}>
                        <span>Choose a Target</span> 
                    </button>
                )}
            </div>

            <RealizedPortfolio realizedData={DEFAULT_REALIZED_DATA} />

            <InvestedPortfolio 
                activeMode={activeMode}
                investedData={MOCK_INVESTED_DATA} 
            />

            <ProjectedPortfolio
                activeMode={activeMode}
                projectedData={MOCK_PROJECTED_DATA} 
            />

            <TargetSelectionModal 
                isOpen={isTargetModalOpen}
                onClose={handleCloseTargetModal}
                onSave={handleSaveTargetData}
            />
        </div>
    );
}

export default Portfolio;