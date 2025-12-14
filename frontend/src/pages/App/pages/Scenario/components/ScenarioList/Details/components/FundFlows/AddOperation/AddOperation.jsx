import React, { useState, useEffect } from 'react';
import DateInputWithPicker from '../../../../../../../../../../components/DateComponents/DateInput'; 
import { CloseIcon } from '../Icons';
import './AddOperation.css';

const AddOperation = ({ isOpen, onClose, onSave }) => {
  const [type, setType] = useState('call');
  const [date, setDate] = useState(new Date());
  const [amount, setAmount] = useState('');

  useEffect(() => {
    if (!isOpen) {
      setType('call');
      setDate(new Date());
      setAmount('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="ff-add-op-overlay">
      <div className="ff-add-op-container">
        
        {/* Header / Close */}
        <div className="ff-add-op-close-row">
          <button className="ff-add-op-close-btn" onClick={onClose}>
            <CloseIcon />
          </button>
        </div>

        <div className="ff-add-op-content">
          <div className="ff-add-op-header-group">
            <h3 className="ff-add-op-title">Add an operation</h3>
            
            {/* Type Toggles */}
            <div className="ff-add-op-toggles">
              <div 
                className={`ff-add-op-toggle-card ${type === 'call' ? 'selected' : ''}`} 
                onClick={() => setType('call')}
              >
                <div className="ff-add-op-radio-circle"></div>
                <div className="ff-add-op-badge yellow">Capital call</div>
              </div>
              
              <div 
                className={`ff-add-op-toggle-card ${type === 'dist' ? 'selected' : ''}`} 
                onClick={() => setType('dist')}
              >
                <div className="ff-add-op-radio-circle"></div>
                <div className="ff-add-op-badge blue">Distribution</div>
              </div>
            </div>
          </div>

          <div className="ff-add-op-inputs-group">
            
            {/* Date Input */}
            <div className="ff-add-op-input-col">
              <label>Date</label>
              <DateInputWithPicker 
                initialDate={date} 
                onDateChange={setDate} 
                isSingle={true} 
              />
            </div>
            
            {/* Amount Input */}
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