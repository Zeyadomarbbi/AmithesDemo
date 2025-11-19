import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
// import axios from 'axios';
import './ScenarioDetailPage.css'; // We'll create this CSS file

function ScenarioDetailPage() {
  // Read both dynamic IDs from the URL
  const { fundId, scenarioId } = useParams();

  // State to hold the specific scenario's data
  const [scenario, setScenario] = useState(null);
  const [activeTab, setActiveTab] = useState('portfolio');

  // This hook fetches the specific scenario data when the component loads
  useEffect(() => {
    console.log(`Fetching data for Fund ID: ${fundId}, Scenario ID: ${scenarioId}`);
    
    // --- REAL API CALL (example) ---
    // axios.get(`/api/funds/${fundId}/scenarios/${scenarioId}/`)
    //   .then(response => {
    //     setScenario(response.data);
    //   })
    //   .catch(error => console.error("Error fetching scenario:", error));

    // --- SIMULATED API CALL (for now) ---
    setScenario({
      name: 'Scenario optimistic',
      createdDate: '19.03.24',
      author: 'Mathieu Rigot',
      comment: 'For Quarter commity',
    });

  }, [fundId, scenarioId]); // Re-run if either ID changes

  // Show a loading state until the data is fetched
  if (!scenario) {
    return <div>Loading scenario...</div>;
  }

  return (
    <div className="scenario-detail-page">
      
      {/* 1. Header Section */}
      <div className="detail-header">
        {/* The "Back" link points to the specific fund's scenario list */}
        <Link to={`/funds/${fundId}/scenarios`} className="back-link">
          &larr; Back
        </Link>
        <div className="detail-title">
          <h1>{scenario.name}</h1>
          <p>
            Created on: {scenario.createdDate} by {scenario.author}
            <span>{scenario.comment}</span>
          </p>
        </div>
      </div>

      {/* 2. Tab Navigation */}
      <nav className="detail-tabs">
        <button 
          className={activeTab === 'portfolio' ? 'active' : ''}
          onClick={() => setActiveTab('portfolio')}
        >
          Portfolio
        </button>
        <button 
          className={activeTab === 'financials' ? 'active' : ''}
          onClick={() => setActiveTab('financials')}
        >
          Set financials
        </button>
        <button 
          className={activeTab === 'flows' ? 'active' : ''}
          onClick={() => setActiveTab('flows')}
        >
          Fund flows
        </button>
      </nav>

      {/* 3. Main Content Area */}
      <div className="detail-content">
        {/* This is where you'll show the correct content based on the active tab.
          You'll build these table components next.
        */}
        {activeTab === 'portfolio' && (
          <div>
            {/* <PortfolioTable /> Component will go here */}
            <h3>Realized portfolio (Table)</h3>
            <h3>Invested portfolio (Table)</h3>
          </div>
        )}
        {activeTab === 'financials' && (
          <div><h3>Financials Tab Content</h3></div>
        )}
        {activeTab === 'flows' && (
          <div><h3>Fund Flows Tab Content</h3></div>
        )}
      </div>

      {/* 4. Simulation Results (Side Panel) */}
      <aside className="simulation-results">
        <h3>Simulation Results</h3>
        {/* The content from the right-side panel goes here */}
      </aside>

    </div>
  );
}

export default ScenarioDetailPage;