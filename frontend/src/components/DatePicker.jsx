import React, { useState, useEffect } from 'react';
import './DatePicker.css';
import { ChevronLeft, ChevronRight } from './Icons'; 

const DatePicker = ({ onClose, onApply, initialDate = new Date(), style }) => {
  // --- State ---
  const [viewDate, setViewDate] = useState(new Date(initialDate));
  const [startDate, setStartDate] = useState(initialDate);
  const [endDate, setEndDate] = useState(null);

  const daysOfWeek = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];
  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  // --- Helpers ---
  const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year, month) => {
    const day = new Date(year, month, 1).getDay();
    return day === 0 ? 6 : day - 1; 
  };

  const formatDate = (date) => {
    if (!date) return '';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const isSameDay = (d1, d2) => {
    if (!d1 || !d2) return false;
    return d1.getDate() === d2.getDate() && 
           d1.getMonth() === d2.getMonth() && 
           d1.getFullYear() === d2.getFullYear();
  };

  // --- Preset Logic ---
  const handlePreset = (rangeType) => {
    const today = new Date();
    const start = new Date(today); // Clone today to avoid mutation issues

    switch (rangeType) {
        case 'week':
            // Subtract 7 days
            start.setDate(today.getDate() - 7);
            break;
        case 'month':
            // Subtract 1 month (handles year wrapping automatically)
            start.setMonth(today.getMonth() - 1);
            break;
        case 'year':
            // Subtract 1 year
            start.setFullYear(today.getFullYear() - 1);
            break;
        default:
            return;
    }

    setStartDate(start);
    setEndDate(today);
    // Crucial: Jump the calendar view to the start date so user sees the selection
    setViewDate(new Date(start)); 
  };

  // --- Handlers ---
  const handlePrevMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
  };

  const handleDayClick = (day) => {
    const clickedDate = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);

    if (!startDate || (startDate && endDate)) {
      setStartDate(clickedDate);
      setEndDate(null);
    } else {
      if (clickedDate < startDate) {
        setEndDate(startDate);
        setStartDate(clickedDate);
      } else {
        setEndDate(clickedDate);
      }
    }
  };

  const handleApply = () => {
    if (onApply) {
      onApply({ start: startDate, end: endDate });
    }
  };

  // --- Grid Generation ---
  const generateCalendar = () => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    
    const daysInPrevMonth = getDaysInMonth(year, month - 1);
    const prevMonthDays = [];
    for (let i = 0; i < firstDay; i++) {
      prevMonthDays.push({ day: daysInPrevMonth - firstDay + 1 + i, type: 'prev' });
    }

    const currentDays = [];
    for (let i = 1; i <= daysInMonth; i++) {
      const currentIterDate = new Date(year, month, i);
      let type = 'current';

      if (isSameDay(currentIterDate, startDate)) type = 'selected-start';
      else if (isSameDay(currentIterDate, endDate)) type = 'selected-end';
      else if (startDate && endDate && currentIterDate > startDate && currentIterDate < endDate) type = 'range';

      currentDays.push({ day: i, type, date: currentIterDate });
    }

    const totalSlots = 42;
    const remainingSlots = totalSlots - (prevMonthDays.length + currentDays.length);
    const nextMonthDays = [];
    for (let i = 1; i <= remainingSlots; i++) {
      nextMonthDays.push({ day: i, type: 'next' });
    }

    return [...prevMonthDays, ...currentDays, ...nextMonthDays];
  };

  const calendarGrid = generateCalendar();

  return (
    <div className="dp-container" style={style}>
      <div className="dp-content">
        
        {/* --- Header --- */}
        <div className="dp-header">
          <button className="dp-nav-btn" onClick={handlePrevMonth}><ChevronLeft /></button>
          <span className="dp-month-title">{months[viewDate.getMonth()]} {viewDate.getFullYear()}</span>
          <button className="dp-nav-btn" onClick={handleNextMonth}><ChevronRight /></button>
        </div>

        {/* --- Inputs --- */}
        <div className="dp-inputs-row">
          <div className={`dp-input-wrapper ${!endDate ? 'active' : ''}`}>
            <input 
              type="text" 
              className="dp-input" 
              value={formatDate(startDate)} 
              placeholder="Start Date"
              readOnly 
            />
          </div>
          <span className="dp-dash">—</span>
          <div className="dp-input-wrapper">
            <input 
              type="text" 
              className="dp-input" 
              value={formatDate(endDate)} 
              placeholder="End Date"
              readOnly 
            />
          </div>
        </div>

        {/* --- Presets --- */}
        <div className="dp-presets">
          <button className="dp-preset-btn" onClick={() => handlePreset('week')}>Last week</button>
          <button className="dp-preset-btn" onClick={() => handlePreset('month')}>Last month</button>
          <button className="dp-preset-btn" onClick={() => handlePreset('year')}>Last year</button>
        </div>

        {/* --- Calendar --- */}
        <div className="dp-calendar">
          <div className="dp-week-header">
            {daysOfWeek.map(d => <div key={d} className="dp-day-label">{d}</div>)}
          </div>
          
          <div className="dp-days-grid">
            {calendarGrid.map((item, index) => {
              let className = "dp-day-cell";
              if (item.type === 'selected-start' || item.type === 'selected-end') className += " selected";
              if (item.type === 'range') className += " in-range";
              if (item.type === 'next' || item.type === 'prev') className += " other-month";
              
              return (
                <div 
                  key={index} 
                  className={className}
                  onClick={() => item.type !== 'next' && item.type !== 'prev' && handleDayClick(item.day)}
                >
                  <span className="day-number">{item.day}</span>
                  {item.type === 'current' && isSameDay(item.date, new Date()) && <div className="dp-dot"></div>}
                </div>
              );
            })}
          </div>
        </div>

      </div>

      <div className="dp-footer">
        <button className="dp-btn cancel" onClick={onClose}>Cancel</button>
        <button className="dp-btn apply" onClick={handleApply}>Apply</button>
      </div>
    </div>
  );
};

export default DatePicker;