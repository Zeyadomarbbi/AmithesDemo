import React, { useState } from 'react';
import { SearchIcon, PlusIcon } from '../Icons'; 
import AddAdminPanel from './AddAdminPanel/AddAdminPanel'; // Import Panel here
import './AdminsHeader.css';

function AdminsHeader() {
  const [isAddPanelOpen, setIsAddPanelOpen] = useState(false);

  return (
    <div className="admins-header-wrapper">
      {/* Title */}
      <h1 className="admins-page-title">Admins</h1>

      {/* Toolbar */}
      <div className="admins-toolbar">
        {/* Search Bar */}
        <div className="search-bar-wrapper">
          <div className="search-icon-box">
            <SearchIcon width={16} />
          </div>
          <input 
            type="text" 
            className="search-input" 
            placeholder="Search" 
          />
        </div>

        {/* Add Button */}
        <button 
          className="btn-add-admin" 
          onClick={() => setIsAddPanelOpen(true)}
        >
          <PlusIcon width={16} />
          <span>New User</span>
        </button>
      </div>

      <AddAdminPanel 
        isOpen={isAddPanelOpen} 
        onClose={() => setIsAddPanelOpen(false)} 
      />
    </div>
  );
}

export default AdminsHeader;