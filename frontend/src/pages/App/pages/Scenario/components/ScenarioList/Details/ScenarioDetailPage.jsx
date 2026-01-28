import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom'; // 1. Import useLocation

import Header from './components/Header/Header';
import Portfolio from './components/Portfolio/Portfolio'; 
import SetFinancials from './components/SetFinanacials/SetFinancials'; 
import FundFlows from './components/FundFlows/FundFlows'; 
import SimulationResults from './components/SimulationResults/SimulationResults';
import './ScenarioDetailPage.css';

function ScenarioDetailPage() {
  const { fundId, scenarioId, tab } = useParams();
  const navigate = useNavigate();
  const location = useLocation(); // 2. Get location object

  // 3. Initialize state with data passed from card (if valid), otherwise null
  const [scenarioData, setScenarioData] = useState(location.state || null);
  
  const [isClosing, setIsClosing] = useState(false);
  const currentTab = tab ? tab.toLowerCase() : 'simulationresults';

  const handleBack = () => {
    setIsClosing(true);
    setTimeout(() => {
      navigate(`/funds/${fundId}/scenario-dashboard`);
    }, 800);
  };

  if (!scenarioData) return <div className="loading-state">Loading...</div>;

  return (
    <div className={`detail-page-overlay ${isClosing ? 'closing' : ''}`}>
      <div className="scenario-header-page">
        <Header 
          fundId={fundId}
          scenarioId={scenarioId}
          title={scenarioData.title}
          author={scenarioData.author}
          date={scenarioData.date}
          description={scenarioData.description || "No description available"} 
          activeTab={currentTab}
          onBack={handleBack}
        />
        <div className="scenarios-details-content-area">
          {currentTab === 'simulation-results' && <SimulationResults scenarioId={scenarioId} />}
          {currentTab === 'portfolio' && <Portfolio scenarioId={scenarioId} />}
          {currentTab === 'set-financials' && <SetFinancials scenarioId={scenarioId} />}
          {currentTab === 'fund-flows' && <FundFlows scenarioId={scenarioId} />}
        </div>
      </div>
    </div>
  );
}

export default ScenarioDetailPage;