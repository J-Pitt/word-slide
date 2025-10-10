/**
 * Difficulty Settings Utilities
 * Manages blocked cells and difficulty-specific leaderboards
 */

/**
 * Get blocked cell positions for a given difficulty
 * @param {number} difficulty - Difficulty level (1, 2, or 3)
 * @returns {Array} Array of {r, c} positions that are blocked
 */
export function getBlockedCells(difficulty) {
  switch (difficulty) {
    case 1:
      // Easy - no blocked cells
      return []
    
    case 2:
      // Medium - 4 cells diagonal from corners (one cell in from each corner) on 6x6 board
      return [
        { r: 1, c: 1 },  // Near top-left
        { r: 1, c: 4 },  // Near top-right
        { r: 4, c: 1 },  // Near bottom-left
        { r: 4, c: 4 }   // Near bottom-right
      ]
    
    case 3:
      // Hard - 4 middle cells blocked (center of 6x6 board)
      return [
        { r: 2, c: 2 },  // Center top-left
        { r: 2, c: 3 },  // Center top-right
        { r: 3, c: 2 },  // Center bottom-left
        { r: 3, c: 3 }   // Center bottom-right
      ]
    
    default:
      return []
  }
}

/**
 * Check if a cell is blocked for the current difficulty
 * @param {number} row - Row index
 * @param {number} col - Column index
 * @param {number} difficulty - Difficulty level
 * @returns {boolean}
 */
export function isCellBlocked(row, col, difficulty) {
  const blockedCells = getBlockedCells(difficulty)
  return blockedCells.some(cell => cell.r === row && cell.c === col)
}

/**
 * Get difficulty name
 * @param {number} difficulty - Difficulty level (1, 2, or 3)
 * @returns {string}
 */
export function getDifficultyName(difficulty) {
  switch (difficulty) {
    case 1:
      return 'Easy'
    case 2:
      return 'Medium'
    case 3:
      return 'Hard'
    default:
      return 'Easy'
  }
}

/**
 * Get difficulty color scheme
 * @param {number} difficulty - Difficulty level
 * @returns {Object} {primary, secondary, text}
 */
export function getDifficultyColors(difficulty) {
  switch (difficulty) {
    case 1:
      return {
        primary: '#90EE90',
        secondary: '#32CD32',
        text: '#006400',
        name: 'Easy'
      }
    case 2:
      return {
        primary: '#FFD700',
        secondary: '#FFA500',
        text: '#654321',
        name: 'Medium'
      }
    case 3:
      return {
        primary: '#FF6B6B',
        secondary: '#DC143C',
        text: '#8B0000',
        name: 'Hard'
      }
    default:
      return {
        primary: '#90EE90',
        secondary: '#32CD32',
        text: '#006400',
        name: 'Easy'
      }
  }
}

/**
 * Validate difficulty level
 * @param {number} difficulty - Difficulty to validate
 * @returns {boolean}
 */
export function isValidDifficulty(difficulty) {
  return difficulty === 1 || difficulty === 2 || difficulty === 3
}

/**
 * Get leaderboard game mode for difficulty
 * @param {number} difficulty - Difficulty level
 * @returns {string} Game mode string for API
 */
export function getGameModeForDifficulty(difficulty) {
  return `original-difficulty-${difficulty}`
}

