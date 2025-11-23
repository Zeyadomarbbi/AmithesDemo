import React from 'react';
import { Link } from 'react-router-dom';
// Ensure these icons are imported from your Icons file
import { MoreVerticalIcon, ArrowRightIcon } from './Icons';

function ScenarioCard({ id, title, author, createdDate }) {
  return (
    <Link to={id.toString()} className="scenario-card-link">
      <div className="scenario-card">
        
        {/* Left Frame: Checkbox + Texts */}
        <div className="card-left-frame">
          <div className="card-checkbox"></div>
          
          <div className="card-text-frame">
            {/* Title sits alone */}
            <h3 className="card-title" title={title}>{title}</h3>
            
            {/* Group Date and Author together for tight 1px spacing */}
            <div className="card-text-group">
              <p className="card-date">Created on {createdDate}</p>
              <p className="card-author">By {author}</p>
            </div>
          </div>
        </div>

        {/* Right Frame: Menu + Button */}
        <div className="card-right-frame">
          <div className="card-menu-icon" onClick={(e) => e.preventDefault()}>
             <MoreVerticalIcon />
          </div>
          
          <div className="card-join-btn">
            <span>Join</span>
            <ArrowRightIcon />
          </div>
        </div>

      </div>
    </Link>
  );
}

export default ScenarioCard;