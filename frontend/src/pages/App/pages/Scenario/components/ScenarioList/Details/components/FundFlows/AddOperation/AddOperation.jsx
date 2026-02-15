import React, { useState, useEffect } from 'react';
import DateInputWithPicker from '../../../../../../../../../../components/DateComponents/DateInput'; 
import { CloseIcon } from '../Icons';
import './AddOperation.css';

const AddOperation = ({ isOpen, onClose, onSave }) => {
  // Hardcoded to 'call' as requested
  const [type] = useState('call');
  const [date, setDate] = useState(new Date());
  const [amount, setAmount] = useState('');

  useEffect(() => {
    if (!isOpen) {
      setDate(new Date());
      setAmount('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="ff-add-op-overlay">
      <div className="ff-add-op-container">
        
        <div className="ff-add-op-close-row">
          <button className="ff-add-op-close-btn" onClick={onClose}>
            <CloseIcon />
          </button>
        </div>

        <div className="ff-add-op-content">
          <div className="ff-add-op-header-group">
            <h3 className="ff-add-op-title">Add a Capital Call</h3>
            {/* Toggle group removed entirely for a cleaner UI */}
          </div>

          <div className="ff-add-op-inputs-group">
            <div className="ff-add-op-input-col">
              <label>Date</label>
              <DateInputWithPicker 
                initialDate={date} 
                onDateChange={setDate} 
                isSingle={true} 
              />
            </div>
            
            <div className="ff-add-op-input-col">
              <label>Amount</label>
              <div className="ff-add-op-input-wrapper">
                <input 
                  type="text" 
                  placeholder="0.00" 
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="ff-add-op-footer">
            <button className="ff-add-op-btn btn-cancel" onClick={onClose}>Cancel</button>
            <button 
              className="ff-add-op-btn btn-save" 
              onClick={() => onSave && onSave({ type, date, amount })}
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddOperation;