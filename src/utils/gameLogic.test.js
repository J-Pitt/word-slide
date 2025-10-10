import { describe, it, expect } from 'vitest'
import {
  checkWordAtPosition,
  findWordOnBoard,
  areAdjacent,
  isValidMove,
  executeTileMove,
  isPuzzleSolved,
  countCompletedWords,
  validateBoard
} from './gameLogic'

describe('gameLogic', () => {
  describe('checkWordAtPosition', () => {
    it('should find horizontal word at correct position', () => {
      const board = [
        ['C', 'A', 'T', 'S'],
        ['D', 'O', 'G', 'Z'],
        ['B', 'I', 'R', 'D']
      ]
      
      expect(checkWordAtPosition(board, 'CAT', 0, 0, 'horizontal')).toBe(true)
      expect(checkWordAtPosition(board, 'DOG', 1, 0, 'horizontal')).toBe(true)
      expect(checkWordAtPosition(board, 'BIRD', 2, 0, 'horizontal')).toBe(true)
    })
    
    it('should find vertical word at correct position', () => {
      const board = [
        ['C', 'A', 'T'],
        ['A', 'P', 'O'],
        ['T', 'E', 'P']
      ]
      
      expect(checkWordAtPosition(board, 'CAT', 0, 0, 'vertical')).toBe(true)
      expect(checkWordAtPosition(board, 'APE', 0, 1, 'vertical')).toBe(true)
    })
    
    it('should return false for word not at position', () => {
      const board = [
        ['C', 'A', 'T'],
        ['D', 'O', 'G']
      ]
      
      expect(checkWordAtPosition(board, 'CAT', 1, 0, 'horizontal')).toBe(false)
      expect(checkWordAtPosition(board, 'DOG', 0, 0, 'horizontal')).toBe(false)
    })
    
    it('should handle case insensitivity', () => {
      const board = [['C', 'A', 'T']]
      
      expect(checkWordAtPosition(board, 'cat', 0, 0, 'horizontal')).toBe(true)
      expect(checkWordAtPosition(board, 'Cat', 0, 0, 'horizontal')).toBe(true)
      expect(checkWordAtPosition(board, 'CAT', 0, 0, 'horizontal')).toBe(true)
    })
    
    it('should return false if word goes out of bounds', () => {
      const board = [['C', 'A', 'T']]
      
      expect(checkWordAtPosition(board, 'CATS', 0, 0, 'horizontal')).toBe(false)
      expect(checkWordAtPosition(board, 'CAT', 0, 1, 'horizontal')).toBe(false)
    })
    
    it('should handle edge cases', () => {
      expect(checkWordAtPosition(null, 'CAT', 0, 0, 'horizontal')).toBe(false)
      expect(checkWordAtPosition([], 'CAT', 0, 0, 'horizontal')).toBe(false)
      expect(checkWordAtPosition([['C', 'A', 'T']], '', 0, 0, 'horizontal')).toBe(false)
      expect(checkWordAtPosition([['C', 'A', 'T']], null, 0, 0, 'horizontal')).toBe(false)
    })
  })
  
  describe('findWordOnBoard', () => {
    it('should find all occurrences of a word', () => {
      const board = [
        ['C', 'A', 'T'],
        ['A', 'P', 'E'],
        ['T', 'O', 'P']
      ]
      
      const catResults = findWordOnBoard(board, 'CAT')
      expect(catResults).toHaveLength(2) // horizontal at 0,0 and vertical at 0,0
      
      const topResults = findWordOnBoard(board, 'TOP')
      expect(topResults).toHaveLength(1)
      expect(topResults[0]).toEqual({ row: 2, col: 0, direction: 'horizontal' })
    })
    
    it('should find word in multiple directions', () => {
      const board = [
        ['C', 'A', 'T'],
        ['A', 'P', 'E'],
        ['T', 'E', 'N']
      ]
      
      const results = findWordOnBoard(board, 'CAT')
      expect(results.some(r => r.direction === 'horizontal')).toBe(true)
      expect(results.some(r => r.direction === 'vertical')).toBe(true)
    })
    
    it('should return empty array if word not found', () => {
      const board = [['C', 'A', 'T']]
      const results = findWordOnBoard(board, 'DOG')
      expect(results).toEqual([])
    })
    
    it('should handle edge cases', () => {
      expect(findWordOnBoard(null, 'CAT')).toEqual([])
      expect(findWordOnBoard([], 'CAT')).toEqual([])
      expect(findWordOnBoard([['C', 'A', 'T']], null)).toEqual([])
    })
  })
  
  describe('areAdjacent', () => {
    it('should return true for horizontally adjacent tiles', () => {
      expect(areAdjacent(0, 0, 0, 1)).toBe(true)
      expect(areAdjacent(0, 1, 0, 0)).toBe(true)
      expect(areAdjacent(2, 3, 2, 4)).toBe(true)
    })
    
    it('should return true for vertically adjacent tiles', () => {
      expect(areAdjacent(0, 0, 1, 0)).toBe(true)
      expect(areAdjacent(1, 0, 0, 0)).toBe(true)
      expect(areAdjacent(3, 2, 4, 2)).toBe(true)
    })
    
    it('should return false for diagonal tiles', () => {
      expect(areAdjacent(0, 0, 1, 1)).toBe(false)
      expect(areAdjacent(1, 1, 2, 2)).toBe(false)
    })
    
    it('should return false for distant tiles', () => {
      expect(areAdjacent(0, 0, 0, 2)).toBe(false)
      expect(areAdjacent(0, 0, 2, 0)).toBe(false)
      expect(areAdjacent(0, 0, 5, 5)).toBe(false)
    })
    
    it('should return false for same tile', () => {
      expect(areAdjacent(0, 0, 0, 0)).toBe(false)
      expect(areAdjacent(3, 3, 3, 3)).toBe(false)
    })
  })
  
  describe('isValidMove', () => {
    const board = [
      ['C', 'A', 'T'],
      ['D', '', 'G'],
      ['B', 'I', 'R']
    ]
    const emptyPos = { r: 1, c: 1 }
    
    it('should allow moving adjacent tiles to empty space', () => {
      expect(isValidMove(board, emptyPos, 0, 1)).toBe(true) // Above
      expect(isValidMove(board, emptyPos, 2, 1)).toBe(true) // Below
      expect(isValidMove(board, emptyPos, 1, 0)).toBe(true) // Left
      expect(isValidMove(board, emptyPos, 1, 2)).toBe(true) // Right
    })
    
    it('should not allow moving non-adjacent tiles', () => {
      expect(isValidMove(board, emptyPos, 0, 0)).toBe(false)
      expect(isValidMove(board, emptyPos, 2, 2)).toBe(false)
      expect(isValidMove(board, emptyPos, 0, 2)).toBe(false)
    })
    
    it('should not allow moving the empty space itself', () => {
      expect(isValidMove(board, emptyPos, 1, 1)).toBe(false)
    })
    
    it('should handle edge cases', () => {
      expect(isValidMove(null, emptyPos, 0, 1)).toBe(false)
      expect(isValidMove(board, null, 0, 1)).toBe(false)
    })
  })
  
  describe('executeTileMove', () => {
    it('should successfully move an adjacent tile', () => {
      const board = [
        ['C', 'A', 'T'],
        ['D', '', 'G'],
        ['B', 'I', 'R']
      ]
      const emptyPos = { r: 1, c: 1 }
      
      const result = executeTileMove(board, emptyPos, 0, 1)
      
      expect(result).not.toBeNull()
      expect(result.newBoard[0][1]).toBe('')
      expect(result.newBoard[1][1]).toBe('A')
      expect(result.newEmptyPos).toEqual({ r: 0, c: 1 })
    })
    
    it('should not modify original board', () => {
      const board = [
        ['C', 'A', 'T'],
        ['D', '', 'G']
      ]
      const emptyPos = { r: 1, c: 1 }
      const originalBoard = JSON.stringify(board)
      
      executeTileMove(board, emptyPos, 0, 1)
      
      expect(JSON.stringify(board)).toBe(originalBoard)
    })
    
    it('should return null for invalid move', () => {
      const board = [
        ['C', 'A', 'T'],
        ['D', '', 'G']
      ]
      const emptyPos = { r: 1, c: 1 }
      
      const result = executeTileMove(board, emptyPos, 0, 0)
      expect(result).toBeNull()
    })
    
    it('should handle moves in all directions', () => {
      const board = [
        ['C', 'A', 'T'],
        ['D', '', 'G'],
        ['B', 'I', 'R']
      ]
      const emptyPos = { r: 1, c: 1 }
      
      // Up
      let result = executeTileMove(board, emptyPos, 0, 1)
      expect(result.newBoard[1][1]).toBe('A')
      
      // Down
      result = executeTileMove(board, emptyPos, 2, 1)
      expect(result.newBoard[1][1]).toBe('I')
      
      // Left
      result = executeTileMove(board, emptyPos, 1, 0)
      expect(result.newBoard[1][1]).toBe('D')
      
      // Right
      result = executeTileMove(board, emptyPos, 1, 2)
      expect(result.newBoard[1][1]).toBe('G')
    })
  })
  
  describe('isPuzzleSolved', () => {
    it('should return true when all target words are found', () => {
      const board = [
        ['C', 'A', 'T'],
        ['D', 'O', 'G']
      ]
      const targetWords = ['CAT', 'DOG']
      
      expect(isPuzzleSolved(board, targetWords)).toBe(true)
    })
    
    it('should return false when not all words are found', () => {
      const board = [
        ['C', 'A', 'T'],
        ['D', 'O', 'Z']
      ]
      const targetWords = ['CAT', 'DOG']
      
      expect(isPuzzleSolved(board, targetWords)).toBe(false)
    })
    
    it('should return false when no words are found', () => {
      const board = [
        ['X', 'Y', 'Z'],
        ['A', 'B', 'C']
      ]
      const targetWords = ['CAT', 'DOG']
      
      expect(isPuzzleSolved(board, targetWords)).toBe(false)
    })
    
    it('should handle edge cases', () => {
      expect(isPuzzleSolved(null, ['CAT'])).toBe(false)
      expect(isPuzzleSolved([['C', 'A', 'T']], null)).toBe(false)
      expect(isPuzzleSolved([['C', 'A', 'T']], [])).toBe(false)
    })
  })
  
  describe('countCompletedWords', () => {
    it('should count all completed words', () => {
      const board = [
        ['C', 'A', 'T', 'S'],
        ['D', 'O', 'G', 'Z'],
        ['B', 'I', 'R', 'D']
      ]
      const targetWords = ['CAT', 'DOG', 'BIRD', 'FOX']
      
      expect(countCompletedWords(board, targetWords)).toBe(3)
    })
    
    it('should return 0 when no words are completed', () => {
      const board = [['X', 'Y', 'Z']]
      const targetWords = ['CAT', 'DOG']
      
      expect(countCompletedWords(board, targetWords)).toBe(0)
    })
    
    it('should handle edge cases', () => {
      expect(countCompletedWords(null, ['CAT'])).toBe(0)
      expect(countCompletedWords([['C', 'A', 'T']], null)).toBe(0)
    })
  })
  
  describe('validateBoard', () => {
    it('should validate a correct board', () => {
      const board = [
        ['C', 'A', 'T'],
        ['D', 'O', 'G']
      ]
      
      const result = validateBoard(board)
      expect(result.valid).toBe(true)
      expect(result.error).toBeNull()
    })
    
    it('should reject non-array board', () => {
      const result = validateBoard('not an array')
      expect(result.valid).toBe(false)
      expect(result.error).toContain('array')
    })
    
    it('should reject empty board', () => {
      const result = validateBoard([])
      expect(result.valid).toBe(false)
      expect(result.error).toContain('empty')
    })
    
    it('should reject board with inconsistent row lengths', () => {
      const board = [
        ['C', 'A', 'T'],
        ['D', 'O']
      ]
      
      const result = validateBoard(board)
      expect(result.valid).toBe(false)
      expect(result.error).toContain('inconsistent')
    })
    
    it('should reject board with non-array rows', () => {
      const board = [
        ['C', 'A', 'T'],
        'not an array'
      ]
      
      const result = validateBoard(board)
      expect(result.valid).toBe(false)
      expect(result.error).toContain('not an array')
    })
  })
})

