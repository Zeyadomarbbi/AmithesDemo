// ScenarioCard.jsx (All classes renamed with 'scenario-card-' prefix)

import React, { useState } from 'react'; 
import { Link } from 'react-router-dom';
import { MoreVerticalIcon, ArrowRightIcon, DeleteIcon } from '../Icons'; 
import './Cards.css';

function ScenarioCard({ id, fundId, title, author, createdDate, description, isSelected, onToggle, onDelete }) {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const toggleMenu = (e) => {
        e.preventDefault();
        e.stopPropagation(); 
        setIsMenuOpen(prev => !prev);
    };

    const handleDeleteClick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        onDelete(id); 
        setIsMenuOpen(false); 
    };
    
    React.useEffect(() => {
        const handleClickOutside = () => setIsMenuOpen(false);
        if (isMenuOpen) {
            window.addEventListener('click', handleClickOutside);
        }
        return () => window.removeEventListener('click', handleClickOutside);
    }, [isMenuOpen]);


  return (
    <div className={`scenario-card ${isSelected ? 'selected-card' : ''}`}>
      
      {/* LEFT FRAME: Checkbox + Text */}
      <div className="scenario-card-left-frame"> 
        <div 
           className={`scenario-card-checkbox ${isSelected ? 'checked' : ''}`} 
           onClick={onToggle}
        >
           {isSelected && <span className="checkmark">✔</span>}
        </div>
        
        <div className="scenario-card-text-frame"> 
            <h3 className="scenario-card-title" title={title}>{title}</h3> 
            <div className="scenario-card-text-group"> 
                <p className="scenario-card-date">Created on {createdDate}</p> 
                <p className="scenario-card-author">By {author}</p> 
            </div>
        </div>
      </div>

      {/* RIGHT FRAME: Menu + Join Button */}
      <div className="scenario-card-right-frame"> 
            {/* Context Menu Container */}
            <div className="scenario-card-menu-container"> 
                <div 
                    className="scenario-card-menu-icon" 
                    onClick={toggleMenu}
                >
                    <MoreVerticalIcon />
                </div>
                
                {/* Context Menu Dropdown */}
                {isMenuOpen && (
                    <div className="scenario-card-context-menu"> 
                        {/* Delete Action Item */}
                        <div 
                            className="scenario-menu-item delete-item"
                            onClick={handleDeleteClick} 
                        >
                            <DeleteIcon />
                            <span>Delete</span>
                        </div>
                    </div>
                )}
            </div>
        
        {/* === Link === */}
        <Link 
          to={id.toString()} 
          className="scenario-card-join-btn" 
          state={{ 
            title, 
            author, 
            date: createdDate, 
            description
          }}
        >
          <span>Join</span>
          <ArrowRightIcon />
        </Link>
      </div>

    </div>
  );
}

export default ScenarioCard;