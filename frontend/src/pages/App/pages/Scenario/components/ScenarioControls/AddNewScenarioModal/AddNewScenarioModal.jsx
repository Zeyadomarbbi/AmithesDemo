// AddNewScenarioModal.jsx

import React, { useState, useEffect } from 'react';
import { CloseIcon } from '/src/components/Icons/InteractiveIcons';
import './AddNewScenarioModal.css';

function AddNewScenarioModal({ author, initialData = null, isDuplicate = false, onSave, onClose }) {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (initialData) {
            setName(isDuplicate ? `${initialData.title} (Copy)` : initialData.title);
            setDescription(initialData.description);
        } else {
            setName('');
            setDescription('');
        }
    }, [initialData, isDuplicate]);

    const handleSave = async () => {
        if (!name.trim() || !description.trim() || isSubmitting) return;

        setIsSubmitting(true);

        const scenarioData = {
            name: name.trim(),
            description: description.trim(),
            author: author,
        };
        
        try {
            await onSave(scenarioData);
        } catch (error) {
            // Allows the user to try again if the API call fails
        } finally {
            setIsSubmitting(false);
        }
    };

    const modalTitle = isDuplicate 
        ? "Duplicate Scenario" 
        : initialData 
            ? "Edit Scenario" 
            : "Add A New Scenario";

    let footerTitle = "Create Scenario";
    if (isSubmitting) {
        footerTitle = isDuplicate ? "Duplicating..." : initialData ? "Saving..." : "Creating...";
    } else {
        footerTitle = isDuplicate ? "Duplicate" : initialData ? "Save Changes" : "Create Scenario";
    }

  return (
    <div className="modal-add-scenario-overlay" onClick={!isSubmitting ? onClose : undefined}>
      <div className="modal-add-scenario-content" onClick={e => e.stopPropagation()}>
        
        <div className="modal-add-scenario-header">
          <h2 className="modal-add-scenario-title">
            {modalTitle}
          </h2>
          <div className="modal-add-scenario-close-btn-wrapper" onClick={!isSubmitting ? onClose : undefined}>
            <CloseIcon />
          </div>
        </div>

        <div className="modal-add-scenario-body">
          <div className="modal-add-scenario-input-group">
            <label className="modal-add-scenario-input-label">Name *</label>
            <input 
                type="text" 
                className="modal-add-scenario-input-field" 
                placeholder="placeholder"
                value={name}
                onChange={(e) => setName(e.target.value)} 
                disabled={isSubmitting}
            />
          </div>
          
          <div className="modal-add-scenario-input-group">
            <label className="modal-add-scenario-input-label">Description *</label>
            <textarea 
                className="modal-add-scenario-textarea-field" 
                placeholder="placeholder" 
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={isSubmitting}
            />
          </div>
        </div>

        <div className="modal-add-scenario-footer">
          <button 
                className="modal-add-scenario-btn-cancel" 
                onClick={onClose}
                disabled={isSubmitting}
          >
            Cancel
          </button>
          <button 
                className={`modal-add-scenario-btn-save ${isSubmitting ? 'loading' : ''}`} 
                onClick={handleSave}
                disabled={!name.trim() || !description.trim() || isSubmitting} 
            >
            {footerTitle}
          </button>
        </div>
      </div>
    </div>
  );
}

export default AddNewScenarioModal;