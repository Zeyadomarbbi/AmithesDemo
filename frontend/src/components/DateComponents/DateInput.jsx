import React, { useState, useRef, useEffect, useLayoutEffect, useCallback } from 'react';
import ReactDOM from 'react-dom';
import DatePicker from './DatePicker/DatePicker'; 
import './DatePicker/DatePicker.css'; 

const CalendarIcon = () => (
  <svg width="14" height="15" viewBox="0 0 14 15" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path fillRule="evenodd" clipRule="evenodd" d="M4 0C4.36819 0 4.66667 0.298477 4.66667 0.666667V1.33333H8.66667V0.666667C8.66667 0.298477 8.96514 0 9.33333 0C9.70152 0 10 0.298477 10 0.666667V1.33442C10.317 1.3366 10.594 1.34314 10.8346 1.3628C11.2093 1.39341 11.5538 1.45912 11.8773 1.62398C12.3791 1.87964 12.787 2.28759 13.0427 2.78936C13.2075 3.11292 13.2733 3.45738 13.3039 3.83212C13.3333 4.19291 13.3333 4.63581 13.3333 5.17245V10.8276C13.3333 11.3642 13.3333 11.8071 13.3039 12.1679C13.2733 12.5426 13.2075 12.8871 13.0427 13.2106C12.787 13.7124 12.3791 14.1204 11.8773 14.376C11.5538 14.5409 11.2093 14.6066 10.8346 14.6372C10.4738 14.6667 10.0309 14.6667 9.49422 14.6667H3.83912C3.30248 14.6667 2.85958 14.6667 2.49878 14.6372C2.12405 14.6066 1.77958 14.5409 1.45603 14.376C0.95426 14.1204 0.546312 13.7124 0.29065 13.2106C0.125789 12.8871 0.0600798 12.5426 0.029463 12.1679C-1.52091e-05 11.8071 -8.21607e-06 11.3642 2.87528e-07 10.8275V5.17247C-8.21607e-06 4.63582 -1.52091e-05 4.19291 0.029463 3.83212C0.0600798 3.45738 0.125789 3.11292 0.29065 2.78936C0.546312 2.28759 0.95426 1.87964 1.45603 1.62398C1.77958 1.45912 2.12405 1.39341 2.49878 1.3628C2.73932 1.34314 3.01636 1.3366 3.33333 1.33442V0.666667C3.33333 0.298477 3.63181 0 4 0ZM3.33333 2.66784C3.03632 2.66993 2.80309 2.67571 2.60736 2.6917C2.31508 2.71558 2.16561 2.75887 2.06135 2.81199C1.81046 2.93982 1.60649 3.1438 1.47866 3.39468C1.42553 3.49895 1.38225 3.64842 1.35837 3.94069C1.33385 4.24075 1.33333 4.62895 1.33333 5.2V5.33333H12V5.2C12 4.62895 11.9995 4.24075 11.975 3.94069C11.9511 3.64842 11.9078 3.49895 11.8547 3.39468C11.7268 3.1438 11.5229 2.93982 11.272 2.81199C11.1677 2.75886 11.0183 2.71558 10.726 2.6917C10.5302 2.67571 10.297 2.66993 10 2.66784V3.33333C10 3.70152 9.70152 4 9.33333 4C8.96514 4 8.66667 3.70152 8.66667 3.33333V2.66667H4.66667V3.33333C4.66667 3.70152 4.36819 4 4 4C3.63181 4 3.33333 3.70152 3.33333 3.33333V2.66784ZM12 6.66667H1.33333V10.8C1.33333 11.3711 1.33385 11.7592 1.35837 12.0593C1.38225 12.3516 1.42553 12.5011 1.47866 12.6053C1.60649 12.8562 1.81046 13.0602 2.06135 13.188C2.16561 13.2411 2.31508 13.2844 2.60736 13.3083C2.90742 13.3328 3.29561 13.3333 3.86667 13.3333H9.46667C10.0377 13.3333 10.4259 13.3328 10.726 13.3083C11.0183 13.2844 11.1677 13.2411 11.272 13.188C11.5229 13.0602 11.7268 12.8562 11.8547 12.6053C11.9078 12.5011 11.9511 12.3516 11.975 12.0593C11.9995 11.7592 12 11.3711 12 10.8V6.66667Z" fill="#375A89"/>
  </svg>
);

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