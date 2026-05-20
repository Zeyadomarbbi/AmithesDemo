// ScenarioList.jsx

import React from 'react';
import ScenarioCard from './Cards/Cards'; // Updated import path
import './ScenarioList.css';

function ScenarioList({ title, scenarios, selectedIds, onToggleSelect, onDelete, onEdit, onDuplicate }) { 
    return (
        <div className="scenario-list">
            <div className="scenario-list-header">
              <span className="scenario-list-title">{title}</span>
              <span className="scenario-list-count">{scenarios.length}</span>
            </div>
            <div className="scenario-list-grid">
                {scenarios.map(scenario => (
                    <ScenarioCard
                        key={scenario.id}
                        id={scenario.id}
                        fundId={scenario.fundId}
                        title={scenario.title}
                        author={scenario.author}
                        createdDate={scenario.createdDate}
                        description={scenario.description}
                        isSelected={selectedIds.includes(scenario.id)}
                        onToggle={() => onToggleSelect(scenario.id)}
                        onDelete={onDelete}
                        onEdit={onEdit} 
                        onDuplicate={onDuplicate}
                    />
                ))}
            </div>
        </div>
    );
}

export default ScenarioList;