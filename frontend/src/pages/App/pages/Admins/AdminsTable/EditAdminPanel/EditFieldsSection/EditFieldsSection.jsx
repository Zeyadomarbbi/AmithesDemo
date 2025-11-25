import React from 'react';
import './EditFieldsSection.css';

function EditFieldsSection({ userData }) {
  
  // Helper for Status Colors
  const getStatusClass = (status) => {
    if (!status) return 'badge-grey';
    switch (status.toLowerCase()) {
      case 'active': return 'badge-green';
      case 'pending': return 'badge-blue';
      case 'inactive': return 'badge-grey';
      default: return 'badge-grey';
    }
  };

  // Helper for Role Colors
  const getRoleClass = (role) => {
    if (!role) return 'badge-grey';
    const r = role.toLowerCase();
    if (r === 'super admin') return 'badge-green';
    if (r === 'admin') return 'badge-blue';
    if (r === 'editor' || r === 'viewer') return 'badge-grey';
    return 'badge-grey';
  };

  return (
    <div className="panel-fields-container">
      
      {/* Row 1 */}
      <div className="fields-row-frame">
        <div className="text-field-wrapper">
          <div className="input-with-label">
            <label className="field-label">First Name*</label>
            <div className="input-box">
              <input type="text" className="text-input" defaultValue={userData?.firstName} />
            </div>
          </div>
        </div>
        <div className="text-field-wrapper">
          <div className="input-with-label">
            <label className="field-label">Last Name*</label>
            <div className="input-box">
              <input type="text" className="text-input" defaultValue={userData?.lastName} />
            </div>
          </div>
        </div>
      </div>

      {/* Row 2 */}
      <div className="fields-row-frame">
        <div className="text-field-wrapper">
          <div className="input-with-label">
            <label className="field-label">Email*</label>
            <div className="input-box">
              <input type="email" className="text-input" defaultValue={userData?.email} />
            </div>
          </div>
        </div>
        
        <div className="text-field-wrapper">
          <div className="input-with-label">
            <label className="field-label">Status*</label>
            <div className="input-box dropdown">
              <div className={`badge ${getStatusClass(userData?.status)}`}>
                {userData?.status}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Row 3 - Role with Dynamic Badge */}
      <div className="fields-row-frame">
        <div className="text-field-wrapper full-width">
          <div className="input-with-label">
            <label className="field-label">Role</label>
            <div className="input-box dropdown">
              {/* Changed from plain text to Badge */}
              <div className={`badge ${getRoleClass(userData?.role)}`}>
                {userData?.role}
              </div>
              <div className="chevron-icon">
                 <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#375A89" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Button */}
      <div className="destructive-action-row">
         <button className="destructive-btn">
           <span>Delete User</span>
         </button>
      </div>

    </div>
  );
}

export default EditFieldsSection;