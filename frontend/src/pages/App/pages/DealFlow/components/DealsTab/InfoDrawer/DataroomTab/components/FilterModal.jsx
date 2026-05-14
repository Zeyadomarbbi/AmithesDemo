import React, { useState } from "react";
import { CloseIcon } from "/src/components/Icons/InteractiveIcons";
import { ChevronDownIcon } from "/src/components/Icons/DirectionIcons";
import "./FilterModal.css";

const TYPE_OPTIONS = ["Transaction", "Financial", "Legal"];

function FilterModal({ onClose, onApply }) {
  const [typeOpen, setTypeOpen] = useState(true);
  const [selectedTypes, setSelectedTypes] = useState([]);

  const toggleType = (type) =>
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );

  const allTypesSelected = selectedTypes.length === TYPE_OPTIONS.length;

  const toggleAllTypes = () =>
    setSelectedTypes(allTypesSelected ? [] : [...TYPE_OPTIONS]);

  const handleApply = () => {
    onApply?.({ types: selectedTypes });
    onClose();
  };

  return (
    <div className="drfm-overlay" onClick={onClose}>
      <div className="drfm-modal" onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className="drfm-header">
          <h2 className="drfm-title">Filter by</h2>
          <button className="drfm-close" onClick={onClose}><CloseIcon /></button>
        </div>

        {/* Body */}
        <div className="drfm-body">
          {/* Type group */}
          <div className="drfm-group">
            <div className="drfm-group-header" onClick={() => setTypeOpen((o) => !o)}>
              <span className={`drfm-chevron${typeOpen ? " drfm-chevron--open" : ""}`}>
                <ChevronDownIcon />
              </span>
              <input
                type="checkbox"
                className="drfm-checkbox"
                checked={allTypesSelected}
                onChange={toggleAllTypes}
                onClick={(e) => e.stopPropagation()}
              />
              <span className="drfm-group-label">Type</span>
            </div>

            {typeOpen && (
              <div className="drfm-options">
                {TYPE_OPTIONS.map((type) => (
                  <label key={type} className="drfm-option">
                    <input
                      type="checkbox"
                      className="drfm-checkbox"
                      checked={selectedTypes.includes(type)}
                      onChange={() => toggleType(type)}
                    />
                    <span className="drfm-option-label">{type}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="drfm-footer">
          <button className="drfm-btn-cancel" onClick={onClose}>Cancel</button>
          <button className="drfm-btn-apply" onClick={handleApply}>Filter</button>
        </div>

      </div>
    </div>
  );
}

export default FilterModal;
