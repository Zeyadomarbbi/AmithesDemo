import React from 'react';
import { DoubleArrowLeftIcon, MaximizeIcon } from '../../Icons'; // Adjust path
import './DrawerHeader.css';

/* src/.../Details/components/DrawerHeader.jsx */

function DrawerHeader({ onClose, title, subtitle }) { // <--- Receiving props
  return (
    <div className="drawer-header-wrapper">
      <div className="header-content">
        
        <div className="header-icon-btn" onClick={onClose}>
          <DoubleArrowLeftIcon />
        </div>

        <div className="header-text-frame">
          <div className="header-titles-col">
            {/* Using the props */}
            <span className="header-main-title">{title}</span> 
            <span className="header-sub-title">{subtitle}</span>
          </div>
        </div>

        <div className="header-icon-btn">
          <MaximizeIcon />
        </div>

      </div>
      <div className="header-bottom-pad"></div>
    </div>
  );
}

export default DrawerHeader;