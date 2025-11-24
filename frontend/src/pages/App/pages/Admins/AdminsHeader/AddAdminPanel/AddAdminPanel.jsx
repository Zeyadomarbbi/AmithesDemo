import React from 'react';
import PanelHeader from './PanelHeader/PanelHeader';
import FieldsSection from './FieldsSection/FieldsSection';
import './AddAdminPanel.css';

function AddAdminPanel({ isOpen, onClose }) {
  
  return (
    <>
      {/* Backdrop */}
      <div 
        className={`panel-backdrop ${isOpen ? 'open' : ''}`} 
        onClick={onClose}
      />

      {/* Sliding Panel */}
      <div className={`admin-panel-container ${isOpen ? 'open' : ''}`}>
        
        {/* === HEADER (Includes Close Button & Content) === */}
        <PanelHeader onClose={onClose} />

        {/* === BODY === */}
        <FieldsSection />

        {/* === FOOTER === */}
        <div className="panel-footer">
          <button className="btn-panel-cancel" onClick={onClose}>Cancel</button>
          <button className="btn-panel-save">Save</button>
        </div>

      </div>
    </>
  );
}

export default AddAdminPanel;