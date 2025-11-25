import React from 'react';
import { useParams } from 'react-router-dom';
import './Header.css';

function Header() {
  const { fundId } = useParams();
  const funds = [
    { id: 1, name: 'Asterium Fund I', code: 'AST' },
    { id: 2, name: 'Lynx Capital II', code: 'LYN' },
    { id: 3, name: 'Orion Partners III', code: 'ORI' },
    { id: 4, name: 'Silvergate Ventures', code: 'SIL' },
    { id: 5, name: 'Huron Growth Fund', code: 'HUR' },
    { id: 6, name: 'Pioneer Equity I', code: 'PIO' },
  ];

  const currentFund = funds.find(f => f.id.toString() === fundId);
  if (!currentFund) return <header className="top-header"></header>;
  return (
    <header className="top-header">
      {/* Frame 1261155388: The text container */}
      <div className="header-text-container">
        <span className="header-fund-name">{currentFund.name}</span>
      </div>
      
      {/* Note: Your CSS had "display: none" for the search bar, 
        settings, and user avatar frames on the right side.
        If you want to add them later, we can put them here.
      */}
    </header>
  );
}

export default Header;