import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import './LeaderboardModal.css';

const LeaderboardModal = ({ isOpen, onClose, gameMode = 'original' }) => {
  const [leaderboard, setLeaderboard] = useState([]);
  const [userStats, setUserStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { token, user } = useAuth();

  const API_BASE = process.env.NODE_ENV === 'production' 
    ? process.env.REACT_APP_API_BASE || 'https://63jgwqvqyf.execute-api.us-east-1.amazonaws.com/dev'
    : 'http://localhost:3001/api';

  useEffect(() => {
    if (isOpen) {
      fetchLeaderboard();
      if (token) {
        fetchUserStats();
      }
    }
  }, [isOpen, gameMode, token]);

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/game/leaderboard?gameMode=${gameMode}&limit=20`);
      
      if (response.ok) {
        const data = await response.json();
        setLeaderboard(data.leaderboard);
      } else {
        setError('Failed to fetch leaderboard');
      }
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserStats = async () => {
    try {
      const response = await fetch(`${API_BASE}/user/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        const currentModeStats = data.stats.find(stat => stat.game_mode === gameMode);
        setUserStats(currentModeStats);
      }
    } catch (error) {
      console.error('Error fetching user stats:', error);
    }
  };

  const formatNumber = (num) => {
    return num.toLocaleString();
  };

  const getRankIcon = (rank) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };

  if (!isOpen) return null;

  return (
    <div className="leaderboard-modal-overlay" onClick={onClose}>
      <div className="leaderboard-modal" onClick={(e) => e.stopPropagation()}>
        <div className="leaderboard-header">
          <h2>{gameMode === 'original' ? 'Classic Mode' : 'Tetris Mode'} Leaderboard</h2>
          <button className="leaderboard-close-btn" onClick={onClose}>×</button>
        </div>

        <div className="leaderboard-content">
          {error && <div className="leaderboard-error">{error}</div>}
          
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
                      <span className="stat-value">{formatNumber(userStats.words_solved)}</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">Total Moves:</span>
                      <span className="stat-value">{formatNumber(userStats.total_moves)}</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">Games Played:</span>
                      <span className="stat-value">{formatNumber(userStats.games_played)}</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">Best Score:</span>
                      <span className="stat-value">{formatNumber(userStats.best_score)}</span>
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
                  <div className="games-col">Games</div>
                </div>
                
                <div className="table-body">
                  {leaderboard.map((player, index) => (
                    <div key={index} className={`table-row ${index < 3 ? 'top-three' : ''}`}>
                      <div className="rank-col">
                        <span className="rank-icon">{getRankIcon(index + 1)}</span>
                      </div>
                      <div className="player-col">{player.username}</div>
                      <div className="words-col">{formatNumber(player.words_solved)}</div>
                      <div className="moves-col">{formatNumber(player.total_moves)}</div>
                      <div className="games-col">{formatNumber(player.games_played)}</div>
                    </div>
                  ))}
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
