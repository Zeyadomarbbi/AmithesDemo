import React, { useState, useMemo, useRef, useEffect } from "react";
import SearchBar from "../SearchBar"; 
import { ChevronDownIcon } from "../../Icons/DirectionIcons";
import "./SearchableSelect.css";

/**
 * @param {Array} options - Array of objects to display
 * @param {any} value - Currently selected value
 * @param {Function} onChange - Callback returning the selected value
 * @param {string} placeholder - Display text when empty
 * @param {boolean} disabled - Disable interaction
 * @param {string} labelKey - Object key for display text (default: "name")
 * @param {string} valueKey - Object key for selection value (default: "id")
 * @param {string} secondaryLabelKey - Optional key for bracketed text (e.g., "symbol")
 * @param {string} triggerClassName - Class appended to the trigger element
 */
const SearchableSelect = ({ 
  options = [], 
  value, 
  onChange, 
  placeholder = "Select option...", 
  disabled = false, 
  labelKey = "name", 
  valueKey = "id",
  secondaryLabelKey = null,
  triggerClassName = "" 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const containerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredOptions = useMemo(() => {
    return options.filter(opt => {
      const label = String(opt[labelKey] || "").toLowerCase();
      const secondary = secondaryLabelKey ? String(opt[secondaryLabelKey] || "").toLowerCase() : "";
      return label.includes(searchTerm.toLowerCase()) || secondary.includes(searchTerm.toLowerCase());
    });
  }, [options, searchTerm, labelKey, secondaryLabelKey]);

  const selectedOption = useMemo(() => 
    options.find(opt => opt[valueKey] === value), 
  [options, value, valueKey]);

  const handleSelect = (opt) => {
    onChange(opt[valueKey]);
    setIsOpen(false);
    setSearchTerm("");
  };

  const renderLabel = (opt) => (
    <>
      {opt[labelKey]}
      {secondaryLabelKey && opt[secondaryLabelKey] && (
        <span className="item-secondary"> ({opt[secondaryLabelKey]})</span>
      )}
    </>
  );

  return (
    <div className={`custom-select-container ${disabled ? "is-disabled" : ""}`} ref={containerRef}>
      <div 
        className={`custom-select-trigger ${triggerClassName} ${isOpen ? "is-open" : ""}`.trim()} 
        onClick={() => !disabled && setIsOpen(!isOpen)}
      >
        <span className="custom-select-value">
          {selectedOption ? renderLabel(selectedOption) : placeholder}
        </span>
        <span className={`custom-select-chevron ${isOpen ? "up" : ""}`}>
          <ChevronDownIcon />
        </span>
      </div>

      {isOpen && (
        <div className="custom-select-dropdown">
          <div className="custom-select-search-wrapper">
            <SearchBar 
              placeholder="Filter..." 
              onSearch={setSearchTerm} 
            />
          </div>
          <div className="custom-select-options-list">
            {filteredOptions.length > 0 ? (
              filteredOptions.map(opt => (
                <div 
                  key={opt[valueKey]} 
                  className={`custom-select-item ${value === opt[valueKey] ? "is-selected" : ""}`}
                  onClick={() => handleSelect(opt)}
                >
                  <span className="item-label">{renderLabel(opt)}</span>
                </div>
              ))
            ) : (
              <div className="custom-select-no-results">No matches found</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchableSelect;