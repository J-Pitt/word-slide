# 🎯 Example: Adding a New Feature Safely

## Scenario: You want to add a "hint counter" feature

### ❌ OLD WAY (Dangerous)
```
1. Write 200 lines of code
2. Push to production
3. 🔥 Users report game crashes
4. Panic!
```

### ✅ NEW WAY (Safe with Tests)

## Step 1: Check Current State
```bash
npm test -- --run
```

**Result:** ✅ All 82 tests passing

**Meaning:** Your game works perfectly right now. This is your safety net.

---

## Step 2: Make Your Changes

Let's say you add a new function to `src/utils/gameLogic.js`:

```javascript
export function calculateHintPenalty(moveCount, hintsUsed) {
  return moveCount + (hintsUsed * 2)
}
```

**Save the file.**

---

## Step 3: Run Tests Again
```bash
npm test -- --run
```

**Two possible outcomes:**

### Outcome A: ✅ All 82 tests still passing
**Meaning:** Your change didn't break anything! Safe to continue.

### Outcome B: 🔴 Some tests failed
```
❯ gameLogic > isPuzzleSolved
  → expected true to be false
  
Test Files  1 failed | 4 passed (5)
     Tests  1 failed | 81 passed (82)
```

**Meaning:** 
- Your change broke `isPuzzleSolved` function
- You found the bug BEFORE users did!
- Fix it now, not in production

---

## Step 4: Add Test for New Feature

Add to `src/utils/gameLogic.test.js`:

```javascript
describe('calculateHintPenalty', () => {
  it('should add penalty for hints used', () => {
    const result = calculateHintPenalty(10, 2)
    expect(result).toBe(14) // 10 moves + (2 hints * 2)
  })
  
  it('should work with no hints', () => {
    const result = calculateHintPenalty(10, 0)
    expect(result).toBe(10)
  })
})
```

---

## Step 5: Run Tests
```bash
npm test -- --run
```

**Result:** ✅ All 84 tests passing (82 old + 2 new)

---

## Step 6: Commit Safely
```bash
git add .
git commit -m "Add hint penalty calculation"
git push origin main
```

**Result:** 
- ✅ GitHub Actions runs all 84 tests
- ✅ All pass
- ✅ Automatically deploys
- ✅ Your users get new feature WITHOUT bugs

---

## 🎉 What Just Happened?

1. You added a new feature
2. You KNEW it didn't break existing game (tests told you)
3. You added protection for new feature (new tests)
4. You deployed with confidence
5. Your users are happy

## The Power

**Without tests:** 😰 "I hope this doesn't break anything..."
**With tests:** 😎 "I KNOW this doesn't break anything."

---

**That's the workflow!** Use it for every change, big or small.
