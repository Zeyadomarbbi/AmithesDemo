// FieldsSection.jsx
import React, { useState } from 'react';
import { useUsers } from '../../../../hooks/Core/useUsers'; 
import Prompt from '../../../../components/Toast/Prompt';
import Toast from '../../../../components/Toast/Toast';
import SimpleDropdown from '../../../../../../components/SearchBar/SimpleDropdown/SimpleDropdown';
import './FieldsSection.css';

function FieldsSection({ formData, onChange, userId, onClose, isEditMode, onSuccess }) {
  const { deleteUser, isLoading: isDeleting } = useUsers();

  const [showDeletePrompt, setShowDeletePrompt] = useState(false);
  const [toast, setToast] = useState(null);

  const handleRoleChange = (value) => {
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

  const handleDeleteConfirm = async () => {
    setShowDeletePrompt(false);
    try {
      await deleteUser(userId);
      setToast({
        type:    'success',
        title:   'User deleted',
        message: 'The user has been permanently removed.',
      });
      if (onSuccess) onSuccess();
      setTimeout(onClose, 800);
    } catch (err) {
      setToast({
        type:    'error',
        title:   'Delete failed',
        message: err?.response?.data
          ? Object.values(err.response.data).flat().join(' ')
          : err?.message || 'Could not delete user. Please try again.',
      });
    }
  };

  return (
    <div className="af-panel-fields-container">

      {toast && (
        <Toast
          type={toast.type}
          title={toast.title}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}

      {showDeletePrompt && (
        <Prompt
          type="error"
          title="Delete user"
          message="Are you sure you want to delete this user? This action cannot be undone."
          confirmLabel={isDeleting ? 'Deleting...' : 'Delete'}
          cancelLabel="Cancel"
          onCancel={() => setShowDeletePrompt(false)}
          onConfirm={handleDeleteConfirm}
        />
      )}

      {!isEditMode && (
        <div className="af-fields-row-frame">
          <div className="af-text-field-wrapper">
            <label className="af-field-label">Username*</label>
            <div className="af-input-box">
              <input
                type="text"
                className="af-text-input"
                value={formData.username || ''}
                onChange={(e) => onChange('username', e.target.value)}
              />
            </div>
          </div>
          <div className="af-text-field-wrapper">
            <label className="af-field-label">Password*</label>
            <div className="af-input-box">
              <input
                type="password"
                className="af-text-input"
                value={formData.password || ''}
                onChange={(e) => onChange('password', e.target.value)}
              />
            </div>
          </div>
        </div>
      )}

      <div className="af-fields-row-frame">
        <div className="af-text-field-wrapper">
          <div className="af-input-with-label">
            <label className="af-field-label">First Name*</label>
            <div className="af-input-box">
              <input
                type="text"
                className="af-text-input"
                value={formData.first_name || ''}
                onChange={(e) => onChange('first_name', e.target.value)}
              />
            </div>
          </div>
        </div>
        <div className="af-text-field-wrapper">
          <div className="af-input-with-label">
            <label className="af-field-label">Last Name*</label>
            <div className="af-input-box">
              <input
                type="text"
                className="af-text-input"
                value={formData.last_name || ''}
                onChange={(e) => onChange('last_name', e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="af-fields-row-frame">
        <div className="af-text-field-wrapper">
          <div className="af-input-with-label">
            <label className="af-field-label">Email*</label>
            <div className="af-input-box">
              <input
                type="email"
                className="af-text-input"
                value={formData.email || ''}
                onChange={(e) => onChange('email', e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="af-text-field-wrapper">
          <div className="af-input-with-label">
            <label className="af-field-label">Status*</label>
            <SimpleDropdown
              options={[
                { id: 'true', name: 'Active' },
                { id: 'false', name: 'Inactive' }
              ]}
              value={formData.is_active ? 'true' : 'false'}
              onChange={(val) => onChange('is_active', val === 'true')}
              isSearchBar={false}
            />
          </div>
        </div>
      </div>

      <div className="af-fields-row-frame">
        <div className="af-text-field-wrapper af-full-width">
          <div className="af-input-with-label">
            <label className="af-field-label">Role</label>
            <SimpleDropdown
              options={[
                { id: 'superadmin', name: 'Super Admin' },
                { id: 'admin', name: 'Admin' },
                { id: 'viewer', name: 'Viewer' }
              ]}
              value={getRoleValue()}
              onChange={handleRoleChange}
              isSearchBar={false}
            />
          </div>
        </div>
      </div>

      {isEditMode && (
        <div className="af-destructive-action-row">
          <button
            className="af-destructive-btn"
            onClick={() => setShowDeletePrompt(true)}
            disabled={isDeleting}
          >
            <span>{isDeleting ? 'Deleting...' : 'Delete User'}</span>
          </button>
        </div>
      )}

    </div>
  );
}

export default FieldsSection;