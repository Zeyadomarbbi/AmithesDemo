import React, { useState, useRef, useEffect, useLayoutEffect, useCallback } from 'react';
import ReactDOM from 'react-dom';
import DatePicker from './DatePicker/DatePicker'; 
import { CalendarIcon } from '../Icons/InteractiveIcons';
import './DatePicker/DatePicker.css'; 

const DateInputWithPicker = ({ 
  initialDate = new Date(), 
  onDateChange,
  isSingle = true,
  dateFormat = 'DD/MM/YYYY',
  disabled = false // Added disabled prop
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(initialDate);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const [isPositionedRight, setIsPositionedRight] = useState(true);
  
  const containerRef = useRef(null);
  const popupRef = useRef(null);

  useEffect(() => {
    setSelectedDate(initialDate);
  }, [initialDate]);

  const formatDate = (date) => {
    if (!date) return '';
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    
    if (dateFormat === 'MM/DD/YYYY') return `${month}/${day}/${year}`;
    return `${day}/${month}/${year}`;
  };

  const handleApply = ({ start }) => {
    setSelectedDate(start);
    if (onDateChange) onDateChange(start);
    setIsOpen(false);
  };

  const calculatePosition = useCallback(() => {
    if (isOpen && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const scrollY = window.scrollY;
      const scrollX = window.scrollX;
      const viewPortWidth = window.innerWidth;
      const viewPortHeight = window.innerHeight;

      const POPUP_WIDTH = 320; 
      const GAP = 8;

      const spaceOnRight = viewPortWidth - rect.right;
      const spaceOnLeft = rect.left;
      let showOnRight = true; 

      const fitsOnRight = spaceOnRight >= (POPUP_WIDTH + GAP);
      const fitsOnLeft = spaceOnLeft >= (POPUP_WIDTH + GAP);

      if (fitsOnRight) showOnRight = true;
      else if (fitsOnLeft) showOnRight = false;
      else showOnRight = spaceOnRight >= spaceOnLeft;

      setIsPositionedRight(showOnRight);

      const popupHeight = popupRef.current?.offsetHeight || 400;
      const inputCenterY = rect.top + (rect.height / 2);
      
      let finalTop = rect.top + scrollY + (rect.height / 2);
      
      const popupBottom = inputCenterY + (popupHeight / 2);
      if (popupBottom > viewPortHeight) {
        const overflow = popupBottom - viewPortHeight;
        finalTop -= (overflow + 10);
      }
      
      const popupTop = inputCenterY - (popupHeight / 2);
      if (popupTop - (popupBottom > viewPortHeight ? (popupBottom - viewPortHeight + 10) : 0) < 0) {
        finalTop = scrollY + (popupHeight / 2) + 10;
      }
      
      const left = showOnRight 
        ? (rect.right + scrollX + GAP) 
        : (rect.left + scrollX - GAP);

      setCoords({ top: finalTop, left });
    }
  }, [isOpen]);

  useLayoutEffect(() => {
    if (isOpen) {
      calculatePosition();
    }
  }, [isOpen, calculatePosition]);

  useEffect(() => {
    if (!isOpen) return;
    
    let timeoutId;
    const debouncedCalc = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(calculatePosition, 10);
    };
    
    window.addEventListener('scroll', debouncedCalc, true);
    window.addEventListener('resize', debouncedCalc);
    
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('scroll', debouncedCalc, true);
      window.removeEventListener('resize', debouncedCalc);
    };
  }, [isOpen, calculatePosition]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      const isInsideTrigger = containerRef.current && containerRef.current.contains(event.target);
      const isInsidePopup = popupRef.current && popupRef.current.contains(event.target);

      if (!isInsideTrigger && !isInsidePopup) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  return (
    <>
      <div 
        className="date-input-container" 
        ref={containerRef} 
        style={{ position: 'relative', display: 'inline-block', width: '100%' }}
      >
        <div 
          onClick={() => !disabled && setIsOpen(!isOpen)} // Prevent toggle if disabled
          className={`input-trigger ${isOpen ? 'active' : ''} ${disabled ? 'disabled' : ''}`} // Added disabled class
          style={{
            display: 'flex',
            justifyContent: 'space-between', 
            alignItems: 'center',
            cursor: disabled ? 'not-allowed' : 'pointer' // Update cursor
          }}
        >
          <span className="selected-date-text">
            {formatDate(selectedDate)}
          </span>
          <CalendarIcon />
        </div>
      </div>

      {isOpen && ReactDOM.createPortal(
        <div 
          ref={popupRef}
          style={{
            position: 'absolute',
            top: coords.top,
            left: coords.left,
            zIndex: 99999,
            transform: `translateY(-50%) ${isPositionedRight ? '' : 'translateX(-100%)'}`,
            width: '320px',
            backgroundColor: '#fff', 
            borderRadius: '12px',
            boxShadow: '0px 20px 24px -4px rgba(16, 24, 40, 0.1), 0px 8px 8px -4px rgba(16, 24, 40, 0.04)',
            border: '1px solid #E4E7EC'
          }}
        >
          <DatePicker 
            isSingle={isSingle} 
            initialStartDate={selectedDate} 
            onClose={() => setIsOpen(false)} 
            onApply={handleApply}
            dateFormat={dateFormat}
          />
        </div>,
        document.body
      )}
    </>
  );
};

export default DateInputWithPicker;