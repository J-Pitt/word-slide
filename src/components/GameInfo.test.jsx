import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import React from 'react'
import GameInfo from './GameInfo'
import { AuthContext } from '../contexts/AuthContext'

// Mock the LeaderboardModal component
vi.mock('./LeaderboardModal', () => ({
  default: ({ isOpen, onClose, gameMode }) => (
    isOpen ? (
      <div data-testid="leaderboard-modal">
        <span>Leaderboard - {gameMode}</span>
        <button onClick={onClose}>Close</button>
      </div>
    ) : null
  )
}))

describe('GameInfo', () => {
  const defaultProps = {
    targetWords: ['CAT', 'DOG'],
    moveCount: 5,
    currentLevel: 3,
    maxLevels: 20,
    gameMode: 'original'
  }
  
  const renderWithAuth = (component, authState = { isAuthenticated: false, user: null }) => {
    return render(
      <AuthContext.Provider value={authState}>
        {component}
      </AuthContext.Provider>
    )
  }
  
  it('should render game info correctly', () => {
    renderWithAuth(<GameInfo {...defaultProps} />)
    
    expect(screen.getByText(/Level:/)).toBeInTheDocument()
    expect(screen.getByText(/3/)).toBeInTheDocument()
    expect(screen.getByText(/20/)).toBeInTheDocument()
    expect(screen.getByText(/CAT, DOG/)).toBeInTheDocument()
    expect(screen.getByText(/Moves:/)).toBeInTheDocument()
    expect(screen.getByText(/5/)).toBeInTheDocument()
  })
  
  it('should render leaderboard button', () => {
    renderWithAuth(<GameInfo {...defaultProps} />)
    
    const leaderboardBtn = screen.getByRole('button', { name: /leaderboard/i })
    expect(leaderboardBtn).toBeInTheDocument()
  })
  
  it('should open leaderboard modal when button clicked', () => {
    renderWithAuth(<GameInfo {...defaultProps} />)
    
    const leaderboardBtn = screen.getByRole('button', { name: /leaderboard/i })
    fireEvent.click(leaderboardBtn)
    
    expect(screen.getByTestId('leaderboard-modal')).toBeInTheDocument()
    expect(screen.getByText(/Leaderboard - original/)).toBeInTheDocument()
  })
  
  it('should close leaderboard modal', () => {
    renderWithAuth(<GameInfo {...defaultProps} />)
    
    // Open modal
    const leaderboardBtn = screen.getByRole('button', { name: /leaderboard/i })
    fireEvent.click(leaderboardBtn)
    
    // Close modal
    const closeBtn = screen.getByRole('button', { name: /close/i })
    fireEvent.click(closeBtn)
    
    expect(screen.queryByTestId('leaderboard-modal')).not.toBeInTheDocument()
  })
  
  it('should show correct game mode in modal', () => {
    renderWithAuth(<GameInfo {...defaultProps} gameMode="tetris" />)
    
    const leaderboardBtn = screen.getByRole('button', { name: /leaderboard/i })
    fireEvent.click(leaderboardBtn)
    
    expect(screen.getByText(/Leaderboard - tetris/)).toBeInTheDocument()
  })
  
  it('should handle single target word', () => {
    renderWithAuth(<GameInfo {...defaultProps} targetWords={['CAT']} />)
    
    expect(screen.getByText(/Slide tiles to form the word/)).toBeInTheDocument()
    expect(screen.getByText(/CAT/)).toBeInTheDocument()
  })
  
  it('should handle multiple target words', () => {
    renderWithAuth(<GameInfo {...defaultProps} targetWords={['CAT', 'DOG', 'BIRD']} />)
    
    expect(screen.getByText(/Slide tiles to form the words/)).toBeInTheDocument()
    expect(screen.getByText(/CAT, DOG, BIRD/)).toBeInTheDocument()
  })
  
  it('should display move count correctly', () => {
    const mockAuthState = { isAuthenticated: false, user: null }
    const { rerender } = render(
      <AuthContext.Provider value={mockAuthState}>
        <GameInfo {...defaultProps} moveCount={0} />
      </AuthContext.Provider>
    )
    expect(screen.getByText(/Moves:/)).toBeInTheDocument()
    expect(screen.getByText('0')).toBeInTheDocument()
    
    rerender(
      <AuthContext.Provider value={mockAuthState}>
        <GameInfo {...defaultProps} moveCount={10} />
      </AuthContext.Provider>
    )
    expect(screen.getByText('10')).toBeInTheDocument()
    
    rerender(
      <AuthContext.Provider value={mockAuthState}>
        <GameInfo {...defaultProps} moveCount={999} />
      </AuthContext.Provider>
    )
    expect(screen.getByText('999')).toBeInTheDocument()
  })
  
  it('should display level correctly', () => {
    const mockAuthState = { isAuthenticated: false, user: null }
    const { rerender } = render(
      <AuthContext.Provider value={mockAuthState}>
        <GameInfo {...defaultProps} currentLevel={1} />
      </AuthContext.Provider>
    )
    expect(screen.getByText('1')).toBeInTheDocument()
    
    rerender(
      <AuthContext.Provider value={mockAuthState}>
        <GameInfo {...defaultProps} currentLevel={20} />
      </AuthContext.Provider>
    )
    expect(screen.getByText('20')).toBeInTheDocument()
  })
  
  it('should have correct tooltip on leaderboard button', () => {
    renderWithAuth(<GameInfo {...defaultProps} gameMode="original" />)
    
    const leaderboardBtn = screen.getByRole('button', { name: /leaderboard/i })
    expect(leaderboardBtn).toHaveAttribute('title', 'View Classic Mode Leaderboard')
  })
  
  it('should show tetris mode tooltip correctly', () => {
    renderWithAuth(<GameInfo {...defaultProps} gameMode="tetris" />)
    
    const leaderboardBtn = screen.getByRole('button', { name: /leaderboard/i })
    expect(leaderboardBtn).toHaveAttribute('title', 'View Tetris Mode Leaderboard')
  })
})

