# 🧪 WordSlide Testing Guide

Complete testing documentation for WordSlide game.

---

## 📋 Table of Contents

1. [Quick Start](#quick-start)
2. [Test Structure](#test-structure)
3. [Running Tests](#running-tests)
4. [Test Coverage](#test-coverage)
5. [Writing New Tests](#writing-new-tests)
6. [CI/CD Integration](#cicd-integration)
7. [Troubleshooting](#troubleshooting)

---

## 🚀 Quick Start

### Install Dependencies

```bash
npm install
```

### Run All Tests

```bash
npm test
```

### Run Tests in Watch Mode

```bash
npm run test:watch
```

### Generate Coverage Report

```bash
npm run test:coverage
```

### Open Test UI (Interactive)

```bash
npm run test:ui
```

---

## 📁 Test Structure

```
src/
├── test/
│   ├── setup.js                    # Test configuration
│   ├── integration/
│   │   └── gameFlow.test.jsx       # Full game flow tests
│   └── mobile/
│       └── safeArea.test.js        # Mobile optimization tests
├── utils/
│   ├── gameLogic.js                # Core game logic (tested)
│   └── gameLogic.test.js           # Game logic unit tests
├── contexts/
│   ├── AuthContext.jsx             # Auth context (tested)
│   └── AuthContext.test.jsx        # Auth context tests
└── components/
    ├── GameInfo.jsx                # Component (tested)
    └── GameInfo.test.jsx           # Component tests
```

---

## 🧪 Test Categories

### 1. **Unit Tests**
Tests individual functions and utilities in isolation.

**Location**: `src/utils/gameLogic.test.js`

**Coverage**:
- ✅ Word detection (horizontal/vertical)
- ✅ Tile movement validation
- ✅ Board state management
- ✅ Puzzle completion checking
- ✅ Move execution
- ✅ Board validation

**Example**:
```javascript
it('should find horizontal word at correct position', () => {
  const board = [['C', 'A', 'T']]
  expect(checkWordAtPosition(board, 'CAT', 0, 0, 'horizontal')).toBe(true)
})
```

### 2. **Component Tests**
Tests React components and user interactions.

**Location**: `src/components/*.test.jsx`

**Coverage**:
- ✅ GameInfo component rendering
- ✅ Leaderboard modal interactions
- ✅ Game stats display
- ✅ User authentication UI

**Example**:
```javascript
it('should render game info correctly', () => {
  render(<GameInfo targetWords={['CAT']} moveCount={5} />)
  expect(screen.getByText(/Moves: 5/)).toBeInTheDocument()
})
```

### 3. **Context Tests**
Tests React context providers and hooks.

**Location**: `src/contexts/*.test.jsx`

**Coverage**:
- ✅ AuthContext state management
- ✅ Login/logout flows
- ✅ LocalStorage persistence
- ✅ Token management

**Example**:
```javascript
it('should handle successful login', async () => {
  // Test login flow
  await act(async () => {
    loginButton.click()
  })
  expect(screen.getByTestId('authenticated')).toHaveTextContent('yes')
})
```

### 4. **Integration Tests**
Tests complete user flows and scenarios.

**Location**: `src/test/integration/gameFlow.test.jsx`

**Coverage**:
- ✅ Complete game from start to win
- ✅ Multi-level progression
- ✅ Move validation sequences
- ✅ Word detection in gameplay
- ✅ Performance benchmarks

**Example**:
```javascript
it('should complete a full game from start to win', () => {
  // Set up initial board
  // Execute series of moves
  // Verify puzzle is solved
  expect(isPuzzleSolved(board, targetWords)).toBe(true)
})
```

### 5. **Mobile/Responsive Tests**
Tests mobile-specific features and optimizations.

**Location**: `src/test/mobile/safeArea.test.js`

**Coverage**:
- ✅ Safe area inset support
- ✅ Touch event handling
- ✅ Viewport configuration
- ✅ Device detection
- ✅ Responsive CSS features

---

## 🏃 Running Tests

### All Tests
```bash
npm test
```

### Specific Test File
```bash
npm test gameLogic.test.js
```

### Tests Matching Pattern
```bash
npm test -- -t "word detection"
```

### Watch Mode (Auto-rerun on changes)
```bash
npm run test:watch
```

### Coverage Report
```bash
npm run test:coverage
```

Coverage report will be generated in `coverage/` directory.
Open `coverage/index.html` in your browser to view detailed report.

### Interactive UI
```bash
npm run test:ui
```

Opens a browser-based UI for running and debugging tests.

---

## 📊 Test Coverage

### Current Coverage Goals

| Category | Target | Current |
|----------|--------|---------|
| Statements | 80%+ | ✅ |
| Branches | 75%+ | ✅ |
| Functions | 80%+ | ✅ |
| Lines | 80%+ | ✅ |

### Viewing Coverage

```bash
npm run test:coverage
```

Then open `coverage/index.html` in your browser.

### Coverage Exclusions

The following are excluded from coverage requirements:
- `node_modules/`
- `src/test/`
- `*.config.js`
- `dist/`
- `lambda/`
- `aws-infrastructure/`

---

## ✍️ Writing New Tests

### Test File Naming

- **Unit tests**: `[filename].test.js` (same directory as file)
- **Component tests**: `[ComponentName].test.jsx`
- **Integration tests**: Place in `src/test/integration/`

### Test Structure

```javascript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'

describe('Feature Name', () => {
  beforeEach(() => {
    // Setup before each test
  })
  
  describe('Specific Functionality', () => {
    it('should do something specific', () => {
      // Arrange
      const input = 'test'
      
      // Act
      const result = myFunction(input)
      
      // Assert
      expect(result).toBe('expected')
    })
  })
})
```

### Testing React Components

```javascript
import { render, screen, fireEvent } from '@testing-library/react'

it('should handle button click', () => {
  render(<MyComponent />)
  
  const button = screen.getByRole('button', { name: /click me/i })
  fireEvent.click(button)
  
  expect(screen.getByText('Clicked!')).toBeInTheDocument()
})
```

### Mocking

```javascript
// Mock a function
const mockFn = vi.fn()
mockFn.mockReturnValue('mocked value')

// Mock fetch
global.fetch = vi.fn(() => 
  Promise.resolve({
    ok: true,
    json: async () => ({ data: 'mock' })
  })
)

// Mock localStorage
localStorage.setItem = vi.fn()
```

### Async Tests

```javascript
import { waitFor } from '@testing-library/react'

it('should load data asynchronously', async () => {
  render(<MyComponent />)
  
  await waitFor(() => {
    expect(screen.getByText('Loaded!')).toBeInTheDocument()
  })
})
```

---

## 🔄 CI/CD Integration

### GitHub Actions Example

Create `.github/workflows/test.yml`:

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - run: npm ci
      - run: npm test
      - run: npm run test:coverage
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/coverage-final.json
```

### Pre-commit Hook

Install `husky`:

```bash
npm install --save-dev husky
npx husky install
npx husky add .husky/pre-commit "npm test"
```

This ensures tests pass before commits.

### Pre-push Hook

```bash
npx husky add .husky/pre-push "npm run test:coverage"
```

---

## 🐛 Troubleshooting

### Tests Fail After Update

```bash
# Clear cache and reinstall
rm -rf node_modules coverage .vitest
npm install
npm test
```

### Snapshot Mismatches

```bash
# Update snapshots
npm test -- -u
```

### Timeout Errors

Increase timeout in test:

```javascript
it('slow test', async () => {
  // Increase timeout to 10 seconds
  expect.timeout(10000)
  // ...
}, 10000)
```

### Mock Not Working

Ensure mocks are set up in `beforeEach`:

```javascript
beforeEach(() => {
  vi.clearAllMocks()
  global.fetch = vi.fn()
})
```

### Component Not Rendering

Check that required context providers are wrapped:

```javascript
render(
  <AuthProvider>
    <MyComponent />
  </AuthProvider>
)
```

---

## 📚 Resources

### Testing Library
- [React Testing Library](https://testing-library.com/react)
- [Testing Library Queries](https://testing-library.com/docs/queries/about)

### Vitest
- [Vitest Documentation](https://vitest.dev/)
- [Vitest API](https://vitest.dev/api/)

### Best Practices
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
- [Write Fewer, Longer Tests](https://kentcdodds.com/blog/write-fewer-longer-tests)

---

## 🎯 Test Checklist for New Features

Before adding a new feature, ensure:

- [ ] Unit tests for all utility functions
- [ ] Component tests for UI elements
- [ ] Integration tests for user flows
- [ ] Mobile/responsive tests if applicable
- [ ] Coverage > 80% for new code
- [ ] All tests pass (`npm test`)
- [ ] No console errors or warnings

---

## 🔒 Maintaining Test Quality

### Code Review Checklist

- [ ] All new code has tests
- [ ] Tests are clear and descriptive
- [ ] Edge cases are covered
- [ ] Mocks are appropriate
- [ ] No flaky tests
- [ ] Tests run quickly (< 500ms per test)

### Regular Maintenance

- Review and update tests quarterly
- Remove obsolete tests
- Refactor duplicated test code
- Update snapshots as needed
- Monitor coverage trends

---

## 📞 Getting Help

If you encounter issues with tests:

1. Check this guide first
2. Review test output carefully
3. Check existing tests for examples
4. Consult Vitest documentation
5. Ask the team for help

---

**Happy Testing! 🎉**

*Remember: Good tests = confident deployments = happy users!*

