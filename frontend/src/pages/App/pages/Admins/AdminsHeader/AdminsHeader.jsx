import React, { useState } from 'react';
import SearchBar from '../../../../../components/SearchBar/SearchBar'
import { PlusIcon } from '../Icons'; 
import EditAdminPanel from '../EditAdminPanel/EditAdminPanel'; // Use the Edit panel
import './AdminsHeader.css';

function AdminsHeader({ onSearch }) {
  const [isAddPanelOpen, setIsAddPanelOpen] = useState(false);

  return (
    <div className="admins-header-wrapper">
      <h1 className="admins-page-title">Admins</h1>

      <div className="admins-toolbar">
        <SearchBar
          placeholder="Search users..."
          className="search-input"
          onSearch={onSearch}
        />

        <button 
          className="btn-add-admin" 
          onClick={() => setIsAddPanelOpen(true)}
        >
          <PlusIcon width={16} />
          <span>New User</span>
        </button>
      </div>

      {/* When userData is null, it acts as a Creation panel */}
      <EditAdminPanel 
        isOpen={isAddPanelOpen} 
        onClose={() => setIsAddPanelOpen(false)} 
        userData={null} 
      />
    </div>
  );
}

export default AdminsHeader;