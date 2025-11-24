import React from 'react';
import { Link } from 'react-router-dom';
import { MoreVerticalIcon, ArrowRightIcon } from './Icons'; // Adjust path as needed
import './ScenarioCard.css';

function ScenarioCard({ id, fundId, title, author, createdDate, isSelected, onToggle }) {
  return (
    // The card is now a standard DIV. We add 'selected-card' for border styling.
    <div className={`scenario-card ${isSelected ? 'selected-card' : ''}`}>
      
      {/* LEFT FRAME: Checkbox + Text */}
      <div className="card-left-frame">
        
        {/* CHECKBOX: Click here to toggle selection */}
        <div 
           className={`card-checkbox ${isSelected ? 'checked' : ''}`} 
           onClick={onToggle}
        >
           {/* Only show checkmark if selected */}
           {isSelected && <span className="checkmark">✔</span>}
        </div>
        
        <div className="card-text-frame">
          <h3 className="card-title" title={title}>{title}</h3>
          
          <div className="card-text-group">
            <p className="card-date">Created on {createdDate}</p>
            <p className="card-author">By {author}</p>
          </div>
        </div>
      </div>

      {/* RIGHT FRAME: Menu + Join Button */}
      <div className="card-right-frame">
        <div className="card-menu-icon">
             <MoreVerticalIcon />
        </div>
        
        {/* JOIN BUTTON: This is the ONLY link. Clicking here goes to details. */}
        <Link to={id.toString()} className="card-join-btn">
          <span>Join</span>
          <ArrowRightIcon />
        </Link>
      </div>

    </div>
  );
}

export default ScenarioCard;