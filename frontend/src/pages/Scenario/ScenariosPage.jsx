// in: frontend/src/pages/Scenario/ScenariosPage.jsx

// 1. Import 'useState' from React and the new modal
import React, { useState } from 'react';
import AddNewScenarioModal from './AddNewScenarioModal'; // Import the modal

// ... (your other imports: ScenarioList, SynthesisList, Button, SearchBar)
import ScenarioList from './ScenarioList';
import SynthesisList from './SynthesisList';
import Button from '../../components/Button';
import SearchBar from '../../components/SearchBar';
import './Scenario.css';
import './Modal.css'; // 2. Import the new Modal CSS

// ... (your DUMMY_SCENARIOS and DUMMY_SYNTHESES data)
const DUMMY_SCENARIOS = [/* ... */];
const DUMMY_SYNTHESES = [/* ... */];

function ScenariosPage() {
    // 3. Add the state variable for the modal
    // 'isModalOpen' is the variable, 'setIsModalOpen' is the function to change it
    const [isModalOpen, setIsModalOpen] = useState(false);

    // 4. Create functions to open and close the modal
    const openModal = () => {
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
    };

    return (
        <div>
            {/* Header Section */}
            <div className="page-header">
                <h1>Scenarios</h1>
                <div className="header-controls">
                    <SearchBar placeholder="Search by scenario..." />
                    
                    {/* 5. Add the 'onClick' handler to your button */}
                    <Button variant="primary" onClick={openModal}>
                        + Add new scenario
                    </Button>
                </div>
            </div>

            {/* Scenario List Section */}
            <ScenarioList
                title="List of scenario"
                scenarios={DUMMY_SCENARIOS}
            />

            {/* Scenario Synthesis Section */}
            <SynthesisList
                title="Scenario synthesis"
                syntheses={DUMMY_SYNTHESES}
            />

            {/*
              6. Conditional Rendering:
              This line means: "If 'isModalOpen' is true, render the modal."
            */}
            {isModalOpen && <AddNewScenarioModal onClose={closeModal} />}

        </div>
    );
}

export default ScenariosPage;