import React from 'react';
import './AddNewScenarioModal.css';
import { CloseIcon } from '../Icons'; 

function AddNewScenarioModal({ onClose }) {
  return (
    <div className="modal-overlay-add-scenario" onClick={onClose}>
      
      <div className="modal-content-add-scenario" onClick={e => e.stopPropagation()}>
        
        {/* --- HEADER: Title Left, Close Right --- */}
        <div className="modal-header">
          <h2 className="modal-title-add-scenario">Add a new scenario</h2>
          <div className="close-btn-wrapper" onClick={onClose}>
            <CloseIcon />
          </div>
        </div>

        {/* --- BODY: Inputs --- */}
        <div className="modal-body">
          <div className="input-group">
            <label className="input-label">Name *</label>
            <input type="text" className="input-field" placeholder="placeholder" />
          </div>
          
          <div className="input-group">
            <label className="input-label">Description *</label>
            <textarea className="textarea-field" placeholder="placeholder" />
          </div>
        </div>

        {/* --- FOOTER: Buttons --- */}
        <div className="modal-footer">
          <button className="btn-cancel" onClick={onClose}>
            Cancel
          </button>
          <button className="btn-save">
            Save
          </button>
        </div>

      </div>
    </div>
  );
}

export default AddNewScenarioModal;