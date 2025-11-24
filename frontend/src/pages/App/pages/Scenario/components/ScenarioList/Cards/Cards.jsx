import React from 'react';
import { Link } from 'react-router-dom';
import { MoreVerticalIcon, ArrowRightIcon } from '../Icons'; 
import './Cards.css';

function ScenarioCard({ id, fundId, title, author, createdDate, isSelected, onToggle }) {
  return (
    <div className={`scenario-card ${isSelected ? 'selected-card' : ''}`}>
      
      {/* LEFT FRAME: Checkbox + Text */}
      <div className="card-left-frame">
        <div 
           className={`card-checkbox ${isSelected ? 'checked' : ''}`} 
           onClick={onToggle}
        >
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
        
        {/* === UPDATE HERE: Pass data via state === */}
        <Link 
          to={id.toString()} 
          className="card-join-btn"
          state={{ 
            title, 
            author, 
            date: createdDate, // Remapping 'createdDate' to 'date' to match Detail Page expectation
            description: "Description passed from card..." // Pass description if available in props
          }}
        >
          <span>Join</span>
          <ArrowRightIcon />
        </Link>
      </div>

    </div>
  );
}

export default ScenarioCard;