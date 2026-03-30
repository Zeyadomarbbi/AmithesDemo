import React, { useEffect, useMemo, useState, useRef } from "react";
import { CloseIcon, CheckMarkIcon } from "../../../../../../../../../../components/Icons/InteractiveIcons.jsx";
import { ChevronDownIcon } from "../../../../../../../../../../components/Icons/DirectionIcons.jsx";
import SearchableSelect from "../../../../../../../../../../components/SearchBar/SearchableSelect";
import "./AddFlowModal.css";
import '/src/components/QuarterSelection/QuarterSelector.css';

export default function AddFlowModal({ 
    onClose, 
    onSave, 
    isSaving = false, 
    flowTypes = [], 
    isLoadingTypes = false,
    lpRows = [],
}) {
    const [flowName, setFlowName] = useState("");
    const [flowTypeId, setFlowTypeId] = useState("");
    const [flowTypeName, setFlowTypeName] = useState("");
    const [selectedLpIds, setSelectedLpIds] = useState([]);
    const [isAllMode, setIsAllMode] = useState(true);
    const [lpDropdownOpen, setLpDropdownOpen] = useState(false);
    const [lpSearch, setLpSearch] = useState("");
    const lpDropdownRef = useRef(null);

    const toggleLp = (id) => {
        setSelectedLpIds((prev) => {
            const isActive = prev.includes(id);
            const next = isActive ? prev.filter((x) => x !== id) : [...prev, id];
            return next;
        });
    };

    const options = useMemo(() => {
        const arr = Array.isArray(flowTypes) ? flowTypes : [];
        return arr.map((t) => {
            const id = t?.flow_type_id ?? t?.id ?? t?.pk ?? null;
            const name = t?.name ?? t?.label ?? null;
            if (id === null || id === undefined || !name) return null;
            return { id: String(id), name: String(name) };
        }).filter(Boolean);
    }, [flowTypes]);

    useEffect(() => {
        if (!flowTypeId && options.length > 0) {
            setFlowTypeId(options[0].id);
            setFlowTypeName(options[0].name);
        }
    }, [options, flowTypeId]);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (lpDropdownRef.current && !lpDropdownRef.current.contains(e.target)) {
                setLpDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const filteredLpRows = useMemo(() => {
        const q = lpSearch.toLowerCase();
        return lpRows.filter((lp) => lp.name.toLowerCase().includes(q));
    }, [lpRows, lpSearch]);

    const lpButtonLabel = isAllMode
        ? "All LPs"
        : selectedLpIds.length === 0
            ? "None selected"
            : selectedLpIds.length === 1
                ? lpRows.find((lp) => lp.id === selectedLpIds[0])?.name ?? "1 LP selected"
                : `LPs (${selectedLpIds.length})`;

    const handleSave = () => {
        if (!onSave || !flowName.trim() || !flowTypeId) return;
        onSave({
            flowName: flowName.trim(),
            flowTypeId: Number(flowTypeId),
            flowTypeName: flowTypeName || "",
            alignAll: isAllMode,
            selectedLpIds: isAllMode ? null : selectedLpIds,
        });
        if (onClose) onClose();
    };

    const disabled = isSaving || isLoadingTypes;

    return (
        <div className="af-backdrop">
            <div className="af-modal">
                <div className="af-header">
                    <button className="af-close" onClick={onClose} type="button" disabled={isSaving}>
                        <CloseIcon />
                    </button>
                    <h3 className="af-title">Add new flow</h3>
                </div>

                <div className="af-body">
                    <div className="af-field">
                        <label className="af-label">Flow name*</label>
                        <input
                            className="af-input"
                            placeholder="Please enter the flow name..."
                            value={flowName}
                            onChange={(e) => setFlowName(e.target.value)}
                            disabled={disabled}
                            autoFocus
                        />
                    </div>

                    <div className="af-field">
                        <label className="af-label">Type of flow*</label>
                        <SearchableSelect
                            options={options}
                            value={flowTypeId}
                            onChange={(val) => {
                                setFlowTypeId(val);
                                const found = options.find(o => o.id === val);
                                setFlowTypeName(found?.name || "");
                            }}
                            placeholder={isLoadingTypes ? "Loading types..." : "Choose flow type"}
                            labelKey="name"
                            valueKey="id"
                            disabled={disabled}
                            triggerClassName="af-input"
                        />
                    </div>

                    <div className="af-field">
                        <label className="af-label">LPs</label>
                        <div className="quarter-selector-container" ref={lpDropdownRef}>
                            <div
                                className={`quarter-selector-button ${lpDropdownOpen ? "active" : ""}`}
                                onClick={() => setLpDropdownOpen((p) => !p)}
                            >
                                <div className="quarter-text-group">
                                    <span className="quarter-part">{lpButtonLabel}</span>
                                </div>
                                <div className={`quarter-icon ${lpDropdownOpen ? "open" : ""}`}>
                                    <ChevronDownIcon />
                                </div>
                            </div>

                            {lpDropdownOpen && (
                                <div className="quarter-dropdown">
                                    <div className="quarter-search-wrapper">
                                        <input
                                            className="af-input"
                                            placeholder="Filter LPs..."
                                            value={lpSearch}
                                            onChange={(e) => setLpSearch(e.target.value)}
                                            onClick={(e) => e.stopPropagation()}
                                        />
                                    </div>
                                    <div className="quarter-list">
                                        <div
                                            className={`quarter-item ${isAllMode ? "selected" : ""}`}
                                            onClick={() => {
                                                setIsAllMode((prev) => !prev);
                                                setSelectedLpIds([]);
                                            }}
                                        >
                                            <div className="quarter-item-content">
                                                <div className={`qs-checkbox ${isAllMode ? "checked" : ""}`}>
                                                    {isAllMode && <CheckMarkIcon />}
                                                </div>
                                                <span className="item-label-bold">All LPs</span>
                                            </div>
                                        </div>

                                        {filteredLpRows.length > 0 ? (
                                            filteredLpRows.map((lp) => {
                                                const isActive = isAllMode || selectedLpIds.includes(lp.id);
                                                return (
                                                    <div
                                                        key={lp.id}
                                                        className={`quarter-item ${isActive ? "selected" : ""} ${isAllMode ? "disabled" : ""}`}
                                                        onClick={() => { if (!isAllMode) toggleLp(lp.id); }}
                                                    >
                                                        <div className="quarter-item-content">
                                                            <div className={`qs-checkbox ${isActive ? "checked" : ""}`}>
                                                                {isActive && <CheckMarkIcon />}
                                                            </div>
                                                            <span className="item-label-bold">{lp.name}</span>
                                                        </div>
                                                    </div>
                                                );
                                            })
                                        ) : (
                                            <div className="quarter-empty-state">No results found</div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="af-footer">
                    <button className="af-btn af-btn--secondary" onClick={onClose} type="button" disabled={isSaving}>
                        Cancel
                    </button>
                    <button
                        className="af-btn af-btn--primary"
                        onClick={handleSave}
                        type="button"
                        disabled={disabled || !flowTypeId || !flowName.trim()}
                    >
                        {isSaving ? "Saving..." : "Save"}
                    </button>
                </div>
            </div>
        </div>
    );
}