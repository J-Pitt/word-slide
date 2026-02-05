import React from 'react'

const TOTAL_SQUARES = 50
const COLS = 10
const ROWS = 5

const PIECE_COLORS = [
  '#38bdf8',
  '#a78bfa',
  '#f472b6',
  '#34d399',
  '#fbbf24',
  '#f87171',
  '#22d3ee',
  '#c084fc',
  '#fb923c',
  '#4ade80',
]

const SPECIAL_SQUARES = {
  1: { icon: '🚀', type: 'start', label: 'GO!' },
  5: { icon: '❓', type: 'question' },
  10: { icon: '🧠', type: 'brain' },
  15: { icon: '⭐', type: 'star' },
  20: { icon: '💡', type: 'idea' },
  25: { icon: '🎯', type: 'target' },
  30: { icon: '📚', type: 'book' },
  35: { icon: '🔥', type: 'fire' },
  40: { icon: '💎', type: 'diamond' },
  45: { icon: '🌟', type: 'sparkle' },
  [TOTAL_SQUARES]: { icon: '🏆', type: 'end', label: 'WIN!' },
}

function squareToCell(s) {
  const fullRow = Math.floor((s - 1) / COLS)
  const row = ROWS - 1 - fullRow
  const col = fullRow % 2 === 0 ? (s - 1) % COLS : COLS - 1 - ((s - 1) % COLS)
  return { row, col }
}

function getSquareColor(sq) {
  const progress = (sq - 1) / (TOTAL_SQUARES - 1)
  const colors = [
    { r: 56, g: 189, b: 248 },
    { r: 139, g: 92, b: 246 },
    { r: 251, g: 191, b: 36 },
  ]
  const segment = progress * (colors.length - 1)
  const idx = Math.floor(segment)
  const t = segment - idx
  const c1 = colors[Math.min(idx, colors.length - 1)]
  const c2 = colors[Math.min(idx + 1, colors.length - 1)]
  const r = Math.round(c1.r + (c2.r - c1.r) * t)
  const g = Math.round(c1.g + (c2.g - c1.g) * t)
  const b = Math.round(c1.b + (c2.b - c1.b) * t)
  return `rgba(${r}, ${g}, ${b}, 0.25)`
}

export default function TriviaBoard({ positions, playerNames, winner }) {
  const grid = []
  for (let r = 0; r < ROWS; r++) {
    grid[r] = []
    for (let c = 0; c < COLS; c++) {
      grid[r][c] = null
    }
  }
  for (let s = 1; s <= TOTAL_SQUARES; s++) {
    const { row, col } = squareToCell(s)
    grid[row][col] = s
  }

  const piecesBySquare = Array.from({ length: TOTAL_SQUARES + 1 }, () => [])
  positions.forEach((pos, i) => {
    const p = Math.max(1, Math.min(TOTAL_SQUARES, Math.floor(pos)))
    piecesBySquare[p].push(i)
  })

  return (
    <div className="game-board">
      <div
        className="game-board-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${COLS}, 1fr)`,
          gridTemplateRows: `repeat(${ROWS}, 1fr)`,
        }}
      >
        {grid.flatMap((row) => row).filter((sq) => sq != null).map((sq) => {
          const special = SPECIAL_SQUARES[sq]
          const pieces = piecesBySquare[sq] ?? []
          const bgColor = getSquareColor(sq)

          return (
            <div
              key={sq}
              className={`board-square ${special?.type ?? ''} ${pieces.length > 0 ? 'has-piece' : ''}`}
              style={{ backgroundColor: bgColor }}
            >
              {special ? (
                <div className="board-special">
                  <span className="board-icon">{special.icon}</span>
                  {special.label && <span className="board-label">{special.label}</span>}
                </div>
              ) : (
                <span className="board-num">{sq}</span>
              )}
              <div className="board-pieces">
                {pieces.map((i) => (
                  <span
                    key={i}
                    className={`board-piece ${winner === i ? 'winner-piece' : ''}`}
                    style={{ backgroundColor: PIECE_COLORS[i % PIECE_COLORS.length] }}
                    title={playerNames[i] ?? `Player ${i + 1}`}
                  >
                    {(playerNames[i] ?? '?').charAt(0).toUpperCase()}
                  </span>
                ))}
              </div>
            </div>
          )
        })}
      </div>
      {winner != null && (
        <p className="board-winner" aria-live="polite">
          🏆 <strong>{playerNames[winner] ?? `Player ${winner + 1}`}</strong> wins!
        </p>
      )}
    </div>
  )
}
