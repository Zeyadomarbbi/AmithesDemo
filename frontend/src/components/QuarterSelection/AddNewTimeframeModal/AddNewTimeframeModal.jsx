import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import DateInputWithPicker from '../../DateComponents/DateInput'; 
import { CloseIcon } from '/src/components/Icons/InteractiveIcons'; 
import './AddNewTimeframeModal.css';

const AddNewTimeframeModal = ({ 
    isOpen, 
    onClose, 
    onSave, 
    onDelete,
    editData = null,
    existingDates = [] 
}) => {
    const [endDate, setEndDate] = useState(new Date());
    const [name, setName] = useState('');
    const [isManualName, setIsManualName] = useState(false);
    const [originalName, setOriginalName] = useState('');
    const [originalDate, setOriginalDate] = useState(null);

    const isEditMode = !!editData;

    const parseRawDate = (rawDate) => {
        if (!rawDate) return new Date();
        if (rawDate instanceof Date) return rawDate;
        if (typeof rawDate === 'string') {
            const parsed = rawDate.includes('T')
                ? new Date(rawDate)
                : new Date(rawDate.replace(/-/g, '/'));
            return isNaN(parsed.getTime()) ? new Date() : parsed;
        }
        return new Date();
    };

    useEffect(() => {
        if (isOpen) {
            if (editData) {
                const resolvedName = editData.display_label || editData.name || '';
                const resolvedDate = parseRawDate(editData.date || editData.endDate);

                setName(resolvedName);
                setOriginalName(resolvedName);
                setEndDate(resolvedDate);
                setOriginalDate(resolvedDate);
                setIsManualName(true);
            } else {
                setEndDate(new Date(new Date().getFullYear() + 1, 2, 31));
                setName('');
                setOriginalName('');
                setOriginalDate(null);
                setIsManualName(false);
            }
        }
    }, [isOpen, editData?.id, editData?.date, editData?.endDate]);

    useEffect(() => {
        if (!isEditMode && endDate && !isManualName) {
            const year = endDate.getFullYear();
            const month = endDate.getMonth();
            const quarterNum = Math.floor(month / 3) + 1;
            setName(`Q${quarterNum} ${year}`);
        }
    }, [endDate, isManualName, isEditMode]);

    if (!isOpen) return null;

    const hasChanged = isEditMode
        ? (name !== originalName || endDate?.toDateString() !== originalDate?.toDateString())
        : true;

    const handleNameChange = (e) => {
        const value = e.target.value;
        setName(value);
        if (value.trim() === "") {
            setIsManualName(false);
        } else {
            setIsManualName(true);
        }
    };

    const handleSave = () => {
        const monthStr = String(endDate.getMonth() + 1).padStart(2, '0');
        const dayStr = String(endDate.getDate()).padStart(2, '0');
        const yearShort = String(endDate.getFullYear()).slice(-2);
        const formattedCurrentDate = `${monthStr}/${dayStr}/${yearShort}`;

        const originalFormattedDate = editData ? 
            (() => {
                const rawDate = editData.date;
                const d = rawDate instanceof Date
                    ? rawDate
                    : rawDate
                        ? new Date(rawDate.replace(/-/g, '/'))
                        : new Date();
                return `${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}/${String(d.getFullYear()).slice(-2)}`;
            })() : null;

        if (formattedCurrentDate !== originalFormattedDate && existingDates.includes(formattedCurrentDate)) {
            alert(`The date ${formattedCurrentDate} already exists.`);
            return;
        }

        const year = endDate.getFullYear();
        const month = String(endDate.getMonth() + 1).padStart(2, '0');
        const day = String(endDate.getDate()).padStart(2, '0');
        const dateString = `${year}-${month}-${day}`;

        onSave({ 
            id: editData?.id, 
            name, 
            endDate: dateString 
        });
        onClose();
    };

    const handleDelete = () => {
        onDelete(editData.id);
        onClose();
    };

    return ReactDOM.createPortal(
        <div className="antfm-modal-overlay">
            <div className="antfm-modal-content">
                
                <div className="antfm-modal-header">
                    <h3 className="antfm-modal-title">
                        {isEditMode ? 'Edit timeframe' : 'Add a new frame'}
                    </h3>
                    <button className="antfm-modal-close-btn" onClick={onClose}>
                        <CloseIcon />
                    </button>
                </div>

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

                <div className="antfm-modal-footer">
                    <div className="antfm-footer-left">
                        {isEditMode && (
                            <button className="antfm-btn antfm-btn-delete" onClick={handleDelete}>
                                Delete
                            </button>
                        )}
                    </div>
                    <div className="antfm-footer-right">
                        <button className="antfm-btn antfm-btn-cancel" onClick={onClose}>
                            Cancel
                        </button>
                        <button 
                            className="antfm-btn antfm-btn-save" 
                            onClick={handleSave}
                            disabled={!name.trim() || !hasChanged}
                        >
                            {isEditMode ? 'Update' : 'Save'}
                        </button>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default AddNewTimeframeModal;