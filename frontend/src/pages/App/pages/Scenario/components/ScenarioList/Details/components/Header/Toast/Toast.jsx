import React from 'react';
import { DoneIcon, CloseIcon } from '/src/components/Icons/InteractiveIcons';
import './Toast.css'; 

function Toast({ show, onClose }) {
  if (!show) return null;

  return (
    <div className="toast-container">
      {/* Left Section */}
      <div className="toast-left">
         <div className="toast-icon-box">
           <DoneIcon width={18} />
         </div>
         <div className="toast-text-col">
           <span className="toast-title">Scenario duplicated</span>
           <span className="toast-desc">The scenario has been created successfully</span>
         </div>
      </div>

      {/* Right Section */}
      <div className="toast-right">
        <div className="toast-close-icon" onClick={onClose}>
          <CloseIcon width={24} color="#375A89" />
        </div>
        <button className="toast-btn">View</button>
      </div>
    </div>
  );
}

export default Toast;