import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import GameInfo from './GameInfo'
import { AuthProvider } from '../contexts/AuthContext'

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
  
  const renderWithAuth = (component, authState = {}) => {
    return render(
      <AuthProvider value={authState}>
        {component}
      </AuthProvider>
    )
  }
  
  it('should render game info correctly', () => {
    render(<GameInfo {...defaultProps} />)
    
    expect(screen.getByText(/Level:/)).toBeInTheDocument()
    expect(screen.getByText(/3/)).toBeInTheDocument()
    expect(screen.getByText(/20/)).toBeInTheDocument()
    expect(screen.getByText(/CAT, DOG/)).toBeInTheDocument()
    expect(screen.getByText(/Moves:/)).toBeInTheDocument()
    expect(screen.getByText(/5/)).toBeInTheDocument()
  })
  
  it('should render leaderboard button', () => {
    render(<GameInfo {...defaultProps} />)
    
    const leaderboardBtn = screen.getByRole('button', { name: /leaderboard/i })
    expect(leaderboardBtn).toBeInTheDocument()
  })
  
  it('should open leaderboard modal when button clicked', () => {
    render(<GameInfo {...defaultProps} />)
    
    const leaderboardBtn = screen.getByRole('button', { name: /leaderboard/i })
    fireEvent.click(leaderboardBtn)
    
    expect(screen.getByTestId('leaderboard-modal')).toBeInTheDocument()
    expect(screen.getByText(/Leaderboard - original/)).toBeInTheDocument()
  })
  
  it('should close leaderboard modal', () => {
    render(<GameInfo {...defaultProps} />)
    
    // Open modal
    const leaderboardBtn = screen.getByRole('button', { name: /leaderboard/i })
    fireEvent.click(leaderboardBtn)
    
    // Close modal
    const closeBtn = screen.getByRole('button', { name: /close/i })
    fireEvent.click(closeBtn)
    
    expect(screen.queryByTestId('leaderboard-modal')).not.toBeInTheDocument()
  })
  
  it('should show correct game mode in modal', () => {
    render(<GameInfo {...defaultProps} gameMode="tetris" />)
    
    const leaderboardBtn = screen.getByRole('button', { name: /leaderboard/i })
    fireEvent.click(leaderboardBtn)
    
    expect(screen.getByText(/Leaderboard - tetris/)).toBeInTheDocument()
  })
  
  it('should handle single target word', () => {
    render(<GameInfo {...defaultProps} targetWords={['CAT']} />)
    
    expect(screen.getByText(/Slide tiles to form the word/)).toBeInTheDocument()
    expect(screen.getByText(/CAT/)).toBeInTheDocument()
  })
  
  it('should handle multiple target words', () => {
    render(<GameInfo {...defaultProps} targetWords={['CAT', 'DOG', 'BIRD']} />)
    
    expect(screen.getByText(/Slide tiles to form the words/)).toBeInTheDocument()
    expect(screen.getByText(/CAT, DOG, BIRD/)).toBeInTheDocument()
  })
  
  it('should display move count correctly', () => {
    const { rerender } = render(<GameInfo {...defaultProps} moveCount={0} />)
    expect(screen.getByText(/Moves:/)).toBeInTheDocument()
    expect(screen.getByText('0')).toBeInTheDocument()
    
    rerender(<GameInfo {...defaultProps} moveCount={10} />)
    expect(screen.getByText('10')).toBeInTheDocument()
    
    rerender(<GameInfo {...defaultProps} moveCount={999} />)
    expect(screen.getByText('999')).toBeInTheDocument()
  })
  
  it('should display level correctly', () => {
    const { rerender } = render(<GameInfo {...defaultProps} currentLevel={1} />)
    expect(screen.getByText('1')).toBeInTheDocument()
    
    rerender(<GameInfo {...defaultProps} currentLevel={20} />)
    expect(screen.getByText('20')).toBeInTheDocument()
  })
  
  it('should have correct tooltip on leaderboard button', () => {
    render(<GameInfo {...defaultProps} gameMode="original" />)
    
    const leaderboardBtn = screen.getByRole('button', { name: /leaderboard/i })
    expect(leaderboardBtn).toHaveAttribute('title', 'View Classic Mode Leaderboard')
  })
  
  it('should show tetris mode tooltip correctly', () => {
    render(<GameInfo {...defaultProps} gameMode="tetris" />)
    
    const leaderboardBtn = screen.getByRole('button', { name: /leaderboard/i })
    expect(leaderboardBtn).toHaveAttribute('title', 'View Tetris Mode Leaderboard')
  })
})

