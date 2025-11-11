// in: frontend/src/pages/Scenario/AddNewScenarioModal.jsx

import React from 'react';
import Button from '../../../../components/Button';
import './AddNewScenarioModal.css'; // We will create this CSS file

// 'onClose' is a function we will pass from ScenariosPage
function AddNewScenarioModal({ onClose }) {
  return (
    // The background overlay
    <div className="modal-overlay" onClick={onClose}>
      
      {/* The modal content box */}
      {/* We use e.stopPropagation() to prevent clicks inside the box from closing it */}
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        
        {/* Modal Header */}
        <div className="modal-header">
          <h2>Add a new scenario</h2>
          <button className="modal-close-button" onClick={onClose}>&times;</button>
        </div>

        {/* Modal Body */}
        <div className="modal-body">
          <label htmlFor="scenario-name">Name *</label>
          <input id="scenario-name" type="text" placeholder="placeholder" />

          <label htmlFor="scenario-description">Description *</label>
          <textarea id="scenario-description" rows="4" placeholder="placeholder" />
        </div>

        {/* Modal Footer */}
        <div className="modal-footer">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button variant="primary">Save</Button>
        </div>

      </div>
    </div>
  );
}

export default AddNewScenarioModal;