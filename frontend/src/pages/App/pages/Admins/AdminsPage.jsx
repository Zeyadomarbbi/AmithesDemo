import React from 'react';
import AdminsHeader from './AdminsHeader/AdminsHeader';
import AdminsTable from './AdminsTable/AdminsTable';
import './AdminsPage.css';

function AdminsPage() {
  // Mock Data with specific Color Logic
  const adminsData = [
    { 
      id: 1, 
      firstName: 'X', 
      lastName: 'Y', 
      handle: '@XY', 
      role: 'Admin', 
      roleType: 'blue', // Admin = Blue
      email: 'xy@email.com', 
      status: 'Active', 
      statusType: 'green' // Active = Green
    },
    { 
      id: 2, 
      firstName: 'A', 
      lastName: 'B', 
      handle: '@AB', 
      role: 'Editor', 
      roleType: 'grey', // Editor = Grey
      email: 'ab@email.com', 
      status: 'Pending', 
      statusType: 'blue' // Pending = Blue
    },
    { 
      id: 3, 
      firstName: 'Nomlong', 
      lastName: 'prénom', 
      handle: '@nomlong', 
      role: 'Viewer', 
      roleType: 'grey', // Viewer = Grey
      email: 'nomlong@email.com', 
      status: 'Inactive', 
      statusType: 'grey' // Inactive = Grey
    },
    { 
      id: 4, 
      firstName: 'Nomlong', 
      lastName: 'prénom', 
      handle: '@nomlong', 
      role: 'Super Admin', 
      roleType: 'green', // Super Admin = Green
      email: 'nomlong@email.com', 
      status: 'Active', 
      statusType: 'green' // Active = Green
    },
  ];

  return (
    <div className="admins-container">
      <AdminsHeader />
      <AdminsTable data={adminsData} />
    </div>
  );
}

export default AdminsPage;