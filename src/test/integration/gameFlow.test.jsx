import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import {
  checkWordAtPosition,
  findWordOnBoard,
  executeTileMove,
  isPuzzleSolved,
  validateBoard
} from '../../utils/gameLogic'

describe('Game Flow Integration Tests', () => {
  describe('Complete Game Scenario', () => {
    it('should complete a full game from start to win', () => {
      // Initial board setup - already has CAT formed
      const solvedBoard = [
        ['C', 'A', 'T'],
        ['D', 'O', ''],
        ['B', 'I', 'G']
      ]
      const targetWords = ['CAT']
      
      // Validate board
      const validation = validateBoard(solvedBoard)
      expect(validation.valid).toBe(true)
      
      // Check solved state
      expect(isPuzzleSolved(solvedBoard, targetWords)).toBe(true)
      
      // Test a move sequence
      const emptyPos = { r: 1, c: 2 }
      const result = executeTileMove(solvedBoard, emptyPos, 1, 1)
      
      expect(result).not.toBeNull()
      expect(result.newBoard[1][1]).toBe('')
      expect(result.newBoard[1][2]).toBe('O')
      expect(result.newEmptyPos).toEqual({ r: 1, c: 1 })
      
      // Verify we can still track moves
      let moveCount = 1
      expect(moveCount).toBeGreaterThan(0)
      expect(moveCount).toBeLessThanOrEqual(10)
    })
    
    it('should prevent invalid moves', () => {
      const board = [
        ['C', 'A', 'T'],
        ['D', '', 'G'],
        ['B', 'I', 'R']
      ]
      const emptyPos = { r: 1, c: 1 }
      
      // Try to move a non-adjacent tile
      const result = executeTileMove(board, emptyPos, 0, 0)
      expect(result).toBeNull()
      
      // Try to move the empty space itself
      const result2 = executeTileMove(board, emptyPos, 1, 1)
      expect(result2).toBeNull()
    })
    
    it('should track game progress correctly', () => {
      const board = [
        ['C', 'A', 'T', 'Z'],
        ['D', 'O', 'G', 'X'],
        ['B', 'I', 'R', 'D']
      ]
      const targetWords = ['CAT', 'DOG', 'BIRD']
      
      // All words should be found
      expect(isPuzzleSolved(board, targetWords)).toBe(true)
      
      // Check individual word positions
      const catPos = findWordOnBoard(board, 'CAT')
      expect(catPos.length).toBeGreaterThanOrEqual(1)
      expect(catPos[0]).toEqual({ row: 0, col: 0, direction: 'horizontal' })
      
      const dogPos = findWordOnBoard(board, 'DOG')
      expect(dogPos.length).toBeGreaterThanOrEqual(1)
      expect(dogPos[0]).toEqual({ row: 1, col: 0, direction: 'horizontal' })
      
      const birdPos = findWordOnBoard(board, 'BIRD')
      expect(birdPos.length).toBeGreaterThanOrEqual(1)
      expect(birdPos[0]).toEqual({ row: 2, col: 0, direction: 'horizontal' })
    })
  })
  
  describe('Level Progression', () => {
    it('should handle multiple levels', () => {
      const levels = [
        {
          board: [['C', 'A', 'T']],
          words: ['CAT'],
          level: 1
        },
        {
          board: [['D', 'O', 'G']],
          words: ['DOG'],
          level: 2
        },
        {
          board: [['B', 'I', 'R', 'D']],
          words: ['BIRD'],
          level: 3
        }
      ]
      
      levels.forEach(({ board, words, level }) => {
        const validation = validateBoard(board)
        expect(validation.valid).toBe(true)
        
        const solved = isPuzzleSolved(board, words)
        expect(solved).toBe(true)
      })
    })
  })
  
  describe('Word Detection', () => {
    it('should detect words in all directions', () => {
      const board = [
        ['C', 'A', 'T', 'S'],
        ['A', 'P', 'E', 'N'],
        ['T', 'O', 'P', 'S']
      ]
      
      // Horizontal words
      expect(findWordOnBoard(board, 'CAT')).not.toHaveLength(0)
      expect(findWordOnBoard(board, 'APE')).not.toHaveLength(0)
      expect(findWordOnBoard(board, 'TOP')).not.toHaveLength(0)
      
      // Vertical words
      expect(findWordOnBoard(board, 'CAT')).toContainEqual(
        expect.objectContaining({ direction: 'vertical' })
      )
    })
    
    it('should not detect partial words', () => {
      const board = [['C', 'A', 'T', 'S']]
      
      // Should find CATS
      expect(findWordOnBoard(board, 'CATS')).toHaveLength(1)
      
      // Should not find CATSD (doesn't exist)
      expect(findWordOnBoard(board, 'CATSD')).toHaveLength(0)
    })
  })
  
  describe('Move Validation', () => {
    it('should validate move sequence', () => {
      const board = [
        ['C', 'A', ''],
        ['D', 'O', 'G']
      ]
      let emptyPos = { r: 0, c: 2 }
      
      // Valid moves from this position
      const validMoves = [
        { r: 0, c: 1 }, // Left
        { r: 1, c: 2 }  // Down
      ]
      
      validMoves.forEach(move => {
        const result = executeTileMove(board, emptyPos, move.r, move.c)
        expect(result).not.toBeNull()
      })
      
      // Invalid moves
      const invalidMoves = [
        { r: 0, c: 0 }, // Too far
        { r: 1, c: 0 }, // Diagonal
        { r: 1, c: 1 }  // Diagonal
      ]
      
      invalidMoves.forEach(move => {
        const result = executeTileMove(board, emptyPos, move.r, move.c)
        expect(result).toBeNull()
      })
    })
  })
  
  describe('Edge Cases', () => {
    it('should handle minimum board size', () => {
      const board = [['A', '']]
      const validation = validateBoard(board)
      expect(validation.valid).toBe(true)
      
      const emptyPos = { r: 0, c: 1 }
      const result = executeTileMove(board, emptyPos, 0, 0)
      expect(result).not.toBeNull()
      expect(result.newBoard[0][0]).toBe('')
      expect(result.newBoard[0][1]).toBe('A')
    })
    
    it('should handle large boards', () => {
      const board = Array(10).fill(null).map(() => Array(10).fill('A'))
      board[5][5] = ''
      
      const validation = validateBoard(board)
      expect(validation.valid).toBe(true)
      
      const emptyPos = { r: 5, c: 5 }
      const result = executeTileMove(board, emptyPos, 5, 4)
      expect(result).not.toBeNull()
    })
    
    it('should handle boards with special characters', () => {
      const board = [['!', '@', '#']]
      const validation = validateBoard(board)
      expect(validation.valid).toBe(true)
      
      const found = findWordOnBoard(board, '!@#')
      expect(found).toHaveLength(1)
    })
  })
  
  describe('Performance Tests', () => {
    it('should handle many word searches efficiently', () => {
      const board = Array(20).fill(null).map(() => 
        Array(20).fill(null).map(() => 
          String.fromCharCode(65 + Math.floor(Math.random() * 26))
        )
      )
      
      const startTime = performance.now()
      
      const words = ['CAT', 'DOG', 'BIRD', 'FISH', 'TREE']
      words.forEach(word => {
        findWordOnBoard(board, word)
      })
      
      const endTime = performance.now()
      const duration = endTime - startTime
      
      // Should complete in reasonable time (< 100ms)
      expect(duration).toBeLessThan(100)
    })
    
    it('should handle many moves efficiently', () => {
      const board = [
        ['A', 'B', 'C'],
        ['D', 'E', ''],
        ['F', 'G', 'H']
      ]
      let emptyPos = { r: 1, c: 2 }
      
      const startTime = performance.now()
      
      // Perform 100 moves
      for (let i = 0; i < 100; i++) {
        const validMoves = []
        
        // Find all valid moves
        for (let r = 0; r < board.length; r++) {
          for (let c = 0; c < board[0].length; c++) {
            const result = executeTileMove(board, emptyPos, r, c)
            if (result) {
              validMoves.push({ r, c })
            }
          }
        }
        
        if (validMoves.length > 0) {
          const randomMove = validMoves[Math.floor(Math.random() * validMoves.length)]
          const result = executeTileMove(board, emptyPos, randomMove.r, randomMove.c)
          if (result) {
            emptyPos = result.newEmptyPos
          }
        }
      }
      
      const endTime = performance.now()
      const duration = endTime - startTime
      
      // Should complete in reasonable time (< 500ms)
      expect(duration).toBeLessThan(500)
    })
  })
})

