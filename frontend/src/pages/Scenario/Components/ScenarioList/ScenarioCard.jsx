// in: frontend/src/pages/Scenario/components/ScenarioList/ScenarioCard.jsx

import React from 'react';
import { Link } from 'react-router-dom';

function ScenarioCard({ id, title, author, createdDate }) {
  
  // --- THIS IS THE FIX ---
  // Change the 'to' prop from an absolute path to a relative one.
  // We convert the 'id' (which is a number) to a string.
  const relativePath = id.toString();

  return (
    // Before: <Link to={`/scenarios/${id}`} ... >
    // After:
    <Link to={relativePath} className="scenario-card-link">
      <div className="scenario-card">
        <h3>{title}</h3>
        <p>Created on: {createdDate}</p>
        <p>By: {author}</p>
        
        <div className="scenario-card-join">
          <span>Join</span> &rarr;
        </div>
      </div>
    </Link>
  );
}

export default ScenarioCard;