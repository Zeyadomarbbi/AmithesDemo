import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../hooks/Auth/AuthContext'; // Using the global context now
import AmethisLogo from '../assets/amethis-logo.svg';
import BackgroundImg from '../assets/background.jpg';
import Toast from '../../App/components/Toast/Toast';
import './LoginPage.css';

function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [identity, setIdentity] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastData, setToastData] = useState({ title: "", message: "", type: "success" });

  const triggerToast = (title, message, type) => {
    setToastData({ title, message, type });
    setShowToast(true);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!identity || !password) return;

    setLoading(true);

    try {
      const normalizedIdentity = identity.trim().toLowerCase();
      await login(normalizedIdentity, password);
      
      triggerToast("Success", "Logging you in...", "success");
      
      setTimeout(() => {
        navigate("/all-funds");
      }, 1000);
    } catch (err) {
      console.error("Login failed:", err);
      triggerToast(
        "Login Failed", 
        err.message || "Invalid credentials. Please try again.", 
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="login-page"
      style={{ backgroundImage: `url(${BackgroundImg})` }}
    >
      {showToast && (
        <Toast
          title={toastData.title}
          message={toastData.message}
          type={toastData.type}
          onClose={() => setShowToast(false)}
        />
      )}

      <div className="login-card">
        <div className="login-header-group">
          <img src={AmethisLogo} alt="Amethis" className="login-logo" />
          <div className="header-text-stack">
            <h1 className="header-title">Log in</h1>
            <p className="header-subtitle">
              Welcome back! Please enter your details.
            </p>
          </div>
        </div>

        <form className="login-form-container" onSubmit={handleLogin}>
          <div className="form-inputs-stack">
            <div className="text-field-desktop">
              <div className="input-with-label">
                <label className="field-label">Email or Username</label>
                <div className="input-box">
                  <input
                    type="text"
                    className="text-input"
                    placeholder="Enter your email or username"
                    value={identity}
                    onChange={(e) => setIdentity(e.target.value)}
                    required
                  />
                </div>
              </div>
            </div>

            <div className="text-field-desktop">
              <div className="input-with-label">
                <label className="field-label">Password</label>
                <div className="input-box">
                  <input
                    type="password"
                    className="text-input"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="remember-row">
            <div className="checkbox-content">
              <input type="checkbox" className="custom-checkbox" id="remember" />
              <label htmlFor="remember" className="checkbox-label">
                Remember for 30 days
              </label>
            </div>
            <span className="forgot-password-link">Forgot password?</span>
          </div>

          <div className="form-actions">
            <button
              type="submit"
              className="login-btn"
              disabled={loading}
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </div>

          <div className="signup-row">
            <span className="signup-text">Don't have an account?</span>
            <button type="button" className="signup-link-btn">Sign up</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default LoginPage;