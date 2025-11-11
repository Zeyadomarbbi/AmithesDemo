import React from 'react';
import SynthesisCard from './SynthesisCard'; // 1. Import the card
import './SynthesisList.css'; // 2. Import the CSS

// This component receives 'title' and 'syntheses' as props
function SynthesisList({ title, syntheses }) {
  return (
    <section className="synthesis-list-section">
      {/* Section Header */}
      <h2>{title} ({syntheses.length})</h2>

      {/* Grid of cards */}
      <div className="synthesis-list-grid">
        {/* 3. Map over the data and render cards */}
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
    </section>
  );
}

export default SynthesisList;