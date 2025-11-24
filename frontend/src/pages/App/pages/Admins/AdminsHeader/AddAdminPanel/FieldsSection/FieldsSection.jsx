import React from 'react';
import './FieldsSection.css';

function FieldsSection() {
  // Default values for Add Form
  const currentStatus = 'Inactive';
  const currentRole = null; // Set to 'Admin', 'Super Admin', etc. to test colors

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
      
      {/* === ROW 1: NAMES === */}
      <div className="fields-row-frame">
        <div className="text-field-wrapper">
          <div className="input-with-label">
            <label className="field-label">First Name*</label>
            <div className="input-box">
              <input type="text" className="text-input" placeholder="Please enter the first name" />
            </div>
          </div>
        </div>

        <div className="text-field-wrapper">
          <div className="input-with-label">
            <label className="field-label">Last Name*</label>
            <div className="input-box">
              <input type="text" className="text-input" placeholder="Please enter the last name" />
            </div>
          </div>
        </div>
      </div>

      {/* === ROW 2: EMAIL & STATUS === */}
      <div className="fields-row-frame">
        <div className="text-field-wrapper">
          <div className="input-with-label">
            <label className="field-label">Email*</label>
            <div className="input-box">
              <input type="email" className="text-input" placeholder="mathieurigot@likifunds.com" />
            </div>
          </div>
        </div>

        <div className="text-field-wrapper">
          <div className="input-with-label">
            <label className="field-label">Status*</label>
            <div className="input-box dropdown">
              <div className={`badge ${getStatusClass(currentStatus)}`}>
                {currentStatus}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* === ROW 3: ROLE === */}
      <div className="fields-row-frame">
        <div className="text-field-wrapper full-width">
          <div className="input-with-label">
            <label className="field-label">Role</label>
            <div className="input-box dropdown">
              {currentRole ? (
                <div className={`badge ${getRoleClass(currentRole)}`}>
                  {currentRole}
                </div>
              ) : (
                <span className="placeholder-text">Please select a role</span>
              )}
              <div className="chevron-icon">
                 <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#375A89" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="6 9 12 15 18 9"></polyline>
                 </svg>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}

export default FieldsSection;