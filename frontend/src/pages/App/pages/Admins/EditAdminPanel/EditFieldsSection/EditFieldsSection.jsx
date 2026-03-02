import React from 'react';
import { useUsers } from '../../../../hooks/Core/useUsers'; 
import './EditFieldsSection.css';

function EditFieldsSection({ formData, onChange, userId, onClose, isEditMode }) {
  const { deleteUser, isLoading: isDeleting } = useUsers();
  const handleRoleChange = (e) => {
    const value = e.target.value;
    if (value === 'superadmin') {
      onChange('is_superuser', true);
      onChange('is_staff', true);
    } else if (value === 'admin') {
      onChange('is_superuser', false);
      onChange('is_staff', true);
    } else {
      onChange('is_superuser', false);
      onChange('is_staff', false);
    }
  };

  const getRoleValue = () => {
    if (formData.is_superuser) return 'superadmin';
    if (formData.is_staff) return 'admin';
    return 'viewer';
  };

  const handleDelete = async () => {
    if (window.confirm("Are you sure you want to delete this user? This action cannot be undone.")) {
      try {
        await deleteUser(userId);
        onClose(); 
      } catch (err) {
        alert("Failed to delete user: " + err.message);
      }
    }
  };

  return (
    <div className="panel-fields-container">
      {/* Conditionally show Username/Password for New Users only */}
      {!isEditMode && (
        <div className="fields-row-frame">
          <div className="text-field-wrapper">
            <label className="field-label">Username*</label>
            <div className="input-box">
              <input 
                type="text" 
                className="text-input" 
                value={formData.username || ''} 
                onChange={(e) => onChange('username', e.target.value)}
              />
            </div>
          </div>
          <div className="text-field-wrapper">
            <label className="field-label">Password*</label>
            <div className="input-box">
              <input 
                type="password" 
                className="text-input" 
                value={formData.password || ''} 
                onChange={(e) => onChange('password', e.target.value)}
              />
            </div>
          </div>
        </div>
      )}
      {/* Row 1: Names */}
      <div className="fields-row-frame">
        <div className="text-field-wrapper">
          <div className="input-with-label">
            <label className="field-label">First Name*</label>
            <div className="input-box">
              <input 
                type="text" 
                className="text-input" 
                value={formData.first_name || ''} 
                onChange={(e) => onChange('first_name', e.target.value)}
              />
            </div>
          </div>
        </div>
        <div className="text-field-wrapper">
          <div className="input-with-label">
            <label className="field-label">Last Name*</label>
            <div className="input-box">
              <input 
                type="text" 
                className="text-input" 
                value={formData.last_name || ''} 
                onChange={(e) => onChange('last_name', e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Row 2: Email & Status Dropdown */}
      <div className="fields-row-frame">
        <div className="text-field-wrapper">
          <div className="input-with-label">
            <label className="field-label">Email*</label>
            <div className="input-box">
              <input 
                type="email" 
                className="text-input" 
                value={formData.email || ''} 
                onChange={(e) => onChange('email', e.target.value)}
              />
            </div>
          </div>
        </div>
        
        <div className="text-field-wrapper">
          <div className="input-with-label">
            <label className="field-label">Status*</label>
            <div className="input-box dropdown">
              <select 
                className="select-input"
                value={formData.is_active ? "true" : "false"}
                onChange={(e) => onChange('is_active', e.target.value === "true")}
              >
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
              <div className="chevron-icon">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#375A89" strokeWidth="2"><polyline points="6 9 12 15 18 9"></polyline></svg>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Row 3: Role Dropdown */}
      <div className="fields-row-frame">
        <div className="text-field-wrapper full-width">
          <div className="input-with-label">
            <label className="field-label">Role</label>
            <div className="input-box dropdown">
              <select 
                className="select-input"
                value={getRoleValue()}
                onChange={handleRoleChange}
              >
                <option value="superadmin">Super Admin</option>
                <option value="admin">Admin</option>
                <option value="viewer">Viewer</option>
              </select>
              <div className="chevron-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#375A89" strokeWidth="2"><polyline points="6 9 12 15 18 9"></polyline></svg>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Button */}
      {isEditMode && (
        <div className="destructive-action-row">
           <button 
            className="destructive-btn" 
            onClick={handleDelete}
           >
             <span>Delete User</span>
           </button>
        </div>
      )}

    </div>
  );
}

export default EditFieldsSection;