import React from 'react';
import SynthesisCards from './Cards/Cards'; // Updated import path
import './SynthesisList.css';

function SynthesisList({ title, syntheses, onDelete }) {
  return (
    <div className="synthesis-list-section">
      
      {/* Header */}
      <div className="synthesis-list-header">
        <span className="synthesis-list-title">{title}</span>
        <span className="synthesis-list-count">{syntheses.length}</span>
      </div>

      {/* Grid */}
      <div className="synthesis-list-grid">
        {syntheses.map(synth => (
          <SynthesisCards
            key={synth.id}
            id={synth.id}
            fundId={synth.fundId}
            title={synth.title}
            author={synth.author}
            createdDate={synth.createdDate}
            links={synth.links}
            description={synth.description}
            onDelete={onDelete}
          />
        ))}
      </div>
      
    </div>
  );
}

export default SynthesisList;