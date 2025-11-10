import React from 'react';

// This component receives 'title' and 'syntheses' as props
function SynthesisList({ title, syntheses }) {
  return (
    <div>
      <h2>{title} ({syntheses.length})</h2>
      {/* We will map over 'syntheses' later */}
    </div>
  );
}

export default SynthesisList;