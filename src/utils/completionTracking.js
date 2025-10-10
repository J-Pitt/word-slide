/**
 * Game Completion Tracking Utilities
 * Handles permanent leaderboard saves and stats reset
 */

/**
 * Check if user has completed all levels
 * @param {number} currentLevel - Current level number
 * @param {number} maxLevels - Maximum levels in game
 * @returns {boolean}
 */
export function hasCompletedAllLevels(currentLevel, maxLevels = 20) {
  return currentLevel >= maxLevels
}

/**
 * Calculate total stats across all levels
 * @param {Array} levelStats - Array of {level, moves, words} for each completed level
 * @returns {Object} {totalWords, totalMoves, averageMovesPerLevel}
 */
export function calculateCompletionStats(levelStats) {
  if (!Array.isArray(levelStats) || levelStats.length === 0) {
    return {
      totalWords: 0,
      totalMoves: 0,
      averageMovesPerLevel: 0,
      levelsCompleted: 0
    }
  }
  
  const totalWords = levelStats.reduce((sum, level) => sum + (level.words || 0), 0)
  const totalMoves = levelStats.reduce((sum, level) => sum + (level.moves || 0), 0)
  const levelsCompleted = levelStats.length
  const averageMovesPerLevel = levelsCompleted > 0 
    ? Math.round(totalMoves / levelsCompleted * 10) / 10 
    : 0
  
  return {
    totalWords,
    totalMoves,
    averageMovesPerLevel,
    levelsCompleted
  }
}

/**
 * Create completion record for leaderboard
 * @param {Object} user - User object {id, username}
 * @param {Object} stats - Completion stats
 * @param {string} gameMode - Game mode ('original' or 'tetris')
 * @returns {Object} Completion record
 */
export function createCompletionRecord(user, stats, gameMode = 'original') {
  if (!user || !stats) {
    throw new Error('User and stats are required')
  }
  
  return {
    userId: user.id,
    username: user.username,
    gameMode,
    totalWords: stats.totalWords,
    totalMoves: stats.totalMoves,
    averageMovesPerLevel: stats.averageMovesPerLevel,
    levelsCompleted: stats.levelsCompleted,
    completedAt: new Date().toISOString()
  }
}

/**
 * Prepare fresh stats for new game attempt
 * @returns {Object} Fresh stats object
 */
export function createFreshStats() {
  return {
    currentLevel: 1,
    moveCount: 0,
    completedWords: new Set(),
    hintCount: 3,
    levelHistory: []
  }
}

/**
 * Validate completion record before saving
 * @param {Object} record - Completion record to validate
 * @returns {Object} {valid: boolean, errors: Array}
 */
export function validateCompletionRecord(record) {
  const errors = []
  
  if (!record) {
    return { valid: false, errors: ['Record is required'] }
  }
  
  if (!record.userId) errors.push('userId is required')
  if (!record.username) errors.push('username is required')
  if (!record.gameMode) errors.push('gameMode is required')
  if (typeof record.totalWords !== 'number' || record.totalWords < 0) {
    errors.push('totalWords must be a non-negative number')
  }
  if (typeof record.totalMoves !== 'number' || record.totalMoves < 0) {
    errors.push('totalMoves must be a non-negative number')
  }
  if (typeof record.levelsCompleted !== 'number' || record.levelsCompleted < 1) {
    errors.push('levelsCompleted must be at least 1')
  }
  
  return {
    valid: errors.length === 0,
    errors
  }
}

