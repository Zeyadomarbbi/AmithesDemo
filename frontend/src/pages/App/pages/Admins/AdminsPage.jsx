import React, { useState, useEffect } from 'react';
import AdminsHeader from './AdminsHeader/AdminsHeader';
import AdminsTable from './AdminsTable/AdminsTable';
import { useUsers } from '../../hooks/Core/useUsers';
import './AdminsPage.css';

function AdminsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const { users, isLoading, fetchUsers } = useUsers();
  
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const safeVal = (val) => (val === null || val === undefined || val === '' ? '-' : val);

  const filteredAdmins = users
    .map(user => ({
      ...user,
      firstName: safeVal(user.firstName),
      lastName: safeVal(user.lastName),
      handle: safeVal(user.handle),
      email: safeVal(user.email),
      role: safeVal(user.role),
      status: safeVal(user.status),
      dateJoined: safeVal(user.dateJoined)
    }))
    .filter(admin => {
      const q = searchQuery.toLowerCase();
      return (
        admin.firstName.toLowerCase().includes(q) ||
        admin.lastName.toLowerCase().includes(q) ||
        admin.handle.toLowerCase().includes(q) ||
        admin.role.toLowerCase().includes(q) ||
        admin.email.toLowerCase().includes(q) ||
        admin.status.toLowerCase().includes(q)
      );
    });

  return (
    <div className="admins-container">
      {/* Pass fetchUsers as refreshData */}
      <AdminsHeader onSearch={setSearchQuery} refreshData={fetchUsers} />

      {isLoading ? (
        <div className="loading-overlay">
          <span>Loading authenticated users...</span>
        </div>
      ) : (
        <AdminsTable data={filteredAdmins} refreshData={fetchUsers} />
      )}
    </div>
  );
}

export default AdminsPage;