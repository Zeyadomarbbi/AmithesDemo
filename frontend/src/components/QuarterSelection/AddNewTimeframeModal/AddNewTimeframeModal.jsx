import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import DateInputWithPicker from '../../DateComponents/DateInput'; 
import { CloseIcon } from '../../Icons'; 
import './AddNewTimeframeModal.css';

const AddNewTimeframeModal = ({ isOpen, onClose, onSave, existingDates = [] }) => {
    const [endDate, setEndDate] = useState(new Date(new Date().getFullYear() + 1, 2, 31));
    const [name, setName] = useState('');

    useEffect(() => {
        if (endDate) {
            const year = endDate.getFullYear();
            const month = endDate.getMonth();
            const quarterNum = Math.floor(month / 3) + 1;
            const autoName = `Q${quarterNum} ${year}`;
            setName(autoName);
        }
    }, [endDate]);

    if (!isOpen) return null;

    const handleSave = () => {
        // Validate duplicates
        if (endDate && existingDates.length > 0) {
            const formattedCurrentDate = endDate.toLocaleDateString('en-US', {
                year: '2-digit',
                month: '2-digit',
                day: '2-digit'
            });

            if (existingDates.includes(formattedCurrentDate)) {
                alert(`The date ${formattedCurrentDate} already exists. Please select a different date.`);
                return; // Stop execution, do not close modal
            }
        }

        onSave({ name, endDate });
        onClose();
    };
    
    return ReactDOM.createPortal(
        <div className="antfm-modal-overlay">
            <div className="antfm-modal-content">
                
                {/* Header */}
                <div className="antfm-modal-header">
                    <h3 className="antfm-modal-title">Add a new frame</h3>
                    <button className="antfm-modal-close-btn" onClick={onClose}>
                        <CloseIcon />
                    </button>
                </div>

                {/* Body */}
                <div className="antfm-modal-body">
                    
                    {/* Name Field (Read Only) */}
                    <div className="antfm-form-group">
                        <label className="antfm-form-label" htmlFor="antfm-name-input">Name *</label>
                        <input
                            id="antfm-name-input"
                            className="antfm-form-input antfm-read-only"
                            type="text"
                            value={name}
                            readOnly 
                            tabIndex="-1" 
                        />
                    </div>
                    
                    {/* End Date Field */}
                    <div className="antfm-form-group">
                        <label className="antfm-form-label" htmlFor="end-date-input">End *</label>
                        <div className="antfm-date-input-wrapper">
                            <DateInputWithPicker 
                                initialDate={endDate}
                                onDateChange={setEndDate}
                                dateFormat="MM/DD/YY" 
                                isSingle={true}
                            />
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="antfm-modal-footer">
                    <button className="antfm-btn antfm-btn-cancel" onClick={onClose}>
                        Cancel
                    </button>
                    <button 
                        className="antfm-btn antfm-btn-save" 
                        onClick={handleSave}
                        disabled={!name}
                    >
                        Save
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default AddNewTimeframeModal;