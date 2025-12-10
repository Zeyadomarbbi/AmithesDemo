import React, { useState, useEffect } from 'react'; // MUST include useEffect
import { Link } from 'react-router-dom';
import { MoreVerticalIcon, DashboardIcon, DeleteIcon} from '../Icons'; 
import './Cards.css';

// FIX: Added useEffect dependency back based on previous steps, assuming the user removed it accidentally.
function SynthesisCards({ id, fundId, title, author, createdDate, links , onDelete}) {
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
    
    // useEffect is necessary for closing the menu when clicking outside

    return (
      <Link to={`/funds/${fundId}/scenarios/synthesis/${id}`} className="synthesis-card-link">
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

          {/* MODIFICATION: Add context menu structure to synth-right-frame */}
          <div className="synth-right-frame">
                {/* Context Menu Container */}
                <div className="synthesis-card-menu-container"> 
                    <div 
                        className="synth-menu-icon" 
                        onClick={toggleMenu} // Use toggle handler
                    >
                        <MoreVerticalIcon />
                    </div>
                    
                    {/* Context Menu Dropdown */}
                    {isMenuOpen && (
                        <div className="synthesis-card-context-menu">
                            {/* Delete Action Item */}
                            <div 
                                className="synthesis-menu-item delete-item" 
                                onClick={handleDeleteClick} // Use delete handler
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