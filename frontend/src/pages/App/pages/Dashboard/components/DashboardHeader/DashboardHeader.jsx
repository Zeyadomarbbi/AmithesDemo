import React from 'react';
import './DashboardHeader.css';
import QuarterSelector from '../../../../../../components/QuarterSelection/QuarterSelector'; // Import the new component

function DashboardHeader({ fundName, showQuarterSelector, selectedQuarter, onQuarterChange }) {
  return (
    <div className="dashboard-header-frame">
      <h1 className="welcome-text">Welcome on {fundName}</h1>

      {showQuarterSelector && (
        <div className="header-actions">
           <QuarterSelector 
             selected={selectedQuarter}
             onChange={onQuarterChange}
             isSingle={true} // Set to false to test multi-select checkboxes
           />
        </div>
      )}
    </div>
  );
}

export default DashboardHeader;