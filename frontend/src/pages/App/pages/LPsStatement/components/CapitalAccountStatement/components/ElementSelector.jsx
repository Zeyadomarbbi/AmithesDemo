import React, { useState, useEffect, useRef, useMemo } from 'react';
import { ChevronDownIcon } from '../../../../../../../components/Icons/DirectionIcons';
import { CheckMarkIcon } from '../../../../../../../components/Icons/InteractiveIcons';
import SearchBar from '../../../../../../../components/SearchBar/SearchBar';
import './ElementSelector.css';

/**
 * ElementSelector
 * Multi-select dropdown for share classes (and later LPs).
 * Includes local filtering via SearchBar.
 */
function ElementSelector({ options = [], selected = [], onChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const wrapperRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Reset search when dropdown closes
  useEffect(() => {
    if (!isOpen) setSearchTerm("");
  }, [isOpen]);

  const filteredOptions = useMemo(() => {
    const query = searchTerm.toLowerCase();
    return options.filter((opt) => 
      String(opt.label || "").toLowerCase().includes(query)
    );
  }, [options, searchTerm]);

  const getButtonLabel = () => {
    const count = selected.length;
    if (count === 0) return 'All elements';
    if (count === 1) {
      const found = options.find((o) => o.key === selected[0]);
      return found ? found.label : 'All elements';
    }
    return `Elements (${count})`;
  };

  return (
    <div className="quarter-selector-container" ref={wrapperRef}>
      <div
        className={`quarter-selector-button ${isOpen ? 'active' : ''}`}
        onClick={() => setIsOpen((prev) => !prev)}
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
          <div className="quarter-search-wrapper" style={{ padding: '8px', borderBottom: '1px solid #eee' }}>
            <SearchBar 
              placeholder="Filter classes..." 
              onSearch={setSearchTerm} 
            />
          </div>

          <div className="quarter-list" style={{ maxHeight: '250px', overflowY: 'auto' }}>
            {filteredOptions.length > 0 ? (
              filteredOptions.map((item) => {
                const isActive = selected.includes(item.key);
                return (
                  <div
                    key={item.key}
                    className={`quarter-item ${isActive ? 'selected' : ''}`}
                    onClick={() => onChange(item.key)}
                  >
                    <div className={`qs-checkbox ${isActive ? 'checked' : ''}`}>
                      {isActive && <CheckMarkIcon />}
                    </div>
                    <span className="item-label-bold">{item.label}</span>
                  </div>
                );
              })
            ) : (
              <div style={{ padding: '16px', textAlign: 'center', color: '#9ca3af', fontSize: '12px' }}>
                No results found
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default ElementSelector;