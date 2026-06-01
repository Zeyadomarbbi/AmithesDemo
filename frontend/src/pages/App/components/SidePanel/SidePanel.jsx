// SidePanel.jsx
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../../hooks/Auth/AuthContext';
import { useFundData } from '../../hooks/Core/FundContext'; 
import { useActiveFund } from '../../hooks/useActiveFund';
import Toast from '../Toast/Toast';
import SearchBar from '../../../../components/SearchBar/SearchBar';
import { DashboardTabIcon, PortfolioIcon, FinancialsIcon, ScenariosIcon, LPsIcon, AllFundsIcons, AdminsIcon, HelpIcon, SettingsIcon, DealflowIcon } from '/src/components/Icons/MiscIcons';
import { ChevronDownIconWhite, ProfileExpandIcon } from '/src/components/Icons/DirectionIcons';
import { LogoutIcon, AccountIcon } from '/src/components/Icons/InteractiveIcons';
import { AmethisLOGO } from '/src/components/Icons/MiscIcons';

import './SidePanel.css';

function SidePanel() {
  const { user, logout } = useAuth();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [showLogoutToast, setShowLogoutToast] = useState(false);
  const profileRef = useRef(null);
  const [isFundSelectorOpen, setIsFundSelectorOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  const { funds } = useFundData();
  const activeFundId = useActiveFund();
  
  const location = useLocation();
  const navigate = useNavigate();
  const fundSelectorRef = useRef(null);

  const pathSegments = location.pathname.split('/');
  const currentSection = pathSegments[1] === 'funds' && pathSegments[3] 
    ? pathSegments[3] 
    : 'dashboard';

  const filteredFunds = useMemo(() => {
    return (funds || []).filter(fund => 
      fund.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      fund.code?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [funds, searchQuery]);

  const currentFund = useMemo(() => 
    (funds && activeFundId) 
      ? funds.find(f => f.id.toString() === activeFundId.toString()) 
      : null,
  [funds, activeFundId]);

  const hasActiveFund = !!currentFund;

  const handleSwitchFund = (newFundId) => {
    navigate(`/funds/${newFundId}/${currentSection}`);
    setIsFundSelectorOpen(false);
    setSearchQuery("");
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
      if (fundSelectorRef.current && !fundSelectorRef.current.contains(event.target)) {
        setIsFundSelectorOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getInitials = (name) => {
    if (!name) return "U";
    const parts = name.split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name[0].toUpperCase();
  };

  const handleLogoutClick = async () => {
    try {
      setShowLogoutToast(true);
      setIsProfileOpen(false);
      setTimeout(async () => {
        await logout();
      }, 800); 
    } catch (err) {
      console.error("Logout failed:", err);
      setShowLogoutToast(false);
    }
  };

  return (
    <div className="side-panel">
      {showLogoutToast && (
        <Toast 
          title="Logged Out" 
          message="See you soon!" 
          type="success" 
          onClose={() => setShowLogoutToast(false)} 
        />
      )}   
      <div className="frame-1">
        <div className="logo-container">
          <AmethisLOGO />
          <span className="logo-title">AMETHIS</span>
        </div>

        <div className="frame-1-2">
          <div className="fund-selector-container" ref={fundSelectorRef}>

            <div className="fund-selector-button">
              <div className="fund-info-section">
                <span className="side-panel-fund-name">
                  {currentFund ? currentFund.name : 'Select a fund'}
                </span>
                
                {hasActiveFund && (user?.is_staff || user?.is_superuser) && (
                  <Link 
                    to={`/funds/${currentFund.id}/settings`} 
                    className="fund-setup-row"
                  >
                    <SettingsIcon />
                    <span className="fund-setup">Fund setup</span>
                  </Link>
                )}
              </div>

              <div 
                className={`dropdown-arrow-icon ${isFundSelectorOpen ? 'open' : ''}`}
                onClick={() => setIsFundSelectorOpen(!isFundSelectorOpen)}
              >
                <ChevronDownIconWhite />
              </div>
            </div>
            
            {isFundSelectorOpen && (
              <div className="fund-selector-dropdown">
                
                <div className="side-panel-search-wrapper">
                  <SearchBar 
                    placeholder="Search by name or code"
                    onSearch={(value) => setSearchQuery(value)}
                  />
                </div>

                <div className="dropdown-scroll">
                  {filteredFunds.length > 0 ? (
                    filteredFunds.map(fund => (
                      <div
                        key={fund.id}
                        className={`side-panel-dropdown-item ${fund.id.toString() === activeFundId?.toString() ? 'selected' : ''}`}
                        onClick={() => handleSwitchFund(fund.id)}
                      >
                        <div className="side-panel-dropdown-item-content">
                          <span className="side-panel-item-name">{fund.name}</span> 
                          <span className="side-panel-item-code">{fund.code}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="dropdown-no-results" style={{ padding: '12px', fontSize: '14px', color: '#6b7280', textAlign: 'center' }}>
                      No funds found
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {hasActiveFund && (
            <nav className="side-panel-nav">
              <NavLink to={`/funds/${activeFundId}/dashboard`} className="nav-item">
                <DashboardTabIcon /> <span>Dashboard</span>
              </NavLink>
              <NavLink to={`/funds/${activeFundId}/lps-statement`} className="nav-item">
                <LPsIcon /> <span>LPs Statement</span>
              </NavLink>
              <NavLink to={`/funds/${activeFundId}/portfolio`} className="nav-item">
                <PortfolioIcon /> <span>Portfolio</span>
              </NavLink>
              <NavLink to={`/funds/${activeFundId}/financials`} className="nav-item">
                <FinancialsIcon /> <span>Financials</span>
              </NavLink>
              <NavLink to={`/funds/${activeFundId}/scenario-dashboard`} className="nav-item">
                <ScenariosIcon /> <span>Scenarios</span>
              </NavLink>
            </nav>
          )}
          
          {hasActiveFund && <div className="sidebar-separator"></div>}

        </div>
      </div>

      <div className="frame-2-waves"></div>

      <div className="frame-3">
        <div className="footer-links">
          {hasActiveFund && (
            <NavLink to={`/funds/${activeFundId}/dealflow`} className="footer-item">
              <DealflowIcon /> <span>Dealflow</span>
            </NavLink>
          )}
          <NavLink to="/all-funds" className="footer-item">
            <AllFundsIcons /> <span>All funds</span>
          </NavLink>
          
          {(user?.is_staff || user?.is_superuser) && (
            <NavLink to="/admins" className="footer-item">
              <AdminsIcon /> <span>Admins</span>
            </NavLink>
          )}
          
          <NavLink to="/help" className="footer-item">
            <HelpIcon /> <span>Help</span>
          </NavLink>
        </div>

        <div className="user-profile-wrapper" ref={profileRef}>
          {isProfileOpen && (
            <div className="profile-dropdown-menu">
              <Link
                to="/settings/profile"
                className="profile-menu-item"
                onClick={() => setIsProfileOpen(false)}
              >
                <AccountIcon />
                <span>Account Settings</span>
              </Link>
              <button onClick={handleLogoutClick} className="profile-menu-item">
                <LogoutIcon />
                <span>Logout</span>
              </button>
            </div>
          )}
          
          <div 
            className={`user-profile ${isProfileOpen ? 'active' : ''}`} 
            onClick={() => setIsProfileOpen(!isProfileOpen)}
          >
            <div className="user-avatar">
              {getInitials(
                (user?.first_name && user?.last_name)
                  ? `${user.first_name} ${user.last_name}`
                  : user?.username || user?.email
              )}
            </div>
            <div className="user-details">
              <span className="user-name">
                {(user?.first_name || user?.last_name)
                  ? `${user.first_name || ''} ${user.last_name || ''}`.trim()
                  : user?.username || 'User'}
              </span>
              <span className="user-email">{user?.email}</span>
            </div>
            <div className={`profile-arrow ${isProfileOpen ? 'rotate' : ''}`}>
              <ProfileExpandIcon />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SidePanel;