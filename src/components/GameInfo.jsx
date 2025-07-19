import React from 'react'

const GameInfo = ({ targetWords, moveCount, currentLevel, maxLevels }) => {
  return (
    <div className="game-info">
      <p>
        Level: <span>{currentLevel}</span>/{maxLevels}
      </p>
      <p>
        Slide tiles to form the words: <strong>{targetWords.join(', ').toUpperCase()}</strong>
      </p>
      <p>
        Moves: <span>{moveCount}</span>
      </p>
    </div>
  )
}

export default GameInfo 