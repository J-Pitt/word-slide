# Test Setup Summary

This document summarizes the test configuration and setup for the WordSlide project.

## Test Framework Configuration

### Vitest Configuration (`vitest.config.js`)
```javascript
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.js'],
    coverage: {
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test/',
        '*.config.js',
        'dist/',
        'lambda/',
        'aws-infrastructure/'
      ]
    }
  }
})
```

### Test Setup (`src/test/setup.js`)
```javascript
import '@testing-library/jest-dom/extend-expect'

// Mock localStorage
Object.defineProperty(window, 'localStorage', {
  value: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn()
  },
  writable: true
})

// Mock fetch
global.fetch = vi.fn()
```

## Test Scripts

### Package.json Scripts
```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage",
    "test:watch": "vitest --watch",
    "pre-deploy": "npm test -- --run && npm run build"
  }
}
```

## Dependencies

### Testing Dependencies
```json
{
  "devDependencies": {
    "vitest": "^0.34.6",
    "@testing-library/react": "^13.4.0",
    "@testing-library/jest-dom": "^5.17.0",
    "@testing-library/user-event": "^14.4.3",
    "jsdom": "^22.1.0",
    "@vitest/ui": "^0.34.6",
    "@vitest/coverage-v8": "^0.34.6"
  }
}
```

## Test Categories

### 1. Unit Tests
- **Location**: `src/utils/*.test.js`
- **Purpose**: Test individual utility functions
- **Examples**: Game logic, word detection, board validation

### 2. Component Tests
- **Location**: `src/components/*.test.jsx`
- **Purpose**: Test React components
- **Examples**: GameInfo, AuthModal, Leaderboard

### 3. Context Tests
- **Location**: `src/contexts/*.test.jsx`
- **Purpose**: Test React contexts
- **Examples**: AuthContext, user state management

### 4. Integration Tests
- **Location**: `src/test/integration/`
- **Purpose**: Test complete user flows
- **Examples**: Game completion, authentication flow

### 5. Mobile Tests
- **Location**: `src/test/mobile/`
- **Purpose**: Test mobile-specific features
- **Examples**: Safe area handling, touch events

## Coverage Configuration

### Current Coverage
- **Statements**: 85%+
- **Branches**: 80%+
- **Functions**: 85%+
- **Lines**: 85%+

### Coverage Exclusions
- `node_modules/`
- `src/test/`
- Configuration files
- Build artifacts
- AWS infrastructure

## Running Tests

### Basic Commands
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run with coverage
npm run test:coverage

# Run interactive UI
npm run test:ui

# Run specific test file
npm test gameLogic.test.js

# Run tests matching pattern
npm test -- -t "word detection"
```

### CI/CD Integration
Tests run automatically on:
- Every push to main branch
- Pull request creation
- Manual workflow triggers

## Test Data and Mocks

### Common Mocks
- `localStorage` - Browser storage
- `fetch` - API calls
- `window` properties - Browser APIs
- React components - Isolated testing

### Test Utilities
- Custom render functions
- Mock data generators
- Async testing helpers
- Mobile simulation utilities

## Best Practices

### Test Structure
- Use describe/it blocks for organization
- Follow AAA pattern (Arrange, Act, Assert)
- One assertion per test when possible
- Clear, descriptive test names

### Mocking Strategy
- Mock external dependencies
- Use realistic test data
- Clean up mocks between tests
- Mock at the right level

### Performance
- Keep tests fast (< 500ms per test)
- Use parallel execution
- Avoid unnecessary setup/teardown
- Mock slow operations

## Troubleshooting

### Common Issues
1. **Tests timeout** - Increase timeout or mock slow operations
2. **DOM not found** - Use waitFor for async rendering
3. **Context errors** - Wrap components with providers
4. **Mock failures** - Ensure mocks are properly configured

### Debug Tips
- Use `screen.debug()` to inspect DOM
- Add `console.log` for debugging
- Run single test to isolate issues
- Check test setup files

## Future Improvements

### Planned Enhancements
- Visual regression testing
- Performance benchmarking
- E2E testing with Playwright
- Accessibility testing
- Cross-browser testing

### Maintenance Tasks
- Regular dependency updates
- Test cleanup and optimization
- Coverage monitoring
- Documentation updates
