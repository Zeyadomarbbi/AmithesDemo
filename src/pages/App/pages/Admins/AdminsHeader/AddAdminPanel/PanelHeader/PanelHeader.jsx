import React from 'react';
import { CloseIcon, ChevronDoubleLeftIcon } from '../../../Icons'; 
import './PanelHeader.css';

function PanelHeader({ onClose }) {
  return (
    <div className="panel-header-wrapper">
      
      {/* === 1. TOP BAR (Icon Left, Close Right) === */}
      <div className="header-top-bar">
        
        {/* Left: Featured Icon */}
        <div className="featured-icon-box">
          <ChevronDoubleLeftIcon width={20} color="#375A89" />
        </div>

        {/* Right: Close Button */}
        <button className="panel-close-btn" onClick={onClose}>
          <CloseIcon width={16} color="#375A89" />
        </button>

      </div>

      {/* === 2. TEXT GROUP (Title + Desc) === */}
      <div className="header-text-group">
        
        {/* Title Row */}
        <div className="ht-title-row">
          <h2 className="panel-title">Add a new user</h2>
        </div>

        {/* Description */}
        <p className="panel-description">
          Fill in the information below to create a new user account.
        </p>

      </div>

    </div>
  );
}

export default PanelHeader;