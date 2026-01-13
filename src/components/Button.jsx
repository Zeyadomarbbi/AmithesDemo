// in: frontend/src/components/Button.jsx

import React from 'react';

// 1. Add 'onClick' and 'variant' to the props
function Button({ children, onClick, variant = 'primary' }) {
  
  // 2. Add the 'onClick' prop to the button element
  // We'll also add a class for styling
  return (
    <button
      className={`button ${variant}`} // e.g., "button primary" or "button secondary"
      onClick={onClick}
    >
      {children}
    </button>
  );
}

export default Button;