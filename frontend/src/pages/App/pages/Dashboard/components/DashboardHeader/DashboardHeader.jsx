import React, { useState } from 'react';
import './DashboardHeader.css';
// Import the Chevron from your Icons file (adjust path if needed)
import { ChevronDownIcon, PlusIcon } from './Icons'; 

function DashboardHeader({ fundName, showQuarterSelector }) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedQuarter, setSelectedQuarter] = useState({ q: 'Q2', y: '2024' });

  const quarters = [
    { q: 'Q1', y: '2024', d: "08/03/24"},
    { q: 'Q2', y: '2024', d: "08/07/24"},
    { q: 'Q3', y: '2024', d: "08/15/24"},
    { q: 'Q4', y: '2024', d: "08/30/24"}
  ];

   const handleSelect = (quarter) => {
        setSelectedQuarter(quarter);
        setIsOpen(false);
   };

  return (
    <div className="dashboard-header-frame">
      <h1 className="welcome-text">Welcome on {fundName}</h1>
      
      {/* CHANGE: Always render this div, toggle visibility via style */}
      <div 
        className="quarter-selector-container" 
        style={{ visibility: showQuarterSelector ? 'visible' : 'hidden' }}
      >
        
        <div 
          className="quarter-selector-button" 
          onClick={() => showQuarterSelector && setIsOpen(!isOpen)}
        >
          <div className="quarter-text-group">
              <span className="quarter-part">{selectedQuarter.q}</span>
              <span className="year-part">{selectedQuarter.y}</span>
          </div>
          
          <div className={`quarter-icon ${isOpen ? 'open' : ''}`}>
            <ChevronDownIcon />
          </div>
        </div>

        {isOpen && (
          <div className="quarter-dropdown">
            <div className="quarter-list">
              {quarters.map((item, index) => (
                <div 
                  key={index} 
                  className={`quarter-item ${selectedQuarter.q === item.q && selectedQuarter.y === item.y ? 'selected' : ''}`}
                  onClick={() => handleSelect(item)}
                >
                  <span className="item-label">{item.q} {item.y}</span>
                  <span className="item-arrow">&rarr;</span>
                  <span className="item-date">{item.d}</span>
                </div>
              ))}
            </div>

            <div className="dropdown-divider"></div>

            <div className="dropdown-footer">
              <button className="add-timeframe-btn">
                <span className="add-icon"><PlusIcon /></span>
                <span className="add-text">Add a new timeframe</span>
              </button>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}

export default DashboardHeader;     