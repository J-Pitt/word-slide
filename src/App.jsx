import React, { useState, useEffect, useCallback, useRef } from 'react'
import LeaderboardModal from './components/LeaderboardModal'
import UserProfile from './components/UserProfile'
import AuthModal from './components/AuthModal'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import './styles.css'

function App() {
  
  const { user, isAuthenticated, token } = useAuth() || {}
  
  // PWA install state
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [showInstallButton, setShowInstallButton] = useState(false)
  
  const [currentView, setCurrentView] = useState('menu')
  
  // Basic game state
  const [board, setBoard] = useState([])
  const [emptyPos, setEmptyPos] = useState({ r: 6, c: 6 })
  const [moveCount, setMoveCount] = useState(0)
  const [currentLevel, setCurrentLevel] = useState(1)
  const [completedWords, setCompletedWords] = useState(new Set())
  const [hintCount, setHintCount] = useState(3)
  const [levelTransitioning, setLevelTransitioning] = useState(false)
  const [showFireworks, setShowFireworks] = useState(false)
  const [showLevelCompleteModal, setShowLevelCompleteModal] = useState(false)
  const [fireworks, setFireworks] = useState([])
  const [showRules, setShowRules] = useState(false)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [showLeaderboard, setShowLeaderboard] = useState(false)
  
  // Mini gameboard play button state
  const [miniGameCompleted, setMiniGameCompleted] = useState(false)
  const [miniEmptyPos, setMiniEmptyPos] = useState({ r: 2, c: 3 }) // Row 2 (middle), Col 3 (empty space)
  const [miniBoard, setMiniBoard] = useState([
    ['R', 'T', 'K', 'M', 'N'],
    ['B', 'F', 'H', 'S', 'C'],
    ['P', 'L', 'A', '', 'Y'], // Middle row with PLAY
    ['D', 'W', 'Z', 'V', 'Q'],
    ['J', 'G', 'X', 'U', 'I']
  ])
  const [dragState, setDragState] = useState({
    isDragging: false,
    draggedTile: null, // {r, c}
    dragOffset: { x: 0, y: 0 },
    startPos: { x: 0, y: 0 }
  })
  
  // Tetris-style word game state
  const [tetrisBoard, setTetrisBoard] = useState([])
  const [tetrisScore, setTetrisScore] = useState(0)
  const [tetrisLevel, setTetrisLevel] = useState(1)
  const [tetrisLines, setTetrisLines] = useState(0)
  const [tetrisGameOver, setTetrisGameOver] = useState(false)
  const [tetrisPaused, setTetrisPaused] = useState(false)
  const [fallingBlocks, setFallingBlocks] = useState([])
  const [hintBlinkPositions, setHintBlinkPositions] = useState([])

  // Reset original game to Level 1
  const resetToLevelOne = useCallback(() => {
    setCurrentLevel(1)
    setMoveCount(0)
    setCompletedWords(new Set())
    setHintCount(3)
    setLevelTransitioning(false)
    setBoard([])
    setEmptyPos({ r: 6, c: 6 })
    // Board will regenerate via existing effect when board is empty
  }, [])

  // Update database with level completion stats
  const updateDatabaseStats = useCallback(async (level, moves, wordsCompleted) => {
    if (!user || !token) {
      console.log('No user or token, skipping database update')
      return
    }
    
    console.log('Updating database stats:', { level, moves, wordsCompleted, user, token })
    
    try {
      const API_BASE = 'https://63jgwqvqyf.execute-api.us-east-1.amazonaws.com/dev'
      const response = await fetch(`${API_BASE}/game/stats`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: user.id,
          gameMode: 'original',
          wordsSolved: wordsCompleted,
          totalMoves: moves
        })
      })
      
      if (!response.ok) {
        console.error('Failed to update database:', response.statusText, response.status)
        console.error('This might be a CORS issue - check server configuration')
      } else {
        console.log('Database update successful')
      }
    } catch (error) {
      console.error('Error updating database:', error)
    }
  }, [user, token])

  // PWA install prompt handling
  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault()
      // Stash the event so it can be triggered later
      setDeferredPrompt(e)
      // Show the install button
      setShowInstallButton(true)
    }

    const handleAppInstalled = () => {
      setShowInstallButton(false)
      setDeferredPrompt(null)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    // Check if already installed
    let timer = null
    if (!window.matchMedia('(display-mode: standalone)').matches) {
      // For testing purposes, show button after 3 seconds if no prompt
      timer = setTimeout(() => {
        setShowInstallButton(true)
      }, 3000)
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
      if (timer) clearTimeout(timer)
    }
  }, [])

  // Handle PWA install button click
  const handleInstallClick = async () => {
    
    if (!deferredPrompt) {
      // Show instructions if no prompt is available
      alert(`To install Crosslide as an app:

🖥️ Desktop (Chrome/Edge):
• Look for install icon (⊞) in address bar
• Or go to Settings → Install Crosslide

📱 Mobile:
• Chrome: Menu → Add to Home screen
• Safari: Share → Add to Home Screen

Note: Some browsers don't support PWA installation in development mode.`)
      return
    }

    try {
      // Show the install prompt
      deferredPrompt.prompt()
      
      // Wait for the user to respond to the prompt
      const { outcome } = await deferredPrompt.userChoice
      
      // Handle install outcome
      
      // Clear the deferredPrompt
      setDeferredPrompt(null)
      setShowInstallButton(false)
    } catch (error) {
      console.error('PWA install error:', error)
    }
  }

  // Advance to next level
  const goToNextLevel = useCallback(() => {
    const maxLevels = 20 // Same as in the level complete modal
    if (currentLevel < maxLevels) {
      setCurrentLevel(prev => prev + 1)
      setMoveCount(0)
      setCompletedWords(new Set())
      setHintCount(3)
      setLevelTransitioning(false)
      setBoard([])
      setEmptyPos({ r: 6, c: 6 })
      // Board will regenerate via existing effect when board is empty
    }
  }, [currentLevel])
  const [fallingSpeed, setFallingSpeed] = useState(1000) // milliseconds
  
  // Animation state for tile sliding (matching original JS logic)
  const [animating, setAnimating] = useState(false)
  const [animation, setAnimation] = useState(null)
  // Measured tile step (tile width + gap) to ensure exact pixel movement
  const [tileStep, setTileStep] = useState(0)
  const boardRef = useRef(null)
  const [swapHold, setSwapHold] = useState(null) // temporarily disable transition on destination tile
  
  // Tetris pieces for word generation
  const TETRIS_PIECES = [
    // I piece - 4 letters
    [[1, 1, 1, 1]],
    // O piece - 4 letters (2x2)
    [[1, 1], [1, 1]],
    // T piece - 3 letters
    [[0, 1, 0], [1, 1, 1]],
    // S piece - 4 letters
    [[0, 1, 1], [1, 1, 0]],
    // Z piece - 4 letters
    [[1, 1, 0], [0, 1, 1]],
    // J piece - 4 letters
    [[1, 0, 0], [1, 1, 1]],
    // L piece - 4 letters
    [[0, 0, 1], [1, 1, 1]]
  ]

  // Tetris colors
  const TETRIS_COLORS = ['#FF69B4', '#00CED1', '#FFD700', '#90EE90', '#FF4500', '#9370DB', '#FF8C00']
  
  // Tetris game functions - defined early to avoid hoisting issues
  const spawnFallingBlock = useCallback(() => {
    if (tetrisGameOver || tetrisPaused) return
    
    // Generate random letter (A-Z)
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    const randomLetter = letters[Math.floor(Math.random() * letters.length)]
    
    // Spawn at top center of 7x8 board (column 3-4, row 0)
    const newBlock = {
      letter: randomLetter,
      x: 3 + Math.floor(Math.random() * 2), // Random between columns 3-4
      y: 0 // Start at the very top of the board
    }
    
    setFallingBlocks([newBlock])
  }, [tetrisGameOver, tetrisPaused])

  // Measure the per-cell pixel step so animations never round or jump
  useEffect(() => {
    // Find any tile element
    const sample = document.querySelector('[data-tile]')
    if (sample) {
      const rect = sample.getBoundingClientRect()
      // Our grid uses 1px gaps between tiles except edges
      const step = Math.round(rect.width + 1)
      if (step && step !== tileStep) setTileStep(step)
    }
  }, [board, tileStep])

  // Check if a Tetris block can move to a new position
  const canBlockMove = useCallback((block, deltaX, deltaY) => {
    if (!block || !tetrisBoard.length) return false
    
    const newX = block.x + deltaX
    const newY = block.y + deltaY
    
    // Check boundaries for 7x8 board
    if (newX < 0 || newX >= 8 || newY >= 7) {
      return false
    }
    
    // Check if new position is occupied (only check if moving down or to sides)
    if (deltaY > 0 || deltaX !== 0) {
      if (newY >= 0 && tetrisBoard[newY] && tetrisBoard[newY][newX]) {
        return false
      }
    }
    
    return true
  }, [tetrisBoard])

  // Move falling block left
  const moveBlockLeft = useCallback(() => {
    if (tetrisGameOver || tetrisPaused || fallingBlocks.length === 0) return
    
    setFallingBlocks(prev => {
      return prev.map(block => {
        if (canBlockMove(block, -1, 0)) {
          return { ...block, x: block.x - 1 }
        }
        return block
      })
    })
  }, [tetrisGameOver, tetrisPaused, fallingBlocks.length, canBlockMove])

  // Move falling block right
  const moveBlockRight = useCallback(() => {
    if (tetrisGameOver || tetrisPaused || fallingBlocks.length === 0) return
    
    setFallingBlocks(prev => {
      return prev.map(block => {
        if (canBlockMove(block, 1, 0)) {
          return { ...block, x: block.x + 1 }
        }
        return block
      })
    })
  }, [tetrisGameOver, tetrisPaused, fallingBlocks.length, canBlockMove])

  // Pause/Resume Tetris game
  const pauseTetrisGame = useCallback(() => {
    setTetrisPaused(prev => !prev)
  }, [])

  // Generate Tetris board with same dimensions as original game
  const generateTetrisBoard = useCallback(() => {
    // Create 7x8 board like original game (7 rows, 8 columns)
    const newBoard = Array(7).fill(null).map(() => Array(8).fill(null))
    setTetrisBoard(newBoard)
    
    // Start spawning falling blocks
    setTimeout(() => {
      spawnFallingBlock()
    }, 1000)
  }, [])

  // Reset Tetris game
  const resetTetrisGame = useCallback(() => {
    setTetrisGameOver(false)
    setTetrisPaused(false)
    setTetrisScore(0)
    setTetrisLevel(1)
    setTetrisLines(0)
    setFallingSpeed(1000)
    generateTetrisBoard()
  }, [generateTetrisBoard])

  // Start Tetris game
  const startTetrisGame = useCallback(() => {
    // Starting Tetris-style word game
    setCurrentView('tetris')
    setTetrisGameOver(false)
    setTetrisPaused(false)
    setFallingSpeed(1000)
    generateTetrisBoard()
  }, [generateTetrisBoard])

  // Check for completed words (3+ letters horizontally)
  const checkTetrisLines = useCallback(() => {
    if (!tetrisBoard.length) return
    
    let wordsCleared = 0
    const newBoard = tetrisBoard.map(row => [...row])
    
    // Check each row for word completion
    for (let r = 0; r < newBoard.length; r++) {
      const row = newBoard[r]
      let currentWord = ''
      let wordStart = -1
      
      // Scan row for consecutive letters
      for (let c = 0; c < row.length; c++) {
        if (row[c] && row[c].letter) {
          if (currentWord === '') {
            wordStart = c
            currentWord = row[c].letter
          } else {
            currentWord += row[c].letter
          }
        } else {
          // Check if we have a completed word (3+ letters)
          if (currentWord.length >= 3) {
            // Clear the word
            for (let i = wordStart; i < c; i++) {
              newBoard[r][i] = null
            }
            wordsCleared++
            // Word completed
          }
          currentWord = ''
          wordStart = -1
        }
      }
      
      // Check word at end of row
      if (currentWord.length >= 3) {
        for (let i = wordStart; i < row.length; i++) {
          newBoard[r][i] = null
        }
        wordsCleared++
        console.log(`Word completed: ${currentWord}`)
      }
    }
    
    // Update board and score if words were cleared
    if (wordsCleared > 0) {
      setTetrisBoard(newBoard)
      setTetrisScore(prev => prev + wordsCleared)
      setTetrisLevel(prev => prev + 1)
      
      // Check if game over (board is full)
      const isFull = newBoard.every(row => row.every(cell => cell !== null))
      if (isFull) {
        setTetrisGameOver(true)
      }
    }
  }, [tetrisBoard])
  
  // Advanced word generation system for 20 levels (migrated from main.js)
  const WORD_BANK = [
    // 3-letter words
    "CAT", "DOG", "BAT", "RAT", "HAT", "MAT", "SIT", "RUN", "JAM", "BAG",
    "BIG", "HOT", "COW", "PIG", "FOX", "BOX", "TOP", "MAP", "CAP", "TAP",
    "GAP", "LAP", "NAP", "RAP", "SAP", "ZAP", "BED", "RED", "FED", "LED",
    "TEN", "PEN", "MEN", "DEN", "BEN", "SUN", "FUN", "GUN", "NUN", "BUN",
    "CUP", "PUP", "UP", "TIP", "LIP", "RIP", "SIP", "DIP", "HIP", "KIP",
    "JET", "PET", "SET", "WET", "GET", "LET", "MET", "NET", "YET", "VET",
    "KEY", "DAY", "MAY", "SAY", "WAY", "PAY", "RAY", "LAY", "HAY", "JAY",
    "BOY", "TOY", "JOY", "COY", "SOY", "ROY", "ZOO", "TOO", "TWO", "WHO",
    "HOW", "NOW", "COW", "BOW", "ROW", "LOW", "MOW", "SOW", "TOW", "WOW",
    "EAT", "FAT", "HAT", "MAT", "PAT", "RAT", "SAT", "VAT", "CAT", "BAT",
    
    // 4-letter words
    "BIRD", "CARD", "DARK", "FARM", "GAME", "HAND", "JUMP", "KIND", "LAMP", "MIND",
    "NEXT", "OPEN", "PLAY", "QUIT", "RACE", "SING", "TALK", "WALK", "YEAR", "ZERO",
    "BOOK", "COOK", "LOOK", "TOOK", "HOOK", "ROOK", "SOOK", "WOOD", "FOOD", "MOOD",
    "GOOD", "HOOD", "ROOM", "DOOM", "BOOM", "ZOOM", "COOL", "POOL", "TOOL", "FOOL",
    "BALL", "CALL", "FALL", "HALL", "MALL", "TALL", "WALL", "SMALL", "STAR", "CARE",
    "DARE", "FARE", "HARE", "MARE", "PARE", "RARE", "WARE", "BARE", "FIRE", "HIRE",
    "MIRE", "SIRE", "TIRE", "WIRE", "LIRE", "CORE", "BORE", "FORE", "GORE", "MORE",
    "PORE", "SORE", "TORE", "WORE", "YORE", "LORE", "RORE", "DORE", "FOUR", "HOUR",
    "POUR", "SOUR", "TOUR", "YOUR", "COURT", "PORT", "SORT", "FORT", "WORT", "BORT",
    "HURT", "CURT", "BURT", "TURT", "GURT", "LURT", "MURT", "PURT", "SURT", "WURT"
  ]

  // Generate word sets for 20 levels
  const generateWordSets = useCallback(() => {
    const wordSets = []
    const usedWords = new Set()
    
    for (let level = 1; level <= 20; level++) {
      const levelWords = []
      
      // Level 1: Just one 3-letter word
      if (level === 1) {
        let selectedWord
        let attempts = 0
        
        // Try to find an unused 3-letter word
        do {
          selectedWord = WORD_BANK[Math.floor(Math.random() * WORD_BANK.length)]
          attempts++
        } while ((usedWords.has(selectedWord) || selectedWord.length !== 3) && attempts < 100)
        
        // If we can't find an unused 3-letter word, use any 3-letter word
        if (attempts >= 100) {
          const threeLetterWords = WORD_BANK.filter(word => word.length === 3)
          selectedWord = threeLetterWords[Math.floor(Math.random() * threeLetterWords.length)]
        }
        
        levelWords.push(selectedWord)
        usedWords.add(selectedWord)
      }
      // Level 2: One 4-letter word
      else if (level === 2) {
        let selectedWord
        let attempts = 0
        
        do {
          selectedWord = WORD_BANK[Math.floor(Math.random() * WORD_BANK.length)]
          attempts++
        } while ((usedWords.has(selectedWord) || selectedWord.length !== 4) && attempts < 100)
        
        if (attempts >= 100) {
          const fourLetterWords = WORD_BANK.filter(word => word.length === 4)
          selectedWord = fourLetterWords[Math.floor(Math.random() * fourLetterWords.length)]
        }
        
        levelWords.push(selectedWord)
        usedWords.add(selectedWord)
      }
      // Level 3: Two 3-letter words
      else if (level === 3) {
        for (let i = 0; i < 2; i++) {
          let selectedWord
          let attempts = 0
          
          do {
            selectedWord = WORD_BANK[Math.floor(Math.random() * WORD_BANK.length)]
            attempts++
          } while ((usedWords.has(selectedWord) || selectedWord.length !== 3) && attempts < 100)
          
          if (attempts >= 100) {
            const threeLetterWords = WORD_BANK.filter(word => word.length === 3)
            selectedWord = threeLetterWords[Math.floor(Math.random() * threeLetterWords.length)]
          }
          
          levelWords.push(selectedWord)
          usedWords.add(selectedWord)
        }
      }
      // Level 4: One 3-letter and one 4-letter word
      else if (level === 4) {
        // Add 3-letter word
        let selectedWord
        let attempts = 0
        
        do {
          selectedWord = WORD_BANK[Math.floor(Math.random() * WORD_BANK.length)]
          attempts++
        } while ((usedWords.has(selectedWord) || selectedWord.length !== 3) && attempts < 100)
        
        if (attempts >= 100) {
          const threeLetterWords = WORD_BANK.filter(word => word.length === 3)
          selectedWord = threeLetterWords[Math.floor(Math.random() * threeLetterWords.length)]
        }
        
        levelWords.push(selectedWord)
        usedWords.add(selectedWord)
        
        // Add 4-letter word
        attempts = 0
        do {
          selectedWord = WORD_BANK[Math.floor(Math.random() * WORD_BANK.length)]
          attempts++
        } while ((usedWords.has(selectedWord) || selectedWord.length !== 4) && attempts < 100)
        
        if (attempts >= 100) {
          const fourLetterWords = WORD_BANK.filter(word => word.length === 4)
          selectedWord = fourLetterWords[Math.floor(Math.random() * fourLetterWords.length)]
        }
        
        levelWords.push(selectedWord)
        usedWords.add(selectedWord)
      }
      // Level 5+: Mix of word lengths
      else {
        // Word count rules:
        // Levels 1-3: keep existing logic (progressive)
        // Levels 4-8: exactly 3 words
        // Levels 9-15: 4 words (mix of 3 and 4 letters)
        // Levels 16-20: 5 words (mix of 3 and 4 letters)
        let wordCount
        if (level <= 3) {
          wordCount = Math.min(level, 3)
        } else if (level <= 8) {
          wordCount = 3
        } else if (level <= 15) {
          wordCount = 4
        } else {
          wordCount = 5
        }
        const wordLengths = []
        
        // Distribute word lengths based on level
        if (level <= 8) {
          // Levels 1-8: 3-letter words (challenge ramps via count rules above)
          for (let i = 0; i < wordCount; i++) wordLengths.push(3)
        } else {
          // Levels 9+: mix of 3 and 4 letters
          const mix = []
          for (let i = 0; i < wordCount; i++) mix.push(i % 2 === 0 ? 3 : 4)
          wordLengths.push(...mix)
        }
        
        // Shuffle word lengths for variety
        for (let i = wordLengths.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1))
          ;[wordLengths[i], wordLengths[j]] = [wordLengths[j], wordLengths[i]]
        }
        
        // Select words for each length
        for (const length of wordLengths) {
          let selectedWord
          let attempts = 0
          
          do {
            selectedWord = WORD_BANK[Math.floor(Math.random() * WORD_BANK.length)]
            attempts++
          } while ((usedWords.has(selectedWord) || selectedWord.length !== length) && attempts < 100)
          
          if (attempts >= 100) {
            const wordsOfLength = WORD_BANK.filter(word => word.length === length)
            selectedWord = wordsOfLength[Math.floor(Math.random() * wordsOfLength.length)]
          }
          
          levelWords.push(selectedWord)
          usedWords.add(selectedWord)
        }
      }
      
      wordSets.push(levelWords)
    }
    
    return wordSets
  }, []) // Empty dependency array since WORD_BANK is constant

  // Generate word sets for current game
  const [WORD_SETS, setWORD_SETS] = useState([])
  
  useEffect(() => {
    const wordSets = generateWordSets()
    setWORD_SETS(wordSets)
  }, [generateWordSets])

  // Create dark wood paneling background
  useEffect(() => {
    const existingPaneling = document.getElementById('dark-wood-paneling')
    if (existingPaneling) {
      existingPaneling.remove()
    }
    
    const panelingContainer = document.createElement('div')
    panelingContainer.id = 'dark-wood-paneling'
    panelingContainer.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: linear-gradient(135deg, #2F1B14 0%, #3D2318 20%, #4A2C1A 40%, #5D3A1F 60%, #4A2C1A 80%, #3D2318 100%);
      z-index: -1;
      pointer-events: none;
    `
    
    document.body.appendChild(panelingContainer)
  }, [])

  // Utility function to shuffle arrays
  const shuffleArray = useCallback((arr) => {
    // Fisher-Yates shuffle
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[arr[i], arr[j]] = [arr[j], arr[i]]
    }
    return arr
  }, [])

  // Check if a letter is part of a completed word
  const isLetterInCompletedWord = useCallback((r, c) => {
    if (!board || board.length === 0 || !board[0]) return false
    
    const targetWords = WORD_SETS[currentLevel - 1] || WORD_SETS[0]
    if (!targetWords || targetWords.length === 0) return false
    
    for (const word of targetWords) {
      if (!completedWords.has(word)) continue
      
      // Check horizontal words
      for (let row = 0; row < board.length; row++) {
        for (let col = 0; col <= board[row].length - word.length; col++) {
          const horizontalWord = board[row].slice(col, col + word.length).join('').toLowerCase()
          if (horizontalWord === word.toLowerCase()) {
            if (row === r && c >= col && c < col + word.length) {
              return true
            }
          }
        }
      }
      
      // Check vertical words
      for (let col = 0; col < board[0].length; col++) {
        for (let row = 0; row <= board.length - word.length; row++) {
          const verticalWord = []
          for (let i = 0; i < word.length; i++) {
            verticalWord.push(board[row + i][col])
          }
          if (verticalWord.join('').toLowerCase() === word.toLowerCase()) {
            if (col === c && r >= row && r < row + word.length) {
              return true
            }
          }
        }
      }
    }
    
    return false
  }, [board, currentLevel, completedWords, WORD_SETS])

  // Reset tile visual state
  const resetTileVisualState = useCallback((r, c) => {
    const tileElement = document.querySelector(`[data-tile="${r}-${c}"]`)
    if (tileElement) {
      tileElement.style.transform = 'translate(0px, 0px)' // Reset to original position
      tileElement.style.filter = ''
      tileElement.style.boxShadow = ''
      tileElement.style.opacity = '1' // Ensure full opacity
      tileElement.style.animation = 'none' // Disable any lingering animations
      tileElement.style.transition = 'none' // Disable transitions
      // Force style recalculation
      tileElement.offsetHeight
    }
  }, [])

  // Fast word completion check - runs synchronously during moves
  const checkWordCompletionSync = useCallback((boardToCheck) => {
    if (!boardToCheck || boardToCheck.length === 0 || !boardToCheck[0] || currentView !== 'original') return
    if (levelTransitioning) return

    const targetWords = WORD_SETS[currentLevel - 1] || WORD_SETS[0]
    if (!targetWords || targetWords.length === 0) return

    // Check for completed words - proper position checking
    const newCompletedWords = new Set()
    
    for (const word of targetWords) {
      const wordLower = word.toLowerCase()
      let wordFound = false
      
      // Check horizontal words
      for (let row = 0; row < boardToCheck.length && !wordFound; row++) {
        for (let col = 0; col <= boardToCheck[row].length - word.length && !wordFound; col++) {
          const horizontalWord = boardToCheck[row].slice(col, col + word.length).join('').toLowerCase()
          if (horizontalWord === wordLower) {
            newCompletedWords.add(word)
            wordFound = true
          }
        }
      }
      
      // Check vertical words
      for (let col = 0; col < boardToCheck[0].length && !wordFound; col++) {
        for (let row = 0; row <= boardToCheck.length - word.length && !wordFound; row++) {
          const verticalWord = []
          for (let i = 0; i < word.length; i++) {
            verticalWord.push(boardToCheck[row + i][col])
          }
          if (verticalWord.join('').toLowerCase() === wordLower) {
            newCompletedWords.add(word)
            wordFound = true
          }
        }
      }
    }
    
    // Update completed words immediately - this will trigger the existing isLetterInCompletedWord logic
    if (newCompletedWords.size > 0) {
      setCompletedWords(newCompletedWords)
      
      // Check if level is completed
      if (newCompletedWords.size === targetWords.length && !levelTransitioning) {
        setLevelTransitioning(true)
        setShowFireworks(true)
        
        // Update database stats after UI updates (non-blocking)
        setTimeout(() => {
          updateDatabaseStats(currentLevel, moveCount, newCompletedWords.size)
        }, 100)
        
        // Extravagant fireworks - particles launch from bottom and explode over board
        const colors = ['#FFD700', '#FF4757', '#5352ed', '#00d2d3', '#ff6348', '#FF69B4', '#32CD32', '#FF8C00', '#8A2BE2', '#00CED1']
        const newFireworks = []
        
        // Create 12 main fireworks that launch from below screen
        for (let i = 0; i < 12; i++) {
          const launchX = 5 + Math.random() * 90 // Spread across entire width
          const explodeY = 10 + Math.random() * 50 // Explode over the game board
          const explodeX = launchX + (Math.random() - 0.5) * 25 // More horizontal drift
          
          newFireworks.push({
            id: i,
            launchX: launchX,
            launchY: 100, // Start from below screen
            explodeX: explodeX,
            explodeY: explodeY,
            color: colors[Math.floor(Math.random() * colors.length)],
            delay: i * 200, // Faster launches
            size: 1.3,
            intensity: 'high',
            particleCount: 30 + Math.floor(Math.random() * 20) // 30-50 particles per firework
          })
        }
        
        // Add secondary wave of fireworks
        for (let i = 12; i < 18; i++) {
          const launchX = 10 + Math.random() * 80
          const explodeY = 20 + Math.random() * 40
          const explodeX = launchX + (Math.random() - 0.5) * 20
          
          newFireworks.push({
            id: i,
            launchX: launchX,
            launchY: 100,
            explodeX: explodeX,
            explodeY: explodeY,
            color: colors[Math.floor(Math.random() * colors.length)],
            delay: 1500 + (i - 12) * 150,
            size: 1.0,
            intensity: 'high',
            particleCount: 20 + Math.floor(Math.random() * 15) // 20-35 particles
          })
        }
        
        // Add final wave of smaller fireworks
        for (let i = 18; i < 24; i++) {
          const launchX = 15 + Math.random() * 70
          const explodeY = 25 + Math.random() * 35
          const explodeX = launchX + (Math.random() - 0.5) * 15
          
          newFireworks.push({
            id: i,
            launchX: launchX,
            launchY: 100,
            explodeX: explodeX,
            explodeY: explodeY,
            color: colors[Math.floor(Math.random() * colors.length)],
            delay: 3000 + (i - 18) * 100,
            size: 0.8,
            intensity: 'medium',
            particleCount: 15 + Math.floor(Math.random() * 10) // 15-25 particles
          })
        }
        setFireworks(newFireworks)
        
        // Show level complete modal after 9 seconds (more time for massive fireworks display)
        setTimeout(() => {
          setShowFireworks(false)
          setFireworks([])
          setShowLevelCompleteModal(true)
        }, 9000)
      }
    }
  }, [currentLevel, currentView, levelTransitioning, moveCount, updateDatabaseStats])


  // Handle tile movement with frame-based sliding animation (matching original JS)
  // Direct move without animation overlay
  const directMove = useCallback((r, c) => {
    if (isLetterInCompletedWord(r, c)) {
      return // Don't allow moving tiles from completed words
    }

    // Create the new board state first
    const newBoard = board.map(row => [...row])
    newBoard[emptyPos.r][emptyPos.c] = board[r][c]
    newBoard[r][c] = ''
    
    // Check word completion immediately with the new board state
    checkWordCompletionSync(newBoard)
    
    // Then update the state
    setBoard(newBoard)
    setEmptyPos({ r, c })
    setMoveCount(prev => prev + 1)
  }, [emptyPos, board, isLetterInCompletedWord, checkWordCompletionSync])

  const tryMove = useCallback((r, c) => {

    const dr = Math.abs(r - emptyPos.r)
    const dc = Math.abs(c - emptyPos.c)

    if ((dr === 1 && dc === 0) || (dr === 0 && dc === 1)) {
      // Check if the tile being moved is part of a completed word
      if (isLetterInCompletedWord(r, c)) {
        return // Don't allow moving tiles from completed words
      }

      // Direct move without animation
      // Create the new board state first
      const newBoard = board.map(row => [...row])
      newBoard[emptyPos.r][emptyPos.c] = board[r][c]
      newBoard[r][c] = ''
      
      // Check word completion immediately with the new board state
      checkWordCompletionSync(newBoard)
      
      // Then update the state
      setBoard(newBoard)
      setEmptyPos({ r, c })
      setMoveCount(prev => prev + 1)
    } else {
    }
  }, [emptyPos, board, isLetterInCompletedWord, checkWordCompletionSync])

  // Simple fallback board generation (doesn't depend on WORD_SETS)
  const generateFallbackBoard = useCallback(() => {
    const fallbackBoard = []
    for (let r = 0; r < 7; r++) {
      fallbackBoard[r] = []
      for (let c = 0; c < 7; c++) {
        if (r === 6 && c === 6) {
          fallbackBoard[r][c] = "" // Empty space
        } else {
          fallbackBoard[r][c] = String.fromCharCode(65 + Math.floor(Math.random() * 26))
        }
      }
    }
    setBoard(fallbackBoard)
    setEmptyPos({ r: 6, c: 6 })
  }, [])

  // Check if a board is solvable by verifying target words can be reached
  const isBoardSolvable = useCallback((board, targetWords) => {
    if (!board || !targetWords) return false
    
    // Count all letters needed for target words
    const requiredLetters = {}
    for (let word of targetWords) {
      for (let letter of word) {
        const upperLetter = letter.toUpperCase()
        requiredLetters[upperLetter] = (requiredLetters[upperLetter] || 0) + 1
      }
    }
    
    // Count available letters on the board
    const availableLetters = {}
    for (let r = 0; r < board.length; r++) {
      for (let c = 0; c < board[r].length; c++) {
        if (board[r][c] !== "") {
          const letter = board[r][c]
          availableLetters[letter] = (availableLetters[letter] || 0) + 1
        }
      }
    }
    
    // Check if all required letters are available
    for (let letter in requiredLetters) {
      if (!availableLetters[letter] || availableLetters[letter] < requiredLetters[letter]) {
        return false
      }
    }
    
    return true
  }, [])

  // Generate a sophisticated game board that ensures target words are solvable
  const generateBoard = useCallback(() => {
    
    if (!WORD_SETS || WORD_SETS.length === 0) {
      generateFallbackBoard()
      return
    }
    
    const targetWords = WORD_SETS[currentLevel - 1] || WORD_SETS[0]
    
    if (!targetWords || targetWords.length === 0) {
      generateFallbackBoard()
      return
    }

    // Special-case Level 1: make the first target word solvable in one slide for easier debugging
    if (currentLevel === 1) {
      try {
        const newBoard = []
        for (let r = 0; r < 7; r++) {
          newBoard[r] = []
          for (let c = 0; c < 7; c++) newBoard[r][c] = ""
        }
        const firstWord = String(targetWords[0] || '').toUpperCase()
        if (firstWord && firstWord.length > 1) {
          const row = 0
          const emptyCol = Math.min(firstWord.length - 1, 6)
          // Place all but last letter in order
          for (let i = 0; i < Math.min(firstWord.length - 1, 7); i++) {
            newBoard[row][i] = firstWord[i]
          }
          // Choose an adjacent spot for the final letter (prefer right, else below, else above, else left)
          const finalLetter = firstWord[Math.min(firstWord.length - 1, 6)]
          let finalPos = null
          // Right of empty
          if (emptyCol + 1 < 7) {
            finalPos = { r: row, c: emptyCol + 1 }
          } else if (row + 1 < 7) {
            finalPos = { r: row + 1, c: emptyCol }
          } else if (row - 1 >= 0) {
            finalPos = { r: row - 1, c: emptyCol }
          } else if (emptyCol - 1 >= 0) {
            finalPos = { r: row, c: emptyCol - 1 }
          }
          if (finalPos) {
            newBoard[finalPos.r][finalPos.c] = finalLetter
          }
          // Fill remaining cells with random letters
          for (let r = 0; r < 7; r++) {
            for (let c = 0; c < 7; c++) {
              if (r === row && c === emptyCol) continue // empty cell
              if (!newBoard[r][c]) {
                newBoard[r][c] = String.fromCharCode(65 + Math.floor(Math.random() * 26))
              }
            }
          }
          setBoard(newBoard)
          setEmptyPos({ r: row, c: emptyCol })
          return
        }
      } catch (e) {
      }
    }
    
    let attempts = 0
    const maxAttempts = 20 // Increased attempts for better boards
    
    do {
      attempts++
      
      const newBoard = []
      
      // Initialize empty board
      for (let r = 0; r < 7; r++) {
        newBoard[r] = []
        for (let c = 0; c < 7; c++) {
          newBoard[r][c] = ""
        }
      }
      
      // Step 1: Create a solved board first (target words in their final positions)
      const solvedBoard = []
      for (let r = 0; r < 7; r++) {
        solvedBoard[r] = []
        for (let c = 0; c < 7; c++) {
          solvedBoard[r][c] = ""
        }
      }
      
      // Place target words in their solved positions
      let wordIndex = 0
      for (let targetWord of targetWords) {
        if (wordIndex === 0) {
          // Place first word horizontally starting from (0,0)
          for (let i = 0; i < targetWord.length; i++) {
            solvedBoard[0][i] = targetWord[i].toUpperCase()
          }
        } else if (wordIndex === 1) {
          // Place second word vertically starting from (1,0)
          for (let i = 0; i < targetWord.length; i++) {
            solvedBoard[1 + i][0] = targetWord[i].toUpperCase()
          }
        } else {
          // Place additional words in available spaces
          let placed = false
          for (let r = 0; r < 7 && !placed; r++) {
            for (let c = 0; c <= 7 - targetWord.length && !placed; c++) {
              // Check if we can place horizontally
              let canPlace = true
              for (let i = 0; i < targetWord.length; i++) {
                if (solvedBoard[r][c + i] !== "") {
                  canPlace = false
                  break
                }
              }
              if (canPlace) {
                for (let i = 0; i < targetWord.length; i++) {
                  solvedBoard[r][c + i] = targetWord[i].toUpperCase()
                }
                placed = true
              }
            }
          }
          
          // If horizontal placement failed, try vertical
          if (!placed) {
            for (let r = 0; r <= 7 - targetWord.length && !placed; r++) {
              for (let c = 0; c < 7 && !placed; c++) {
                let canPlace = true
                for (let i = 0; i < targetWord.length; i++) {
                  if (solvedBoard[r + i][c] !== "") {
                    canPlace = false
                    break
                  }
                }
                if (canPlace) {
                  for (let i = 0; i < targetWord.length; i++) {
                    solvedBoard[r + i][c] = targetWord[i].toUpperCase()
                  }
                  placed = true
                }
              }
            }
          }
        }
        wordIndex++
      }
      
      // Step 2: Construct letter pool that guarantees enough letters to solve all target words
      const allLetters = []
      const requiredCounts = {}
      for (const w of targetWords) {
        for (const ch of w.toUpperCase()) {
          requiredCounts[ch] = (requiredCounts[ch] || 0) + 1
        }
      }
      // Start with the exact required letters for all words
      for (const [ch, count] of Object.entries(requiredCounts)) {
        for (let i = 0; i < count; i++) allLetters.push(ch)
      }
      // Add solvedBoard letters (may include overlaps already present)
      for (let r = 0; r < 7; r++) {
        for (let c = 0; c < 7; c++) {
          if (solvedBoard[r][c] !== "") {
            allLetters.push(solvedBoard[r][c])
          }
        }
      }
      // Fill remaining slots with random letters
      const remainingSlots = 7 * 7 - allLetters.length - 1 // -1 for empty space
      for (let i = 0; i < remainingSlots; i++) {
        allLetters.push(String.fromCharCode(65 + Math.floor(Math.random() * 26)))
      }
      
      // Shuffle all letters
      shuffleArray(allLetters)
      
      // Step 3: Create the scrambled board
      let letterIndex = 0
      const emptyRow = Math.floor(Math.random() * 7)
      const emptyCol = Math.floor(Math.random() * 7)
      
      for (let r = 0; r < 7; r++) {
        for (let c = 0; c < 7; c++) {
          if (r === emptyRow && c === emptyCol) {
            newBoard[r][c] = "" // Empty space
          } else {
            newBoard[r][c] = allLetters[letterIndex++]
          }
        }
      }
      
      // Step 4: Verify the board is solvable by checking letter availability (guaranteed by pool)
      let isSolvable = true
      
      // Step 5: If solvable, ensure it's not already solved
      if (isSolvable) {
      let hasSolvedWords = false
      for (let targetWord of targetWords) {
        // Check horizontal positions
        for (let r = 0; r < 7; r++) {
          for (let c = 0; c <= 7 - targetWord.length; c++) {
            let word = ""
            for (let i = 0; i < targetWord.length; i++) {
              if (newBoard[r] && newBoard[r][c + i]) {
                word += newBoard[r][c + i]
              }
            }
            if (word.toUpperCase() === targetWord.toUpperCase()) {
              hasSolvedWords = true
              break
            }
          }
          if (hasSolvedWords) break
        }
        
        // Check vertical positions
        if (!hasSolvedWords) {
          for (let r = 0; r <= 7 - targetWord.length; r++) {
            for (let c = 0; c < 7; c++) {
              let word = ""
              for (let i = 0; i < targetWord.length; i++) {
                if (newBoard[r + i] && newBoard[r + i][c]) {
                  word += newBoard[r + i][c]
                }
              }
              if (word.toUpperCase() === targetWord.toUpperCase()) {
                hasSolvedWords = true
                break
              }
            }
            if (hasSolvedWords) break
          }
        }
      }
      
      // If no words are solved, this is a good board
      if (!hasSolvedWords) {
        setBoard(newBoard)
          setEmptyPos({ r: emptyRow, c: emptyCol })
        return
        }
      }
      
    } while (attempts < maxAttempts)
    
    // If we couldn't generate a good board, use fallback
    generateFallbackBoard()
  }, [currentLevel, WORD_SETS, generateFallbackBoard])

  // Check for word completion in Tetris board
  const checkTetrisWordCompletion = useCallback(() => {
    const newBoard = tetrisBoard.map(row => [...row])
    let wordsCompleted = 0
    
    // Check for completed horizontal words (3+ letters)
    for (let r = 0; r < 20; r++) {
      let wordStart = -1
      let wordLength = 0
      
      for (let c = 0; c < 10; c++) {
        if (newBoard[r][c] && newBoard[r][c].letter) {
          if (wordStart === -1) wordStart = c
          wordLength++
        } else {
          if (wordLength >= 3) {
            // Clear the completed word
            for (let i = 0; i < wordLength; i++) {
              newBoard[r][wordStart + i] = null
            }
            wordsCompleted++
          }
          wordStart = -1
          wordLength = 0
        }
      }
      
      // Check word at end of row
      if (wordLength >= 3) {
        for (let i = 0; i < wordLength; i++) {
          newBoard[r][wordStart + i] = null
        }
        wordsCompleted++
      }
    }
    
    // Check for completed vertical words (3+ letters)
    for (let c = 0; c < 10; c++) {
      let wordStart = -1
      let wordLength = 0
      
      for (let r = 0; r < 20; r++) {
        if (newBoard[r][c] && newBoard[r][c].letter) {
          if (wordStart === -1) wordStart = r
          wordLength++
        } else {
          if (wordLength >= 3) {
            // Clear the completed word
            for (let i = 0; i < wordLength; i++) {
              newBoard[wordStart + i][c] = null
            }
            wordsCompleted++
          }
          wordStart = -1
          wordLength = 0
        }
      }
      
      // Check word at end of column
      if (wordLength >= 3) {
        for (let i = 0; i < wordLength; i++) {
          newBoard[wordStart + i][c] = null
        }
        wordsCompleted++
      }
    }
    
    if (wordsCompleted > 0) {
      // Apply gravity - blocks fall down to fill empty spaces
      for (let c = 0; c < 10; c++) {
        let writeRow = 19
        for (let r = 19; r >= 0; r--) {
          if (newBoard[r][c]) {
            if (writeRow !== r) {
              newBoard[writeRow][c] = newBoard[r][c]
              newBoard[r][c] = null
            }
            writeRow--
          }
        }
      }
      
      setTetrisBoard(newBoard)
      setTetrisScore(prev => prev + (wordsCompleted * 100 * tetrisLevel))
      setTetrisLines(prev => prev + wordsCompleted)
      
      // Level up every 10 words
      if (tetrisLines + wordsCompleted >= tetrisLevel * 10) {
        setTetrisLevel(prev => prev + 1)
        setFallingSpeed(prev => Math.max(200, prev - 100)) // Increase speed
      }
      
      // Show fireworks for word completion
      setShowFireworks(true)
      setTimeout(() => setShowFireworks(false), 3000)
    }
  }, [tetrisBoard, tetrisLevel, tetrisLines])

  // Add a landed block to the board
  const addBlockToBoard = useCallback((block) => {
    setTetrisBoard(prev => {
      const newBoard = prev.map(row => [...row])
      let shouldEndGame = false
      
      for (let r = 0; r < block.shape.length; r++) {
        for (let c = 0; c < block.shape[r].length; c++) {
          if (block.shape[r][c]) {
            const boardY = block.y + r
            const boardX = block.x + c
            if (boardY >= 0) {
              newBoard[boardY][boardX] = {
                letter: block.letters[r][c],
                color: block.color
              }
              
              // Check for game over - if block is placed at the very top
              if (boardY === 0) {
                shouldEndGame = true
              }
            }
          }
        }
      }
      
      if (shouldEndGame) {
        setTetrisGameOver(true)
      }
      
      return newBoard
    })
    
    // Check for word completion after adding block
    setTimeout(() => checkTetrisWordCompletion(), 100)
    
    // Spawn the next block after a short delay
    setTimeout(() => spawnFallingBlock(), 500)
  }, [checkTetrisWordCompletion, spawnFallingBlock])

  // Move falling blocks down and handle collisions
  const moveFallingBlocks = useCallback(() => {
    if (tetrisGameOver || tetrisPaused || fallingBlocks.length === 0) return
    
    setFallingBlocks(prev => {
      const newBlocks = prev.map(block => {
        const newY = block.y + 1
        
        // Check if block can move down
        if (canBlockMove(block, 0, 1)) {
          return { ...block, y: newY }
        } else {
          // Block landed, add to board
          const newBoard = [...tetrisBoard]
          if (newBoard[block.y] && newBoard[block.y][block.x] === null) {
            newBoard[block.y][block.x] = { letter: block.letter }
            setTetrisBoard(newBoard)
            
            // Check for word completion after placing block
            setTimeout(() => checkTetrisLines(), 100)
          }
          return null
        }
      }).filter(Boolean)
      
      // If no blocks left, spawn new one
      if (newBlocks.length === 0) {
        setTimeout(() => spawnFallingBlock(), 800) // Slightly longer delay for smoother experience
      }
      
      return newBlocks
    })
  }, [tetrisGameOver, tetrisPaused, fallingBlocks.length, tetrisBoard, canBlockMove, checkTetrisLines, spawnFallingBlock])

  // Game loop for Tetris
  useEffect(() => {
    if (currentView !== 'tetris' || tetrisGameOver || tetrisPaused) return
    
    const interval = setInterval(() => {
      moveFallingBlocks()
    }, 500)
    
    return () => clearInterval(interval)
  }, [currentView, tetrisGameOver, tetrisPaused, moveFallingBlocks])

  // Handle keyboard controls for Tetris
  useEffect(() => {
    if (currentView !== 'tetris') return
    
    const handleKeyDown = (e) => {
      if (tetrisGameOver || tetrisPaused) return
      
      switch (e.key) {
        case 'ArrowLeft':
        case 'a':
        case 'A':
          e.preventDefault()
          moveBlockLeft()
          break
        case 'ArrowRight':
        case 'd':
        case 'D':
          e.preventDefault()
          moveBlockRight()
          break
        case ' ':
          e.preventDefault()
          pauseTetrisGame()
          break
        default:
          break
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [currentView, tetrisGameOver, tetrisPaused, moveBlockLeft, moveBlockRight, pauseTetrisGame])

  // Game loop for falling blocks
  useEffect(() => {
    if (currentView !== 'tetris' || tetrisGameOver || tetrisPaused) return
    
    const gameLoop = setInterval(() => {
      setFallingBlocks(prev => {
        if (prev.length === 0) {
          spawnFallingBlock()
          return prev
        }
        
        return prev.map(block => {
          const newY = block.y + 1
          
          // Check if block has landed
          if (newY >= tetrisBoard.length || tetrisBoard[newY][block.x]) {
            // Place block on board
            setTetrisBoard(currentBoard => {
              const newBoard = currentBoard.map(row => [...row])
              if (block.y < newBoard.length && block.x < newBoard[0].length) {
                newBoard[block.y][block.x] = {
                  letter: block.letter,
                  color: block.color
                }
              }
              return newBoard
            })
            
            // Check for completed lines
            checkTetrisLines()
            
            // Spawn new block
            setTimeout(() => spawnFallingBlock(), 500)
            
            return null // Remove this block
          }
          
          return { ...block, y: newY }
        }).filter(Boolean) // Remove null blocks
      })
    }, fallingSpeed)
    
    return () => clearInterval(gameLoop)
  }, [currentView, tetrisGameOver, tetrisPaused, fallingSpeed, tetrisBoard, spawnFallingBlock, checkTetrisLines])

  // Initialize board when component mounts
  useEffect(() => {
    
    if (currentView === 'original' && board.length === 0) {
      generateBoard()
    }
    
    // Fallback: if we're in original view but no board after a delay, generate one
    if (currentView === 'original' && board.length === 0) {
      const timer = setTimeout(() => {
        if (board.length === 0) {
          generateFallbackBoard()
        }
      }, 1000)
      
      return () => clearTimeout(timer)
    }
  }, [currentView, board.length, generateBoard, WORD_SETS, generateFallbackBoard])

  // Generate board when level changes (but not on initial load)
  useEffect(() => {
    if (currentLevel > 1 && currentView === 'original') {
      generateBoard()
    }
  }, [currentLevel, currentView, generateBoard])

  // Initialize Tetris board when Tetris view is selected
  useEffect(() => {
    if (currentView === 'tetris' && tetrisBoard.length === 0) {
      generateTetrisBoard()
    }
  }, [currentView, tetrisBoard.length, generateTetrisBoard])

  // Rotate a block
  const rotateBlock = useCallback((block) => {
    if (!block) return block
    
    const rotatedShape = []
    const rotatedLetters = []
    const rows = block.shape.length
    const cols = block.shape[0].length
    
    for (let c = 0; c < cols; c++) {
      rotatedShape[c] = []
      rotatedLetters[c] = []
      for (let r = rows - 1; r >= 0; r--) {
        rotatedShape[c][rows - 1 - r] = block.shape[r][c]
        rotatedLetters[c][rows - 1 - r] = block.letters[r][c]
      }
    }
    
    return {
      ...block,
      shape: rotatedShape,
      letters: rotatedLetters
    }
  }, [])



  // Handle next level button
  const handleNextLevel = useCallback(() => {
    setShowLevelCompleteModal(false)
    if (currentLevel < 20) {
      setCurrentLevel(currentLevel + 1)
      setHintCount(3)
      setCompletedWords(new Set())
      setBoard([]) // Clear board to trigger regeneration via useEffect
    } else {
      // Game completed!
      setCurrentView('menu')
    }
    setLevelTransitioning(false)
  }, [currentLevel])

  // Touch and mouse gesture handling for mobile and desktop
  const [touchStart, setTouchStart] = useState(null)
  const [touchEnd, setTouchEnd] = useState(null)
  const [selectedTile, setSelectedTile] = useState(null)
  const [isDragging, setIsDragging] = useState(false)
  const [dragAllowedDir, setDragAllowedDir] = useState(null) // 'left'|'right'|'up'|'down'|null

  const handleTouchStart = useCallback((e, r, c) => {
    if (!board[r][c]) return // Don't select empty tiles
    
    // Only allow dragging tiles that are directly adjacent to the empty cell
    const isAdjacent = (
      (emptyPos.r === r && emptyPos.c === c + 1) || // Empty is to the right
      (emptyPos.r === r && emptyPos.c === c - 1) || // Empty is to the left  
      (emptyPos.c === c && emptyPos.r === r + 1) || // Empty is below
      (emptyPos.c === c && emptyPos.r === r - 1)    // Empty is above
    )
    
    if (!isAdjacent) return // Don't allow dragging non-adjacent tiles
    
    // Add visual feedback for touch
    const tileElement = e.currentTarget
    if (tileElement) {
      // Keep a subtle highlight without scaling to avoid layout shifts
      tileElement.style.boxShadow = '0 0 16px rgba(255, 215, 0, 0.6)'
    }
    
    setTouchStart({
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
      r: r,
      c: c
    })
    setSelectedTile({ r, c })
    // Determine allowed drag direction (only if empty is adjacent)
    if (emptyPos.r === r && emptyPos.c === c + 1) setDragAllowedDir('right')
    else if (emptyPos.r === r && emptyPos.c === c - 1) setDragAllowedDir('left')
    else if (emptyPos.c === c && emptyPos.r === r + 1) setDragAllowedDir('down')
    else if (emptyPos.c === c && emptyPos.r === r - 1) setDragAllowedDir('up')
    else setDragAllowedDir(null)
    setIsDragging(true)
  }, [board, emptyPos])

  const handleMouseDown = useCallback((e, r, c) => {
    if (!board[r][c]) return // Don't select empty tiles
    
    // Only allow dragging tiles that are directly adjacent to the empty cell
    const isAdjacent = (
      (emptyPos.r === r && emptyPos.c === c + 1) || // Empty is to the right
      (emptyPos.r === r && emptyPos.c === c - 1) || // Empty is to the left  
      (emptyPos.c === c && emptyPos.r === r + 1) || // Empty is below
      (emptyPos.c === c && emptyPos.r === r - 1)    // Empty is above
    )
    
    if (!isAdjacent) return // Don't allow dragging non-adjacent tiles
    
    e.preventDefault()
    
    // Add visual feedback for mouse interaction
    const tileElement = e.currentTarget
    if (tileElement) {
      tileElement.style.boxShadow = '0 0 16px rgba(255, 215, 0, 0.6)'
    }
    
    setTouchStart({
      x: e.clientX,
      y: e.clientY,
      r: r,
      c: c
    })
    setSelectedTile({ r, c })
    // Determine allowed drag direction (only if empty is adjacent)
    if (emptyPos.r === r && emptyPos.c === c + 1) setDragAllowedDir('right')
    else if (emptyPos.r === r && emptyPos.c === c - 1) setDragAllowedDir('left')
    else if (emptyPos.c === c && emptyPos.r === r + 1) setDragAllowedDir('down')
    else if (emptyPos.c === c && emptyPos.r === r - 1) setDragAllowedDir('up')
    else setDragAllowedDir(null)
    setIsDragging(true)
  }, [board, emptyPos])

  const handleTouchMove = useCallback((e) => {
    if (!touchStart || !selectedTile || !isDragging) return
    const currentX = e.touches[0].clientX
    const currentY = e.touches[0].clientY
    
    // Calculate raw movement from start position
    const rawDx = currentX - touchStart.x
    const rawDy = currentY - touchStart.y
    
    // Apply movement with clamping to empty cell boundary
    const tileEl = document.querySelector(`[data-tile="${selectedTile.r}-${selectedTile.c}"]`)
    if (tileEl) {
      tileEl.style.transition = 'none' // No transition for real-time following
      
      const step = tileStep || (41 + 1)
      const maxDistance = step * 1.1 // Allow 10% overshoot for natural feel
      
      // Clamp movement to empty cell boundary with slight overshoot
      if (dragAllowedDir === 'right' && rawDx > 0) {
        const clampedDx = Math.min(rawDx, maxDistance)
        tileEl.style.transform = `translate(${clampedDx}px, 0px)`
      } else if (dragAllowedDir === 'left' && rawDx < 0) {
        const clampedDx = Math.max(rawDx, -maxDistance)
        tileEl.style.transform = `translate(${clampedDx}px, 0px)`
      } else if (dragAllowedDir === 'down' && rawDy > 0) {
        const clampedDy = Math.min(rawDy, maxDistance)
        tileEl.style.transform = `translate(0px, ${clampedDy}px)`
      } else if (dragAllowedDir === 'up' && rawDy < 0) {
        const clampedDy = Math.max(rawDy, -maxDistance)
        tileEl.style.transform = `translate(0px, ${clampedDy}px)`
      } else {
        // Reset if dragging in wrong direction
        tileEl.style.transform = `translate(0px, 0px)`
      }
    }
    setTouchEnd({ x: currentX, y: currentY })
  }, [touchStart, selectedTile, isDragging, dragAllowedDir])

  const handleMouseMove = useCallback((e) => {
    if (!touchStart || !selectedTile || !isDragging) return
    e.preventDefault()
    
    // Calculate raw movement from start position
    const rawDx = e.clientX - touchStart.x
    const rawDy = e.clientY - touchStart.y
    
    // Apply movement with clamping to empty cell boundary
    const tileEl = document.querySelector(`[data-tile="${selectedTile.r}-${selectedTile.c}"]`)
    if (tileEl) {
      tileEl.style.transition = 'none' // No transition for real-time following
      
      const step = tileStep || (41 + 1)
      const maxDistance = step * 1.1 // Allow 10% overshoot for natural feel
      
      // Clamp movement to empty cell boundary with slight overshoot
      if (dragAllowedDir === 'right' && rawDx > 0) {
        const clampedDx = Math.min(rawDx, maxDistance)
        tileEl.style.transform = `translate(${clampedDx}px, 0px)`
      } else if (dragAllowedDir === 'left' && rawDx < 0) {
        const clampedDx = Math.max(rawDx, -maxDistance)
        tileEl.style.transform = `translate(${clampedDx}px, 0px)`
      } else if (dragAllowedDir === 'down' && rawDy > 0) {
        const clampedDy = Math.min(rawDy, maxDistance)
        tileEl.style.transform = `translate(0px, ${clampedDy}px)`
      } else if (dragAllowedDir === 'up' && rawDy < 0) {
        const clampedDy = Math.max(rawDy, -maxDistance)
        tileEl.style.transform = `translate(0px, ${clampedDy}px)`
      } else {
        // Reset if dragging in wrong direction
        tileEl.style.transform = `translate(0px, 0px)`
      }
    }
    setTouchEnd({ x: e.clientX, y: e.clientY })
  }, [touchStart, selectedTile, isDragging, dragAllowedDir])

  const handleTouchEnd = useCallback((e) => {
    if (!touchStart || !touchEnd || !selectedTile) {
      setTouchStart(null)
      setTouchEnd(null)
      setSelectedTile(null)
      setIsDragging(false)
      setDragAllowedDir(null)
      return
    }

    const deltaX = touchEnd.x - touchStart.x
    const deltaY = touchEnd.y - touchStart.y
    const step = tileStep || (41 + 1)
    const threshold = step * 0.3

    // Check if we should trigger a move based on drag distance and direction
    let moveTriggered = false
    if (dragAllowedDir === 'right' && deltaX > threshold) moveTriggered = true
    else if (dragAllowedDir === 'left' && -deltaX > threshold) moveTriggered = true
    else if (dragAllowedDir === 'down' && deltaY > threshold) moveTriggered = true
    else if (dragAllowedDir === 'up' && -deltaY > threshold) moveTriggered = true

    const tileEl = document.querySelector(`[data-tile="${selectedTile.r}-${selectedTile.c}"]`)
    
    if (moveTriggered) {
      // Calculate final position (where tile should end up - empty cell)
      let finalX = 0, finalY = 0
      if (dragAllowedDir === 'right') finalX = step
      else if (dragAllowedDir === 'left') finalX = -step
      else if (dragAllowedDir === 'down') finalY = step
      else if (dragAllowedDir === 'up') finalY = -step
      
      if (tileEl) {
        // Continue smoothly from current position to final position
        tileEl.style.transition = 'transform 0.2s cubic-bezier(0.23, 1, 0.32, 1)'
        tileEl.style.transform = `translate(${finalX}px, ${finalY}px)`
      }

      // Complete the move after animation
      setTimeout(() => {
        directMove(selectedTile.r, selectedTile.c)
        if (tileEl) {
          tileEl.style.transition = 'none'
          tileEl.style.transform = 'translate(0px, 0px)'
        }
      }, 200)
    } else {
      // Snap back to original position
      if (tileEl) {
        tileEl.style.transition = 'transform 0.15s cubic-bezier(0.34, 1.56, 0.64, 1)'
        tileEl.style.transform = 'translate(0px, 0px)'
      }
    }

    setTouchStart(null)
    setTouchEnd(null)
    setSelectedTile(null)
    setIsDragging(false)
    setDragAllowedDir(null)
  }, [touchStart, touchEnd, selectedTile, dragAllowedDir, tileStep, directMove])

  const handleMouseUp = useCallback((e) => {
    if (!touchStart || !selectedTile) {
      setTouchStart(null)
      setSelectedTile(null)
      setIsDragging(false)
      setDragAllowedDir(null)
      return
    }

    const deltaX = e.clientX - touchStart.x
    const deltaY = e.clientY - touchStart.y
    const step = tileStep || (41 + 1)
    const threshold = step * 0.3

    // Check if we should trigger a move based on drag distance and direction
    let moveTriggered = false
    if (dragAllowedDir === 'right' && deltaX > threshold) moveTriggered = true
    else if (dragAllowedDir === 'left' && -deltaX > threshold) moveTriggered = true
    else if (dragAllowedDir === 'down' && deltaY > threshold) moveTriggered = true
    else if (dragAllowedDir === 'up' && -deltaY > threshold) moveTriggered = true

    const tileEl = document.querySelector(`[data-tile="${selectedTile.r}-${selectedTile.c}"]`)
    
    if (moveTriggered) {
      // Calculate final position (where tile should end up - empty cell)
      let finalX = 0, finalY = 0
      if (dragAllowedDir === 'right') finalX = step
      else if (dragAllowedDir === 'left') finalX = -step
      else if (dragAllowedDir === 'down') finalY = step
      else if (dragAllowedDir === 'up') finalY = -step
      
      if (tileEl) {
        // Continue smoothly from current position to final position
        tileEl.style.transition = 'transform 0.2s cubic-bezier(0.23, 1, 0.32, 1)'
        tileEl.style.transform = `translate(${finalX}px, ${finalY}px)`
      }

      // Complete the move after animation
      setTimeout(() => {
        directMove(selectedTile.r, selectedTile.c)
        if (tileEl) {
          tileEl.style.transition = 'none'
          tileEl.style.transform = 'translate(0px, 0px)'
        }
      }, 200)
    } else {
      // Snap back to original position
      if (tileEl) {
        tileEl.style.transition = 'transform 0.15s cubic-bezier(0.34, 1.56, 0.64, 1)'
        tileEl.style.transform = 'translate(0px, 0px)'
      }
    }

    setTouchStart(null)
    setSelectedTile(null)
    setIsDragging(false)
    setDragAllowedDir(null)
  }, [touchStart, selectedTile, dragAllowedDir, tileStep, directMove])

  // Global mouse up handler for when mouse is released outside tiles
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (isDragging) {
        // Reset visual state of selected tile
        if (selectedTile) {
          resetTileVisualState(selectedTile.r, selectedTile.c)
        }
        setTouchStart(null)
        setTouchEnd(null)
        setSelectedTile(null)
        setIsDragging(false)
      }
    }

    document.addEventListener('mouseup', handleGlobalMouseUp)
    return () => document.removeEventListener('mouseup', handleGlobalMouseUp)
  }, [isDragging, selectedTile, resetTileVisualState])

  // Cleanup animation overlay when animation state changes
  useEffect(() => {
    // Reset animation state when view changes
    if (currentView !== 'original') {
      setAnimating(false)
      setAnimation(null)
    }
    
    return () => {
      // Cleanup when component unmounts
      setAnimating(false)
      setAnimation(null)
    }
  }, [currentView])

  // Animation overlay completely disabled - using direct moves only
  // useEffect(() => {
  //   if (!animating || !animation) return
  //   const overlay = document.querySelector('[data-animation-overlay]')
  //   if (overlay) {
  //     overlay.offsetHeight
  //     const step = tileStep || (41 + 1)
  //     overlay.style.transform = `translate(${step * animation.to.c}px, ${step * animation.to.r}px)`
  //     const onEnd = () => {
  //       setBoard(prevBoard => {
  //         const b = prevBoard.map(row => [...row])
  //         b[animation.to.r][animation.to.c] = animation.letter
  //         b[animation.from.r][animation.from.c] = ''
  //         return b
  //       })
  //       setEmptyPos({ r: animation.from.r, c: animation.from.c })
  //       setSwapHold({ r: animation.to.r, c: animation.to.c })
  //       requestAnimationFrame(() => {
  //         requestAnimationFrame(() => {
  //           setAnimating(false)
  //           setAnimation(null)
  //           setTimeout(() => setSwapHold(null), 0)
  //         })
  //       })
  //       overlay.removeEventListener('transitionend', onEnd)
  //     }
  //     overlay.addEventListener('transitionend', onEnd, { once: true })
  //   }
  // }, [animating, animation, checkWordCompletion, tileStep])

  // Handle drag start
  const handleMiniDragStart = useCallback((r, c, e) => {
    e.stopPropagation()
    if (miniGameCompleted) return
    
    // Check if tile can move (adjacent to empty)
    const dr = Math.abs(r - miniEmptyPos.r)
    const dc = Math.abs(c - miniEmptyPos.c)
    
    if ((dr === 1 && dc === 0) || (dr === 0 && dc === 1)) {
      const clientX = e.clientX || e.touches?.[0]?.clientX
      const clientY = e.clientY || e.touches?.[0]?.clientY
      
      setDragState({
        isDragging: true,
        draggedTile: { r, c },
        dragOffset: { x: 0, y: 0 },
        startPos: { x: clientX, y: clientY }
      })
    }
  }, [miniEmptyPos, miniGameCompleted])

  // Handle drag move
  const handleMiniDragMove = useCallback((e) => {
    if (!dragState.isDragging || !dragState.draggedTile) return
    
    const clientX = e.clientX || e.touches?.[0]?.clientX
    const clientY = e.clientY || e.touches?.[0]?.clientY
    
    if (clientX !== undefined && clientY !== undefined) {
      const deltaX = clientX - dragState.startPos.x
      const deltaY = clientY - dragState.startPos.y
      
      // Constrain movement to valid directions and within bounds
      const { r, c } = dragState.draggedTile
      const emptyR = miniEmptyPos.r
      const emptyC = miniEmptyPos.c
      
      let constrainedX = 0
      let constrainedY = 0
      
      // Calculate tile size and gap (approximately 50px based on CSS, with small gap)
      const tileSize = 50
      const gapSize = 2 // Small gap between tiles
      const maxDragDistance = tileSize - (gapSize * 2) // Leave small buffer so tiles barely touch
      
      // Only allow movement toward the empty space, but not past it
      if (r === emptyR) {
        // Same row - allow horizontal movement
        if (c > emptyC) {
          // Tile is to the right of empty, allow left movement but stop before overlapping adjacent tile
          const maxLeftMovement = -maxDragDistance
          constrainedX = Math.max(maxLeftMovement, Math.min(0, deltaX))
        } else {
          // Tile is to the left of empty, allow right movement but stop before overlapping adjacent tile
          const maxRightMovement = maxDragDistance
          constrainedX = Math.min(maxRightMovement, Math.max(0, deltaX))
        }
      } else if (c === emptyC) {
        // Same column - allow vertical movement
        if (r > emptyR) {
          // Tile is below empty, allow up movement but stop before overlapping adjacent tile
          const maxUpMovement = -maxDragDistance
          constrainedY = Math.max(maxUpMovement, Math.min(0, deltaY))
        } else {
          // Tile is above empty, allow down movement but stop before overlapping adjacent tile
          const maxDownMovement = maxDragDistance
          constrainedY = Math.min(maxDownMovement, Math.max(0, deltaY))
        }
      }
      
      setDragState(prev => ({
        ...prev,
        dragOffset: { x: constrainedX, y: constrainedY }
      }))
    }
  }, [dragState, miniEmptyPos])

  // Handle drag end
  const handleMiniDragEnd = useCallback((e) => {
    if (!dragState.isDragging || !dragState.draggedTile) return
    
    const { r, c } = dragState.draggedTile
    const { x, y } = dragState.dragOffset
    
    // Calculate required distance to complete move (half the allowed drag distance)
    const tileSize = 50
    const gapSize = 2
    const maxDragDistance = tileSize - (gapSize * 2)
    const threshold = maxDragDistance * 0.5 // 50% of the allowed drag distance
    const shouldMove = Math.abs(x) > threshold || Math.abs(y) > threshold
    
    if (shouldMove) {
      
      // Move the tile
      setMiniBoard(prevBoard => {
        const newBoard = prevBoard.map(row => [...row])
        const movingLetter = prevBoard[r][c]
        newBoard[miniEmptyPos.r][miniEmptyPos.c] = movingLetter
        newBoard[r][c] = ''
        return newBoard
      })
      
      // Update empty position
      setMiniEmptyPos({ r, c })
      
      // Check completion after a short delay
      setTimeout(() => {
        setMiniBoard(currentBoard => {
          const playRow = currentBoard[2]
          const playString = playRow.join('')
          
          if (playString === 'PLAY' && !miniGameCompleted) {
            setMiniGameCompleted(true)
            
            setTimeout(() => {
              setMiniGameCompleted(false)
              setMiniBoard([
                ['R', 'T', 'K', 'M', 'N'],
                ['B', 'F', 'H', 'S', 'C'],
                ['P', 'L', 'A', '', 'Y'],
                ['D', 'W', 'Z', 'V', 'Q'],
                ['J', 'G', 'X', 'U', 'I']
              ])
              setMiniEmptyPos({ r: 2, c: 3 })
              setCurrentView('original')
              setCurrentLevel(1)
              setMoveCount(0)
              setCompletedWords(new Set())
              setHintCount(3)
              setLevelTransitioning(false)
              setBoard([])
              setEmptyPos({ r: 6, c: 6 })
            }, 2000)
          }
          
          return currentBoard
        })
      }, 50)
    }
    
    // Reset drag state
    setDragState({
      isDragging: false,
      draggedTile: null,
      dragOffset: { x: 0, y: 0 },
      startPos: { x: 0, y: 0 }
    })
  }, [dragState, miniEmptyPos, miniGameCompleted])

  // Add global mouse/touch move and end handlers
  useEffect(() => {
    if (dragState.isDragging) {
      const handleGlobalMove = (e) => handleMiniDragMove(e)
      const handleGlobalEnd = (e) => handleMiniDragEnd(e)
      
      document.addEventListener('mousemove', handleGlobalMove)
      document.addEventListener('mouseup', handleGlobalEnd)
      document.addEventListener('touchmove', handleGlobalMove, { passive: false })
      document.addEventListener('touchend', handleGlobalEnd)
      
      return () => {
        document.removeEventListener('mousemove', handleGlobalMove)
        document.removeEventListener('mouseup', handleGlobalEnd)
        document.removeEventListener('touchmove', handleGlobalMove)
        document.removeEventListener('touchend', handleGlobalEnd)
      }
    }
  }, [dragState.isDragging, handleMiniDragMove, handleMiniDragEnd])

  // Start original game
  const startOriginalGame = useCallback(() => {
    setCurrentView('original')
    
    // Try to generate the main board first
    if (WORD_SETS && WORD_SETS.length > 0) {
      generateBoard()
    } else {
      // Fallback to simple board if WORD_SETS not ready
      generateFallbackBoard()
    }
  }, [generateBoard, generateFallbackBoard, WORD_SETS, board])

  // Show hint confirmation
  const showHintConfirmation = useCallback(() => {
    if (hintCount <= 0) {
      return
    }
    setHintCount(prev => prev - 1)
    const targetWords = WORD_SETS[currentLevel - 1] || WORD_SETS[0]
    const uncompletedWords = (targetWords || []).filter(word => !completedWords.has(word))
    const chosenWord = (uncompletedWords.length > 0 ? uncompletedWords : targetWords)?.[0]
    if (!chosenWord || board.length === 0) return
    const letters = chosenWord.toUpperCase().split('')
    // For each letter (including duplicates), pick one matching tile on the board.
    const lettersSet = new Set(letters)
    const getNeighborsScore = (pos) => {
      const dirs = [[1,0],[-1,0],[0,1],[0,-1]]
      let score = 0
      for (const [dr, dc] of dirs) {
        const nr = pos.r + dr
        const nc = pos.c + dc
        if (nr >= 0 && nr < board.length && nc >= 0 && nc < board[nr].length) {
          const neighbor = board[nr][nc]
          if (neighbor && lettersSet.has(String(neighbor).toUpperCase())) {
            score += 1
          }
        }
      }
      return score
    }
    const usedKeys = new Set()
    const selectedPositions = []
    for (const letter of letters) {
      const candidates = []
      for (let r = 0; r < board.length; r++) {
        for (let c = 0; c < board[r].length; c++) {
          const cell = board[r][c]
          if (cell && String(cell).toUpperCase() === letter.toUpperCase()) {
            const key = `${r}-${c}`
            if (!usedKeys.has(key)) {
              candidates.push({ r, c })
            }
          }
        }
      }
      if (candidates.length === 0) continue
      // Prefer candidates with more neighbors that are also part of the word
      let bestPos = candidates[0]
      let bestScore = -1
      for (const pos of candidates) {
        const score = getNeighborsScore(pos)
        if (score > bestScore) {
          bestScore = score
          bestPos = pos
        }
      }
      selectedPositions.push(bestPos)
      usedKeys.add(`${bestPos.r}-${bestPos.c}`)
    }
    if (selectedPositions.length === 0) return
    setHintBlinkPositions(selectedPositions)
    setTimeout(() => setHintBlinkPositions([]), 3000)
  }, [hintCount, currentLevel, completedWords, WORD_SETS, board])

  // Show rules modal
  const showRulesModal = useCallback(() => {
    setShowRules(true)
  }, [])

  // Close rules modal
  const closeRulesModal = useCallback(() => {
    setShowRules(false)
  }, [])

  // Earn hint for completing words
  const earnHint = useCallback(() => {
    setHintCount(prev => prev + 1)
  }, [])

  // Fireworks component
  const Fireworks = () => (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      pointerEvents: 'none',
      zIndex: 9999,
      overflow: 'hidden',
      maxWidth: '100vw',
      maxHeight: '100vh'
    }}>
      {Array.from({ length: 20 }, (_, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            width: '4px',
            height: '4px',
            backgroundColor: ['#FFD700', '#FF69B4', '#00CED1', '#90EE90', '#FF4500'][Math.floor(Math.random() * 5)],
            borderRadius: '50%',
            animation: `firework ${1 + Math.random() * 2}s ease-out forwards`
          }}
        />
      ))}
    </div>
  )

  // Add CSS keyframes for title animations
  useEffect(() => {
    const style = document.createElement('style')
    style.textContent = `
      @keyframes titleEntrance {
        0% {
          opacity: 0;
          transform: translateY(-20px);
        }
        100% {
          opacity: 1;
          transform: translateY(0);
        }
      }
      
      @keyframes letterSlideIn {
        0% {
          opacity: 0;
          transform: translateX(100px);
        }
        100% {
          opacity: 1;
          transform: translateX(0);
        }
      }

      @keyframes hintBlink {
        0% { filter: none; opacity: 1; }
        50% { filter: brightness(1.25); opacity: 0.7; }
        100% { filter: none; opacity: 1; }
      }
    `
    document.head.appendChild(style)
    
    return () => {
      document.head.removeChild(style)
    }
  }, [])

  return (
    <div id="game-container" className="game-container" style={{
      width: '100vw',
      height: '100vh',
      overflow: 'hidden',
      position: 'relative',
      maxWidth: '100vw',
      maxHeight: '100vh'
    }}>
      {currentView === 'menu' && (
        <div id="main-menu" className="main-menu" style={{
          zIndex: 1000, 
          position: 'relative',
          padding: '20px 10px',
          maxWidth: '100vw',
          maxHeight: '100vh',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'flex-start',
          minHeight: '100vh',
          paddingTop: '40px'
        }}>
          <h1 className="game-title" style={{
            fontSize: 'clamp(32px, 8vw, 48px)',
            textAlign: 'center',
            margin: '20px 0',
            color: '#F5DEB3',
            textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0'
          }}>
            <span style={{
              animation: 'titleEntrance 1s ease-out forwards'
            }}>
              Crosslid
            </span>
            <span style={{
              animation: 'letterSlideIn 1.2s ease-out 0.3s forwards',
              transform: 'translateX(100px)',
              opacity: 0
            }}>
              e
            </span>
          </h1>
          
          <p style={{
            fontSize: 'clamp(14px, 3.5vw, 18px)',
            textAlign: 'center',
            margin: '10px 0 30px 0',
            color: '#F5DEB3',
            fontStyle: 'italic',
            textShadow: '1px 1px 2px rgba(0,0,0,0.6)',
            animation: 'titleEntrance 1.5s ease-out 0.8s forwards',
            opacity: 0
          }}>
            A word solving puzzle game!
          </p>
          
          {/* Debug Modal State */}
          {/* removed debug box */}
          
          <div id="menu-buttons" className="menu-buttons" style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '15px',
            alignItems: 'center',
            margin: '20px 0'
          }}>
            {/* Mini Gameboard Play Button */}
            <div
              style={{
                cursor: 'pointer',
                padding: '20px',
                background: 'linear-gradient(135deg, #8B4513 0%, #A0522D 50%, #8B4513 100%)',
                border: '4px solid #654321',
                borderRadius: '15px',
                boxShadow: '0 12px 24px rgba(0, 0, 0, 0.4), inset 0 2px 0 rgba(255, 255, 255, 0.1)',
                transition: 'all 0.3s ease',
                position: 'relative',
                backgroundImage: `
                  repeating-linear-gradient(
                    0deg,
                    transparent,
                    transparent 60px,
                    #3D2318 60px,
                    #3D2318 65px
                  ),
                  repeating-linear-gradient(
                    90deg,
                    transparent,
                    transparent 3px,
                    #4A2C1A 3px,
                    #4A2C1A 6px
                  )
                `
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'translateY(-2px) scale(1.02)'
                e.target.style.boxShadow = '0 16px 32px rgba(0, 0, 0, 0.5), inset 0 2px 0 rgba(255, 255, 255, 0.15)'
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0) scale(1)'
                e.target.style.boxShadow = '0 12px 24px rgba(0, 0, 0, 0.4), inset 0 2px 0 rgba(255, 255, 255, 0.1)'
              }}
            >
              {/* 5x5 Mini Gameboard */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(5, 1fr)',
                gap: '3px',
                width: 'clamp(300px, 35vw, 400px)',
                aspectRatio: '1',
                background: 'rgba(47, 27, 20, 0.3)',
                padding: '8px',
                borderRadius: '8px',
                position: 'relative'
              }}>
                {miniBoard.map((row, r) => 
                  row.map((letter, c) => {
                    const isEmpty = letter === ''
                    const isPlayTile = (r === 2 && ['P', 'L', 'A', 'Y'].includes(letter)) // Middle row PLAY tiles
                    const isCompleted = miniGameCompleted && r === 2 // All middle row tiles when completed
                    const isAdjacent = !miniGameCompleted && !isEmpty && (
                      (Math.abs(r - miniEmptyPos.r) === 1 && c === miniEmptyPos.c) ||
                      (Math.abs(c - miniEmptyPos.c) === 1 && r === miniEmptyPos.r)
                    )
                    
                    return (
                      <div
                        key={`${r}-${c}`}
                        className={`mini-tile ${
                          isEmpty 
                            ? 'empty-cell' 
                            : isCompleted 
                              ? 'completed-tile' 
                              : isPlayTile 
                                ? 'play-tile' 
                                : 'background-tile'
                        }`}
                        onMouseDown={(e) => handleMiniDragStart(r, c, e)}
                        onTouchStart={(e) => handleMiniDragStart(r, c, e)}
                        style={{
                          cursor: isAdjacent ? 'grab' : 'default',
                          position: 'relative',
                          background: isEmpty ? 'transparent' : undefined,
                          border: isEmpty ? '2px dashed #F5DEB3' : undefined,
                          opacity: isEmpty ? 0.6 : undefined,
                          animation: (isPlayTile && letter === 'Y' && !miniGameCompleted && !dragState.isDragging) 
                            ? 'miniTileSlideHint 3s ease-in-out infinite' 
                            : 'none',
                          transform: (dragState.draggedTile?.r === r && dragState.draggedTile?.c === c) 
                            ? `translate(${dragState.dragOffset.x}px, ${dragState.dragOffset.y}px)` 
                            : 'none',
                          zIndex: (dragState.draggedTile?.r === r && dragState.draggedTile?.c === c) ? 10 : 1,
                          transition: dragState.isDragging ? 'none' : 'transform 0.2s ease',
                          userSelect: 'none',
                          touchAction: 'none'
                        }}
                      >
                        {letter}
                        {/* Show arrow hint only on Y tile when it can move left */}
                        {letter === 'Y' && r === 2 && c === 4 && miniEmptyPos.r === 2 && miniEmptyPos.c === 3 && !miniGameCompleted && (
                          <div style={{
                            position: 'absolute',
                            top: '50%',
                            right: '-15px',
                            transform: 'translateY(-50%)',
                            color: '#32CD32',
                            fontSize: '12px',
                            animation: 'arrowSlideHint 3s ease-in-out infinite'
                          }}>←</div>
                        )}
                      </div>
                    )
                  })
                )}
              </div>

              
              {/* Play Label */}
              <div style={{
                textAlign: 'center',
                marginTop: '15px',
                fontSize: 'clamp(16px, 4vw, 20px)',
                fontWeight: 'bold',
                color: miniGameCompleted ? '#32CD32' : '#F5DEB3',
                textShadow: '2px 2px 4px rgba(0, 0, 0, 0.8)',
                fontFamily: 'Georgia, serif',
                transition: 'color 0.5s ease'
              }}>
              {miniGameCompleted ? 'Let\'s play!' : 'Slide the Y to play!'}
              </div>
            </div>
            
            
          </div>
          
          {/* Auth Modal */}
          <AuthModal 
            isOpen={showAuthModal} 
            onClose={() => {
              setShowAuthModal(false)
            }}
            initialMode="login"
          />

        </div>
      )}

      {currentView === 'original' && (
        <div id="original-game-view" style={{
          maxHeight: '100vh',
          overflow: 'auto',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          backgroundColor: '#2F1B14',
          backgroundImage: `
            repeating-linear-gradient(
              0deg,
              transparent,
              transparent 60px,
              #3D2318 60px,
              #3D2318 65px
            ),
            repeating-linear-gradient(
              90deg,
              transparent,
              transparent 3px,
              rgba(47, 27, 20, 0.9) 3px,
              rgba(47, 27, 20, 0.9) 6px
            ),
            repeating-linear-gradient(
              0deg,
              transparent,
              transparent 6px,
              rgba(61, 35, 24, 0.5) 6px,
              rgba(61, 35, 24, 0.5) 12px
            ),
            repeating-linear-gradient(
              0deg,
              transparent,
              transparent 60px,
              rgba(255, 255, 255, 0.03) 60px,
              rgba(255, 255, 255, 0.03) 65px
            )
          `,
          minHeight: '100vh',
          padding: '20px'
        }}>
          <h1 style={{
            fontSize: 'clamp(24px, 6vw, 32px)',
            textAlign: 'center',
            margin: '10px 0',
            color: '#F5DEB3'
          }}>
            WordSlide - Level {currentLevel}
          </h1>
          
          <div id="target-words-info-panel" style={{
            borderRadius: '10px',
            padding: '15px',
            margin: '10px auto',
            maxWidth: '90vw',
            textAlign: 'center'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexWrap: 'wrap',
              gap: '12px',
              marginBottom: '10px'
            }}>
              <span style={{
                fontSize: 'clamp(14px, 3.5vw, 16px)',
                fontWeight: 'bold',
                color: '#F5DEB3',
                marginRight: '8px'
              }}>
                Target Words:
              </span>
              <div id="target-words-list" style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '12px',
                alignItems: 'center'
              }}>
                {WORD_SETS[currentLevel - 1]?.map((word) => (
                  <div key={word} style={{
                    display: 'flex',
                    gap: '2px',
                    alignItems: 'center'
                  }}>
                    {word.toUpperCase().split('').map((letter, letterIndex) => (
                      <div
                        key={`${word}-${letterIndex}`}
                        style={{
                          width: '24px',
                          height: '24px',
                          backgroundColor: completedWords.has(word) ? '#90EE90' : '#F5DEB3',
                          color: completedWords.has(word) ? '#006400' : '#8B4513',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '14px',
                          fontWeight: '900',
                          borderRadius: '3px',
                          // 3D block effect like game tiles
                          boxShadow: completedWords.has(word) 
                            ? '2px 2px 4px rgba(0,0,0,0.3), inset 1px 1px 0 rgba(255,255,255,0.3), inset -1px -1px 0 rgba(0,0,0,0.2)'
                            : '2px 2px 4px rgba(0,0,0,0.3), inset 1px 1px 0 rgba(255,255,255,0.3), inset -1px -1px 0 rgba(139,69,19,0.3)',
                          border: completedWords.has(word) 
                            ? '1px solid #228B22'
                            : '1px solid #CD853F',
                          borderTop: completedWords.has(word)
                            ? '2px solid #32CD32'
                            : '2px solid #F8F0E3',
                          borderLeft: completedWords.has(word)
                            ? '2px solid #32CD32' 
                            : '2px solid #F8F0E3',
                          borderRight: completedWords.has(word)
                            ? '1px solid #006400'
                            : '1px solid #7A6B47',
                          borderBottom: completedWords.has(word)
                            ? '1px solid #006400'
                            : '1px solid #7A6B47',
                          transition: 'all 0.3s ease'
                        }}
                      >
                        {letter}
                      </div>
                    ))}
                    {completedWords.has(word) && (
                      <span style={{
                        color: '#90EE90',
                        fontSize: '12px',
                        marginLeft: '4px'
                      }}>✓</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
            <p style={{margin: '8px 0', fontSize: 'clamp(14px, 4vw, 18px)', color: '#F5DEB3'}}>
              Completed: <span style={{color: '#F5DEB3'}}>
                {completedWords.size}/{WORD_SETS[currentLevel - 1]?.length || 0}
              </span>
            </p>
            <p style={{margin: '8px 0', fontSize: 'clamp(14px, 4vw, 18px)', color: '#F5DEB3'}}>
              Moves: <span style={{color: '#F5DEB3'}}>{moveCount}</span>
            </p>
            {isAuthenticated && user?.username ? (
              <p style={{margin: '8px 0', fontSize: 'clamp(14px, 4vw, 18px)', color: '#F5DEB3'}}>
                User: <span style={{ color: '#FFD700' }}>{user.username}</span>
              </p>
            ) : (
              <div style={{margin: '8px 0', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                <button
                  onClick={() => setShowAuthModal(true)}
                  style={{
                    background: 'linear-gradient(135deg, #F5DEB3, #DEB887)',
                    color: '#654321',
                    border: '2px solid #8B4513',
                    padding: '6px 12px',
                    fontSize: 'clamp(12px, 3vw, 14px)',
                    fontWeight: 'bold',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    minHeight: '28px',
                    minWidth: '80px',
                    boxShadow: '0 4px 8px rgba(139, 69, 19, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.3)',
                    transition: 'all 0.3s ease',
                    fontFamily: 'Georgia, serif',
                    textShadow: '0 1px 1px rgba(255, 255, 255, 0.4)'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.transform = 'translateY(-1px) scale(1.05)'
                    e.target.style.boxShadow = '0 6px 12px rgba(139, 69, 19, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.4)'
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = 'translateY(0) scale(1)'
                    e.target.style.boxShadow = '0 4px 8px rgba(139, 69, 19, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.3)'
                  }}
                >
                  👤 Sign In
                </button>
              </div>
            )}
            
            {/* Game controls */}
            <div id="game-controls" style={{
              marginTop: '10px',
              display: 'flex',
              flexWrap: 'wrap',
              gap: '8px',
              justifyContent: 'center'
            }}>
              <button 
                onClick={showHintConfirmation}
                disabled={hintCount <= 0}
                style={{
                  background: hintCount > 0 
                    ? 'linear-gradient(135deg, #FFD700, #FFA500)' 
                    : 'linear-gradient(135deg, #666, #888)',
                  color: hintCount > 0 ? '#2F1B14' : '#CCC',
                  padding: 'clamp(8px, 2.5vw, 12px) clamp(16px, 4vw, 20px)',
                  borderRadius: '10px',
                  fontSize: 'clamp(13px, 3.5vw, 15px)',
                  fontWeight: 'bold',
                  cursor: hintCount > 0 ? 'pointer' : 'not-allowed',
                  minHeight: '36px',
                  minWidth: '100px',
                  boxShadow: hintCount > 0 
                    ? '0 4px 12px rgba(255, 215, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.3)' 
                    : '0 2px 8px rgba(0, 0, 0, 0.2)',
                  transition: 'all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                  touchAction: 'manipulation',
                  textShadow: hintCount > 0 ? '0 1px 2px rgba(255, 255, 255, 0.3)' : 'none',
                  position: 'relative',
                  overflow: 'hidden'
                }}
                onMouseEnter={(e) => {
                  if (hintCount > 0) {
                    e.target.style.transform = 'translateY(-1px) scale(1.02)'
                    e.target.style.boxShadow = '0 6px 16px rgba(255, 215, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.4)'
                  }
                }}
                onMouseLeave={(e) => {
                  if (hintCount > 0) {
                    e.target.style.transform = 'translateY(0) scale(1)'
                    e.target.style.boxShadow = '0 4px 12px rgba(255, 215, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.3)'
                  }
                }}
              >
                💡 Hint ({hintCount})
              </button>
              
              <button 
                onClick={showRulesModal}
                style={{
                  background: 'linear-gradient(135deg, #00CED1, #20B2AA)',
                  color: '#2F1B14',
                  padding: 'clamp(8px, 2.5vw, 12px) clamp(16px, 4vw, 20px)',
                  borderRadius: '10px',
                  fontSize: 'clamp(13px, 3.5vw, 15px)',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  minHeight: '36px',
                  minWidth: '100px',
                  boxShadow: '0 4px 12px rgba(0, 206, 209, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.3)',
                  transition: 'all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                  touchAction: 'manipulation',
                  textShadow: '0 1px 2px rgba(255, 255, 255, 0.3)',
                  position: 'relative',
                  overflow: 'hidden'
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = 'translateY(-1px) scale(1.02)'
                  e.target.style.boxShadow = '0 6px 16px rgba(0, 206, 209, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.4)'
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'translateY(0) scale(1)'
                  e.target.style.boxShadow = '0 4px 12px rgba(0, 206, 209, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.3)'
                }}
              >
                📖 Rules
              </button>

              <button 
                onClick={() => setShowLeaderboard(true)}
                style={{
                  background: 'linear-gradient(135deg, #F5DEB3, #DEB887)',
                  color: '#654321',
                  padding: 'clamp(8px, 2.5vw, 12px) clamp(16px, 4vw, 20px)',
                  borderRadius: '10px',
                  fontSize: 'clamp(13px, 3.5vw, 15px)',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  minHeight: '36px',
                  minWidth: '100px',
                  boxShadow: '0 4px 12px rgba(139, 69, 19, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.3)',
                  transition: 'all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                  touchAction: 'manipulation',
                  textShadow: '0 1px 2px rgba(255, 255, 255, 0.3)',
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                🏆 Leaderboard
              </button>

              {/* Temporary Logout Button for Testing */}
              {isAuthenticated && (
                <button 
                  onClick={() => {
                    localStorage.removeItem('token');
                    window.location.reload();
                  }}
                  style={{
                    background: 'linear-gradient(135deg, #DC3545, #C82333)',
                    color: '#FFFFFF',
                    padding: 'clamp(8px, 2.5vw, 12px) clamp(16px, 4vw, 20px)',
                    borderRadius: '10px',
                    fontSize: 'clamp(13px, 3.5vw, 15px)',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    minHeight: '36px',
                    minWidth: '100px',
                    boxShadow: '0 4px 12px rgba(220, 53, 69, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.3)',
                    transition: 'all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                    touchAction: 'manipulation',
                    textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)',
                    position: 'relative',
                    overflow: 'hidden',
                    border: '2px solid #A71E2A'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.transform = 'translateY(-1px) scale(1.02)'
                    e.target.style.boxShadow = '0 6px 16px rgba(220, 53, 69, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.4)'
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = 'translateY(0) scale(1)'
                    e.target.style.boxShadow = '0 4px 12px rgba(220, 53, 69, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.3)'
                  }}
                >
                  🚪 Logout (Temp)
                </button>
              )}
              
              {/* Username moved to header box under Moves */}
            </div>
            
            {/* Rules Modal */}
            {showRules && (
              <div
                onClick={closeRulesModal}
                style={{
                  position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                  background: 'rgba(0,0,0,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center',
                  zIndex: 10000, backdropFilter: 'blur(4px)'
                }}
              >
                <div
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    background: 'linear-gradient(135deg, #F5DEB3 0%, #DEB887 100%)',
                    border: '3px solid #8B4513', borderRadius: '14px', padding: '24px',
                    width: 'min(92vw, 700px)', maxHeight: '80vh', overflowY: 'auto',
                    boxShadow: '0 20px 40px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.3)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <h2 style={{ margin: 0, color: '#654321' }}>How to Play - Original Mode</h2>
                    <button onClick={closeRulesModal} style={{
                      background: 'linear-gradient(135deg, #F5DEB3, #DEB887)', color: '#654321', border: '2px solid #8B4513', borderRadius: 8,
                      padding: '6px 10px', cursor: 'pointer', fontWeight: 'bold'
                    }}>×</button>
                  </div>

                  <div style={{ color: '#654321', lineHeight: 1.6, textAlign: 'left' }}>
                    <p style={{ marginTop: 0 }}>🎯 <strong>Goal:</strong> Slide tiles to form the target words shown above the board.</p>
                    <ul style={{ paddingLeft: 18, marginTop: 8 }}>
                      <li>🧩 Only the tile adjacent to the empty cell can move.</li>
                      <li>🖱️ Tap/click a tile next to the empty space to slide it into the empty cell.</li>
                      <li>🏆 Form all target words to complete the round.</li>
                      <li>✅ When a word is completed, its tiles turn green and lock in place.</li>
                      <li>📉 Moves are counted; try to solve with the fewest moves.</li>
                    </ul>
                    <p style={{ marginTop: 12 }}>💡 <strong>Tips:</strong></p>
                    <ul style={{ paddingLeft: 18, marginTop: 6 }}>
                      <li>🔎 Look for near-complete words and free up the needed letter.</li>
                      <li>🌀 Use the empty space strategically to rotate letters into position.</li>
                    </ul>
                  </div>

                  <div style={{ textAlign: 'right', marginTop: 12 }}>
                    <button onClick={closeRulesModal} style={{
                      background: 'linear-gradient(135deg, #F5DEB3, #DEB887)', color: '#654321',
                      border: '3px solid #8B4513', fontWeight: 'bold', borderRadius: 10,
                      padding: '8px 16px', cursor: 'pointer'
                    }}>Got it</button>
                  </div>
                </div>
              </div>
            )}

            {/* Word completion status removed per request */}
          </div>

          {/* Leaderboard Modal for Original Mode */}
          <LeaderboardModal
            isOpen={showLeaderboard}
            onClose={() => setShowLeaderboard(false)}
            gameMode="original"
          />
          
          {/* Game Board */}
          <div style={{
            maxWidth: '95vw',
            maxHeight: '70vh',
            overflow: 'visible',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            position: 'relative',
            isolation: 'isolate',
            contain: 'layout'
          }}>
            
            {/* Board Container - Connected Surface */}
            <div 
              id="board-container"
              ref={boardRef}
              style={{
                width: 'min(90vw, 400px)',
                aspectRatio: '1',
                overflow: 'visible',
                backgroundColor: '#654321', // Dark brown like wood paneling
                padding: '0px', // No padding - blocks align perfectly with board edges
                borderRadius: '12px',
                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4), inset 0 2px 0 rgba(255, 255, 255, 0.1)',
                border: '2px solid #8B4513',
                position: 'relative', // For animation overlay positioning
                // Ensure board stability during animation
                transform: 'translateZ(0)',
                backfaceVisibility: 'hidden',
                contain: 'layout',
                isolation: 'isolate'
              }}
              onTouchStart={(e) => {
                const touch = e.touches[0]
                const rect = e.currentTarget.getBoundingClientRect()
                const touchX = touch.clientX - rect.left
                const centerX = rect.width / 2
                
                if (touchX < centerX) {
                  moveBlockLeft()
                } else {
                  moveBlockRight()
                }
              }}
            >
              {/* Board Rows - 7x8 grid like original game */}
            {board.map((row, r) => (
                <div key={r} style={{
                  display: 'flex',
                  justifyContent: 'center',
                  width: '100%',
                  height: 'calc(100% / 7)',
                  position: 'relative',
                  zIndex: 1,
                  contain: 'layout',
                  isolation: 'isolate',
                  flexShrink: 0,
                  flexGrow: 0,
                  // Prevent any layout movement during animation
                  transform: 'translateZ(0)',
                  backfaceVisibility: 'hidden',
                  // Ensure absolute positioning stability
                  left: 0,
                  top: 0
                }}>
                  {row.map((cell, c) => (
                  <div
                    key={`${r}-${c}`}
                    data-tile={`${r}-${c}`}
                    onMouseDown={(e) => handleMouseDown(e, r, c)}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onTouchStart={(e) => handleTouchStart(e, r, c)}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                    style={{
                        width: 'calc((100% - 14px - 6px) / 7)',
                        height: 'calc((100% - 14px - 6px) / 7)',
                        margin: '1px',
                        boxSizing: 'border-box',
                        // Clean solid background for 3D blocks
                        backgroundColor: cell ? '#F5DEB3' : 'transparent',
                        // 3D block appearance with enhanced shadows
                        border: cell ? '1px solid #CD853F' : '1px solid transparent',
                        borderTop: cell ? '3px solid #F8F0E3' : '3px solid transparent', // Brighter light highlight on top
                        borderLeft: cell ? '3px solid #F8F0E3' : '3px solid transparent', // Brighter light highlight on left
                        borderRight: cell ? '3px solid #7A6B47' : '3px solid transparent', // Darker shadow on right
                        borderBottom: cell ? '3px solid #7A6B47' : '3px solid transparent', // Darker shadow on bottom
                        borderRadius: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 'clamp(16px, 4vw, 22px)',
                        fontWeight: 'bold',
                        color: '#654321',
                        textShadow: cell ? '0 2px 4px rgba(255, 255, 255, 0.9), 0 -1px 2px rgba(0, 0, 0, 0.3), 1px 1px 2px rgba(0, 0, 0, 0.1)' : 'none',
                        cursor: cell ? (isDragging ? 'grabbing' : 'grab') : 'default',
                        // Enhanced 3D shadow effect with deeper shading
                        boxShadow: cell ? `
                          0 8px 16px rgba(139, 69, 19, 0.4),
                          0 4px 8px rgba(0, 0, 0, 0.2),
                          inset 0 3px 6px rgba(255, 255, 255, 0.6),
                          inset 0 -3px 6px rgba(0, 0, 0, 0.2),
                          inset 3px 0 6px rgba(255, 255, 255, 0.3),
                          inset -3px 0 6px rgba(0, 0, 0, 0.15),
                          inset 0 0 0 1px rgba(255, 255, 255, 0.2)
                        ` : 'none',
                        // Prevent size changes during transforms
                        transformOrigin: 'center center',
                        minWidth: 'clamp(60px, 14vw, 80px)',
                        minHeight: 'clamp(60px, 14vw, 80px)',
                        maxWidth: 'clamp(60px, 14vw, 80px)',
                        maxHeight: 'clamp(60px, 14vw, 80px)',
                        // transition: 'all 0.1s ease', // Disabled to prevent ghosting
                      position: 'relative',
                      userSelect: 'none',
                      WebkitUserSelect: 'none',
                      WebkitTapHighlightColor: 'transparent',
                      touchAction: 'none',
                        // Make tiles appear as raised sections of the board
                        /* transform: cell ? 'translateZ(2px)' : 'none', */ // Disabled GPU acceleration to prevent ghosting
                        // Removed individual border properties - using consistent border above
                      // Highlight completed words in green
                        ...(cell && isLetterInCompletedWord(r, c) && {
                        backgroundColor: '#90EE90',
                        color: '#006400',
                          borderTop: '2px solid #228B22',
                          borderLeft: '2px solid #228B22',
                          borderRight: c < row.length - 1 ? '1px solid #228B22' : 'none',
                          borderBottom: r < board.length - 1 ? '1px solid #228B22' : 'none',
                          boxShadow: '0 6px 12px rgba(34,139,34,0.6), inset 0 1px 0 rgba(255, 255, 255, 0.5), inset 0 -1px 0 rgba(0, 0, 0, 0.3), 0 2px 4px rgba(0, 0, 0, 0.2)',
                          // animation: 'completedWordPulse 1.5s ease-in-out infinite', // Disabled to prevent ghosting
                          /* transform: 'translateZ(4px) perspective(100px) rotateX(3deg)' */ // Disabled GPU acceleration to prevent ghosting
                        }),
                        // Blink hint tiles for chosen word
                        ...(hintBlinkPositions && hintBlinkPositions.some(p => p.r === r && p.c === c) && {
                          backgroundColor: '#90EE90',
                          color: '#006400',
                          borderTop: '2px solid #228B22',
                          borderLeft: '2px solid #228B22',
                          borderRight: c < row.length - 1 ? '1px solid #228B22' : 'none',
                          borderBottom: r < board.length - 1 ? '1px solid #228B22' : 'none',
                          // animation: 'hintBlink 0.6s ease-in-out infinite' // Disabled to prevent ghosting
                        }),
                        // Highlight selected tile with enhanced 3D effects
                        ...(selectedTile && selectedTile.r === r && selectedTile.c === c && {
                          // transform: 'translateZ(6px) perspective(100px) rotateX(6deg) scale(1.1)', // Disabled GPU acceleration to prevent ghosting
                          zIndex: 10,
                          boxShadow: '0 0 25px rgba(255, 215, 0, 0.9), 0 8px 20px rgba(139, 69, 19, 0.7), inset 0 2px 0 rgba(255, 255, 255, 0.6), inset 0 -2px 0 rgba(0, 0, 0, 0.4), 0 4px 8px rgba(0, 0, 0, 0.3)',
                          transition: 'all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                          filter: 'brightness(1.15)'
                      }),
                      // Hide tile during animation if it's the moving tile
                      ...(animating && animation && animation.from.r === r && animation.from.c === c && {
                          opacity: 0,
                          visibility: 'hidden',
                          pointerEvents: 'none'
                        }),
                        
                      }}
                      onMouseEnter={(e) => {
                        if (cell) {
                          // e.target.style.transform = 'translate3d(0px, 0px, 4px) scale(1.05)' // Disabled GPU acceleration to prevent ghosting
                          e.target.style.boxShadow = '0 6px 12px rgba(139, 69, 19, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.4), inset 0 -1px 0 rgba(0, 0, 0, 0.3)'
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (cell) {
                          // e.target.style.transform = 'translate3d(0px, 0px, 2px) scale(1)' // Disabled GPU acceleration to prevent ghosting
                          e.target.style.boxShadow = '0 4px 8px rgba(139, 69, 19, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.3), inset 0 -1px 0 rgba(0, 0, 0, 0.2)'
                        }
                      }}
                    >
                      {cell ? cell.toUpperCase() : ''}
                  </div>
                ))}
              </div>
            ))}
          
              {/* Animation Overlay - Completely disabled to prevent ghosting */}
          {/* Animation overlay completely disabled to prevent ghosting */}
          {/* <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                    overflow: 'visible',
                    maxWidth: '100%',
                    maxHeight: '100%',
                pointerEvents: 'none',
                zIndex: 100
              }}
            >
              <div
                    data-animation-overlay
                style={{
                  position: 'absolute',
                      width: 'clamp(60px, 14vw, 80px)',
                      height: 'clamp(40px, 10vw, 55px)',
                  backgroundColor: '#F5DEB3',
                  border: '2px solid #8B4513',
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                      fontSize: 'clamp(16px, 4vw, 22px)',
                  fontWeight: 'bold',
                  color: '#654321',
                      boxShadow: '0 6px 12px rgba(139, 69, 19, 0.6), inset 0 2px 0 rgba(255, 255, 255, 0.4), inset 0 -2px 0 rgba(0, 0, 0, 0.3), 0 4px 8px rgba(0, 0, 0, 0.3)',
                      zIndex: 101,
                      pointerEvents: 'none',
                      left: 0,
                      top: 0,
                      transform: tileStep
                        ? `translate(${tileStep * animation.from.c}px, ${tileStep * animation.from.r}px)`
                        : `translate(${(41 + 1) * animation.from.c}px, ${(41 + 1) * animation.from.r}px)`,
                      transition: 'transform 0.22s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                      willChange: 'transform',
                      backdropFilter: 'none',
                      WebkitBackdropFilter: 'none'
                }}
              >
                {animation.letter.toUpperCase()}
              </div>
            </div>
          ) */}
            </div>
          </div>
          
          {/* Bottom action buttons: Next Level, New Game + Main Menu */}
          <div id="game-action-buttons" style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '12px',
            marginTop: '20px',
            marginBottom: '20px',
            flexWrap: 'wrap'
          }}>
            <button 
              onClick={goToNextLevel}
              disabled={currentLevel >= 20}
              style={{
                background: currentLevel < 20 
                  ? 'linear-gradient(135deg, #32CD32, #228B22)' 
                  : 'linear-gradient(135deg, #666, #888)',
                color: currentLevel < 20 ? '#F5DEB3' : '#CCC',
                padding: 'clamp(14px, 3.5vw, 18px) clamp(24px, 6vw, 36px)',
                borderRadius: '12px',
                fontSize: 'clamp(15px, 4.5vw, 17px)',
                fontWeight: 'bold',
                cursor: currentLevel < 20 ? 'pointer' : 'not-allowed',
                minHeight: '50px',
                minWidth: '140px',
                boxShadow: currentLevel < 20 
                  ? '0 8px 16px rgba(50, 205, 50, 0.4), inset 0 2px 0 rgba(255, 255, 255, 0.3), inset 0 -2px 0 rgba(0, 0, 0, 0.2)'
                  : '0 4px 8px rgba(0, 0, 0, 0.2)',
                transition: 'all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                touchAction: 'manipulation',
                textShadow: currentLevel < 20 ? '0 1px 2px rgba(0, 0, 0, 0.3)' : 'none'
              }}
              onMouseEnter={(e) => {
                if (currentLevel < 20) {
                  e.target.style.transform = 'translateY(-2px) scale(1.02)'
                  e.target.style.boxShadow = '0 12px 20px rgba(50, 205, 50, 0.6), inset 0 2px 0 rgba(255, 255, 255, 0.4), inset 0 -2px 0 rgba(0, 0, 0, 0.3)'
                }
              }}
              onMouseLeave={(e) => {
                if (currentLevel < 20) {
                  e.target.style.transform = 'translateY(0) scale(1)'
                  e.target.style.boxShadow = '0 8px 16px rgba(50, 205, 50, 0.4), inset 0 2px 0 rgba(255, 255, 255, 0.3), inset 0 -2px 0 rgba(0, 0, 0, 0.2)'
                }
              }}
            >
              {currentLevel < 20 ? '🚀 Next Level' : '🏆 Max Level'}
            </button>
            <button 
              onClick={resetToLevelOne}
              style={{
                background: 'linear-gradient(135deg, #F5DEB3, #DEB887)',
                color: '#654321',
                border: '3px solid #8B4513',
                padding: 'clamp(14px, 3.5vw, 18px) clamp(24px, 6vw, 36px)',
                borderRadius: '12px',
                fontSize: 'clamp(15px, 4.5vw, 17px)',
                fontWeight: 'bold',
                cursor: 'pointer',
                minHeight: '48px',
                minWidth: '140px',
                boxShadow: '0 8px 16px rgba(139, 69, 19, 0.4), inset 0 2px 0 rgba(255, 255, 255, 0.3), inset 0 -2px 0 rgba(0, 0, 0, 0.2)',
                transition: 'all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                touchAction: 'manipulation',
                textShadow: '0 1px 2px rgba(255, 255, 255, 0.5)',
                position: 'relative',
                overflow: 'hidden'
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'translateY(-3px) scale(1.02)'
                e.target.style.boxShadow = '0 12px 24px rgba(139, 69, 19, 0.6), inset 0 2px 0 rgba(255, 255, 255, 0.4), inset 0 -2px 0 rgba(0, 0, 0, 0.3)'
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0) scale(1)'
                e.target.style.boxShadow = '0 8px 16px rgba(139, 69, 19, 0.4), inset 0 2px 0 rgba(255, 255, 255, 0.3), inset 0 -2px 0 rgba(0, 0, 0, 0.2)'
              }}
            >
              New Game
            </button>
            <button 
              onClick={() => setCurrentView('menu')}
              style={{
                background: 'linear-gradient(135deg, #F5DEB3, #DEB887)',
                color: '#654321',
                border: '3px solid #8B4513',
                padding: 'clamp(14px, 3.5vw, 18px) clamp(24px, 6vw, 36px)',
                borderRadius: '12px',
                fontSize: 'clamp(15px, 4.5vw, 17px)',
                fontWeight: 'bold',
                cursor: 'pointer',
                minHeight: '48px',
                minWidth: '140px',
                boxShadow: '0 8px 16px rgba(139, 69, 19, 0.4), inset 0 2px 0 rgba(255, 255, 255, 0.3), inset 0 -2px 0 rgba(0, 0, 0, 0.2)',
                transition: 'all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                touchAction: 'manipulation',
                textShadow: '0 1px 2px rgba(255, 255, 255, 0.5)',
                position: 'relative',
                overflow: 'hidden'
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'translateY(-3px) scale(1.02)'
                e.target.style.boxShadow = '0 12px 24px rgba(139, 69, 19, 0.6), inset 0 2px 0 rgba(255, 255, 255, 0.4), inset 0 -2px 0 rgba(0, 0, 0, 0.3)'
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0) scale(1)'
                e.target.style.boxShadow = '0 8px 16px rgba(139, 69, 19, 0.4), inset 0 2px 0 rgba(255, 255, 255, 0.3), inset 0 -2px 0 rgba(0, 0, 0, 0.2)'
              }}
            >
              🏠 Main Menu
            </button>
            {showInstallButton && (
              <button 
                onClick={handleInstallClick}
                style={{
                  background: 'linear-gradient(135deg, #4CAF50, #45a049)',
                  color: 'white',
                  border: '3px solid #4CAF50',
                  padding: 'clamp(14px, 3.5vw, 18px) clamp(24px, 6vw, 36px)',
                  borderRadius: '12px',
                  fontSize: 'clamp(15px, 4.5vw, 17px)',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  minHeight: '48px',
                  minWidth: '100px',
                  boxShadow: '0 8px 16px rgba(76, 175, 80, 0.4), inset 0 2px 0 rgba(255, 255, 255, 0.3), inset 0 -2px 0 rgba(0, 0, 0, 0.2)',
                  transition: 'all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                  touchAction: 'manipulation',
                  textShadow: '0 1px 2px rgba(255, 255, 255, 0.5)',
                  position: 'relative',
                  overflow: 'hidden'
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = 'translateY(-3px) scale(1.02)'
                  e.target.style.boxShadow = '0 12px 24px rgba(76, 175, 80, 0.6), inset 0 2px 0 rgba(255, 255, 255, 0.4), inset 0 -2px 0 rgba(0, 0, 0, 0.3)'
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'translateY(0) scale(1)'
                  e.target.style.boxShadow = '0 8px 16px rgba(76, 175, 80, 0.4), inset 0 2px 0 rgba(255, 255, 255, 0.3), inset 0 -2px 0 rgba(0, 0, 0, 0.2)'
                }}
              >
                📱 Install
              </button>
            )}
          </div>
          
          {/* Fireworks Animation */}
          {showFireworks && (
            <div id="fireworks-overlay" style={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: '100vw',
              height: '100vh',
              pointerEvents: 'none',
              zIndex: 1000,
              overflow: 'hidden'
            }}>
              {fireworks.map((firework) => (
                <div key={firework.id}>
                  {/* Rocket already in motion from below screen */}
                  <div
                    style={{
                      position: 'absolute',
                      left: `${firework.launchX}%`,
                      top: '100%', // Start from below screen
                      width: '8px',
                      height: '20px',
                      backgroundColor: firework.color,
                      borderRadius: '4px',
                      animation: `rocketLaunchFromBelow 2s ease-out ${firework.delay}ms forwards`,
                      boxShadow: `0 0 20px ${firework.color}, 0 0 40px ${firework.color}`,
                      transformOrigin: 'bottom center',
                      background: `linear-gradient(to top, ${firework.color}, ${firework.color}80)`
                    }}
                  />
                  
                  {/* Rocket trail already in motion */}
                  <div
                    style={{
                      position: 'absolute',
                      left: `${firework.launchX}%`,
                      top: '100%',
                      width: '4px',
                      height: '40px',
                      background: `linear-gradient(to top, ${firework.color}60, transparent)`,
                      borderRadius: '2px',
                      animation: `rocketTrailFromBelow 2s ease-out ${firework.delay}ms forwards`,
                      transformOrigin: 'bottom center'
                    }}
                  />
                  
                  {/* Explosion at peak */}
                  <div
                    style={{
                      position: 'absolute',
                      left: `${firework.explodeX}%`,
                      top: `${firework.explodeY}%`,
                      width: '12px',
                      height: '12px',
                      backgroundColor: firework.color,
                      borderRadius: '50%',
                      animation: `explosionCenter 2s ease-out ${firework.delay + 1200}ms forwards`,
                      boxShadow: `0 0 50px ${firework.color}, 0 0 80px ${firework.color}`,
                      opacity: 0
                    }}
                  />
                  
                  {/* Explosion sparks - EXTRAVAGANT PARTICLE COUNT */}
                  {Array.from({length: firework.particleCount || 30}, (_, sparkIndex) => {
                    const totalParticles = firework.particleCount || 30
                    const angle = (sparkIndex * (360 / totalParticles)) * (Math.PI / 180) + Math.random() * 0.4 // Full circle coverage with more randomness
                    const distance = (20 + Math.random() * 160) * (firework.size || 1) // Even larger explosion radius
                    const sparkSize = (0.3 + Math.random() * 5) * (firework.size || 1) // Huge variety from tiny to large
                    return (
                      <div
                        key={`${firework.id}-spark-${sparkIndex}`}
                        style={{
                          position: 'absolute',
                          left: `${firework.explodeX}%`,
                          top: `${firework.explodeY}%`,
                          width: `${sparkSize}px`,
                          height: `${sparkSize}px`,
                          backgroundColor: firework.color,
                          borderRadius: sparkIndex % 6 === 0 ? '0%' : sparkIndex % 6 === 1 ? '50%' : sparkIndex % 6 === 2 ? '20%' : sparkIndex % 6 === 3 ? '80%' : sparkIndex % 6 === 4 ? '5px' : '2px', // More particle shape variety
                          animation: `explosionSpark${sparkIndex % 5} ${2.5 + Math.random() * 3}s ease-out ${firework.delay + 1200 + sparkIndex * 8}ms forwards`,
                          transform: `translate(${Math.cos(angle) * distance}px, ${Math.sin(angle) * distance}px) rotate(${sparkIndex * 72}deg)`,
                          boxShadow: `
                            0 0 ${15 + Math.random() * 25}px ${firework.color}, 
                            0 0 ${8 + Math.random() * 15}px ${firework.color},
                            0 0 ${4 + Math.random() * 10}px white,
                            0 0 ${2 + Math.random() * 6}px rgba(255,255,255,0.8)
                          `,
                          opacity: 0,
                          filter: `brightness(${1.6 + Math.random() * 1.0}) saturate(${1.4 + Math.random() * 0.8}) contrast(${1.1 + Math.random() * 0.3})`, // Even more vibrant
                          background: sparkIndex % 4 === 0 ? `radial-gradient(circle, ${firework.color}, transparent)` : 
                                     sparkIndex % 4 === 1 ? `linear-gradient(45deg, ${firework.color}, transparent)` :
                                     sparkIndex % 4 === 2 ? `conic-gradient(from 0deg, ${firework.color}, transparent, ${firework.color})` :
                                     firework.color // Multiple gradient types
                        }}
                      />
                    )
                  })}
                </div>
              ))}
              <style>
                {`
                  @keyframes rocketLaunchFromBelow {
                    0% {
                      transform: translateY(0) scale(1);
                      opacity: 1;
                    }
                    20% {
                      transform: translateY(-20vh) scale(1.1);
                      opacity: 1;
                    }
                    80% {
                      transform: translateY(-80vh) scale(0.8);
                      opacity: 0.9;
                    }
                    100% {
                      transform: translateY(-80vh) scale(0);
                      opacity: 0;
                    }
                  }
                  
                  @keyframes rocketTrailFromBelow {
                    0% {
                      transform: translateY(0) scaleY(1);
                      opacity: 0.8;
                    }
                    20% {
                      transform: translateY(-20vh) scaleY(1.2);
                      opacity: 0.9;
                    }
                    80% {
                      transform: translateY(-80vh) scaleY(0.3);
                      opacity: 0.6;
                    }
                    100% {
                      transform: translateY(-80vh) scaleY(0);
                      opacity: 0;
                    }
                  }
                  
                  @keyframes explosionCenter {
                    0% {
                      transform: scale(0);
                      opacity: 0;
                    }
                    5% {
                      transform: scale(1);
                      opacity: 1;
                    }
                    15% {
                      transform: scale(2);
                      opacity: 1;
                    }
                    100% {
                      transform: scale(4);
                      opacity: 0;
                    }
                  }
                  
                  @keyframes explosionSpark0 {
                    0% {
                      transform: translate(0, 0) scale(1) rotate(0deg);
                      opacity: 0;
                    }
                    5% {
                      opacity: 1;
                      transform: translate(0, 0) scale(1.2) rotate(45deg);
                    }
                    20% {
                      opacity: 1;
                      transform: translate(0, 5px) scale(1) rotate(90deg);
                    }
                    60% {
                      opacity: 0.6;
                      transform: translate(0, 40px) scale(0.6) rotate(180deg);
                    }
                    100% {
                      transform: translate(0, 80px) scale(0.1) rotate(360deg);
                      opacity: 0;
                    }
                  }
                  
                  @keyframes explosionSpark1 {
                    0% {
                      transform: translate(0, 0) scale(1);
                      opacity: 0;
                    }
                    8% {
                      opacity: 1;
                      transform: translate(0, 0) scale(1.3);
                    }
                    25% {
                      opacity: 1;
                      transform: translate(0, 8px) scale(1.1);
                    }
                    70% {
                      opacity: 0.4;
                      transform: translate(0, 50px) scale(0.4);
                    }
                    100% {
                      transform: translate(0, 100px) scale(0);
                      opacity: 0;
                    }
                  }
                  
                  @keyframes explosionSpark2 {
                    0% {
                      transform: translate(0, 0) scale(1) rotate(0deg);
                      opacity: 0;
                    }
                    3% {
                      opacity: 1;
                      transform: translate(0, 0) scale(1.4) rotate(30deg);
                    }
                    15% {
                      opacity: 1;
                      transform: translate(0, 3px) scale(1.2) rotate(60deg);
                    }
                    50% {
                      opacity: 0.7;
                      transform: translate(0, 25px) scale(0.8) rotate(120deg);
                    }
                    100% {
                      transform: translate(0, 60px) scale(0.2) rotate(180deg);
                      opacity: 0;
                    }
                  }
                  
                  @keyframes explosionSpark3 {
                    0% {
                      transform: translate(0, 0) scale(1) rotate(0deg);
                      opacity: 0;
                    }
                    2% {
                      opacity: 1;
                      transform: translate(0, 0) scale(1.6) rotate(45deg);
                    }
                    12% {
                      opacity: 1;
                      transform: translate(0, 2px) scale(1.3) rotate(90deg);
                    }
                    40% {
                      opacity: 0.8;
                      transform: translate(0, 20px) scale(1) rotate(180deg);
                    }
                    80% {
                      opacity: 0.3;
                      transform: translate(0, 70px) scale(0.5) rotate(270deg);
                    }
                    100% {
                      transform: translate(0, 120px) scale(0.1) rotate(360deg);
                      opacity: 0;
                    }
                  }
                  
                  @keyframes explosionSpark4 {
                    0% {
                      transform: translate(0, 0) scale(1) rotate(0deg);
                      opacity: 0;
                    }
                    1% {
                      opacity: 1;
                      transform: translate(0, 0) scale(1.8) rotate(60deg);
                    }
                    8% {
                      opacity: 1;
                      transform: translate(0, 1px) scale(1.5) rotate(120deg);
                    }
                    25% {
                      opacity: 0.9;
                      transform: translate(0, 15px) scale(1.2) rotate(200deg);
                    }
                    60% {
                      opacity: 0.5;
                      transform: translate(0, 50px) scale(0.8) rotate(300deg);
                    }
                    90% {
                      opacity: 0.2;
                      transform: translate(0, 90px) scale(0.3) rotate(420deg);
                    }
                    100% {
                      transform: translate(0, 140px) scale(0.05) rotate(480deg);
                      opacity: 0;
                    }
                  }
                `}
              </style>
            </div>
          )}
          
          {/* Level Complete Modal */}
          {showLevelCompleteModal && (
            <div id="level-complete-modal" style={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: '100vw',
              height: '100vh',
              backgroundColor: 'rgba(0, 0, 0, 0.8)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1001
            }}>
              <div style={{
                background: 'linear-gradient(135deg, #F5DEB3 0%, #DEB887 100%)',
                border: '3px solid #8B4513',
                borderRadius: '12px',
                padding: '24px',
                textAlign: 'center',
                boxShadow: '0 20px 40px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.3)',
                maxWidth: '80vw',
                minWidth: '280px'
              }}>
                <h1 style={{
                  color: '#654321',
                  fontSize: 'clamp(20px, 5vw, 24px)',
                  margin: '0 0 12px 0',
                  textShadow: '2px 2px 4px rgba(0,0,0,0.3)'
                }}>
                  Level {currentLevel} Complete!
                </h1>
                <p style={{
                  color: '#654321',
                  fontSize: 'clamp(14px, 3.5vw, 16px)',
                  margin: '0 0 20px 0'
                }}>
                  Completed in {moveCount} moves!
                </p>
                <button
                  onClick={handleNextLevel}
                  style={{
                    background: 'linear-gradient(135deg, #FFD700, #FFA500)',
                    color: '#2F1B14',
                    border: '3px solid #B8860B',
                    padding: '10px 20px',
                    borderRadius: '8px',
                    fontSize: 'clamp(14px, 3.5vw, 16px)',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    minHeight: '40px',
                    minWidth: '120px',
                    boxShadow: '0 8px 16px rgba(255, 215, 0, 0.4), inset 0 2px 0 rgba(255, 255, 255, 0.3)',
                    transition: 'all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                    textShadow: '0 1px 2px rgba(255, 255, 255, 0.5)'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.transform = 'translateY(-2px) scale(1.05)'
                    e.target.style.boxShadow = '0 12px 24px rgba(255, 215, 0, 0.6), inset 0 2px 0 rgba(255, 255, 255, 0.4)'
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = 'translateY(0) scale(1)'
                    e.target.style.boxShadow = '0 8px 16px rgba(255, 215, 0, 0.4), inset 0 2px 0 rgba(255, 255, 255, 0.3)'
                  }}
                >
                  {currentLevel < 20 ? '🚀 Next Level' : '🏆 Finish Game'}
                </button>
              </div>
            </div>
          )}

          {/* Auth Modal */}
          <AuthModal 
            isOpen={showAuthModal} 
            onClose={() => {
              // AuthModal onClose called from original game view
              setShowAuthModal(false)
            }}
            initialMode="login"
          />
        </div>
      )}

      {currentView === 'tetris' && (
        <div id="tetris-game-view" style={{
          maxHeight: '100vh',
          overflow: 'auto',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          backgroundColor: '#2F1B14',
          backgroundImage: `
            repeating-linear-gradient(
              0deg,
              transparent,
              transparent 60px,
              #3D2318 60px,
              #3D2318 65px
            ),
            repeating-linear-gradient(
              90deg,
              transparent,
              transparent 3px,
              rgba(47, 27, 20, 0.9) 3px,
              rgba(47, 27, 20, 0.9) 6px
            ),
            repeating-linear-gradient(
              0deg,
              transparent,
              transparent 6px,
              rgba(61, 35, 24, 0.5) 6px,
              rgba(61, 35, 24, 0.5) 12px
            ),
            repeating-linear-gradient(
              0deg,
              transparent,
              transparent 60px,
              rgba(255, 255, 255, 0.03) 60px,
              rgba(255, 255, 255, 0.03) 65px
            )
          `,
          minHeight: '100vh',
          padding: '20px'
        }}>
          {/* Game Header */}
          <div style={{
            textAlign: 'center',
            marginBottom: '20px',
            color: '#F5DEB3'
          }}>
            <h1 style={{
              fontSize: 'clamp(24px, 6vw, 32px)',
              margin: '0 0 10px 0',
              color: '#F5DEB3',
              textShadow: '2px 2px 4px rgba(0, 0, 0, 0.5)'
            }}>
              WordSlide - Tetris Style
            </h1>
            
          <div style={{
            display: 'flex',
              justifyContent: 'center',
              gap: '15px',
            flexWrap: 'wrap',
              marginBottom: '20px'
            }}>
          <div style={{
                backgroundColor: 'rgba(139, 69, 19, 0.3)',
                padding: '10px 15px',
                borderRadius: '8px',
                border: '1px solid #8B4513'
              }}>
                <strong>Words Solved:</strong> {tetrisScore}
                    </div>
              <div style={{
                backgroundColor: 'rgba(139, 69, 19, 0.3)',
                padding: '10px 15px',
                borderRadius: '8px',
                border: '1px solid #8B4513'
              }}>
                <strong>Target Word:</strong> {tetrisBoard.length > 0 ? 'Form 3+ Letter Words' : 'Loading...'}
                </div>
              <div style={{
                backgroundColor: 'rgba(139, 69, 19, 0.3)',
                padding: '10px 15px',
                borderRadius: '8px',
                border: '1px solid #8B4513'
              }}>
                <strong>Moves:</strong> {tetrisLevel}
              </div>
          </div>
          
            {/* Game Controls */}
          <div style={{
            display: 'flex',
              justifyContent: 'center',
              gap: '10px',
            flexWrap: 'wrap',
              marginBottom: '20px'
          }}>
            <button
              onClick={pauseTetrisGame}
              style={{
                  background: 'linear-gradient(135deg, #F5DEB3, #DEB887)',
                  color: '#654321',
                  border: '3px solid #8B4513',
                  padding: 'clamp(8px, 2.5vw, 12px) clamp(16px, 4vw, 20px)',
                  borderRadius: '10px',
                  fontSize: 'clamp(13px, 3.5vw, 15px)',
                fontWeight: 'bold',
                cursor: 'pointer',
                  minHeight: '36px',
                  minWidth: '100px',
                  boxShadow: '0 4px 12px rgba(139, 69, 19, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.3)',
                transition: 'all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                touchAction: 'manipulation',
                textShadow: '0 1px 2px rgba(255, 255, 255, 0.3)',
                position: 'relative',
                overflow: 'hidden'
              }}
              onMouseEnter={(e) => {
                  e.target.style.transform = 'translateY(-1px) scale(1.02)'
                  e.target.style.boxShadow = '0 6px 16px rgba(139, 69, 19, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.4)'
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0) scale(1)'
                  e.target.style.boxShadow = '0 4px 12px rgba(139, 69, 19, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.3)'
              }}
            >
              {tetrisPaused ? '▶️ Resume' : '⏸️ Pause'}
            </button>
            
            <button
              onClick={resetTetrisGame}
              style={{
                  background: 'linear-gradient(135deg, #F5DEB3, #DEB887)',
                  color: '#654321',
                  border: '3px solid #8B4513',
                  padding: 'clamp(8px, 2.5vw, 12px) clamp(16px, 4vw, 20px)',
                  borderRadius: '10px',
                  fontSize: 'clamp(13px, 3.5vw, 15px)',
                fontWeight: 'bold',
                cursor: 'pointer',
                  minHeight: '36px',
                  minWidth: '100px',
                  boxShadow: '0 4px 12px rgba(139, 69, 19, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.3)',
                transition: 'all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                touchAction: 'manipulation',
                textShadow: '0 1px 2px rgba(255, 255, 255, 0.3)',
                position: 'relative',
                overflow: 'hidden'
              }}
              onMouseEnter={(e) => {
                  e.target.style.transform = 'translateY(-1px) scale(1.02)'
                  e.target.style.boxShadow = '0 6px 16px rgba(139, 69, 19, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.4)'
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0) scale(1)'
                  e.target.style.boxShadow = '0 4px 12px rgba(139, 69, 19, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.3)'
              }}
            >
              🔄 Reset
            </button>
            
            <button
                onClick={() => setShowRules(true)}
              style={{
                  background: 'linear-gradient(135deg, #F5DEB3, #DEB887)',
                  color: '#654321',
                  border: '3px solid #8B4513',
                  padding: 'clamp(8px, 2.5vw, 12px) clamp(16px, 4vw, 20px)',
                  borderRadius: '10px',
                  fontSize: 'clamp(13px, 3.5vw, 15px)',
                fontWeight: 'bold',
                cursor: 'pointer',
                  minHeight: '36px',
                  minWidth: '100px',
                  boxShadow: '0 4px 12px rgba(139, 69, 19, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.3)',
                transition: 'all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                touchAction: 'manipulation',
                  textShadow: '0 1px 2px rgba(255, 255, 255, 0.3)',
                position: 'relative',
                overflow: 'hidden'
              }}
              onMouseEnter={(e) => {
                  e.target.style.transform = 'translateY(-1px) scale(1.02)'
                  e.target.style.boxShadow = '0 6px 16px rgba(139, 69, 19, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.4)'
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0) scale(1)'
                  e.target.style.boxShadow = '0 4px 12px rgba(139, 69, 19, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.3)'
              }}
            >
                ❓ How to Play
            </button>

            <button
              onClick={() => setShowLeaderboard(true)}
              style={{
                background: 'linear-gradient(135deg, #F5DEB3, #DEB887)',
                color: '#654321',
                border: '3px solid #8B4513',
                padding: 'clamp(8px, 2.5vw, 12px) clamp(16px, 4vw, 20px)',
                borderRadius: '10px',
                fontSize: 'clamp(13px, 3.5vw, 15px)',
                fontWeight: 'bold',
                cursor: 'pointer',
                minHeight: '36px',
                minWidth: '100px',
                boxShadow: '0 4px 12px rgba(139, 69, 19, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.3)',
                transition: 'all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                touchAction: 'manipulation',
                textShadow: '0 1px 2px rgba(255, 255, 255, 0.3)',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              🏆 Leaderboard
            </button>
              
              
          </div>
          
          {/* Leaderboard Modal for Tetris Mode */}
          <LeaderboardModal
            isOpen={showLeaderboard}
            onClose={() => setShowLeaderboard(false)}
            gameMode="tetris"
          />
        </div>
          
          {/* Tetris Board - Same layout as original game */}
        <div style={{
            maxWidth: '95vw',
            maxHeight: '70vh',
            overflow: 'visible',
          display: 'flex',
            flexDirection: 'column',
          alignItems: 'center',
            position: 'relative',
            isolation: 'isolate',
            contain: 'layout'
          }}>
            {/* Board Container - Connected Surface */}
            <div 
              id="tetris-board-container"
              style={{
                width: 'min(90vw, 400px)',
                aspectRatio: '1',
                overflow: 'visible',
                backgroundColor: '#654321', // Dark brown like wood paneling
                padding: '0px', // No padding - blocks align perfectly with board edges
                borderRadius: '12px',
                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4), inset 0 2px 0 rgba(255, 255, 255, 0.1)',
                border: '2px solid #8B4513',
                position: 'relative', // For animation overlay positioning
                // Ensure board stability during animation
                transform: 'translateZ(0)',
                backfaceVisibility: 'hidden',
                contain: 'layout',
                isolation: 'isolate'
              }}
              onTouchStart={(e) => {
                const touch = e.touches[0]
                const rect = e.currentTarget.getBoundingClientRect()
                const touchX = touch.clientX - rect.left
                const centerX = rect.width / 2
                
                if (touchX < centerX) {
                  moveBlockLeft()
                } else {
                  moveBlockRight()
                }
              }}
            >
              {/* Board Rows - 7x8 grid like original game */}
              {tetrisBoard.map((row, r) => (
                <div key={r} style={{
                  display: 'flex',
                  justifyContent: 'center',
                  width: '100%',
                  height: 'calc(100% / 7)',
                  position: 'relative',
                  zIndex: 1,
                  contain: 'layout',
                  isolation: 'isolate',
                  flexShrink: 0,
                  flexGrow: 0,
                  // Prevent any layout movement during animation
                  transform: 'translateZ(0)',
                  backfaceVisibility: 'hidden',
                  // Ensure absolute positioning stability
                  left: 0,
                  top: 0
                }}>
                  {row.map((cell, c) => (
                    <div
                      key={`${r}-${c}`}
                      style={{
                        width: 'calc((100% - 14px - 6px) / 7)',
                        height: 'calc((100% - 14px - 6px) / 7)',
                        margin: '1px', // Reduced gap between tiles
                        marginLeft: c === 0 ? '0px' : '1px', // First tile touches left edge
                        marginRight: c === row.length - 1 ? '0px' : '1px', // Last tile touches right edge
                        marginTop: r === 0 ? '0px' : '1px', // First row touches top edge
                        marginBottom: r === tetrisBoard.length - 1 ? '0px' : '1px', // Last row touches bottom edge
                        backgroundColor: cell ? '#F5DEB3' : 'rgba(139, 69, 19, 0.3)', // Show empty cells
                        border: 'none', // Remove conflicting shorthand border
                        borderRadius: cell ? '6px' : '4px', // Smaller radius for connected appearance
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 'clamp(16px, 4vw, 22px)',
                        fontWeight: 'bold',
                        color: cell ? '#654321' : 'rgba(139, 69, 19, 0.5)',
                        cursor: 'default',
                        boxShadow: cell ? '0 4px 8px rgba(139, 69, 19, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.3), inset 0 -1px 0 rgba(0, 0, 0, 0.2)' : '0 2px 4px rgba(0, 0, 0, 0.2)',
                        transition: 'all 0.1s ease',
                        position: 'relative',
                        userSelect: 'none',
                        WebkitUserSelect: 'none',
                        WebkitTapHighlightColor: 'transparent',
                        // Make tiles appear as raised sections of the board
                        /* transform: cell ? 'translateZ(2px)' : 'none', */ // Disabled GPU acceleration to prevent ghosting
                        // Connected surface effect - use specific border properties
                        borderRight: c < row.length - 1 ? '1px solid #654321' : 'none',
                        borderBottom: r < tetrisBoard.length - 1 ? '1px solid #654321' : 'none',
                        // Add top and left borders for complete tile definition
                        borderTop: cell ? '2px solid #8B4513' : '1px solid #654321',
                        borderLeft: cell ? '2px solid #8B4513' : '1px solid #654321'
                      }}
                    >
                      {cell ? cell.letter : ''}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
          
          {/* Game Instructions */}
          <div style={{
              textAlign: 'center',
            marginTop: '20px',
            padding: '15px',
            backgroundColor: 'rgba(139, 69, 19, 0.2)',
            borderRadius: '8px',
            border: '1px solid #8B4513',
            maxWidth: '90vw'
          }}>
            <p style={{
              margin: '0',
              fontSize: 'clamp(12px, 3vw, 14px)',
              color: '#F5DEB3'
            }}>
              🎮 <strong>Controls:</strong> Use A/D keys or Arrow keys to slide falling blocks left/right. 
              Touch left/right side of board on mobile. Spacebar to pause.
            </p>
            <p style={{
              margin: '8px 0 0 0',
              fontSize: 'clamp(12px, 3vw, 14px)',
              color: '#F5DEB3'
            }}>
              🎯 <strong>Goal:</strong> Slide blocks into position to form 3+ letter words horizontally. Words automatically disappear when completed!
            </p>
            <p style={{
              margin: '8px 0 0 0',
              fontSize: 'clamp(12px, 3vw, 14px)',
              color: '#F5DEB3'
            }}>
              📱 <strong>How to Play:</strong> Letter blocks fall from the top. Slide them left/right to land in the right cells and form words!
            </p>
            </div>
            
          {/* Main Menu Button - Styled like original game */}
          <div style={{
            textAlign: 'center',
            marginTop: '20px',
            marginBottom: '20px'
          }}>
            <button 
              onClick={() => setCurrentView('menu')}
              style={{
                background: 'linear-gradient(135deg, #F5DEB3, #DEB887)',
                color: '#654321',
                border: '3px solid #8B4513',
                padding: 'clamp(14px, 3.5vw, 18px) clamp(24px, 6vw, 36px)',
                borderRadius: '12px',
                fontSize: 'clamp(15px, 4.5vw, 17px)',
                fontWeight: 'bold',
                cursor: 'pointer',
                minHeight: '48px',
                minWidth: '140px',
                boxShadow: '0 8px 16px rgba(139, 69, 19, 0.4), inset 0 2px 0 rgba(255, 255, 255, 0.3), inset 0 -2px 0 rgba(0, 0, 0, 0.2)',
                transition: 'all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                touchAction: 'manipulation',
                textShadow: '0 1px 2px rgba(255, 255, 255, 0.5)',
                position: 'relative',
                overflow: 'hidden'
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'translateY(-3px) scale(1.02)'
                e.target.style.boxShadow = '0 12px 24px rgba(139, 69, 19, 0.6), inset 0 2px 0 rgba(255, 255, 255, 0.4), inset 0 -2px 0 rgba(0, 0, 0, 0.3)'
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0) scale(1)'
                e.target.style.boxShadow = '0 8px 16px rgba(139, 69, 19, 0.4), inset 0 2px 0 rgba(255, 255, 255, 0.3), inset 0 -2px 0 rgba(0, 0, 0, 0.2)'
              }}
            >
              🏠 Main Menu
            </button>
          </div>
          
          {/* Falling Block */}
          {fallingBlocks.length > 0 && !tetrisPaused && !tetrisGameOver && (
            <div style={{
              position: 'absolute',
              top: '8px', // Match board padding
              left: '8px', // Match board padding
              width: '100%',
              height: '100%',
              overflow: 'visible',
              maxWidth: '100%',
              maxHeight: '100%',
              pointerEvents: 'none',
              zIndex: 200
            }}>
              {fallingBlocks.map((block, index) => (
                <div
                  key={index}
                  style={{
                    position: 'absolute',
                    width: 'clamp(40px, 10vw, 55px)',
                    height: 'clamp(40px, 10vw, 55px)',
                    backgroundColor: '#F5DEB3',
                    border: '2px solid #8B4513',
                    borderRadius: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 'clamp(16px, 4vw, 22px)',
                    fontWeight: 'bold',
                    color: '#654321',
                    boxShadow: '0 6px 12px rgba(139, 69, 19, 0.6), inset 0 2px 0 rgba(255, 255, 255, 0.4), inset 0 -2px 0 rgba(0, 0, 0, 0.3), 0 4px 8px rgba(0, 0, 0, 0.3)',
                    zIndex: 201,
                    pointerEvents: 'none',
                    // Position relative to the board cells for proper cell-to-cell movement
                    left: `${(41 + 1) * block.x}px`,
                    top: `${(41 + 1) * block.y}px`,
                    transform: 'perspective(100px) rotateX(2deg) translateZ(6px)',
                    transition: 'none'
                  }}
                >
                  {block.letter}
                </div>
              ))}
        </div>
      )}
          
          {/* Game Over Message */}
          {tetrisGameOver && (
            <div id="tetris-game-over-modal" style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              backgroundColor: 'rgba(139, 69, 19, 0.95)',
              padding: 'clamp(20px, 5vw, 30px)',
              borderRadius: '15px',
              border: '3px solid #8B4513',
              textAlign: 'center',
              zIndex: 1000,
              maxWidth: '90vw',
              maxHeight: '80vh',
              overflow: 'auto',
              boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)'
            }}>
              <h2 style={{ color: '#F5DEB3', margin: '0 0 20px 0' }}>Game Over!</h2>
              <p style={{ color: '#F5DEB3', margin: '0 0 20px 0' }}>
                Final Score: {tetrisScore} words
              </p>
              <button
                onClick={resetTetrisGame}
                style={{
                  background: 'linear-gradient(135deg, #F5DEB3, #DEB887)',
                  color: '#654321',
                  border: '3px solid #8B4513',
                  padding: '12px 24px',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  marginRight: '10px'
                }}
              >
                Play Again
              </button>
              <button
                onClick={() => setCurrentView('menu')}
                style={{
                  background: 'linear-gradient(135deg, #F5DEB3, #DEB887)',
                  color: '#654321',
                  border: '3px solid #8B4513',
                  padding: '12px 24px',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}
              >
                Main Menu
              </button>
            </div>
          )}
        </div>
      )}

      
    </div>
  )
}

export default App

// Wrap App with AuthProvider for components that need authentication
function AppWithAuth() {
  return (
  <AuthProvider>
    <App />
  </AuthProvider>
)
}

export { AppWithAuth }