import React from 'react';
import { CloseIcon, ChevronDoubleLeftIcon } from '../../../Icons'; 
import './EditPanelHeader.css';

function EditPanelHeader({ onClose }) {
  return (
    <div className="panel-header-wrapper">
      <div className="header-top-bar">
        <div className="featured-icon-box">
          <ChevronDoubleLeftIcon width={20} color="#375A89" />
        </div>
        <button className="panel-close-btn" onClick={onClose}>
          <CloseIcon width={16} color="#375A89" />
        </button>
      </div>

      <div className="header-text-group">
        <div className="ht-title-row">
          <h2 className="panel-title">Edit Admin</h2>
        </div>
        <p className="panel-description">
          Update the administrator's information below.
        </p>
      </div>
    </div>
  );
}
export default EditPanelHeader;