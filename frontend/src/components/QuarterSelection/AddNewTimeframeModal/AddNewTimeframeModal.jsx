import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import DateInputWithPicker from '../../DateComponents/DateInput'; 
import { CloseIcon } from '../../Icons'; 
import './AddNewTimeframeModal.css';

const AddNewTimeframeModal = ({ isOpen, onClose, onSave, existingDates = [] }) => {
    const [endDate, setEndDate] = useState(new Date(new Date().getFullYear() + 1, 2, 31));
    const [name, setName] = useState('');
    const [isManualName, setIsManualName] = useState(false); // Tracks user interaction

    // Logic: Auto-generate name based on date ONLY if user hasn't typed anything
    useEffect(() => {
        if (endDate && !isManualName) {
            const year = endDate.getFullYear();
            const month = endDate.getMonth();
            const quarterNum = Math.floor(month / 3) + 1;
            const autoName = `Q${quarterNum} ${year}`;
            setName(autoName);
        }
    }, [endDate, isManualName]);

    // Reset manual flag when modal opens
    useEffect(() => {
        if (isOpen) {
            setIsManualName(false);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleNameChange = (e) => {
        const value = e.target.value;
        setName(value);
        
        // If user clears the input, revert to automatic logic
        if (value.trim() === "") {
            setIsManualName(false);
        } else {
            setIsManualName(true);
        }
    };

    const handleSave = () => {
        if (endDate && existingDates.length > 0) {
            // Ensure comparison matches your existingDates format
            const formattedCurrentDate = endDate.toLocaleDateString('en-US', {
                year: '2-digit',
                month: '2-digit',
                day: '2-digit'
            });

            if (existingDates.includes(formattedCurrentDate)) {
                alert(`The date ${formattedCurrentDate} already exists. Please select a different date.`);
                return;
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
                    <div className="antfm-form-group">
                        <label className="antfm-form-label" htmlFor="antfm-name-input">Name *</label>
                        <input
                            id="antfm-name-input"
                            className="antfm-form-input"
                            type="text"
                            value={name}
                            onChange={handleNameChange}
                            placeholder="e.g. Q1 2024"
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
                        disabled={!name.trim()}
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