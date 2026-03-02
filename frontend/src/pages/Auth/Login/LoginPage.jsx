import React from 'react';
import { useNavigate } from 'react-router-dom';
import useLogin from './useLogin';
import AmethisLogo from '../assets/amethis-logo.svg';
import BackgroundImg from '../assets/background.jpg';
import './LoginPage.css';

function LoginPage() {
  const navigate = useNavigate();
  const { login, loading, error } = useLogin();

  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");

  const handleLogin = async (e) => {
    e.preventDefault(); // prevent page refresh

    if (!email || !password) return;

    try {
      await login(email, password);
      navigate("/all-funds");
    } catch (err) {
      console.log("Login failed");
    }
  };

  return (
    <div
      className="login-page"
      style={{ backgroundImage: `url(${BackgroundImg})` }}
    >
      <div className="login-card">

        {/* === HEADER SECTION === */}
        <div className="login-header-group">
          <img src={AmethisLogo} alt="Amethis" className="login-logo" />

          <div className="header-text-stack">
            <h1 className="header-title">Log in</h1>
            <p className="header-subtitle">
              Welcome back! Please enter your details.
            </p>
          </div>
        </div>

        {/* === FORM SECTION === */}
        <form className="login-form-container" onSubmit={handleLogin}>

          <div className="form-inputs-stack">

            {/* Email */}
            <div className="text-field-desktop">
              <div className="input-with-label">
                <label className="field-label">Email</label>
                <div className="input-box">
                  <input
                    type="email"
                    className="text-input"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Password */}
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

          {/* Remember & Forgot Row */}
          <div className="remember-row">
            <div className="checkbox-content">
              <input
                type="checkbox"
                className="custom-checkbox"
                id="remember"
              />
              <label htmlFor="remember" className="checkbox-label">
                Remember for 30 days
              </label>
            </div>
            <span className="forgot-password-link">
              Forgot password?
            </span>
          </div>

          {/* Error Message */}
          {error && (
            <p className="error-message">
              {error}
            </p>
          )}

          {/* Actions */}
          <div className="form-actions">
            <button
              type="submit"
              className="login-btn"
              disabled={loading}
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </div>

          {/* Footer / Sign Up */}
          <div className="signup-row">
            <span className="signup-text">
              Don't have an account?
            </span>
            <button type="button" className="signup-link-btn">
              Sign up
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}

export default LoginPage;