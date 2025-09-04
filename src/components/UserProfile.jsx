import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import AuthModal from './AuthModal';
import './UserProfile.css';

const UserProfile = () => {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [authError, setAuthError] = useState(null);

  console.log('🔍 UserProfile component rendering...');

  // Wrap useAuth in try-catch to prevent crashes
  let auth = null;
  try {
    auth = useAuth();
    console.log('🔍 Auth context loaded:', auth);
  } catch (error) {
    console.error('🔍 AuthContext error:', error);
    setAuthError(error.message);
  }

  const { user, isAuthenticated, logout } = auth || {};
  
  console.log('🔍 UserProfile state:', { user, isAuthenticated, authError });

  const handleLoginClick = () => {
    setShowAuthModal(true);
    setShowProfileMenu(false);
  };

  const handleLogout = () => {
    if (logout) logout();
    setShowProfileMenu(false);
  };

  const toggleProfileMenu = () => {
    setShowProfileMenu(!showProfileMenu);
  };

  // Show error state if auth context failed
  if (authError) {
    return (
      <div className="user-profile">
        <div style={{ 
          background: 'red', 
          color: 'white', 
          padding: '10px', 
          margin: '5px', 
          border: '2px solid darkred',
          borderRadius: '5px',
          fontSize: '12px'
        }}>
          🔴 Auth Error: {authError}
        </div>
        <button 
          className="login-button"
          onClick={handleLoginClick}
          style={{ marginTop: '10px' }}
        >
          <span className="login-icon">👤</span>
          Sign In (Fallback)
        </button>
      </div>
    );
  }

  return (
    <div className="user-profile" style={{
      border: '3px solid red',
      padding: '20px',
      margin: '20px',
      background: 'rgba(255, 0, 0, 0.1)',
      borderRadius: '10px',
      // Ensure this component is above everything
      position: 'relative',
      zIndex: 9999
    }}>
      {/* Debug test - remove this later */}
      <div style={{ 
        background: 'red', 
        color: 'white', 
        padding: '10px', 
        margin: '10px', 
        border: '2px solid darkred',
        borderRadius: '5px',
        fontSize: '16px',
        fontWeight: 'bold'
      }}>
        🔴 UserProfile Component Rendered - Auth: {isAuthenticated ? 'Yes' : 'No'}
      </div>
      
      <div>
        <div style={{ 
          background: 'yellow', 
          color: 'black', 
          padding: '15px', 
          margin: '15px', 
          border: '3px solid orange',
          borderRadius: '10px',
          fontSize: '18px',
          fontWeight: 'bold'
        }}>
          🟡 DEBUG: isAuthenticated = {String(isAuthenticated)}, user = {String(user)}
        </div>
        
        {isAuthenticated ? (
          <div className="user-profile-authenticated">
            <div style={{ background: 'green', color: 'white', padding: '10px', margin: '10px' }}>
              🔵 User is authenticated - showing profile
            </div>
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
          <div>
            <div style={{ background: 'orange', color: 'black', padding: '10px', margin: '10px' }}>
              🟠 User is NOT authenticated - should show Sign In button
            </div>
            
            {/* FORCE VISIBLE BUTTON */}
            <div style={{ 
              background: 'lime', 
              color: 'black', 
              padding: '10px', 
              margin: '10px', 
              border: '3px solid green',
              borderRadius: '10px'
            }}>
              🟢 FORCED VISIBLE SIGN IN BUTTON:
            </div>
            
            <button 
              className="login-button"
              onClick={handleLoginClick}
              style={{
                background: 'linear-gradient(135deg, #F5DEB3, #DEB887)',
                color: '#654321',
                border: '3px solid #8B4513',
                padding: 'clamp(12px, 3vw, 16px) clamp(20px, 5vw, 30px)',
                borderRadius: '12px',
                fontSize: 'clamp(16px, 4vw, 18px)',
                fontWeight: 'bold',
                cursor: 'pointer',
                minHeight: '48px',
                minWidth: '140px',
                boxShadow: '0 8px 16px rgba(139, 69, 19, 0.4), inset 0 2px 0 rgba(255, 255, 255, 0.3)',
                transition: 'all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                touchAction: 'manipulation',
                textShadow: '0 1px 2px rgba(255, 255, 255, 0.5)',
                position: 'relative',
                overflow: 'hidden',
                // Force visibility and layering
                display: 'block !important',
                visibility: 'visible !important',
                opacity: '1 !important',
                zIndex: '10000 !important',
                // Ensure it's above everything
                position: 'relative',
                transform: 'translateZ(0)'
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'translateY(-3px) scale(1.02)'
                e.target.style.boxShadow = '0 12px 24px rgba(139, 69, 19, 0.6), inset 0 2px 0 rgba(255, 255, 255, 0.4)'
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0) scale(1)'
                e.target.style.boxShadow = '0 8px 16px rgba(139, 69, 19, 0.4), inset 0 2px 0 rgba(255, 255, 255, 0.3)'
              }}
            >
              <span className="login-icon">👤</span>
              Sign In
            </button>
            
            {/* ADDITIONAL DEBUG INFO */}
            <div style={{ 
              background: 'cyan', 
              color: 'black', 
              padding: '10px', 
              margin: '10px', 
              border: '2px solid blue',
              borderRadius: '5px',
              fontSize: '14px'
            }}>
              🔵 Button rendered with onClick handler: {String(handleLoginClick)}
            </div>
          </div>
        )}
      </div>

      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)}
        initialMode="login"
      />
    </div>
  );
};

export default UserProfile;
