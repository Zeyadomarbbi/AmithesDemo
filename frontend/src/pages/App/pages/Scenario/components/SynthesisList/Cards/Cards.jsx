import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MoreVerticalIcon, DashboardIcon, DeleteIcon} from '../Icons'; 
import './Cards.css';

function SynthesisCards({ id, fundId, title, author, createdDate, links, description, onDelete}) {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    useEffect(() => {
        const handleClickOutside = () => setIsMenuOpen(false);
        if (isMenuOpen) {
            window.addEventListener('click', handleClickOutside);
        }
        return () => window.removeEventListener('click', handleClickOutside);
    }, [isMenuOpen]);

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

    return (
      <Link 
        // FIX: Match the segment defined in main.jsx
        to={`synthesis-details/${id}`} 
        
        state={{ 
            synthesisId: id,
            synthesisTitle: title,
            synthesisAuthor: author,
            synthesisCreatedDate: createdDate,
            synthesisLinks: links,
            synthesisDescription: description
        }}
        className="synthesis-card-link"
      >
        <div className="synthesis-card">
          <div className="synth-left-frame">
            <div className="synth-icon-wrapper">
              <DashboardIcon /> 
            </div>
            
            <div className="synth-text-frame">
              <h3 className="synth-title" title={title}>{title}</h3>
              <p className="synth-author">By {author}</p>
              <p className="synth-date">Created on {createdDate}</p>
              
              <div className="synth-links-frame">
                {links.map((link, i) => (
                  <span key={i} className="synth-link-item">{link}</span>
                ))}
              </div>
            </div>
          </div>

          <div className="synth-right-frame">
                <div className="synthesis-card-menu-container"> 
                    <div 
                        className="synth-menu-icon" 
                        onClick={toggleMenu}
                    >
                        <MoreVerticalIcon />
                    </div>
                    
                    {isMenuOpen && (
                        <div className="synthesis-card-context-menu">
                            <div 
                                className="synthesis-menu-item delete-item" 
                                onClick={handleDeleteClick}
                            >
                                <DeleteIcon />
                                <span>Delete</span>
                            </div>
                        </div>
                    )}
                </div>
          </div>
        </div>
      </Link>
    );
}

export default SynthesisCards;