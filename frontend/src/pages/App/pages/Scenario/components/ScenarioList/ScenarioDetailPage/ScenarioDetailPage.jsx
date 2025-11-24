import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import './ScenarioDetailPage.css'; 

function ScenarioDetailPage() {
  const { fundId, scenarioId } = useParams();
  const [scenario, setScenario] = useState(null);
  const [activeTab, setActiveTab] = useState('portfolio');

  useEffect(() => {
    console.log(`Fetching data for Fund ID: ${fundId}, Scenario ID: ${scenarioId}`);

    // 1. Define the same data source available in your ScenariosPage
    // (In a real app, this would be a single API call to get one specific scenario)
    const allScenarios = [
        { id: 1, fundId: 1, title: "Asterium - Optimistic", createdDate: "19.03.24", author: "Mathieu Rigot", comment: "For Quarter commity" },
        { id: 2, fundId: 1, title: "Asterium - Status Quo", createdDate: "12.04.25", author: "Yann Maurice", comment: "Standard projection" },
        { id: 3, fundId: 2, title: "Lynx - Early Exit", createdDate: "08.04.25", author: "Mathieu Rigot", comment: "Aggressive strategy" },
        { id: 4, fundId: 2, title: "Lynx - Secondary Sale", createdDate: "19.03.24", author: "Mathieu Rigot", comment: "Liquidity event" },
        { id: 5, fundId: 1, title: "Scenario Expansion Round", createdDate: "19.03.24", author: "Mathieu Rigot", comment: "Growth phase" },
        { id: 6, fundId: 1, title: "Scenario Strategic Acquisition", createdDate: "19.03.24", author: "Mathieu Rigot", comment: "M&A Target" }
    ];

    // 2. Find the specific scenario that matches the ID in the URL
    // Note: scenarioId comes from the URL as a string, so we parseInt it.
    const selectedScenario = allScenarios.find(s => s.id === parseInt(scenarioId));

    if (selectedScenario) {
        setScenario(selectedScenario);
    } else {
        console.error("Scenario not found");
    }

  }, [fundId, scenarioId]); 

  if (!scenario) {
    return <div>Loading scenario... (or Scenario not found)</div>;
  }

  return (
    <div className="scenario-detail-page">
      
      {/* Header Section */}
      <div className="detail-header">
        <Link to={`/funds/${fundId}/scenarios`} className="back-link">
          &larr; Back
        </Link>
        <div className="detail-title">
          {/* Note: I changed scenario.name to scenario.title to match your data structure */}
          <h1>{scenario.title}</h1> 
          <p>
            Created on: {scenario.createdDate} by {scenario.author}
            {scenario.comment && <span> • {scenario.comment}</span>}
          </p>
        </div>
      </div>

      {/* Tab Navigation */}
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

      {/* Main Content Area */}
      <div className="detail-content">
        {activeTab === 'portfolio' && (
          <div>
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

      {/* Side Panel */}
      <aside className="simulation-results">
        <h3>Simulation Results</h3>
      </aside>

    </div>
  );
}

export default ScenarioDetailPage;