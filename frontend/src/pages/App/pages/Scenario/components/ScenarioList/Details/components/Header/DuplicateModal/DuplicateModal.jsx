import React from 'react';
import { CloseIcon } from '/src/components/Icons/InteractiveIcons';

import './DuplicateModal.css'; 

function DuplicateModal({ isOpen, onClose, onSave, currentTitle }) {
  if (!isOpen) return null;

  return (
    <div className="dup-modal-overlay">
      <div className="dup-modal-container">
        
        {/* Close Row */}
        <div className="dup-modal-close-row">
          <button className="dup-close-btn" onClick={onClose}>
             <CloseIcon width={20} color="#375A89" />
          </button>
        </div>

        {/* Content */}
        <div className="dup-modal-content">
          <div className="dup-header-group">
            <span className="dup-title">Duplicate as a new scenario</span>
            
            <div className="dup-inputs-group">
              <div className="dup-input-field">
                <label>New Name</label>
                <div className="dup-input-wrapper">
                  <input type="text" defaultValue={`${currentTitle} (Copy)`} />
                </div>
              </div>

              <div className="dup-input-field">
                <label>New Description</label>
                <div className="dup-input-wrapper textarea">
                  <textarea placeholder="Enter description" />
                </div>
              </div>
            </div>
          </div>

          <div className="dup-footer">
            <button className="dup-btn cancel" onClick={onClose}>Cancel</button>
            <button className="dup-btn save" onClick={onSave}>Save</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DuplicateModal;