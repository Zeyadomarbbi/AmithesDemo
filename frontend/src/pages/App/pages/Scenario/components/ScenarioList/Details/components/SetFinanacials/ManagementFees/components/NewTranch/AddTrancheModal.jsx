import React, { useState, useMemo } from 'react';
import { useManFeeTranches } from '../../../../../../../../../../hooks/Scenarios/useScenarioManFeeTranches';
import { useShareClasses } from '../../../../../../../../../../hooks/useShareClass';
import { CloseIcon } from '/src/components/Icons/InteractiveIcons';
import DateInputWithPicker from '../../../../../../../../../../../../components/DateComponents/DateInput';
import SimpleDropdown from '../../../../../../../../../../../../components/SearchBar/SimpleDropdown/SimpleDropdown';
import Toast from '../../../../../../../../../../components/Toast/Toast';
import './AddTrancheModal.css';

const AddTrancheModal = ({ fundId, scenarioId, isOpen, onClose}) => {
    // Correctly using 'addTranche' from your provided hook
    const { addTranche } = useManFeeTranches(fundId, scenarioId);
    const { data: shareClasses } = useShareClasses(fundId);

    const [formData, setFormData] = useState({
        tranche_name: '',
        amount: '',
        share_class_id: '',
        start_date: new Date()
    });

    const [isSaving, setIsSaving] = useState(false);
    const [toast, setToast] = useState(null);

    const isFormValid = useMemo(() => {
        return (
            formData.tranche_name.trim() !== '' &&
            formData.amount !== '' &&
            formData.share_class_id !== '' &&
            formData.start_date instanceof Date
        );
    }, [formData]);

    if (!isOpen) return null;

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleDateChange = (date) => {
        setFormData(prev => ({ ...prev, start_date: date }));
    };

    const handleSave = async (e) => {
        if (e) e.preventDefault();
        if (!isFormValid || isSaving) return;

        setIsSaving(true);
        try {
            const payload = {
                share_class_id: formData.share_class_id,
                tranche_name: formData.tranche_name,
                amount: formData.amount,
                start_date: formData.start_date.toISOString().split('T')[0]
            };

            await addTranche(payload);
            
            setToast({
                type: 'success',
                title: 'Success',
                message: 'Tranche created successfully.'
            });

            setTimeout(() => {
                onClose();
            }, 1500);

        } catch (err) {
            setToast({
                type: 'error',
                title: 'Error',
                message: err.response?.data?.message || err.message || 'Failed to create tranche.'
            });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="man-fee-tranches-modal-overlay">
            <div className="man-fee-tranches-modal-content">
                <button 
                    className="man-fee-tranches-modal-close-icon" 
                    onClick={onClose}
                    type="button"
                >
                    <CloseIcon />
                </button>

                <div className="man-fee-tranches-modal-header">
                    <h2>Add Management Fee Tranche</h2>
                </div>

                <form className="man-fee-tranches-modal-body" onSubmit={handleSave}>
                    <div className="man-fee-tranches-form-group">
                        <label>Tranche Name*</label>
                        <input 
                            type="text" 
                            name="tranche_name"
                            placeholder="e.g., 6th closing (Feeder X)" 
                            value={formData.tranche_name}
                            onChange={handleInputChange}
                        />
                    </div>

                    <div className="man-fee-tranches-form-group">
                        <label>Amount*</label>
                        <input 
                            type="number" 
                            name="amount"
                            placeholder="2 000 000" 
                            value={formData.amount}
                            onChange={handleInputChange}
                        />
                    </div>

                    <div className="man-fee-tranches-form-group">
                        <label>Share Class*</label>
                        <SimpleDropdown
                            options={shareClasses || []}
                            value={formData.share_class_id}
                            onChange={(val) => setFormData(prev => ({ ...prev, share_class_id: val }))}
                            placeholder="Select a class"
                            labelKey="share_class_name"
                            valueKey="share_class_id"
                            isSearchBar={true}
                        />
                    </div>

                    <div className="man-fee-tranches-form-group">
                        <label>Start Date* </label>
                        <DateInputWithPicker 
                            initialDate={formData.start_date}
                            onDateChange={handleDateChange}
                            disabled={false}
                            dateFormat="DD/MM/YYYY"
                        />
                    </div>

                <div className="man-fee-tranches-footer">
                    <div className="man-fee-tranches-actions">
                        <button 
                            type="button" 
                            className="man-fee-tranches-btn-cancel" 
                            onClick={onClose}
                        >
                            Cancel
                        </button>
                        <button 
                            type="submit"
                            className="man-fee-tranches-btn-save" 
                            disabled={isSaving || !isFormValid}
                        >
                            {isSaving ? "Saving..." : "Save"}
                        </button>
                    </div>
                </div>
                </form>
            </div>

            {toast && (
                <Toast
                    type={toast.type}
                    title={toast.title}
                    message={toast.message}
                    onClose={() => setToast(null)}
                />
            )}
        </div>
    );
};

export default AddTrancheModal;