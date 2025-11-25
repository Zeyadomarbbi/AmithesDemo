import React, { useState } from 'react';
import { 
  MoreVerticalIcon, 
  EditIcon, 
  DuplicateIcon, 
  DeleteIcon 
} from '../../../../Icons'; 

// IMPORT THE CSS HERE
import './HeaderActionsMenu.css'; 

function HeaderActionsMenu({ onEdit, onDuplicate, onDelete }) {
  const [isOpen, setIsOpen] = useState(false);

  const handleAction = (actionCallback) => {
    setIsOpen(false); 
    if (actionCallback) actionCallback();
  };

  return (
    <div className="right-actions">
      {/* Trigger Icon */}
      <div className="icon-action" onClick={() => setIsOpen(!isOpen)}>
        <MoreVerticalIcon width={24} />
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div className="header-menu-dropdown">
          
          <div className="menu-item" onClick={() => handleAction(onEdit)}>
            <div className="menu-item-content">
              <div className="menu-icon-box"><EditIcon width={16} color="#375A89" /></div>
              <span className="menu-text">Edit</span>
            </div>
          </div>

          <div className="menu-item" onClick={() => handleAction(onDuplicate)}>
            <div className="menu-item-content">
              <div className="menu-icon-box"><DuplicateIcon width={16} color="#375A89" /></div>
              <span className="menu-text">Duplicate</span>
            </div>
          </div>

          <div className="menu-item" onClick={() => handleAction(onDelete)}>
            <div className="menu-item-content">
              <div className="menu-icon-box"><DeleteIcon width={16} color="#F43F5E" /></div>
              <span className="menu-text">Delete</span>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}

export default HeaderActionsMenu;