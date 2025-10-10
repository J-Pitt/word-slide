import React from 'react'
import './GameCompletionModal.css'

const GameCompletionModal = ({ 
  isOpen, 
  onClose, 
  stats, 
  onPlayAgain,
  isSaving = false 
}) => {
  if (!isOpen) return null
  
  const {
    totalWords = 0,
    totalMoves = 0,
    averageMovesPerLevel = 0,
    levelsCompleted = 20
  } = stats || {}
  
  return (
    <div 
      className="completion-modal-overlay"
      onClick={onClose}
    >
      <div 
        className="completion-modal"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Trophy Header */}
        <div className="completion-header">
          <div className="completion-trophy">🏆</div>
          <h1 className="completion-title">
            Congratulations!
          </h1>
          <p className="completion-subtitle">
            You've beaten all {levelsCompleted} levels!
          </p>
        </div>
        
        {/* Stats Display */}
        <div className="completion-stats">
          <div className="stat-card">
            <div className="stat-icon">🎯</div>
            <div className="stat-value">{totalWords}</div>
            <div className="stat-label">Words Solved</div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon">🔢</div>
            <div className="stat-value">{totalMoves}</div>
            <div className="stat-label">Total Moves</div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon">📊</div>
            <div className="stat-value">{averageMovesPerLevel}</div>
            <div className="stat-label">Avg per Level</div>
          </div>
        </div>
        
        {/* Message */}
        <div className="completion-message">
          <p>
            🌟 <strong>Your score has been saved to the leaderboard!</strong>
          </p>
          <p>
            Your stats will stay there forever. Ready to beat your own record?
          </p>
        </div>
        
        {/* Saving Indicator */}
        {isSaving && (
          <div className="saving-indicator">
            ⏳ Saving to leaderboard...
          </div>
        )}
        
        {/* Actions */}
        <div className="completion-actions">
          <button
            className="play-again-btn"
            onClick={onPlayAgain}
            disabled={isSaving}
          >
            🎮 Play Again
          </button>
          
          <button
            className="menu-btn"
            onClick={onClose}
            disabled={isSaving}
          >
            🏠 Main Menu
          </button>
        </div>
      </div>
    </div>
  )
}

export default GameCompletionModal

