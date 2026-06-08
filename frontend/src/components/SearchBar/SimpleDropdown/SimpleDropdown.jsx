// SimpleDropdown.jsx
import React, { useState, useEffect, useRef, useMemo } from "react";
import { createPortal } from "react-dom";
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
    searchLabel = "Search...",
    variant = "default",
    icon = null,
    createOptionLabel = "",
    onCreateOption = null,
    isCreatingOption = false,
    createFields = null
}) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [isCreateFormOpen, setIsCreateFormOpen] = useState(false);
    const [createValue, setCreateValue] = useState("");
    const [createFormValues, setCreateFormValues] = useState({});
    const [dropdownStyle, setDropdownStyle] = useState({});
    const triggerRef = useRef(null);
    const dropdownRef = useRef(null);
    const createInputRef = useRef(null);
    const hasCustomCreateFields = Array.isArray(createFields) && createFields.length > 0;

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

    useEffect(() => {
        if (!isOpen) {
            setIsCreateFormOpen(false);
            setCreateValue("");
            setCreateFormValues({});
            return;
        }
        if (isCreateFormOpen && createInputRef.current) {
            createInputRef.current.focus();
            createInputRef.current.select();
        }
    }, [isOpen, isCreateFormOpen]);

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
                <div className="sd-search-wrap" onMouseDown={(e) => e.stopPropagation()}>
                    <input
                        type="text"
                        className="sd-search-input"
                        placeholder={searchLabel}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        autoFocus
                    />
                </div>
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

                {typeof onCreateOption === "function" && (
                    <>
                        {!isCreateFormOpen ? (
                            <button
                                type="button"
                                className="sd-create-option"
                                onClick={() => {
                                    setCreateValue(String(searchTerm || "").trim());
                                    if (hasCustomCreateFields) {
                                        const nextValues = {};
                                        createFields.forEach((field, index) => {
                                            nextValues[field.key] =
                                                index === 0 ? String(searchTerm || "").trim() : "";
                                        });
                                        setCreateFormValues(nextValues);
                                    }
                                    setIsCreateFormOpen(true);
                                }}
                                disabled={isCreatingOption}
                            >
                                {createOptionLabel || "Add new"}
                            </button>
                        ) : (
                            <div className="sd-create-form" onMouseDown={(e) => e.stopPropagation()}>
                                {hasCustomCreateFields ? (
                                    <>
                                        {createFields.map((field, index) => (
                                            <input
                                                key={field.key}
                                                ref={index === 0 ? createInputRef : null}
                                                type={field.type || "text"}
                                                className="sd-create-input"
                                                placeholder={field.placeholder || field.label || "Type a value"}
                                                value={createFormValues[field.key] || ""}
                                                onChange={(e) =>
                                                    setCreateFormValues((prev) => ({
                                                        ...prev,
                                                        [field.key]: e.target.value,
                                                    }))
                                                }
                                                onKeyDown={async (e) => {
                                                    const hasMissingRequiredField = createFields.some(
                                                        (item) => item.required && !String(createFormValues[item.key] || "").trim()
                                                    );
                                                    if (e.key === "Enter" && !isCreatingOption && !hasMissingRequiredField) {
                                                        const createdValue = await onCreateOption(createFormValues);
                                                        if (createdValue !== undefined && createdValue !== null) {
                                                            onChange(createdValue);
                                                            setIsOpen(false);
                                                        }
                                                        setSearchTerm("");
                                                        setCreateValue("");
                                                        setCreateFormValues({});
                                                        setIsCreateFormOpen(false);
                                                    }
                                                    if (e.key === "Escape") {
                                                        setCreateValue("");
                                                        setCreateFormValues({});
                                                        setIsCreateFormOpen(false);
                                                    }
                                                }}
                                            />
                                        ))}
                                    </>
                                ) : (
                                    <input
                                        ref={createInputRef}
                                        type="text"
                                        className="sd-create-input"
                                        placeholder="Type a new value"
                                        value={createValue}
                                        onChange={(e) => setCreateValue(e.target.value)}
                                        onKeyDown={async (e) => {
                                            if (e.key === "Enter" && !isCreatingOption && String(createValue || "").trim()) {
                                                const createdValue = await onCreateOption(String(createValue || "").trim());
                                                if (createdValue !== undefined && createdValue !== null) {
                                                    onChange(createdValue);
                                                    setIsOpen(false);
                                                }
                                                setSearchTerm("");
                                                setCreateValue("");
                                                setIsCreateFormOpen(false);
                                            }
                                            if (e.key === "Escape") {
                                                setCreateValue("");
                                                setIsCreateFormOpen(false);
                                            }
                                        }}
                                    />
                                )}
                                <div className="sd-create-actions">
                                    <button
                                        type="button"
                                        className="sd-create-action sd-create-action--ghost"
                                        onClick={() => {
                                            setCreateValue("");
                                            setCreateFormValues({});
                                            setIsCreateFormOpen(false);
                                        }}
                                        disabled={isCreatingOption}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="button"
                                        className="sd-create-action sd-create-action--primary"
                                        onClick={async () => {
                                            const nextPayload = hasCustomCreateFields ? createFormValues : String(createValue || "").trim();
                                            if (
                                                (hasCustomCreateFields &&
                                                    createFields.some((field) => field.required && !String(createFormValues[field.key] || "").trim())) ||
                                                (!hasCustomCreateFields && !nextPayload)
                                            ) {
                                                return;
                                            }
                                            const createdValue = await onCreateOption(nextPayload);
                                            if (createdValue !== undefined && createdValue !== null) {
                                                onChange(createdValue);
                                                setIsOpen(false);
                                            }
                                            setSearchTerm("");
                                            setCreateValue("");
                                            setCreateFormValues({});
                                            setIsCreateFormOpen(false);
                                        }}
                                        disabled={
                                            isCreatingOption ||
                                            (hasCustomCreateFields
                                                ? createFields.some((field) => field.required && !String(createFormValues[field.key] || "").trim())
                                                : !String(createValue || "").trim())
                                        }
                                    >
                                        {isCreatingOption ? "Saving..." : "Save"}
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );

    return (
        <div className="sd-container" ref={triggerRef}>
            <div
                className={`sd-button ${variant === 'icon' ? 'sd-button-icon' : ''} ${isOpen ? "active" : ""} ${disabled ? "loading" : ""}`}
                onClick={() => !disabled && setIsOpen(p => !p)}
            >
                {variant === 'icon' ? (
                    icon
                ) : (
                    <>
                        <div className="sd-text-group">
                            <span className="sd-label">{label}</span>
                        </div>
                        <div className={`sd-icon ${isOpen ? "open" : ""}`}>
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                <path d="M4 6l4 4 4-4" stroke="#375A89" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </div>
                    </>
                )}
            </div>

            {isOpen && createPortal(dropdown, document.body)}
        </div>
    );
}

export default SimpleDropdown;
