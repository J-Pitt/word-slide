import { describe, it, expect } from 'vitest'
import {
  hasCompletedAllLevels,
  calculateCompletionStats,
  createCompletionRecord,
  createFreshStats,
  validateCompletionRecord
} from './completionTracking'

describe('completionTracking', () => {
  describe('hasCompletedAllLevels', () => {
    it('should return true when at max level', () => {
      expect(hasCompletedAllLevels(20, 20)).toBe(true)
    })
    
    it('should return true when past max level', () => {
      expect(hasCompletedAllLevels(21, 20)).toBe(true)
    })
    
    it('should return false when below max level', () => {
      expect(hasCompletedAllLevels(19, 20)).toBe(false)
      expect(hasCompletedAllLevels(1, 20)).toBe(false)
      expect(hasCompletedAllLevels(10, 20)).toBe(false)
    })
    
    it('should use default maxLevels of 20', () => {
      expect(hasCompletedAllLevels(20)).toBe(true)
      expect(hasCompletedAllLevels(19)).toBe(false)
    })
  })
  
  describe('calculateCompletionStats', () => {
    it('should calculate stats for multiple levels', () => {
      const levelStats = [
        { level: 1, moves: 10, words: 3 },
        { level: 2, moves: 15, words: 3 },
        { level: 3, moves: 12, words: 3 }
      ]
      
      const result = calculateCompletionStats(levelStats)
      
      expect(result.totalWords).toBe(9)
      expect(result.totalMoves).toBe(37)
      expect(result.levelsCompleted).toBe(3)
      expect(result.averageMovesPerLevel).toBe(12.3)
    })
    
    it('should calculate stats for all 20 levels', () => {
      const levelStats = Array(20).fill(null).map((_, i) => ({
        level: i + 1,
        moves: 10,
        words: 3
      }))
      
      const result = calculateCompletionStats(levelStats)
      
      expect(result.totalWords).toBe(60)
      expect(result.totalMoves).toBe(200)
      expect(result.levelsCompleted).toBe(20)
      expect(result.averageMovesPerLevel).toBe(10)
    })
    
    it('should handle varying moves per level', () => {
      const levelStats = [
        { level: 1, moves: 5, words: 3 },
        { level: 2, moves: 20, words: 3 }
      ]
      
      const result = calculateCompletionStats(levelStats)
      
      expect(result.totalWords).toBe(6)
      expect(result.totalMoves).toBe(25)
      expect(result.averageMovesPerLevel).toBe(12.5)
    })
    
    it('should return zeros for empty stats', () => {
      const result = calculateCompletionStats([])
      
      expect(result.totalWords).toBe(0)
      expect(result.totalMoves).toBe(0)
      expect(result.averageMovesPerLevel).toBe(0)
      expect(result.levelsCompleted).toBe(0)
    })
    
    it('should handle null or undefined input', () => {
      expect(calculateCompletionStats(null)).toEqual({
        totalWords: 0,
        totalMoves: 0,
        averageMovesPerLevel: 0,
        levelsCompleted: 0
      })
      
      expect(calculateCompletionStats(undefined)).toEqual({
        totalWords: 0,
        totalMoves: 0,
        averageMovesPerLevel: 0,
        levelsCompleted: 0
      })
    })
  })
  
  describe('createCompletionRecord', () => {
    const mockUser = { id: 1, username: 'testuser' }
    const mockStats = {
      totalWords: 60,
      totalMoves: 200,
      averageMovesPerLevel: 10,
      levelsCompleted: 20
    }
    
    it('should create valid completion record', () => {
      const record = createCompletionRecord(mockUser, mockStats, 'original')
      
      expect(record.userId).toBe(1)
      expect(record.username).toBe('testuser')
      expect(record.gameMode).toBe('original')
      expect(record.totalWords).toBe(60)
      expect(record.totalMoves).toBe(200)
      expect(record.averageMovesPerLevel).toBe(10)
      expect(record.levelsCompleted).toBe(20)
      expect(record.completedAt).toBeDefined()
    })
    
    it('should include timestamp', () => {
      const record = createCompletionRecord(mockUser, mockStats)
      const timestamp = new Date(record.completedAt)
      
      expect(timestamp instanceof Date).toBe(true)
      expect(!isNaN(timestamp.getTime())).toBe(true)
    })
    
    it('should default to original game mode', () => {
      const record = createCompletionRecord(mockUser, mockStats)
      expect(record.gameMode).toBe('original')
    })
    
    it('should support tetris game mode', () => {
      const record = createCompletionRecord(mockUser, mockStats, 'tetris')
      expect(record.gameMode).toBe('tetris')
    })
    
    it('should throw error if user is missing', () => {
      expect(() => {
        createCompletionRecord(null, mockStats)
      }).toThrow('User and stats are required')
    })
    
    it('should throw error if stats is missing', () => {
      expect(() => {
        createCompletionRecord(mockUser, null)
      }).toThrow('User and stats are required')
    })
  })
  
  describe('createFreshStats', () => {
    it('should create fresh stats object', () => {
      const fresh = createFreshStats()
      
      expect(fresh.currentLevel).toBe(1)
      expect(fresh.moveCount).toBe(0)
      expect(fresh.completedWords).toBeInstanceOf(Set)
      expect(fresh.completedWords.size).toBe(0)
      expect(fresh.hintCount).toBe(3)
      expect(fresh.levelHistory).toEqual([])
    })
    
    it('should create independent objects', () => {
      const fresh1 = createFreshStats()
      const fresh2 = createFreshStats()
      
      fresh1.currentLevel = 5
      fresh2.currentLevel = 10
      
      expect(fresh1.currentLevel).toBe(5)
      expect(fresh2.currentLevel).toBe(10)
    })
  })
  
  describe('validateCompletionRecord', () => {
    const validRecord = {
      userId: 1,
      username: 'testuser',
      gameMode: 'original',
      totalWords: 60,
      totalMoves: 200,
      averageMovesPerLevel: 10,
      levelsCompleted: 20,
      completedAt: new Date().toISOString()
    }
    
    it('should validate correct record', () => {
      const result = validateCompletionRecord(validRecord)
      
      expect(result.valid).toBe(true)
      expect(result.errors).toEqual([])
    })
    
    it('should reject null record', () => {
      const result = validateCompletionRecord(null)
      
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Record is required')
    })
    
    it('should require userId', () => {
      const invalid = { ...validRecord, userId: null }
      const result = validateCompletionRecord(invalid)
      
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('userId is required')
    })
    
    it('should require username', () => {
      const invalid = { ...validRecord, username: null }
      const result = validateCompletionRecord(invalid)
      
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('username is required')
    })
    
    it('should require gameMode', () => {
      const invalid = { ...validRecord, gameMode: null }
      const result = validateCompletionRecord(invalid)
      
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('gameMode is required')
    })
    
    it('should reject negative totalWords', () => {
      const invalid = { ...validRecord, totalWords: -5 }
      const result = validateCompletionRecord(invalid)
      
      expect(result.valid).toBe(false)
      expect(result.errors.some(e => e.includes('totalWords'))).toBe(true)
    })
    
    it('should reject negative totalMoves', () => {
      const invalid = { ...validRecord, totalMoves: -10 }
      const result = validateCompletionRecord(invalid)
      
      expect(result.valid).toBe(false)
      expect(result.errors.some(e => e.includes('totalMoves'))).toBe(true)
    })
    
    it('should reject levelsCompleted less than 1', () => {
      const invalid = { ...validRecord, levelsCompleted: 0 }
      const result = validateCompletionRecord(invalid)
      
      expect(result.valid).toBe(false)
      expect(result.errors.some(e => e.includes('levelsCompleted'))).toBe(true)
    })
    
    it('should collect multiple errors', () => {
      const invalid = {
        userId: null,
        username: null,
        totalWords: -5
      }
      
      const result = validateCompletionRecord(invalid)
      
      expect(result.valid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(2)
    })
  })
})

