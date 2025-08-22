import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import AuthModal from './AuthModal';
import './UserProfile.css';

const UserProfile = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const handleLoginClick = () => {
    setShowAuthModal(true);
    setShowProfileMenu(false);
  };

  const handleLogout = () => {
    logout();
    setShowProfileMenu(false);
  };

  const toggleProfileMenu = () => {
    setShowProfileMenu(!showProfileMenu);
  };

  return (
    <div className="user-profile">
      {/* Debug test - remove this later */}
      <div style={{ 
        background: 'blue', 
        color: 'white', 
        padding: '5px', 
        margin: '5px', 
        border: '2px solid cyan',
        fontSize: '12px'
      }}>
        🔵 UserProfile rendering
      </div>
      
      {isAuthenticated ? (
        <div className="user-profile-authenticated">
          <button 
            className="user-profile-button"
            onClick={toggleProfileMenu}
            aria-label="User profile menu"
          >
            <div className="user-avatar">
              {user?.username?.charAt(0).toUpperCase() || 'U'}
            </div>
            <span className="username">{user?.username}</span>
            <span className="dropdown-arrow">▼</span>
          </button>
          
          {showProfileMenu && (
            <div className="profile-dropdown">
              <div className="profile-header">
                <div className="profile-avatar">
                  {user?.username?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div className="profile-info">
                  <div className="profile-username">{user?.username}</div>
                </div>
              </div>
              <div className="profile-actions">
                <button className="profile-action-btn" onClick={handleLogout}>
                  <span className="action-icon">🚪</span>
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <button 
          className="login-button"
          onClick={handleLoginClick}
        >
          <span className="login-icon">👤</span>
          Sign In
        </button>
      )}

      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)}
        initialMode="login"
      />
    </div>
  );
};

export default UserProfile;
