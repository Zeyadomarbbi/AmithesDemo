// AddOperation.js
import React, { useState, useEffect } from 'react';
import DateInputWithPicker from '../../../../../../../../../../components/DateComponents/DateInput'; 
import { CloseIcon } from '/src/components/Icons/InteractiveIcons';
import './AddOperation.css';

const AddOperation = ({ 
  isOpen, 
  onClose, 
  fundId, 
  scenarioId, 
  onCreateDate 
}) => {
  const [date, setDate] = useState(new Date());
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setDate(new Date());
    }
  }, [isOpen]);

  const handleSave = async () => {
    setIsSaving(true);
    
    try {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const formattedDate = `${year}-${month}-${day}`;

      await onCreateDate({
        fund: fundId,
        scenario: scenarioId,
        date: formattedDate,
        year: year
      });

      onClose(); 
    } catch (err) {
      console.error('Failed to create operation:', err);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="scenario-ff-add-op-overlay">
      <div className="scenario-ff-add-op-container">
        
        <div className="scenario-ff-add-op-close-row">
          <button className="scenario-ff-add-op-close-btn" onClick={onClose}>
            <CloseIcon />
          </button>
        </div>

        <div className="scenario-ff-add-op-content">
          <div className="scenario-ff-add-op-header-group">
            <h3 className="scenario-ff-add-op-title">Add a Capital Call</h3>
          </div>

          <div className="scenario-ff-add-op-inputs-group">
            <div className="scenario-ff-add-op-input-col">
              <label className="scenario-ff-add-op-label">Date</label>
              <DateInputWithPicker 
                initialDate={date} 
                onDateChange={setDate} 
                isSingle={true} 
              />
            </div>
          </div>

          <div className="scenario-ff-add-op-footer">
            <button 
              className="scenario-ff-add-op-btn scenario-ff-add-op-btn-cancel" 
              onClick={onClose}
              disabled={isSaving}
            >
              Cancel
            </button>
            <button 
              className="scenario-ff-add-op-btn scenario-ff-add-op-btn-save" 
              onClick={handleSave}
              disabled={isSaving}
            >
              {isSaving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddOperation;