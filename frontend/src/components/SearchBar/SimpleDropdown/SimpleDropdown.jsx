import React, { useState, useEffect, useRef, useMemo } from "react";
import { createPortal } from "react-dom";
import SearchBar from '../SearchBar';
import './SimpleDropdown.css';

function SimpleDropdown({ 
    options, 
    value, 
    onChange, 
    placeholder, 
    disabled, 
    labelKey = "name", 
    valueKey = "id",
    isSingle = true,
}) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [dropdownStyle, setDropdownStyle] = useState({});
    const triggerRef = useRef(null);
    const dropdownRef = useRef(null);

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
            const maxAvailableHeight = openUpward ? spaceAbove - 16 : spaceBelow - 16;
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

    const selected = options.find((o) => String(o[valueKey]) === String(value));
    const label = selected ? selected[labelKey] : placeholder || "Select";

    const filtered = useMemo(() => {
        return options.filter((o) =>
            String(o[labelKey] || "").toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [options, searchTerm, labelKey]);

    const dropdown = (
        <div ref={dropdownRef} className="sd-dropdown" style={dropdownStyle}>
            <div className="sd-search-wrapper">
                <SearchBar placeholder="Search..." onSearch={setSearchTerm} />
            </div>
            <div className="sd-list">
                {filtered.length > 0 ? (
                    filtered.map((o) => {
                        const isActive = String(o[valueKey]) === String(value);
                        return (
                            <div
                                key={o[valueKey]}
                                className={`sd-item ${isActive ? "active" : ""}`}
                                onClick={() => {
                                    onChange(o[valueKey]);
                                    if (isSingle) setIsOpen(false);
                                    setSearchTerm("");
                                }}
                            >
                                <span className="sd-item-label">{o[labelKey]}</span>
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
                onClick={() => !disabled && setIsOpen((p) => !p)}
            >
                <div className="sd-text-group">
                    <span className="sd-label">{label}</span>
                </div>
                <div className={`sd-icon ${isOpen ? "open" : ""}`}>
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path d="M4 6l4 4 4-4" stroke="#375A89" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                </div>
            </div>

            {isOpen && createPortal(dropdown, document.body)}
        </div>
    );
}

export default SimpleDropdown;