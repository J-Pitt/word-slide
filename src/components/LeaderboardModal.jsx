import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import './LeaderboardModal.css';

const LeaderboardModal = ({ isOpen, onClose, gameMode = 'original' }) => {
  const [leaderboard, setLeaderboard] = useState([]);
  const [userStats, setUserStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [retryCount, setRetryCount] = useState(0);
  const { token, user } = useAuth();

  // Use proxy when running on localhost to avoid CORS issues
  const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  const API_BASE = isLocalhost 
    ? '/api'
    : 'https://63jgwqvqyf.execute-api.us-east-1.amazonaws.com/dev';

  useEffect(() => {
    if (isOpen) {
      setRetryCount(0);
      fetchLeaderboard();
      if (token) {
        fetchUserStats();
      }
    }
  }, [isOpen, gameMode, token]);

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
    fetchLeaderboard();
    if (token) {
      fetchUserStats();
    }
  };

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await fetch(`${API_BASE}/game/leaderboard?gameMode=${gameMode}&limit=20`);
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.leaderboard) {
          setLeaderboard(data.leaderboard);
        } else {
          setError('Invalid leaderboard data received');
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        setError(errorData.error || `Failed to fetch leaderboard (${response.status})`);
      }
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      setError('Unable to connect to leaderboard service. Please check your internet connection.');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserStats = async () => {
    try {
      const parts = token?.split('.')
      const payload = parts?.length === 3 ? JSON.parse(atob(parts[1])) : null
      const userId = payload?.userId
      
      if (!userId) {
        console.warn('No user ID found in token');
        return;
      }
      
      const response = await fetch(`${API_BASE}/user/${userId}/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.stats) {
          const currentModeStats = data.stats.find(stat => stat.game_mode === gameMode);
          setUserStats(currentModeStats || null);
        } else {
          console.warn('Invalid user stats data received');
        }
      } else {
        console.warn(`Failed to fetch user stats (${response.status})`);
      }
    } catch (error) {
      console.error('Error fetching user stats:', error);
    }
  };

  const formatNumber = (num) => {
    const number = Number(num);
    return isNaN(number) ? '0' : number.toLocaleString();
  };

  const validatePlayerData = (player) => {
    return {
      username: player.username || player.user_name || 'Anonymous',
      words_solved: Math.max(0, Number(player.words_solved || player.wordsSolved || 0)),
      total_moves: Math.max(0, Number(player.total_moves || player.totalMoves || 0)),
      games_played: Math.max(0, Number(player.games_played || 0))
    };
  };

  const getRankIcon = (rank) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };

  if (!isOpen) return null;

  return (
    <div
      className="leaderboard-modal-overlay"
      onClick={onClose}
      style={{
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
      }}
    >
      <div
        className="leaderboard-modal"
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'relative',
          zIndex: 10001
        }}
      >
        <div className="leaderboard-header">
          <h2>Leaderboard</h2>
          <button className="leaderboard-close-btn" onClick={onClose}>×</button>
        </div>

        <div className="leaderboard-content">
          {error && (
            <div className="leaderboard-error">
              <div>{error}</div>
              <button 
                className="retry-button" 
                onClick={handleRetry}
                disabled={loading}
              >
                {loading ? 'Retrying...' : 'Try Again'}
              </button>
            </div>
          )}
          
          {loading ? (
            <div className="leaderboard-loading">Loading leaderboard...</div>
          ) : (
            <>
              {/* User's Personal Stats */}
              {userStats && (
                <div className="personal-stats">
                  <h3>Your Stats</h3>
                  <div className="stats-grid">
                    <div className="stat-item">
                      <span className="stat-label">Words Solved:</span>
                      <span className="stat-value">{formatNumber(userStats.words_solved || 0)}</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">Total Moves:</span>
                      <span className="stat-value">{formatNumber(userStats.total_moves || 0)}</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">Games Played:</span>
                      <span className="stat-value">{formatNumber(userStats.games_played || 0)}</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">Best Score:</span>
                      <span className="stat-value">{formatNumber(userStats.best_score || 0)}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Leaderboard Table */}
              <div className="leaderboard-table">
                <h3>Top Players</h3>
                <div className="table-header">
                  <div className="rank-col">Rank</div>
                  <div className="player-col">Player</div>
                  <div className="words-col">Words</div>
                  <div className="moves-col">Moves</div>
                </div>
                
                <div className="table-body">
                  {leaderboard.map((player, index) => {
                    const validatedPlayer = validatePlayerData(player);
                    return (
                      <div 
                        key={index} 
                        className={`table-row ${index < 3 ? 'top-three' : ''}`}
                      >
                        <div className="rank-col">
                          <span className={`rank-icon ${index < 3 ? 'top-rank' : ''}`}>
                            {getRankIcon(index + 1)}
                          </span>
                        </div>
                        <div 
                          className="player-col" 
                          title={validatedPlayer.username}
                        >
                          {validatedPlayer.username}
                        </div>
                        <div className="words-col">
                          {formatNumber(validatedPlayer.words_solved)}
                        </div>
                        <div className="moves-col">
                          {formatNumber(validatedPlayer.total_moves)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {leaderboard.length === 0 && (
                <div className="no-data">
                  <p>No players yet. Be the first to set a record!</p>
                </div>
              )}
            </>
          )}
        </div>

        <div className="leaderboard-footer">
          <p>Compete with players worldwide and track your progress!</p>
        </div>
      </div>
    </div>
  );
};

export default LeaderboardModal;
