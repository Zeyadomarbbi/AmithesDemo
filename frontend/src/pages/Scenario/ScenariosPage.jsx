// in: frontend/src/pages/Scenario/ScenariosPage.jsx

// 1. Import useState, useEffect (for data) and useParams (for URL)
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
// import axios from 'axios'; // We'll use this soon

import AddNewScenarioModal from './components/AddNewScenarioModal/AddNewScenarioModal';
import ScenarioList from './components/ScenarioList/ScenarioList';
import SynthesisList from './components/SynthesisList/SynthesisList';
import Button from '../../components/Button';
import SearchBar from '../../components/SearchBar';
import './ScenariosPage.css'; 

// --- We no longer need the DUMMY_SCENARIOS here ---
// We will fetch them based on the fundId

function ScenariosPage() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    
    // 2. State to hold the data we fetch from the API
    const [scenarios, setScenarios] = useState([]);
    const [syntheses, setSyntheses] = useState([]);

    // 3. Read the dynamic ':fundId' from the URL
    const { fundId } = useParams();

    // 4. This 'useEffect' hook runs when the page loads
    //    and re-runs *every time* the 'fundId' in the URL changes.
    useEffect(() => {
      
      // This is where you will call your Django API
      console.log(`Fetching scenarios for fund ID: ${fundId}`);
      
      // --- REAL API CALL (example) ---
      // axios.get(`/api/funds/${fundId}/scenarios/`)
      //   .then(response => {
      //     setScenarios(response.data.scenarios);
      //     setSyntheses(response.data.syntheses);
      //   })
      //   .catch(error => console.error("Error fetching data:", error));

      // --- SIMULATED API CALL (using dummy data for now) ---
      // We simulate fetching by filtering a big list
      const allScenarios = [
          { id: 1, fundId: 1, title: "Asterium - Optimistic", createdDate: "19.03.24", author: "Mathieu Rigot" },
          { id: 2, fundId: 1, title: "Asterium - Status Quo", createdDate: "12.04.25", author: "Yann Maurice" },
          { id: 3, fundId: 2, title: "Lynx - Early Exit", createdDate: "08.04.25", author: "Mathieu Rigot" },
          { id: 4, fundId: 2, title: "Lynx - Secondary Sale", createdDate: "19.03.24", author: "Mathieu Rigot" }
      ];
      const allSyntheses = [
          { id: 1, fundId: 1, title: "Asterium - Exit Review", author: "Yann Maurice", links: ["..."] },
          { id: 2, fundId: 2, title: "Lynx - Q2 Pitch", author: "Yann Maurice", links: ["..."] }
      ];

      // Convert fundId from string (in URL) to number for filtering
      const currentFundId = parseInt(fundId); 
      setScenarios(allScenarios.filter(s => s.fundId === currentFundId));
      setSyntheses(allSyntheses.filter(s => s.fundId === currentFundId));
      
    }, [fundId]); // The [fundId] dependency array is crucial.

    const openModal = () => setIsModalOpen(true);
    const closeModal = () => setIsModalOpen(false);

    return (
        <div>
            {/* Header Section (unchanged) */}
            <div className="page-header">
                <h1>Scenarios</h1>
                <div className="header-controls">
                    <SearchBar placeholder="Search by scenario..." />
                    <Button variant="primary" onClick={openModal}>
                        + Add new scenario
                    </Button>
                </div>
            </div>

            {/* 5. These components now receive the DYNAMIC data */}
            <ScenarioList
                title="List of scenario"
                scenarios={scenarios}
            />

            {/* 6. These components now receive the DYNAMIC data */}
            <SynthesisList
                title="Scenario synthesis"
                syntheses={syntheses}
            />

            {/* Modal (unchanged) */}
            {isModalOpen && <AddNewScenarioModal onClose={closeModal} />}
        </div>
    );
}

export default ScenariosPage;