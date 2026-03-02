import React, { useState, useEffect } from 'react';
import EditPanelHeader from './EditPanelHeader/EditPanelHeader';
import EditFieldsSection from './EditFieldsSection/EditFieldsSection';
import { useUsers } from '../../../hooks/Core/useUsers';
import './EditAdminPanel.css';

function EditAdminPanel({ isOpen, onClose, userData }) {
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
      // Construct a clean payload
      const payload = {
        username: formData.username || formData.email, // Required & Unique
        email: formData.email,                         // Optional but recommended
        password: formData.password,                   // Required for creation
        first_name: formData.first_name,               // Note: snake_case
        last_name: formData.last_name,                 // Note: snake_case
        is_active: formData.is_active,
        is_staff: formData.is_staff,
        is_superuser: formData.is_superuser,
      };

      console.log("Payload to submit:", payload);
      if (isEditMode) {
        // For updates, we often don't want to send an empty password string
        if (!payload.password) delete payload.password;
        await updateUser(userData.id, payload);
      } else {
        await createUser(payload);
      }
      onClose();
    } catch (err) {
      console.error("Operation failed:", err);
    }
  };

  return (
    <>
      <div className={`panel-backdrop ${isOpen ? 'open' : ''}`} onClick={onClose} />
      <div className={`admin-panel-container ${isOpen ? 'open' : ''}`}>
        
        <EditPanelHeader 
          onClose={onClose} 
          title={isEditMode ? "Edit User" : "New User"}
          description={
            isEditMode 
              ? "Update the user's information and permissions below." 
              : "Fill in the details below to create a new user account."
          }
        />

        <EditFieldsSection 
          formData={formData} 
          onChange={handleChange} 
          userId={userData?.id}
          onClose={onClose}
          // Pass this flag to handle internal conditional rendering
          isEditMode={isEditMode} 
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
export default EditAdminPanel;