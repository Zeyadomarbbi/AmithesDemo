import React, { useState, useEffect } from 'react';
import PanelHeader from './PanelHeader/PanelHeader';
import FieldsSection from './FieldsSection/FieldsSection';
import { useUsers } from '../../../hooks/Core/useUsers';
import './AdminPanel.css';

function AdminPanel({ isOpen, onClose, userData, onSuccess }) {
  const { updateUser, createUser, isLoading } = useUsers();
  const isEditMode = !!userData;

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    username: '', // Required for Django User creation
    email: '',
    password: '', // Required for New User
    is_active: true,
    is_staff: false,
    is_superuser: false
  });

  useEffect(() => {
    if (userData) {
      setFormData({
        first_name: userData.firstName === '-' ? '' : userData.firstName,
        last_name: userData.lastName === '-' ? '' : userData.lastName,
        username: userData.username || '',
        email: userData.email === '-' ? '' : userData.email,
        is_active: userData.is_active,
        is_staff: userData.is_staff,
        is_superuser: userData.is_superuser,
        password: '' // Don't load passwords
      });
    } else {
      // Reset for "Create" mode
      setFormData({
        first_name: '', last_name: '', username: '', email: '',
        password: '', is_active: true, is_staff: false, is_superuser: false
      });
    }
  }, [userData, isOpen]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    try {
      if (isEditMode) {
        await updateUser(userData.id, formData);
      } else {
        const payload = { ...formData, username: formData.username || formData.email };
        await createUser(payload);
      }
      
      if (onSuccess) onSuccess(); // Force parent to sync with DB
      onClose();
    } catch (err) {
      console.error("Operation failed:", err);
    }
  };

  return (
    <>
      <div className={`panel-backdrop ${isOpen ? 'open' : ''}`} onClick={onClose} />
      <div className={`admin-panel-container ${isOpen ? 'open' : ''}`}>
        
        <PanelHeader 
          onClose={onClose} 
          title={isEditMode ? "Edit User" : "New User"}
          description={
            isEditMode 
              ? "Update the user's information and permissions below." 
              : "Fill in the details below to create a new user account."
          }
        />

        <FieldsSection 
          formData={formData} 
          onChange={handleChange} 
          userId={userData?.id}
          onClose={onClose}
          isEditMode={isEditMode} 
          onSuccess={onSuccess} /* Pass to section for delete operation */
        />

        <div className="panel-footer">
          <button className="btn-panel-cancel" onClick={onClose} disabled={isLoading}>
            Cancel
          </button>
          <button className="btn-panel-save" onClick={handleSave} disabled={isLoading}>
            {isLoading ? "Saving..." : isEditMode ? "Save Changes" : "Create User"}
          </button>
        </div>
      </div>
    </>
  );
}
export default AdminPanel;