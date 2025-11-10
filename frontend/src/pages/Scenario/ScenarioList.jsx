import React from 'react';

// This component receives 'title' and 'scenarios' as props
function ScenarioList({ title, scenarios }) {
  return (
    <div>
      <h2>{title} ({scenarios.length})</h2>
      {/* We will map over 'scenarios' later */}
    </div>
  );
}

export default ScenarioList;