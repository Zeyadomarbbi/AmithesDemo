import React, { useState, useEffect, useRef } from 'react';
import { ChevronDownIcon, PlusIcon, RightArrowIcon, CheckMarkIcon } from '../Icons'; 
import AddNewTimeframeModal from './AddNewTimeframeModal/AddNewTimeframeModal';
import './QuarterSelector.css';

function QuarterSelector({ 
    options = [], 
    selected, 
    onChange, 
    onSaveNew, 
    isLoading,
    isSingle = true,
    maxSelections = null 
}) {
    const [isOpen, setIsOpen] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const wrapperRef = useRef(null);

    // --- SANITIZE SELECTION ---
    // This ensures that [0] or [NaN] from URL parsing never affects the UI
    const validSelection = isSingle 
        ? selected 
        : (Array.isArray(selected) ? selected : []).filter(id => Number(id) > 0);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const getButtonLabel = () => {
        if (isLoading) return 'Loading...';

        // Single Selection Logic
        if (isSingle) {
            const active = options.find(o => Number(o.id) === Number(validSelection));
            return active ? active.display_label : 'Select';
        }

        // Multi-Selection Logic (using sanitized list)
        const selectedCount = validSelection.length;

        if (selectedCount === 0) return 'Select';
        
        if (selectedCount === 1) {
            const active = options.find(o => Number(o.id) === Number(validSelection[0]));
            return active ? active.display_label : 'Select';
        }
        
        return `Timeframes (${selectedCount})`;
    };

    const label = getButtonLabel();

    // Limit Check (using sanitized list)
    const isAtLimit = !isSingle && maxSelections !== null && validSelection.length >= maxSelections;

    return (
        <div className="quarter-selector-container" ref={wrapperRef}>
            <div 
                className={`quarter-selector-button ${isOpen ? 'active' : ''}`} 
                onClick={() => !isLoading && setIsOpen(!isOpen)}
                style={{ opacity: isLoading ? 0.7 : 1 }}
            >
                <div className="quarter-text-group">
                    <span className="quarter-part">{label}</span>
                </div>
                <div className={`quarter-icon ${isOpen ? 'open' : ''}`}>
                    <ChevronDownIcon />
                </div>
            </div>

            {isOpen && (
                <div className="quarter-dropdown">
                    <div className="quarter-list">
                        {options.map((item) => {
                            const isActive = isSingle
                                ? Number(validSelection) === Number(item.id)
                                : validSelection.includes(item.id); // Check against valid list

                            // Disable if at limit AND not currently selected
                            const isDisabled = !isActive && isAtLimit;

                            return (
                                <div 
                                    key={item.id} 
                                    className={`quarter-item ${isActive ? 'selected' : ''}`}
                                    style={{ 
                                        opacity: isDisabled ? 0.5 : 1, 
                                        cursor: isDisabled ? 'not-allowed' : 'pointer',
                                        pointerEvents: isDisabled ? 'none' : 'auto' 
                                    }}
                                    onClick={() => {
                                        if (isDisabled) return;
                                        onChange(item.id);
                                        if (isSingle) setIsOpen(false);
                                    }}
                                >
                                    {!isSingle && (
                                        <div className={`qs-checkbox ${isActive ? 'checked' : ''}`}>
                                            {isActive && <CheckMarkIcon />}
                                        </div>
                                    )}

                                    <span className="item-label-bold">
                                        {item.display_label}
                                    </span>
                                    
                                    <div className="item-details-group">
                                        <span className="item-arrow-icon">
                                            <RightArrowIcon />
                                        </span>
                                        <span className="item-date">{item.date}</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <button 
                        className="add-timeframe-btn" 
                        onClick={() => {
                            setIsModalOpen(true);
                            setIsOpen(false);
                        }}
                    >
                        <span className="add-icon"><PlusIcon /></span>
                        <span className="add-text">Add a new timeframe</span>
                    </button>
                </div>
            )}
            
            <AddNewTimeframeModal 
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={onSaveNew}
                existingDates={options.map(o => o.date)}
            />
        </div>
    );
}

export default QuarterSelector;