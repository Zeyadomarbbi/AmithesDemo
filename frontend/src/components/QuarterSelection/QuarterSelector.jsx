import React, { useState, useEffect, useRef, useMemo } from 'react';
import { ChevronDownIcon, RightArrowIcon } from '../../components/Icons/DirectionIcons'; 
import { PlusIcon, EditIcon, CheckMarkIcon } from '../../components/Icons/InteractiveIcons'; 
import { PermissionGate } from '../../hooks/Auth/PermissionGate';
import SearchBar from '../SearchBar/SearchBar';
import './QuarterSelector.css';

function QuarterSelector({ 
    options = [], 
    selected, 
    onChange,
    onAdd,
    onEdit,
    onDelete,
    isLoading,
    isSingle = true,
    maxSelections = null 
}) {
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef(null);
    const [searchTerm, setSearchTerm] = useState("");

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
        if (isSingle) {
            const active = options.find(o => Number(o.id) === Number(validSelection));
            return active ? active.display_label : 'Select';
        }
        const selectedCount = validSelection.length;
        if (selectedCount === 0) return 'Select';
        if (selectedCount === 1) {
            const active = options.find(o => Number(o.id) === Number(validSelection[0]));
            return active ? active.display_label : 'Select';
        }
        return `Timeframes (${selectedCount})`;
    };

    const filteredOptions = useMemo(() => {
        return options.filter(opt => {
            const label = String(opt.display_label || "").toLowerCase();
            const date = String(opt.date || "").toLowerCase();
            const query = searchTerm.toLowerCase();
            return label.includes(query) || date.includes(query);
        });
    }, [options, searchTerm]);

    const isAtLimit = !isSingle && maxSelections !== null && validSelection.length >= maxSelections;

    return (
        <div className="quarter-selector-container" ref={wrapperRef}>
            <div 
                className={`quarter-selector-button ${isOpen ? 'active' : ''} ${isLoading ? 'loading' : ''}`} 
                onClick={() => !isLoading && setIsOpen(!isOpen)}
            >
                <div className="quarter-text-group">
                    <span className="quarter-part">{getButtonLabel()}</span>
                </div>
                <div className={`quarter-icon ${isOpen ? 'open' : ''}`}>
                    <ChevronDownIcon />
                </div>
            </div>

            {isOpen && (
                <div className="quarter-dropdown">
                    <div className="quarter-search-wrapper">
                        <SearchBar placeholder="Filter timeframes..." onSearch={setSearchTerm} />
                    </div>

                    <div className="quarter-list">
                        {filteredOptions.length > 0 ? (
                            filteredOptions.map((item) => {
                                const isActive = isSingle
                                    ? Number(validSelection) === Number(item.id)
                                    : validSelection.includes(item.id);
                                const isDisabled = !isActive && isAtLimit;

                                return (
                                    <div 
                                        key={item.id} 
                                        className={`quarter-item ${isActive ? 'selected' : ''} ${isDisabled ? 'disabled' : ''}`}
                                        onClick={() => {
                                            if (isDisabled) return;
                                            onChange(item.id);
                                            if (isSingle) setIsOpen(false);
                                        }}
                                    >
                                        <div className="quarter-item-content">
                                            {!isSingle && (
                                                <div className={`qs-checkbox ${isActive ? 'checked' : ''}`}>
                                                    {isActive && <CheckMarkIcon />}
                                                </div>
                                            )}
                                            <span className="item-label-bold">{item.display_label}</span>
                                            <div className="item-details-group">
                                                <span className="item-arrow-icon"><RightArrowIcon /></span>
                                                <span className="item-date">{item.date}</span>
                                            </div>
                                        </div>

                                        <PermissionGate>
                                            <div 
                                                className="edit-action" 
                                                onClick={(e) => { e.stopPropagation(); onEdit(item); setIsOpen(false); }}
                                            >
                                                <EditIcon />
                                            </div>
                                        </PermissionGate>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="quarter-empty-state">
                                No results found
                            </div>
                        )}
                    </div>

                    <PermissionGate>
                        <button 
                            className="add-timeframe-btn" 
                            onClick={() => { onAdd(); setIsOpen(false); }}
                        >
                            <span className="add-icon"><PlusIcon /></span>
                            <span className="add-text">Add a new timeframe</span>
                        </button>
                    </PermissionGate>
                </div>
            )}
        </div>
    );
}

export default QuarterSelector;