import React, { useState, useEffect, useRef, useMemo } from "react";
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
    const ref = useRef(null);

    useEffect(() => {
        const handler = (e) => {
            if (ref.current && !ref.current.contains(e.target)) setIsOpen(false);
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    const selected = options.find((o) => String(o[valueKey]) === String(value));
    const label = selected ? selected[labelKey] : placeholder || "Select";

    const filtered = useMemo(() => {
        return options.filter((o) =>
            String(o[labelKey] || "").toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [options, searchTerm, labelKey]);

    return (
        <div className="sd-container" ref={ref}>
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

            {isOpen && (
                <div className="sd-dropdown">
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
            )}
        </div>
    );
}

export default SimpleDropdown;