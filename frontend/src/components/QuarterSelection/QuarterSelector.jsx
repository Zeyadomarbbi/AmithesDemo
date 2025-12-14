import React, { useState, useEffect, useRef } from 'react';
import { ChevronDownIcon, PlusIcon, RightArrowIcon } from '../Icons'; 
import AddNewTimeframeModal from './AddNewTimeframeModal/AddNewTimeframeModal';
import './QuarterSelector.css';

function QuarterSelector({ selected, onChange, isSingle = true }) {
  const [quarters, setQuarters] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const wrapperRef = useRef(null);

  useEffect(() => {
    const fetchQuarters = async () => {
      try {
        setIsLoading(true);
        // Mock Data
        const data = [
          { id: 1, q: 'Q1', y: '2024', d: "03/31/24" },
          { id: 2, q: 'Q2', y: '2024', d: "06/30/24" },
          { id: 3, q: 'Q3', y: '2024', d: "09/30/24" },
          { id: 4, q: 'Q4', y: '2024', d: "12/31/24" }
        ];
        setQuarters(data);
      } catch (error) {
        console.error("Failed to load quarters", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchQuarters();
  }, []);

  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [wrapperRef]);

  const handleItemClick = (e, item) => {
    e.stopPropagation(); 
    const itemValue = `${item.q}-${item.y}`;

    if (isSingle) {
      onChange(itemValue);
      setIsOpen(false);
    } else {
      let newSelection = Array.isArray(selected) ? [...selected] : [];
      if (newSelection.includes(itemValue)) {
        newSelection = newSelection.filter(val => val !== itemValue);
      } else {
        newSelection.push(itemValue);
      }
      onChange(newSelection);
    }
  };

  const handleAddNewTimeframe = () => {
    setIsModalOpen(true);
    setIsOpen(false); 
  };
  
  const handleModalSave = (newTimeframe) => {
    // Format the Date to String (MM/DD/YY)
    const dateObj = newTimeframe.endDate;
    const dateStr = dateObj.toLocaleDateString('en-US', {
        year: '2-digit',
        month: '2-digit',
        day: '2-digit'
    });

    const parts = newTimeframe.name.split(' ');
    const qPart = parts[0] || newTimeframe.name;
    const yPart = parts[1] || dateObj.getFullYear().toString();

    const newItem = {
        id: Date.now(), 
        q: qPart,
        y: yPart,
        d: dateStr
    };

    setQuarters(prev => [...prev, newItem]);
    
    if (isSingle) {
        onChange(`${newItem.q}-${newItem.y}`);
    }
  };

  const getButtonLabel = () => {
    if (isLoading) return { q: 'Loading...', y: '' };

    if (isSingle) {
      if (!selected) return { q: 'Select', y: '' };
      const [q, y] = selected.split('-');
      return { q, y };
    } else {
      if (!selected || selected.length === 0) return { q: 'Select', y: '' };
      if (selected.length === 1) {
        const [q, y] = selected[0].split('-');
        return { q, y };
      }
      return { q: `${selected.length} Quarters`, y: '' };
    }
  };

  const label = getButtonLabel();

  // Extract existing dates to pass to modal for validation
  const existingDates = quarters.map(q => q.d);

  return (
    <div className="quarter-selector-container" ref={wrapperRef}>
      
      {/* TRIGGER BUTTON */}
      <div 
        className={`quarter-selector-button ${isOpen ? 'active' : ''}`} 
        onClick={() => !isLoading && setIsOpen(!isOpen)}
        style={{ opacity: isLoading ? 0.7 : 1 }}
      >
        <div className="quarter-text-group">
          <span className="quarter-part">{label.q}</span>
          {label.y && <span className="year-part">{label.y}</span>}
        </div>
        <div className={`quarter-icon ${isOpen ? 'open' : ''}`}>
          <ChevronDownIcon />
        </div>
      </div>

      {/* DROPDOWN MENU */}
      {isOpen && (
        <div className="quarter-dropdown">
          <div className="quarter-list">
            {quarters.map((item) => {
              const itemValue = `${item.q}-${item.y}`;
              const isActive = isSingle 
                ? selected === itemValue 
                : (selected || []).includes(itemValue);

              return (
                <div 
                  key={item.id || itemValue} 
                  className={`quarter-item ${isActive ? 'selected' : ''} ${isSingle ? 'single-mode-item' : ''}`}
                  onClick={(e) => handleItemClick(e, item)}
                >
                  {!isSingle && (
                    <>
                      <div className={`qs-checkbox ${isActive ? 'checked' : ''}`}>
                        {isActive && <span>✓</span>}
                      </div>
                      <span className="item-label">{item.q} {item.y}</span>
                    </>
                  )}

                    {isSingle && (
                    <>
                        <span className="item-label-bold">{item.q} {item.y}</span>
                        <div className="item-details-group">
                        <span className="item-arrow-icon">
                            <RightArrowIcon />
                        </span>
                        <span className="item-date">{item.d}</span>
                        </div>
                    </>
                    )}

                </div>
              );
            })}
          </div>

          <button className="add-timeframe-btn" onClick={handleAddNewTimeframe}>
            <span className="add-icon">
              <PlusIcon />
            </span>
            <span className="add-text">Add a new timeframe</span>
          </button>
        </div>
      )}
      
      <AddNewTimeframeModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleModalSave}
        existingDates={existingDates} 
      />
      
    </div>
  );
}

export default QuarterSelector;