// ScenarioDetailPage.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

import Header from './components/Header/Header';
import Portfolio from './components/Portfolio/Portfolio'; 
import SetFinancials from './components/SetFinanacials/SetFinancials'; 
import FundFlows from './components/FundFlows/FundFlows'; 
import { useScenarioData } from './utils/useScenarioData';

import './ScenarioDetailPage.css';

function ScenarioDetailPage() {
  const { fundId, scenarioId, tab } = useParams();
  const navigate = useNavigate();
  
  const { data: scenarioData, loading, error } = useScenarioData(fundId, scenarioId);
  const currentTab = tab ? tab.toLowerCase() : 'portfolio';
  const [isClosing, setIsClosing] = useState(false);
  
  const handleBack = () => {
    setIsClosing(true);
    setTimeout(() => {
      navigate(`/funds/${fundId}/scenario-dashboard`);
    }, 800);
  };
  
  if (loading) return <div className="loading-state">Loading...</div>;
  if (error) return <div className="error-state">Error: {error}</div>;
  
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
          {currentTab === 'portfolio' && (
            <Portfolio fundId={fundId} scenarioId={scenarioId} />
          )}
          {currentTab === 'set-financials' && (
            <SetFinancials fundId={fundId} scenarioId={scenarioId} />
          )}
          {currentTab === 'fund-flows' && (
            <FundFlows fundId={fundId} scenarioId={scenarioId} />
          )}
        </div>
      </div>
    </div>
  );
}

export default ScenarioDetailPage;