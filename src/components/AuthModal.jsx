import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import './AuthModal.css';

const AuthModal = ({ isOpen, onClose, initialMode = 'login' }) => {
  const [mode, setMode] = useState(initialMode);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [resultMessage, setResultMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const { login, register } = useAuth() || {};

  if (!isOpen) {
    return null;
  }

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError(''); // Clear error when user types
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      let result;
      
      if (mode === 'login') {
        result = await login(formData.username, formData.password);
      } else {
        // Registration validation
        if (formData.password !== formData.confirmPassword) {
          setError('Passwords do not match');
          setLoading(false);
          return;
        }
        
        if (formData.password.length < 6) {
          setError('Password must be at least 6 characters long');
          setLoading(false);
          return;
        }

        if (formData.username.trim().length < 3) {
          setError('Username must be at least 3 characters long');
          setLoading(false);
          return;
        }

        result = await register(formData.username, formData.password);
      }

      if (result.success) {
        setResultMessage(mode === 'login' ? 'Login Successful! 🎉' : 'Account Created Successfully! 🎉');
        setIsSuccess(true);
        setShowResult(true);
        setFormData({ username: '', password: '', confirmPassword: '' });
        // Close the modal after 2 seconds
        setTimeout(() => {
          setShowResult(false);
          onClose();
        }, 2000);
      } else {
        setResultMessage(result.error);
        setIsSuccess(false);
        setShowResult(true);
        // Hide error after 3 seconds
        setTimeout(() => {
          setShowResult(false);
        }, 3000);
      }
    } catch (error) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const switchMode = () => {
    setMode(mode === 'login' ? 'register' : 'login');
    setError('');
    setFormData({ username: '', password: '', confirmPassword: '' });
  };

  return (
    <div className="auth-modal-overlay" onClick={onClose} style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.7)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 10000,
      backdropFilter: 'blur(5px)'
    }}>
      <div className="auth-modal" onClick={(e) => e.stopPropagation()} style={{
        position: 'relative',
        zIndex: 10001
      }}>
        <div className="auth-modal-header">
          <h2>{mode === 'login' ? 'Welcome Back' : 'Join the Game'}</h2>
          <button className="auth-close-btn" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {error && <div className="auth-error">{error}</div>}
          
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleInputChange}
              required
              placeholder="Enter username (min 3 characters)"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              required
              placeholder="Enter password (min 6 characters)"
            />
          </div>

          {mode === 'register' && (
            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                required
                placeholder="Confirm your password"
              />
            </div>
          )}

          <button 
            type="submit" 
            className="auth-submit-btn"
            disabled={loading}
          >
            {loading ? 'Loading...' : (mode === 'login' ? 'Sign In' : 'Create Account')}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            {mode === 'login' ? "Don't have an account? " : "Already have an account? "}
            <button 
              type="button" 
              className="auth-switch-btn"
              onClick={switchMode}
            >
              {mode === 'login' ? 'Sign Up' : 'Sign In'}
            </button>
          </p>
        </div>
      </div>

      {/* Result Modal */}
      {showResult && (
        <div style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 10002,
          background: 'linear-gradient(135deg, #F5DEB3, #DEB887)',
          color: '#654321',
          border: '3px solid #8B4513',
          padding: 'clamp(20px, 5vw, 30px) clamp(30px, 8vw, 50px)',
          fontSize: 'clamp(18px, 5vw, 22px)',
          fontWeight: 'bold',
          borderRadius: '12px',
          minHeight: '80px',
          minWidth: '250px',
          boxShadow: '0 8px 16px rgba(139, 69, 19, 0.4), inset 0 2px 0 rgba(255, 255, 255, 0.3), inset 0 -2px 0 rgba(0, 0, 0, 0.2)',
          textAlign: 'center',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          textShadow: '0 1px 2px rgba(255, 255, 255, 0.5)',
          animation: isSuccess ? 'successPulse 0.5s ease-in-out' : 'errorShake 0.5s ease-in-out'
        }}>
          {resultMessage}
        </div>
      )}
    </div>
  );
};

export default AuthModal;
