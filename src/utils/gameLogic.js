/**
 * Core game logic utilities
 * Extracted for better testability
 */

/**
 * Check if a word exists at a specific position on the board
 * @param {Array} board - 2D array of letters
 * @param {string} word - Word to check for
 * @param {number} row - Starting row
 * @param {number} col - Starting column
 * @param {string} direction - 'horizontal' or 'vertical'
 * @returns {boolean}
 */
export function checkWordAtPosition(board, word, row, col, direction) {
  if (!board || !word || word.length === 0) return false
  
  const upperWord = word.toUpperCase()
  
  if (direction === 'horizontal') {
    // Check if word fits horizontally
    if (col + word.length > board[0]?.length) return false
    
    // Check each letter
    for (let i = 0; i < word.length; i++) {
      if (board[row]?.[col + i] !== upperWord[i]) {
        return false
      }
    }
    return true
  } else if (direction === 'vertical') {
    // Check if word fits vertically
    if (row + word.length > board.length) return false
    
    // Check each letter
    for (let i = 0; i < word.length; i++) {
      if (board[row + i]?.[col] !== upperWord[i]) {
        return false
      }
    }
    return true
  }
  
  return false
}

/**
 * Find all occurrences of a word on the board
 * @param {Array} board - 2D array of letters
 * @param {string} word - Word to find
 * @returns {Array} Array of {row, col, direction} objects
 */
export function findWordOnBoard(board, word) {
  const found = []
  
  if (!board || !word) return found
  
  const rows = board.length
  const cols = board[0]?.length || 0
  
  // Check horizontal
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c <= cols - word.length; c++) {
      if (checkWordAtPosition(board, word, r, c, 'horizontal')) {
        found.push({ row: r, col: c, direction: 'horizontal' })
      }
    }
  }
  
  // Check vertical
  for (let r = 0; r <= rows - word.length; r++) {
    for (let c = 0; c < cols; c++) {
      if (checkWordAtPosition(board, word, r, c, 'vertical')) {
        found.push({ row: r, col: c, direction: 'vertical' })
      }
    }
  }
  
  return found
}

/**
 * Check if two tiles are adjacent (for valid moves)
 * @param {number} r1 - Row of first tile
 * @param {number} c1 - Column of first tile
 * @param {number} r2 - Row of second tile
 * @param {number} c2 - Column of second tile
 * @returns {boolean}
 */
export function areAdjacent(r1, c1, r2, c2) {
  const rowDiff = Math.abs(r1 - r2)
  const colDiff = Math.abs(c1 - c2)
  
  // Adjacent if one unit away in exactly one direction
  return (rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1)
}

/**
 * Validate if a move is legal (tile must be adjacent to empty space)
 * @param {Array} board - Current board state
 * @param {Object} emptyPos - {r, c} position of empty tile
 * @param {number} tileRow - Row of tile to move
 * @param {number} tileCol - Column of tile to move
 * @returns {boolean}
 */
export function isValidMove(board, emptyPos, tileRow, tileCol) {
  if (!board || !emptyPos) return false
  
  // Can't move empty space
  if (tileRow === emptyPos.r && tileCol === emptyPos.c) return false
  
  // Must be adjacent to empty space
  return areAdjacent(tileRow, tileCol, emptyPos.r, emptyPos.c)
}

/**
 * Execute a tile move
 * @param {Array} board - Current board state
 * @param {Object} emptyPos - {r, c} position of empty tile
 * @param {number} tileRow - Row of tile to move
 * @param {number} tileCol - Column of tile to move
 * @returns {Object} {newBoard, newEmptyPos} or null if invalid
 */
export function executeTileMove(board, emptyPos, tileRow, tileCol) {
  if (!isValidMove(board, emptyPos, tileRow, tileCol)) {
    return null
  }
  
  // Deep copy board
  const newBoard = board.map(row => [...row])
  
  // Swap tile with empty space
  const tile = newBoard[tileRow][tileCol]
  newBoard[tileRow][tileCol] = newBoard[emptyPos.r][emptyPos.c]
  newBoard[emptyPos.r][emptyPos.c] = tile
  
  return {
    newBoard,
    newEmptyPos: { r: tileRow, c: tileCol }
  }
}

/**
 * Check if the puzzle is solved (all target words found)
 * @param {Array} board - Current board state
 * @param {Array} targetWords - Array of words that need to be found
 * @returns {boolean}
 */
export function isPuzzleSolved(board, targetWords) {
  if (!board || !targetWords || targetWords.length === 0) return false
  
  // Check if all target words exist on the board
  return targetWords.every(word => {
    const found = findWordOnBoard(board, word)
    return found.length > 0
  })
}

/**
 * Count how many target words are currently on the board
 * @param {Array} board - Current board state
 * @param {Array} targetWords - Array of target words
 * @returns {number}
 */
export function countCompletedWords(board, targetWords) {
  if (!board || !targetWords) return 0
  
  return targetWords.filter(word => {
    const found = findWordOnBoard(board, word)
    return found.length > 0
  }).length
}

/**
 * Validate board structure
 * @param {Array} board - Board to validate
 * @returns {Object} {valid: boolean, error: string}
 */
export function validateBoard(board) {
  if (!Array.isArray(board)) {
    return { valid: false, error: 'Board must be an array' }
  }
  
  if (board.length === 0) {
    return { valid: false, error: 'Board cannot be empty' }
  }
  
  const cols = board[0]?.length
  if (!cols) {
    return { valid: false, error: 'Board rows must have columns' }
  }
  
  // Check all rows have same length
  for (let i = 0; i < board.length; i++) {
    if (!Array.isArray(board[i])) {
      return { valid: false, error: `Row ${i} is not an array` }
    }
    if (board[i].length !== cols) {
      return { valid: false, error: `Row ${i} has inconsistent length` }
    }
  }
  
  return { valid: true, error: null }
}

