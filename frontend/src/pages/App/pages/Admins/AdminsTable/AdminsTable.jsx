import React, { useState } from 'react';
import { SortIcon, MoreHorizontalIcon } from '../Icons'; 
import EditAdminPanel from './EditAdminPanel/EditAdminPanel'; 
import './AdminsTable.css';

function AdminsTable({ data }) {
  const [selectedAdmin, setSelectedAdmin] = useState(null);

  return (
    <>
      <div className="admins-table-container">
        {/* Table Header */}
        <div className="admins-table-header">
          <div className="cell col-checkbox"><input type="checkbox" /></div>
          <div className="cell col-name header-cell"><span>Name</span><SortIcon width={16} /></div>
          <div className="cell col-role header-cell"><span>Role</span><SortIcon width={16} /></div>
          <div className="cell col-email header-cell"><span>Email</span><SortIcon width={16} /></div>
          <div className="cell col-status header-cell"><span>Status</span><SortIcon width={16} /></div>
          <div className="cell col-actions"></div>
        </div>

        {/* Table Body */}
        <div className="admins-table-body">
          {data.map((admin) => (
            <div 
              key={admin.id} 
              className="admins-table-row"
              // Removed onClick from the whole row
            >
              <div className="cell col-checkbox">
                <input type="checkbox" />
              </div>
              
              <div className="cell col-name">
                <div className="name-group">
                  <span className="row-text-primary">{admin.firstName} {admin.lastName}</span>
                  <span className="row-text-secondary">{admin.handle}</span>
                </div>
              </div>

              <div className="cell col-role">
                <div className={`badge badge-${admin.roleType}`}>{admin.role}</div>
              </div>

              <div className="cell col-email">
                <span className="row-text-primary">{admin.email}</span>
              </div>

              <div className="cell col-status">
                <div className={`badge badge-${admin.statusType}`}>{admin.status}</div>
              </div>

              <div className="cell col-actions">
                {/* onClick moved here specifically */}
                <div 
                  className="action-dots" 
                  onClick={() => setSelectedAdmin(admin)}
                >
                   <MoreHorizontalIcon width={20} color="#375A89" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* === EDIT PANEL === */}
      <EditAdminPanel 
        isOpen={!!selectedAdmin} 
        userData={selectedAdmin}
        onClose={() => setSelectedAdmin(null)}
      />
    </>
  );
}

export default AdminsTable;