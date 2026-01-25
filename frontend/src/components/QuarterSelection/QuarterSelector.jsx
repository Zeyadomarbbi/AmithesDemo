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
    isSingle = true 
}) {
    const [isOpen, setIsOpen] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const wrapperRef = useRef(null);

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

        const active = options.find(o => Number(o.id) === Number(selected));
        return active ? active.display_label : 'Select';
    };

    const label = getButtonLabel();

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
                                ? Number(selected) === Number(item.id)
                                : (selected || []).includes(item.id);

                            return (
                                <div 
                                    key={item.id} 
                                    className={`quarter-item ${isActive ? 'selected' : ''}`}
                                    onClick={() => {
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