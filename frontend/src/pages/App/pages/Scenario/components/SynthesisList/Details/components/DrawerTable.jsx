import React from 'react';
import { SortIcon, PlusIcon } from '../../Icons'; // Adjust path
import TableImage from './SynthesisTable.svg'; // Import the file
import './DrawerTable.css';

function DrawerTable() {
  return (
    <div className="drawer-table-wrapper">
      <div className="table-svg-container">
        {/* Render it as a responsive image */}
        <img 
            src={TableImage} 
            alt="Synthesis Table Preview" 
            className="table-preview-img"
        />
      </div>
    </div>
  );
}

export default DrawerTable;