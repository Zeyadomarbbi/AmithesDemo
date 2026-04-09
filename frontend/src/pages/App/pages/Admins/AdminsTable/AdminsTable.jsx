import React, { useState } from 'react';
import { MoreHorizontalIcon } from '/src/components/Icons/MiscIcons';
import { useTableSort, SortableHeaderRenderer } from '../../../../../components/Sort/TableSort'; // Adjust path
import AdminPanel from '../AdminPanel/AdminPanel'; 
import './AdminsTable.css';

function AdminsTable({ data, refreshData }) {
  const [selectedAdmin, setSelectedAdmin] = useState(null);

  // Define columns configuration
  const COLS = [
    { key: "firstName", label: "Name", center: false },
    { key: "role", label: "Role", center: true },
    { key: "email", label: "Email", center: true },
    { key: "status", label: "Status", center: true },
    { key: "dateJoined", label: "Date Added", center: true }, // New Column
  ];

  // Integrate Sorting Hook
  const { sorted, sortKey, toggleSort } = useTableSort(data, "firstName");

  // Helper for Date Formatting: DD Month YYYY
  const formatDate = (dateString) => {
    if (!dateString || dateString === '-') return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  };

  return (
    <>
      <div className="admins-table-container">
        <div className="admins-table-header">
          <div className="cell col-checkbox"><input type="checkbox" /></div>
          {COLS.map((c) => (
            <div key={c.key} className={`cell col-${c.key.toLowerCase()} header-cell`}>
              <SortableHeaderRenderer
                label={c.label}
                columnKey={c.key}
                currentSortKey={sortKey}
                toggleSort={toggleSort}
                center={c.center}
              />
            </div>
          ))}
          <div className="cell col-actions"></div>
        </div>

        <div className="admins-table-body">
          {sorted.map((admin) => (
            <div key={admin.id} className="admins-table-row">
              <div className="cell col-checkbox"><input type="checkbox" /></div>
              
              <div className="cell col-name">
                <span className="row-text-primary">{admin.firstName} {admin.lastName}</span>
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

              <div className="cell col-datejoined">
                <span className="row-text-primary">{formatDate(admin.dateJoined)}</span>
              </div>

              <div className="cell col-actions">
                <div className="action-dots" onClick={() => setSelectedAdmin(admin)}>
                   <MoreHorizontalIcon width={20} color="#375A89" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <AdminPanel 
        isOpen={!!selectedAdmin} 
        userData={selectedAdmin}
        onClose={() => setSelectedAdmin(null)}
        onSuccess={refreshData} /* Execute parent fetch on success */
      />
    </>
  );
}

export default AdminsTable;