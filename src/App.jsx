import React, { useState, useEffect, useLayoutEffect, useCallback, useRef } from 'react'
import LeaderboardModal from './components/LeaderboardModal'
import UserProfile from './components/UserProfile'
import AuthModal from './components/AuthModal'
import GameCompletionModal from './components/GameCompletionModal'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { 
  calculateCompletionStats, 
  createCompletionRecord,
  createFreshStats
} from './utils/completionTracking'
// import { 
//   mobileFeatures, 
//   TouchOptimizer, 
//   performanceUtils, 
//   hapticUtils, 
//   responsiveUtils, 
//   memoryUtils, 
//   compatibilityUtils 
// } from './utils/mobileOptimizations'
// import { 
//   performanceMonitor, 
//   webVitalsMonitor, 
//   networkMonitor 
// } from './utils/performanceMonitor'
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
  const [completedWords, setCompletedWords] = useState(new Set()) // Now stores word positions like "CAT-0-0-horizontal"
  const [hintCount, setHintCount] = useState(3)
  const [levelTransitioning, setLevelTransitioning] = useState(false)
  const [showFireworks, setShowFireworks] = useState(false)
  const [showLevelCompleteModal, setShowLevelCompleteModal] = useState(false)
  const [showGameCompleteModal, setShowGameCompleteModal] = useState(false)
  const [showStartOverModal, setShowStartOverModal] = useState(false)
  const [showResetSuccessModal, setShowResetSuccessModal] = useState(false)
  const [fireworks, setFireworks] = useState([])
  const [showRules, setShowRules] = useState(false)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [showLeaderboard, setShowLeaderboard] = useState(false)
  const [isSavingCompletion, setIsSavingCompletion] = useState(false)
  
  // Track stats for each level (for completion tracking)
  const [levelHistory, setLevelHistory] = useState([])
  
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

  // Mobile optimization state
  // const [mobileState, setMobileState] = useState({
  //   isMobile: mobileFeatures.isMobile(),
  //   hasTouch: mobileFeatures.hasTouch(),
  //   hasHaptics: mobileFeatures.hasHaptics(),
  //   pixelRatio: mobileFeatures.getPixelRatio(),
  //   isLandscape: mobileFeatures.isLandscape(),
  //   safeAreaInsets: mobileFeatures.getSafeAreaInsets()
  // })
  
  // Mobile optimization refs and instances
  // const touchOptimizerRef = useRef(new TouchOptimizer())
  // const cleanupManagerRef = useRef(memoryUtils.createCleanupManager())
  // const tileSizeRef = useRef(0)
  // const gapSizeRef = useRef(0)
  
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
    
    console.log('🎯 Updating database stats:', { level, moves, wordsCompleted, user, token })
    console.log('🎯 NODE_ENV:', process.env.NODE_ENV)
    console.log('🎯 API_BASE will be:', process.env.NODE_ENV === 'development' ? '/api' : 'https://63jgwqvqyf.execute-api.us-east-1.amazonaws.com/dev')
    
    try {
      // Use proxy when running on localhost to avoid CORS issues
      const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
      const API_BASE = isLocalhost 
        ? '/api'
        : 'https://63jgwqvqyf.execute-api.us-east-1.amazonaws.com/dev'
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
        console.error('❌ Failed to update database:', response.statusText, response.status)
        console.error('❌ This might be a CORS issue - check server configuration')
        const errorText = await response.text()
        console.error('❌ Error response:', errorText)
      } else {
        const result = await response.json()
        console.log('✅ Database update successful:', result)
      }
    } catch (error) {
      console.error('❌ Error updating database:', error)
      console.error('❌ Error details:', error.message, error.stack)
    }
  }, [user, token])

  // Reset user stats in database using the dedicated reset endpoint
  const resetUserStats = useCallback(async () => {
    if (!user || !token) {
      console.log('No user or token, skipping stats reset')
      return true // Return true since local reset will still work
    }
    
    console.log('Resetting user stats using dedicated reset endpoint')
    
    try {
      // Use proxy when running on localhost to avoid CORS issues
      const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
      const API_BASE = isLocalhost 
        ? '/api'
        : 'https://63jgwqvqyf.execute-api.us-east-1.amazonaws.com/dev'
      
      // Use the new reset endpoint that directly sets values to 0
      const resetResponse = await fetch(`${API_BASE}/user/reset-stats`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: user.id,
          gameMode: 'original'
        })
      })
      
      if (resetResponse.ok) {
        const result = await resetResponse.json()
        console.log('Database stats reset successful:', result)
        return true
      } else {
        console.error('Failed to reset database stats:', resetResponse.statusText, resetResponse.status)
        return true // Still return true since local reset will work
      }
      
    } catch (error) {
      console.error('Error resetting database stats:', error)
      // Still return true since local reset will work
      return true
    }
  }, [user, token])

  // Handle start over confirmation
  const handleStartOverConfirm = useCallback(async () => {
    setShowStartOverModal(false)
    
    // Reset stats in database
    const success = await resetUserStats()
    
    if (success) {
      // Reset game state
      resetToLevelOne()
      // Show success modal
      setShowResetSuccessModal(true)
    } else {
      // If database reset failed, still reset the game but show an error
      alert('Failed to reset stats in database, but game will restart locally.')
      resetToLevelOne()
    }
  }, [resetUserStats, resetToLevelOne])

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

  // Service Worker update handling
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      // Listen for service worker updates
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'SW_UPDATE_READY') {
          console.log('🔄 New version available:', event.data.version)
          // Force reload to get the latest version
          window.location.reload()
        }
      })

      // Check for updates every 30 seconds
      const updateInterval = setInterval(() => {
        navigator.serviceWorker.getRegistration().then((registration) => {
          if (registration) {
            registration.update()
          }
        })
      }, 30000) // Check every 30 seconds

      // Also check for updates when the page becomes visible
      const handleVisibilityChange = () => {
        if (!document.hidden) {
          navigator.serviceWorker.getRegistration().then((registration) => {
            if (registration) {
              registration.update()
            }
          })
        }
      }

      document.addEventListener('visibilitychange', handleVisibilityChange)

      return () => {
        clearInterval(updateInterval)
        document.removeEventListener('visibilitychange', handleVisibilityChange)
      }
    }
  }, [])

  // Mobile optimization initialization
  useEffect(() => {
    // Initialize compatibility features
    // compatibilityUtils.addCSSFallbacks()
    // compatibilityUtils.polyfillRequestIdleCallback()
    
    // Initialize performance monitoring
    // performanceMonitor.startMonitoring()
    // webVitalsMonitor.startMonitoring()
    // networkMonitor.startMonitoring()
    
    // Calculate responsive tile sizes
    const updateTileSizes = () => {
      // const { width, height } = responsiveUtils.getViewportDimensions()
      // const tileSize = responsiveUtils.calculateTileSize(width, height, 7, 7) // Assuming 7x7 board
      // const gapSize = responsiveUtils.calculateGapSize(tileSize)
      const width = window.innerWidth
      const height = window.innerHeight
      // Match the CSS calc() values: calc((100% - 20px) / 6) and calc((100% - 40px) / 6)
      const tileWidth = (width - 20) / 6
      const tileHeight = (height - 40) / 6
      const tileSize = Math.min(tileWidth, tileHeight)
      const gapSize = 2
      
      // // tileSizeRef.current = tileSize
      // // gapSizeRef.current = gapSize
      
      // Update CSS custom properties
      document.documentElement.style.setProperty('--tile-size', `${tileSize}px`)
      document.documentElement.style.setProperty('--gap-size', `${gapSize}px`)
      
      // Calculate step size for drag animations
      const step = tileSize + gapSize
      if (step && step !== tileStep) setTileStep(step)
    }
    
    // Initial calculation
    updateTileSizes()
    
    // Handle orientation changes
    // const cleanupOrientation = responsiveUtils.onOrientationChange(() => {
    const cleanupOrientation = () => {
      updateTileSizes()
      // setMobileState(prev => ({
      //   ...prev,
      //   isLandscape: mobileFeatures.isLandscape(),
      //   safeAreaInsets: mobileFeatures.getSafeAreaInsets()
      // }))
    }
    
    // Cleanup
    return () => {
      cleanupOrientation()
      // cleanupManagerRef.current.cleanup()
      
      // Stop performance monitoring
      // performanceMonitor.stopMonitoring()
      
      // Clear any pending timeouts or intervals
      const timeouts = window.__wordslideTimeouts || []
      timeouts.forEach(timeout => clearTimeout(timeout))
      window.__wordslideTimeouts = []
      
      // Clear any pending animation frames
      const animationFrames = window.__wordslideAnimationFrames || []
      // animationFrames.forEach(frame => performanceUtils.cancelAnimationFrame(frame))
      window.__wordslideAnimationFrames = []
    }
  }, [])

  // Handle PWA install button click
  const handleInstallClick = async () => {
    
    if (!deferredPrompt) {
      // Show instructions if no prompt is available
      alert(`To install WordSlide as an app:

🖥️ Desktop (Chrome/Edge):
• Look for install icon (⊞) in address bar
• Or go to Settings → Install WordSlide

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
      
      // Levels 1-5: 1 three-letter word
      if (level >= 1 && level <= 5) {
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
      // Levels 6-10: 2 three-letter words
      else if (level >= 6 && level <= 10) {
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
      // Levels 11-15: 1 four-letter word
      else if (level >= 11 && level <= 15) {
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
      // Levels 16-20: 2 four-letter words
      else if (level >= 16 && level <= 20) {
        for (let i = 0; i < 2; i++) {
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
    
    // Check if this specific position is part of any completed word
    for (const completedWordKey of completedWords) {
      // Parse the completed word key: "WORD-row-col-direction"
      const parts = completedWordKey.split('-')
      if (parts.length < 4) continue
      
      const word = parts[0]
      const startRow = parseInt(parts[1])
      const startCol = parseInt(parts[2])
      const direction = parts[3]
      
      if (direction === 'horizontal') {
        // Check if this letter is within the horizontal word range
        if (startRow === r && c >= startCol && c < startCol + word.length) {
          return true
        }
      } else if (direction === 'vertical') {
        // Check if this letter is within the vertical word range
        if (startCol === c && r >= startRow && r < startRow + word.length) {
          return true
        }
      }
    }
    
    return false
  }, [board, completedWords])

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
  const checkWordCompletionSync = useCallback((boardToCheck = board) => {
    if (!boardToCheck || boardToCheck.length === 0 || !boardToCheck[0] || currentView !== 'original') return
    if (levelTransitioning) return

    const targetWords = WORD_SETS[currentLevel - 1] || WORD_SETS[0]
    if (!targetWords || targetWords.length === 0) return

    // Check for completed words and update immediately
    const newCompletedWords = new Set(completedWords)
    let hasNewCompletions = false
    
    for (const word of targetWords) {
      // Skip if this word is already completed (check all positions)
      let wordAlreadyCompleted = false
      for (const completedKey of completedWords) {
        if (completedKey.startsWith(word + '-')) {
          wordAlreadyCompleted = true
          break
        }
      }
      if (wordAlreadyCompleted) continue
      
      const wordLower = word.toLowerCase()
      let wordFound = false
      
      // Check horizontal words
      for (let row = 0; row < boardToCheck.length && !wordFound; row++) {
        for (let col = 0; col <= boardToCheck[row].length - word.length && !wordFound; col++) {
          const horizontalWord = boardToCheck[row].slice(col, col + word.length).join('').toLowerCase()
          if (horizontalWord === wordLower) {
            // Check if this specific position is already completed
            const wordKey = `${word}-${row}-${col}-horizontal`
            if (!newCompletedWords.has(wordKey)) {
              newCompletedWords.add(wordKey)
              wordFound = true
              hasNewCompletions = true
            }
            
            // Fireworks are now triggered immediately in the move functions
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
            // Check if this specific position is already completed
            const wordKey = `${word}-${row}-${col}-vertical`
            if (!newCompletedWords.has(wordKey)) {
              newCompletedWords.add(wordKey)
              wordFound = true
              hasNewCompletions = true
            }
            
            // Fireworks are now triggered immediately in the move functions
          }
        }
      }
    }
    
    // Update completed words immediately if there were new completions
    if (hasNewCompletions) {
      // Update visual state IMMEDIATELY by directly manipulating DOM elements
      // This makes letters turn green before React state update
      const newCompletedWordsArray = Array.from(newCompletedWords)
      const previousCompletedWordsArray = Array.from(completedWords)
      
      // Find newly completed words
      const newlyCompleted = newCompletedWordsArray.filter(word => !completedWords.has(word))
      
      // Fireworks are now triggered immediately in the move functions
      
      // Apply green styling immediately to all tiles in newly completed words
      // Use multiple timing strategies to ensure this works
      const applyGreenStyling = () => {
        console.log('🎨 APPLYING GREEN STYLING to newly completed words:', newlyCompleted)
        newlyCompleted.forEach(wordKey => {
          // Parse the word key: "WORD-row-col-direction"
          const parts = wordKey.split('-')
          if (parts.length < 4) return
          
          const word = parts[0]
          const startRow = parseInt(parts[1])
          const startCol = parseInt(parts[2])
          const direction = parts[3]
          
          if (direction === 'horizontal') {
            // Apply green styling to all tiles in this horizontal word
            for (let i = 0; i < word.length; i++) {
              const tileElement = document.querySelector(`[data-tile="${startRow}-${startCol + i}"]`)
              if (tileElement) {
                // Verify the tile has the correct letter before applying styling
                const tileText = tileElement.textContent?.trim()
                const expectedLetter = boardToCheck[startRow][startCol + i]
                if (tileText === expectedLetter) {
                  // Add the completed-tile class for full 3D styling
                  tileElement.classList.add('completed-tile')
                  tileElement.setAttribute('data-completed', 'true')
                  console.log(`🎨 STYLED HORIZONTAL TILE: ${startRow}-${startCol + i} (${expectedLetter})`)
                  
                  // Force a reflow to ensure the styles are applied
                  tileElement.offsetHeight
                }
              }
            }
          } else if (direction === 'vertical') {
            // Apply green styling to all tiles in this vertical word
            for (let i = 0; i < word.length; i++) {
              const tileElement = document.querySelector(`[data-tile="${startRow + i}-${startCol}"]`)
              if (tileElement) {
                // Verify the tile has the correct letter before applying styling
                const tileText = tileElement.textContent?.trim()
                const expectedLetter = boardToCheck[startRow + i][startCol]
                if (tileText === expectedLetter) {
                  // Add the completed-tile class for full 3D styling
                  tileElement.classList.add('completed-tile')
                  tileElement.setAttribute('data-completed', 'true')
                  console.log(`🎨 STYLED VERTICAL TILE: ${startRow + i}-${startCol} (${expectedLetter})`)
                  
                  // Force a reflow to ensure the styles are applied
                  tileElement.offsetHeight
                }
              }
            }
          }
        })
      }
      
      // Apply immediately
      applyGreenStyling()
      
      // Also apply after React's render cycle
      requestAnimationFrame(applyGreenStyling)
      
      // And apply again after a short delay to ensure it sticks
      setTimeout(applyGreenStyling, 0)
      
      // Additional fallback with longer delay to catch any late DOM updates
      setTimeout(applyGreenStyling, 50)
      
      // Set up a MutationObserver to reapply styling if React overrides it
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
            const target = mutation.target
            if (target.hasAttribute('data-tile')) {
              const [row, col] = target.getAttribute('data-tile').split('-').map(Number)
              // Check if this tile should be green
              if (isLetterInCompletedWord(row, col)) {
                target.classList.add('completed-tile')
                target.setAttribute('data-completed', 'true')
              }
            }
          }
        })
      })
      
      // Start observing the game board for style changes
      const gameBoard = document.querySelector('[data-tile]')?.closest('div')
      if (gameBoard) {
        observer.observe(gameBoard, { 
          attributes: true, 
          attributeFilter: ['style'],
          subtree: true 
        })
        
        // Stop observing after 2 seconds to avoid performance issues
        setTimeout(() => observer.disconnect(), 2000)
      }
      
      // Also update the word completion indicators in the UI immediately
      requestAnimationFrame(() => {
        newlyCompleted.forEach(wordKey => {
          // Extract word name from position key
          const word = wordKey.split('-')[0]
          const wordIndicator = document.querySelector(`[data-word-indicator="${word}"]`)
          if (wordIndicator) {
            // Remove any existing checkmark first
            const existingCheckmark = wordIndicator.querySelector('.word-checkmark')
            if (existingCheckmark) {
              existingCheckmark.remove()
            }
            
            // Add a green checkmark instead of highlighting the word
            const checkmark = document.createElement('span')
            checkmark.innerHTML = '✓'
            checkmark.style.setProperty('color', '#228B22', 'important')
            checkmark.style.setProperty('font-weight', 'bold', 'important')
            checkmark.style.setProperty('margin-left', '8px', 'important')
            checkmark.style.setProperty('font-size', '16px', 'important')
            checkmark.style.setProperty('transition', 'none', 'important')
            checkmark.className = 'word-checkmark'
            
            // Add the new checkmark
            wordIndicator.appendChild(checkmark)
            
            // Checkmark added for completed word
            console.log('🎯 WORD COMPLETED - CHECKMARK ADDED!', word)
          }
        })
      })
      
      // Now update React state
      setCompletedWords(newCompletedWords)
      
      // Fireworks are now triggered immediately when word completion is first detected
      
      // Add haptic feedback for word completion
      if (newlyCompleted.length > 0) { // && mobileState.hasHaptics
        // hapticUtils.success()
      }
      
      // Count unique words completed (not just positions)
      const uniqueWordsCompleted = new Set()
      for (const wordKey of newCompletedWords) {
        const word = wordKey.split('-')[0]
        uniqueWordsCompleted.add(word)
      }
      
      // Check if level is completed
      console.log('🎯 LEVEL COMPLETION CHECK:', {
        completedPositions: newCompletedWords.size,
        uniqueWordsCompleted: uniqueWordsCompleted.size,
        targetWords: targetWords.length,
        levelTransitioning: levelTransitioning,
        shouldTriggerFireworks: uniqueWordsCompleted.size === targetWords.length && !levelTransitioning
      })
      
      if (uniqueWordsCompleted.size === targetWords.length && !levelTransitioning) {
        console.log('🎆 LEVEL COMPLETED! Triggering fireworks...')
        setLevelTransitioning(true)
        // Trigger direct fireworks immediately
        showDirectFireworks()
        
        // Add haptic feedback for level completion
        // if (mobileState.hasHaptics) {
        //   hapticUtils.heavy()
        // }
        
        // Update database stats after level completion
        updateDatabaseStats(currentLevel, moveCount, newCompletedWords.size)
        
        // Show level complete modal after 2 seconds
        setTimeout(() => {
          setShowLevelCompleteModal(true)
        }, 2000)
      }
    }
  }, [currentLevel, currentView, levelTransitioning, moveCount, updateDatabaseStats, completedWords])

  // Create instant fireworks animation - dots shooting up from bottom then exploding
  const showDirectFireworks = useCallback(() => {
    console.log('🎆 FIREWORKS FUNCTION CALLED!')
    
    // Create fireworks container
    const container = document.createElement('div')
    container.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      pointer-events: none;
      z-index: 9999;
    `
    
    // Create multiple fireworks - dots shooting up from bottom
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8', '#FF9F43', '#EE5A24', '#00D2D3', '#FF3838', '#2ED573', '#FFA502', '#FF6348', '#7BED9F', '#70A1FF', '#5352ED', '#FF4757', '#2F3542', '#FF6B9D']
    const numFireworks = 25
    
    for (let i = 0; i < numFireworks; i++) {
      const color = colors[Math.floor(Math.random() * colors.length)]
      const startX = Math.random() * window.innerWidth
      const startY = window.innerHeight - 20 // Start near bottom
      const endY = Math.random() * window.innerHeight * 0.4 + window.innerHeight * 0.1 // Explode in upper area
      const delay = Math.random() * 500 // Stagger the launches more
      
      // Create the shooting dot
      const shootingDot = document.createElement('div')
      shootingDot.style.cssText = `
        position: absolute;
        left: ${startX}px;
        top: ${startY}px;
        width: 3px;
        height: 3px;
        background: ${color};
        border-radius: 50%;
      `
      
      container.appendChild(shootingDot)
      
      // Animate the dot shooting up
      shootingDot.animate([
        { 
          transform: 'translateY(0) scale(1)', 
          opacity: 1
        },
        { 
          transform: `translateY(${endY - startY}px) scale(1)`, 
          opacity: 1
        }
      ], {
        duration: 600 + Math.random() * 200,
        delay: delay,
        easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
      }).onfinish = () => {
        // When the dot reaches the top, create the explosion
        const explosionX = startX
        const explosionY = endY
        
        // Create explosion particles
        const numParticles = 30
        for (let j = 0; j < numParticles; j++) {
          const particle = document.createElement('div')
          const angle = (j / numParticles) * Math.PI * 2
          const distance = 40 + Math.random() * 80
          const endX = Math.cos(angle) * distance
          const endY = Math.sin(angle) * distance
          
          particle.style.cssText = `
            position: absolute;
            left: ${explosionX}px;
            top: ${explosionY}px;
            width: 2px;
            height: 2px;
            background: ${color};
            border-radius: 50%;
          `
          
          container.appendChild(particle)
          
          // Animate particle explosion
          particle.animate([
            { 
              transform: 'translate(0, 0)', 
              opacity: 1 
            },
            { 
              transform: `translate(${endX}px, ${endY}px)`, 
              opacity: 0 
            }
          ], {
            duration: 1000 + Math.random() * 500,
            easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
          }).onfinish = () => {
            // Remove particle when animation completes
            if (container.contains(particle)) {
              container.removeChild(particle)
            }
          }
        }
        
        // Remove the shooting dot
        if (container.contains(shootingDot)) {
          container.removeChild(shootingDot)
        }
      }
    }
    
    document.body.appendChild(container)
    console.log('🎆 Fireworks added to DOM')
    
    // Remove after all animations complete
    setTimeout(() => {
      if (document.body.contains(container)) {
        document.body.removeChild(container)
        console.log('🎆 Fireworks removed from DOM')
      }
    }, 3500)
  }, [])

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
    
    // Update state first so DOM reflects the new positions
    setBoard(newBoard)
    setEmptyPos({ r, c })
    const newMoveCount = moveCount + 1
    setMoveCount(newMoveCount)
    
    // Check for word completion immediately to trigger fireworks (before requestAnimationFrame delay)
    const targetWords = WORD_SETS[currentLevel - 1] || WORD_SETS[0]
    if (targetWords && targetWords.length > 0) {
      const newCompletedWords = new Set(completedWords)
      let hasNewCompletions = false
      
      for (const word of targetWords) {
        // Skip if this word is already completed (check all positions)
        let wordAlreadyCompleted = false
        for (const completedKey of completedWords) {
          if (completedKey.startsWith(word + '-')) {
            wordAlreadyCompleted = true
            break
          }
        }
        if (wordAlreadyCompleted) continue
        
        const wordLower = word.toLowerCase()
        let wordFound = false
        
        // Check horizontal words
        for (let row = 0; row < newBoard.length && !wordFound; row++) {
          for (let col = 0; col <= newBoard[row].length - word.length && !wordFound; col++) {
            const horizontalWord = newBoard[row].slice(col, col + word.length).join('').toLowerCase()
            if (horizontalWord === wordLower) {
              newCompletedWords.add(word)
              wordFound = true
              hasNewCompletions = true
              
              // Word completion detected
              console.log('🎯 HORIZONTAL WORD COMPLETED!', word)
            }
          }
        }
        
        // Check vertical words
        for (let col = 0; col < newBoard[0].length && !wordFound; col++) {
          for (let row = 0; row <= newBoard.length - word.length && !wordFound; row++) {
            const verticalWord = []
            for (let i = 0; i < word.length; i++) {
              verticalWord.push(newBoard[row + i][col])
            }
            if (verticalWord.join('').toLowerCase() === wordLower) {
              newCompletedWords.add(word)
              wordFound = true
              hasNewCompletions = true
              
              // Word completion detected
              console.log('🎯 VERTICAL WORD COMPLETED!', word)
            }
          }
        }
      }
    }
    
    // Check word completion AFTER state update so DOM elements are in correct positions
    // Use requestAnimationFrame to ensure DOM has updated
    requestAnimationFrame(() => {
      checkWordCompletionSync(newBoard)
    })
    
    // No database updates during moves - only at end of level
  }, [emptyPos, board, isLetterInCompletedWord, checkWordCompletionSync, completedWords, moveCount, currentLevel, showDirectFireworks])

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
      
      // Update state first so DOM reflects the new positions
      setBoard(newBoard)
      setEmptyPos({ r, c })
      const newMoveCount = moveCount + 1
      setMoveCount(newMoveCount)
      
      // Check for word completion immediately to trigger fireworks (before requestAnimationFrame delay)
      const targetWords = WORD_SETS[currentLevel - 1] || WORD_SETS[0]
      if (targetWords && targetWords.length > 0) {
        const newCompletedWords = new Set(completedWords)
        let hasNewCompletions = false
        
        for (const word of targetWords) {
          // Skip if this word is already completed (check all positions)
        let wordAlreadyCompleted = false
        for (const completedKey of completedWords) {
          if (completedKey.startsWith(word + '-')) {
            wordAlreadyCompleted = true
            break
          }
        }
        if (wordAlreadyCompleted) continue
          
          const wordLower = word.toLowerCase()
          let wordFound = false
          
          // Check horizontal words
          for (let row = 0; row < newBoard.length && !wordFound; row++) {
            for (let col = 0; col <= newBoard[row].length - word.length && !wordFound; col++) {
              const horizontalWord = newBoard[row].slice(col, col + word.length).join('').toLowerCase()
              if (horizontalWord === wordLower) {
                newCompletedWords.add(word)
                wordFound = true
                hasNewCompletions = true
                
                // Word completion detected
              }
            }
          }
          
          // Check vertical words
          for (let col = 0; col < newBoard[0].length && !wordFound; col++) {
            for (let row = 0; row <= newBoard.length - word.length && !wordFound; row++) {
              const verticalWord = []
              for (let i = 0; i < word.length; i++) {
                verticalWord.push(newBoard[row + i][col])
              }
              if (verticalWord.join('').toLowerCase() === wordLower) {
                newCompletedWords.add(word)
                wordFound = true
                hasNewCompletions = true
                
                // Word completion detected
              }
            }
          }
        }
      }
      
      // Check word completion AFTER state update so DOM elements are in correct positions
      // Use requestAnimationFrame to ensure DOM has updated
      requestAnimationFrame(() => {
        checkWordCompletionSync(newBoard)
      })
      
      // No database updates during moves - only at end of level
    } else {
    }
  }, [emptyPos, board, isLetterInCompletedWord, checkWordCompletionSync, completedWords, moveCount, currentLevel, showDirectFireworks])

  // Simple fallback board generation (doesn't depend on WORD_SETS)
  const generateFallbackBoard = useCallback(() => {
    const fallbackBoard = []
    for (let r = 0; r < 6; r++) {
      fallbackBoard[r] = []
      for (let c = 0; c < 6; c++) {
        if (r === 5 && c === 5) {
          fallbackBoard[r][c] = "" // Empty space
        } else {
          fallbackBoard[r][c] = String.fromCharCode(65 + Math.floor(Math.random() * 26))
        }
      }
    }
    setBoard(fallbackBoard)
    setEmptyPos({ r: 5, c: 5 })
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
        for (let r = 0; r < 6; r++) {
          newBoard[r] = []
          for (let c = 0; c < 6; c++) newBoard[r][c] = ""
        }
        const firstWord = String(targetWords[0] || '').toUpperCase()
        if (firstWord && firstWord.length > 1) {
          const row = 0
          const emptyCol = Math.min(firstWord.length - 1, 5)
          // Place all but last letter in order
          for (let i = 0; i < Math.min(firstWord.length - 1, 6); i++) {
            newBoard[row][i] = firstWord[i]
          }
          // Choose an adjacent spot for the final letter (prefer right, else below, else above, else left)
          const finalLetter = firstWord[Math.min(firstWord.length - 1, 5)]
          let finalPos = null
          // Right of empty
          if (emptyCol + 1 < 6) {
            finalPos = { r: row, c: emptyCol + 1 }
          } else if (row + 1 < 6) {
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
          for (let r = 0; r < 6; r++) {
            for (let c = 0; c < 6; c++) {
              if (r === row && c === emptyCol) continue // empty cell
              if (!newBoard[r][c]) {
                newBoard[r][c] = String.fromCharCode(65 + Math.floor(Math.random() * 26))
              }
            }
          }
          // Reset all state for Level 1 in a single batch
          setBoard(newBoard)
          setEmptyPos({ r: row, c: emptyCol })
          setCompletedWords(new Set())
          setMoveCount(0)
          setLevelTransitioning(false)
          
          // Check if the word is already completed in the generated board
          setTimeout(() => {
            checkWordCompletionSync(newBoard)
          }, 0)
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
      for (let r = 0; r < 6; r++) {
        newBoard[r] = []
        for (let c = 0; c < 6; c++) {
          newBoard[r][c] = ""
        }
      }
      
      // Step 1: Create a solved board first (target words in their final positions)
      const solvedBoard = []
      for (let r = 0; r < 6; r++) {
        solvedBoard[r] = []
        for (let c = 0; c < 6; c++) {
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
          for (let r = 0; r < 6 && !placed; r++) {
            for (let c = 0; c <= 6 - targetWord.length && !placed; c++) {
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
            for (let r = 0; r <= 6 - targetWord.length && !placed; r++) {
              for (let c = 0; c < 6 && !placed; c++) {
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
      for (let r = 0; r < 6; r++) {
        for (let c = 0; c < 6; c++) {
          if (solvedBoard[r][c] !== "") {
            allLetters.push(solvedBoard[r][c])
          }
        }
      }
      // Fill remaining slots with random letters
      const remainingSlots = 6 * 6 - allLetters.length - 1 // -1 for empty space
      for (let i = 0; i < remainingSlots; i++) {
        allLetters.push(String.fromCharCode(65 + Math.floor(Math.random() * 26)))
      }
      
      // Shuffle all letters
      shuffleArray(allLetters)
      
      // Step 3: Create the scrambled board
      let letterIndex = 0
      const emptyRow = Math.floor(Math.random() * 6)
      const emptyCol = Math.floor(Math.random() * 6)
      
      for (let r = 0; r < 6; r++) {
        for (let c = 0; c < 6; c++) {
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
        for (let r = 0; r < 6; r++) {
          for (let c = 0; c <= 6 - targetWord.length; c++) {
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
          for (let r = 0; r <= 6 - targetWord.length; r++) {
            for (let c = 0; c < 6; c++) {
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



  // Save game completion to permanent leaderboard
  const saveGameCompletion = useCallback(async (completionStats) => {
    if (!user || !token) {
      console.log('No user or token, skipping completion save')
      return
    }
    
    setIsSavingCompletion(true)
    
    try {
      const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
      const API_BASE = isLocalhost 
        ? '/api'
        : 'https://63jgwqvqyf.execute-api.us-east-1.amazonaws.com/dev'
      
      const completionRecord = createCompletionRecord(user, completionStats, 'original')
      
      const response = await fetch(`${API_BASE}/game/complete`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(completionRecord)
      })
      
      if (response.ok) {
        const result = await response.json()
        console.log('✅ Game completion saved to leaderboard:', result)
      } else {
        console.error('❌ Failed to save completion:', response.statusText)
      }
    } catch (error) {
      console.error('❌ Error saving game completion:', error)
    } finally {
      setIsSavingCompletion(false)
    }
  }, [user, token])

  // Handle play again after game completion
  const handlePlayAgain = useCallback(() => {
    setShowGameCompleteModal(false)
    
    // Reset to fresh stats
    const fresh = createFreshStats()
    setCurrentLevel(fresh.currentLevel)
    setMoveCount(fresh.moveCount)
    setCompletedWords(fresh.completedWords)
    setHintCount(fresh.hintCount)
    setLevelHistory(fresh.levelHistory)
    setBoard([])
    setEmptyPos({ r: 6, c: 6 })
    setLevelTransitioning(false)
    
    // Stay in game view, start from level 1
  }, [])

  // Handle return to menu after game completion
  const handleCompletionToMenu = useCallback(() => {
    setShowGameCompleteModal(false)
    setCurrentView('menu')
    
    // Reset stats
    const fresh = createFreshStats()
    setCurrentLevel(fresh.currentLevel)
    setMoveCount(fresh.moveCount)
    setCompletedWords(fresh.completedWords)
    setHintCount(fresh.hintCount)
    setLevelHistory(fresh.levelHistory)
  }, [])

  // Handle next level button
  const handleNextLevel = useCallback(() => {
    setShowLevelCompleteModal(false)
    
    // Save current level stats to history
    const currentLevelStats = {
      level: currentLevel,
      moves: moveCount,
      words: completedWords.size
    }
    const updatedHistory = [...levelHistory, currentLevelStats]
    setLevelHistory(updatedHistory)
    
    if (currentLevel < 20) {
      // Move to next level
      setCurrentLevel(currentLevel + 1)
      setMoveCount(0)
      setHintCount(3)
      setCompletedWords(new Set())
      setBoard([]) // Clear board to trigger regeneration via useEffect
      setLevelTransitioning(false)
    } else {
      // Game completed! All 20 levels beaten
      const completionStats = calculateCompletionStats(updatedHistory)
      
      // Show game completion modal
      setShowGameCompleteModal(true)
      
      // Save to leaderboard and reset stats
      if (isAuthenticated && user) {
        saveGameCompletion(completionStats)
      }
      
      setLevelTransitioning(false)
    }
  }, [currentLevel, moveCount, completedWords.size, levelHistory, isAuthenticated, user, saveGameCompletion])

  // Touch and mouse gesture handling for mobile and desktop
  const [touchStart, setTouchStart] = useState(null)
  const [touchEnd, setTouchEnd] = useState(null)
  const [selectedTile, setSelectedTile] = useState(null)
  const [isDragging, setIsDragging] = useState(false)
  const [dragAllowedDir, setDragAllowedDir] = useState(null) // 'left'|'right'|'up'|'down'|null

  const handleTouchStart = useCallback((e, r, c) => {
    if (!board[r][c]) return // Don't select empty tiles
    
    // Don't allow any interaction with completed word tiles
    if (isLetterInCompletedWord(r, c)) return
    
    // Only allow dragging tiles that are directly adjacent to the empty cell
    const isAdjacent = (
      (emptyPos.r === r && emptyPos.c === c + 1) || // Empty is to the right
      (emptyPos.r === r && emptyPos.c === c - 1) || // Empty is to the left  
      (emptyPos.c === c && emptyPos.r === r + 1) || // Empty is below
      (emptyPos.c === c && emptyPos.r === r - 1)    // Empty is above
    )
    
    if (!isAdjacent) return // Don't allow dragging non-adjacent tiles
    
    // Add haptic feedback for mobile
    // if (mobileState.hasHaptics) {
    //   hapticUtils.light()
    // }
    
    // Add visual feedback for touch
    const tileElement = e.currentTarget
    if (tileElement) {
      // Keep a subtle highlight without scaling to avoid layout shifts
      tileElement.style.boxShadow = '0 0 16px rgba(255, 215, 0, 0.6)'
    }
    
    // Record performance metrics
    // performanceMonitor.recordTouchStart()
    
    // Use optimized touch handler
    // touchOptimizerRef.current.handleTouchStart(e, (optimizedEvent) => {
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
    // })
  }, [board, emptyPos, isLetterInCompletedWord])

  const handleMouseDown = useCallback((e, r, c) => {
    if (!board[r][c]) return // Don't select empty tiles
    
    // Don't allow any interaction with completed word tiles
    if (isLetterInCompletedWord(r, c)) return
    
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
  }, [board, emptyPos, isLetterInCompletedWord])

  const handleTouchMove = useCallback((e) => {
    if (!touchStart || !selectedTile || !isDragging) return
    
    // Use optimized touch move handler with throttling
    // touchOptimizerRef.current.handleTouchMove(e, (optimizedEvent, velocity, isScrolling) => {
      // Prevent scrolling interference
      // if (isScrolling) return
      
    const currentX = e.touches[0].clientX
    const currentY = e.touches[0].clientY
    
    // Calculate raw movement from start position
    const rawDx = currentX - touchStart.x
    const rawDy = currentY - touchStart.y
    
    // Apply movement with clamping to empty cell boundary
    const tileEl = document.querySelector(`[data-tile="${selectedTile.r}-${selectedTile.c}"]`)
    if (tileEl) {
      tileEl.style.transition = 'none' // No transition for real-time following
      
        // Use actual calculated tile step size
        const step = tileStep || 42 // Use calculated tileStep or fallback
      const maxDistance = step * 1.1 // Allow overshoot to reach empty cell
      
      // Allow smooth movement exactly to empty space boundary
      if (dragAllowedDir === 'right' && rawDx > 0) {
        const clampedDx = Math.min(rawDx, maxDistance * 0.9) // Reduce horizontal overshoot
          tileEl.style.transform = `translate3d(${clampedDx}px, 0px, 0px)` // Use 3D transform for hardware acceleration
      } else if (dragAllowedDir === 'left' && rawDx < 0) {
        const clampedDx = Math.max(rawDx, -maxDistance * 0.9) // Reduce horizontal overshoot
          tileEl.style.transform = `translate3d(${clampedDx}px, 0px, 0px)`
      } else if (dragAllowedDir === 'down' && rawDy > 0) {
        const clampedDy = Math.min(rawDy, maxDistance) // Keep full vertical overshoot
          tileEl.style.transform = `translate3d(0px, ${clampedDy}px, 0px)`
      } else if (dragAllowedDir === 'up' && rawDy < 0) {
        const clampedDy = Math.max(rawDy, -maxDistance) // Keep full vertical overshoot
          tileEl.style.transform = `translate3d(0px, ${clampedDy}px, 0px)`
      } else {
        // Reset if dragging in wrong direction
          tileEl.style.transform = `translate3d(0px, 0px, 0px)`
      }
    }
    setTouchEnd({ x: currentX, y: currentY })
    // })
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
      
      const step = tileStep || 42 // Use calculated tileStep or fallback
      const maxDistance = step * 1.1 // Allow overshoot to reach empty cell
      
      // Allow smooth movement exactly to empty space boundary
      if (dragAllowedDir === 'right' && rawDx > 0) {
        const clampedDx = Math.min(rawDx, maxDistance) // Stop exactly at empty cell
        tileEl.style.transform = `translate(${clampedDx}px, 0px)`
      } else if (dragAllowedDir === 'left' && rawDx < 0) {
        const clampedDx = Math.max(rawDx, -maxDistance) // Stop exactly at empty cell
        tileEl.style.transform = `translate(${clampedDx}px, 0px)`
      } else if (dragAllowedDir === 'down' && rawDy > 0) {
        const clampedDy = Math.min(rawDy, maxDistance) // Stop exactly at empty cell
        tileEl.style.transform = `translate(0px, ${clampedDy}px)`
      } else if (dragAllowedDir === 'up' && rawDy < 0) {
        const clampedDy = Math.max(rawDy, -maxDistance) // Stop exactly at empty cell
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

    // Record performance metrics
    // performanceMonitor.recordTouchEnd()
    
    // Use optimized touch end handler
    // touchOptimizerRef.current.handleTouchEnd(e, (optimizedEvent, touchData) => {
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
        // Add haptic feedback for successful move
        // if (mobileState.hasHaptics) {
        //   hapticUtils.medium()
        // }
      
      // Calculate final position (where tile should end up - empty cell with overshoot)
      let finalX = 0, finalY = 0
      const finalStep = step * 1.1 // Match the overshoot distance used during dragging
      if (dragAllowedDir === 'right') finalX = finalStep
      else if (dragAllowedDir === 'left') finalX = -finalStep
      else if (dragAllowedDir === 'down') finalY = finalStep
      else if (dragAllowedDir === 'up') finalY = -finalStep
      
      if (tileEl) {
        // Keep tile in current position without animation
        tileEl.style.transition = 'none'
        // Don't change the transform - keep it where it is
      }

      // Complete the move immediately
      directMove(selectedTile.r, selectedTile.c)
      if (tileEl) {
        tileEl.style.transition = 'none'
        tileEl.style.transform = 'translate3d(0px, 0px, 0px)'
      }
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
    // })
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
      // Calculate final position (where tile should end up - empty cell with overshoot)
      let finalX = 0, finalY = 0
      const finalStep = step * 1.1 // Match the overshoot distance used during dragging
      if (dragAllowedDir === 'right') finalX = finalStep
      else if (dragAllowedDir === 'left') finalX = -finalStep
      else if (dragAllowedDir === 'down') finalY = finalStep
      else if (dragAllowedDir === 'up') finalY = -finalStep
      
      if (tileEl) {
        // Keep tile in current position without animation
        tileEl.style.transition = 'none'
        // Don't change the transform - keep it where it is
      }

      // Complete the move immediately
      directMove(selectedTile.r, selectedTile.c)
      if (tileEl) {
        tileEl.style.transition = 'none'
        tileEl.style.transform = 'translate(0px, 0px)'
      }
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
      
      // Calculate actual mini game tile size
      const containerWidth = Math.min(400, Math.max(300, window.innerWidth * 0.35))
      const padding = 8 * 2 // 8px padding on each side
      const gaps = 3 * 4 // 3px gaps between 5 columns
      const tileSize = (containerWidth - padding - gaps) / 5
      const gapSize = 3
      const maxDragDistance = tileSize + gapSize + 2 // Allow full tile movement to completely fill empty space
      
      // Only allow movement toward the empty space, allowing full movement to fill the empty slot
      if (r === emptyR) {
        // Same row - allow horizontal movement
        if (c > emptyC) {
          // Tile is to the right of empty, allow left movement to completely fill empty space
          const maxLeftMovement = -maxDragDistance
          constrainedX = Math.max(maxLeftMovement, Math.min(0, deltaX))
        } else {
          // Tile is to the left of empty, allow right movement to completely fill empty space
          const maxRightMovement = maxDragDistance
          constrainedX = Math.min(maxRightMovement, Math.max(0, deltaX))
        }
      } else if (c === emptyC) {
        // Same column - allow vertical movement
        if (r > emptyR) {
          // Tile is below empty, allow up movement to completely fill empty space
          const maxUpMovement = -maxDragDistance
          constrainedY = Math.max(maxUpMovement, Math.min(0, deltaY))
        } else {
          // Tile is above empty, allow down movement to completely fill empty space
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
    
    // Calculate actual mini game tile size
    const containerWidth = Math.min(400, Math.max(300, window.innerWidth * 0.35))
    const padding = 8 * 2 // 8px padding on each side
    const gaps = 3 * 4 // 3px gaps between 5 columns
    const tileSize = (containerWidth - padding - gaps) / 5
    const gapSize = 3
    const step = tileSize + gapSize + 2 // Add a few more pixels to slide all the way
    const threshold = step * 0.3 // Same threshold as main game
    
    // Check if we should trigger a move based on drag distance and direction
    let moveTriggered = false
    const emptyR = miniEmptyPos.r
    const emptyC = miniEmptyPos.c
    
    if (r === emptyR) {
      // Same row - check horizontal movement
      if (c > emptyC && -x > threshold) moveTriggered = true // Moving left
      else if (c < emptyC && x > threshold) moveTriggered = true // Moving right
    } else if (c === emptyC) {
      // Same column - check vertical movement
      if (r > emptyR && -y > threshold) moveTriggered = true // Moving up
      else if (r < emptyR && y > threshold) moveTriggered = true // Moving down
    }
    
    if (moveTriggered) {
      // Just update the board state immediately - let CSS transitions handle the smooth movement
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
    } else {
      // Snap back to original position (same as main game)
      const tileEl = document.querySelector(`[data-mini-tile="${r}-${c}"]`)
      if (tileEl) {
        tileEl.style.transition = 'transform 0.15s cubic-bezier(0.34, 1.56, 0.64, 1)'
        tileEl.style.transform = 'translate(0px, 0px)'
      }
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
    const uncompletedWords = (targetWords || []).filter(word => {
      // Check if this word is already completed (check all positions)
      for (const completedKey of completedWords) {
        if (completedKey.startsWith(word + '-')) {
          return false // Word is already completed
        }
      }
      return true // Word is not completed
    })
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
          paddingTop: 'max(40px, env(safe-area-inset-top))',
          paddingBottom: 'max(20px, env(safe-area-inset-bottom))',
          paddingLeft: 'max(10px, env(safe-area-inset-left))',
          paddingRight: 'max(10px, env(safe-area-inset-right))',
          maxWidth: '100vw',
          maxHeight: '100vh',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'flex-start',
          minHeight: '100vh'
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
              WordSlid
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
                        data-mini-tile={`${r}-${c}`}
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
                            right: '-35px',
                            transform: 'translateY(-50%)',
                            color: '#32CD32',
                            fontSize: '32px',
                            fontWeight: 'bold',
                            textShadow: '0 0 8px rgba(50, 205, 50, 1), 0 0 16px rgba(50, 205, 50, 0.6)',
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
          backgroundColor: 'transparent',
          minHeight: '100vh',
          paddingTop: 'max(20px, env(safe-area-inset-top))',
          paddingBottom: 'max(20px, env(safe-area-inset-bottom))',
          paddingLeft: 'max(20px, env(safe-area-inset-left))',
          paddingRight: 'max(20px, env(safe-area-inset-right))'
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
            padding: '8px',
            margin: '5px auto',
            marginTop: 'max(5px, calc(env(safe-area-inset-top) * 0.5))',
            maxWidth: '90vw',
            textAlign: 'center'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexWrap: 'wrap',
              gap: '12px',
              marginBottom: '5px'
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
                  <div key={word} data-word-indicator={word} style={{
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
                          background: 'linear-gradient(135deg, #F5DEB3, #DEB887)',
                          color: '#8B4513',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '14px',
                          fontWeight: '900',
                          borderRadius: '3px',
                          // 3D block effect like game tiles
                          boxShadow: '2px 2px 4px rgba(0,0,0,0.3), inset 1px 1px 0 rgba(255,255,255,0.3), inset -1px -1px 0 rgba(139,69,19,0.3)',
                          border: '1px solid #CD853F',
                          borderTop: '2px solid #F8F0E3',
                          borderLeft: '2px solid #F8F0E3',
                          borderRight: '1px solid #7A6B47',
                          // Removed bottom border
                          transition: 'all 0.3s ease'
                        }}
                      >
                        {letter}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
            <p style={{margin: '4px 0', fontSize: 'clamp(14px, 4vw, 18px)', color: '#F5DEB3'}}>
              Moves: <span style={{color: '#F5DEB3'}}>{moveCount}</span>
            </p>
            {isAuthenticated && user?.username ? (
              <p style={{margin: '4px 0', fontSize: 'clamp(14px, 4vw, 18px)', color: '#F5DEB3'}}>
                User: <span style={{ color: '#FFD700' }}>{user.username}</span>
              </p>
            ) : (
              <div style={{margin: '4px 0', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
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
              marginTop: '5px',
              display: 'flex',
              flexWrap: 'wrap',
              gap: '4px',
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
                  border: '2px solid #8B4513',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  fontSize: 'clamp(13px, 3.5vw, 15px)',
                  fontWeight: 'bold',
                  cursor: hintCount > 0 ? 'pointer' : 'not-allowed',
                  height: '36px',
                  minWidth: '80px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '4px',
                  boxShadow: hintCount > 0 
                    ? '0 2px 8px rgba(255, 215, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.3)' 
                    : '0 2px 8px rgba(0, 0, 0, 0.2)',
                  transition: 'all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                  touchAction: 'manipulation',
                  position: 'relative',
                  overflow: 'hidden'
                }}
                onMouseEnter={(e) => {
                  if (hintCount > 0) {
                    e.target.style.transform = 'translateY(-1px) scale(1.05)'
                    e.target.style.boxShadow = '0 4px 12px rgba(255, 215, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.4)'
                  }
                }}
                onMouseLeave={(e) => {
                  if (hintCount > 0) {
                    e.target.style.transform = 'translateY(0) scale(1)'
                    e.target.style.boxShadow = '0 2px 8px rgba(255, 215, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.3)'
                  }
                }}
                title={`Hint (${hintCount})`}
              >
                💡 Hint
              </button>
              
              <button 
                onClick={showRulesModal}
                style={{
                  background: 'linear-gradient(135deg, #00CED1, #20B2AA)',
                  color: '#2F1B14',
                  border: '2px solid #8B4513',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  fontSize: 'clamp(13px, 3.5vw, 15px)',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  height: '36px',
                  minWidth: '100px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '4px',
                  boxShadow: '0 2px 8px rgba(0, 206, 209, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.3)',
                  transition: 'all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                  touchAction: 'manipulation',
                  position: 'relative',
                  overflow: 'hidden'
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = 'translateY(-1px) scale(1.05)'
                  e.target.style.boxShadow = '0 4px 12px rgba(0, 206, 209, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.4)'
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'translateY(0) scale(1)'
                  e.target.style.boxShadow = '0 2px 8px rgba(0, 206, 209, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.3)'
                }}
                title="How to Play"
              >
                📖 How to Play
              </button>

              <button 
                onClick={() => setShowLeaderboard(true)}
                style={{
                  background: 'linear-gradient(135deg, #F5DEB3, #DEB887)',
                  color: '#654321',
                  padding: '8px 16px',
                  borderRadius: '8px',
                  fontSize: 'clamp(13px, 3.5vw, 15px)',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  height: '36px',
                  minWidth: '100px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 2px 8px rgba(139, 69, 19, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.3)',
                  transition: 'all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                  touchAction: 'manipulation',
                  textShadow: '0 1px 2px rgba(255, 255, 255, 0.3)',
                  position: 'relative',
                  overflow: 'hidden'
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = 'translateY(-1px) scale(1.05)'
                  e.target.style.boxShadow = '0 4px 12px rgba(139, 69, 19, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.4)'
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'translateY(0) scale(1)'
                  e.target.style.boxShadow = '0 2px 8px rgba(139, 69, 19, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.3)'
                }}
                title="Leaderboard"
              >
                🏆 Leaderboard
              </button>

              
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
                height: 'min(90vw, 400px)',
                overflow: 'visible',
                backgroundColor: 'transparent',
                padding: '10px', // 10px padding from cell edges to board edge
                borderRadius: '12px',
                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4), inset 0 2px 0 rgba(255, 255, 255, 0.1)',
                border: '2px solid #8B4513',
                position: 'relative', // For animation overlay positioning
                display: 'flex',
                flexDirection: 'column',
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
                  alignItems: 'center',
                  width: '100%',
                  height: 'clamp(40px, calc((min(90vw, 400px) - 20px) / 6 + 4px), 65px)',
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
                  top: 0,
                  // Removed horizontal borders between rows
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
                        width: 'clamp(35px, calc((min(90vw, 400px) - 20px) / 6), 60px)',
                        height: 'clamp(35px, calc((min(90vw, 400px) - 20px) / 6), 60px)',
                        margin: '2px',
                        boxSizing: 'border-box',
                        // Clean solid background for 3D blocks
                        background: cell ? 'linear-gradient(135deg, #F5DEB3, #DEB887)' : 'transparent',
                        // Hint blink styling
                        ...(hintBlinkPositions && hintBlinkPositions.some(p => p.r === r && p.c === c) && {
                          background: 'linear-gradient(135deg, #90EE90, #32CD32)',
                          color: '#006400',
                          boxShadow: '0 0 20px rgba(50, 205, 50, 0.8), 0 0 40px rgba(50, 205, 50, 0.6)',
                          animation: 'hintBlink 0.5s ease-in-out infinite alternate'
                        }),
                        // 3D block appearance with enhanced shadows
                        border: cell ? '1px solid #CD853F' : '1px solid transparent',
                        borderTop: cell ? '3px solid #F8F0E3' : '3px solid transparent', // Brighter light highlight on top
                        borderLeft: cell ? '3px solid #F8F0E3' : '3px solid transparent', // Brighter light highlight on left
                        borderRight: cell ? '3px solid #7A6B47' : '3px solid transparent', // Darker shadow on right
                        // Removed bottom border
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
                      // Completed words will be styled via CSS class applied in DOM manipulation
                        // Hint tiles will be styled via CSS class if needed
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
                  background: 'linear-gradient(135deg, #F5DEB3, #DEB887)',
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
          
          {/* Bottom action buttons: Previous, Home, Install, Next */}
          <div id="game-action-buttons" style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '8px',
            marginTop: '20px',
            marginBottom: '20px',
            padding: '0 10px'
          }}>
            {/* Previous Level Button */}
            <button 
              onClick={() => {
                if (currentLevel > 1) {
                  setCurrentLevel(prev => prev - 1)
                  setMoveCount(0)
                  setCompletedWords(new Set())
                  setHintCount(3)
                  setLevelTransitioning(false)
                  setBoard([])
                  setEmptyPos({ r: 6, c: 6 })
                }
              }}
              disabled={currentLevel <= 1}
              style={{
                background: 'linear-gradient(135deg, #F5DEB3, #DEB887)',
                color: '#654321',
                border: '3px solid #8B4513',
                padding: 'clamp(10px, 2.5vw, 14px) clamp(16px, 4vw, 24px)',
                borderRadius: '12px',
                fontSize: 'clamp(16px, 4vw, 20px)',
                fontWeight: 'bold',
                cursor: currentLevel > 1 ? 'pointer' : 'not-allowed',
                boxShadow: currentLevel > 1 ? '0 8px 16px rgba(139, 69, 19, 0.4), inset 0 2px 0 rgba(255, 255, 255, 0.3), inset 0 -2px 0 rgba(0, 0, 0, 0.2)' : '0 4px 8px rgba(0, 0, 0, 0.2)',
                transition: 'all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                textShadow: '0 1px 2px rgba(255, 255, 255, 0.3)',
                position: 'relative',
                overflow: 'hidden',
                opacity: currentLevel > 1 ? 1 : 0.5,
                minHeight: '48px',
                minWidth: '60px'
              }}
              onMouseEnter={(e) => {
                if (currentLevel > 1) {
                  e.target.style.transform = 'translateY(-2px) scale(1.05)'
                  e.target.style.boxShadow = '0 12px 20px rgba(139, 69, 19, 0.6), inset 0 2px 0 rgba(255, 255, 255, 0.4), inset 0 -2px 0 rgba(0, 0, 0, 0.3)'
                }
              }}
              onMouseLeave={(e) => {
                if (currentLevel > 1) {
                  e.target.style.transform = 'translateY(0) scale(1)'
                  e.target.style.boxShadow = '0 8px 16px rgba(139, 69, 19, 0.4), inset 0 2px 0 rgba(255, 255, 255, 0.3), inset 0 -2px 0 rgba(0, 0, 0, 0.2)'
                }
              }}
            >
              ←
            </button>

            {/* Home Button */}
            <button 
              onClick={() => setCurrentView('menu')}
              style={{
                background: 'linear-gradient(135deg, #F5DEB3, #DEB887)',
                color: '#654321',
                border: '3px solid #8B4513',
                padding: 'clamp(8px, 2vw, 12px) clamp(12px, 3vw, 18px)',
                borderRadius: '12px',
                fontSize: 'clamp(12px, 3vw, 16px)',
                fontWeight: 'bold',
                cursor: 'pointer',
                boxShadow: '0 8px 16px rgba(139, 69, 19, 0.4), inset 0 2px 0 rgba(255, 255, 255, 0.3), inset 0 -2px 0 rgba(0, 0, 0, 0.2)',
                transition: 'all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                textShadow: '0 1px 2px rgba(255, 255, 255, 0.3)',
                position: 'relative',
                overflow: 'hidden',
                minHeight: '40px',
                minWidth: '80px'
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'translateY(-2px) scale(1.05)'
                e.target.style.boxShadow = '0 12px 20px rgba(139, 69, 19, 0.6), inset 0 2px 0 rgba(255, 255, 255, 0.4), inset 0 -2px 0 rgba(0, 0, 0, 0.3)'
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0) scale(1)'
                e.target.style.boxShadow = '0 8px 16px rgba(139, 69, 19, 0.4), inset 0 2px 0 rgba(255, 255, 255, 0.3), inset 0 -2px 0 rgba(0, 0, 0, 0.2)'
              }}
            >
              🏠 Home
            </button>

            {/* Install Button */}
            {showInstallButton && (
            <button 
                onClick={handleInstallClick}
              style={{
                background: 'linear-gradient(135deg, #F5DEB3, #DEB887)',
                color: '#654321',
                border: '3px solid #8B4513',
                  padding: 'clamp(8px, 2vw, 12px) clamp(12px, 3vw, 18px)',
                borderRadius: '12px',
                  fontSize: 'clamp(12px, 3vw, 16px)',
                fontWeight: 'bold',
                cursor: 'pointer',
                boxShadow: '0 8px 16px rgba(139, 69, 19, 0.4), inset 0 2px 0 rgba(255, 255, 255, 0.3), inset 0 -2px 0 rgba(0, 0, 0, 0.2)',
                transition: 'all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                  textShadow: '0 1px 2px rgba(255, 255, 255, 0.3)',
                position: 'relative',
                  overflow: 'hidden',
                  minHeight: '40px',
                  minWidth: '80px'
              }}
              onMouseEnter={(e) => {
                  e.target.style.transform = 'translateY(-2px) scale(1.05)'
                  e.target.style.boxShadow = '0 12px 20px rgba(139, 69, 19, 0.6), inset 0 2px 0 rgba(255, 255, 255, 0.4), inset 0 -2px 0 rgba(0, 0, 0, 0.3)'
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0) scale(1)'
                e.target.style.boxShadow = '0 8px 16px rgba(139, 69, 19, 0.4), inset 0 2px 0 rgba(255, 255, 255, 0.3), inset 0 -2px 0 rgba(0, 0, 0, 0.2)'
              }}
            >
                📱 Install
            </button>
            )}

            {/* Next Level Button */}
              <button 
              onClick={goToNextLevel}
              disabled={currentLevel >= 20}
                style={{
                background: 'linear-gradient(135deg, #F5DEB3, #DEB887)',
                color: '#654321',
                border: '3px solid #8B4513',
                padding: 'clamp(10px, 2.5vw, 14px) clamp(16px, 4vw, 24px)',
                  borderRadius: '12px',
                fontSize: 'clamp(16px, 4vw, 20px)',
                  fontWeight: 'bold',
                cursor: currentLevel < 20 ? 'pointer' : 'not-allowed',
                boxShadow: currentLevel < 20 ? '0 8px 16px rgba(139, 69, 19, 0.4), inset 0 2px 0 rgba(255, 255, 255, 0.3), inset 0 -2px 0 rgba(0, 0, 0, 0.2)' : '0 4px 8px rgba(0, 0, 0, 0.2)',
                  transition: 'all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                textShadow: '0 1px 2px rgba(255, 255, 255, 0.3)',
                  position: 'relative',
                overflow: 'hidden',
                opacity: currentLevel < 20 ? 1 : 0.5,
                minHeight: '48px',
                minWidth: '60px'
                }}
                onMouseEnter={(e) => {
                if (currentLevel < 20) {
                  e.target.style.transform = 'translateY(-2px) scale(1.05)'
                  e.target.style.boxShadow = '0 12px 20px rgba(139, 69, 19, 0.6), inset 0 2px 0 rgba(255, 255, 255, 0.4), inset 0 -2px 0 rgba(0, 0, 0, 0.3)'
                }
                }}
                onMouseLeave={(e) => {
                if (currentLevel < 20) {
                  e.target.style.transform = 'translateY(0) scale(1)'
                  e.target.style.boxShadow = '0 8px 16px rgba(139, 69, 19, 0.4), inset 0 2px 0 rgba(255, 255, 255, 0.3), inset 0 -2px 0 rgba(0, 0, 0, 0.2)'
                }
                }}
              >
              →
              </button>
          </div>
          
          {/* Version Indicator */}
          <div style={{
            textAlign: 'center',
            marginTop: '10px',
            opacity: 0.5,
            fontSize: '10px',
            color: '#F5DEB3'
          }}>
            v1.1.0-game-completion
          </div>
          
          {/* Fireworks Animation - DISABLED (using direct fireworks instead) */}
          {false && showFireworks && (
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

          {/* Start Over Confirmation Modal */}
          {showStartOverModal && (
            <div id="start-over-modal" style={{
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
                minWidth: '320px'
              }}>
                <h1 style={{
                  color: '#654321',
                  fontSize: 'clamp(18px, 4.5vw, 22px)',
                  margin: '0 0 16px 0',
                  textShadow: '2px 2px 4px rgba(0,0,0,0.3)'
                }}>
                  ⚠️ Start Over?
                </h1>
                <p style={{
                  color: '#654321',
                  fontSize: 'clamp(14px, 3.5vw, 16px)',
                  margin: '0 0 24px 0',
                  lineHeight: '1.4'
                }}>
                  This will erase all stats and you will start over from level 1.<br/>
                  Are you sure you want to continue?
                </p>
                <div style={{
                  display: 'flex',
                  gap: '12px',
                  justifyContent: 'center',
                  flexWrap: 'wrap'
                }}>
                  <button
                    onClick={handleStartOverConfirm}
                    style={{
                      background: 'linear-gradient(135deg, #8B4513, #A0522D)',
                      color: '#F5DEB3',
                      border: '3px solid #654321',
                      padding: '10px 20px',
                      borderRadius: '8px',
                      fontSize: 'clamp(14px, 3.5vw, 16px)',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      minHeight: '40px',
                      minWidth: '100px',
                      boxShadow: '0 8px 16px rgba(139, 69, 19, 0.4), inset 0 2px 0 rgba(255, 255, 255, 0.3)',
                      transition: 'all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                      textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.transform = 'translateY(-2px) scale(1.05)'
                      e.target.style.boxShadow = '0 12px 24px rgba(139, 69, 19, 0.6), inset 0 2px 0 rgba(255, 255, 255, 0.4)'
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.transform = 'translateY(0) scale(1)'
                      e.target.style.boxShadow = '0 8px 16px rgba(139, 69, 19, 0.4), inset 0 2px 0 rgba(255, 255, 255, 0.3)'
                    }}
                  >
                    ✅ Yes
                  </button>
                  <button
                    onClick={() => setShowStartOverModal(false)}
                    style={{
                      background: 'linear-gradient(135deg, #8B4513, #A0522D)',
                      color: '#F5DEB3',
                      border: '3px solid #654321',
                      padding: '10px 20px',
                      borderRadius: '8px',
                      fontSize: 'clamp(14px, 3.5vw, 16px)',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      minHeight: '40px',
                      minWidth: '100px',
                      boxShadow: '0 8px 16px rgba(139, 69, 19, 0.4), inset 0 2px 0 rgba(255, 255, 255, 0.3)',
                      transition: 'all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                      textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.transform = 'translateY(-2px) scale(1.05)'
                      e.target.style.boxShadow = '0 12px 24px rgba(139, 69, 19, 0.6), inset 0 2px 0 rgba(255, 255, 255, 0.4)'
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.transform = 'translateY(0) scale(1)'
                      e.target.style.boxShadow = '0 8px 16px rgba(139, 69, 19, 0.4), inset 0 2px 0 rgba(255, 255, 255, 0.3)'
                    }}
                  >
                    ❌ No
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Game Completion Modal - Shown when all 20 levels are beaten */}
          <GameCompletionModal
            isOpen={showGameCompleteModal}
            onClose={handleCompletionToMenu}
            stats={calculateCompletionStats(levelHistory)}
            onPlayAgain={handlePlayAgain}
            isSaving={isSavingCompletion}
          />

          {/* Reset Success Modal */}
          {showResetSuccessModal && (
            <div id="reset-success-modal" style={{
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
                minWidth: '320px'
              }}>
                <h1 style={{
                  color: '#654321',
                  fontSize: 'clamp(18px, 4.5vw, 22px)',
                  margin: '0 0 16px 0',
                  textShadow: '2px 2px 4px rgba(0,0,0,0.3)'
                }}>
                  ✅ Game Reset Successfully!
                </h1>
                <p style={{
                  color: '#654321',
                  fontSize: 'clamp(14px, 3.5vw, 16px)',
                  margin: '0 0 24px 0',
                  lineHeight: '1.4'
                }}>
                  Your progress has been cleared and you're starting fresh from Level 1.
                </p>
                <button
                  onClick={() => setShowResetSuccessModal(false)}
                  style={{
                    background: 'linear-gradient(135deg, #8B4513, #A0522D)',
                    color: '#F5DEB3',
                    border: '3px solid #654321',
                    padding: '10px 20px',
                    borderRadius: '8px',
                    fontSize: 'clamp(14px, 3.5vw, 16px)',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    minHeight: '40px',
                    minWidth: '120px',
                    boxShadow: '0 8px 16px rgba(139, 69, 19, 0.4), inset 0 2px 0 rgba(255, 255, 255, 0.3)',
                    transition: 'all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                    textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.transform = 'translateY(-2px) scale(1.05)'
                    e.target.style.boxShadow = '0 12px 24px rgba(139, 69, 19, 0.6), inset 0 2px 0 rgba(255, 255, 255, 0.4)'
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = 'translateY(0) scale(1)'
                    e.target.style.boxShadow = '0 8px 16px rgba(139, 69, 19, 0.4), inset 0 2px 0 rgba(255, 255, 255, 0.3)'
                  }}
                >
                  🎮 Continue Playing
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
          paddingTop: 'max(20px, env(safe-area-inset-top))',
          paddingBottom: 'max(20px, env(safe-area-inset-bottom))',
          paddingLeft: 'max(20px, env(safe-area-inset-left))',
          paddingRight: 'max(20px, env(safe-area-inset-right))'
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
                height: 'min(90vw, 400px)',
                overflow: 'visible',
                backgroundColor: '#654321', // Dark brown like wood paneling
                padding: '10px', // 10px padding from cell edges to board edge
                borderRadius: '12px',
                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4), inset 0 2px 0 rgba(255, 255, 255, 0.1)',
                border: '2px solid #8B4513',
                position: 'relative', // For animation overlay positioning
                display: 'flex',
                flexDirection: 'column',
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
                  height: 'calc(100% / 6)',
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
                        width: 'calc((100% - 20px) / 6)',
                        height: 'calc((100% - 40px) / 6)',
                        margin: '1px', // Equal spacing in all directions
                        marginLeft: c === 0 ? '0px' : '1px', // First tile touches left edge
                        marginRight: c === row.length - 1 ? '0px' : '1px', // Last tile touches right edge
                        marginTop: r === 0 ? '0px' : '1px', // First row touches top edge
                        marginBottom: r === tetrisBoard.length - 1 ? '0px' : '1px', // Last row touches bottom edge
                        background: cell ? 'linear-gradient(135deg, #F5DEB3, #DEB887)' : 'rgba(139, 69, 19, 0.3)', // Show empty cells
                        border: 'none', // Remove conflicting shorthand border
                        borderRadius: cell ? '6px' : '4px', // Smaller radius for connected appearance
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 'clamp(16px, 4vw, 22px)',
                        fontWeight: 'bold',
                        color: cell ? '#654321' : 'rgba(139, 69, 19, 0.5)',
                        cursor: 'default',
                        boxShadow: cell ? '0 4px 8px rgba(139, 69, 19, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.3), inset 0 -1px 0 rgba(0, 0, 0, 0.2)' : 'inset 0 2px 4px rgba(0, 0, 0, 0.3), inset 0 -1px 2px rgba(0, 0, 0, 0.2)',
                        transition: 'all 0.1s ease',
                        position: 'relative',
                        userSelect: 'none',
                        WebkitUserSelect: 'none',
                        WebkitTapHighlightColor: 'transparent',
                        // Make tiles appear as raised sections of the board
                        /* transform: cell ? 'translateZ(2px)' : 'none', */ // Disabled GPU acceleration to prevent ghosting
                        // Connected surface effect - use specific border properties
                        borderRight: c < row.length - 1 ? '1px solid #654321' : 'none',
                        // Removed bottom border
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
                    background: 'linear-gradient(135deg, #F5DEB3, #DEB887)',
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

export default App;

// Wrap App with AuthProvider for components that need authentication
function AppWithAuth() {
  return (
    <AuthProvider>
      <App />
    </AuthProvider>
  )
}

export { AppWithAuth };