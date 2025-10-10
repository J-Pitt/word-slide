# Example: Adding a New Feature

This document demonstrates how to add a new feature to WordSlide following best practices and using the test suite for protection.

## Feature: "Shuffle Board" Button

Let's add a "Shuffle Board" feature that allows players to rearrange letters while keeping the empty space.

### Step 1: Write Tests First (TDD)

Create `src/utils/gameLogic.test.js` and add:

```javascript
describe('shuffleBoard', () => {
  it('should shuffle tiles while keeping empty space', () => {
    const board = [
      ['C', 'A', 'T'],
      ['D', 'O', ''],
      ['B', 'I', 'G']
    ]
    
    const shuffled = shuffleBoard(board)
    
    // Should have same letters
    expect(shuffled.flat().filter(c => c !== '').sort())
      .toEqual(board.flat().filter(c => c !== '').sort())
    
    // Should have one empty space
    const emptyCount = shuffled.flat().filter(c => c === '').length
    expect(emptyCount).toBe(1)
    
    // Should be different from original
    expect(shuffled).not.toEqual(board)
  })
  
  it('should handle empty board', () => {
    const board = [[], [], []]
    const shuffled = shuffleBoard(board)
    expect(shuffled).toEqual(board)
  })
  
  it('should preserve blocked cells', () => {
    const board = [
      ['C', 'A', 'T'],
      ['D', 'O', 'BLOCKED'],
      ['', 'I', 'G']
    ]
    
    const shuffled = shuffleBoard(board)
    
    // Blocked cell should remain in same position
    expect(shuffled[1][2]).toBe('BLOCKED')
    
    // Other letters should be shuffled
    const originalLetters = board.flat().filter(c => c !== '' && c !== 'BLOCKED')
    const shuffledLetters = shuffled.flat().filter(c => c !== '' && c !== 'BLOCKED')
    expect(shuffledLetters.sort()).toEqual(originalLetters.sort())
  })
})
```

### Step 2: Run Tests (Should Fail)

```bash
npm test -- -t "shuffleBoard" --run
```

Expected output:
```
FAIL  src/utils/gameLogic.test.js > shuffleBoard
Error: shuffleBoard is not defined
```

### Step 3: Implement the Feature

Add to `src/utils/gameLogic.js`:

```javascript
/**
 * Shuffles the board letters while preserving empty space and blocked cells
 * @param {Array<Array<string>>} board - The game board
 * @returns {Array<Array<string>>} - Shuffled board
 */
export function shuffleBoard(board) {
  if (!board || board.length === 0) {
    return board
  }
  
  const rows = board.length
  const cols = board[0].length
  
  // Collect all non-empty, non-blocked letters
  const letters = []
  const emptyPositions = []
  const blockedPositions = []
  
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cell = board[r][c]
      if (cell === '') {
        emptyPositions.push({ r, c })
      } else if (cell === 'BLOCKED') {
        blockedPositions.push({ r, c })
      } else {
        letters.push(cell)
      }
    }
  }
  
  // Create new board
  const newBoard = board.map(row => [...row])
  
  // Shuffle letters using Fisher-Yates algorithm
  for (let i = letters.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[letters[i], letters[j]] = [letters[j], letters[i]]
  }
  
  // Place letters back on board
  let letterIndex = 0
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (board[r][c] === '') {
        newBoard[r][c] = ''
      } else if (board[r][c] === 'BLOCKED') {
        newBoard[r][c] = 'BLOCKED'
      } else {
        newBoard[r][c] = letters[letterIndex++]
      }
    }
  }
  
  return newBoard
}
```

### Step 4: Run Tests Again

```bash
npm test -- -t "shuffleBoard" --run
```

Expected output:
```
✓ src/utils/gameLogic.test.js > shuffleBoard (3 tests)
```

### Step 5: Add Component Integration

Create `src/components/ShuffleButton.jsx`:

```javascript
import React from 'react'
import './ShuffleButton.css'

export default function ShuffleButton({ onShuffle, disabled = false }) {
  return (
    <button 
      className={`shuffle-button ${disabled ? 'disabled' : ''}`}
      onClick={onShuffle}
      disabled={disabled}
      title="Shuffle letters while keeping empty space"
    >
      🔀 Shuffle
    </button>
  )
}
```

Create `src/components/ShuffleButton.css`:

```css
.shuffle-button {
  background: linear-gradient(145deg, #4a90e2, #357abd);
  border: none;
  border-radius: 8px;
  color: white;
  padding: 8px 16px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.shuffle-button:hover:not(.disabled) {
  background: linear-gradient(145deg, #357abd, #2c5f8a);
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
}

.shuffle-button:active:not(.disabled) {
  transform: translateY(0);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.shuffle-button.disabled {
  background: #ccc;
  cursor: not-allowed;
  opacity: 0.6;
}
```

### Step 6: Add Component Tests

Create `src/components/ShuffleButton.test.jsx`:

```javascript
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import ShuffleButton from './ShuffleButton'

describe('ShuffleButton', () => {
  it('should render shuffle button', () => {
    render(<ShuffleButton onShuffle={() => {}} />)
    
    expect(screen.getByText('🔀 Shuffle')).toBeInTheDocument()
    expect(screen.getByRole('button')).toBeInTheDocument()
  })
  
  it('should call onShuffle when clicked', () => {
    const mockOnShuffle = vi.fn()
    render(<ShuffleButton onShuffle={mockOnShuffle} />)
    
    const button = screen.getByRole('button')
    fireEvent.click(button)
    
    expect(mockOnShuffle).toHaveBeenCalledTimes(1)
  })
  
  it('should be disabled when disabled prop is true', () => {
    render(<ShuffleButton onShuffle={() => {}} disabled={true} />)
    
    const button = screen.getByRole('button')
    expect(button).toBeDisabled()
    expect(button).toHaveClass('disabled')
  })
  
  it('should not call onShuffle when disabled', () => {
    const mockOnShuffle = vi.fn()
    render(<ShuffleButton onShuffle={mockOnShuffle} disabled={true} />)
    
    const button = screen.getByRole('button')
    fireEvent.click(button)
    
    expect(mockOnShuffle).not.toHaveBeenCalled()
  })
})
```

### Step 7: Integrate into Main App

Update `src/App.jsx`:

```javascript
import { shuffleBoard } from './utils/gameLogic'
import ShuffleButton from './components/ShuffleButton'

// Add state for shuffle cooldown
const [shuffleCooldown, setShuffleCooldown] = useState(false)

// Add shuffle handler
const handleShuffle = useCallback(() => {
  if (shuffleCooldown || currentView !== 'original') return
  
  const shuffledBoard = shuffleBoard(board)
  setBoard(shuffledBoard)
  
  // Add cooldown to prevent spam
  setShuffleCooldown(true)
  setTimeout(() => {
    setShuffleCooldown(false)
  }, 2000) // 2 second cooldown
  
  // Increment move count
  setMoveCount(prev => prev + 1)
}, [board, currentView, shuffleCooldown])

// Add button to game UI
{currentView === 'original' && (
  <div className="game-controls">
    <ShuffleButton 
      onShuffle={handleShuffle}
      disabled={shuffleCooldown}
    />
  </div>
)}
```

### Step 8: Add Integration Tests

Update `src/test/integration/gameFlow.test.jsx`:

```javascript
describe('Shuffle Feature Integration', () => {
  it('should shuffle board when shuffle button is clicked', () => {
    render(<App />)
    
    // Start game
    fireEvent.click(screen.getByText('Start Game'))
    
    // Get initial board state
    const initialBoard = screen.getAllByRole('button')
      .filter(btn => btn.textContent.match(/[A-Z]/))
      .map(btn => btn.textContent)
    
    // Click shuffle button
    fireEvent.click(screen.getByText('🔀 Shuffle'))
    
    // Get new board state
    const shuffledBoard = screen.getAllByRole('button')
      .filter(btn => btn.textContent.match(/[A-Z]/))
      .map(btn => btn.textContent)
    
    // Should have same letters but different arrangement
    expect(shuffledBoard.sort()).toEqual(initialBoard.sort())
    expect(shuffledBoard).not.toEqual(initialBoard)
  })
  
  it('should respect shuffle cooldown', () => {
    render(<App />)
    
    fireEvent.click(screen.getByText('Start Game'))
    
    const shuffleButton = screen.getByText('🔀 Shuffle')
    
    // First click should work
    fireEvent.click(shuffleButton)
    expect(shuffleButton).toBeDisabled()
    
    // Second click immediately should not work
    fireEvent.click(shuffleButton)
    // Button should still be disabled
    
    // Wait for cooldown
    vi.advanceTimersByTime(2000)
    expect(shuffleButton).not.toBeDisabled()
  })
})
```

### Step 9: Run All Tests

```bash
npm test -- --run
```

Expected output:
```
✓ All tests passing
```

### Step 10: Test Coverage

```bash
npm run test:coverage
```

Check that new functions have good coverage.

### Step 11: Manual Testing

1. Start the game
2. Click the shuffle button
3. Verify letters rearrange
4. Verify empty space stays in same position
5. Verify shuffle cooldown works
6. Test on different difficulties (blocked cells preserved)

### Step 12: Commit and Deploy

```bash
git add .
git commit -m "feat: add shuffle board functionality

- Add shuffleBoard utility function with tests
- Add ShuffleButton component with tests
- Integrate shuffle feature into main game
- Add cooldown to prevent spam
- Preserve blocked cells and empty space
- Add integration tests for shuffle flow"

git push origin main
```

## Best Practices Demonstrated

### 1. Test-Driven Development (TDD)
- Wrote tests before implementation
- Tests failed initially (red)
- Implemented feature to make tests pass (green)
- Refactored if needed

### 2. Comprehensive Testing
- Unit tests for utility functions
- Component tests for UI elements
- Integration tests for user flows
- Edge case testing

### 3. Clean Code
- Clear function names and documentation
- Single responsibility principle
- Proper error handling
- Consistent code style

### 4. User Experience
- Visual feedback (disabled state)
- Cooldown to prevent spam
- Preserves game state integrity
- Accessible button with title

### 5. Performance
- Efficient shuffling algorithm
- Minimal re-renders
- Proper cleanup of timeouts

## Common Pitfalls to Avoid

### 1. Not Testing Edge Cases
```javascript
// ❌ Bad - only tests happy path
it('should shuffle board', () => {
  // Test only normal case
})

// ✅ Good - tests edge cases
it('should handle empty board', () => {
  // Test edge case
})
it('should preserve blocked cells', () => {
  // Test edge case
})
```

### 2. Breaking Game State
```javascript
// ❌ Bad - could break game logic
const shuffled = shuffleBoard(board)
setBoard(shuffled)
// Missing move count increment!

// ✅ Good - maintains game state
const shuffled = shuffleBoard(board)
setBoard(shuffled)
setMoveCount(prev => prev + 1) // Maintain game state
```

### 3. Not Handling Async Operations
```javascript
// ❌ Bad - doesn't wait for state updates
fireEvent.click(shuffleButton)
expect(board).toHaveChanged() // Might fail due to timing

// ✅ Good - waits for updates
fireEvent.click(shuffleButton)
await waitFor(() => {
  expect(board).toHaveChanged()
})
```

### 4. Missing Accessibility
```javascript
// ❌ Bad - no accessibility
<button onClick={onShuffle}>Shuffle</button>

// ✅ Good - accessible
<button 
  onClick={onShuffle}
  disabled={disabled}
  title="Shuffle letters while keeping empty space"
  aria-label="Shuffle board letters"
>
  🔀 Shuffle
</button>
```

## Next Steps

After implementing this feature:

1. **Monitor Usage**: Track how often players use shuffle
2. **Gather Feedback**: Ask players about the feature
3. **Optimize**: Improve based on usage patterns
4. **Document**: Update game documentation
5. **Consider Variations**: Maybe add "smart shuffle" that doesn't break words

## Summary

This example shows the complete process of adding a new feature:

1. ✅ Write tests first (TDD)
2. ✅ Implement feature
3. ✅ Add component tests
4. ✅ Integrate into app
5. ✅ Add integration tests
6. ✅ Run all tests
7. ✅ Check coverage
8. ✅ Manual testing
9. ✅ Commit and deploy

Following this process ensures:
- **Quality**: Comprehensive testing
- **Safety**: Existing functionality protected
- **Maintainability**: Clean, documented code
- **User Experience**: Thoughtful design
- **Confidence**: Deploy without fear

This is the standard workflow for all new features in WordSlide!
