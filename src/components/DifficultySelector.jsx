import React from 'react'
import { getDifficultyColors } from '../utils/difficultySettings'
import './DifficultySelector.css'

const DifficultySelector = ({ selectedDifficulty, onSelect }) => {
  const difficulties = [1, 2, 3]
  
  return (
    <div className="difficulty-selector">
      <div className="difficulty-label">Difficulty Level:</div>
      <div className="difficulty-options">
        {difficulties.map(difficulty => {
          const colors = getDifficultyColors(difficulty)
          const isSelected = selectedDifficulty === difficulty
          
          return (
            <button
              key={difficulty}
              className={`difficulty-tile ${isSelected ? 'selected' : ''}`}
              onClick={() => onSelect(difficulty)}
              title={`${colors.name} - ${difficulty === 1 ? 'Standard game' : difficulty === 2 ? '4 blocked cells' : '4 center cells blocked'}`}
              style={{
                background: isSelected 
                  ? `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`
                  : 'linear-gradient(135deg, #D2B48C, #C4A484)',
                color: isSelected ? colors.text : '#8B4513',
                border: isSelected 
                  ? `3px solid ${colors.secondary}` 
                  : '2px solid #A0522D',
                boxShadow: isSelected
                  ? `0 6px 12px rgba(0,0,0,0.3), 0 0 20px ${colors.primary}80, inset 0 2px 0 rgba(255,255,255,0.4)`
                  : '2px 2px 4px rgba(0,0,0,0.2), inset 1px 1px 0 rgba(255,255,255,0.3)',
                transform: isSelected ? 'scale(1.1)' : 'scale(1)',
                transition: 'all 0.3s ease'
              }}
            >
              <span className="difficulty-number">{difficulty}</span>
              <span className="difficulty-name">{colors.name}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default DifficultySelector

