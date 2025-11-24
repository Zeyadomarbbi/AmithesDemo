import React from 'react';
import ScenarioCard from './Cards/Cards'; // Updated import path
import './ScenarioList.css';

function ScenarioList({ title, scenarios, selectedIds, onToggleSelect }) {
  return (
    <div className="scenario-list-section">
      <div className="list-header">
        <span className="list-title">{title}</span>
        <span className="list-count">{scenarios.length}</span>
      </div>

      <div className="scenario-list-grid">
        {scenarios.map(scenario => (
          // NO LINK WRAPPER HERE. We pass the logic down.
          <ScenarioCard
            key={scenario.id}
            id={scenario.id}
            fundId={scenario.fundId} // Pass fundId for the link inside
            title={scenario.title}
            author={scenario.author}
            createdDate={scenario.createdDate}
            isSelected={selectedIds.includes(scenario.id)}
            onToggle={() => onToggleSelect(scenario.id)}
          />
        ))}
      </div>
    </div>
  );
}

export default ScenarioList;