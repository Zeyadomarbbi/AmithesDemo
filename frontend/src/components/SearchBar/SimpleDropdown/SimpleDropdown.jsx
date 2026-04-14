import React, { useState, useEffect, useRef, useMemo } from "react";
import { createPortal } from "react-dom";
import SearchBar from '../SearchBar';
import { CheckMarkIcon } from '../../Icons/InteractiveIcons';
import './SimpleDropdown.css';

const ALL_VALUE = "__ALL__";

function SimpleDropdown({
    options,
    value,
    onChange,
    placeholder,
    disabled,
    labelKey = "name",
    valueKey = "id",
    isSingle = true,
    isSearchBar = true,
    searchLabel = "Search..."
}) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [dropdownStyle, setDropdownStyle] = useState({});
    const triggerRef = useRef(null);
    const dropdownRef = useRef(null);

    const validSelection = isSingle
        ? value
        : (Array.isArray(value) ? value : []);

    const allOptionValues = useMemo(
        () => options.map(o => String(o[valueKey])),
        [options, valueKey]
    );

    const isAllSelected =
        !isSingle &&
        allOptionValues.length > 0 &&
        allOptionValues.every(v => validSelection.some(s => String(s) === v));

    useEffect(() => {
        const handler = (e) => {
            if (
                triggerRef.current && !triggerRef.current.contains(e.target) &&
                dropdownRef.current && !dropdownRef.current.contains(e.target)
            ) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    useEffect(() => {
        if (!isOpen || !triggerRef.current) return;

        const updatePosition = () => {
            if (!triggerRef.current) return;
            const rect = triggerRef.current.getBoundingClientRect();

            const spaceBelow = window.innerHeight - rect.bottom;
            const spaceAbove = rect.top;
            const spaceRight = window.innerWidth - rect.right;
            const spaceLeft = rect.left;

            const openUpward = spaceBelow < 320 && spaceAbove > spaceBelow;
            const openLeftward = spaceRight < 280 && spaceLeft > spaceRight;

            const maxAvailableHeight = openUpward
                ? spaceAbove - 16
                : spaceBelow - 16;

            setDropdownStyle({
                position: "fixed",
                maxHeight: maxAvailableHeight,
                zIndex: 99999,
                ...(openUpward
                    ? { bottom: window.innerHeight - rect.top + 4 }
                    : { top: rect.bottom + 4 }
                ),
                ...(openLeftward
                    ? { right: window.innerWidth - rect.right }
                    : { left: rect.left }
                ),
                maxWidth: "calc(100vw - 16px)"
            });
        };

        updatePosition();
        window.addEventListener("scroll", updatePosition, true);
        window.addEventListener("resize", updatePosition);

        return () => {
            window.removeEventListener("scroll", updatePosition, true);
            window.removeEventListener("resize", updatePosition);
        };
    }, [isOpen]);

    let label = placeholder || "Select";

    if (isSingle) {
        const selected = options.find(o => String(o[valueKey]) === String(value));
        if (selected) label = selected[labelKey];
    } else {
        if (isAllSelected) {
            label = "All Fields";
        } else if (validSelection.length === 1) {
            const selected = options.find(
                o => String(o[valueKey]) === String(validSelection[0])
            );
            if (selected) label = selected[labelKey];
        } else if (validSelection.length > 1) {
            label = `Selected (${validSelection.length})`;
        }
    }

    const filtered = useMemo(() => {
        return options.filter(o =>
            String(o[labelKey] || "")
                .toLowerCase()
                .includes(searchTerm.toLowerCase())
        );
    }, [options, searchTerm, labelKey]);

    const dropdown = (
        <div ref={dropdownRef} className="sd-dropdown" style={dropdownStyle}>
            {isSearchBar && (
                <SearchBar
                    placeholder={searchLabel}
                    onSearch={setSearchTerm}
                    containerClassName="sd-search"
                />
            )}

            <div className="sd-list">

                {!isSingle && (
                    <div
                        key={ALL_VALUE}
                        className={`sd-item ${isAllSelected ? "active" : ""}`}
                        onClick={() => {
                            if (isAllSelected) {
                                onChange([]);
                            } else {
                                onChange(options.map(o => o[valueKey]));
                            }
                            setSearchTerm("");
                        }}
                        style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                    >
                        <div className={`sd-checkbox qs-checkbox ${isAllSelected ? 'checked' : ''}`}>
                            {isAllSelected && <CheckMarkIcon />}
                        </div>
                        <span className="sd-item-label">All Fields</span>
                    </div>
                )}

                {filtered.length > 0 ? (
                    filtered.map((o) => {
                        const itemVal = String(o[valueKey]);

                        const isActive = isSingle
                            ? itemVal === String(value)
                            : validSelection.some(v => String(v) === itemVal);

                        return (
                            <div
                                key={o[valueKey]}
                                className={`sd-item ${isActive ? "active" : ""}`}
                                onClick={() => {
                                    if (isSingle) {
                                        onChange(o[valueKey]);
                                        setIsOpen(false);
                                    } else {
                                        const isSelected = validSelection.some(
                                            v => String(v) === itemVal
                                        );

                                        if (isSelected) {
                                            onChange(
                                                validSelection.filter(
                                                    v => String(v) !== itemVal
                                                )
                                            );
                                        } else {
                                            onChange([...validSelection, o[valueKey]]);
                                        }
                                    }
                                    setSearchTerm("");
                                }}
                                style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                            >
                                {!isSingle && (
                                    <div className={`sd-checkbox qs-checkbox ${isActive ? 'checked' : ''}`}>
                                        {isActive && <CheckMarkIcon />}
                                    </div>
                                )}
                                <span className="sd-item-label">
                                    {o[labelKey]}
                                </span>
                            </div>
                        );
                    })
                ) : (
                    <div className="sd-empty">No results found</div>
                )}
            </div>
        </div>
    );

    return (
        <div className="sd-container" ref={triggerRef}>
            <div
                className={`sd-button ${isOpen ? "active" : ""} ${disabled ? "loading" : ""}`}
                onClick={() => !disabled && setIsOpen(p => !p)}
            >
                <div className="sd-text-group">
                    <span className="sd-label">{label}</span>
                </div>

                <div className={`sd-icon ${isOpen ? "open" : ""}`}>
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path d="M4 6l4 4 4-4" stroke="#375A89" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </div>
            </div>

            {isOpen && createPortal(dropdown, document.body)}
        </div>
    );
}

export default SimpleDropdown;