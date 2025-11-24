// in: frontend/src/pages/Scenario/AddNewScenarioModal.jsx

import React from 'react';
import Button from '../../../../../../../components/Button';
import './AddNewScenarioModal.css';
import { CloseIcon } from '../Icons'; 

// 'onClose' is a function we will pass from ScenariosPage
function AddNewScenarioModal({ onClose }) {
  return (
    <div className="modal-overlay-add-scenario" onClick={onClose}>
      {/* Modal Content: Fixed 360px Width */}
      <div className="modal-content-add-scenario" onClick={e => e.stopPropagation()}>
        
        {/* Header Frame (Close Btn) */}
        <div className="modal-header-frame">
          <div className="close-btn-wrapper" onClick={onClose}>
            <CloseIcon />
          </div>
        </div>

        {/* --- FRAME 1000007577 (Main Container) --- */}
        <div className="frame-main">
          
          {/* --- FRAME 1261155204 (Body: Title + Inputs) --- */}
          <div className="frame-body">
            
            {/* Title */}
            <div className="modal-title-frame">
              <h2 className="modal-title-add-scenario">Add a new scenario</h2>
            </div>

            {/* Inputs Container */}
            <div className="modal-inputs-frame">
              <div className="input-group">
                <label className="input-label">Name *</label>
                <input type="text" className="input-field" placeholder="placeholder" />
              </div>
              
              <div className="input-group">
                <label className="input-label">Description *</label>
                <textarea className="textarea-field" placeholder="placeholder" />
              </div>
            </div>
            
          </div>

          {/* --- FRAME 1261155202 (Footer Buttons) --- */}
          <div className="modal-footer-frame">
            <button className="btn-cancel" onClick={onClose}>
              Cancel
            </button>
            <button className="btn-save">
              Save
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}

export default AddNewScenarioModal;