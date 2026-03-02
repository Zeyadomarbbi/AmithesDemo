import React, { useState } from 'react';
import SearchBar from '../../../../../components/SearchBar/SearchBar'
import { PlusIcon } from '../Icons'; 
import EditAdminPanel from '../EditAdminPanel/EditAdminPanel'; 
import './AdminsHeader.css';

function AdminsHeader({ onSearch, refreshData }) {
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

      <EditAdminPanel 
        isOpen={isAddPanelOpen} 
        onClose={() => setIsAddPanelOpen(false)} 
        userData={null} 
        onSuccess={refreshData} /* Execute parent fetch on success */
      />
    </div>
  );
}

export default AdminsHeader;