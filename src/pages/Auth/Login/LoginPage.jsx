import React from 'react';
import { useNavigate } from 'react-router-dom';
import './LoginPage.css';
// Imports
import AmethisLogo from '../assets/amethis-logo.svg';
import BackgroundImg from '../assets/background.jpg'; // Assuming this exists as requested

function LoginPage() {
  const navigate = useNavigate();

  const handleLogin = () => {
    // Simulate login -> Redirect
    navigate('/funds/dashboard');
  };

  return (
  <div 
      className="login-page" 
      // Applied the PNG as the background image
      style={{ backgroundImage: `url(${BackgroundImg})` }}
    >
      <div className="login-card">
        
        {/* === HEADER SECTION === */}
        <div className="login-header-group">
          <img src={AmethisLogo} alt="Amethis" className="login-logo" />
          
          <div className="header-text-stack">
            <h1 className="header-title">Log in</h1>
            <p className="header-subtitle">Welcome back! Please enter your details.</p>
          </div>
        </div>

        {/* === FORM SECTION === */}
        <div className="login-form-container">
          
          {/* Form Inputs */}
          <div className="form-inputs-stack">
            
            {/* Email */}
            <div className="text-field-desktop">
              <div className="input-with-label">
                <label className="field-label">Email</label>
                <div className="input-box">
                  <input type="email" className="text-input" placeholder="Enter your email" />
                </div>
              </div>
            </div>

            {/* Password */}
            <div className="text-field-desktop">
              <div className="input-with-label">
                <label className="field-label">Password</label>
                <div className="input-box">
                  <input type="password" className="text-input" placeholder="••••••••" />
                </div>
              </div>
            </div>

          </div>

          {/* Remember & Forgot Row */}
          <div className="remember-row">
            <div className="checkbox-content">
              <input type="checkbox" className="custom-checkbox" id="remember" />
              <label htmlFor="remember" className="checkbox-label">Remember for 30 days</label>
            </div>
            <span className="forgot-password-link">Forgot password?</span>
          </div>

          {/* Actions */}
          <div className="form-actions">
            <button className="login-btn" onClick={handleLogin}>
              Sign in
            </button>
          </div>

          {/* Footer / Sign Up */}
          <div className="signup-row">
            <span className="signup-text">Don't have an account?</span>
            <button className="signup-link-btn">Sign up</button>
          </div>

        </div>

      </div>
    </div>
  );
}

export default LoginPage;