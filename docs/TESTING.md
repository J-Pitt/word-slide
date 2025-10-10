# Testing Guide

This guide covers testing setup, best practices, and how to write effective tests for the WordSlide game.

## Test Setup

### Test Framework
- **Vitest** - Fast test runner and assertion library
- **React Testing Library** - Component testing utilities
- **JSDOM** - DOM simulation for browser APIs

### Test Structure
```
src/
├── test/
│   ├── setup.js           # Test configuration
│   ├── integration/       # Integration tests
│   └── mobile/           # Mobile-specific tests
├── utils/                # Utility functions with tests
├── components/           # Components with tests
└── contexts/            # Contexts with tests
```

## Running Tests

### Basic Commands
```bash
# Run all tests once
npm test -- --run

# Watch mode (auto-rerun on changes)
npm run test:watch

# Interactive UI
npm run test:ui

# Coverage report
npm run test:coverage

# Run specific test file
npm test gameLogic.test.js -- --run

# Run tests matching pattern
npm test -- -t "word detection" --run
```

## Test Types

### 1. Unit Tests
Test individual functions in isolation.

**Example: `src/utils/gameLogic.test.js`**
```javascript
import { describe, it, expect } from 'vitest'
import { isPuzzleSolved } from '../gameLogic'

describe('isPuzzleSolved', () => {
  it('should return true when all words are completed', () => {
    const board = [
      ['C', 'A', 'T'],
      ['D', 'O', 'G'],
      ['', '', '']
    ]
    const completedWords = new Set(['CAT', 'DOG'])
    
    expect(isPuzzleSolved(board, completedWords)).toBe(true)
  })
  
  it('should return false when words are incomplete', () => {
    const board = [
      ['C', 'A', ''],
      ['D', 'O', 'G'],
      ['', '', '']
    ]
    const completedWords = new Set(['DOG'])
    
    expect(isPuzzleSolved(board, completedWords)).toBe(false)
  })
})
```

### 2. Component Tests
Test React components with user interactions.

**Example: `src/components/GameInfo.test.jsx`**
```javascript
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { AuthContext } from '../../contexts/AuthContext'
import GameInfo from './GameInfo'

describe('GameInfo', () => {
  it('should display user stats when logged in', () => {
    const mockAuth = {
      user: { username: 'testuser' },
      isAuthenticated: true
    }
    
    render(
      <AuthContext.Provider value={mockAuth}>
        <GameInfo level={1} moveCount={5} />
      </AuthContext.Provider>
    )
    
    expect(screen.getByText('Level: 1')).toBeInTheDocument()
    expect(screen.getByText('Moves: 5')).toBeInTheDocument()
  })
})
```

### 3. Integration Tests
Test complete user workflows.

**Example: `src/test/integration/gameFlow.test.jsx`**
```javascript
import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import App from '../../App'

describe('Game Flow Integration', () => {
  it('should complete a full game from start to win', async () => {
    render(<App />)
    
    // Start game
    fireEvent.click(screen.getByText('Start Game'))
    
    // Make moves to solve puzzle
    // ... game interactions ...
    
    // Verify completion
    expect(screen.getByText('Level Complete!')).toBeInTheDocument()
  })
})
```

### 4. Mobile Tests
Test mobile-specific functionality.

**Example: `src/test/mobile/safeArea.test.js`**
```javascript
import { describe, it, expect } from 'vitest'

describe('Mobile Safe Area', () => {
  it('should apply safe area insets', () => {
    // Mock mobile environment
    Object.defineProperty(window, 'innerHeight', {
      value: 812, // iPhone X height
      writable: true
    })
    
    // Test safe area calculations
    const safeAreaTop = Math.max(44, 44) // 44px notch
    expect(safeAreaTop).toBe(44)
  })
})
```

## Test Best Practices

### 1. Test Structure (AAA Pattern)
```javascript
it('should do something', () => {
  // Arrange - Set up test data
  const input = 'test'
  const expected = 'result'
  
  // Act - Execute the function
  const result = functionUnderTest(input)
  
  // Assert - Verify the outcome
  expect(result).toBe(expected)
})
```

### 2. Descriptive Test Names
```javascript
// ❌ Bad
it('works', () => {
  // ...
})

// ✅ Good
it('should return true when all target words are found on the board', () => {
  // ...
})
```

### 3. Test Edge Cases
```javascript
describe('executeTileMove', () => {
  it('should handle valid moves', () => {
    // Test normal case
  })
  
  it('should reject invalid moves', () => {
    // Test edge case
  })
  
  it('should handle empty board', () => {
    // Test edge case
  })
})
```

### 4. Mock External Dependencies
```javascript
import { vi } from 'vitest'

// Mock localStorage
Object.defineProperty(window, 'localStorage', {
  value: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn()
  }
})

// Mock fetch
global.fetch = vi.fn()
```

## Coverage Goals

### Target Coverage
- **Overall**: 80%+
- **Critical paths**: 90%+
- **New features**: 90%+

### Check Coverage
```bash
npm run test:coverage
open coverage/index.html
```

### Coverage Categories
- **Statements**: Code lines executed
- **Branches**: If/else paths taken
- **Functions**: Functions called
- **Lines**: Lines of code executed

## Common Test Patterns

### 1. Testing Async Operations
```javascript
it('should handle async operations', async () => {
  const promise = asyncFunction()
  
  // Wait for promise to resolve
  const result = await promise
  
  expect(result).toBeDefined()
})
```

### 2. Testing User Interactions
```javascript
it('should handle button clicks', () => {
  render(<Component />)
  
  const button = screen.getByRole('button', { name: 'Click me' })
  fireEvent.click(button)
  
  expect(screen.getByText('Clicked!')).toBeInTheDocument()
})
```

### 3. Testing Context Providers
```javascript
it('should provide context values', () => {
  const TestComponent = () => {
    const context = useContext(MyContext)
    return <div>{context.value}</div>
  }
  
  render(
    <MyContext.Provider value={{ value: 'test' }}>
      <TestComponent />
    </MyContext.Provider>
  )
  
  expect(screen.getByText('test')).toBeInTheDocument()
})
```

### 4. Testing Error States
```javascript
it('should handle errors gracefully', () => {
  const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
  
  // Trigger error condition
  expect(() => {
    riskyFunction()
  }).toThrow('Expected error')
  
  consoleSpy.mockRestore()
})
```

## Debugging Tests

### 1. Add Debug Output
```javascript
it('should find word', () => {
  const result = findWord(board, 'CAT')
  
  console.log('Board:', board)
  console.log('Result:', result)
  
  expect(result).toBe(true)
})
```

### 2. Use Screen Debugging
```javascript
import { screen } from '@testing-library/react'

it('should render component', () => {
  render(<Component />)
  
  // Print DOM structure
  screen.debug()
  
  // Find specific elements
  const element = screen.getByText('Hello')
  expect(element).toBeInTheDocument()
})
```

### 3. Run Single Test
```bash
# Run only the failing test
npm test -- -t "specific test name" --run

# Run tests in specific file
npm test gameLogic.test.js -- --run
```

## Continuous Integration

### GitHub Actions
Tests run automatically on every push:

```yaml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm test -- --run
      - run: npm run build
```

### Pre-commit Hooks
Install husky for automatic test running:

```bash
npm install --save-dev husky
npx husky install
npx husky add .husky/pre-commit "npm test -- --run"
```

## Test Maintenance

### 1. Keep Tests Fast
- Current: ~3 seconds for 127 tests ✅
- Target: <10 seconds total
- Use `vi.mock()` for slow dependencies

### 2. Keep Tests Reliable
- Avoid flaky tests
- Use deterministic test data
- Mock external services

### 3. Keep Tests Readable
- Clear test names
- Minimal setup
- Single assertion per test when possible

### 4. Update Tests with Features
- Add tests for new features
- Update tests when APIs change
- Remove obsolete tests

## Troubleshooting

### Common Issues

1. **Tests timeout**
   - Increase timeout: `it('test', { timeout: 10000 }, () => {})`
   - Check for infinite loops
   - Mock slow operations

2. **DOM not found**
   - Use `waitFor()` for async rendering
   - Check component rendering conditions
   - Verify test data setup

3. **Context errors**
   - Wrap components with required providers
   - Mock context values
   - Check provider setup

4. **Async test failures**
   - Use `await` for promises
   - Check promise resolution
   - Mock async dependencies

### Getting Help
1. Check test output for error messages
2. Run single test to isolate issues
3. Add debug logging
4. Check test setup files
5. Review similar working tests

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
- [Jest DOM Matchers](https://github.com/testing-library/jest-dom)
