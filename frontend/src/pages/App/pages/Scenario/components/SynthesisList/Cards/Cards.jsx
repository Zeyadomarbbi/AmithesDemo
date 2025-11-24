import React from 'react';
import { Link } from 'react-router-dom';
import { MoreVerticalIcon, DashboardIcon } from '../Icons'; 
import './Cards.css';

// FIX: Add 'id' and 'fundId' to the destructured props here
function SynthesisCards({ id, fundId, title, author, createdDate, links }) {
  return (
    <Link to={`/funds/${fundId}/scenarios/synthesis/${id}`} className="synthesis-card-link">
      <div className="synthesis-card">
        
        <div className="synth-left-frame">
          <div className="synth-icon-wrapper">
            <DashboardIcon /> 
          </div>
          
          <div className="synth-text-frame">
            <h3 className="synth-title" title={title}>{title}</h3>
            <p className="synth-author">By {author}</p>
            <p className="synth-date">Created on {createdDate}</p>
            
            <div className="synth-links-frame">
              {links.map((link, i) => (
                <span key={i} className="synth-link-item">{link}</span>
              ))}
            </div>
          </div>
        </div>

        <div className="synth-right-frame">
          <div className="synth-menu-icon" onClick={(e) => e.preventDefault()}>
            <MoreVerticalIcon />
          </div>
        </div>

      </div>
    </Link>
  );
}

export default SynthesisCards;