import React, { useState } from 'react';
import AdminsHeader from './AdminsHeader/AdminsHeader';
import AdminsTable from './AdminsTable/AdminsTable';
import SearchBar from '../../../../components/SearchBar'
import './AdminsPage.css';

function AdminsPage() {
  const [searchQuery, setSearchQuery] = useState('');

  const adminsData = [
    { id: 1, firstName: 'X', lastName: 'Y', handle: '@XY', role: 'Admin', roleType: 'blue', email: 'xy@email.com', status: 'Active', statusType: 'green' },
    { id: 2, firstName: 'A', lastName: 'B', handle: '@AB', role: 'Editor', roleType: 'grey', email: 'ab@email.com', status: 'Pending', statusType: 'blue' },
    { id: 3, firstName: 'Nomlong', lastName: 'prénom', handle: '@nomlong', role: 'Viewer', roleType: 'grey', email: 'nomlong@email.com', status: 'Inactive', statusType: 'grey' },
    { id: 4, firstName: 'Nomlong', lastName: 'prénom', handle: '@nomlong', role: 'Super Admin', roleType: 'green', email: 'nomlong@email.com', status: 'Active', statusType: 'green' },
    { id: 5, firstName: 'Nomlong', lastName: 'prénom', handle: '@nomlong', role: 'Super Admin', roleType: 'green', email: 'nomlong@email.com', status: 'Active', statusType: 'green' },
  ]; 

  // Filter admins based on search query
  const filteredAdmins = adminsData.filter(admin => {
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
      <AdminsHeader>
        <SearchBar
          placeholder="Search"
          onSearch={setSearchQuery} // update parent state
          className="search-input"
        />
      </AdminsHeader>

      <AdminsTable data={filteredAdmins} />
    </div>
  );
}

export default AdminsPage;
