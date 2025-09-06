import React, { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import LeaderboardModal from './LeaderboardModal'
import './GameInfo.css'

const GameInfo = ({ targetWords, moveCount, currentLevel, maxLevels, gameMode = 'original' }) => {
  const [showLeaderboard, setShowLeaderboard] = useState(false)
  const { isAuthenticated } = useAuth()

  return (
    <div className="game-info">
      
      <div className="game-info-header">
        <div className="game-stats">
          <p>
            Level: <span>{currentLevel}</span>/{maxLevels}
          </p>
          <p>
            Slide tiles to form the {targetWords.length === 1 ? 'word' : 'words'}: <strong>{targetWords.join(', ').toUpperCase()}</strong>
          </p>
          <p>
            Moves: <span>{moveCount}</span>
          </p>
        </div>
        <button 
          className="leaderboard-btn"
          onClick={() => setShowLeaderboard(true)}
          title={`View ${gameMode === 'original' ? 'Classic Mode' : 'Tetris Mode'} Leaderboard`}
        >
          🏆 Leaderboard
        </button>
      </div>
      
      <LeaderboardModal 
        isOpen={showLeaderboard}
        onClose={() => setShowLeaderboard(false)}
        gameMode={gameMode}
      />
    </div>
  )
}

export default GameInfo 