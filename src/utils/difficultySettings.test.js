import { describe, it, expect } from 'vitest'
import {
  getBlockedCells,
  isCellBlocked,
  getDifficultyName,
  getDifficultyColors,
  isValidDifficulty,
  getGameModeForDifficulty
} from './difficultySettings'

describe('difficultySettings', () => {
  describe('getBlockedCells', () => {
    it('should return empty array for difficulty 1 (Easy)', () => {
      const blocked = getBlockedCells(1)
      expect(blocked).toEqual([])
    })
    
    it('should return 4 diagonal cells for difficulty 2 (Medium)', () => {
      const blocked = getBlockedCells(2)
      expect(blocked).toHaveLength(4)
      expect(blocked).toContainEqual({ r: 1, c: 1 })
      expect(blocked).toContainEqual({ r: 1, c: 4 })
      expect(blocked).toContainEqual({ r: 4, c: 1 })
      expect(blocked).toContainEqual({ r: 4, c: 4 })
    })
    
    it('should return 4 center cells for difficulty 3 (Hard)', () => {
      const blocked = getBlockedCells(3)
      expect(blocked).toHaveLength(4)
      expect(blocked).toContainEqual({ r: 2, c: 2 })
      expect(blocked).toContainEqual({ r: 2, c: 3 })
      expect(blocked).toContainEqual({ r: 3, c: 2 })
      expect(blocked).toContainEqual({ r: 3, c: 3 })
    })
    
    it('should return empty array for invalid difficulty', () => {
      expect(getBlockedCells(0)).toEqual([])
      expect(getBlockedCells(4)).toEqual([])
      expect(getBlockedCells(null)).toEqual([])
    })
  })
  
  describe('isCellBlocked', () => {
    it('should return false for all cells in difficulty 1', () => {
      expect(isCellBlocked(0, 0, 1)).toBe(false)
      expect(isCellBlocked(3, 3, 1)).toBe(false)
      expect(isCellBlocked(6, 7, 1)).toBe(false)
    })
    
    it('should return true for diagonal cells in difficulty 2', () => {
      expect(isCellBlocked(1, 1, 2)).toBe(true)
      expect(isCellBlocked(1, 4, 2)).toBe(true)
      expect(isCellBlocked(4, 1, 2)).toBe(true)
      expect(isCellBlocked(4, 4, 2)).toBe(true)
    })
    
    it('should return false for non-blocked cells in difficulty 2', () => {
      expect(isCellBlocked(0, 0, 2)).toBe(false)
      expect(isCellBlocked(3, 3, 2)).toBe(false)
      expect(isCellBlocked(6, 7, 2)).toBe(false)
    })
    
    it('should return true for center cells in difficulty 3', () => {
      expect(isCellBlocked(2, 2, 3)).toBe(true)
      expect(isCellBlocked(2, 3, 3)).toBe(true)
      expect(isCellBlocked(3, 2, 3)).toBe(true)
      expect(isCellBlocked(3, 3, 3)).toBe(true)
    })
    
    it('should return false for non-center cells in difficulty 3', () => {
      expect(isCellBlocked(0, 0, 3)).toBe(false)
      expect(isCellBlocked(1, 1, 3)).toBe(false)
      expect(isCellBlocked(6, 7, 3)).toBe(false)
    })
  })
  
  describe('getDifficultyName', () => {
    it('should return correct names', () => {
      expect(getDifficultyName(1)).toBe('Easy')
      expect(getDifficultyName(2)).toBe('Medium')
      expect(getDifficultyName(3)).toBe('Hard')
    })
    
    it('should default to Easy for invalid difficulty', () => {
      expect(getDifficultyName(0)).toBe('Easy')
      expect(getDifficultyName(4)).toBe('Easy')
      expect(getDifficultyName(null)).toBe('Easy')
    })
  })
  
  describe('getDifficultyColors', () => {
    it('should return green colors for Easy', () => {
      const colors = getDifficultyColors(1)
      expect(colors.name).toBe('Easy')
      expect(colors.primary).toBe('#90EE90')
      expect(colors.text).toBe('#006400')
    })
    
    it('should return yellow colors for Medium', () => {
      const colors = getDifficultyColors(2)
      expect(colors.name).toBe('Medium')
      expect(colors.primary).toBe('#FFD700')
      expect(colors.text).toBe('#654321')
    })
    
    it('should return red colors for Hard', () => {
      const colors = getDifficultyColors(3)
      expect(colors.name).toBe('Hard')
      expect(colors.primary).toBe('#FF6B6B')
      expect(colors.text).toBe('#8B0000')
    })
  })
  
  describe('isValidDifficulty', () => {
    it('should validate correct difficulties', () => {
      expect(isValidDifficulty(1)).toBe(true)
      expect(isValidDifficulty(2)).toBe(true)
      expect(isValidDifficulty(3)).toBe(true)
    })
    
    it('should reject invalid difficulties', () => {
      expect(isValidDifficulty(0)).toBe(false)
      expect(isValidDifficulty(4)).toBe(false)
      expect(isValidDifficulty(null)).toBe(false)
      expect(isValidDifficulty(undefined)).toBe(false)
      expect(isValidDifficulty('1')).toBe(false)
    })
  })
  
  describe('getGameModeForDifficulty', () => {
    it('should return correct game mode strings', () => {
      expect(getGameModeForDifficulty(1)).toBe('original-difficulty-1')
      expect(getGameModeForDifficulty(2)).toBe('original-difficulty-2')
      expect(getGameModeForDifficulty(3)).toBe('original-difficulty-3')
    })
  })
  
  describe('Blocked cells do not overlap', () => {
    it('should have no overlap between difficulty 2 and 3 blocked cells', () => {
      const diff2 = getBlockedCells(2)
      const diff3 = getBlockedCells(3)
      
      // Check no cell appears in both
      diff2.forEach(cell2 => {
        const found = diff3.some(cell3 => cell3.r === cell2.r && cell3.c === cell2.c)
        expect(found).toBe(false)
      })
    })
    
    it('should have all blocked cells within board bounds (6x6)', () => {
      [1, 2, 3].forEach(difficulty => {
        const blocked = getBlockedCells(difficulty)
        blocked.forEach(cell => {
          expect(cell.r).toBeGreaterThanOrEqual(0)
          expect(cell.r).toBeLessThan(6)
          expect(cell.c).toBeGreaterThanOrEqual(0)
          expect(cell.c).toBeLessThan(6)
        })
      })
    })
  })
})

