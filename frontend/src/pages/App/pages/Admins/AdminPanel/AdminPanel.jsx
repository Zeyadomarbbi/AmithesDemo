// AdminPanel.jsx
import React, { useState, useEffect } from 'react';
import FieldsSection from './FieldsSection/FieldsSection';
import { useUsers } from '../../../hooks/Core/useUsers';
import Toast from '../../../components/Toast/Toast';
import { CloseIcon } from '/src/components/Icons/InteractiveIcons';
import { ChevronDoubleLeftIcon } from '/src/components/Icons/DirectionIcons';
import './AdminPanel.css';
import './PanelHeader.css';

function AdminPanel({ isOpen, onClose, userData, onSuccess }) {
  const { updateUser, createUser, isLoading } = useUsers();
  const isEditMode = !!userData;

  const [isExpanded, setIsExpanded] = useState(false);
  const [formData, setFormData] = useState({
    first_name:   '',
    last_name:    '',
    username:     '',
    email:        '',
    password:     '',
    is_active:    true,
    is_staff:     false,
    is_superuser: false,
  });

  const [toast, setToast] = useState(null);

  // Reset expanded state when panel closes
  useEffect(() => {
    if (!isOpen) setIsExpanded(false);
  }, [isOpen]);

  useEffect(() => {
    if (userData) {
      setFormData({
        first_name:   userData.firstName === '-' ? '' : userData.firstName,
        last_name:    userData.lastName  === '-' ? '' : userData.lastName,
        username:     userData.username  || '',
        email:        userData.email     === '-' ? '' : userData.email,
        is_active:    userData.is_active,
        is_staff:     userData.is_staff,
        is_superuser: userData.is_superuser,
        password:     '',
      });
    } else {
      setFormData({
        first_name: '', last_name: '', username: '', email: '',
        password: '', is_active: true, is_staff: false, is_superuser: false,
      });
    }
  }, [userData, isOpen]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const extractErrorMessage = (err) => {
    if (err?.response?.data) {
      const data = err.response.data;
      const messages = Object.entries(data).map(([field, msgs]) => {
        const label = field.charAt(0).toUpperCase() + field.slice(1).replace('_', ' ');
        const text  = Array.isArray(msgs) ? msgs.join(' ') : String(msgs);
        return `${label}: ${text}`;
      });
      return messages.join(' — ');
    }
    return err?.message || 'An unexpected error occurred.';
  };

  const handleSave = async () => {
    try {
      const payload = { ...formData };
      if (!payload.password || payload.password.trim() === '') {
        delete payload.password;
      }

      if (isEditMode) {
        await updateUser(userData.id, payload);
        setToast({
          type:    'success',
          title:   'User updated',
          message: `${payload.first_name || payload.username} has been updated.`,
        });
      } else {
        const createPayload = {
          ...payload,
          username: payload.username || payload.email,
        };
        await createUser(createPayload);
        setToast({
          type:    'success',
          title:   'User created',
          message: `${payload.first_name || payload.username} has been added.`,
        });
      }

      if (onSuccess) onSuccess();
      setTimeout(onClose, 800);

    } catch (err) {
      setToast({
        type:    'error',
        title:   isEditMode ? 'Update failed' : 'Creation failed',
        message: extractErrorMessage(err),
      });
    }
  };

  const title       = isEditMode ? 'Edit User' : 'New User';
  const description = isEditMode
    ? "Update the user's information and permissions below."
    : 'Fill in the details below to create a new user account.';

  return (
    <>
      {toast && (
        <Toast
          type={toast.type}
          title={toast.title}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}

      <div className={`panel-backdrop ${isOpen ? 'open' : ''}`} onClick={onClose} />

      <div className={`admin-panel-container ${isOpen ? 'open' : ''} ${isExpanded ? 'expanded' : ''}`}>

        {/* ── Header ── */}
        <div className="panel-header-wrapper">
          <div className="header-top-bar">
            <div
              className={`featured-icon-box ${isExpanded ? 'rotated' : ''}`}
              onClick={() => setIsExpanded(prev => !prev)}
              style={{ cursor: 'pointer' }}
            >
              <ChevronDoubleLeftIcon width={20} color="#375A89" />
            </div>
            <button className="panel-close-btn" onClick={onClose}>
              <CloseIcon width={16} color="#375A89" />
            </button>
          </div>
          <div className="header-text-group">
            <div className="ht-title-row">
              <h2 className="panel-title">{title}</h2>
            </div>
            <p className="panel-description">{description}</p>
          </div>
        </div>

        <FieldsSection
          formData={formData}
          onChange={handleChange}
          userId={userData?.id}
          onClose={onClose}
          isEditMode={isEditMode}
          onSuccess={onSuccess}
        />

        <div className="panel-footer">
          <button className="btn-panel-cancel" onClick={onClose} disabled={isLoading}>
            Cancel
          </button>
          <button className="btn-panel-save" onClick={handleSave} disabled={isLoading}>
            {isLoading ? 'Saving...' : isEditMode ? 'Save Changes' : 'Create User'}
          </button>
        </div>

      </div>
    </>
  );
}

export default AdminPanel;