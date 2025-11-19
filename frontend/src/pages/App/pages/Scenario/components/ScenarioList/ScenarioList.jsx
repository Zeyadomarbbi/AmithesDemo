import React from 'react';
import ScenarioCard from './ScenarioCard'; // Import the card
import './ScenarioList.css'; // Import the styles

// The 'title' and 'scenarios' props are passed from ScenariosPage
function ScenarioList({ title, scenarios }) {
  return (
    <section className="scenario-list-section">
      {/* The Section Header */}
      <h2>{title} ({scenarios.length})</h2>

      {/* The grid/list of cards */}
      <div className="scenario-list-grid">
        {/* Loop over the scenarios array and render a card for each one */}
        {scenarios.map(scenario => (
          <ScenarioCard
            key={scenario.id} // React needs a unique key
            id={scenario.id}   // Pass the ID for the link
            title={scenario.title}
            author={scenario.author}
            createdDate={scenario.createdDate}
          />
        ))}
      </div>
    </section>
  );
}

export default ScenarioList;