# 🛡️ Development Workflow with Tests
## Using Tests to Protect Your Game

---

## 🎯 The Golden Rule

**Before ANY code change:**
```bash
npm test -- --run
```

**See all green? ✅ You're safe to proceed.**
**See red? 🔴 Fix before making changes.**

---

## 📋 Complete Workflow

### Step 1: Before Starting New Work

```bash
# Check current state
npm test -- --run

# Expected output:
# ✓ Test Files  5 passed (5)
# ✓ Tests      82 passed (82)
```

**This is your baseline.** All tests passing = existing game works correctly.

---

### Step 2: During Development

#### Option A: Watch Mode (Recommended for Active Development)

```bash
npm run test:watch
```

**What happens:**
- Tests run automatically when you save files
- Instant feedback as you code
- Fast iteration cycle

**Example workflow:**
```
1. Make a small change to gameLogic.js
2. Save file
3. Tests run automatically
4. See results in < 1 second
5. If green ✅ → continue
6. If red 🔴 → fix immediately
```

#### Option B: Manual Testing

```bash
# Run all tests
npm test -- --run

# Run specific test file
npm test gameLogic.test.js -- --run

# Run tests matching a pattern
npm test -- -t "word detection" --run
```

---

### Step 3: Example - Adding a New Feature

Let's say you want to add a "shuffle board" feature.

#### Bad Way ❌
```bash
# Write 500 lines of code
# Hope it works
# Deploy
# 🔥 Something breaks in production
```

#### Good Way ✅

**Step 3.1: Verify baseline**
```bash
npm test -- --run
# All 82 tests passing ✅
```

**Step 3.2: Write test first (TDD)**

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
    expect(shuffled.flat().sort()).toEqual(board.flat().sort())
    
    // Should have one empty space
    const emptyCount = shuffled.flat().filter(c => c === '').length
    expect(emptyCount).toBe(1)
    
    // Should be different from original
    expect(shuffled).not.toEqual(board)
  })
})
```

**Step 3.3: Run test (should fail)**
```bash
npm test -- -t "shuffleBoard" --run

# Expected: FAIL (function doesn't exist yet)
```

**Step 3.4: Implement the feature**

Add to `src/utils/gameLogic.js`:

```javascript
export function shuffleBoard(board) {
  // Your implementation
  const letters = board.flat().filter(c => c !== '')
  // ... shuffle logic ...
  return newBoard
}
```

**Step 3.5: Run test again**
```bash
npm test -- -t "shuffleBoard" --run

# Expected: PASS ✅
```

**Step 3.6: Run ALL tests**
```bash
npm test -- --run

# Expected: All 83 tests passing ✅
```

**If test 42 suddenly fails:**
- ❌ Your new code broke something
- 🔧 Fix it now (not in production!)
- ✅ All tests pass → safe to continue

**Step 3.7: Commit**
```bash
git add .
git commit -m "Add shuffle board feature"
git push origin main
```

---

## 🎪 Real-World Scenarios

### Scenario 1: "I want to change how word detection works"

```bash
# 1. Check baseline
npm test -- --run
# ✅ 82 passing

# 2. Start watch mode
npm run test:watch

# 3. Open src/utils/gameLogic.js
# 4. Modify checkWordAtPosition function
# 5. Save
# 6. Watch tests run automatically

# If tests fail:
# - Read error message
# - Your change broke something
# - Fix or revert

# If tests pass:
# - Your change is safe!
# - Continue developing
```

### Scenario 2: "I want to add a new game mode"

```bash
# 1. Baseline check
npm test -- --run

# 2. Add new test file
touch src/test/integration/newGameMode.test.jsx

# 3. Write tests for new mode
# 4. Implement new mode
# 5. Run tests

npm test -- --run

# Check:
# ✅ All 82 old tests still passing? → Didn't break existing game
# ✅ All new tests passing? → New feature works
# 🚀 Safe to deploy!
```

### Scenario 3: "I want to refactor messy code"

```bash
# 1. Check baseline (CRITICAL!)
npm test -- --run
# ✅ 82 passing

# 2. Start watch mode
npm run test:watch

# 3. Refactor code
# 4. Save and watch tests

# Tests still passing?
# ✅ YES → Refactor is safe
# ❌ NO → You broke something, fix it
```

---

## 🚨 What to Do When Tests Fail

### Step-by-Step Debug Process

**1. Read the error message carefully**
```bash
npm test -- --run

# Example output:
# FAIL  src/utils/gameLogic.test.js > checkWordAtPosition
# Error: expected true to be false
#   at line 45: expect(result).toBe(false)
```

**2. Identify what broke**
- Which test failed?
- What was expected vs what happened?
- Did you change that code?

**3. Run just that test**
```bash
npm test -- -t "checkWordAtPosition" --run
```

**4. Add debug logging**
```javascript
it('should find word', () => {
  const result = checkWordAtPosition(board, 'CAT', 0, 0, 'horizontal')
  console.log('Result:', result)  // Add this
  console.log('Board:', board)    // And this
  expect(result).toBe(true)
})
```

**5. Fix the issue**
- If your code is wrong → fix your code
- If test is wrong → fix the test
- If both are right → you found a real bug!

**6. Verify fix**
```bash
npm test -- --run
# All passing ✅
```

---

## 🔄 Git Integration

### Pre-Commit Workflow

```bash
# Before every commit:

# 1. Run tests
npm test -- --run

# 2. If passing, commit
git add .
git commit -m "Your changes"

# 3. If failing, DON'T commit
# Fix tests first!
```

### Automatic Pre-Commit Hook (Optional)

Install husky to run tests automatically:

```bash
npm install --save-dev husky
npx husky install
npx husky add .husky/pre-commit "npm test -- --run"
```

Now tests run automatically before every commit!

```bash
git commit -m "Changes"

# Automatically runs:
# → npm test -- --run
# → If pass ✅ → commit succeeds
# → If fail 🔴 → commit blocked!
```

---

## 📊 Understanding Test Output

### Successful Run
```bash
✓ src/utils/gameLogic.test.js  (35 tests) 43ms
✓ src/test/integration/gameFlow.test.jsx  (12 tests) 36ms
✓ src/test/mobile/safeArea.test.js  (17 tests) 56ms
✓ src/contexts/AuthContext.test.jsx  (7 tests) 258ms
✓ src/components/GameInfo.test.jsx  (11 tests) 633ms

Test Files  5 passed (5)
     Tests  82 passed (82)
```

**Meaning:** Everything works! Safe to deploy.

### Failed Run
```bash
✓ src/utils/gameLogic.test.js  (34 tests | 1 failed) 43ms
  ❯ gameLogic > checkWordAtPosition > should find word
    → expected true to be false

Test Files  1 failed | 4 passed (5)
     Tests  1 failed | 81 passed (82)
```

**Meaning:** 
- 81 tests still work ✅
- 1 test broke 🔴
- Something changed that affected checkWordAtPosition
- **Don't deploy until fixed!**

---

## 💡 Pro Tips

### Tip 1: Test Before AND After

```bash
# BEFORE making changes
npm test -- --run
# Screenshot or note the count: 82 passing

# Make your changes...

# AFTER changes
npm test -- --run
# Should still be: 82 passing (or more if you added tests)
```

### Tip 2: Run Tests in CI/CD

Your GitHub Actions already does this!

Every push automatically:
1. ✅ Runs all tests
2. ✅ Blocks deploy if tests fail
3. ✅ Notifies you of failures

Check status: https://github.com/your-repo/actions

### Tip 3: Use Coverage to Find Gaps

```bash
npm run test:coverage
open coverage/index.html
```

**Red lines = untested code = risky to change**

### Tip 4: Test at Different Levels

```bash
# Quick check (unit tests only)
npm test gameLogic.test.js -- --run

# Full check (all tests)
npm test -- --run

# With UI
npm run test:ui
```

### Tip 5: Keep Tests Fast

- Current: 3.26s for 82 tests ✅ GOOD
- If it gets to 30s+ → too slow
- Fast tests = you'll actually run them
- Slow tests = you'll skip them 🔴

---

## 📅 Daily Development Routine

### Morning Ritual ☀️
```bash
git pull origin main
npm test -- --run
```
**Start with a clean slate!**

### Before Lunch 🍔
```bash
npm test -- --run
git add .
git commit -m "Morning work"
```
**Save your progress with passing tests**

### End of Day 🌙
```bash
npm test -- --run
npm run test:coverage
git push origin main
```
**Leave with everything working**

---

## 🎯 Quick Reference Card

### Most Common Commands

```bash
# Run all tests once
npm test -- --run

# Watch mode (auto-rerun)
npm run test:watch

# Run specific file
npm test gameLogic.test.js -- --run

# Run tests matching pattern
npm test -- -t "word detection" --run

# Coverage report
npm run test:coverage

# Interactive UI
npm run test:ui

# Before deploy check
npm run pre-deploy
```

### When to Run Tests

| Situation | Command | Why |
|-----------|---------|-----|
| Before starting work | `npm test -- --run` | Establish baseline |
| During active dev | `npm run test:watch` | Instant feedback |
| Before commit | `npm test -- --run` | Ensure nothing broke |
| Before push | `npm run pre-deploy` | Final safety check |
| After git pull | `npm test -- --run` | Verify others didn't break things |

---

## 🚀 Deployment Protection

### Local Check
```bash
npm run pre-deploy
```

This runs:
- ✅ All tests
- ✅ Build
- ✅ Coverage check

### Automatic Check (Already Set Up!)

When you push to GitHub:
1. GitHub Actions runs
2. Tests execute automatically
3. If tests fail → deploy blocked 🛑
4. You get notified
5. Fix and push again

**You can't accidentally deploy broken code!**

---

## 📈 Adding Tests for New Features

### Pattern to Follow

```javascript
// 1. Create test file
// src/features/newFeature.test.js

import { describe, it, expect } from 'vitest'
import { newFeature } from './newFeature'

describe('newFeature', () => {
  it('should do the thing', () => {
    // Arrange
    const input = 'test'
    
    // Act
    const result = newFeature(input)
    
    // Assert
    expect(result).toBe('expected')
  })
  
  it('should handle edge case', () => {
    const result = newFeature(null)
    expect(result).toBe(null)
  })
})
```

### Test Coverage Goal

**Aim for 80%+ coverage on new code**

Check with:
```bash
npm run test:coverage
```

---

## 🎓 Learning Path

### Week 1: Get Comfortable
- Run `npm test -- --run` daily
- Watch the output
- Get used to seeing all green

### Week 2: Use Watch Mode
- Try `npm run test:watch`
- Make small changes
- See tests run automatically
- Get instant feedback

### Week 3: Fix a Failing Test
- Intentionally break something
- Watch test fail
- Fix it
- See test pass
- Build confidence!

### Week 4: Write Your First Test
- Add one simple test
- See it fail
- Make it pass
- Feel the power!

---

## ⚡ Quick Win Examples

### Example 1: Safe Refactoring

```bash
# You want to rename a function

# Step 1: Tests pass ✅
npm test -- --run

# Step 2: Rename function
# (Your IDE will update all references)

# Step 3: Tests still pass ✅
npm test -- --run

# Done! Safe refactor.
```

### Example 2: Bug Fix

```bash
# User reports bug: "CAT not detected in vertical"

# Step 1: Write failing test
it('should find CAT vertically', () => {
  const board = [['C'], ['A'], ['T']]
  const found = findWordOnBoard(board, 'CAT')
  expect(found.length).toBeGreaterThan(0)
})

# Step 2: Run test
npm test -- --run
# FAIL ✅ (good! test catches the bug)

# Step 3: Fix code
# ... fix the bug ...

# Step 4: Run test
npm test -- --run
# PASS ✅ (bug fixed!)

# Step 5: Bug can never come back
# Test protects it forever!
```

---

## 🎉 Success Metrics

### You're Using Tests Right When:

✅ You run tests before committing
✅ You check test output
✅ You fix failing tests immediately
✅ You add tests for new features
✅ You feel confident deploying
✅ You catch bugs before users do

### Warning Signs:

⚠️ Skipping tests because "too slow"
⚠️ Committing without running tests
⚠️ Ignoring failing tests
⚠️ Commenting out tests to make them pass
⚠️ Deploying when tests fail

---

## 📞 Need Help?

### Test Fails and You Don't Know Why?

1. Read error message carefully
2. Run just that test: `npm test -- -t "test name" --run`
3. Add `console.log` to debug
4. Check what changed recently
5. Ask for help with error message

### Test Passes But Feature Doesn't Work?

- Test might be wrong
- Test might not cover the real scenario
- Add more tests!

---

## 🎯 Remember

**Tests are not a burden.**
**Tests are your safety net.**
**Tests let you move fast without breaking things.**

```
Without tests: 😰 "Will this break something?"
With tests:    😎 "I'll know in 3 seconds."
```

---

**Happy Testing! 🚀**

*Your game is protected. Build fearlessly.*

