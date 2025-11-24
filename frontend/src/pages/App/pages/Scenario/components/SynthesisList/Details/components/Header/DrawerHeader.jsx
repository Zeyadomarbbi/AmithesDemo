import React from 'react';
import { DoubleArrowLeftIcon, MaximizeIcon } from '../../../Icons'; // Adjust path
import './DrawerHeader.css';

/* src/.../Details/components/DrawerHeader.jsx */

function DrawerHeader({ onClose, onExpand, title, subtitle }) {
  return (
    <div className="drawer-header-wrapper">
      <div className="header-content">
        
        <div className="header-icon-btn" onClick={onClose}>
          <DoubleArrowLeftIcon />
        </div>

        <div className="header-text-frame">
          <div className="header-titles-col">
            <span className="header-main-title">{title}</span>
            <span className="header-sub-title">{subtitle}</span>
          </div>
        </div>

        {/* 2. Attach click handler to Maximize Icon */}
        <div className="header-icon-btn" onClick={onExpand}>
          <MaximizeIcon />
        </div>

      </div>
      <div className="header-bottom-pad"></div>
    </div>
  );
}

export default DrawerHeader;