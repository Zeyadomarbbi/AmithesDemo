import React from 'react';
import { Link } from 'react-router-dom';
// Assuming you have a ChartIcon or similar for "presentation-chart-02"
// If not, use a placeholder or add it to Icons.jsx
import { MoreVerticalIcon, DashboardIcon } from './Icons'; 

function SynthesisCard({ title, author, createdDate, links }) {
  return (
    <Link to="#" className="synthesis-card-link">
      <div className="synthesis-card">
        
        {/* Left Side: Icon + Info */}
        <div className="synth-left-frame">
          <div className="synth-icon-wrapper">
            {/* Replace with PresentationChartIcon if available */}
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

        {/* Right Side: Menu */}
        <div className="synth-right-frame">
          <div className="synth-menu-icon" onClick={(e) => e.preventDefault()}>
            <MoreVerticalIcon />
          </div>
        </div>

      </div>
    </Link>
  );
}

export default SynthesisCard;