import React from 'react';
import { useNavigate } from 'react-router-dom';
import './LoginPage.css';
// Go up 3 levels to find the global assets folder
import AmethisLogo from '../../../assets/amethis-logo.svg';

function LoginPage() {
  const navigate = useNavigate();

  const handleLogin = () => {
    // Simulate login success -> Redirect to the App World
    // In a real app, you would validate email/password here
    navigate('/funds/1/dashboard');
  };

  return (
    <div className="login-page">
      <div className="login-card">
        
        {/* Logo Section */}
        <div className="login-header">
          <img src={AmethisLogo} alt="Amethis" className="login-logo" />
        </div>

        <div className="login-body">
          <h1>Welcome Back</h1>
          <p>Enter your credentials to access your funds.</p>

          {/* Form Inputs (Visual only for now) */}
          <div className="input-group">
            <label>Email</label>
            <input type="email" placeholder="name@company.com" />
          </div>
          
          <div className="input-group">
            <label>Password</label>
            <input type="password" placeholder="••••••••" />
          </div>

          <button className="login-btn" onClick={handleLogin}>
            Sign In
          </button>

          <div className="login-footer">
            <span>Forgot password?</span>
          </div>
        </div>

      </div>
    </div>
  );
}

export default LoginPage;