import React from 'react';
import ScenarioCard from './ScenarioCard';
import './ScenarioList.css';

function ScenarioList({ title, scenarios }) {
  return (
    <div className="scenario-list-section">
      
      {/* --- FRAME 1: Header --- */}
      <div className="list-header">
        <span className="list-title">{title}</span>
        <span className="list-count">{scenarios.length}</span>
      </div>

      {/* --- FRAME 2: Grid --- */}
      <div className="scenario-list-grid">
        {scenarios.map(scenario => (
          <ScenarioCard
            key={scenario.id}
            id={scenario.id}
            title={scenario.title}
            author={scenario.author}
            createdDate={scenario.createdDate}
          />
        ))}
      </div>
      
    </div>
  );
}

export default ScenarioList;