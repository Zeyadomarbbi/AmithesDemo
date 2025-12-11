import React, { useState, useEffect } from 'react';
import './DatePicker.css';
import { ChevronLeft, ChevronRight } from './Icons'; 

/**
 * @param {boolean} isSingle - If true, selects a single date. If false, selects a range.
 * @param {function} onClose - Callback to close the picker.
 * @param {function} onApply - Callback with result: { start, end } (end is null if isSingle).
 * @param {Date} initialStartDate - Initial starting date.
 * @param {Date} initialEndDate - Initial ending date.
 */
const DatePicker = ({ 
  onClose, 
  onApply, 
  isSingle = true, 
  initialStartDate = new Date(),
  initialEndDate = null,
  style 
}) => {
  // --- View State ---
  // viewMode: 'days' | 'months' | 'years'
  const [viewMode, setViewMode] = useState('days');
  const [viewDate, setViewDate] = useState(new Date(initialStartDate || new Date()));

  // --- Selection State ---
  const [startDate, setStartDate] = useState(initialStartDate);
  const [endDate, setEndDate] = useState(initialEndDate);

  const daysOfWeek = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const fullMonths = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  // --- Helpers ---
  const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year, month) => {
    const day = new Date(year, month, 1).getDay();
    return day === 0 ? 6 : day - 1; 
  };
  
  const isSameDay = (d1, d2) => {
    if (!d1 || !d2) return false;
    return d1.getDate() === d2.getDate() && 
           d1.getMonth() === d2.getMonth() && 
           d1.getFullYear() === d2.getFullYear();
  };

  const formatDate = (date) => {
    if (!date) return '';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  // --- Navigation Handlers ---
  const handlePrev = () => {
    const newDate = new Date(viewDate);
    if (viewMode === 'days') newDate.setMonth(newDate.getMonth() - 1);
    else if (viewMode === 'months') newDate.setFullYear(newDate.getFullYear() - 1);
    else if (viewMode === 'years') newDate.setFullYear(newDate.getFullYear() - 12);
    setViewDate(newDate);
  };

  const handleNext = () => {
    const newDate = new Date(viewDate);
    if (viewMode === 'days') newDate.setMonth(newDate.getMonth() + 1);
    else if (viewMode === 'months') newDate.setFullYear(newDate.getFullYear() + 1);
    else if (viewMode === 'years') newDate.setFullYear(newDate.getFullYear() + 12);
    setViewDate(newDate);
  };

  const handleTitleClick = () => {
    if (viewMode === 'days') setViewMode('months');
    else if (viewMode === 'months') setViewMode('years');
  };

  // --- Selection Handlers ---

  // 1. Day Selection
  const handleDayClick = (day) => {
    const clickedDate = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);

    if (isSingle) {
      setStartDate(clickedDate);
      setEndDate(null);
      return;
    }

    // Range Logic
    if (!startDate || (startDate && endDate)) {
      // Start new selection
      setStartDate(clickedDate);
      setEndDate(null);
    } else {
      // Complete selection
      if (clickedDate < startDate) {
        setEndDate(startDate);
        setStartDate(clickedDate);
      } else {
        setEndDate(clickedDate);
      }
    }
  };

  // 2. Month Selection
  const handleMonthClick = (monthIndex) => {
    const newDate = new Date(viewDate);
    newDate.setMonth(monthIndex);
    setViewDate(newDate);
    setViewMode('days'); // Drill down
  };

  // 3. Year Selection
  const handleYearClick = (year) => {
    const newDate = new Date(viewDate);
    newDate.setFullYear(year);
    setViewDate(newDate);
    setViewMode('months'); // Drill down
  };

  // --- Preset Logic (Range Only) ---
  const handlePreset = (rangeType) => {
    const today = new Date();
    const start = new Date(today);

    switch (rangeType) {
        case 'week': start.setDate(today.getDate() - 7); break;
        case 'month': start.setMonth(today.getMonth() - 1); break;
        case 'year': start.setFullYear(today.getFullYear() - 1); break;
        default: return;
    }
    setStartDate(start);
    setEndDate(today);
    setViewDate(new Date(start)); 
    setViewMode('days'); // Always go back to day view on preset
  };

  // --- Grid Generators ---

  // A. Calendar Days
  const generateDaysGrid = () => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    const daysInPrevMonth = getDaysInMonth(year, month - 1);
    
    const grid = [];

    // Previous Month padding
    for (let i = 0; i < firstDay; i++) {
      grid.push({ day: daysInPrevMonth - firstDay + 1 + i, type: 'prev' });
    }

    // Current Month
    for (let i = 1; i <= daysInMonth; i++) {
      const currentIterDate = new Date(year, month, i);
      let type = 'current';

      if (isSameDay(currentIterDate, startDate)) type = 'selected-start';
      else if (isSameDay(currentIterDate, endDate)) type = 'selected-end';
      else if (startDate && endDate && currentIterDate > startDate && currentIterDate < endDate) type = 'range';

      // Fix visual overlap for single day range
      if (isSameDay(currentIterDate, startDate) && isSameDay(startDate, endDate)) type = 'selected-single';

      grid.push({ day: i, type, date: currentIterDate });
    }

    // Next Month padding
    const remainingSlots = 42 - grid.length;
    for (let i = 1; i <= remainingSlots; i++) {
      grid.push({ day: i, type: 'next' });
    }
    return grid;
  };

  // B. Years Generator (12 year window)
  const generateYearsGrid = () => {
    const currentYear = viewDate.getFullYear();
    const startYear = currentYear - 6; // Center roughly
    const years = [];
    for(let i = 0; i < 12; i++) {
      years.push(startYear + i);
    }
    return years;
  };

  // --- Render Helpers ---
  const getTitle = () => {
    if (viewMode === 'days') return `${fullMonths[viewDate.getMonth()]} ${viewDate.getFullYear()}`;
    if (viewMode === 'months') return `${viewDate.getFullYear()}`;
    if (viewMode === 'years') {
      const years = generateYearsGrid();
      return `${years[0]} - ${years[years.length-1]}`;
    }
  };

  return (
    <div className="dp-container" style={style}>
      <div className="dp-content">
        
        {/* --- Header --- */}
        <div className="dp-header">
          <button className="dp-nav-btn" onClick={handlePrev}><ChevronLeft /></button>
          <button className="dp-month-title-btn" onClick={handleTitleClick}>
            {getTitle()}
          </button>
          <button className="dp-nav-btn" onClick={handleNext}><ChevronRight /></button>
        </div>

        {/* --- Inputs (Show only if Range, or adapt for Single) --- */}
        <div className="dp-inputs-row">
          <div className={`dp-input-wrapper ${(!endDate && !isSingle) ? 'active' : ''}`}>
            <input 
              readOnly
              className="dp-input" 
              value={formatDate(startDate)} 
              placeholder={isSingle ? "Select Date" : "Start Date"}
            />
          </div>
          {!isSingle && (
            <>
              <span className="dp-dash">—</span>
              <div className="dp-input-wrapper">
                <input 
                  readOnly
                  className="dp-input" 
                  value={formatDate(endDate)} 
                  placeholder="End Date"
                />
              </div>
            </>
          )}
        </div>

        {/* --- Presets (Only in Range Mode + Day View) --- */}
        {!isSingle && viewMode === 'days' && (
          <div className="dp-presets">
            <button className="dp-preset-btn" onClick={() => handlePreset('week')}>Last week</button>
            <button className="dp-preset-btn" onClick={() => handlePreset('month')}>Last month</button>
            <button className="dp-preset-btn" onClick={() => handlePreset('year')}>Last year</button>
          </div>
        )}

        {/* --- VIEW: DAYS --- */}
        {viewMode === 'days' && (
          <div className="dp-calendar-view">
            <div className="dp-week-header">
              {daysOfWeek.map(d => <div key={d} className="dp-day-label">{d}</div>)}
            </div>
            <div className="dp-days-grid">
              {generateDaysGrid().map((item, index) => {
                let className = "dp-day-cell";
                if (item.type.includes('selected')) className += " selected";
                if (item.type === 'range') className += " in-range";
                if (item.type === 'next' || item.type === 'prev') className += " other-month";
                
                // Rounded corners for range edges
                if (item.type === 'selected-start' && endDate) className += " range-start";
                if (item.type === 'selected-end' && startDate) className += " range-end";

                return (
                  <div 
                    key={index} 
                    className={className}
                    onClick={() => item.type !== 'next' && item.type !== 'prev' && handleDayClick(item.day)}
                  >
                    <span className="day-number">{item.day}</span>
                    {/* Dot for today */}
                    {item.type === 'current' && isSameDay(item.date, new Date()) && <div className="dp-dot"></div>}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* --- VIEW: MONTHS --- */}
        {viewMode === 'months' && (
          <div className="dp-months-grid">
            {months.map((m, i) => (
              <button 
                key={m} 
                className={`dp-month-cell ${i === viewDate.getMonth() ? 'current' : ''}`}
                onClick={() => handleMonthClick(i)}
              >
                {m}
              </button>
            ))}
          </div>
        )}

        {/* --- VIEW: YEARS --- */}
        {viewMode === 'years' && (
          <div className="dp-years-grid">
            {generateYearsGrid().map((y) => (
              <button 
                key={y} 
                className={`dp-year-cell ${y === viewDate.getFullYear() ? 'current' : ''}`}
                onClick={() => handleYearClick(y)}
              >
                {y}
              </button>
            ))}
          </div>
        )}

      </div>

      <div className="dp-footer">
        <button className="dp-btn cancel" onClick={onClose}>Cancel</button>
        <button className="dp-btn apply" onClick={() => onApply({ start: startDate, end: endDate })}>
            Apply
        </button>
      </div>
    </div>
  );
};

export default DatePicker;