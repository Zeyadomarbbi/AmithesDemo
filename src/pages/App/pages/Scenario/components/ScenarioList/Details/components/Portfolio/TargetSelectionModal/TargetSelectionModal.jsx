import React, { useState } from 'react';
import './TargetSelectionModal.css';
import { CloseIcon } from '../Icons'; 

const TargetSelectionModal = ({ isOpen, onClose, onSave }) => {
    // Local state for form inputs
    const [formData, setFormData] = useState({
        fundTotalDistributed: 'ex : 100',
        bSharesTotalDistributed: 'ex : 100',
        fundTVPI: 'ex : 100',
        bSharesTVPI: 'ex : 100',
        fundIRR: 'ex : 100',
        bSharesIRR: 'ex : 100'
    });

    if (!isOpen) return null;

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSave = () => {
        onSave(formData);
        onClose();
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            handleSave();
        }
    };

    return (
        <div className="trgt-selection-mode-overlay" onClick={onClose}>
            {/* Stop propagation so clicking the modal content doesn't close it */}
            <div className="trgt-selection-mode-container" onClick={(e) => e.stopPropagation()}>
                
                {/* HEADER */}
                <div className="trgt-selection-mode-header">
                    <h2 className="trgt-selection-mode-title">Choose one target</h2>
                    <div className="trgt-selection-mode-close-icon" onClick={onClose}>
                        <CloseIcon />
                    </div>
                </div>

                {/* TABLE BODY */}
                <div className="trgt-selection-mode-body">
                    <table className="trgt-selection-mode-table">
                        <thead>
                            <tr>
                                <th className="trgt-selection-mode-row-header"></th>
                                <th className="trgt-selection-mode-col-header">Fund</th>
                                <th className="trgt-selection-mode-col-header">B shares</th>
                            </tr>
                        </thead>
                        <tbody>
                            {/* ROW 1: Total Distributed */}
                            <tr>
                                <td className="trgt-selection-mode-row-label">
                                    Total Distributed <span className="trgt-selection-mode-currency">(€)</span>
                                </td>
                                <td>
                                    <input 
                                        type="text" 
                                        name="fundTotalDistributed"
                                        value={formData.fundTotalDistributed}
                                        onChange={handleInputChange}
                                        onKeyDown={handleKeyDown}
                                        className="trgt-selection-mode-input"
                                    />
                                </td>
                                <td>
                                    <input 
                                        type="text" 
                                        name="bSharesTotalDistributed"
                                        value={formData.bSharesTotalDistributed}
                                        onChange={handleInputChange}
                                        onKeyDown={handleKeyDown}
                                        className="trgt-selection-mode-input"
                                    />
                                </td>
                            </tr>
                            {/* ROW 2: TVPI */}
                            <tr>
                                <td className="trgt-selection-mode-row-label">TVPI</td>
                                <td>
                                    <input 
                                        type="text" 
                                        name="fundTVPI"
                                        value={formData.fundTVPI}
                                        onChange={handleInputChange}
                                        onKeyDown={handleKeyDown}
                                        className="trgt-selection-mode-input"
                                    />
                                </td>
                                <td>
                                    <input 
                                        type="text" 
                                        name="bSharesTVPI"
                                        value={formData.bSharesTVPI}
                                        onChange={handleInputChange}
                                        onKeyDown={handleKeyDown}
                                        className="trgt-selection-mode-input"
                                    />
                                </td>
                            </tr>
                            {/* ROW 3: IRR */}
                            <tr>
                                <td className="trgt-selection-mode-row-label">IRR</td>
                                <td>
                                    <input 
                                        type="text" 
                                        name="fundIRR"
                                        value={formData.fundIRR}
                                        onChange={handleInputChange}
                                        onKeyDown={handleKeyDown}
                                        className="trgt-selection-mode-input"
                                    />
                                </td>
                                <td>
                                    <input 
                                        type="text" 
                                        name="bSharesIRR"
                                        value={formData.bSharesIRR}
                                        onChange={handleInputChange}
                                        onKeyDown={handleKeyDown}
                                        className="trgt-selection-mode-input"
                                    />
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* FOOTER BUTTONS */}
                <div className="trgt-selection-mode-footer">
                    <button className="trgt-selection-mode-btn-cancel" onClick={onClose}>Cancel</button>
                    <button className="trgt-selection-mode-btn-save" onClick={handleSave}>Save</button>
                </div>
            </div>
        </div>
    );
};

export default TargetSelectionModal;