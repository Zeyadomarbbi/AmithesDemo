// ScenarioCard.jsx

import React, { useState, useEffect } from 'react'; 
import { Link } from 'react-router-dom';
import { MoreVerticalIcon } from '/src/components/Icons/MiscIcons';
import { ArrowRightIcon } from '/src/components/Icons/DirectionIcons';
import { DeleteIcon, EditIcon, DuplicateIcon } from '/src/components/Icons/InteractiveIcons'; 
import './Cards.css';

function ScenarioCard({ id, fundId, title, author, createdDate, description, isSelected, onToggle, onDelete, onEdit, onDuplicate }) {
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

    const handleEditClick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (onEdit) onEdit(id);
        setIsMenuOpen(false);
    };

    const handleDuplicateClick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (onDuplicate) onDuplicate(id);
        setIsMenuOpen(false);
    };
    
    useEffect(() => {
        const handleClickOutside = () => setIsMenuOpen(false);
        if (isMenuOpen) {
            window.addEventListener('click', handleClickOutside);
        }
        return () => window.removeEventListener('click', handleClickOutside);
    }, [isMenuOpen]);


  return (
    <div className={`scenario-card ${isSelected ? 'selected-card' : ''}`}>
      
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

      <div className="scenario-card-right-frame"> 
            <div className="scenario-card-menu-container"> 
                <div 
                    className="scenario-card-menu-icon" 
                    onClick={toggleMenu}
                >
                    <MoreVerticalIcon />
                </div>
                
                {isMenuOpen && (
                    <div className="scenario-card-context-menu"> 
                        <div 
                            className="scenario-menu-item edit-item"
                            onClick={handleEditClick} 
                        >
                            <EditIcon />
                            <span>Edit</span>
                        </div>

                        <div 
                            className="scenario-menu-item duplicate-item"
                            onClick={handleDuplicateClick} 
                        >
                            <DuplicateIcon />
                            <span>Duplicate</span>
                        </div>

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
        
        <Link 
          to={`scenario-details/${id}/portfolio`}
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