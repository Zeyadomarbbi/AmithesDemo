import React from 'react';
import EditPanelHeader from './EditPanelHeader/EditPanelHeader';
import EditFieldsSection from './EditFieldsSection/EditFieldsSection';
import './EditAdminPanel.css';

function EditAdminPanel({ isOpen, onClose, userData }) {
  // REMOVED: if (!isOpen || !userData) return null; 
  // We must render the component for CSS transitions to work.

  return (
    <>
      {/* Backdrop */}
      <div 
        className={`panel-backdrop ${isOpen ? 'open' : ''}`} 
        onClick={onClose}
      />

      {/* Sliding Panel */}
      <div className={`admin-panel-container ${isOpen ? 'open' : ''}`}>
        
        <EditPanelHeader onClose={onClose} />

        {/* Pass userData (safely handles null inside the child) */}
        <EditFieldsSection userData={userData} />

        <div className="panel-footer">
          <button className="btn-panel-cancel" onClick={onClose}>Cancel</button>
          <button className="btn-panel-save">Save Changes</button>
        </div>

      </div>
    </>
  );
}

export default EditAdminPanel;