import React, { useState, useEffect, useRef, useCallback } from 'react'
import GameBoard from './components/GameBoard'
import GameInfo from './components/GameInfo'
import './styles.css'

const ROWS = 7
const COLS = 7
const MAX_LEVELS = 10

// Word sets for each level - now with longer words for 7x7 board
const WORD_SETS = [
  ["five", "rice", "bird"],    // Level 1
  ["cat", "dog", "pig"],       // Level 2
  ["red", "blue", "pink"],     // Level 3
  ["sun", "moon", "star"],     // Level 4
  ["book", "read", "write"],   // Level 5
  ["tree", "leaf", "root"],    // Level 6
  ["fish", "swim", "ocean"],   // Level 7
  ["play", "game", "fun"],     // Level 8
  ["food", "eat", "meal"],     // Level 9
  ["love", "heart", "care"]    // Level 10
]


function App() {
  const [board, setBoard] = useState([])
  const [emptyPos, setEmptyPos] = useState({ r: 6, c: 6 })
  const [moveCount, setMoveCount] = useState(0)
  const [currentLevel, setCurrentLevel] = useState(1)
  const [completedTiles, setCompletedTiles] = useState([])
  const [animating, setAnimating] = useState(false)
  const [animation, setAnimation] = useState(null)
  const [gameWon, setGameWon] = useState(false)

  // Shuffle array function
  const shuffleArray = (arr) => {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  const getCurrentWordSet = useCallback(() => {
    return WORD_SETS[currentLevel - 1] || WORD_SETS[0]
  }, [currentLevel])

  const generateBoard = useCallback(() => {
    const targetWords = getCurrentWordSet()
    const newBoard = []
    
    // Initialize empty board
    for (let r = 0; r < ROWS; r++) {
      newBoard[r] = []
      for (let c = 0; c < COLS; c++) {
        newBoard[r][c] = ""
      }
    }
    
    // Create a truly scrambled board based on current target words
    const allLetters = []
    
    // Add letters from target words
    for (let r = 0; r < targetWords.length; r++) {
      const word = targetWords[r]
      for (let c = 0; c < word.length; c++) {
        allLetters.push(word[c].toUpperCase())
      }
    }
    
    // Add random letters to fill the board
    const remainingSlots = ROWS * COLS - allLetters.length - 1 // -1 for empty space
    for (let i = 0; i < remainingSlots; i++) {
      allLetters.push(String.fromCharCode(65 + Math.floor(Math.random() * 26)))
    }
    
    // Shuffle all letters
    shuffleArray(allLetters)
    
    // Place letters on the board in scrambled positions
    let letterIndex = 0
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (r === ROWS - 1 && c === COLS - 1) {
          newBoard[r][c] = "" // Empty space in bottom-right
        } else {
          newBoard[r][c] = allLetters[letterIndex++]
        }
      }
    }
    
    // Ensure the board is not already solved by making strategic swaps
    // This guarantees the puzzle requires solving
    const scrambleMoves = Math.floor(Math.random() * 3) + 2 // 2-4 random moves
    
    for (let i = 0; i < scrambleMoves; i++) {
      // Find two random positions to swap
      let pos1 = { r: Math.floor(Math.random() * ROWS), c: Math.floor(Math.random() * COLS) }
      let pos2 = { r: Math.floor(Math.random() * ROWS), c: Math.floor(Math.random() * COLS) }
      
      // Make sure we're not swapping with the empty space
      while ((pos1.r === ROWS - 1 && pos1.c === COLS - 1) || 
             (pos2.r === ROWS - 1 && pos2.c === COLS - 1)) {
        pos1 = { r: Math.floor(Math.random() * ROWS), c: Math.floor(Math.random() * COLS) }
        pos2 = { r: Math.floor(Math.random() * ROWS), c: Math.floor(Math.random() * COLS) }
      }
      
      // Swap the letters
      const temp = newBoard[pos1.r][pos1.c]
      newBoard[pos1.r][pos1.c] = newBoard[pos2.r][pos2.c]
      newBoard[pos2.r][pos2.c] = temp
    }
    
    setBoard(newBoard)
    setEmptyPos({ r: ROWS - 1, c: COLS - 1 })
    setMoveCount(0)
    setCompletedTiles([])
    setGameWon(false)
  }, [currentLevel, getCurrentWordSet])

  const isWordCompleted = useCallback((rowIndex) => {
    const targetWords = getCurrentWordSet()
    if (rowIndex >= targetWords.length) return false
    
    const targetWord = targetWords[rowIndex]
    let word = ""
    for (let c = 0; c < targetWord.length; c++) {
      if (!board[rowIndex] || typeof board[rowIndex][c] !== "string") return false
      word += board[rowIndex][c]
    }
    // Convert both to uppercase for comparison since board letters are uppercase
    const isCompleted = word.toUpperCase() === targetWord.toUpperCase()
    console.log(`Row ${rowIndex}: "${word}" (${word.length} chars) === "${targetWord}" (${word.length} chars) = ${isCompleted}`) // Debug
    console.log(`Row ${rowIndex} board:`, board[rowIndex]) // Debug
    return isCompleted
  }, [board, getCurrentWordSet])

  const isWordCompletedVertical = useCallback((colIndex) => {
    const targetWords = getCurrentWordSet()
    if (colIndex >= targetWords.length) return false
    
    const targetWord = targetWords[colIndex]
    let word = ""
    for (let r = 0; r < targetWord.length; r++) {
      if (!board[r] || typeof board[r][colIndex] !== "string") return false
      word += board[r][colIndex]
    }
    // Convert both to uppercase for comparison since board letters are uppercase
    const isCompleted = word.toUpperCase() === targetWord.toUpperCase()
    console.log(`Col ${colIndex}: "${word}" (${word.length} chars) === "${targetWord}" (${word.length} chars) = ${isCompleted}`) // Debug
    return isCompleted
  }, [board, getCurrentWordSet])

  const isTileCompleted = useCallback((r, c) => {
    return completedTiles.some(tile => tile.r === r && tile.c === c)
  }, [completedTiles])

  const checkWordCompletion = useCallback(() => {
    const targetWords = getCurrentWordSet()
    const newCompletedTiles = []
    
    console.log("=== Word Completion Check ===") // Debug
    console.log("Target words:", targetWords) // Debug
    
    // Check horizontal words (rows)
    for (let i = 0; i < targetWords.length; i++) {
      const isCompleted = isWordCompleted(i)
      console.log(`Row ${i} completed: ${isCompleted}`) // Debug
      
      if (isCompleted) {
        // Add all tiles from this completed word to the completed tiles list
        const targetWord = targetWords[i]
        for (let c = 0; c < targetWord.length; c++) {
          newCompletedTiles.push({ r: i, c: c })
        }
        console.log(`Added tiles for row ${i}:`, newCompletedTiles) // Debug
      }
    }
    
    // Check vertical words (columns)
    for (let i = 0; i < targetWords.length; i++) {
      const isCompleted = isWordCompletedVertical(i)
      console.log(`Col ${i} completed: ${isCompleted}`) // Debug
      
      if (isCompleted) {
        // Add all tiles from this completed word to the completed tiles list
        const targetWord = targetWords[i]
        for (let r = 0; r < targetWord.length; r++) {
          newCompletedTiles.push({ r: r, c: i })
        }
        console.log(`Added tiles for col ${i}:`, newCompletedTiles) // Debug
      }
    }
    
    console.log("Final completed tiles:", newCompletedTiles) // Debug
    console.log("Current board:", board) // Debug
    setCompletedTiles(newCompletedTiles)
  }, [isWordCompleted, isWordCompletedVertical, board, getCurrentWordSet])

  const wordsAreSolved = useCallback(() => {
    const targetWords = getCurrentWordSet()
    console.log("=== Checking if words are solved ===") // Debug
    console.log("Target words:", targetWords) // Debug
    console.log("Current board:", board) // Debug
    
    let solvedWords = 0
    const totalWords = targetWords.length
    
    // Check horizontal words (rows)
    for (let i = 0; i < targetWords.length; i++) {
      let word = ""
      for (let c = 0; c < targetWords[i].length; c++) {
        if (!board[i] || typeof board[i][c] !== "string") {
          console.log(`Row ${i}, col ${c}: missing or invalid`) // Debug
          continue // Skip this word, check others
        }
        word += board[i][c]
      }
      console.log(`Row ${i}: "${word}" vs "${targetWords[i]}"`) // Debug
      if (word.toUpperCase() === targetWords[i].toUpperCase()) {
        console.log(`✅ Row ${i} is solved!`) // Debug
        solvedWords++
      }
    }
    
    // Check vertical words (columns)
    for (let i = 0; i < targetWords.length; i++) {
      let word = ""
      for (let r = 0; r < targetWords[i].length; r++) {
        if (!board[r] || typeof board[r][i] !== "string") {
          console.log(`Col ${i}, row ${r}: missing or invalid`) // Debug
          continue // Skip this word, check others
        }
        word += board[r][i]
      }
      console.log(`Col ${i}: "${word}" vs "${targetWords[i]}"`) // Debug
      if (word.toUpperCase() === targetWords[i].toUpperCase()) {
        console.log(`✅ Col ${i} is solved!`) // Debug
        solvedWords++
      }
    }
    
    console.log(`Solved words: ${solvedWords}/${totalWords}`) // Debug
    
    // Check if ALL words are solved (not just any)
    if (solvedWords >= totalWords) {
      console.log("🎉 ALL WORDS ARE SOLVED! WIN CONDITION MET!") // Debug
      return true
    }
    
    console.log("❌ Not all words are solved yet") // Debug
    return false
  }, [board, getCurrentWordSet])

  const tryMove = useCallback((r, c) => {
    if (animating || gameWon) return

    // Check if the tile being moved is part of a completed word
    if (isTileCompleted(r, c)) {
      return; // Don't allow moving tiles from completed words
    }

    const dr = Math.abs(r - emptyPos.r)
    const dc = Math.abs(c - emptyPos.c)
    
    if ((dr === 1 && dc === 0) || (dr === 0 && dc === 1)) {
      setAnimating(true)
      setAnimation({
        from: { r, c },
        to: { r: emptyPos.r, c: emptyPos.c },
        letter: board[r][c],
        progress: 0,
        duration: 15
      })
      
      const newMoveCount = moveCount + 1
      setMoveCount(newMoveCount)
    }
  }, [animating, gameWon, emptyPos, board, moveCount, isTileCompleted])

  const updateAnimation = useCallback(() => {
    if (!animating || !animation) return

    setAnimation(prev => {
      const newProgress = prev.progress + 1
      
      if (newProgress >= prev.duration) {
        // Finish animation and swap
        setBoard(currentBoard => {
          const newBoard = currentBoard.map(row => [...row])
          newBoard[prev.to.r][prev.to.c] = prev.letter
          newBoard[prev.from.r][prev.from.c] = ""
          return newBoard
        })
        
        setEmptyPos({ r: prev.from.r, c: prev.from.c })
        setAnimating(false)
        
        // Check for word completion after each move
        checkWordCompletion()
        
        // Check for win condition
        const newBoard = board.map(row => [...row])
        newBoard[prev.to.r][prev.to.c] = prev.letter
        newBoard[prev.from.r][prev.from.c] = ""
        
        const targetWords = getCurrentWordSet()
        let allWordsSolved = true
        for (let i = 0; i < targetWords.length; i++) {
          let word = ""
          for (let c = 0; c < targetWords[i].length; c++) {
            if (!newBoard[i] || typeof newBoard[i][c] !== "string") {
              allWordsSolved = false
              break
            }
            word += newBoard[i][c]
          }
          if (word !== targetWords[i]) {
            allWordsSolved = false
            break
          }
        }
        
        if (allWordsSolved) {
          setGameWon(true)
        }
        
        return null
      }
      
      return { ...prev, progress: newProgress }
    })
  }, [animating, animation, board])

  const resetGame = useCallback(() => {
    setCurrentLevel(1)
    setMoveCount(0)
    setCompletedTiles([])
    generateBoard()
  }, [generateBoard])

  // Create dark wood paneling background function
  const createDarkWoodPaneling = useCallback(() => {
    // Remove existing paneling if it exists
    const existingPaneling = document.getElementById('dark-wood-paneling')
    if (existingPaneling) {
      existingPaneling.remove()
    }
    
    // Create dark wood paneling background container
    const panelingContainer = document.createElement('div')
    panelingContainer.id = 'dark-wood-paneling'
    panelingContainer.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: 
          linear-gradient(135deg, #2F1B14 0%, #3D2318 20%, #4A2C1A 40%, #5D3A1F 60%, #4A2C1A 80%, #3D2318 100%),
          repeating-linear-gradient(
              90deg,
              transparent,
              transparent 1px,
              rgba(47, 27, 20, 0.6) 1px,
              rgba(47, 27, 20, 0.6) 3px
          ),
          repeating-linear-gradient(
              0deg,
              transparent,
              transparent 2px,
              rgba(61, 35, 24, 0.7) 2px,
              rgba(61, 35, 24, 0.7) 15px
          );
      z-index: -1;
      pointer-events: none;
    `
    
    // Create wood paneling strips - single column
    const panelWidth = window.innerWidth // Full width
    const panelHeight = 80 // Taller panels
    const panelsPerCol = Math.ceil(window.innerHeight / panelHeight) + 1
    
    for (let row = 0; row < panelsPerCol; row++) {
      const panel = document.createElement('div')
      panel.style.cssText = `
        position: absolute;
        top: ${row * panelHeight}px;
        left: 0;
        width: ${panelWidth}px;
        height: ${panelHeight}px;
          background: 
              linear-gradient(135deg, #2F1B14 0%, #3D2318 30%, #4A2C1A 50%, #5D3A1F 70%, #4A2C1A 90%, #3D2318 100%),
              repeating-linear-gradient(
                  90deg,
                  transparent,
                  transparent 1px,
                  rgba(47, 27, 20, 0.8) 1px,
                  rgba(47, 27, 20, 0.8) 2px
              ),
              repeating-linear-gradient(
                  0deg,
                  transparent,
                  transparent 3px,
                  rgba(61, 35, 24, 0.9) 3px,
                  rgba(61, 35, 24, 0.9) 8px
              );
          border: 1px solid rgba(93, 58, 31, 0.6);
          box-shadow: 
              inset 0 0 10px rgba(0, 0, 0, 0.4),
              inset 0 0 20px rgba(255, 255, 255, 0.05),
              0 2px 4px rgba(0, 0, 0, 0.3);
          pointer-events: none;
        `
        
        // Add panel grain variations
        const grainOverlay = document.createElement('div')
        grainOverlay.style.cssText = `
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: 
              linear-gradient(
                  90deg,
                  transparent 0%,
                  rgba(255, 255, 255, 0.03) 20%,
                  transparent 40%,
                  rgba(0, 0, 0, 0.1) 60%,
                  transparent 80%,
                  rgba(255, 255, 255, 0.02) 100%
              ),
              repeating-linear-gradient(
                  0deg,
                  transparent,
                  transparent 2px,
                  rgba(93, 58, 31, 0.3) 2px,
                  rgba(93, 58, 31, 0.3) 4px
              );
          pointer-events: none;
        `
        panel.appendChild(grainOverlay)
        panelingContainer.appendChild(panel)
    }
    
    // Add paneling trim and borders
    const trim = document.createElement('div')
    trim.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: 
          linear-gradient(90deg, rgba(47, 27, 20, 0.8) 0%, transparent 2%, transparent 98%, rgba(47, 27, 20, 0.8) 100%),
          linear-gradient(0deg, rgba(47, 27, 20, 0.8) 0%, transparent 2%, transparent 98%, rgba(47, 27, 20, 0.8) 100%);
      pointer-events: none;
    `
    panelingContainer.appendChild(trim)
    
    // Add subtle ambient lighting
    const ambientLight = document.createElement('div')
    ambientLight.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: 
          radial-gradient(ellipse at center top, rgba(255, 255, 255, 0.05) 0%, transparent 50%),
          radial-gradient(ellipse at center bottom, rgba(0, 0, 0, 0.3) 0%, transparent 50%);
      pointer-events: none;
    `
    panelingContainer.appendChild(ambientLight)
    
    document.body.appendChild(panelingContainer)
  }, [])

  // Initialize game
  useEffect(() => {
    createDarkWoodPaneling()
    generateBoard()
  }, [generateBoard, createDarkWoodPaneling])

  // Check word completion when board changes
  useEffect(() => {
    if (board.length > 0) {
      checkWordCompletion()
    }
  }, [board, checkWordCompletion])

  // Animation loop
  useEffect(() => {
    if (animating) {
      const interval = setInterval(updateAnimation, 16) // ~60fps
      return () => clearInterval(interval)
    }
  }, [animating, updateAnimation])

  // Show win celebration
  useEffect(() => {
    if (gameWon) {
      setTimeout(() => {
        if (currentLevel < MAX_LEVELS) {
          showFireworksCelebration()
        } else {
          showFireworksCelebration(true) // Final level
        }
      }, 100)
    }
  }, [gameWon, currentLevel])

  const showFireworksCelebration = useCallback((isFinalLevel = false) => {
    // Create celebration panel (not full overlay)
    const overlay = document.createElement('div')
    overlay.id = 'celebration-overlay'
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: transparent;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      z-index: 1000;
      font-family: Arial, sans-serif;
      pointer-events: none;
    `
    
    // Create celebration content with dark wood paneling
    const content = document.createElement('div')
    content.style.cssText = `
      background: transparent;
      padding: 40px;
      border-radius: 20px;
      text-align: center;
      box-shadow: 
          0 10px 30px rgba(0, 0, 0, 0.5),
          0 0 30px rgba(47, 27, 20, 0.6);
      border: 4px solid #2F1B14;
      max-width: 400px;
      margin: 20px;
      position: relative;
      overflow: hidden;
      pointer-events: auto;
    `
    
    // Create dark wood paneling background (same as game)
    const panelingBackground = document.createElement('div')
    panelingBackground.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: 
          linear-gradient(135deg, #2F1B14 0%, #3D2318 20%, #4A2C1A 40%, #5D3A1F 60%, #4A2C1A 80%, #3D2318 100%),
          repeating-linear-gradient(
              90deg,
              transparent,
              transparent 1px,
              rgba(47, 27, 20, 0.6) 1px,
              rgba(47, 27, 20, 0.6) 3px
          ),
          repeating-linear-gradient(
              0deg,
              transparent,
              transparent 2px,
              rgba(61, 35, 24, 0.7) 2px,
              rgba(61, 35, 24, 0.7) 15px
          );
      pointer-events: none;
      border-radius: 20px;
    `
    content.appendChild(panelingBackground)
    
    // Create individual wood panels (same as game paneling)
    const panelWidth = 400 // Match content width
    const panelHeight = 60 // Smaller panels for banner
    const panelsPerCol = Math.ceil(200 / panelHeight) + 1 // Approximate content height
    
    for (let row = 0; row < panelsPerCol; row++) {
      const panel = document.createElement('div')
      panel.style.cssText = `
        position: absolute;
        top: ${row * panelHeight}px;
        left: 0;
        width: ${panelWidth}px;
        height: ${panelHeight}px;
        background: 
            linear-gradient(135deg, #2F1B14 0%, #3D2318 30%, #4A2C1A 50%, #5D3A1F 70%, #4A2C1A 90%, #3D2318 100%),
            repeating-linear-gradient(
                90deg,
                transparent,
                transparent 1px,
                rgba(47, 27, 20, 0.8) 1px,
                rgba(47, 27, 20, 0.8) 2px
            ),
            repeating-linear-gradient(
                0deg,
                transparent,
                transparent 3px,
                rgba(61, 35, 24, 0.9) 3px,
                rgba(61, 35, 24, 0.9) 8px
            );
        border: 1px solid rgba(93, 58, 31, 0.6);
        box-shadow: 
            inset 0 0 10px rgba(0, 0, 0, 0.4),
            inset 0 0 20px rgba(255, 255, 255, 0.05),
            0 2px 4px rgba(0, 0, 0, 0.3);
        pointer-events: none;
        border-radius: 20px;
      `
      
      // Add panel grain variations
      const grainOverlay = document.createElement('div')
      grainOverlay.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: 
            linear-gradient(
                90deg,
                transparent 0%,
                rgba(255, 255, 255, 0.03) 20%,
                transparent 40%,
                rgba(0, 0, 0, 0.1) 60%,
                transparent 80%,
                rgba(255, 255, 255, 0.02) 100%
            ),
            repeating-linear-gradient(
                0deg,
                transparent,
                transparent 2px,
                rgba(93, 58, 31, 0.3) 2px,
                rgba(93, 58, 31, 0.3) 4px
            );
        pointer-events: none;
        border-radius: 20px;
      `
      panel.appendChild(grainOverlay)
      content.appendChild(panel)
    }
    
    // Add paneling trim and borders
    const trim = document.createElement('div')
    trim.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: 
          linear-gradient(90deg, rgba(47, 27, 20, 0.8) 0%, transparent 2%, transparent 98%, rgba(47, 27, 20, 0.8) 100%),
          linear-gradient(0deg, rgba(47, 27, 20, 0.8) 0%, transparent 2%, transparent 98%, rgba(47, 27, 20, 0.8) 100%);
      pointer-events: none;
      border-radius: 20px;
    `
    content.appendChild(trim)
    
    // Add subtle ambient lighting
    const ambientLight = document.createElement('div')
    ambientLight.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: 
          radial-gradient(ellipse at center top, rgba(255, 255, 255, 0.05) 0%, transparent 50%),
          radial-gradient(ellipse at center bottom, rgba(0, 0, 0, 0.3) 0%, transparent 50%);
      pointer-events: none;
      border-radius: 20px;
    `
    content.appendChild(ambientLight)
    
    // Add oak wood highlights and variations
    const woodHighlights = document.createElement('div')
    woodHighlights.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: 
          linear-gradient(
              90deg,
              transparent 0%,
              rgba(255, 255, 255, 0.2) 10%,
              transparent 25%,
              rgba(0, 0, 0, 0.15) 40%,
              transparent 55%,
              rgba(255, 255, 255, 0.15) 70%,
              transparent 85%,
              rgba(0, 0, 0, 0.1) 100%
          ),
          linear-gradient(
              0deg,
              transparent 0%,
              rgba(255, 255, 255, 0.15) 15%,
              transparent 35%,
              rgba(0, 0, 0, 0.1) 55%,
              transparent 75%,
              rgba(255, 255, 255, 0.1) 95%,
              transparent 100%
          );
      pointer-events: none;
      border-radius: 20px;
    `
    content.appendChild(woodHighlights)
    
    // Create title
    const title = document.createElement('h2')
    title.textContent = '🎉 Congratulations! 🎉'
    title.style.cssText = `
      color: #FFFFFF;
      font-size: 28px;
      margin: 0 0 20px 0;
      text-shadow: 3px 3px 6px rgba(0, 0, 0, 0.8), 1px 1px 2px rgba(0, 0, 0, 0.9);
      font-weight: bold;
      position: relative;
      z-index: 10;
    `
    
    // Create message
    const message = document.createElement('p')
    if (isFinalLevel) {
      message.textContent = 'You\'ve completed all levels! You\'re a WordSlide master! 🏆'
    } else {
      message.textContent = `Level ${currentLevel} Complete! 🎯`
    }
    message.style.cssText = `
      color: #FFFFFF;
      font-size: 20px;
      margin: 0 0 30px 0;
      font-weight: bold;
      text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.8), 1px 1px 2px rgba(0, 0, 0, 0.9);
      position: relative;
      z-index: 10;
    `
    
    // Create button
    const button = document.createElement('button')
    if (isFinalLevel) {
      button.textContent = 'Play Again'
      button.onclick = () => {
        setCurrentLevel(1)
        setMoveCount(0)
        setGameWon(false)
        generateBoard()
        document.body.removeChild(overlay)
      }
    } else {
      button.textContent = 'Next Level'
      button.onclick = () => {
        setCurrentLevel(prev => prev + 1)
        setMoveCount(0)
        setGameWon(false)
        generateBoard()
        document.body.removeChild(overlay)
      }
    }
    button.style.cssText = `
      background: linear-gradient(135deg, #32CD32, #228B22);
      color: white;
      border: none;
      padding: 15px 30px;
      font-size: 18px;
      font-weight: bold;
      border-radius: 10px;
      cursor: pointer;
      box-shadow: 0 5px 15px rgba(0, 0, 0, 0.5), 0 0 20px rgba(50, 205, 50, 0.3);
      transition: transform 0.2s, box-shadow 0.2s;
      position: relative;
      z-index: 10;
      text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);
    `
    
    // Add hover effects
    button.onmouseenter = () => {
      button.style.transform = 'scale(1.05)'
      button.style.boxShadow = '0 7px 20px rgba(0, 0, 0, 0.4)'
    }
    button.onmouseleave = () => {
      button.style.transform = 'scale(1)'
      button.style.boxShadow = '0 5px 15px rgba(0, 0, 0, 0.3)'
    }
    
    // Assemble the celebration
    content.appendChild(title)
    content.appendChild(message)
    content.appendChild(button)
    overlay.appendChild(content)
    document.body.appendChild(overlay)
    
    // Start fireworks animation
    startFireworks()
  }, [currentLevel, generateBoard, showFireworksCelebration])

  const startFireworks = () => {
    const canvas = document.createElement('canvas')
    canvas.id = 'fireworks-canvas'
    canvas.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 1001;
    `
    document.body.appendChild(canvas)
    
    const ctx = canvas.getContext('2d')
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight
    
    const fireworks = []
    const particles = []
    
    // Firework particle class
    class Particle {
      constructor(x, y, vx, vy, color) {
        this.x = x
        this.y = y
        this.vx = vx
        this.vy = vy
        this.color = color
        this.life = 100
        this.decay = 0.98
      }
      
      update() {
        this.x += this.vx
        this.y += this.vy
        this.vy += 0.1 // gravity
        this.vx *= this.decay
        this.vy *= this.decay
        this.life--
      }
      
      draw() {
        ctx.save()
        ctx.globalAlpha = this.life / 100
        ctx.shadowColor = this.color
        ctx.shadowBlur = 8
        ctx.fillStyle = this.color
        ctx.beginPath()
        ctx.arc(this.x, this.y, 3, 0, Math.PI * 2)
        ctx.fill()
        ctx.restore()
      }
    }
    
    // Create firework
    function createFirework() {
      const x = Math.random() * canvas.width
      const y = canvas.height
      const targetY = Math.random() * canvas.height * 0.6
      const speed = 8 + Math.random() * 4
      const angle = Math.atan2(targetY - y, x - x)
      
      fireworks.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        targetY: targetY,
        exploded: false
      })
    }
    
    // Explode firework
    function explodeFirework(fw) {
      const colors = ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#FF4500', '#00FFFF', '#FF1493', '#00FF00']
      const particleCount = 80 + Math.floor(Math.random() * 40)
      
      for (let i = 0; i < particleCount; i++) {
        const angle = (Math.PI * 2 * i) / particleCount
        const speed = 3 + Math.random() * 4
        const color = colors[Math.floor(Math.random() * colors.length)]
        
        particles.push(new Particle(
          fw.x,
          fw.y,
          Math.cos(angle) * speed,
          Math.sin(angle) * speed,
          color
        ))
      }
    }
    
    // Animation loop
    function animate() {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      
      // Update and draw fireworks
      for (let i = fireworks.length - 1; i >= 0; i--) {
        const fw = fireworks[i]
        fw.x += fw.vx
        fw.y += fw.vy
        
        // Draw firework trail with glow effect
        ctx.save()
        ctx.shadowColor = '#FFD700'
        ctx.shadowBlur = 10
        ctx.fillStyle = '#FFD700'
        ctx.beginPath()
        ctx.arc(fw.x, fw.y, 4, 0, Math.PI * 2)
        ctx.fill()
        ctx.restore()
        
        // Check if firework reached target
        if (fw.y <= fw.targetY && !fw.exploded) {
          explodeFirework(fw)
          fireworks.splice(i, 1)
        }
      }
      
      // Update and draw particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i]
        p.update()
        p.draw()
        
        if (p.life <= 0) {
          particles.splice(i, 1)
        }
      }
      
      // Create new fireworks
      if (Math.random() < 0.08) {
        createFirework()
      }
      
      requestAnimationFrame(animate)
    }
    
    animate()
    
    // Clean up fireworks after 5 seconds
    setTimeout(() => {
      if (document.body.contains(canvas)) {
        document.body.removeChild(canvas)
      }
    }, 5000)
  }



  return (
    <div className="game-container">
      <h1>WordSlide</h1>
      <GameInfo 
        targetWords={getCurrentWordSet()}
        moveCount={moveCount}
        currentLevel={currentLevel}
        maxLevels={MAX_LEVELS}
      />
      <GameBoard
        board={board}
        emptyPos={emptyPos}
        animation={animation}
        completedTiles={completedTiles}
        onTileClick={tryMove}
      />
      <button className="button" onClick={resetGame}>
        New Game
      </button>
    </div>
  )
}

export default App 