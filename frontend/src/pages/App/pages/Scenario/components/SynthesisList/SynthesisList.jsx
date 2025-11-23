import React from 'react';
import SynthesisCard from './SynthesisCard';
import './SynthesisList.css';

function SynthesisList({ title, syntheses }) {
  return (
    <div className="synthesis-list-section">
      
      {/* Header */}
      <div className="list-header">
        <span className="list-title">{title}</span>
        <span className="list-count">{syntheses.length}</span>
      </div>

      {/* Grid */}
      <div className="synthesis-list-grid">
        {syntheses.map(synth => (
          <SynthesisCard
            key={synth.id}
            title={synth.title}
            author={synth.author}
            createdDate={synth.createdDate}
            links={synth.links}
          />
        ))}
      </div>
      
    </div>
  );
}

export default SynthesisList;