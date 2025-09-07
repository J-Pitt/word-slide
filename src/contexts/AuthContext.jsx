import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  console.log('🔍 AuthProvider initializing with:', { user, token, loading });

  // Use proxy when running on localhost to avoid CORS issues
  const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  const API_BASE = isLocalhost 
    ? '/api'
    : 'https://63jgwqvqyf.execute-api.us-east-1.amazonaws.com/dev';

  console.log('🔍 API_BASE:', API_BASE);
  console.log('🔍 NODE_ENV:', process.env.NODE_ENV);

  // Debug logging
  console.log('AuthContext state:', { user, token, loading, isAuthenticated: !!token });

  useEffect(() => {
    if (token) {
      try {
        const parts = token.split('.')
        const payload = parts.length === 3 ? JSON.parse(atob(parts[1])) : null
        if (payload?.userId && payload?.username) {
          setUser({ id: payload.userId, username: payload.username })
        }
      } catch (_) {
        // ignore decode errors
      } finally {
        setLoading(false)
      }
    } else {
      setLoading(false);
    }
  }, [token]);

  // Fetch helper with timeout to avoid UI hangs on slow/unreachable network
  const fetchWithTimeout = async (url, options = {}, timeoutMs = 15000) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(url, { ...options, signal: controller.signal });
      return response;
    } finally {
      clearTimeout(timeoutId);
    }
  };

  const fetchUserProfile = async () => {
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      // Extract userId from JWT
      const parts = token.split('.')
      const payload = parts.length === 3 ? JSON.parse(atob(parts[1])) : null
      const userId = payload?.userId
      if (!userId) {
        console.warn('No userId in token payload')
        setLoading(false)
        return
      }

      console.log('🔍 Fetching user profile for userId:', userId)
      const response = await fetch(`${API_BASE}/user/${userId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('🔍 Profile response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('🔍 Profile data received:', data);
        setUser(data.user);
      } else if (response.status === 401) {
        console.log('🔍 Token expired, logging out');
        logout();
      } else {
        console.log('🔍 Profile request failed with status:', response.status);
        // Don't logout on other errors, just set user to null
        setUser(null);
      }
    } catch (error) {
      console.error('🔍 Error fetching user profile:', error);
      // Don't logout on network errors, just set user to null
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (username, password) => {
    try {
      const normalizedUsername = (username ?? '').trim();
      const normalizedPassword = password ?? '';
      const response = await fetchWithTimeout(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username: normalizedUsername, password: normalizedPassword }),
      });

      let data = {};
      try {
        data = await response.json();
      } catch (_) {
        // Non-JSON response; leave data as empty object
      }

      if (response.ok) {
        setToken(data.token);
        setUser(data.user);
        localStorage.setItem('token', data.token);
        
        // No profile fetch needed; decode JWT already sets user
        
        return { success: true };
      } else {
        const errorMessage = data?.error || `Login failed (${response.status})`;
        return { success: false, error: errorMessage };
      }
    } catch (error) {
      console.error('Login error:', error);
      const isAbort = error?.name === 'AbortError';
      return { success: false, error: isAbort ? 'Request timed out. Try again.' : 'Network error' };
    }
  };

  const register = async (username, password) => {
    try {
      const normalizedUsername = (username ?? '').trim();
      const normalizedPassword = password ?? '';
      const response = await fetchWithTimeout(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username: normalizedUsername, password: normalizedPassword }),
      });

      let data = {};
      try {
        data = await response.json();
      } catch (_) {
        // Non-JSON response; leave data as empty object
      }

      if (response.ok) {
        setToken(data.token);
        setUser(data.user);
        localStorage.setItem('token', data.token);
        
        // No profile fetch needed; decode JWT already sets user
        
        return { success: true };
      } else {
        const errorMessage = data?.error || `Registration failed (${response.status})`;
        return { success: false, error: errorMessage };
      }
    } catch (error) {
      console.error('Registration error:', error);
      const isAbort = error?.name === 'AbortError';
      return { success: false, error: isAbort ? 'Request timed out. Try again.' : 'Network error' };
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
  };

  const updateGameStats = async (gameMode, wordsSolved, totalMoves, level, sessionDuration) => {
    if (!token) return;

    try {
      // Extract user ID from JWT token (this is a simple base64 decode)
      const tokenParts = token.split('.');
      if (tokenParts.length === 3) {
        const payload = JSON.parse(atob(tokenParts[1]));
        const userId = payload.userId;
        
        console.log('🔍 Updating game stats for user:', userId);
        
        await fetch(`${API_BASE}/game/stats`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            userId,
            gameMode,
            wordsSolved,
            totalMoves,
            level,
            sessionDuration
          }),
        });
      }
    } catch (error) {
      console.error('🔍 Error updating game stats:', error);
    }
  };

  const value = {
    user,
    token,
    loading,
    login,
    register,
    logout,
    updateGameStats,
    isAuthenticated: !!token
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
