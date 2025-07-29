let canvas, ctx;
let gameRunning = false;
const rows = 7;
const cols = 7;
let board = [];
let emptyPos = { r: 6, c: 6 }; // Start with bottom-right empty

let animating = false;
let animation = null;

let moveCount = 0;
let currentLevel = 1;
const MAX_LEVELS = 20;
let isTransitioning = false; // Flag to prevent word completion checks during transitions
let currentGameMode = 'original'; // Track which game mode is active
console.log("main.js loaded");

// Function to update move counter display
function updateMoveCounter() {
    const moveCounter = document.getElementById('moveCounter');
    if (moveCounter) {
        moveCounter.textContent = moveCount;
    }
}

// Function to update level display
function updateLevelDisplay() {
    const levelDisplay = document.getElementById('levelDisplay');
    if (levelDisplay) {
        levelDisplay.textContent = currentLevel;
    }
}

// Function to update target words display
function updateTargetWordsDisplay() {
    const targetWordsDisplay = document.getElementById('targetWords');
    if (targetWordsDisplay) {
        const currentWords = getCurrentWordSet();
        targetWordsDisplay.textContent = currentWords.map(word => word.toUpperCase()).join(', ');
    }
}

// Function to reset the game (called from HTML button)
function resetGame() {
    console.log('=== RESET BOARD - PRESERVING COMPLETED WORDS ===');
    
    // Store the current completed tiles before resetting
    const preservedCompletedTiles = [...completedTiles];
    console.log('Preserving completed tiles:', preservedCompletedTiles);
    
    // Reset move count
    moveCount = 0;
    
    // Generate a new board (this will clear completedTiles)
    generateBoard();
    
    // Restore the completed tiles
    completedTiles = preservedCompletedTiles;
    console.log('Restored completed tiles:', completedTiles);
    
    // Now re-scramble only the non-completed tiles
    rescrambleIncompleteTiles();
    
    // Update displays
    updateMoveCounter();
    updateLevelDisplay();
    updateTargetWordsDisplay();
    
    // Redraw the board
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawBoard();
    
    // Save the new state
    saveGameState();
    
    console.log('Board reset complete - completed words preserved');
}

// Function to re-scramble only the incomplete tiles while preserving completed words
function rescrambleIncompleteTiles() {
    // Create a set of completed tile positions for fast lookup
    const completedPositions = new Set();
    for (const tile of completedTiles) {
        completedPositions.add(`${tile.r},${tile.c}`);
    }
    
    // Collect all incomplete tiles (letters that can be moved)
    const incompleteTiles = [];
    const incompletePositions = [];
    
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            const position = `${r},${c}`;
            if (!completedPositions.has(position) && board[r][c] !== "") {
                incompleteTiles.push(board[r][c]);
                incompletePositions.push({ r, c });
            }
        }
    }
    
    // Add the current empty position to the incomplete positions
    // This ensures we don't create a second empty cell
    incompletePositions.push({ r: emptyPos.r, c: emptyPos.c });
    
    // Shuffle the incomplete tiles
    shuffleArray(incompleteTiles);
    
    // Choose a random position for the empty space (must be from incomplete positions)
    const randomIndex = Math.floor(Math.random() * incompletePositions.length);
    const newEmptyPos = incompletePositions[randomIndex];
    
    // Remove the chosen position from incomplete positions
    incompletePositions.splice(randomIndex, 1);
    
    // Place the shuffled incomplete tiles back in their positions
    for (let i = 0; i < incompleteTiles.length; i++) {
        const pos = incompletePositions[i];
        board[pos.r][pos.c] = incompleteTiles[i];
    }
    
    // Set the new empty space
    emptyPos = { r: newEmptyPos.r, c: newEmptyPos.c };
    board[emptyPos.r][emptyPos.c] = "";
}

// Make resetGame globally accessible
window.resetGame = resetGame;

// Function to advance to next level (called from HTML button)
function nextLevel() {
    if (currentLevel < MAX_LEVELS) {
        // AGGRESSIVE CLEARING - Do this FIRST before anything else
        console.log('=== NEXT LEVEL TRANSITION START ===');
        console.log('Before clearing - completedTiles:', completedTiles);
        
        // 1. Stop everything immediately
        gameRunning = false;
        animating = false;
        animation = null;
        isTransitioning = true;
        
        // 2. GLOBAL DISABLE GREEN HIGHLIGHTING
        disableGreenHighlighting = true;
        console.log('GLOBAL GREEN HIGHLIGHTING DISABLED');
        
        // 3. Clear completed tiles multiple times
        completedTiles = [];
        completedTiles.length = 0;
        completedTiles.splice(0, completedTiles.length);
        
        // 4. Force immediate visual clearing
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawBoard();
        
        // 4. Update level state
        currentLevel++;
        moveCount = 0;
        saveGameState(); // Save when advancing to next level
        
        console.log('After clearing - completedTiles:', completedTiles);
        
        // 5. Update displays
        updateMoveCounter();
        updateLevelDisplay();
        updateTargetWordsDisplay();
        
        // 6. Generate new board
        generateBoard();
        
        // 7. Ensure emptyPos is correctly set
        console.log('Next level - emptyPos after generateBoard:', emptyPos);
        
        // 8. AGGRESSIVE MULTIPLE CLEARING SEQUENCE
        // Clear immediately
        setTimeout(() => {
            console.log('Clear 1 - completedTiles:', completedTiles);
            completedTiles = [];
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            drawBoard();
        }, 10);
        
        // Clear after 50ms
        setTimeout(() => {
            console.log('Clear 2 - completedTiles:', completedTiles);
            completedTiles = [];
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            drawBoard();
        }, 50);
        
        // Clear after 100ms
        setTimeout(() => {
            console.log('Clear 3 - completedTiles:', completedTiles);
            completedTiles = [];
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            drawBoard();
        }, 100);
        
        // Clear after 200ms
        setTimeout(() => {
            console.log('Clear 4 - completedTiles:', completedTiles);
            completedTiles = [];
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            drawBoard();
        }, 200);
        
        // 9. Restart game loop with final clearing
        setTimeout(() => {
            console.log('=== NEXT LEVEL TRANSITION END ===');
            console.log('Final - completedTiles:', completedTiles);
            console.log('Final - emptyPos:', emptyPos);
            gameRunning = true;
            isTransitioning = false;
            
            // RE-ENABLE GREEN HIGHLIGHTING
            disableGreenHighlighting = false;
            console.log('GLOBAL GREEN HIGHLIGHTING RE-ENABLED');
            
            // Final aggressive clear
            completedTiles = [];
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            drawBoard();
        }, 300);
        
    } else {
        // Show the game complete modal instead of an alert
        saveGameState(); // Save final state
        showFireworksCelebration(true);
    }
}

// Make nextLevel globally accessible
window.nextLevel = nextLevel;





// Function to completely clear all green highlighting
function clearAllGreenHighlighting() {
    console.log('Clearing all green highlighting...');
    completedTiles = [];
    completedTiles.length = 0;
    
    // Force multiple canvas clears and redraws
    for (let i = 0; i < 5; i++) {
        setTimeout(() => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            drawBoard();
        }, i * 50);
    }
}

// Make functions globally accessible
window.clearAllGreenHighlighting = clearAllGreenHighlighting;
window.newGame = newGame;
window.showHintConfirmation = showHintConfirmation;
window.showRulesModal = showRulesModal;

// Main menu navigation functions
window.startOriginalGame = startOriginalGame;
window.startTetrisGame = startTetrisGame;
window.showMainMenu = showMainMenu;
window.newTetrisGame = newTetrisGame;
window.showTetrisRulesModal = showTetrisRulesModal;
window.saveTetrisGameState = saveTetrisGameState;
window.loadTetrisGameState = loadTetrisGameState;
window.clearSavedTetrisGame = clearSavedTetrisGame;

// Main menu navigation functions
function showMainMenu() {
    document.getElementById('mainMenu').style.display = 'block';
    document.getElementById('originalGameContainer').style.display = 'none';
    document.getElementById('tetrisGameContainer').style.display = 'none';
}

function startOriginalGame() {
    // Set game mode to original
    currentGameMode = 'original';
    
    // Clean up any existing event listeners from tetris game
    const tetrisCanvas = document.getElementById('tetrisCanvas');
    if (tetrisCanvas) {
        tetrisCanvas.removeEventListener('click', handleTetrisInput);
        tetrisCanvas.removeEventListener('touchstart', handleTetrisInput);
    }
    
    document.getElementById('mainMenu').style.display = 'none';
    document.getElementById('originalGameContainer').style.display = 'block';
    document.getElementById('tetrisGameContainer').style.display = 'none';
    
    // Start the original game
    if (!window.originalGameStarted) {
        startGame();
        window.originalGameStarted = true;
    }
}

function startTetrisGame() {
    // Set game mode to tetris
    currentGameMode = 'tetris';
    
    // Clean up any existing event listeners from original game
    const originalCanvas = document.getElementById('gameCanvas');
    if (originalCanvas) {
        originalCanvas.removeEventListener('click', handleInput);
        originalCanvas.removeEventListener('touchstart', handleInput);
    }
    
    document.getElementById('mainMenu').style.display = 'none';
    document.getElementById('originalGameContainer').style.display = 'none';
    document.getElementById('tetrisGameContainer').style.display = 'block';
    
    // Force immediate canvas setup
    const tetrisCanvas = document.getElementById('tetrisCanvas');
    if (tetrisCanvas) {
        tetrisCanvas.width = 450;
        tetrisCanvas.height = 450;
        
        // Initialize global canvas variable for Tetris game
        canvas = tetrisCanvas;
        ctx = tetrisCanvas.getContext('2d');
        
        // Force immediate draw of empty board
        ctx.clearRect(0, 0, tetrisCanvas.width, tetrisCanvas.height);
        drawTetrisBoardBackground();
    } else {
        console.error('Tetris canvas not found');
        return;
    }
    
    // Start the tetris game
    startTetrisGameLogic();
    window.tetrisGameStarted = true;
}

function newTetrisGame() {
    // Clear any ongoing animations
    tetrisAnimating = false;
    tetrisAnimation = null;
    
    // Reset tetris game state
    window.tetrisGameStarted = false;
    tetrisUsedWords.clear(); // Reset used words for new game
    clearSavedTetrisGame(); // Clear saved state for new game
    
    // Reset game variables
    tetrisMoveCount = 0;
    tetrisWordsSolved = 0;
    tetrisGameRunning = true;
    tetrisCompletedTiles = [];
    
    // Reset board state to ensure proper initialization
    tetrisBoard = [];
    tetrisEmptyPos = { r: 6, c: 6 };
    
    // Update displays
    const moveCounterElement = document.getElementById('tetrisMoveCounter');
    const wordsSolvedElement = document.getElementById('wordsSolvedCounter');
    const targetWordsElement = document.getElementById('tetrisTargetWords');
    
    if (moveCounterElement) moveCounterElement.textContent = '0';
    if (wordsSolvedElement) wordsSolvedElement.textContent = '0';
    if (targetWordsElement) targetWordsElement.textContent = 'Loading...';
    
    startTetrisGame();
}



// Tetris Game Variables
let tetrisBoard = [];
let tetrisEmptyPos = { r: 6, c: 6 }; // Start with bottom-right empty
let tetrisMoveCount = 0;
let tetrisWordsSolved = 0;
let tetrisCurrentWord = '';
let tetrisGameRunning = false;
let tetrisAnimating = false;
let tetrisAnimation = null;
let tetrisCompletedTiles = []; // Track completed tiles like original game

// Tetris Game Functions
function startTetrisGameLogic() {
    // Ensure canvas is properly initialized
    const tetrisCanvas = document.getElementById('tetrisCanvas');
    if (!tetrisCanvas) {
        return;
    }
    
    // Ensure canvas has proper dimensions
    if (tetrisCanvas.width === 0 || tetrisCanvas.height === 0) {
        tetrisCanvas.width = 450;
        tetrisCanvas.height = 450;
    }
    
    // Try to load saved game state first
    const loadedState = loadTetrisGameState();
    
    if (!loadedState) {
        // Initialize tetris game state if no saved state
        tetrisMoveCount = 0;
        tetrisWordsSolved = 0;
        tetrisGameRunning = true;
        tetrisAnimating = false;
        tetrisAnimation = null;
        tetrisCompletedTiles = [];
        tetrisUsedWords.clear(); // Reset used words for new game
        
        // Generate initial tetris board
        generateTetrisBoard();
        
        // Force immediate draw
        drawTetrisBoard();
        
        // Also draw after a short delay to ensure it appears
        setTimeout(() => {
            drawTetrisBoard();
        }, 50);
    } else {
        // Update displays with loaded state
        const moveCounterElement = document.getElementById('tetrisMoveCounter');
        const wordsSolvedElement = document.getElementById('wordsSolvedCounter');
        const targetWordsElement = document.getElementById('tetrisTargetWords');
        
        if (moveCounterElement) moveCounterElement.textContent = tetrisMoveCount;
        if (wordsSolvedElement) wordsSolvedElement.textContent = tetrisWordsSolved;
        if (targetWordsElement) targetWordsElement.textContent = tetrisCurrentWord;
        
        // IMPORTANT: Clear any ongoing animations from saved state
        tetrisAnimating = false;
        tetrisAnimation = null;
        tetrisCompletedTiles = loadedState.tetrisCompletedTiles || [];
        
        // Force immediate draw for loaded state
        drawTetrisBoard();
        
        // Also draw after a short delay to ensure it appears
        setTimeout(() => {
            drawTetrisBoard();
        }, 50);
    }
    
    // Start tetris game loop
    updateTetrisGame();
    
    // Add event listeners for tetris canvas
    tetrisCanvas.addEventListener('click', handleTetrisInput);
    tetrisCanvas.addEventListener('touchstart', handleTetrisInput);
    
    // Test if the canvas is receiving events
    console.log(`Tetris canvas event listeners added`);
    console.log(`Tetris canvas dimensions: ${tetrisCanvas.width}x${tetrisCanvas.height}`);
    console.log(`Tetris canvas offset: ${tetrisCanvas.offsetWidth}x${tetrisCanvas.offsetHeight}`);
    console.log(`Tetris canvas style:`, tetrisCanvas.style);
}

function generateTetrisBoard() {
    // Initialize board with random letters (same as original game)
    tetrisBoard = [];
    for (let r = 0; r < 7; r++) {
        tetrisBoard[r] = [];
        for (let c = 0; c < 7; c++) {
            const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
            tetrisBoard[r][c] = letters[Math.floor(Math.random() * letters.length)];
        }
    }
    
    // Generate initial word
    generateNewTetrisWord();
    
    // Special case for first word: Create a one-move solution
    if (tetrisWordsSolved === 0) {
        createOneMoveSolution();
    } else {
        // For subsequent words, create empty space at bottom-right (same as original game)
        tetrisEmptyPos = { r: 6, c: 6 };
        tetrisBoard[6][6] = '';
    }
    
    // Validate board has exactly one empty space
    let emptyCount = 0;
    for (let r = 0; r < 7; r++) {
        for (let c = 0; c < 7; c++) {
            if (tetrisBoard[r][c] === '') {
                emptyCount++;
            }
        }
    }
    
    if (emptyCount !== 1) {
        console.warn(`Board validation failed: found ${emptyCount} empty spaces, fixing...`);
        // Ensure exactly one empty space at the expected position
        for (let r = 0; r < 7; r++) {
            for (let c = 0; c < 7; c++) {
                if (tetrisBoard[r][c] === '' && (r !== tetrisEmptyPos.r || c !== tetrisEmptyPos.c)) {
                    // Fill extra empty spaces with random letters
                    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
                    tetrisBoard[r][c] = letters[Math.floor(Math.random() * letters.length)];
                }
            }
        }
        // Ensure the expected empty position is actually empty
        tetrisBoard[tetrisEmptyPos.r][tetrisEmptyPos.c] = '';
    }
    
    console.log(`Board generated successfully with empty space at [${tetrisEmptyPos.r}][${tetrisEmptyPos.c}]`);
}

function createOneMoveSolution() {
    // Choose a simple 3-letter word for the first puzzle
    const firstWord = "CAT";
    tetrisCurrentWord = firstWord;
    
    // Update display
    const targetWordsElement = document.getElementById('tetrisTargetWords');
    if (targetWordsElement) {
        targetWordsElement.textContent = tetrisCurrentWord;
    } else {
        console.warn('tetrisTargetWords element not found in createOneMoveSolution');
    }
    
    // Place the word letters in positions that require only one move to complete
    // Place "CA" in the first two positions of row 0
    tetrisBoard[0][0] = 'C';
    tetrisBoard[0][1] = 'A';
    
    // Place "T" one cell away from its target position [0][2]
    // Place it at [0][3] so it can slide left one space to complete "CAT"
    tetrisBoard[0][3] = 'T';
    
    // Place empty space adjacent to the "T" at [0][2]
    tetrisBoard[0][2] = '';
    tetrisEmptyPos = { r: 0, c: 2 };
    
    // Fill the rest of the board with random letters
    for (let r = 0; r < 7; r++) {
        for (let c = 0; c < 7; c++) {
            if (tetrisBoard[r][c] === '' || 
                (r === 0 && c === 0) || 
                (r === 0 && c === 1) || 
                (r === 0 && c === 3)) {
                continue; // Skip positions we've already set
            }
            const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
            tetrisBoard[r][c] = letters[Math.floor(Math.random() * letters.length)];
        }
    }
    
    console.log(`Created one-move solution for word: ${firstWord}`);
    console.log(`Move the 'T' from [0][3] to [0][2] to complete 'CAT'`);
    console.log(`Empty space is at [${tetrisEmptyPos.r}][${tetrisEmptyPos.c}]`);
    console.log(`Board state after one-move setup:`, tetrisBoard);
}

function generateNewTetrisWord() {
    // Skip normal word generation for the first word if we're creating a one-move solution
    if (tetrisWordsSolved === 0) {
        console.log("Skipping normal word generation - using one-move solution for first word");
        return; // The one-move solution will be created in createOneMoveSolution()
    }
    
    // Analyze current board and generate a word that can be completed
    const availableLetters = getAvailableLetters();
    tetrisCurrentWord = selectWordFromLetters(availableLetters);
    
    // Update display
    const targetWordsElement = document.getElementById('tetrisTargetWords');
    if (targetWordsElement) {
        targetWordsElement.textContent = tetrisCurrentWord;
    } else {
        console.warn('tetrisTargetWords element not found in generateNewTetrisWord');
    }
    
    console.log(`New tetris word generated: ${tetrisCurrentWord}`);
}

function getAvailableLetters() {
    const letters = [];
    for (let r = 0; r < tetrisBoard.length; r++) {
        for (let c = 0; c < tetrisBoard[r].length; c++) {
            if (tetrisBoard[r][c] !== '') {
                letters.push(tetrisBoard[r][c]);
            }
        }
    }
    return letters;
}

// Track used words in Tetris game to avoid repetition
let tetrisUsedWords = new Set();

function selectWordFromLetters(availableLetters) {
    // Enhanced word selection with better fallback logic
    if (!availableLetters || availableLetters.length === 0) {
        console.warn('No available letters provided, using fallback word');
        return 'CAT';
    }
    
    // Filter words that can be made with available letters
    const possibleWords = WORD_BANK.filter(word => {
        const wordLetters = word.split('');
        const availableCopy = [...availableLetters];
        
        for (const letter of wordLetters) {
            const index = availableCopy.indexOf(letter);
            if (index === -1) return false;
            availableCopy.splice(index, 1);
        }
        return true;
    });
    
    console.log(`Found ${possibleWords.length} possible words from ${availableLetters.length} available letters`);
    
    // Filter out words that have been used recently
    const unusedWords = possibleWords.filter(word => !tetrisUsedWords.has(word));
    
    // If we have unused words, use one of those
    if (unusedWords.length > 0) {
        const selectedWord = unusedWords[Math.floor(Math.random() * unusedWords.length)];
        tetrisUsedWords.add(selectedWord);
        
        // If we've used 100 words, reset the used words set
        if (tetrisUsedWords.size >= 100) {
            tetrisUsedWords.clear();
        }
        
        console.log(`Selected unused word: ${selectedWord}`);
        return selectedWord;
    }
    
    // If all possible words have been used, clear the set and use any possible word
    if (possibleWords.length > 0) {
        tetrisUsedWords.clear();
        const selectedWord = possibleWords[Math.floor(Math.random() * possibleWords.length)];
        tetrisUsedWords.add(selectedWord);
        console.log(`Selected reused word after clearing: ${selectedWord}`);
        return selectedWord;
    }
    
    // If no words can be made with available letters, try to find a simple 3-letter word
    // that we can add letters for
    const simpleWords = ['CAT', 'DOG', 'BAT', 'RAT', 'HAT', 'MAT', 'SIT', 'RUN'];
    const selectedWord = simpleWords[Math.floor(Math.random() * simpleWords.length)];
    console.log(`No possible words found, using fallback: ${selectedWord}`);
    return selectedWord;
}

function handleTetrisInput(event) {
    console.log(`=== handleTetrisInput DEBUG ===`);
    console.log(`Event type: ${event.type}`);
    console.log(`tetrisGameRunning: ${tetrisGameRunning}`);
    
    if (!tetrisGameRunning) {
        console.log(`Game not running, ignoring input`);
        return;
    }
    
    event.preventDefault();
    
    const tetrisCanvas = document.getElementById('tetrisCanvas');
    if (!tetrisCanvas) {
        console.error('Tetris canvas not found in handleTetrisInput');
        return;
    }
    
    const rect = tetrisCanvas.getBoundingClientRect();
    
    // Handle both mouse and touch events properly
    let clientX, clientY;
    if (event.type === 'touchstart' && event.touches && event.touches.length > 0) {
        clientX = event.touches[0].clientX;
        clientY = event.touches[0].clientY;
    } else if (event.type === 'click') {
        clientX = event.clientX;
        clientY = event.clientY;
    } else {
        console.warn('Unsupported event type:', event.type);
        return;
    }
    
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    
    console.log(`Click coordinates: (${x}, ${y})`);
    console.log(`Canvas rect:`, rect);
    
    const cell = getTetrisCellFromCoords(x, y);
    console.log(`Detected cell:`, cell);
    
    if (cell) {
        console.log(`Calling tryTetrisMove with cell [${cell.r}][${cell.c}]`);
        tryTetrisMove(cell.r, cell.c);
    } else {
        console.log(`No cell detected at coordinates (${x}, ${y})`);
    }
}

function getTetrisCellFromCoords(x, y) {
    // Scale coordinates to match actual canvas size with better error handling
    const tetrisCanvas = document.getElementById('tetrisCanvas');
    
    // Guard against missing canvas
    if (!tetrisCanvas) {
        console.error('Tetris canvas not found');
        return null;
    }
    
    // Handle division by zero and invalid dimensions
    const offsetWidth = tetrisCanvas.offsetWidth || tetrisCanvas.width;
    const offsetHeight = tetrisCanvas.offsetHeight || tetrisCanvas.height;
    
    if (offsetWidth <= 0 || offsetHeight <= 0) {
        console.error('Invalid canvas dimensions:', { width: tetrisCanvas.width, height: tetrisCanvas.height, offsetWidth, offsetHeight });
        return null;
    }
    
    const scaleX = tetrisCanvas.width / offsetWidth;
    const scaleY = tetrisCanvas.height / offsetHeight;
    const scaledX = x * scaleX;
    const scaledY = y * scaleY;
    
    const cellSize = tetrisCanvas.width / 7;
    const c = Math.floor(scaledX / cellSize);
    const r = Math.floor(scaledY / cellSize);
    
    console.log(`getTetrisCellFromCoords: input(${x}, ${y}) -> scaled(${scaledX}, ${scaledY}) -> cell[${r}][${c}]`);
    console.log(`Canvas dimensions: ${tetrisCanvas.width}x${tetrisCanvas.height}, offset: ${offsetWidth}x${offsetHeight}`);
    console.log(`Scale factors: scaleX=${scaleX}, scaleY=${scaleY}, cellSize=${cellSize}`);
    
    if (r >= 0 && r < 7 && c >= 0 && c < 7) {
        console.log(`Valid cell detected: [${r}][${c}]`);
        return { r, c };
    }
    console.log(`Invalid cell coordinates: [${r}][${c}] (out of bounds)`);
    return null;
}

function tryTetrisMove(r, c) {
    console.log(`=== tryTetrisMove DEBUG ===`);
    console.log(`tryTetrisMove called with (${r}, ${c})`);
    console.log(`Current tetrisEmptyPos: [${tetrisEmptyPos.r}][${tetrisEmptyPos.c}]`);
    console.log(`Board at clicked position: '${tetrisBoard[r][c]}'`);
    console.log(`tetrisAnimating: ${tetrisAnimating}`);
    console.log(`tetrisAnimation:`, tetrisAnimation);
    console.log(`tetrisGameRunning: ${tetrisGameRunning}`);
    console.log(`tetrisCompletedTiles length: ${tetrisCompletedTiles.length}`);
    
    // Check if game is running and not animating
    if (!tetrisGameRunning) {
        console.log(`Game not running, ignoring move`);
        return;
    }
    
    if (tetrisAnimating) {
        console.log(`Game is animating, ignoring move`);
        return;
    }
    
    // Check if the tile being moved is part of a completed word
    if (tetrisCompletedTiles.some(tile => tile.r === r && tile.c === c)) {
        console.log(`Tile is part of completed word, cannot move`);
        return; // Don't allow moving tiles from completed words
    }
    
    // Check if clicking on empty cell itself
    if (r === tetrisEmptyPos.r && c === tetrisEmptyPos.c) {
        console.log(`Clicked on empty cell - nothing to move`);
        return;
    }
    
    const dr = Math.abs(r - tetrisEmptyPos.r);
    const dc = Math.abs(c - tetrisEmptyPos.c);
    console.log(`Distance: dr=${dr}, dc=${dc}`);
    console.log(`Can move: ${(dr === 1 && dc === 0) || (dr === 0 && dc === 1)}`);
    
    if ((dr === 1 && dc === 0) || (dr === 0 && dc === 1)) {
        // Valid move - start sliding animation (same as original game)
        const letter = tetrisBoard[r][c];
        console.log(`Starting move animation: '${letter}' from [${r}][${c}] to [${tetrisEmptyPos.r}][${tetrisEmptyPos.c}]`);
        
        tetrisAnimating = true;
        tetrisAnimation = {
            from: { r, c },
            to: { r: tetrisEmptyPos.r, c: tetrisEmptyPos.c },
            letter: letter,
            progress: 0,
            duration: 8 // frames (same as original game)
        };
        
        tetrisMoveCount++;
        const moveCounterElement = document.getElementById('tetrisMoveCounter');
        if (moveCounterElement) {
            moveCounterElement.textContent = tetrisMoveCount;
        } else {
            console.warn('tetrisMoveCounter element not found');
        }
        saveTetrisGameState();
    } else {
        console.log(`Invalid move - not adjacent to empty space`);
    }
}

function checkTetrisWordCompletion() {
    // Don't check if game is not running
    if (!tetrisGameRunning) {
        return;
    }
    
    // Don't check for word completion if we're already in a word completion animation
    if (tetrisAnimating && tetrisAnimation && tetrisAnimation.isWordCompletion) {
        return;
    }
    
    const word = tetrisCurrentWord;
    console.log(`Checking for word completion: "${word}"`);
    
    // Check horizontal completion
    for (let r = 0; r < 7; r++) {
        for (let c = 0; c <= 7 - word.length; c++) {
            let found = true;
            for (let i = 0; i < word.length; i++) {
                if (tetrisBoard[r][c + i] !== word[i]) {
                    found = false;
                    break;
                }
            }
            if (found) {
                console.log(`Found horizontal word completion at row ${r}, col ${c}`);
                completeTetrisWord(r, c, 'horizontal');
                return;
            }
        }
    }
    
    // Check vertical completion
    for (let r = 0; r <= 7 - word.length; r++) {
        for (let c = 0; c < 7; c++) {
            let found = true;
            for (let i = 0; i < word.length; i++) {
                if (tetrisBoard[r + i][c] !== word[i]) {
                    found = false;
                    break;
                }
            }
            if (found) {
                console.log(`Found vertical word completion at row ${r}, col ${c}`);
                completeTetrisWord(r, c, 'vertical');
                return;
            }
        }
    }
}

function completeTetrisWord(startRow, startCol, direction) {
    tetrisWordsSolved++;
    const wordsSolvedElement = document.getElementById('wordsSolvedCounter');
    if (wordsSolvedElement) {
        wordsSolvedElement.textContent = tetrisWordsSolved;
    } else {
        console.warn('wordsSolvedCounter element not found');
    }
    
    // Mark completed tiles for blinking animation
    const completedTiles = [];
    for (let i = 0; i < tetrisCurrentWord.length; i++) {
        const r = direction === 'horizontal' ? startRow : startRow + i;
        const c = direction === 'horizontal' ? startCol + i : startCol;
        completedTiles.push({ r, c, letter: tetrisCurrentWord[i] });
    }
    
    // Store the original positions where letters were before being moved
    // This is needed for the new letters animation to fill the correct cells
    const originalPositions = [];
    for (let i = 0; i < tetrisCurrentWord.length; i++) {
        const r = direction === 'horizontal' ? startRow : startRow + i;
        const c = direction === 'horizontal' ? startCol + i : startCol;
        originalPositions.push({ r, c, letter: tetrisCurrentWord[i] });
    }
    
    // Store original positions globally for use in new letters animation
    window.tetrisOriginalWordPositions = originalPositions;
    
    console.log(`Word completed: ${tetrisCurrentWord} at positions:`, completedTiles);
    console.log(`Original positions for new letters:`, originalPositions);
    
    // Start blinking animation first, then dissolving
    console.log('=== STARTING WORD COMPLETION ANIMATION SEQUENCE ===');
    console.log(`Word completed: ${tetrisCurrentWord}`);
    console.log(`Completed tiles:`, completedTiles);
    startBlinkingAnimation(completedTiles);
    
    // Save game state
    saveTetrisGameState();
}

function startBlinkingAnimation(completedTiles) {
    // Set animation flag to prevent further word completion checks
    tetrisAnimating = true;
    tetrisAnimation = { isBlinking: true };
    
    const blinkDuration = 2000; // 2 seconds
    const blinkInterval = 300; // Blink every 300ms
    const startTime = Date.now();
    
    // Create the animation function that will be called by the main game loop
    function animateBlinking() {
        const currentTime = Date.now();
        const elapsed = currentTime - startTime;
        
        if (elapsed < blinkDuration) {
            // Continue blinking
            const tetrisCanvas = document.getElementById('tetrisCanvas');
            const ctx = tetrisCanvas.getContext('2d');
            
            // Clear canvas and draw the full board normally
            ctx.clearRect(0, 0, tetrisCanvas.width, tetrisCanvas.height);
            
            // Draw the board background first
            drawTetrisBoardBackground();
            
            // Draw all tiles normally, but skip the completed tiles
            const cellSize = tetrisCanvas.width / 7;
            for (let r = 0; r < 7; r++) {
                for (let c = 0; c < 7; c++) {
                    const letter = tetrisBoard[r][c];
                    if (letter !== '') {
                        // Check if this tile is part of the completed word
                        const isCompletedTile = completedTiles.some(tile => tile.r === r && tile.c === c);
                        if (!isCompletedTile) {
                            // Draw normal tile using the same enhanced 3D style as the normal board
                            const x = c * cellSize;
                            const y = r * cellSize;
                            
                            // Draw enhanced 3D block tile
                            const blockHeight = 18; // Much more pronounced 3D effect
                            
                            // Draw enhanced bottom shadow with multiple layers
                            ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
                            ctx.fillRect(x + blockHeight, y + blockHeight, cellSize - 4, cellSize - 4);
                            
                            // Draw additional shadow layers for extreme depth
                            ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
                            ctx.fillRect(x + blockHeight - 3, y + blockHeight - 3, cellSize - 4, cellSize - 4);
                            
                            ctx.fillStyle = "rgba(0, 0, 0, 0.2)";
                            ctx.fillRect(x + blockHeight - 6, y + blockHeight - 6, cellSize - 4, cellSize - 4);
                            
                            // Draw right side of block with enhanced 3D
                            ctx.fillStyle = "#A0522D";
                            ctx.beginPath();
                            ctx.moveTo(x + cellSize - 4, y);
                            ctx.lineTo(x + cellSize - 4 + blockHeight, y + blockHeight);
                            ctx.lineTo(x + cellSize - 4 + blockHeight, y + cellSize - 4 + blockHeight);
                            ctx.lineTo(x + cellSize - 4, y + cellSize - 4);
                            ctx.closePath();
                            ctx.fill();
                            
                            // Draw bottom side of block with enhanced 3D
                            ctx.fillStyle = "#8B4513";
                            ctx.beginPath();
                            ctx.moveTo(x, y + cellSize - 4);
                            ctx.lineTo(x + cellSize - 4, y + cellSize - 4);
                            ctx.lineTo(x + cellSize - 4 + blockHeight, y + cellSize - 4 + blockHeight);
                            ctx.lineTo(x + blockHeight, y + cellSize - 4 + blockHeight);
                            ctx.closePath();
                            ctx.fill();
                            
                            // Add intense highlight on top edge for dramatic 3D effect
                            ctx.strokeStyle = "#FFFFFF";
                            ctx.lineWidth = 3;
                            ctx.beginPath();
                            ctx.moveTo(x, y);
                            ctx.lineTo(x + cellSize - 4, y);
                            ctx.stroke();
                            
                            // Add intense highlight on left edge for dramatic 3D effect
                            ctx.beginPath();
                            ctx.moveTo(x, y);
                            ctx.lineTo(x, y + cellSize - 4);
                            ctx.stroke();
                            
                            // Add secondary highlight for extra depth
                            ctx.strokeStyle = "#F5DEB3";
                            ctx.lineWidth = 1;
                            ctx.beginPath();
                            ctx.moveTo(x + 1, y + 1);
                            ctx.lineTo(x + cellSize - 5, y + 1);
                            ctx.stroke();
                            
                            ctx.beginPath();
                            ctx.moveTo(x + 1, y + 1);
                            ctx.lineTo(x + 1, y + cellSize - 5);
                            ctx.stroke();
                            
                            // Draw main face of block
                            const tileGradient = ctx.createLinearGradient(x, y, x + cellSize, y + cellSize);
                            tileGradient.addColorStop(0, "#F5DEB3"); // Wheat
                            tileGradient.addColorStop(0.3, "#DEB887"); // Burlywood
                            tileGradient.addColorStop(0.7, "#D2B48C"); // Tan
                            tileGradient.addColorStop(1, "#BC8F8F"); // Rosy brown
                            
                            ctx.fillStyle = tileGradient;
                            ctx.fillRect(x, y, cellSize - 4, cellSize - 4);
                            
                            // Add wood grain to tile
                            ctx.strokeStyle = "#CD853F";
                            ctx.lineWidth = 0.5;
                            for (let i = 0; i < 3; i++) {
                                ctx.beginPath();
                                ctx.moveTo(x + 5 + i * 8, y + 5);
                                ctx.lineTo(x + 8 + i * 8, y + cellSize - 9);
                                ctx.stroke();
                            }
                            
                            // Draw letter with clean 3D effect
                            ctx.save();
                            ctx.font = `bold ${cellSize / 2.5}px Arial`;
                            ctx.textAlign = "center";
                            ctx.textBaseline = "middle";
                            ctx.fillStyle = "#654321"; // Darker brown
                            ctx.shadowColor = "transparent";
                            ctx.shadowBlur = 0;
                            ctx.shadowOffsetX = 0;
                            ctx.shadowOffsetY = 0;
                            ctx.fillText(
                                letter,
                                x + (cellSize - 4) / 2,
                                y + (cellSize - 4) / 2
                            );
                            ctx.restore();
                            
                            // Add subtle highlight to letter (darker)
                            ctx.save();
                            ctx.font = `bold ${cellSize / 2.5}px Arial`;
                            ctx.textAlign = "center";
                            ctx.textBaseline = "middle";
                            ctx.fillStyle = "#8B4513";
                            ctx.shadowColor = "transparent";
                            ctx.shadowBlur = 0;
                            ctx.shadowOffsetX = 0;
                            ctx.shadowOffsetY = 0;
                            ctx.fillText(
                                letter,
                                x + (cellSize - 4) / 2 - 1,
                                y + (cellSize - 4) / 2 - 1
                            );
                            ctx.restore();
                        }
                    }
                }
            }
            
            // Calculate blink state (on/off every 300ms)
            const blinkState = Math.floor(elapsed / blinkInterval) % 2 === 0;
            
            if (blinkState) {
                // Draw enhanced green glow effect for completed tiles on top
                for (const tile of completedTiles) {
                    const x = tile.c * cellSize;
                    const y = tile.r * cellSize;
                    
                    // Add intense green glow
                    ctx.save();
                    ctx.shadowColor = "#00FF00";
                    ctx.shadowBlur = 20;
                    ctx.shadowOffsetX = 0;
                    ctx.shadowOffsetY = 0;
                    
                    // Draw glowing green tile with enhanced 3D effect
                    const blockHeight = 18;
                    
                    // Enhanced green gradient for blinking
                    const tileGradient = ctx.createLinearGradient(x, y, x + cellSize, y + cellSize);
                    tileGradient.addColorStop(0, "#90EE90"); // Light green
                    tileGradient.addColorStop(0.3, "#32CD32"); // Lime green
                    tileGradient.addColorStop(0.7, "#228B22"); // Forest green
                    tileGradient.addColorStop(1, "#006400"); // Dark green
                    
                    // Draw 3D green block
                    ctx.fillStyle = tileGradient;
                    ctx.fillRect(x, y, cellSize - 4, cellSize - 4);
                    
                    // Draw right side of green block
                    ctx.fillStyle = "#228B22";
                    ctx.beginPath();
                    ctx.moveTo(x + cellSize - 4, y);
                    ctx.lineTo(x + cellSize - 4 + blockHeight, y + blockHeight);
                    ctx.lineTo(x + cellSize - 4 + blockHeight, y + cellSize - 4 + blockHeight);
                    ctx.lineTo(x + cellSize - 4, y + cellSize - 4);
                    ctx.closePath();
                    ctx.fill();
                    
                    // Draw bottom side of green block
                    ctx.fillStyle = "#006400";
                    ctx.beginPath();
                    ctx.moveTo(x, y + cellSize - 4);
                    ctx.lineTo(x + cellSize - 4, y + cellSize - 4);
                    ctx.lineTo(x + cellSize - 4 + blockHeight, y + cellSize - 4 + blockHeight);
                    ctx.lineTo(x + blockHeight, y + cellSize - 4 + blockHeight);
                    ctx.closePath();
                    ctx.fill();
                    
                    // Add bright green border
                    ctx.strokeStyle = "#00FF00";
                    ctx.lineWidth = 4;
                    ctx.strokeRect(x, y, cellSize - 4, cellSize - 4);
                    
                    // Draw letter with enhanced visibility
                    ctx.font = `bold ${cellSize / 2.5}px Arial`;
                    ctx.textAlign = "center";
                    ctx.textBaseline = "middle";
                    ctx.fillStyle = "#FFFFFF";
                    ctx.shadowColor = "#000000";
                    ctx.shadowBlur = 3;
                    ctx.shadowOffsetX = 1;
                    ctx.shadowOffsetY = 1;
                    ctx.fillText(
                        tile.letter,
                        x + (cellSize - 4) / 2,
                        y + (cellSize - 4) / 2
                    );
                    
                    ctx.restore();
                }
            }
        } else {
            // Blinking complete, start explosion animation
            console.log('Blinking animation complete, starting explosion...');
            
            // Clear animation flags temporarily
            tetrisAnimating = false;
            tetrisAnimation = null;
            
            // Start explosion animation (tiles will be removed during explosion)
            startExplosionAnimation(completedTiles);
        }
    }
    
    // Store the animation function so the main game loop can call it
    tetrisAnimation.animateFunction = animateBlinking;
}

function startExplosionAnimation(completedTiles) {
    // Set animation flag to prevent further word completion checks
    tetrisAnimating = true;
    tetrisAnimation = { isExplosion: true };
    
    const explosionDuration = 2000; // 2 seconds for more dramatic explosion
    const startTime = Date.now();
    
    // Create explosion particles for each completed tile
    const explosionParticles = [];
    for (const tile of completedTiles) {
        const particleCount = 20; // More particles per tile for dramatic effect
        for (let i = 0; i < particleCount; i++) {
            const angle = (i / particleCount) * Math.PI * 2;
            const speed = 5 + Math.random() * 8; // Much faster particles
            const tetrisCanvas = document.getElementById('tetrisCanvas');
            explosionParticles.push({
                x: tile.c * (tetrisCanvas.width / 7) + (tetrisCanvas.width / 7) / 2,
                y: tile.r * (tetrisCanvas.height / 7) + (tetrisCanvas.height / 7) / 2,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                color: ['#FFD700', '#FFA500', '#FF6347', '#FF4500', '#FF0000', '#FF1493', '#00FFFF', '#00FF00'][Math.floor(Math.random() * 8)],
                size: 6 + Math.random() * 10, // Much larger particles
                alpha: 1,
                startTime: Date.now(),
                rotation: Math.random() * Math.PI * 2,
                rotationSpeed: (Math.random() - 0.5) * 0.2
            });
        }
    }
    
    // Create the animation function that will be called by the main game loop
    function animateExplosion() {
        const currentTime = Date.now();
        const tetrisCanvas = document.getElementById('tetrisCanvas');
        const ctx = tetrisCanvas.getContext('2d');
        const cellSize = tetrisCanvas.width / 7;
        
        // Clear canvas and draw the board WITHOUT the completed tiles
        ctx.clearRect(0, 0, tetrisCanvas.width, tetrisCanvas.height);
        
        // Draw the board background and all tiles EXCEPT the completed ones
        drawTetrisBoardBackground();
        
        // Draw all tiles except the completed ones (no animation effects)
        for (let r = 0; r < 7; r++) {
            for (let c = 0; c < 7; c++) {
                // Skip drawing completed tiles - they will be drawn with explosion effect
                const isCompleted = completedTiles.some(tile => tile.r === r && tile.c === c);
                if (!isCompleted && tetrisBoard[r][c] !== '') {
                    // Draw tile normally using the same enhanced 3D style as the normal board
                    const x = c * cellSize;
                    const y = r * cellSize;
                    
                    // Draw enhanced 3D block tile
                    const blockHeight = 18; // Much more pronounced 3D effect
                    
                    // Draw enhanced bottom shadow with multiple layers
                    ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
                    ctx.fillRect(x + blockHeight, y + blockHeight, cellSize - 4, cellSize - 4);
                    
                    // Draw additional shadow layers for extreme depth
                    ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
                    ctx.fillRect(x + blockHeight - 3, y + blockHeight - 3, cellSize - 4, cellSize - 4);
                    
                    ctx.fillStyle = "rgba(0, 0, 0, 0.2)";
                    ctx.fillRect(x + blockHeight - 6, y + blockHeight - 6, cellSize - 4, cellSize - 4);
                    
                    // Draw right side of block with enhanced 3D
                    ctx.fillStyle = "#A0522D";
                    ctx.beginPath();
                    ctx.moveTo(x + cellSize - 4, y);
                    ctx.lineTo(x + cellSize - 4 + blockHeight, y + blockHeight);
                    ctx.lineTo(x + cellSize - 4 + blockHeight, y + cellSize - 4 + blockHeight);
                    ctx.lineTo(x + cellSize - 4, y + cellSize - 4);
                    ctx.closePath();
                    ctx.fill();
                    
                    // Draw bottom side of block with enhanced 3D
                    ctx.fillStyle = "#8B4513";
                    ctx.beginPath();
                    ctx.moveTo(x, y + cellSize - 4);
                    ctx.lineTo(x + cellSize - 4, y + cellSize - 4);
                    ctx.lineTo(x + cellSize - 4 + blockHeight, y + cellSize - 4 + blockHeight);
                    ctx.lineTo(x + blockHeight, y + cellSize - 4 + blockHeight);
                    ctx.closePath();
                    ctx.fill();
                    
                    // Add intense highlight on top edge for dramatic 3D effect
                    ctx.strokeStyle = "#FFFFFF";
                    ctx.lineWidth = 3;
                    ctx.beginPath();
                    ctx.moveTo(x, y);
                    ctx.lineTo(x + cellSize - 4, y);
                    ctx.stroke();
                    
                    // Add intense highlight on left edge for dramatic 3D effect
                    ctx.beginPath();
                    ctx.moveTo(x, y);
                    ctx.lineTo(x, y + cellSize - 4);
                    ctx.stroke();
                    
                    // Add secondary highlight for extra depth
                    ctx.strokeStyle = "#F5DEB3";
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    ctx.moveTo(x + 1, y + 1);
                    ctx.lineTo(x + cellSize - 5, y + 1);
                    ctx.stroke();
                    
                    ctx.beginPath();
                    ctx.moveTo(x + 1, y + 1);
                    ctx.lineTo(x + 1, y + cellSize - 5);
                    ctx.stroke();
                    
                    // Draw main face of block
                    const tileGradient = ctx.createLinearGradient(x, y, x + cellSize, y + cellSize);
                    tileGradient.addColorStop(0, "#F5DEB3"); // Wheat
                    tileGradient.addColorStop(0.3, "#DEB887"); // Burlywood
                    tileGradient.addColorStop(0.7, "#D2B48C"); // Tan
                    tileGradient.addColorStop(1, "#BC8F8F"); // Rosy brown
                    
                    ctx.fillStyle = tileGradient;
                    ctx.fillRect(x, y, cellSize - 4, cellSize - 4);
                    
                    // Add wood grain to tile
                    ctx.strokeStyle = "#CD853F";
                    ctx.lineWidth = 0.5;
                    for (let i = 0; i < 3; i++) {
                        ctx.beginPath();
                        ctx.moveTo(x + 5 + i * 8, y + 5);
                        ctx.lineTo(x + 8 + i * 8, y + cellSize - 9);
                        ctx.stroke();
                    }
                    
                    // Draw letter with clean 3D effect
                    ctx.save();
                    ctx.font = `bold ${cellSize / 2.5}px Arial`;
                    ctx.textAlign = "center";
                    ctx.textBaseline = "middle";
                    ctx.fillStyle = "#654321"; // Darker brown
                    ctx.shadowColor = "transparent";
                    ctx.shadowBlur = 0;
                    ctx.shadowOffsetX = 0;
                    ctx.shadowOffsetY = 0;
                    ctx.fillText(
                        tetrisBoard[r][c],
                        x + (cellSize - 4) / 2,
                        y + (cellSize - 4) / 2
                    );
                    ctx.restore();
                    
                    // Add subtle highlight to letter (darker)
                    ctx.save();
                    ctx.font = `bold ${cellSize / 2.5}px Arial`;
                    ctx.textAlign = "center";
                    ctx.textBaseline = "middle";
                    ctx.fillStyle = "#8B4513";
                    ctx.shadowColor = "transparent";
                    ctx.shadowBlur = 0;
                    ctx.shadowOffsetX = 0;
                    ctx.shadowOffsetY = 0;
                    ctx.fillText(
                        tetrisBoard[r][c],
                        x + (cellSize - 4) / 2 - 1,
                        y + (cellSize - 4) / 2 - 1
                    );
                    ctx.restore();
                }
            }
        }
        
        // Draw crumbling tiles with dramatic explosion effect
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / explosionDuration, 1);
        
        // Draw the completed tiles with dramatic crumbling effect
        for (const tile of completedTiles) {
            const tileX = tile.c * cellSize;
            const tileY = tile.r * cellSize;
            
            // Calculate dramatic crumbling effect
            const shakeIntensity = Math.sin(progress * Math.PI * 12) * (1 - progress) * 8; // More intense shaking
            const scale = 1 - progress * 0.5; // Tiles shrink more dramatically
            const rotation = progress * Math.PI * 2; // Full rotation as they crumble
            const wobble = Math.sin(progress * Math.PI * 6) * (1 - progress) * 5; // Wobble effect
            
            ctx.save();
            ctx.translate(tileX + cellSize / 2 + shakeIntensity, tileY + cellSize / 2 + wobble);
            ctx.rotate(rotation);
            ctx.scale(scale, scale);
            
            // Draw crumbling tile with explosion colors and effects
            const alpha = 1 - progress * 0.8; // Fade out more dramatically
            ctx.globalAlpha = alpha;
            
            // Create dramatic explosion gradient
            const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, cellSize / 2);
            const colors = ['#FFD700', '#FFA500', '#FF6347', '#FF4500', '#FF0000', '#FF1493'];
            const colorIndex = Math.floor(progress * colors.length);
            const currentColor = colors[colorIndex] || colors[colors.length - 1];
            gradient.addColorStop(0, currentColor);
            gradient.addColorStop(0.5, '#FFD700');
            gradient.addColorStop(1, '#FF0000');
            
            ctx.fillStyle = gradient;
            ctx.fillRect(-cellSize / 2 + 2, -cellSize / 2 + 2, cellSize - 4, cellSize - 4);
            
            // Add explosion glow effect
            ctx.shadowColor = currentColor;
            ctx.shadowBlur = 15;
            ctx.strokeStyle = '#FFFFFF';
            ctx.lineWidth = 3;
            ctx.strokeRect(-cellSize / 2 + 2, -cellSize / 2 + 2, cellSize - 4, cellSize - 4);
            
            // Draw letter with dramatic effect
            ctx.shadowBlur = 0;
            ctx.fillStyle = '#FFFFFF';
            ctx.font = `bold ${Math.floor(cellSize * 0.7)}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(tile.letter, 0, 0);
            
            // Add inner glow to letter
            ctx.shadowColor = '#FFD700';
            ctx.shadowBlur = 5;
            ctx.fillStyle = '#FFFF00';
            ctx.fillText(tile.letter, 0, 0);
            
            ctx.restore();
        }
        
        // Animate explosion particles
        let allExploded = true;
        for (const particle of explosionParticles) {
            const elapsed = currentTime - particle.startTime;
            const progress = Math.min(elapsed / explosionDuration, 1);
            
            if (progress < 1) {
                allExploded = false;
                
                // Update particle position
                particle.x += particle.vx;
                particle.y += particle.vy;
                particle.vy += 0.2; // Stronger gravity effect
                particle.alpha = 1 - progress;
                particle.rotation += particle.rotationSpeed;
                
                // Draw particle with enhanced effects
                ctx.save();
                ctx.globalAlpha = particle.alpha;
                ctx.translate(particle.x, particle.y);
                ctx.rotate(particle.rotation);
                
                // Draw particle with glow effect
                ctx.shadowColor = particle.color;
                ctx.shadowBlur = 10;
                ctx.fillStyle = particle.color;
                ctx.beginPath();
                ctx.arc(0, 0, particle.size, 0, Math.PI * 2);
                ctx.fill();
                
                // Add inner highlight
                ctx.shadowBlur = 0;
                ctx.fillStyle = '#FFFFFF';
                ctx.beginPath();
                ctx.arc(0, 0, particle.size * 0.3, 0, Math.PI * 2);
                ctx.fill();
                
                ctx.restore();
            }
        }
        
        if (!allExploded) {
            requestAnimationFrame(animateExplosion);
        } else {
            // Explosion complete, remove tiles and start new letters animation
            console.log(`Explosion complete - removing tiles and starting new letters animation`);
            
            // Remove the completed tiles from the board after explosion
            for (const tile of completedTiles) {
                tetrisBoard[tile.r][tile.c] = '';
                console.log(`Removed tile '${tile.letter}' from [${tile.r}][${tile.c}] after explosion`);
            }
            
            // Clear animation flags and completed tiles array
            tetrisAnimating = false;
            tetrisAnimation = null;
            tetrisCompletedTiles = []; // Clear completed tiles so game works again
            
            console.log(`Cleared tetrisCompletedTiles array - game should be playable again`);
            
            // Start new letters animation after 500ms delay
            setTimeout(() => {
                startNewLettersAnimation(completedTiles);
            }, 500);
        }
    }
    
    // Store the animation function so the main game loop can call it
    tetrisAnimation.animateFunction = animateExplosion;
}

function startDissolvingAnimation(completedTiles) {
    // Set animation flag to prevent further word completion checks
    tetrisAnimating = true;
    tetrisAnimation = { isDissolving: true };
    
    const dissolvingTiles = completedTiles.map(tile => ({
        ...tile,
        alpha: 1,
        startTime: Date.now(),
        rotation: 0,
        scale: 1
    }));
    
    const dissolveDuration = 2500; // 2.5 seconds for more dramatic effect
    
    function animateDissolving() {
        const currentTime = Date.now();
        const tetrisCanvas = document.getElementById('tetrisCanvas');
        const ctx = tetrisCanvas.getContext('2d');
        const cellSize = tetrisCanvas.width / 7;
        
        // Clear canvas and draw the full board
        ctx.clearRect(0, 0, tetrisCanvas.width, tetrisCanvas.height);
        drawTetrisBoard();
        
        // Animate dissolving tiles on top
        let allDissolved = true;
        for (const tile of dissolvingTiles) {
            const elapsed = currentTime - tile.startTime;
            const progress = Math.min(elapsed / dissolveDuration, 1);
            
            if (progress < 1) {
                allDissolved = false;
                
                // Enhanced dissolve effects
                tile.alpha = 1 - progress;
                tile.rotation = progress * Math.PI * 2; // Full rotation
                tile.scale = 1 + progress * 0.5; // Scale up as it dissolves
                
                // Draw dissolving tile with enhanced effects
                drawDissolvingTile(ctx, tile, cellSize);
            }
        }
        
        if (!allDissolved) {
            requestAnimationFrame(animateDissolving);
        } else {
            // Animation complete - remove tiles from board
            console.log('Dissolving animation complete, removing tiles from board');
            for (const tile of completedTiles) {
                tetrisBoard[tile.r][tile.c] = '';
                console.log(`Removed tile '${tile.letter}' from [${tile.r}][${tile.c}]`);
            }
            
            // Clear animation flags
            tetrisAnimating = false;
            tetrisAnimation = null;
            
            // Start new letters animation to fill the empty spaces
            console.log('Starting new letters animation...');
            startNewLettersAnimation(completedTiles);
        }
    }
    
    animateDissolving();
}

function drawDissolvingTile(ctx, tile, cellSize) {
    const x = tile.c * cellSize;
    const y = tile.r * cellSize;
    
    ctx.save();
    ctx.globalAlpha = tile.alpha;
    
    // Apply rotation and scale transformations
    const centerX = x + (cellSize - 4) / 2;
    const centerY = y + (cellSize - 4) / 2;
    ctx.translate(centerX, centerY);
    ctx.rotate(tile.rotation);
    ctx.scale(tile.scale, tile.scale);
    ctx.translate(-centerX, -centerY);
    
    // Add particle effects for dissolving
    if (tile.alpha < 0.8) {
        const particleCount = Math.floor((1 - tile.alpha) * 10);
        for (let i = 0; i < particleCount; i++) {
            const particleX = x + Math.random() * (cellSize - 4);
            const particleY = y + Math.random() * (cellSize - 4);
            const particleSize = Math.random() * 4 + 2;
            
            ctx.fillStyle = `rgba(255, 215, 0, ${tile.alpha * 0.8})`;
            ctx.beginPath();
            ctx.arc(particleX, particleY, particleSize, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
    // Draw enhanced 3D block tile with dissolving effect
    const blockHeight = 18;
    
    // Draw enhanced bottom shadow with multiple layers
    ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
    ctx.fillRect(x + blockHeight, y + blockHeight, cellSize - 4, cellSize - 4);
    
    ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
    ctx.fillRect(x + blockHeight - 3, y + blockHeight - 3, cellSize - 4, cellSize - 4);
    
    ctx.fillStyle = "rgba(0, 0, 0, 0.2)";
    ctx.fillRect(x + blockHeight - 6, y + blockHeight - 6, cellSize - 4, cellSize - 4);
    
    // Draw right side of block with enhanced 3D
    ctx.fillStyle = "#A0522D";
    ctx.beginPath();
    ctx.moveTo(x + cellSize - 4, y);
    ctx.lineTo(x + cellSize - 4 + blockHeight, y + blockHeight);
    ctx.lineTo(x + cellSize - 4 + blockHeight, y + cellSize - 4 + blockHeight);
    ctx.lineTo(x + cellSize - 4, y + cellSize - 4);
    ctx.closePath();
    ctx.fill();
    
    // Draw bottom side of block with enhanced 3D
    ctx.fillStyle = "#8B4513";
    ctx.beginPath();
    ctx.moveTo(x, y + cellSize - 4);
    ctx.lineTo(x + cellSize - 4, y + cellSize - 4);
    ctx.lineTo(x + cellSize - 4 + blockHeight, y + cellSize - 4 + blockHeight);
    ctx.lineTo(x + blockHeight, y + cellSize - 4 + blockHeight);
    ctx.closePath();
    ctx.fill();
    
    // Add intense highlight on top edge for dramatic 3D effect
    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + cellSize - 4, y);
    ctx.stroke();
    
    // Add intense highlight on left edge for dramatic 3D effect
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x, y + cellSize - 4);
    ctx.stroke();
    
    // Add secondary highlight for extra depth
    ctx.strokeStyle = "#F5DEB3";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x + 1, y + 1);
    ctx.lineTo(x + cellSize - 5, y + 1);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(x + 1, y + 1);
    ctx.lineTo(x + 1, y + cellSize - 5);
    ctx.stroke();
    
    // Draw main face of block
    const tileGradient = ctx.createLinearGradient(x, y, x + cellSize, y + cellSize);
    tileGradient.addColorStop(0, "#F5DEB3"); // Wheat
    tileGradient.addColorStop(0.3, "#DEB887"); // Burlywood
    tileGradient.addColorStop(0.7, "#D2B48C"); // Tan
    tileGradient.addColorStop(1, "#BC8F8F"); // Rosy brown
    
    ctx.fillStyle = tileGradient;
    ctx.fillRect(x, y, cellSize - 4, cellSize - 4);
    
    // Add wood grain to tile
    ctx.strokeStyle = "#CD853F";
    ctx.lineWidth = 0.5;
    for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.moveTo(x + 5 + i * 8, y + 5);
        ctx.lineTo(x + 8 + i * 8, y + cellSize - 9);
        ctx.stroke();
    }
    
    // Draw letter with clean 3D effect
    ctx.save();
    ctx.font = `bold ${cellSize / 2.5}px Arial`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#654321"; // Darker brown
    ctx.shadowColor = "transparent";
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    ctx.fillText(
        tile.letter,
        x + (cellSize - 4) / 2,
        y + (cellSize - 4) / 2
    );
    ctx.restore();
    
    // Add subtle highlight to letter (darker)
    ctx.save();
    ctx.font = `bold ${cellSize / 2.5}px Arial`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#8B4513";
    ctx.shadowColor = "transparent";
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    ctx.fillText(
        tile.letter,
        x + (cellSize - 4) / 2 - 1,
        y + (cellSize - 4) / 2 - 1
    );
    ctx.restore();
    
    ctx.restore();
}









// Helper function to draw Tetris board background
function drawTetrisBoardBackground() {
    const tetrisCanvas = document.getElementById('tetrisCanvas');
    const ctx = tetrisCanvas.getContext('2d');
    
    // Dark oak wooden board background with premium 3D effect
    const boardGradient = ctx.createLinearGradient(0, 0, tetrisCanvas.width, tetrisCanvas.height);
    boardGradient.addColorStop(0, "#1A0F0A"); // Darkest oak
    boardGradient.addColorStop(0.2, "#2D1810"); // Dark oak
    boardGradient.addColorStop(0.4, "#3D2318"); // Medium dark oak
    boardGradient.addColorStop(0.6, "#4A2C1A"); // Oak brown
    boardGradient.addColorStop(0.8, "#5D3A1F"); // Rich oak
    boardGradient.addColorStop(1, "#2D1810"); // Dark oak
    
    ctx.fillStyle = boardGradient;
    ctx.fillRect(0, 0, tetrisCanvas.width, tetrisCanvas.height);
    
    // Add premium dark oak grain effect with multiple layers
    ctx.strokeStyle = "rgba(26, 15, 10, 0.9)";
    ctx.lineWidth = 1;
    
    // Primary wood grain lines
    for (let i = 0; i < tetrisCanvas.width; i += 15) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i + 8, tetrisCanvas.height);
        ctx.stroke();
    }
    
    // Secondary wood grain lines for texture
    ctx.strokeStyle = "rgba(45, 24, 16, 0.7)";
    ctx.lineWidth = 0.5;
    for (let i = 0; i < tetrisCanvas.width; i += 8) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i + 4, tetrisCanvas.height);
        ctx.stroke();
    }
    
    // Add subtle cross-grain texture
    ctx.strokeStyle = "rgba(61, 35, 24, 0.5)";
    ctx.lineWidth = 0.3;
    for (let i = 0; i < tetrisCanvas.height; i += 12) {
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(tetrisCanvas.width, i + 6);
        ctx.stroke();
    }
    
    // Enhanced board shadow for dramatic 3D effect
    ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
    ctx.fillRect(20, 20, tetrisCanvas.width, tetrisCanvas.height);
    
    // Add multiple shadow layers for depth
    ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
    ctx.fillRect(15, 15, tetrisCanvas.width, tetrisCanvas.height);
    
    ctx.fillStyle = "rgba(0, 0, 0, 0.15)";
    ctx.fillRect(10, 10, tetrisCanvas.width, tetrisCanvas.height);
    
    // Draw enhanced board with premium 3D border
    ctx.fillStyle = boardGradient;
    ctx.fillRect(0, 0, tetrisCanvas.width - 20, tetrisCanvas.height - 20);
    
    // Add premium 3D border effect with dark oak colors
    // Top and left highlights
    ctx.strokeStyle = "#4A2C1A";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(tetrisCanvas.width - 20, 0);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, tetrisCanvas.height - 20);
    ctx.stroke();
    
    // Secondary highlights
    ctx.strokeStyle = "#5D3A1F";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(2, 2);
    ctx.lineTo(tetrisCanvas.width - 22, 2);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(2, 2);
    ctx.lineTo(2, tetrisCanvas.height - 22);
    ctx.stroke();
    
    // Bottom and right shadows
    ctx.strokeStyle = "#1A0F0A";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(tetrisCanvas.width - 20, 0);
    ctx.lineTo(tetrisCanvas.width - 20, tetrisCanvas.height - 20);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(0, tetrisCanvas.height - 20);
    ctx.lineTo(tetrisCanvas.width - 20, tetrisCanvas.height - 20);
    ctx.stroke();
    
    // Add subtle oak knots and natural variations
    ctx.fillStyle = "rgba(26, 15, 10, 0.6)";
    for (let i = 0; i < 5; i++) {
        const x = Math.random() * (tetrisCanvas.width - 40) + 10;
        const y = Math.random() * (tetrisCanvas.height - 40) + 10;
        const size = Math.random() * 15 + 5;
        
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
    }
    
    // Add wood pores for authenticity
    ctx.strokeStyle = "rgba(26, 15, 10, 0.4)";
    ctx.lineWidth = 0.5;
    for (let i = 0; i < 20; i++) {
        const x = Math.random() * (tetrisCanvas.width - 40) + 10;
        const y = Math.random() * (tetrisCanvas.height - 40) + 10;
        const length = Math.random() * 8 + 2;
        
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + length, y + length);
        ctx.stroke();
    }
}

// Helper function to draw a single Tetris tile
function drawTetrisTile(ctx, r, c, letter, cellSize) {
    const x = c * cellSize;
    const y = r * cellSize;
    
    // Draw 3D wood tile with realistic texture
    const tileGradient = ctx.createLinearGradient(x, y, x + cellSize, y + cellSize);
    tileGradient.addColorStop(0, "#DEB887"); // Burlywood
    tileGradient.addColorStop(0.3, "#D2B48C"); // Tan
    tileGradient.addColorStop(0.7, "#CD853F"); // Peru
    tileGradient.addColorStop(1, "#A0522D"); // Sienna
    
    ctx.fillStyle = tileGradient;
    ctx.fillRect(x + 2, y + 2, cellSize - 4, cellSize - 4);
    
    // Add wood grain to tile
    ctx.strokeStyle = "rgba(139, 69, 19, 0.6)";
    ctx.lineWidth = 1;
    for (let i = 0; i < cellSize; i += 2) {
        ctx.beginPath();
        ctx.moveTo(x + i, y);
        ctx.lineTo(x + i + 1, y + cellSize);
        ctx.stroke();
    }
    
    // Draw letter
    ctx.font = `bold ${cellSize / 2.5}px Arial`;
    ctx.fillStyle = "#8B4513";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(letter, x + cellSize / 2, y + cellSize / 2);
    
    // Add 3D effect with shadows
    ctx.strokeStyle = "rgba(0, 0, 0, 0.3)";
    ctx.lineWidth = 2;
    ctx.strokeRect(x + 2, y + 2, cellSize - 4, cellSize - 4);
    
    // Highlight edge
    ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
    ctx.lineWidth = 1;
    ctx.strokeRect(x + 3, y + 3, cellSize - 6, cellSize - 6);
}

// Helper function to draw disappearing tile with effects




function drawTetrisBoard(anim = null) {
    const tetrisCanvas = document.getElementById('tetrisCanvas');
    
    if (!tetrisCanvas) {
        return;
    }
    
    const ctx = tetrisCanvas.getContext('2d');
    const cellSize = tetrisCanvas.width / 7;
    
    // Set font for letters
    ctx.font = `bold ${cellSize / 2.5}px Arial`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    
    // Draw board background
    drawTetrisBoardBackground();

    // Draw tiles
    for (let r = 0; r < 7; r++) {
        for (let c = 0; c < 7; c++) {
            const x = c * cellSize;
            const y = r * cellSize;
            
            // If animating, skip drawing the moving letter in its original spot
            // Also ensure empty space is drawn consistently during animation
            if (anim && anim.from && anim.from.r === r && anim.from.c === c) {
                // Draw empty space consistently during animation
                ctx.fillStyle = "#8B4513"; // Lighter brown for visibility
                ctx.fillRect(x + 2, y + 2, cellSize - 4, cellSize - 4);
                
                ctx.strokeStyle = "#654321";
                ctx.lineWidth = 3;
                ctx.strokeRect(x + 2, y + 2, cellSize - 4, cellSize - 4);
                
                // Add inner highlight to show it's recessed
                ctx.strokeStyle = "#A0522D";
                ctx.lineWidth = 1;
                ctx.strokeRect(x + 4, y + 4, cellSize - 8, cellSize - 8);
                continue;
            }

            if (tetrisBoard[r][c] === "") {
                // Draw empty space as a clearly visible recessed area
                ctx.fillStyle = "#8B4513"; // Lighter brown for visibility
                ctx.fillRect(x + 2, y + 2, cellSize - 4, cellSize - 4);
                
                // Add darker border to make it stand out
                ctx.strokeStyle = "#654321";
                ctx.lineWidth = 3;
                ctx.strokeRect(x + 2, y + 2, cellSize - 4, cellSize - 4);
                
                // Add inner highlight to show it's recessed
                ctx.strokeStyle = "#A0522D";
                ctx.lineWidth = 1;
                ctx.strokeRect(x + 4, y + 4, cellSize - 8, cellSize - 8);
            } else {
                // Check if this tile is part of a completed word
                const isCompleted = tetrisCompletedTiles.some(tile => tile.r === r && tile.c === c);
                
                // Draw enhanced 3D block tile
                const blockHeight = 18; // Much more pronounced 3D effect
                
                // Draw enhanced bottom shadow with multiple layers
                ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
                ctx.fillRect(x + blockHeight, y + blockHeight, cellSize - 4, cellSize - 4);
                
                // Draw additional shadow layers for extreme depth
                ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
                ctx.fillRect(x + blockHeight - 3, y + blockHeight - 3, cellSize - 4, cellSize - 4);
                
                ctx.fillStyle = "rgba(0, 0, 0, 0.2)";
                ctx.fillRect(x + blockHeight - 6, y + blockHeight - 6, cellSize - 4, cellSize - 4);
                
                // Draw right side of block with enhanced 3D
                ctx.fillStyle = isCompleted ? "#228B22" : "#A0522D";
                ctx.beginPath();
                ctx.moveTo(x + cellSize - 4, y);
                ctx.lineTo(x + cellSize - 4 + blockHeight, y + blockHeight);
                ctx.lineTo(x + cellSize - 4 + blockHeight, y + cellSize - 4 + blockHeight);
                ctx.lineTo(x + cellSize - 4, y + cellSize - 4);
                ctx.closePath();
                ctx.fill();
                
                // Draw bottom side of block with enhanced 3D
                ctx.fillStyle = isCompleted ? "#228B22" : "#8B4513";
                ctx.beginPath();
                ctx.moveTo(x, y + cellSize - 4);
                ctx.lineTo(x + cellSize - 4, y + cellSize - 4);
                ctx.lineTo(x + cellSize - 4 + blockHeight, y + cellSize - 4 + blockHeight);
                ctx.lineTo(x + blockHeight, y + cellSize - 4 + blockHeight);
                ctx.closePath();
                ctx.fill();
                
                // Add intense highlight on top edge for dramatic 3D effect
                ctx.strokeStyle = "#FFFFFF";
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.moveTo(x, y);
                ctx.lineTo(x + cellSize - 4, y);
                ctx.stroke();
                
                // Add intense highlight on left edge for dramatic 3D effect
                ctx.beginPath();
                ctx.moveTo(x, y);
                ctx.lineTo(x, y + cellSize - 4);
                ctx.stroke();
                
                // Add secondary highlight for extra depth
                ctx.strokeStyle = "#F5DEB3";
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(x + 1, y + 1);
                ctx.lineTo(x + cellSize - 5, y + 1);
                ctx.stroke();
                
                ctx.beginPath();
                ctx.moveTo(x + 1, y + 1);
                ctx.lineTo(x + 1, y + cellSize - 5);
                ctx.stroke();
                
                // Draw main face of block
                const tileGradient = ctx.createLinearGradient(x, y, x + cellSize, y + cellSize);
                if (isCompleted) {
                    // Green gradient for completed tiles
                    tileGradient.addColorStop(0, "#90EE90"); // Light green
                    tileGradient.addColorStop(0.3, "#32CD32"); // Lime green
                    tileGradient.addColorStop(0.7, "#228B22"); // Forest green
                    tileGradient.addColorStop(1, "#006400"); // Dark green
                } else {
                    // Wood gradient for normal tiles
                    tileGradient.addColorStop(0, "#F5DEB3"); // Wheat
                    tileGradient.addColorStop(0.3, "#DEB887"); // Burlywood
                    tileGradient.addColorStop(0.7, "#D2B48C"); // Tan
                    tileGradient.addColorStop(1, "#BC8F8F"); // Rosy brown
                }
                
                ctx.fillStyle = tileGradient;
                ctx.fillRect(x, y, cellSize - 4, cellSize - 4);
                
                // Add wood grain to tile
                ctx.strokeStyle = "#CD853F";
                ctx.lineWidth = 0.5;
                for (let i = 0; i < 3; i++) {
                    ctx.beginPath();
                    ctx.moveTo(x + 5 + i * 8, y + 5);
                    ctx.lineTo(x + 8 + i * 8, y + cellSize - 9);
                    ctx.stroke();
                }
                
                // Draw letter with clean 3D effect
                ctx.save();
                ctx.font = `bold ${cellSize / 2.5}px Arial`;
                ctx.textAlign = "center";
                ctx.textBaseline = "middle";
                ctx.fillStyle = "#654321"; // Darker brown
                ctx.shadowColor = "transparent";
                ctx.shadowBlur = 0;
                ctx.shadowOffsetX = 0;
                ctx.shadowOffsetY = 0;
                ctx.fillText(
                    tetrisBoard[r][c],
                    x + (cellSize - 4) / 2,
                    y + (cellSize - 4) / 2
                );
                ctx.restore();
                
                // Add subtle highlight to letter (darker)
                ctx.save();
                ctx.font = `bold ${cellSize / 2.5}px Arial`;
                ctx.textAlign = "center";
                ctx.textBaseline = "middle";
                ctx.fillStyle = "#8B4513";
                ctx.shadowColor = "transparent";
                ctx.shadowBlur = 0;
                ctx.shadowOffsetX = 0;
                ctx.shadowOffsetY = 0;
                ctx.fillText(
                    tetrisBoard[r][c],
                    x + (cellSize - 4) / 2 - 1,
                    y + (cellSize - 4) / 2 - 1
                );
                ctx.restore();
            }
        }
    }

    // Draw the moving letter if animating
    if (anim) {
        const t = anim.progress / anim.duration;
        const startX = anim.from.c * cellSize + (cellSize - 4) / 2;
        const startY = anim.from.r * cellSize + (cellSize - 4) / 2;
        const endX = anim.to.c * cellSize + (cellSize - 4) / 2;
        const endY = anim.to.r * cellSize + (cellSize - 4) / 2;
        const x = startX + (endX - startX) * t;
        const y = startY + (endY - startY) * t;

        // Draw moving tile as a simple block (no 3D effects) - same as original game
        const blockSize = cellSize - 4;
        
        // Main face - same as stationary tiles
        let tileGradient;
        tileGradient = ctx.createLinearGradient(x - blockSize/2, y - blockSize/2, x + blockSize/2, y + blockSize/2);
        tileGradient.addColorStop(0, "#F5DEB3"); // Wheat
        tileGradient.addColorStop(0.3, "#DEB887"); // Burlywood
        tileGradient.addColorStop(0.7, "#D2B48C"); // Tan
        tileGradient.addColorStop(1, "#BC8F8F"); // Rosy brown
        
        ctx.fillStyle = tileGradient;
        ctx.fillRect(x - blockSize/2, y - blockSize/2, blockSize, blockSize);
        
        // Simple border
        ctx.strokeStyle = "#8B4513";
        ctx.lineWidth = 2;
        ctx.strokeRect(x - blockSize/2, y - blockSize/2, blockSize, blockSize);
        
        // Add wood grain to moving tile
        ctx.strokeStyle = "#CD853F";
        ctx.lineWidth = 0.5;
        for (let i = 0; i < 3; i++) {
            ctx.beginPath();
            ctx.moveTo(x - blockSize/2 + 5 + i * 8, y - blockSize/2 + 5);
            ctx.lineTo(x - blockSize/2 + 8 + i * 8, y + blockSize/2 - 9);
            ctx.stroke();
        }
        
        // Draw letter on moving tile
        ctx.save();
        ctx.font = `bold ${cellSize / 2.5}px Arial`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillStyle = "#654321"; // Darker brown
        ctx.shadowColor = "transparent";
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
        ctx.fillText(anim.letter, x, y);
        ctx.restore();
        
        // Add subtle highlight to letter
        ctx.save();
        ctx.font = `bold ${cellSize / 2.5}px Arial`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillStyle = "#8B4513";
        ctx.shadowColor = "transparent";
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
        ctx.fillText(anim.letter, x - 1, y - 1);
        ctx.restore();
    }
}

function updateTetrisGame() {
    // Only run the game loop if tetrisGameRunning is true
    if (!tetrisGameRunning) {
        requestAnimationFrame(updateTetrisGame);
        return;
    }
    
    const tetrisCanvas = document.getElementById('tetrisCanvas');
    if (!tetrisCanvas) {
        requestAnimationFrame(updateTetrisGame);
        return;
    }
    
    const ctx = tetrisCanvas.getContext('2d');
    ctx.clearRect(0, 0, tetrisCanvas.width, tetrisCanvas.height);

    if (tetrisAnimating && tetrisAnimation) {
        // Check if this is a special animation that handles its own timing
        if (tetrisAnimation.isDissolving || tetrisAnimation.isGravity) {
            // These animations handle their own timing and progress
            drawTetrisBoard();
        } else if (tetrisAnimation.isBlinking || tetrisAnimation.isExplosion || tetrisAnimation.isNewLetters) {
            // Blinking, explosion, and new letters animations handle their own drawing completely
            // Call the animation function
            if (tetrisAnimation.animateFunction) {
                tetrisAnimation.animateFunction();
            }
        } else {
            // Regular tile sliding animation
            drawTetrisBoard(tetrisAnimation);
            tetrisAnimation.progress++;
            if (tetrisAnimation.progress >= tetrisAnimation.duration) {
                // Finish animation and swap (same as original game)
                tetrisBoard[tetrisAnimation.to.r][tetrisAnimation.to.c] = tetrisAnimation.letter;
                tetrisBoard[tetrisAnimation.from.r][tetrisAnimation.from.c] = "";
                tetrisEmptyPos = { r: tetrisAnimation.from.r, c: tetrisAnimation.from.c };
                tetrisAnimating = false;
                tetrisAnimation = null;
                
                // Check for word completion after each move
                checkTetrisWordCompletion();
            }
        }
    } else {
        drawTetrisBoard();
    }

    requestAnimationFrame(updateTetrisGame);
}

function showTetrisRulesModal() {
    // Create tetris-specific rules modal
    const modalOverlay = document.createElement('div');
    modalOverlay.id = 'tetris-rules-modal';
    modalOverlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.7);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 3000;
        font-family: Arial, sans-serif;
    `;
    
    // Create modal container with wood paneling
    const modalContainer = document.createElement('div');
    modalContainer.style.cssText = `
        position: relative;
        width: 600px;
        max-width: 90vw;
        max-height: 80vh;
        background: transparent;
        border-radius: 20px;
        overflow: hidden;
        box-shadow: 
            0 20px 60px rgba(0, 0, 0, 0.8),
            0 0 40px rgba(47, 27, 20, 0.8);
        border: 4px solid #2F1B14;
    `;
    
    // Create dark wood paneling background
    const panelingBackground = document.createElement('div');
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
    `;
    modalContainer.appendChild(panelingBackground);
    
    // Create scrollable content container
    const content = document.createElement('div');
    content.style.cssText = `
        position: relative;
        z-index: 10;
        padding: 30px;
        color: white;
        max-height: 70vh;
        overflow-y: auto;
    `;
    
    // Create title
    const title = document.createElement('h2');
    title.textContent = '🔄 Tetris Style WordSlide';
    title.style.cssText = `
        color: #FFFFFF;
        font-size: 28px;
        margin: 0 0 20px 0;
        text-align: center;
        text-shadow: 3px 3px 6px rgba(0, 0, 0, 0.8), 1px 1px 2px rgba(0, 0, 0, 0.9);
        font-weight: bold;
    `;
    
    // Create sections
    const sections = [
        {
            title: '🎯 Objective',
            content: 'Solve words continuously! When you complete a word, it disappears and new letters drop down from the top.'
        },
        {
            title: '🔄 Dynamic Gameplay',
            content: 'Unlike the original game, there are no levels. You keep solving words forever, with new words appearing as you progress.'
        },
        {
            title: '📉 Gravity System',
            content: 'When a word is completed, those letters disappear and all letters above them drop down to fill the empty spaces.'
        },
        {
            title: '⬇️ New Letters',
            content: 'After letters drop down, new letter blocks float down from the top to fill any remaining empty spaces.'
        },
        {
            title: '🎲 Word Generation',
            content: 'The game analyzes the current board and generates new words that can be completed with the available letters.'
        },
        {
            title: '📊 Scoring',
            content: 'Track your progress with the Words Solved counter and Moves counter. Try to solve as many words as possible!'
        },
        {
            title: '🎮 Controls',
            content: 'Click or tap on tiles adjacent to the empty space to move them, just like the original game.'
        },
        {
            title: '🏆 Endless Challenge',
            content: 'The game continues indefinitely. How many words can you solve? Challenge yourself to beat your high score!'
        }
    ];
    
    // Add title
    content.appendChild(title);
    
    // Add sections
    sections.forEach(section => {
        const sectionDiv = document.createElement('div');
        sectionDiv.style.cssText = `
            margin-bottom: 20px;
            padding: 15px;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 10px;
            border-left: 4px solid #FFD700;
        `;
        
        const sectionTitle = document.createElement('h3');
        sectionTitle.textContent = section.title;
        sectionTitle.style.cssText = `
            color: #FFD700;
            font-size: 18px;
            margin: 0 0 10px 0;
            text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.8);
            font-weight: bold;
        `;
        
        const sectionContent = document.createElement('p');
        sectionContent.textContent = section.content;
        sectionContent.style.cssText = `
            color: #FFFFFF;
            font-size: 14px;
            margin: 0;
            line-height: 1.5;
            text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
        `;
        
        sectionDiv.appendChild(sectionTitle);
        sectionDiv.appendChild(sectionContent);
        content.appendChild(sectionDiv);
    });
    
    // Create close button
    const closeButton = document.createElement('button');
    closeButton.textContent = 'Got it!';
    closeButton.style.cssText = `
        background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%);
        color: white;
        border: none;
        padding: 12px 30px;
        border-radius: 8px;
        font-size: 16px;
        font-weight: bold;
        cursor: pointer;
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
        transition: all 0.2s ease;
        margin-top: 20px;
        display: block;
        margin-left: auto;
        margin-right: auto;
    `;
    closeButton.onmouseover = () => {
        closeButton.style.transform = 'translateY(-2px)';
        closeButton.style.boxShadow = '0 6px 12px rgba(0, 0, 0, 0.4)';
    };
    closeButton.onmouseout = () => {
        closeButton.style.transform = 'translateY(0)';
        closeButton.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.3)';
    };
    closeButton.onclick = () => {
        document.body.removeChild(modalOverlay);
    };
    
    content.appendChild(closeButton);
    modalContainer.appendChild(content);
    modalOverlay.appendChild(modalContainer);
    document.body.appendChild(modalOverlay);
    
    // Handle escape key
    const handleEscape = (e) => {
        if (e.key === 'Escape') {
            document.body.removeChild(modalOverlay);
            document.removeEventListener('keydown', handleEscape);
        }
    };
    document.addEventListener('keydown', handleEscape);
}

// Add this function for the popup
function showTryAgainPopup() {
    setTimeout(() => {
        alert("Try again!");
        moveCount = 0;
        updateMoveCounter();
        generateBoard();
        // Optionally, redraw immediately
        drawBoard();
    }, 100); // slight delay to allow animation to finish
}

// Add win condition popup
function showWinPopup() {
    setTimeout(() => {
        if (currentLevel < MAX_LEVELS) {
            showFireworksCelebration();
        } else {
            showFireworksCelebration(true); // Final level
        }
    }, 100);
}

function showFireworksCelebration(isFinalLevel = false) {
    // Just start fireworks without any overlay - keep the game visible
    startFireworks();
    
    // Show beautiful modal after fireworks
    setTimeout(() => {
        showCelebrationModal(isFinalLevel);
    }, 4000); // Show modal after 4 seconds of fireworks
}

function showCelebrationModal(isFinalLevel = false) {
    // Create modal overlay - no background, just for positioning
    const modalOverlay = document.createElement('div');
    modalOverlay.id = 'celebration-modal-overlay';
    modalOverlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: transparent;
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 2000;
        font-family: Arial, sans-serif;
        pointer-events: none;
    `;
    
    // Create modal container with wood paneling
    const modalContainer = document.createElement('div');
    modalContainer.style.cssText = `
        position: relative;
        width: 400px;
        max-width: 90vw;
        background: transparent;
        border-radius: 20px;
        overflow: hidden;
        box-shadow: 
            0 20px 60px rgba(0, 0, 0, 0.8),
            0 0 40px rgba(47, 27, 20, 0.8);
        border: 4px solid #2F1B14;
        pointer-events: auto;
    `;
    
    // Create dark wood paneling background
    const panelingBackground = document.createElement('div');
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
    `;
    modalContainer.appendChild(panelingBackground);
    
    // Create individual wood panels
    const panelWidth = 400;
    const panelHeight = 60;
    const panelsPerCol = Math.ceil(200 / panelHeight) + 1;
    
    for (let row = 0; row < panelsPerCol; row++) {
        const panel = document.createElement('div');
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
        `;
        
        // Add panel grain variations
        const grainOverlay = document.createElement('div');
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
        `;
        panel.appendChild(grainOverlay);
        modalContainer.appendChild(panel);
    }
    
    // Add paneling trim and borders
    const trim = document.createElement('div');
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
    `;
    modalContainer.appendChild(trim);
    
    // Add subtle ambient lighting
    const ambientLight = document.createElement('div');
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
    `;
    modalContainer.appendChild(ambientLight);
    
    // Create content container
    const content = document.createElement('div');
    content.style.cssText = `
        position: relative;
        z-index: 10;
        padding: 40px;
        text-align: center;
        color: white;
    `;
    
    // Create title
    const title = document.createElement('h2');
    title.textContent = '🎉 Congratulations! 🎉';
    title.style.cssText = `
        color: #FFFFFF;
        font-size: 28px;
        margin: 0 0 20px 0;
        text-shadow: 3px 3px 6px rgba(0, 0, 0, 0.8), 1px 1px 2px rgba(0, 0, 0, 0.9);
        font-weight: bold;
    `;
    
    // Create message
    const message = document.createElement('p');
    if (isFinalLevel) {
        message.textContent = 'You\'ve completed all levels! You\'re a WordSlide master! 🏆';
    } else {
        message.textContent = `Level ${currentLevel} Complete! 🎯`;
    }
    message.style.cssText = `
        color: #FFFFFF;
        font-size: 20px;
        margin: 0 0 30px 0;
        font-weight: bold;
        text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.8), 1px 1px 2px rgba(0, 0, 0, 0.9);
    `;
    
    // Create button
    const button = document.createElement('button');
    if (isFinalLevel) {
        button.textContent = 'Start Over';
        button.onclick = () => {
            currentLevel = 1;
            moveCount = 0;
            completedTiles = [];
            updateMoveCounter();
            updateLevelDisplay();
            updateTargetWordsDisplay();
            generateBoard();
            // Force a complete redraw to clear any green tiles
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            drawBoard();
            // Force another redraw after a short delay to ensure clean state
            setTimeout(() => {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                drawBoard();
            }, 50);
            document.body.removeChild(modalOverlay);
        };
    } else {
        button.textContent = 'Next Level';
        button.onclick = () => {
            currentLevel++;
                moveCount = 0;
    updateMoveCounter();
    updateLevelDisplay();
    updateTargetWordsDisplay();
    generateBoard();
    saveGameState(); // Save when resetting board
            drawBoard();
            document.body.removeChild(modalOverlay);
        };
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
        text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);
    `;
    
    // Add hover effects
    button.onmouseenter = () => {
        button.style.transform = 'scale(1.05)';
        button.style.boxShadow = '0 7px 20px rgba(0, 0, 0, 0.6), 0 0 25px rgba(50, 205, 50, 0.4)';
    };
    button.onmouseleave = () => {
        button.style.transform = 'scale(1)';
        button.style.boxShadow = '0 5px 15px rgba(0, 0, 0, 0.5), 0 0 20px rgba(50, 205, 50, 0.3)';
    };
    
    // Assemble the modal
    content.appendChild(title);
    content.appendChild(message);
    content.appendChild(button);
    modalContainer.appendChild(content);
    modalOverlay.appendChild(modalContainer);
    document.body.appendChild(modalOverlay);
    
    // Add click outside to close
    modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) {
            document.body.removeChild(modalOverlay);
        }
    });
    
    // Add escape key to close
    const handleEscape = (e) => {
        if (e.key === 'Escape') {
            document.body.removeChild(modalOverlay);
            document.removeEventListener('keydown', handleEscape);
        }
    };
    document.addEventListener('keydown', handleEscape);
}

function startFireworks() {
    const canvas = document.createElement('canvas');
    canvas.id = 'fireworks-canvas';
    canvas.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: 1001;
        background: transparent;
    `;
    
    document.body.appendChild(canvas);
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    // Ensure the canvas is completely transparent
    ctx.globalCompositeOperation = 'source-over';
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const fireworks = [];
    const particles = [];
    
    // Firework particle class
    class Particle {
        constructor(x, y, vx, vy, color) {
            this.x = x;
            this.y = y;
            this.vx = vx;
            this.vy = vy;
            this.color = color;
            this.life = 100;
            this.decay = 0.98;
        }
        
        update() {
            this.x += this.vx;
            this.y += this.vy;
            this.vy += 0.1; // gravity
            this.vx *= this.decay;
            this.vy *= this.decay;
            this.life--;
        }
        
        draw() {
            ctx.save();
            ctx.globalAlpha = this.life / 100;
            ctx.shadowColor = this.color;
            ctx.shadowBlur = 2;
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(this.x, this.y, 1.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
    }
    
    // Create firework
    function createFirework() {
        const x = Math.random() * canvas.width;
        const y = canvas.height;
        const targetY = Math.random() * canvas.height * 0.6 + canvas.height * 0.1; // More realistic height range
        const speed = 6 + Math.random() * 3; // Slightly slower
        const angle = Math.atan2(targetY - y, x - x);
        
        fireworks.push({
            x: x,
            y: y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            targetY: targetY,
            exploded: false
        });
    }
    
    // Explode firework
    function explodeFirework(fw) {
        const colors = ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#FF4500', '#00FFFF', '#FF1493', '#00FF00', '#FF69B4', '#FFA500', '#9370DB', '#20B2AA', '#FF6347'];
        const particleCount = 60 + Math.floor(Math.random() * 40); // More particles
        
        for (let i = 0; i < particleCount; i++) {
            const angle = (Math.PI * 2 * i) / particleCount;
            const speed = 2 + Math.random() * 4; // Faster particles
            const color = colors[Math.floor(Math.random() * colors.length)];
            
            particles.push(new Particle(
                fw.x,
                fw.y,
                Math.cos(angle) * speed,
                Math.sin(angle) * speed,
                color
            ));
        }
    }
    
    // Animation loop
    function animate() {
        // Clear canvas completely transparent
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Update and draw fireworks
        for (let i = fireworks.length - 1; i >= 0; i--) {
            const fw = fireworks[i];
            fw.x += fw.vx;
            fw.y += fw.vy;
            
            // Draw firework trail with subtle glow effect
            ctx.save();
            ctx.shadowColor = '#FFD700';
            ctx.shadowBlur = 3;
            ctx.fillStyle = '#FFD700';
            ctx.beginPath();
            ctx.arc(fw.x, fw.y, 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
            
            // Check if firework reached target
            if (fw.y <= fw.targetY && !fw.exploded) {
                explodeFirework(fw);
                fireworks.splice(i, 1);
            }
        }
        
        // Update and draw particles
        for (let i = particles.length - 1; i >= 0; i--) {
            const p = particles[i];
            p.update();
            p.draw();
            
            if (p.life <= 0) {
                particles.splice(i, 1);
            }
        }
        
        // Create new fireworks (more frequent)
        if (Math.random() < 0.08) {
            createFirework();
        }
        
        // Create multiple fireworks at once occasionally
        if (Math.random() < 0.02) {
            createFirework();
            setTimeout(() => createFirework(), 200);
            setTimeout(() => createFirework(), 400);
        }
        
        requestAnimationFrame(animate);
    }
    
    animate();
    
    // Clean up fireworks after 5 seconds
    setTimeout(() => {
        if (document.body.contains(canvas)) {
            document.body.removeChild(canvas);
        }
    }, 5000);
}

function getCellFromCoords(x, y) {
    // Scale coordinates to match actual canvas size
    const scaleX = canvas.width / canvas.offsetWidth;
    const scaleY = canvas.height / canvas.offsetHeight;
    const scaledX = x * scaleX;
    const scaledY = y * scaleY;
    
    const cellSize = canvas.width / cols;
    const c = Math.floor(scaledX / cellSize);
    const r = Math.floor(scaledY / cellSize);
    console.log(`getCellFromCoords: x=${x}, y=${y}, scaledX=${scaledX}, scaledY=${scaledY}, cellSize=${cellSize}, result=(${r}, ${c})`); // Debug
    return { r, c };
}

// Update tryMove to increment moveCount and check for limit
function tryMove(r, c) {
    console.log(`tryMove called with (${r}, ${c})`); // Debug
    const dr = Math.abs(r - emptyPos.r);
    const dc = Math.abs(c - emptyPos.c);
    console.log(`Distance: dr=${dr}, dc=${dc}`); // Debug
    console.log(`Can move: ${(dr === 1 && dc === 0) || (dr === 0 && dc === 1)}`); // Debug
    console.log(`Currently animating: ${animating}`); // Debug
    
    if ((dr === 1 && dc === 0) || (dr === 0 && dc === 1)) {
        if (!animating) {
            // Check if the tile being moved is part of a completed word
            if (isTileCompleted(r, c)) {
                console.log(`Tile is completed, cannot move`); // Debug
                return; // Don't allow moving tiles from completed words
            }
            
            console.log(`Starting animation from (${r}, ${c}) to (${emptyPos.r}, ${emptyPos.c})`); // Debug
            animating = true;
            animation = {
                from: { r, c },
                to: { r: emptyPos.r, c: emptyPos.c },
                letter: board[r][c],
                progress: 0,
                duration: 8 // frames (halved from 15)
            };
            moveCount++;
            updateMoveCounter(); // Update the display
            saveGameState(); // Save after each move
        } else {
            console.log(`Already animating, ignoring move`); // Debug
        }
    } else {
        console.log(`Invalid move - not adjacent to empty space`); // Debug
    }
}

function shuffleArray(arr) {
    // Fisher-Yates shuffle
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

// Enhanced word generation system for 20 levels
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
];

// Generate word sets for 20 levels
function generateWordSets() {
    const wordSets = [];
    const usedWords = new Set();
    
    for (let level = 1; level <= 20; level++) {
        const levelWords = [];
        
        // Level 1: Just one 3-letter word
        if (level === 1) {
            let selectedWord;
            let attempts = 0;
            
            // Try to find an unused 3-letter word
            do {
                selectedWord = WORD_BANK[Math.floor(Math.random() * WORD_BANK.length)];
                attempts++;
            } while ((usedWords.has(selectedWord) || selectedWord.length !== 3) && attempts < 100);
            
            // If we can't find an unused 3-letter word, use any 3-letter word
            if (attempts >= 100) {
                const threeLetterWords = WORD_BANK.filter(word => word.length === 3);
                selectedWord = threeLetterWords[Math.floor(Math.random() * threeLetterWords.length)];
            }
            
            levelWords.push(selectedWord);
            usedWords.add(selectedWord);
        } else {
            // Levels 2-20: Three words as before
            for (let i = 0; i < 3; i++) {
                let selectedWord;
                let attempts = 0;
                
                // Try to find an unused word
                do {
                    selectedWord = WORD_BANK[Math.floor(Math.random() * WORD_BANK.length)];
                    attempts++;
                } while (usedWords.has(selectedWord) && attempts < 50);
                
                // If we can't find an unused word, reset and use any word
                if (attempts >= 50) {
                    selectedWord = WORD_BANK[Math.floor(Math.random() * WORD_BANK.length)];
                }
                
                levelWords.push(selectedWord);
                usedWords.add(selectedWord);
            }
        }
        
        wordSets.push(levelWords);
    }
    
    return wordSets;
}

// Generate word sets for each session
const PROD_WORD_SETS = generateWordSets();

// Current word sets
let WORD_SETS = PROD_WORD_SETS;

// Save/load system
const SAVE_KEY = 'wordslide_game_state';
const TETRIS_SAVE_KEY = 'wordslide_tetris_state';

// Game state structure
let gameState = {
    currentLevel: 1,
    moveCount: 0,
    completedTiles: [],
    board: null,
    emptyPos: { r: 6, c: 6 },
    isTransitioning: false,
    gameRunning: true,
    animating: false,
    animation: null,
    disableGreenHighlighting: false
};

// Save game state to localStorage
function saveGameState() {
    try {
        const stateToSave = {
            currentLevel: currentLevel,
            moveCount: moveCount,
            completedTiles: completedTiles,
            board: board,
            emptyPos: emptyPos,
            isTransitioning: isTransitioning,
            gameRunning: gameRunning,
            animating: animating,
            animation: animation,
            disableGreenHighlighting: disableGreenHighlighting,
            timestamp: Date.now()
        };
        
        localStorage.setItem(SAVE_KEY, JSON.stringify(stateToSave));
        console.log('Game state saved successfully');
    } catch (error) {
        console.error('Error saving game state:', error);
    }
}

// Load game state from localStorage
function loadGameState() {
    try {
        const savedState = localStorage.getItem(SAVE_KEY);
        if (savedState) {
            const parsedState = JSON.parse(savedState);
            
            // Check if saved state is not too old (7 days)
            const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
            if (parsedState.timestamp && parsedState.timestamp < sevenDaysAgo) {
                console.log('Saved game state is too old, starting fresh');
                return false;
            }
            
            // Restore game state
            currentLevel = parsedState.currentLevel || 1;
            moveCount = parsedState.moveCount || 0;
            completedTiles = parsedState.completedTiles || [];
            board = parsedState.board || null;
            emptyPos = parsedState.emptyPos || { r: 6, c: 6 };
            isTransitioning = parsedState.isTransitioning || false;
            gameRunning = parsedState.gameRunning !== undefined ? parsedState.gameRunning : true;
            animating = parsedState.animating || false;
            animation = parsedState.animation || null;
            disableGreenHighlighting = parsedState.disableGreenHighlighting || false;
            
            console.log('Game state loaded successfully');
            return true;
        }
        return false;
    } catch (error) {
        console.error('Error loading game state:', error);
        return false;
    }
}

// Clear saved game state
function clearSavedGame() {
    try {
        localStorage.removeItem(SAVE_KEY);
        console.log('Saved game state cleared');
    } catch (error) {
        console.error('Error clearing saved game state:', error);
    }
}

// Save Tetris game state to localStorage
function saveTetrisGameState() {
    try {
        const stateToSave = {
            tetrisMoveCount: tetrisMoveCount,
            tetrisWordsSolved: tetrisWordsSolved,
            tetrisCurrentWord: tetrisCurrentWord,
            tetrisBoard: tetrisBoard,
            tetrisEmptyPos: tetrisEmptyPos,
            tetrisGameRunning: tetrisGameRunning,
            tetrisAnimating: tetrisAnimating,
            tetrisAnimation: tetrisAnimation,
            tetrisCompletedTiles: tetrisCompletedTiles,
            tetrisUsedWords: Array.from(tetrisUsedWords),
            timestamp: Date.now()
        };
        
        localStorage.setItem(TETRIS_SAVE_KEY, JSON.stringify(stateToSave));
        console.log('Tetris game state saved successfully');
    } catch (error) {
        console.error('Error saving Tetris game state:', error);
    }
}

// Load Tetris game state from localStorage
function loadTetrisGameState() {
    try {
        const savedState = localStorage.getItem(TETRIS_SAVE_KEY);
        if (savedState) {
            const parsedState = JSON.parse(savedState);
            
            // Check if saved state is not too old (7 days)
            const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
            if (parsedState.timestamp && parsedState.timestamp < sevenDaysAgo) {
                return null;
            }
            
            // Restore Tetris game state
            tetrisMoveCount = parsedState.tetrisMoveCount || 0;
            tetrisWordsSolved = parsedState.tetrisWordsSolved || 0;
            tetrisCurrentWord = parsedState.tetrisCurrentWord || '';
            tetrisBoard = parsedState.tetrisBoard || [];
            tetrisEmptyPos = parsedState.tetrisEmptyPos || { r: 6, c: 6 };
            tetrisGameRunning = parsedState.tetrisGameRunning !== undefined ? parsedState.tetrisGameRunning : true;
            tetrisAnimating = parsedState.tetrisAnimating || false;
            tetrisAnimation = parsedState.tetrisAnimation || null;

            tetrisUsedWords = new Set(parsedState.tetrisUsedWords || []);
            
            // CRITICAL FIX: Ensure the board has a proper empty cell
            // Ensure the board has the correct dimensions
            if (!tetrisBoard || tetrisBoard.length !== 7) {
                console.log(`Warning: Invalid board dimensions, attempting to fix...`);
                // Try to create a valid board structure instead of regenerating
                if (!tetrisBoard || tetrisBoard.length !== 7) {
                    tetrisBoard = [];
                    for (let r = 0; r < 7; r++) {
                        tetrisBoard[r] = [];
                        for (let c = 0; c < 7; c++) {
                            tetrisBoard[r][c] = 'A'; // Default letter
                        }
                    }
                    // Set the empty position
                    tetrisBoard[tetrisEmptyPos.r][tetrisEmptyPos.c] = '';
                    console.log(`Recreated board structure with empty space at [${tetrisEmptyPos.r}][${tetrisEmptyPos.c}]`);
                }
            }
            
            // Ensure the empty position is valid and the cell is actually empty
            if (!tetrisEmptyPos || tetrisEmptyPos.r < 0 || tetrisEmptyPos.r >= 7 || 
                tetrisEmptyPos.c < 0 || tetrisEmptyPos.c >= 7) {
                tetrisEmptyPos = { r: 6, c: 6 };
            }
            
            // Ensure the empty cell is actually empty
            if (tetrisBoard[tetrisEmptyPos.r][tetrisEmptyPos.c] !== '') {
                tetrisBoard[tetrisEmptyPos.r][tetrisEmptyPos.c] = '';
            }
            
            // Count empty spaces to ensure we have exactly one
            let emptyCount = 0;
            for (let r = 0; r < 7; r++) {
                for (let c = 0; c < 7; c++) {
                    if (tetrisBoard[r][c] === '') {
                        emptyCount++;
                    }
                }
            }
            
            // If we have more than one empty space or no empty spaces, try to fix it instead of regenerating
            if (emptyCount !== 1) {
                console.log(`Warning: Board has ${emptyCount} empty spaces, attempting to fix...`);
                
                // If no empty spaces, create one at the expected position
                if (emptyCount === 0) {
                    tetrisBoard[tetrisEmptyPos.r][tetrisEmptyPos.c] = '';
                    console.log(`Created empty space at [${tetrisEmptyPos.r}][${tetrisEmptyPos.c}]`);
                }
                // If multiple empty spaces, keep only the one at tetrisEmptyPos
                else if (emptyCount > 1) {
                    for (let r = 0; r < 7; r++) {
                        for (let c = 0; c < 7; c++) {
                            if (tetrisBoard[r][c] === '' && (r !== tetrisEmptyPos.r || c !== tetrisEmptyPos.c)) {
                                // Fill this empty space with a random letter
                                const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
                                tetrisBoard[r][c] = letters[Math.floor(Math.random() * letters.length)];
                                console.log(`Filled extra empty space at [${r}][${c}] with random letter`);
                            }
                        }
                    }
                }
            }
            
            return parsedState;
        }
        return null;
    } catch (error) {
        return null;
    }
}

// Clear saved Tetris game state
function clearSavedTetrisGame() {
    try {
        localStorage.removeItem(TETRIS_SAVE_KEY);
        console.log('Saved Tetris game state cleared');
    } catch (error) {
        console.error('Error clearing saved Tetris game state:', error);
    }
}

// Debug function to clear Tetris state (call from console: clearTetrisState())
function clearTetrisState() {
    clearSavedTetrisGame();
    console.log('Tetris state cleared. Refresh the page or restart the Tetris game to see a fresh board.');
}

// Debug function to test empty cell functionality (call from console: testEmptyCell())
function testEmptyCell() {
    console.log(`=== EMPTY CELL TEST ===`);
    console.log(`tetrisEmptyPos: [${tetrisEmptyPos.r}][${tetrisEmptyPos.c}]`);
    console.log(`tetrisGameRunning: ${tetrisGameRunning}`);
    console.log(`tetrisAnimating: ${tetrisAnimating}`);
    console.log(`Board at empty pos: '${tetrisBoard[tetrisEmptyPos.r][tetrisEmptyPos.c]}'`);
    
    // Test clicking on adjacent cells
    const adjacentCells = [
        { r: tetrisEmptyPos.r - 1, c: tetrisEmptyPos.c }, // Above
        { r: tetrisEmptyPos.r + 1, c: tetrisEmptyPos.c }, // Below
        { r: tetrisEmptyPos.r, c: tetrisEmptyPos.c - 1 }, // Left
        { r: tetrisEmptyPos.r, c: tetrisEmptyPos.c + 1 }  // Right
    ];
    
    console.log(`Testing adjacent cells:`);
    for (const cell of adjacentCells) {
        if (cell.r >= 0 && cell.r < 7 && cell.c >= 0 && cell.c < 7) {
            const letter = tetrisBoard[cell.r][cell.c];
            console.log(`  [${cell.r}][${cell.c}]: '${letter}'`);
        }
    }
    
    // Test the move logic directly
    console.log(`Testing move logic:`);
    for (const cell of adjacentCells) {
        if (cell.r >= 0 && cell.r < 7 && cell.c >= 0 && cell.c < 7) {
            const letter = tetrisBoard[cell.r][cell.c];
            if (letter !== '') {
                console.log(`  Testing move from [${cell.r}][${cell.c}] ('${letter}') to empty cell`);
                tryTetrisMove(cell.r, cell.c);
            }
        }
    }
    console.log(`=== END EMPTY CELL TEST ===`);
}

// Start a completely new game
function newGame() {
    // Clear saved state
    clearSavedGame();
    
    // Reset all game variables
    currentLevel = 1;
    moveCount = 0;
    completedTiles = [];
    isTransitioning = false;
    gameRunning = true;
    animating = false;
    animation = null;
    disableGreenHighlighting = false;
    
    // Generate new board
    generateBoard();
    
    // Update displays
    updateMoveCounter();
    updateLevelDisplay();
    updateTargetWordsDisplay();
    
    // Redraw board
    drawBoard();
    
    console.log('New game started');
}

// Show hint confirmation modal
function showHintConfirmation() {
    // Create modal overlay
    const modalOverlay = document.createElement('div');
    modalOverlay.id = 'hint-confirmation-modal';
    modalOverlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.7);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 3000;
        font-family: Arial, sans-serif;
    `;
    
    // Create modal container with wood paneling
    const modalContainer = document.createElement('div');
    modalContainer.style.cssText = `
        position: relative;
        width: 400px;
        max-width: 90vw;
        background: transparent;
        border-radius: 20px;
        overflow: hidden;
        box-shadow: 
            0 20px 60px rgba(0, 0, 0, 0.8),
            0 0 40px rgba(47, 27, 20, 0.8);
        border: 4px solid #2F1B14;
    `;
    
    // Create dark wood paneling background
    const panelingBackground = document.createElement('div');
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
    `;
    modalContainer.appendChild(panelingBackground);
    
    // Create content container
    const content = document.createElement('div');
    content.style.cssText = `
        position: relative;
        z-index: 10;
        padding: 30px;
        text-align: center;
        color: white;
    `;
    
    // Create title
    const title = document.createElement('h3');
    title.textContent = '💡 Use Hint?';
    title.style.cssText = `
        color: #FFFFFF;
        font-size: 24px;
        margin: 0 0 15px 0;
        text-shadow: 3px 3px 6px rgba(0, 0, 0, 0.8), 1px 1px 2px rgba(0, 0, 0, 0.9);
        font-weight: bold;
    `;
    
    // Create message
    const message = document.createElement('p');
    message.textContent = 'This will show you the next best move and add 3 moves to your total. Continue?';
    message.style.cssText = `
        color: #FFFFFF;
        font-size: 16px;
        margin: 0 0 25px 0;
        line-height: 1.4;
        text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.8);
    `;
    
    // Create button container
    const buttonContainer = document.createElement('div');
    buttonContainer.style.cssText = `
        display: flex;
        gap: 15px;
        justify-content: center;
    `;
    
    // Create Yes button
    const yesButton = document.createElement('button');
    yesButton.textContent = 'Yes, Show Hint';
    yesButton.style.cssText = `
        background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%);
        color: white;
        border: none;
        padding: 12px 24px;
        border-radius: 8px;
        font-size: 16px;
        font-weight: bold;
        cursor: pointer;
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
        transition: all 0.2s ease;
    `;
    yesButton.onmouseover = () => {
        yesButton.style.transform = 'translateY(-2px)';
        yesButton.style.boxShadow = '0 6px 12px rgba(0, 0, 0, 0.4)';
    };
    yesButton.onmouseout = () => {
        yesButton.style.transform = 'translateY(0)';
        yesButton.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.3)';
    };
    yesButton.onclick = () => {
        document.body.removeChild(modalOverlay);
        showHint();
    };
    
    // Create No button
    const noButton = document.createElement('button');
    noButton.textContent = 'Cancel';
    noButton.style.cssText = `
        background: linear-gradient(135deg, #f44336 0%, #da190b 100%);
        color: white;
        border: none;
        padding: 12px 24px;
        border-radius: 8px;
        font-size: 16px;
        font-weight: bold;
        cursor: pointer;
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
        transition: all 0.2s ease;
    `;
    noButton.onmouseover = () => {
        noButton.style.transform = 'translateY(-2px)';
        noButton.style.boxShadow = '0 6px 12px rgba(0, 0, 0, 0.4)';
    };
    noButton.onmouseout = () => {
        noButton.style.transform = 'translateY(0)';
        noButton.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.3)';
    };
    noButton.onclick = () => {
        document.body.removeChild(modalOverlay);
    };
    
    buttonContainer.appendChild(yesButton);
    buttonContainer.appendChild(noButton);
    content.appendChild(title);
    content.appendChild(message);
    content.appendChild(buttonContainer);
    modalContainer.appendChild(content);
    modalOverlay.appendChild(modalContainer);
    document.body.appendChild(modalOverlay);
    
    // Handle escape key
    const handleEscape = (e) => {
        if (e.key === 'Escape') {
            document.body.removeChild(modalOverlay);
            document.removeEventListener('keydown', handleEscape);
        }
    };
    document.addEventListener('keydown', handleEscape);
}

// Show hint - analyze board and suggest next best move
function showHint() {
    console.log('=== SHOWING HINT ===');
    
    // Add 3 moves penalty
    moveCount += 3;
    updateMoveCounter();
    saveGameState();
    
    // Find the best hint to show
    const hint = analyzeBoardForHint();
    
    if (hint) {
        showHintVisual(hint);
    } else {
        showNoHintAvailable();
    }
}

// Analyze the board to find the best hint
function analyzeBoardForHint() {
    const targetWords = getCurrentWordSet();
    console.log('Analyzing board for hints. Target words:', targetWords);
    
    // Find which words are closest to completion
    const wordProgress = [];
    
    for (let wordIndex = 0; wordIndex < targetWords.length; wordIndex++) {
        const targetWord = targetWords[wordIndex];
        const progress = analyzeWordProgress(targetWord, wordIndex);
        wordProgress.push(progress);
    }
    
    // Sort by completion percentage (highest first)
    wordProgress.sort((a, b) => b.completionPercentage - a.completionPercentage);
    
    console.log('Word progress analysis:', wordProgress);
    
    // Find the best move for the most promising word
    for (const progress of wordProgress) {
        if (progress.completionPercentage > 0 && progress.completionPercentage < 100) {
            const bestMove = findBestMoveForWord(progress);
            if (bestMove) {
                return {
                    type: 'move',
                    word: progress.word,
                    letter: bestMove.letter,
                    from: bestMove.from,
                    to: bestMove.to,
                    reason: `Move "${bestMove.letter}" to complete "${progress.word}"`
                };
            }
        }
    }
    
    // If no specific moves found, suggest a general strategy
    return {
        type: 'strategy',
        message: 'Focus on completing one word at a time. Look for letters that are close to their target positions.'
    };
}

// Analyze how close a word is to completion
function analyzeWordProgress(targetWord, wordIndex) {
    console.log(`Analyzing progress for word "${targetWord}"`);
    
    let bestProgress = 0;
    let bestPositions = [];
    
    // Check horizontal positions
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c <= cols - targetWord.length; c++) {
            const progress = checkWordProgressAtPosition(targetWord, r, c, 'horizontal');
            if (progress.percentage > bestProgress) {
                bestProgress = progress.percentage;
                bestPositions = progress.positions;
            }
        }
    }
    
    // Check vertical positions
    for (let r = 0; r <= rows - targetWord.length; r++) {
        for (let c = 0; c < cols; c++) {
            const progress = checkWordProgressAtPosition(targetWord, r, c, 'vertical');
            if (progress.percentage > bestProgress) {
                bestProgress = progress.percentage;
                bestPositions = progress.positions;
            }
        }
    }
    
    return {
        word: targetWord,
        wordIndex: wordIndex,
        completionPercentage: bestProgress,
        positions: bestPositions
    };
}

// Check word progress at a specific position
function checkWordProgressAtPosition(targetWord, startRow, startCol, direction) {
    let correctLetters = 0;
    const positions = [];
    
    for (let i = 0; i < targetWord.length; i++) {
        const r = direction === 'horizontal' ? startRow : startRow + i;
        const c = direction === 'horizontal' ? startCol + i : startCol;
        
        const expectedLetter = targetWord[i].toUpperCase();
        const actualLetter = board[r][c];
        
        positions.push({
            r: r,
            c: c,
            expected: expectedLetter,
            actual: actualLetter,
            correct: actualLetter === expectedLetter
        });
        
        if (actualLetter === expectedLetter) {
            correctLetters++;
        }
    }
    
    return {
        percentage: (correctLetters / targetWord.length) * 100,
        positions: positions
    };
}

// Find the best move to complete a word
function findBestMoveForWord(wordProgress) {
    console.log(`Finding best move for word "${wordProgress.word}"`);
    
    // Find letters that need to be moved
    const neededLetters = [];
    const targetPositions = [];
    
    for (const pos of wordProgress.positions) {
        if (!pos.correct) {
            neededLetters.push(pos.expected);
            targetPositions.push({ r: pos.r, c: pos.c });
        }
    }
    
    console.log('Needed letters:', neededLetters);
    console.log('Target positions:', targetPositions);
    
    // Find where the needed letters currently are
    for (const neededLetter of neededLetters) {
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                if (board[r][c] === neededLetter) {
                    // Check if this letter is not already in a completed word
                    const isCompleted = completedTiles.some(tile => tile.r === r && tile.c === c);
                    if (!isCompleted) {
                        // Find the closest target position
                        const closestTarget = findClosestTargetPosition(r, c, targetPositions);
                        if (closestTarget) {
                            return {
                                letter: neededLetter,
                                from: { r: r, c: c },
                                to: closestTarget
                            };
                        }
                    }
                }
            }
        }
    }
    
    return null;
}

// Find the closest target position to a letter
function findClosestTargetPosition(letterRow, letterCol, targetPositions) {
    let closest = null;
    let minDistance = Infinity;
    
    for (const target of targetPositions) {
        const distance = Math.abs(letterRow - target.r) + Math.abs(letterCol - target.c);
        if (distance < minDistance) {
            minDistance = distance;
            closest = target;
        }
    }
    
    return closest;
}

// Show visual hint on the board
function showHintVisual(hint) {
    if (hint.type === 'move') {
        showMoveHint(hint);
    } else if (hint.type === 'strategy') {
        showStrategyHint(hint);
    }
}

// Show a specific move hint
function showMoveHint(hint) {
    console.log('Showing move hint:', hint);
    
    // Create hint overlay
    const hintOverlay = document.createElement('div');
    hintOverlay.id = 'hint-overlay';
    hintOverlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: 2000;
    `;
    
    // Get canvas position and size for responsive positioning
    const canvasRect = canvas.getBoundingClientRect();
    const cellSize = canvasRect.width / cols;
    const fromX = hint.from.c * cellSize;
    const fromY = hint.from.r * cellSize;
    
    const highlight = document.createElement('div');
    highlight.style.cssText = `
        position: fixed;
        left: ${canvasRect.left + fromX}px;
        top: ${canvasRect.top + fromY}px;
        width: ${cellSize}px;
        height: ${cellSize}px;
        border: 4px solid #FFD700;
        border-radius: 8px;
        background: rgba(255, 215, 0, 0.2);
        animation: pulse 1.5s infinite;
        pointer-events: none;
        z-index: 2001;
    `;
    
    // Add CSS animation
    const style = document.createElement('style');
    style.textContent = `
        @keyframes pulse {
            0% { transform: scale(1); opacity: 1; }
            50% { transform: scale(1.1); opacity: 0.7; }
            100% { transform: scale(1); opacity: 1; }
        }
    `;
    document.head.appendChild(style);
    
    // Add arrow to target position
    const toX = hint.to.c * cellSize;
    const toY = hint.to.r * cellSize;
    
    const arrow = document.createElement('div');
    arrow.style.cssText = `
        position: fixed;
        left: ${canvasRect.left + toX}px;
        top: ${canvasRect.top + toY}px;
        width: ${cellSize}px;
        height: ${cellSize}px;
        border: 3px dashed #00FF00;
        border-radius: 8px;
        background: rgba(0, 255, 0, 0.1);
        animation: arrowPulse 2s infinite;
        pointer-events: none;
        z-index: 2001;
    `;
    
    // Add arrow pulse animation
    const arrowStyle = document.createElement('style');
    arrowStyle.textContent = `
        @keyframes arrowPulse {
            0% { border-color: #00FF00; }
            50% { border-color: #FFFF00; }
            100% { border-color: #00FF00; }
        }
    `;
    document.head.appendChild(arrowStyle);
    
    hintOverlay.appendChild(highlight);
    hintOverlay.appendChild(arrow);
    document.body.appendChild(hintOverlay);
    
    // Show hint message
    setTimeout(() => {
        showHintMessage(`💡 Hint: ${hint.reason}`);
    }, 500);
    
    // Remove hint after 5 seconds
    setTimeout(() => {
        if (document.body.contains(hintOverlay)) {
            document.body.removeChild(hintOverlay);
        }
    }, 5000);
}

// Show strategy hint
function showStrategyHint(hint) {
    showHintMessage(`💡 Hint: ${hint.message}`);
}

// Show hint message
function showHintMessage(message) {
    const messageDiv = document.createElement('div');
    messageDiv.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(0, 0, 0, 0.8);
        color: white;
        padding: 15px 25px;
        border-radius: 10px;
        font-size: 16px;
        font-weight: bold;
        z-index: 3000;
        animation: slideDown 0.5s ease-out;
    `;
    messageDiv.textContent = message;
    
    // Add slide down animation
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideDown {
            from { transform: translateX(-50%) translateY(-100%); opacity: 0; }
            to { transform: translateX(-50%) translateY(0); opacity: 1; }
        }
    `;
    document.head.appendChild(style);
    
    document.body.appendChild(messageDiv);
    
    // Remove message after 4 seconds
    setTimeout(() => {
        if (document.body.contains(messageDiv)) {
            document.body.removeChild(messageDiv);
        }
    }, 4000);
}

// Show message when no hint is available
function showNoHintAvailable() {
    showHintMessage('💡 All words are already completed or no helpful moves found!');
}

// Show game rules and how to play modal
function showRulesModal() {
    // Create modal overlay
    const modalOverlay = document.createElement('div');
    modalOverlay.id = 'rules-modal';
    modalOverlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.7);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 3000;
        font-family: Arial, sans-serif;
    `;
    
    // Create modal container with wood paneling
    const modalContainer = document.createElement('div');
    modalContainer.style.cssText = `
        position: relative;
        width: 600px;
        max-width: 90vw;
        max-height: 80vh;
        background: transparent;
        border-radius: 20px;
        overflow: hidden;
        box-shadow: 
            0 20px 60px rgba(0, 0, 0, 0.8),
            0 0 40px rgba(47, 27, 20, 0.8);
        border: 4px solid #2F1B14;
    `;
    
    // Create dark wood paneling background
    const panelingBackground = document.createElement('div');
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
    `;
    modalContainer.appendChild(panelingBackground);
    
    // Create scrollable content container
    const content = document.createElement('div');
    content.style.cssText = `
        position: relative;
        z-index: 10;
        padding: 30px;
        color: white;
        max-height: 70vh;
        overflow-y: auto;
        scrollbar-width: thin;
        scrollbar-color: #8B4513 #2F1B14;
    `;
    
    // Add custom scrollbar styles
    const scrollbarStyle = document.createElement('style');
    scrollbarStyle.textContent = `
        #rules-modal .content::-webkit-scrollbar {
            width: 8px;
        }
        #rules-modal .content::-webkit-scrollbar-track {
            background: #2F1B14;
            border-radius: 4px;
        }
        #rules-modal .content::-webkit-scrollbar-thumb {
            background: #8B4513;
            border-radius: 4px;
        }
        #rules-modal .content::-webkit-scrollbar-thumb:hover {
            background: #A0522D;
        }
    `;
    document.head.appendChild(scrollbarStyle);
    
    // Create title
    const title = document.createElement('h2');
    title.textContent = '🎮 How to Play WordSlide';
    title.style.cssText = `
        color: #FFFFFF;
        font-size: 28px;
        margin: 0 0 20px 0;
        text-align: center;
        text-shadow: 3px 3px 6px rgba(0, 0, 0, 0.8), 1px 1px 2px rgba(0, 0, 0, 0.9);
        font-weight: bold;
    `;
    
    // Create sections
    const sections = [
        {
            title: '🎯 Objective',
            content: 'Slide letter tiles to form the target words shown at the top of the screen. Complete all words to advance to the next level!'
        },
        {
            title: '🎲 Game Board',
            content: 'The game uses a 7×7 grid with letter tiles and one empty space. Letters can only move into the empty space by sliding adjacent tiles.'
        },
        {
            title: '🖱️ How to Move',
            content: 'Click or tap on any tile adjacent to the empty space to move it. Tiles can move horizontally or vertically, but not diagonally.'
        },
        {
            title: '✅ Word Completion',
            content: 'When you form a complete word (horizontally or vertically), those tiles will turn green and become locked in place. You cannot move tiles that are part of completed words.'
        },
        {
            title: '📊 Progress Tracking',
            content: 'Your move count is displayed at the top. Try to complete each level with as few moves as possible!'
        },
        {
            title: '💡 Using Hints',
            content: 'If you get stuck, use the Hint button (💡) to get a suggestion for your next move. Each hint adds 3 moves to your total, so use them strategically!'
        },
        {
            title: '🔄 Scramble Letters',
            content: 'The "Scramble Letters" button will re-arrange the unsolved letters while keeping your completed words in place. This gives you a fresh perspective without losing progress.'
        },
        {
            title: '🎯 Level Progression',
            content: 'Complete all target words to advance to the next level. Each level has different words to solve. There are 20 levels total!'
        },
        {
            title: '🏆 Winning',
            content: 'Complete all 10 levels to win the game! You\'ll see a celebration with fireworks when you finish.'
        },
        {
            title: '💾 Save & Load',
            content: 'Your progress is automatically saved. You can close the browser and return later to continue from where you left off. Use "New Game" to start completely fresh.'
        },
        {
            title: '📱 Tips & Strategies',
            content: '• Focus on completing one word at a time\n• Look for letters that are already close to their target positions\n• Use the empty space strategically to move multiple tiles\n• Don\'t be afraid to use hints when stuck\n• Try to plan your moves ahead to minimize the total move count'
        }
    ];
    
    // Add title
    content.appendChild(title);
    
    // Add sections
    sections.forEach(section => {
        const sectionDiv = document.createElement('div');
        sectionDiv.style.cssText = `
            margin-bottom: 20px;
            padding: 15px;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 10px;
            border-left: 4px solid #FFD700;
        `;
        
        const sectionTitle = document.createElement('h3');
        sectionTitle.textContent = section.title;
        sectionTitle.style.cssText = `
            color: #FFD700;
            font-size: 18px;
            margin: 0 0 10px 0;
            text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.8);
            font-weight: bold;
        `;
        
        const sectionContent = document.createElement('p');
        sectionContent.textContent = section.content;
        sectionContent.style.cssText = `
            color: #FFFFFF;
            font-size: 14px;
            margin: 0;
            line-height: 1.5;
            text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
        `;
        
        sectionDiv.appendChild(sectionTitle);
        sectionDiv.appendChild(sectionContent);
        content.appendChild(sectionDiv);
    });
    
    // Create close button
    const closeButton = document.createElement('button');
    closeButton.textContent = 'Got it!';
    closeButton.style.cssText = `
        background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%);
        color: white;
        border: none;
        padding: 12px 30px;
        border-radius: 8px;
        font-size: 16px;
        font-weight: bold;
        cursor: pointer;
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
        transition: all 0.2s ease;
        margin-top: 20px;
        display: block;
        margin-left: auto;
        margin-right: auto;
    `;
    closeButton.onmouseover = () => {
        closeButton.style.transform = 'translateY(-2px)';
        closeButton.style.boxShadow = '0 6px 12px rgba(0, 0, 0, 0.4)';
    };
    closeButton.onmouseout = () => {
        closeButton.style.transform = 'translateY(0)';
        closeButton.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.3)';
    };
    closeButton.onclick = () => {
        document.body.removeChild(modalOverlay);
    };
    
    content.appendChild(closeButton);
    modalContainer.appendChild(content);
    modalOverlay.appendChild(modalContainer);
    document.body.appendChild(modalOverlay);
    
    // Handle escape key
    const handleEscape = (e) => {
        if (e.key === 'Escape') {
            document.body.removeChild(modalOverlay);
            document.removeEventListener('keydown', handleEscape);
        }
    };
    document.addEventListener('keydown', handleEscape);
}

function getCurrentWordSet() {
    return WORD_SETS[currentLevel - 1] || WORD_SETS[0];
}

// Track which individual tiles are part of completed words
let completedTiles = [];

// GLOBAL FLAG to completely disable green highlighting
let disableGreenHighlighting = false;

function isWordCompleted(rowIndex) {
    const targetWords = getCurrentWordSet();
    if (rowIndex >= targetWords.length) return false;
    
    const targetWord = targetWords[rowIndex];
    let word = "";
    for (let c = 0; c < targetWord.length; c++) {
        if (!board[rowIndex] || typeof board[rowIndex][c] !== "string") return false;
        word += board[rowIndex][c];
    }
    // Convert both to uppercase for comparison since board letters are uppercase
    const isCompleted = word.toUpperCase() === targetWord.toUpperCase();
    console.log(`Row ${rowIndex}: "${word}" (${word.length} chars) === "${targetWord}" (${targetWord.length} chars) = ${isCompleted}`); // Debug
    console.log(`Row ${rowIndex} board:`, board[rowIndex]); // Debug
    return isCompleted;
}

function isWordCompletedVertical(colIndex) {
    const targetWords = getCurrentWordSet();
    if (colIndex >= targetWords.length) return false;
    
    const targetWord = targetWords[colIndex];
    let word = "";
    for (let r = 0; r < targetWord.length; r++) {
        if (!board[r] || typeof board[r][colIndex] !== "string") return false;
        word += board[r][colIndex];
    }
    // Convert both to uppercase for comparison since board letters are uppercase
    const isCompleted = word.toUpperCase() === targetWord.toUpperCase();
    console.log(`Col ${colIndex}: "${word}" (${word.length} chars) === "${targetWord}" (${targetWord.length} chars) = ${isCompleted}`); // Debug
    console.log(`Col ${colIndex} board:`, board.map(row => row[colIndex])); // Debug
    return isCompleted;
}

function isTileCompleted(r, c) {
    // ULTRA STRICT - Check global disable flag FIRST
    if (disableGreenHighlighting) {
        console.log(`Tile at (${r}, ${c}) - GLOBAL DISABLE FLAG, no green`); // Debug
        return false;
    }
    
    // ULTRA STRICT - During transitions, never show completed tiles
    if (isTransitioning) {
        console.log(`Tile at (${r}, ${c}) - transitioning, no green`); // Debug
        return false;
    }
    
    // ULTRA AGGRESSIVE - If global flag is set, clear completedTiles and return false
    if (disableGreenHighlighting) {
        console.log(`Tile at (${r}, ${c}) - ULTRA AGGRESSIVE: Clearing completedTiles due to global flag`);
        completedTiles = [];
        completedTiles.length = 0;
        return false;
    }
    
    // ULTRA STRICT - If completedTiles is empty, never show completed tiles
    if (!completedTiles || completedTiles.length === 0) {
        console.log(`Tile at (${r}, ${c}) - no completed tiles, no green`); // Debug
        return false;
    }
    
    // ULTRA STRICT - If game is not running, never show completed tiles
    if (!gameRunning) {
        console.log(`Tile at (${r}, ${c}) - game not running, no green`); // Debug
        return false;
    }
    
    const isCompleted = completedTiles.some(tile => tile.r === r && tile.c === c);
    if (isCompleted) {
        console.log(`Tile at (${r}, ${c}) is completed! completedTiles:`, completedTiles); // Debug
    }
    return isCompleted;
}

function checkWordCompletion() {
    // SUPER STRICT - Don't check word completion during level transitions
    if (isTransitioning) {
        console.log("Skipping word completion check during transition");
        return;
    }
    
    // SUPER STRICT - Don't check if game is not running
    if (!gameRunning) {
        console.log("Skipping word completion check - game not running");
        return;
    }
    
    const targetWords = getCurrentWordSet();
    const newCompletedTiles = [];
    
    console.log("=== Word Completion Check ==="); // Debug
    console.log("Target words:", targetWords); // Debug
    console.log("Current board state:", board); // Debug
    
    // Check horizontal words (rows)
    for (let i = 0; i < targetWords.length; i++) {
        const isCompleted = isWordCompleted(i);
        console.log(`Row ${i} completed: ${isCompleted}`); // Debug
        
        if (isCompleted) {
            // Add all tiles from this completed word to the completed tiles list
            const targetWord = targetWords[i];
            for (let c = 0; c < targetWord.length; c++) {
                newCompletedTiles.push({ r: i, c: c });
            }
            console.log(`Added tiles for row ${i}:`, newCompletedTiles); // Debug
        }
    }
    
    // Check vertical words (columns)
    for (let i = 0; i < targetWords.length; i++) {
        const isCompleted = isWordCompletedVertical(i);
        console.log(`Col ${i} completed: ${isCompleted}`); // Debug
        
        if (isCompleted) {
            // Add all tiles from this completed word to the completed tiles list
            const targetWord = targetWords[i];
            for (let r = 0; r < targetWord.length; r++) {
                newCompletedTiles.push({ r: r, c: i });
            }
            console.log(`Added tiles for col ${i}:`, newCompletedTiles); // Debug
        }
    }
    
    // Check for words anywhere on the board (more comprehensive)
    for (let targetWord of targetWords) {
        console.log(`Checking for word: "${targetWord}"`); // Debug
        
        // Check horizontal positions
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c <= cols - targetWord.length; c++) {
                let word = "";
                for (let i = 0; i < targetWord.length; i++) {
                    if (board[r] && board[r][c + i]) {
                        word += board[r][c + i];
                    }
                }
                if (word.toUpperCase() === targetWord.toUpperCase()) {
                    console.log(`Found horizontal word "${targetWord}" at row ${r}, col ${c}`); // Debug
                    for (let i = 0; i < targetWord.length; i++) {
                        newCompletedTiles.push({ r: r, c: c + i });
                    }
                }
            }
        }
        
        // Check vertical positions
        for (let r = 0; r <= rows - targetWord.length; r++) {
            for (let c = 0; c < cols; c++) {
                let word = "";
                for (let i = 0; i < targetWord.length; i++) {
                    if (board[r + i] && board[r + i][c]) {
                        word += board[r + i][c];
                    }
                }
                if (word.toUpperCase() === targetWord.toUpperCase()) {
                    console.log(`Found vertical word "${targetWord}" at row ${r}, col ${c}`); // Debug
                    for (let i = 0; i < targetWord.length; i++) {
                        newCompletedTiles.push({ r: r + i, c: c });
                    }
                }
            }
        }
    }
    
    completedTiles = newCompletedTiles;
    console.log("Final completed tiles:", completedTiles); // Debug
    console.log("Current board:", board); // Debug
    
    // Force a redraw to see the changes
    drawBoard();
    
    // Save state when words are completed
    saveGameState();
}

function wordsAreSolved() {
    const targetWords = getCurrentWordSet();
    console.log("=== Checking if words are solved ==="); // Debug
    console.log("Target words:", targetWords); // Debug
    console.log("Current board:", board); // Debug
    
    let solvedWords = 0;
    const totalWords = targetWords.length;
    const foundWords = new Set(); // Track which words we've found
    
    // Check for each target word anywhere on the board
    for (let targetWord of targetWords) {
        console.log(`Looking for word: "${targetWord}"`); // Debug
        let wordFound = false;
        
        // Check horizontal positions
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c <= cols - targetWord.length; c++) {
                let word = "";
                for (let i = 0; i < targetWord.length; i++) {
                    if (board[r] && board[r][c + i]) {
                        word += board[r][c + i];
                    }
                }
                if (word.toUpperCase() === targetWord.toUpperCase()) {
                    console.log(`✅ Found horizontal word "${targetWord}" at row ${r}, col ${c}`); // Debug
                    wordFound = true;
                    break;
                }
            }
            if (wordFound) break;
        }
        
        // Check vertical positions if not found horizontally
        if (!wordFound) {
            for (let r = 0; r <= rows - targetWord.length; r++) {
                for (let c = 0; c < cols; c++) {
                    let word = "";
                    for (let i = 0; i < targetWord.length; i++) {
                        if (board[r + i] && board[r + i][c]) {
                            word += board[r + i][c];
                        }
                    }
                    if (word.toUpperCase() === targetWord.toUpperCase()) {
                        console.log(`✅ Found vertical word "${targetWord}" at row ${r}, col ${c}`); // Debug
                        wordFound = true;
                        break;
                    }
                }
                if (wordFound) break;
            }
        }
        
        if (wordFound) {
            solvedWords++;
            foundWords.add(targetWord);
        } else {
            console.log(`❌ Word "${targetWord}" not found`); // Debug
        }
    }
    
    console.log(`Solved words: ${solvedWords}/${totalWords}`); // Debug
    console.log("Found words:", Array.from(foundWords)); // Debug
    
    // Check if ALL words are solved
    if (solvedWords >= totalWords) {
        console.log("🎉 ALL WORDS ARE SOLVED! WIN CONDITION MET!"); // Debug
        return true;
    }
    
    console.log("❌ Not all words are solved yet"); // Debug
    return false;
}

function generateBoard() {
    // IMMEDIATELY CLEAR COMPLETED TILES when generating new board
    console.log('generateBoard - Clearing completedTiles before generating new board');
    completedTiles = [];
    completedTiles.length = 0;
    
    // Create a solvable board with the target words
    const targetWords = getCurrentWordSet();
    let attempts = 0;
    const maxAttempts = 10; // Prevent infinite loops
    
    do {
        board = [];
        
        // Initialize empty board
        for (let r = 0; r < rows; r++) {
            board[r] = [];
            for (let c = 0; c < cols; c++) {
                board[r][c] = "";
            }
        }
        
        // Regular board generation
        const allLetters = [];
        
        // Add letters from target words
        for (let r = 0; r < targetWords.length; r++) {
            const word = targetWords[r];
            for (let c = 0; c < word.length; c++) {
                allLetters.push(word[c].toUpperCase());
            }
        }
        
        // Add random letters to fill the board
        const remainingSlots = rows * cols - allLetters.length - 1; // -1 for empty space
        for (let i = 0; i < remainingSlots; i++) {
            allLetters.push(String.fromCharCode(65 + Math.floor(Math.random() * 26)));
        }
        
        // Shuffle all letters
        shuffleArray(allLetters);
        
        // Choose a random position for the empty space
        const emptyRow = Math.floor(Math.random() * rows);
        const emptyCol = Math.floor(Math.random() * cols);
        console.log(`Random empty space position: (${emptyRow}, ${emptyCol})`);
        
        // Place letters on the board in scrambled positions
        let letterIndex = 0;
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                if (r === emptyRow && c === emptyCol) {
                    board[r][c] = ""; // Empty space in random position
                } else {
                    board[r][c] = allLetters[letterIndex++];
                }
            }
        }
        
        // Ensure the board is not already solved by making strategic swaps
        // This guarantees the puzzle requires solving
        const scrambleMoves = Math.floor(Math.random() * 3) + 2; // 2-4 random moves
        
        for (let i = 0; i < scrambleMoves; i++) {
            // Find two random positions to swap
            let pos1 = { r: Math.floor(Math.random() * rows), c: Math.floor(Math.random() * cols) };
            let pos2 = { r: Math.floor(Math.random() * rows), c: Math.floor(Math.random() * cols) };
            
            // Make sure we're not swapping with the empty space
            while ((pos1.r === rows - 1 && pos1.c === cols - 1) || 
                   (pos2.r === rows - 1 && pos2.c === cols - 1)) {
                pos1 = { r: Math.floor(Math.random() * rows), c: Math.floor(Math.random() * cols) };
                pos2 = { r: Math.floor(Math.random() * rows), c: Math.floor(Math.random() * cols) };
            }
            
            // Swap the letters
            const temp = board[pos1.r][pos1.c];
            board[pos1.r][pos1.c] = board[pos2.r][pos2.c];
            board[pos2.r][pos2.c] = temp;
        }
        
        // Find the empty position
        emptyPos = { r: emptyRow, c: emptyCol };
        
        attempts++;
        
        // Check if any target words are already solved
        let hasSolvedWords = false;
        for (let targetWord of targetWords) {
            // Check horizontal positions
            for (let r = 0; r < rows; r++) {
                for (let c = 0; c <= cols - targetWord.length; c++) {
                    let word = "";
                    for (let i = 0; i < targetWord.length; i++) {
                        if (board[r] && board[r][c + i]) {
                            word += board[r][c + i];
                        }
                    }
                    if (word.toUpperCase() === targetWord.toUpperCase()) {
                        hasSolvedWords = true;
                        break;
                    }
                }
                if (hasSolvedWords) break;
            }
            
            // Check vertical positions
            if (!hasSolvedWords) {
                for (let r = 0; r <= rows - targetWord.length; r++) {
                    for (let c = 0; c < cols; c++) {
                        let word = "";
                        for (let i = 0; i < targetWord.length; i++) {
                            if (board[r + i] && board[r + i][c]) {
                                word += board[r + i][c];
                            }
                        }
                        if (word.toUpperCase() === targetWord.toUpperCase()) {
                            hasSolvedWords = true;
                            break;
                        }
                    }
                    if (hasSolvedWords) break;
                }
            }
            
            if (hasSolvedWords) break;
        }
        
        // If no words are solved, we can use this board
        if (!hasSolvedWords) {
            console.log(`Board generated successfully after ${attempts} attempts`);
            break;
        }
        
        console.log(`Attempt ${attempts}: Board had solved words, regenerating...`);
        
    } while (attempts < maxAttempts);
    
    // If we've reached max attempts, just use the last generated board
    // and add extra scrambling to ensure it's not solved
    if (attempts >= maxAttempts) {
        console.log(`Reached max attempts (${maxAttempts}), adding extra scrambling`);
        // Add more aggressive scrambling
        for (let i = 0; i < 10; i++) {
            let pos1 = { r: Math.floor(Math.random() * rows), c: Math.floor(Math.random() * cols) };
            let pos2 = { r: Math.floor(Math.random() * rows), c: Math.floor(Math.random() * cols) };
            
            while ((pos1.r === rows - 1 && pos1.c === cols - 1) || 
                   (pos2.r === rows - 1 && pos2.c === cols - 1)) {
                pos1 = { r: Math.floor(Math.random() * rows), c: Math.floor(Math.random() * cols) };
                pos2 = { r: Math.floor(Math.random() * rows), c: Math.floor(Math.random() * cols) };
            }
            
            const temp = board[pos1.r][pos1.c];
            board[pos1.r][pos1.c] = board[pos2.r][pos2.c];
            board[pos2.r][pos2.c] = temp;
        }
    }
}

function handleInput(event) {
    // Check if we're in Tetris game mode
    if (currentGameMode === 'tetris') {
        // Use Tetris input handler
        handleTetrisInput(event);
        return;
    }
    
    // Safety check - if canvas is not defined, this might be a Tetris game event
    if (!canvas) {
        return;
    }
    
    // Additional safety check - prevent double handling in Tetris mode
    if (currentGameMode === 'tetris') {
        console.log('handleInput: Already handled by Tetris, ignoring duplicate call');
        return;
    }
    
    let x, y;
    if (event.type === 'touchstart') {
        const rect = canvas.getBoundingClientRect();
        x = event.touches[0].clientX - rect.left;
        y = event.touches[0].clientY - rect.top;
    } else if (event.type === 'mousedown') {
        const rect = canvas.getBoundingClientRect();
        x = event.clientX - rect.left;
        y = event.clientY - rect.top;
    } else {
        return;
    }
    const { r, c } = getCellFromCoords(x, y);
    tryMove(r, c);
}

function createDarkWoodPaneling() {
    // Create dark oak slat wall background container
    const panelingContainer = document.createElement('div');
    panelingContainer.id = 'dark-wood-paneling';
    panelingContainer.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: 
            linear-gradient(135deg, #1A0F0A 0%, #2D1810 15%, #3D2318 30%, #4A2C1A 45%, #5D3A1F 60%, #4A2C1A 75%, #3D2318 90%, #2D1810 100%),
            repeating-linear-gradient(
                90deg,
                transparent,
                transparent 2px,
                rgba(26, 15, 10, 0.8) 2px,
                rgba(26, 15, 10, 0.8) 4px
            ),
            repeating-linear-gradient(
                0deg,
                transparent,
                transparent 3px,
                rgba(45, 24, 16, 0.9) 3px,
                rgba(45, 24, 16, 0.9) 12px
            );
        z-index: -1;
        pointer-events: none;
    `;
    
    // Create dark oak slats - vertical orientation for slot wall
    const slatWidth = 120; // Width of each oak slat
    const slatHeight = window.innerHeight; // Full height slats
    const slatsPerRow = Math.ceil(window.innerWidth / slatWidth) + 2;
    
    for (let col = 0; col < slatsPerRow; col++) {
        const slat = document.createElement('div');
        slat.style.cssText = `
            position: absolute;
            top: 0;
            left: ${col * slatWidth}px;
            width: ${slatWidth}px;
            height: ${slatHeight}px;
            background: 
                linear-gradient(135deg, #1A0F0A 0%, #2D1810 20%, #3D2318 40%, #4A2C1A 60%, #5D3A1F 80%, #4A2C1A 100%),
                repeating-linear-gradient(
                    0deg,
                    transparent,
                    transparent 1px,
                    rgba(26, 15, 10, 0.9) 1px,
                    rgba(26, 15, 10, 0.9) 2px
                ),
                repeating-linear-gradient(
                    90deg,
                    transparent,
                    transparent 3px,
                    rgba(45, 24, 16, 0.8) 3px,
                    rgba(45, 24, 16, 0.8) 8px
                );
            border: 1px solid rgba(93, 58, 31, 0.4);
            box-shadow: 
                inset 0 0 15px rgba(0, 0, 0, 0.6),
                inset 0 0 30px rgba(255, 255, 255, 0.03),
                0 2px 8px rgba(0, 0, 0, 0.4);
            pointer-events: none;
        `;
        
        // Add dark oak grain variations
        const grainOverlay = document.createElement('div');
        grainOverlay.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: 
                repeating-linear-gradient(
                    0deg,
                    transparent,
                    transparent 2px,
                    rgba(26, 15, 10, 0.7) 2px,
                    rgba(26, 15, 10, 0.7) 4px
                ),
                repeating-linear-gradient(
                    90deg,
                    transparent,
                    transparent 1px,
                    rgba(45, 24, 16, 0.6) 1px,
                    rgba(45, 24, 16, 0.6) 3px
                );
            pointer-events: none;
        `;
        
        // Add oak knots and natural variations
        const knotOverlay = document.createElement('div');
        knotOverlay.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: 
                radial-gradient(ellipse 20px 15px at ${20 + Math.random() * 60}% ${30 + Math.random() * 40}%, rgba(26, 15, 10, 0.8) 0%, transparent 70%),
                radial-gradient(ellipse 15px 10px at ${40 + Math.random() * 40}% ${60 + Math.random() * 30}%, rgba(45, 24, 16, 0.7) 0%, transparent 60%),
                radial-gradient(ellipse 25px 20px at ${10 + Math.random() * 80}% ${20 + Math.random() * 60}%, rgba(26, 15, 10, 0.6) 0%, transparent 80%);
            pointer-events: none;
        `;
        
        // Add subtle wood pores
        const poreOverlay = document.createElement('div');
        poreOverlay.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: 
                repeating-linear-gradient(
                    0deg,
                    transparent,
                    transparent 8px,
                    rgba(26, 15, 10, 0.3) 8px,
                    rgba(26, 15, 10, 0.3) 9px
                );
            pointer-events: none;
        `;
        
        // Add 3D depth with multiple shadow layers
        const depthOverlay = document.createElement('div');
        depthOverlay.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: 
                linear-gradient(90deg, 
                    rgba(0, 0, 0, 0.4) 0%, 
                    transparent 10%, 
                    transparent 90%, 
                    rgba(0, 0, 0, 0.4) 100%
                ),
                linear-gradient(0deg, 
                    rgba(0, 0, 0, 0.3) 0%, 
                    transparent 20%, 
                    transparent 80%, 
                    rgba(0, 0, 0, 0.3) 100%
                );
            pointer-events: none;
        `;
        
        // Add slat edges for slot wall effect
        const edgeOverlay = document.createElement('div');
        edgeOverlay.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: 
                linear-gradient(90deg, 
                    rgba(0, 0, 0, 0.6) 0%, 
                    transparent 5%, 
                    transparent 95%, 
                    rgba(0, 0, 0, 0.6) 100%
                );
            pointer-events: none;
        `;
        
        // Add subtle highlights for wood grain direction
        const highlightOverlay = document.createElement('div');
        highlightOverlay.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: 
                linear-gradient(135deg, 
                    rgba(255, 255, 255, 0.02) 0%, 
                    transparent 30%, 
                    transparent 70%, 
                    rgba(255, 255, 255, 0.02) 100%
                );
            pointer-events: none;
        `;
        
        // Assemble the slat with all overlays
        slat.appendChild(grainOverlay);
        slat.appendChild(knotOverlay);
        slat.appendChild(poreOverlay);
        slat.appendChild(depthOverlay);
        slat.appendChild(edgeOverlay);
        slat.appendChild(highlightOverlay);
        
        panelingContainer.appendChild(slat);
    }
    
    // Add overall texture overlay for the entire wall
    const wallTexture = document.createElement('div');
    wallTexture.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: 
            repeating-linear-gradient(
                45deg,
                transparent,
                transparent 1px,
                rgba(26, 15, 10, 0.1) 1px,
                rgba(26, 15, 10, 0.1) 2px
            ),
            repeating-linear-gradient(
                -45deg,
                transparent,
                transparent 1px,
                rgba(45, 24, 16, 0.08) 1px,
                rgba(45, 24, 16, 0.08) 2px
            );
        pointer-events: none;
    `;
    
    // Add subtle ambient lighting
    const ambientLight = document.createElement('div');
    ambientLight.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: 
            radial-gradient(ellipse 800px 600px at 50% 30%, rgba(255, 255, 255, 0.03) 0%, transparent 70%),
            radial-gradient(ellipse 600px 400px at 80% 70%, rgba(255, 255, 255, 0.02) 0%, transparent 60%);
        pointer-events: none;
    `;
    
    panelingContainer.appendChild(wallTexture);
    panelingContainer.appendChild(ambientLight);
    
    // Remove existing paneling if present
    const existingPaneling = document.getElementById('dark-wood-paneling');
    if (existingPaneling) {
        existingPaneling.remove();
    }
    
    document.body.appendChild(panelingContainer);
    console.log('Dark oak slat wall paneling created');
}

function startGame() {
    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');
    
    // Create dark wood paneling background
    createDarkWoodPaneling();
    
    // Try to load saved game state
    const loadedState = loadGameState();
    
    if (loadedState && board) {
        // Restore from saved state
        console.log('Restoring game from saved state');
        updateMoveCounter();
        updateLevelDisplay();
        updateTargetWordsDisplay();
        drawBoard();
    } else {
        // Start fresh game
        console.log('Starting fresh game');
        generateBoard();
        gameRunning = true;
        completedTiles = [];
        updateMoveCounter();
        updateLevelDisplay();
        updateTargetWordsDisplay();
        drawBoard();
    }
    
    // Set up canvas-specific event listeners
    canvas.addEventListener('mousedown', handleInput);
    canvas.addEventListener('touchstart', handleInput);
    
    updateGame();
}

function drawBoard(anim = null) {
    // DEBUG - Log when drawBoard is called
    console.log(`drawBoard called - isTransitioning: ${isTransitioning}, gameRunning: ${gameRunning}, disableGreenHighlighting: ${disableGreenHighlighting}, completedTiles.length: ${completedTiles ? completedTiles.length : 'null'}`);
    
    const cellSize = canvas.width / cols;
    ctx.font = `bold ${cellSize / 2.5}px Arial`; // Smaller font for mobile
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    
    // SUPER STRICT - Never show green highlighting during transitions
    const forceNoGreen = isTransitioning || !gameRunning || !completedTiles || completedTiles.length === 0 || disableGreenHighlighting;
    
    // ULTRA AGGRESSIVE - If we're transitioning or global flag is set, ALWAYS force no green
    if (isTransitioning || disableGreenHighlighting) {
        console.log('drawBoard - ULTRA AGGRESSIVE: Forcing no green due to transition or global flag');
        completedTiles = [];
        completedTiles.length = 0;
    }
    
    if (forceNoGreen) {
        console.log('drawBoard - forceNoGreen is TRUE, no green highlighting will be shown');
        // AGGRESSIVE - Clear completedTiles if any of the conditions are met
        if (completedTiles && completedTiles.length > 0) {
            console.log('drawBoard - Clearing completedTiles because forceNoGreen is true');
            completedTiles = [];
            completedTiles.length = 0;
        }
    }

    // Draw oak wood board background with realistic texture
    const boardGradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    boardGradient.addColorStop(0, "#F5DEB3"); // Wheat
    boardGradient.addColorStop(0.2, "#DEB887"); // Burlywood
    boardGradient.addColorStop(0.4, "#D2B48C"); // Tan
    boardGradient.addColorStop(0.6, "#CD853F"); // Peru
    boardGradient.addColorStop(0.8, "#A0522D"); // Sienna
    boardGradient.addColorStop(1, "#8B4513"); // Saddle brown
    
    ctx.fillStyle = boardGradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Add oak wood grain patterns
    ctx.strokeStyle = "rgba(139, 69, 19, 0.4)";
    ctx.lineWidth = 1;
    
    // Vertical grain lines (characteristic of oak)
    for (let i = 0; i < canvas.width; i += 3) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i + 1, canvas.height);
        ctx.stroke();
    }
    
    // Horizontal growth rings
    ctx.strokeStyle = "rgba(160, 82, 45, 0.5)";
    ctx.lineWidth = 2;
    for (let i = 0; i < canvas.height; i += 12) {
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(canvas.width, i);
        ctx.stroke();
    }
    
    // Diagonal grain patterns
    ctx.strokeStyle = "rgba(101, 67, 33, 0.3)";
    ctx.lineWidth = 1;
    for (let i = 0; i < canvas.width + canvas.height; i += 20) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i + 8, canvas.height);
        ctx.stroke();
    }
    
    // Add oak medullary rays (characteristic white lines in oak)
    ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
    ctx.lineWidth = 1;
    for (let i = 0; i < canvas.height; i += 8) {
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(canvas.width, i);
        ctx.stroke();
    }
    
    // Add light variations across the wood
    const lightGradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
    lightGradient.addColorStop(0, "rgba(255, 255, 255, 0.1)");
    lightGradient.addColorStop(0.3, "transparent");
    lightGradient.addColorStop(0.7, "transparent");
    lightGradient.addColorStop(1, "rgba(0, 0, 0, 0.1)");
    
    ctx.fillStyle = lightGradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Add board shadow for 3D effect
    ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
    ctx.fillRect(15, 15, canvas.width, canvas.height);
    
    // Draw board with 3D border
    ctx.fillStyle = boardGradient;
    ctx.fillRect(0, 0, canvas.width - 15, canvas.height - 15);

    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            const x = c * cellSize;
            const y = r * cellSize;
            
            // If animating, skip drawing the moving letter in its original spot
            // Also ensure empty space is drawn consistently during animation
            if (anim && anim.from.r === r && anim.from.c === c) {
                // Draw empty space consistently during animation
                ctx.fillStyle = "#654321";
                ctx.fillRect(x + 2, y + 2, cellSize - 4, cellSize - 4);
                
                ctx.strokeStyle = "#4A2C1A";
                ctx.lineWidth = 2;
                ctx.strokeRect(x + 2, y + 2, cellSize - 4, cellSize - 4);
                continue;
            }

            if (board[r][c] === "") {
                // Draw empty space as a recessed area - always consistent
                ctx.fillStyle = "#654321";
                ctx.fillRect(x + 2, y + 2, cellSize - 4, cellSize - 4);
                
                // Add shadow to make it look recessed
                ctx.strokeStyle = "#4A2C1A";
                ctx.lineWidth = 2;
                ctx.strokeRect(x + 2, y + 2, cellSize - 4, cellSize - 4);
            } else {
                // Check if this tile is part of a completed word
                const isCompleted = forceNoGreen ? false : isTileCompleted(r, c);
                
                // DEBUG - Log if any tile is being marked as completed
                if (isCompleted) {
                    console.log(`drawBoard - Tile at (${r}, ${c}) with letter "${board[r][c]}" is being marked as completed! forceNoGreen: ${forceNoGreen}`);
                }
                
                // Draw enhanced 3D block tile
                const blockHeight = 18; // Much more pronounced 3D effect
                
                // Draw enhanced bottom shadow with multiple layers
                ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
                ctx.fillRect(x + blockHeight, y + blockHeight, cellSize - 4, cellSize - 4);
                
                // Draw additional shadow layers for extreme depth
                ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
                ctx.fillRect(x + blockHeight - 3, y + blockHeight - 3, cellSize - 4, cellSize - 4);
                
                ctx.fillStyle = "rgba(0, 0, 0, 0.2)";
                ctx.fillRect(x + blockHeight - 6, y + blockHeight - 6, cellSize - 4, cellSize - 4);
                
                // Draw right side of block with enhanced 3D
                ctx.fillStyle = isCompleted ? "#2E8B57" : "#A0522D"; // Green for completed
                ctx.beginPath();
                ctx.moveTo(x + cellSize - 4, y);
                ctx.lineTo(x + cellSize - 4 + blockHeight, y + blockHeight);
                ctx.lineTo(x + cellSize - 4 + blockHeight, y + cellSize - 4 + blockHeight);
                ctx.lineTo(x + cellSize - 4, y + cellSize - 4);
                ctx.closePath();
                ctx.fill();
                
                // Draw bottom side of block with enhanced 3D
                ctx.fillStyle = isCompleted ? "#228B22" : "#8B4513"; // Green for completed
                ctx.beginPath();
                ctx.moveTo(x, y + cellSize - 4);
                ctx.lineTo(x + cellSize - 4, y + cellSize - 4);
                ctx.lineTo(x + cellSize - 4 + blockHeight, y + cellSize - 4 + blockHeight);
                ctx.lineTo(x + blockHeight, y + cellSize - 4 + blockHeight);
                ctx.closePath();
                ctx.fill();
                
                // Add intense highlight on top edge for dramatic 3D effect
                ctx.strokeStyle = isCompleted ? "#90EE90" : "#FFFFFF";
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.moveTo(x, y);
                ctx.lineTo(x + cellSize - 4, y);
                ctx.stroke();
                
                // Add intense highlight on left edge for dramatic 3D effect
                ctx.beginPath();
                ctx.moveTo(x, y);
                ctx.lineTo(x, y + cellSize - 4);
                ctx.stroke();
                
                // Add secondary highlight for extra depth
                ctx.strokeStyle = isCompleted ? "#90EE90" : "#F5DEB3";
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(x + 1, y + 1);
                ctx.lineTo(x + cellSize - 5, y + 1);
                ctx.stroke();
                
                ctx.beginPath();
                ctx.moveTo(x + 1, y + 1);
                ctx.lineTo(x + 1, y + cellSize - 5);
                ctx.stroke();
                
                // Draw main face of block
                let tileGradient;
                if (isCompleted) {
                    tileGradient = ctx.createLinearGradient(x, y, x + cellSize, y + cellSize);
                    tileGradient.addColorStop(0, "#00FF00"); // Bright green
                    tileGradient.addColorStop(0.3, "#00CC00"); // Medium green
                    tileGradient.addColorStop(0.7, "#009900"); // Dark green
                    tileGradient.addColorStop(1, "#006600"); // Very dark green
                } else {
                    tileGradient = ctx.createLinearGradient(x, y, x + cellSize, y + cellSize);
                    tileGradient.addColorStop(0, "#F5DEB3"); // Wheat
                    tileGradient.addColorStop(0.3, "#DEB887"); // Burlywood
                    tileGradient.addColorStop(0.7, "#D2B48C"); // Tan
                    tileGradient.addColorStop(1, "#BC8F8F"); // Rosy brown
                }
                
                ctx.fillStyle = tileGradient;
                ctx.fillRect(x, y, cellSize - 4, cellSize - 4);
                
                // Add bright border for completed tiles
                if (isCompleted) {
                    ctx.strokeStyle = "#00FF00";
                    ctx.lineWidth = 3;
                    ctx.strokeRect(x, y, cellSize - 4, cellSize - 4);
                }
                
                // Add wood grain to tile
                ctx.strokeStyle = "#CD853F";
                ctx.lineWidth = 0.5;
                for (let i = 0; i < 3; i++) {
                    ctx.beginPath();
                    ctx.moveTo(x + 5 + i * 8, y + 5);
                    ctx.lineTo(x + 8 + i * 8, y + cellSize - 9);
                    ctx.stroke();
                }
                
                // Draw letter with clean 3D effect (like sliding animation)
                ctx.save();
                ctx.fillStyle = "#654321"; // Darker brown
                ctx.shadowColor = "transparent";
                ctx.shadowBlur = 0;
                ctx.shadowOffsetX = 0;
                ctx.shadowOffsetY = 0;
                ctx.fillText(
                    board[r][c],
                    x + (cellSize - 4) / 2,
                    y + (cellSize - 4) / 2
                );
                ctx.restore();
                
                // Add subtle highlight to letter (darker)
                ctx.fillStyle = "#8B4513";
                ctx.shadowColor = "transparent";
                ctx.shadowBlur = 0;
                ctx.shadowOffsetX = 0;
                ctx.shadowOffsetY = 0;
                ctx.fillText(
                    board[r][c],
                    x + (cellSize - 4) / 2 - 1,
                    y + (cellSize - 4) / 2 - 1
                );
            }
        }
    }

    // Draw the moving letter if animating
    if (anim) {
        const t = anim.progress / anim.duration;
        const startX = anim.from.c * cellSize + (cellSize - 4) / 2;
        const startY = anim.from.r * cellSize + (cellSize - 4) / 2;
        const endX = anim.to.c * cellSize + (cellSize - 4) / 2;
        const endY = anim.to.r * cellSize + (cellSize - 4) / 2;
        const x = startX + (endX - startX) * t;
        const y = startY + (endY - startY) * t;

        // Draw moving tile as a simple block (no 3D effects)
        const blockSize = cellSize - 4;
        
        // Main face - same as stationary tiles
        let tileGradient;
        tileGradient = ctx.createLinearGradient(x - blockSize/2, y - blockSize/2, x + blockSize/2, y + blockSize/2);
        tileGradient.addColorStop(0, "#F5DEB3"); // Wheat
        tileGradient.addColorStop(0.3, "#DEB887"); // Burlywood
        tileGradient.addColorStop(0.7, "#D2B48C"); // Tan
        tileGradient.addColorStop(1, "#BC8F8F"); // Rosy brown
        
        ctx.fillStyle = tileGradient;
        ctx.fillRect(x - blockSize/2, y - blockSize/2, blockSize, blockSize);
        
        // Simple border
        ctx.strokeStyle = "#8B4513";
        ctx.lineWidth = 2;
        ctx.strokeRect(x - blockSize/2, y - blockSize/2, blockSize, blockSize);
        
                        // Letter
                ctx.save();
                ctx.fillStyle = "#654321"; // Darker brown
                ctx.shadowColor = "transparent";
                ctx.shadowBlur = 0;
                ctx.shadowOffsetX = 0;
                ctx.shadowOffsetY = 0;
                ctx.fillText(anim.letter, x, y);
                ctx.restore();
        
        // Highlight (darker)
        ctx.fillStyle = "#8B4513";
        ctx.shadowColor = "transparent";
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
        ctx.fillText(anim.letter, x - 1, y - 1);
    }
}

function updateGame() {
    // Only run the game loop if gameRunning is true
    if (!gameRunning) {
        requestAnimationFrame(updateGame);
        return;
    }
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (animating && animation) {
        drawBoard(animation);
        animation.progress++;
        if (animation.progress >= animation.duration) {
            // Finish animation and swap
            board[animation.to.r][animation.to.c] = animation.letter;
            board[animation.from.r][animation.from.c] = "";
            emptyPos = { r: animation.from.r, c: animation.from.c };
            animating = false;
            animation = null;
            
            console.log("Board after move:", board); // Debug
            console.log("Empty pos:", emptyPos); // Debug
            
            // Check for word completion after each move
            checkWordCompletion();
            
            // Check for win condition after each move
            console.log("Checking win condition..."); // Debug
            const isSolved = wordsAreSolved();
            console.log("Words are solved:", isSolved); // Debug
            if (isSolved) {
                console.log("🎉 WIN CONDITION MET! Showing fireworks!"); // Debug
                showWinPopup();
            }
        }
    } else {
        drawBoard();
    }

    requestAnimationFrame(updateGame);
}

// Prevent pull-to-refresh and show confirmation modal
let touchStartY = 0;
let touchStartX = 0;
let isPulling = false;
let pullDistance = 0;

window.addEventListener('touchstart', (e) => {
    touchStartY = e.touches[0].clientY;
    touchStartX = e.touches[0].clientX;
    isPulling = false;
    pullDistance = 0;
    
    // Handle game input
    handleInput(e);
});

window.addEventListener('touchmove', (e) => {
    if (!touchStartY) return;
    
    const touchY = e.touches[0].clientY;
    const touchX = e.touches[0].clientX;
    const deltaY = touchY - touchStartY;
    const deltaX = Math.abs(touchX - touchStartX);
    
    // Only detect pull-to-refresh when:
    // 1. At the very top of the page (scrollY === 0)
    // 2. Pulling down significantly (more than 100px)
    // 3. Not much horizontal movement (less than 50px)
    // 4. Touch started near the top of the screen (within 100px)
    if (window.scrollY === 0 && 
        deltaY > 100 && 
        deltaX < 50 && 
        touchStartY < 100) {
        
        isPulling = true;
        pullDistance = deltaY;
        e.preventDefault();
    }
});

window.addEventListener('touchend', (e) => {
    if (isPulling && pullDistance > 150) {
        e.preventDefault();
        showReloadConfirmationModal();
    }
    touchStartY = 0;
    touchStartX = 0;
    isPulling = false;
    pullDistance = 0;
});

// Only prevent default pull-to-refresh when at the very top
document.addEventListener('touchmove', (e) => {
    if (window.scrollY === 0 && e.touches[0].clientY > 0 && e.touches[0].clientY < 100) {
        e.preventDefault();
    }
}, { passive: false });

window.addEventListener('DOMContentLoaded', () => {
    // Show main menu by default instead of starting the game
    showMainMenu();
    initializeTitleTiles();
});

function initializeTitleTiles() {
    const tiles = document.querySelectorAll('.title-tiles .tile');
    
    tiles.forEach((tile, index) => {
        // Add staggered animation on load
        tile.style.opacity = '0';
        tile.style.transform = 'translateY(20px)';
        
        setTimeout(() => {
            tile.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
            tile.style.opacity = '1';
            tile.style.transform = 'translateY(0)';
        }, index * 100);
        
        // Add click animation
        tile.addEventListener('click', function() {
            this.style.transform = 'scale(0.95) translateY(-2px)';
            setTimeout(() => {
                this.style.transform = 'scale(1) translateY(-2px)';
            }, 150);
        });
        
        // Add hover effect
        tile.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-3px) scale(1.05)';
        });
        
        tile.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0) scale(1)';
        });
    });
}

// Function to show reload confirmation modal
function showReloadConfirmationModal() {
    // Create modal overlay
    const modalOverlay = document.createElement('div');
    modalOverlay.id = 'reload-confirmation-modal';
    modalOverlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.7);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 3000;
        font-family: Arial, sans-serif;
    `;
    
    // Create modal container with wood paneling
    const modalContainer = document.createElement('div');
    modalContainer.style.cssText = `
        position: relative;
        width: 350px;
        max-width: 90vw;
        background: transparent;
        border-radius: 20px;
        overflow: hidden;
        box-shadow: 
            0 20px 60px rgba(0, 0, 0, 0.8),
            0 0 40px rgba(47, 27, 20, 0.8);
        border: 4px solid #2F1B14;
    `;
    
    // Create dark wood paneling background
    const panelingBackground = document.createElement('div');
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
    `;
    modalContainer.appendChild(panelingBackground);
    
    // Create content container
    const content = document.createElement('div');
    content.style.cssText = `
        position: relative;
        z-index: 10;
        padding: 30px;
        text-align: center;
        color: white;
    `;
    
    // Create title
    const title = document.createElement('h3');
    title.textContent = '🔄 Reload Game?';
    title.style.cssText = `
        color: #FFFFFF;
        font-size: 24px;
        margin: 0 0 15px 0;
        text-shadow: 3px 3px 6px rgba(0, 0, 0, 0.8), 1px 1px 2px rgba(0, 0, 0, 0.9);
        font-weight: bold;
    `;
    
    // Create message
    const message = document.createElement('p');
    message.textContent = 'Are you sure you want to reload the game? This will restart from level 1.';
    message.style.cssText = `
        color: #FFFFFF;
        font-size: 16px;
        margin: 0 0 25px 0;
        line-height: 1.4;
        text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.8);
    `;
    
    // Create button container
    const buttonContainer = document.createElement('div');
    buttonContainer.style.cssText = `
        display: flex;
        gap: 15px;
        justify-content: center;
    `;
    
    // Create Cancel button
    const cancelButton = document.createElement('button');
    cancelButton.textContent = 'Cancel';
    cancelButton.onclick = () => {
        document.body.removeChild(modalOverlay);
    };
    cancelButton.style.cssText = `
        background: linear-gradient(135deg, #6B7280, #4B5563);
        color: white;
        border: none;
        padding: 12px 24px;
        font-size: 16px;
        font-weight: bold;
        border-radius: 8px;
        cursor: pointer;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        transition: transform 0.2s, box-shadow 0.2s;
        text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);
    `;
    
    // Create Reload button
    const reloadButton = document.createElement('button');
    reloadButton.textContent = 'Reload';
    reloadButton.onclick = () => {
        location.reload();
    };
    reloadButton.style.cssText = `
        background: linear-gradient(135deg, #EF4444, #DC2626);
        color: white;
        border: none;
        padding: 12px 24px;
        font-size: 16px;
        font-weight: bold;
        border-radius: 8px;
        cursor: pointer;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        transition: transform 0.2s, box-shadow 0.2s;
        text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);
    `;
    
    // Add hover effects
    [cancelButton, reloadButton].forEach(button => {
        button.onmouseenter = () => {
            button.style.transform = 'scale(1.05)';
            button.style.boxShadow = '0 6px 16px rgba(0, 0, 0, 0.4)';
        };
        button.onmouseleave = () => {
            button.style.transform = 'scale(1)';
            button.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.3)';
        };
    });
    
    // Assemble the modal
    buttonContainer.appendChild(cancelButton);
    buttonContainer.appendChild(reloadButton);
    content.appendChild(title);
    content.appendChild(message);
    content.appendChild(buttonContainer);
    modalContainer.appendChild(content);
    modalOverlay.appendChild(modalContainer);
    document.body.appendChild(modalOverlay);
    
    // Add click outside to close
    modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) {
            document.body.removeChild(modalOverlay);
        }
    });
    
    // Add escape key to close
    const handleEscape = (e) => {
        if (e.key === 'Escape') {
            document.body.removeChild(modalOverlay);
            document.removeEventListener('keydown', handleEscape);
        }
    };
    document.addEventListener('keydown', handleEscape);
}

function startGravityAnimation(completedTiles) {
    // Set animation flag
    tetrisAnimating = true;
    tetrisAnimation = { isGravity: true };
    
    // Find all columns that had completed tiles
    const affectedColumns = [...new Set(completedTiles.map(tile => tile.c))];
    
    // For each affected column, find tiles that need to drop
    const droppingTiles = [];
    
    for (const col of affectedColumns) {
        // Find the highest row that had a completed tile in this column
        const highestCompletedRow = Math.min(...completedTiles.filter(tile => tile.c === col).map(tile => tile.r));
        
        // Find all tiles above the completed area that need to drop
        for (let row = 0; row < highestCompletedRow; row++) {
            if (tetrisBoard[row][col] !== '') {
                // Calculate how many spaces this tile needs to drop
                const spacesToDrop = completedTiles.filter(tile => tile.c === col && tile.r >= row).length;
                
                if (spacesToDrop > 0) {
                    droppingTiles.push({
                        from: { r: row, c: col },
                        to: { r: row + spacesToDrop, c: col },
                        letter: tetrisBoard[row][col],
                        startTime: Date.now()
                    });
                }
            }
        }
    }
    
    if (droppingTiles.length === 0) {
        // No tiles to drop, just generate new word
        tetrisAnimating = false;
        tetrisAnimation = null;
        generateNewTetrisWord();
        saveTetrisGameState();
        return;
    }
    
    const gravityDuration = 1500; // 1.5 seconds for more visible gravity animation
    
    function animateGravity() {
        const currentTime = Date.now();
        const tetrisCanvas = document.getElementById('tetrisCanvas');
        const ctx = tetrisCanvas.getContext('2d');
        const cellSize = tetrisCanvas.width / 7;
        
        // Clear canvas and draw the current board state
        ctx.clearRect(0, 0, tetrisCanvas.width, tetrisCanvas.height);
        drawTetrisBoard();
        
        // Animate dropping tiles
        let allDropped = true;
        for (const tile of droppingTiles) {
            const elapsed = currentTime - tile.startTime;
            const progress = Math.min(elapsed / gravityDuration, 1);
            
            if (progress < 1) {
                allDropped = false;
                
                // Calculate current position
                const startX = tile.from.c * cellSize + (cellSize - 4) / 2;
                const startY = tile.from.r * cellSize + (cellSize - 4) / 2;
                const endX = tile.to.c * cellSize + (cellSize - 4) / 2;
                const endY = tile.to.r * cellSize + (cellSize - 4) / 2;
                const x = startX + (endX - startX) * progress;
                const y = startY + (endY - startY) * progress;
                
                // Draw dropping tile
                drawDroppingTile(ctx, tile, x, y, cellSize);
            }
        }
        
        if (!allDropped) {
            requestAnimationFrame(animateGravity);
        } else {
            // Animation complete - update board state
            
            // Move tiles to their final positions
            for (const tile of droppingTiles) {
                tetrisBoard[tile.to.r][tile.to.c] = tile.letter;
                tetrisBoard[tile.from.r][tile.from.c] = '';
            }
            
            // Update empty position to the highest empty space
            let highestEmptyRow = 0;
            for (let r = 0; r < 7; r++) {
                for (let c = 0; c < 7; c++) {
                    if (tetrisBoard[r][c] === '') {
                        if (r > highestEmptyRow) {
                            highestEmptyRow = r;
                        }
                    }
                }
            }
            
            // Find the leftmost empty space in the highest row
            for (let c = 0; c < 7; c++) {
                if (tetrisBoard[highestEmptyRow][c] === '') {
                    tetrisEmptyPos = { r: highestEmptyRow, c: c };
                    break;
                }
            }
            
            // Clear animation flags
            tetrisAnimating = false;
            tetrisAnimation = null;
            
            // Save game state
            saveTetrisGameState();
            
            // Start new letters animation to fill empty spaces
            startNewLettersAnimation(completedTiles);
        }
    }
    
    animateGravity();
}

function drawDroppingTile(ctx, tile, x, y, cellSize) {
    const blockSize = cellSize - 4;
    
    // Add motion blur effect for dropping tiles
    ctx.save();
    ctx.shadowColor = "rgba(0, 0, 0, 0.3)";
    ctx.shadowBlur = 8;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 4;
    
    // Draw enhanced 3D block tile for dropping tile
    const blockHeight = 18;
    
    // Draw enhanced bottom shadow with multiple layers
    ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
    ctx.fillRect(x - blockSize/2 + blockHeight, y - blockSize/2 + blockHeight, blockSize, blockSize);
    
    ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
    ctx.fillRect(x - blockSize/2 + blockHeight - 3, y - blockSize/2 + blockHeight - 3, blockSize, blockSize);
    
    ctx.fillStyle = "rgba(0, 0, 0, 0.2)";
    ctx.fillRect(x - blockSize/2 + blockHeight - 6, y - blockSize/2 + blockHeight - 6, blockSize, blockSize);
    
    // Draw right side of block with enhanced 3D
    ctx.fillStyle = "#A0522D";
    ctx.beginPath();
    ctx.moveTo(x + blockSize/2 - 4, y - blockSize/2);
    ctx.lineTo(x + blockSize/2 - 4 + blockHeight, y - blockSize/2 + blockHeight);
    ctx.lineTo(x + blockSize/2 - 4 + blockHeight, y + blockSize/2 - 4 + blockHeight);
    ctx.lineTo(x + blockSize/2 - 4, y + blockSize/2 - 4);
    ctx.closePath();
    ctx.fill();
    
    // Draw bottom side of block with enhanced 3D
    ctx.fillStyle = "#8B4513";
    ctx.beginPath();
    ctx.moveTo(x - blockSize/2, y + blockSize/2 - 4);
    ctx.lineTo(x + blockSize/2 - 4, y + blockSize/2 - 4);
    ctx.lineTo(x + blockSize/2 - 4 + blockHeight, y + blockSize/2 - 4 + blockHeight);
    ctx.lineTo(x - blockSize/2 + blockHeight, y + blockSize/2 - 4 + blockHeight);
    ctx.closePath();
    ctx.fill();
    
    // Add intense highlight on top edge for dramatic 3D effect
    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x - blockSize/2, y - blockSize/2);
    ctx.lineTo(x + blockSize/2 - 4, y - blockSize/2);
    ctx.stroke();
    
    // Add intense highlight on left edge for dramatic 3D effect
    ctx.beginPath();
    ctx.moveTo(x - blockSize/2, y - blockSize/2);
    ctx.lineTo(x - blockSize/2, y + blockSize/2 - 4);
    ctx.stroke();
    
    // Add secondary highlight for extra depth
    ctx.strokeStyle = "#F5DEB3";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x - blockSize/2 + 1, y - blockSize/2 + 1);
    ctx.lineTo(x + blockSize/2 - 5, y - blockSize/2 + 1);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(x - blockSize/2 + 1, y - blockSize/2 + 1);
    ctx.lineTo(x - blockSize/2 + 1, y + blockSize/2 - 5);
    ctx.stroke();
    
    // Draw main face of block
    const tileGradient = ctx.createLinearGradient(x - blockSize/2, y - blockSize/2, x + blockSize/2, y + blockSize/2);
    tileGradient.addColorStop(0, "#F5DEB3"); // Wheat
    tileGradient.addColorStop(0.3, "#DEB887"); // Burlywood
    tileGradient.addColorStop(0.7, "#D2B48C"); // Tan
    tileGradient.addColorStop(1, "#BC8F8F"); // Rosy brown
    
    ctx.fillStyle = tileGradient;
    ctx.fillRect(x - blockSize/2, y - blockSize/2, blockSize, blockSize);
    
    // Add wood grain to tile
    ctx.strokeStyle = "#CD853F";
    ctx.lineWidth = 0.5;
    for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.moveTo(x - blockSize/2 + 5 + i * 8, y - blockSize/2 + 5);
        ctx.lineTo(x - blockSize/2 + 8 + i * 8, y + blockSize/2 - 9);
        ctx.stroke();
    }
    
    // Draw letter with clean 3D effect
    ctx.save();
    ctx.font = `bold ${cellSize / 2.5}px Arial`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#654321"; // Darker brown
    ctx.shadowColor = "transparent";
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    ctx.fillText(tile.letter, x, y);
    ctx.restore();
    
    // Add subtle highlight to letter
    ctx.save();
    ctx.font = `bold ${cellSize / 2.5}px Arial`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#8B4513";
    ctx.shadowColor = "transparent";
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    ctx.fillText(tile.letter, x - 1, y - 1);
    ctx.restore();
    
    ctx.restore(); // Restore the motion blur effect
}

function startNewLettersAnimation(completedTiles) {
    // Set animation flag
    tetrisAnimating = true;
    tetrisAnimation = { isNewLetters: true };
    
    console.log(`=== STARTING NEW LETTERS ANIMATION ===`);
    console.log(`Completed tiles:`, completedTiles);
    console.log(`Completed word was: ${tetrisCurrentWord}`);
    console.log(`Current board state:`, tetrisBoard);
    
    // Find the positions where the completed word was (these are now empty)
    const emptySpacesToFill = [];
    for (const tile of completedTiles) {
        emptySpacesToFill.push({ r: tile.r, c: tile.c });
    }
    
    console.log(`Empty spaces to fill:`, emptySpacesToFill);
    
    if (emptySpacesToFill.length === 0) {
        console.log('No empty spaces to fill, generating new word');
        tetrisAnimating = false;
        tetrisAnimation = null;
        generateNewTetrisWord();
        saveTetrisGameState();
        return;
    }
    
    // Create falling letters for each empty space
    const fallingLetters = emptySpacesToFill.map(cell => {
        // Generate random letters for the new positions
        const allLetters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        const randomLetter = allLetters[Math.floor(Math.random() * allLetters.length)];
        
        console.log(`Generated new letter '${randomLetter}' for position [${cell.r}][${cell.c}]`);
        
        return {
            to: { r: cell.r, c: cell.c },
            letter: randomLetter,
            startTime: Date.now(),
            // Start from the very top of the screen for proper Tetris effect
            from: { r: -8 - Math.random() * 2, c: cell.c }
        };
    });
    
    const newLettersDuration = 1200; // 1.2 seconds for faster, more Tetris-like falling
    
    function animateNewLetters() {
        const currentTime = Date.now();
        const tetrisCanvas = document.getElementById('tetrisCanvas');
        const ctx = tetrisCanvas.getContext('2d');
        const cellSize = tetrisCanvas.width / 7;
        
        // Clear canvas and draw the board background and existing tiles (but not the new letters)
        ctx.clearRect(0, 0, tetrisCanvas.width, tetrisCanvas.height);
        drawTetrisBoardBackground();
        
        // Draw existing tiles (but not the positions where new letters will land)
        for (let r = 0; r < 7; r++) {
            for (let c = 0; c < 7; c++) {
                const letter = tetrisBoard[r][c];
                if (letter !== '') {
                    // Check if this position is where a new letter will land
                    const isNewLetterPosition = fallingLetters.some(tile => tile.to.r === r && tile.to.c === c);
                    if (!isNewLetterPosition) {
                        // Draw existing tile normally
                        const x = c * cellSize;
                        const y = r * cellSize;
                        
                        // Draw enhanced 3D block tile
                        const blockHeight = 18;
                        
                        // Draw enhanced bottom shadow with multiple layers
                        ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
                        ctx.fillRect(x + blockHeight, y + blockHeight, cellSize - 4, cellSize - 4);
                        
                        ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
                        ctx.fillRect(x + blockHeight - 3, y + blockHeight - 3, cellSize - 4, cellSize - 4);
                        
                        ctx.fillStyle = "rgba(0, 0, 0, 0.2)";
                        ctx.fillRect(x + blockHeight - 6, y + blockHeight - 6, cellSize - 4, cellSize - 4);
                        
                        // Draw right side of block with enhanced 3D
                        ctx.fillStyle = "#A0522D";
                        ctx.beginPath();
                        ctx.moveTo(x + cellSize - 4, y);
                        ctx.lineTo(x + cellSize - 4 + blockHeight, y + blockHeight);
                        ctx.lineTo(x + cellSize - 4 + blockHeight, y + cellSize - 4 + blockHeight);
                        ctx.lineTo(x + cellSize - 4, y + cellSize - 4);
                        ctx.closePath();
                        ctx.fill();
                        
                        // Draw bottom side of block with enhanced 3D
                        ctx.fillStyle = "#8B4513";
                        ctx.beginPath();
                        ctx.moveTo(x, y + cellSize - 4);
                        ctx.lineTo(x + cellSize - 4, y + cellSize - 4);
                        ctx.lineTo(x + cellSize - 4 + blockHeight, y + cellSize - 4 + blockHeight);
                        ctx.lineTo(x + blockHeight, y + cellSize - 4 + blockHeight);
                        ctx.closePath();
                        ctx.fill();
                        
                        // Add intense highlight on top edge for dramatic 3D effect
                        ctx.strokeStyle = "#FFFFFF";
                        ctx.lineWidth = 3;
                        ctx.beginPath();
                        ctx.moveTo(x, y);
                        ctx.lineTo(x + cellSize - 4, y);
                        ctx.stroke();
                        
                        // Add intense highlight on left edge for dramatic 3D effect
                        ctx.beginPath();
                        ctx.moveTo(x, y);
                        ctx.lineTo(x, y + cellSize - 4);
                        ctx.stroke();
                        
                        // Add secondary highlight for extra depth
                        ctx.strokeStyle = "#F5DEB3";
                        ctx.lineWidth = 1;
                        ctx.beginPath();
                        ctx.moveTo(x + 1, y + 1);
                        ctx.lineTo(x + cellSize - 5, y + 1);
                        ctx.stroke();
                        
                        ctx.beginPath();
                        ctx.moveTo(x + 1, y + 1);
                        ctx.lineTo(x + 1, y + cellSize - 5);
                        ctx.stroke();
                        
                        // Draw main face of block
                        const tileGradient = ctx.createLinearGradient(x, y, x + cellSize, y + cellSize);
                        tileGradient.addColorStop(0, "#F5DEB3"); // Wheat
                        tileGradient.addColorStop(0.3, "#DEB887"); // Burlywood
                        tileGradient.addColorStop(0.7, "#D2B48C"); // Tan
                        tileGradient.addColorStop(1, "#BC8F8F"); // Rosy brown
                        
                        ctx.fillStyle = tileGradient;
                        ctx.fillRect(x, y, cellSize - 4, cellSize - 4);
                        
                        // Add wood grain to tile
                        ctx.strokeStyle = "#CD853F";
                        ctx.lineWidth = 0.5;
                        for (let i = 0; i < 3; i++) {
                            ctx.beginPath();
                            ctx.moveTo(x + 5 + i * 8, y + 5);
                            ctx.lineTo(x + 8 + i * 8, y + cellSize - 9);
                            ctx.stroke();
                        }
                        
                        // Draw letter with clean 3D effect
                        ctx.save();
                        ctx.font = `bold ${cellSize / 2.5}px Arial`;
                        ctx.textAlign = "center";
                        ctx.textBaseline = "middle";
                        ctx.fillStyle = "#654321"; // Darker brown
                        ctx.shadowColor = "transparent";
                        ctx.shadowBlur = 0;
                        ctx.shadowOffsetX = 0;
                        ctx.shadowOffsetY = 0;
                        ctx.fillText(
                            letter,
                            x + (cellSize - 4) / 2,
                            y + (cellSize - 4) / 2
                        );
                        ctx.restore();
                        
                        // Add subtle highlight to letter (darker)
                        ctx.save();
                        ctx.font = `bold ${cellSize / 2.5}px Arial`;
                        ctx.textAlign = "center";
                        ctx.textBaseline = "middle";
                        ctx.fillStyle = "#8B4513";
                        ctx.shadowColor = "transparent";
                        ctx.shadowBlur = 0;
                        ctx.shadowOffsetX = 0;
                        ctx.shadowOffsetY = 0;
                        ctx.fillText(
                            letter,
                            x + (cellSize - 4) / 2 - 1,
                            y + (cellSize - 4) / 2 - 1
                        );
                        ctx.restore();
                    }
                }
            }
        }
        
        // Animate falling letters
        let allLanded = true;
        console.log(`Animating ${fallingLetters.length} falling letters...`);
        for (const tile of fallingLetters) {
            const elapsed = currentTime - tile.startTime;
            const progress = Math.min(elapsed / newLettersDuration, 1);
            
            if (progress < 1) {
                allLanded = false;
                
                // Calculate current position with Tetris-style constant velocity falling
                const startX = tile.from.c * cellSize + (cellSize - 4) / 2;
                const startY = tile.from.r * cellSize + (cellSize - 4) / 2;
                const endX = tile.to.c * cellSize + (cellSize - 4) / 2;
                const endY = tile.to.r * cellSize + (cellSize - 4) / 2;
                const x = startX + (endX - startX) * progress;
                const y = startY + (endY - startY) * progress;
                
                // Draw falling letter with enhanced effects
                drawFallingLetter(ctx, tile, x, y, cellSize, progress);
            }
        }
        
        if (!allLanded) {
            requestAnimationFrame(animateNewLetters);
        } else {
            // Animation complete - add letters to board
            
            // ANIMATION COMPLETE - NOW place the new letters on the board
            console.log(`Animation complete - placing ${fallingLetters.length} NEW random letters on board`);
            for (const tile of fallingLetters) {
                tetrisBoard[tile.to.r][tile.to.c] = tile.letter;
                console.log(`Placed NEW letter '${tile.letter}' at position [${tile.to.r}][${tile.to.c}]`);
            }
            
            console.log(`Board state after placing new letters:`, tetrisBoard);
            
            // Force a redraw to make sure the new letters are visible
            drawTetrisBoard();
            
            // Clear animation flags
            tetrisAnimating = false;
            tetrisAnimation = null;
            
            // Clear completed tiles array so tiles can be moved again
            tetrisCompletedTiles = [];
            console.log(`Cleared tetrisCompletedTiles array - tiles can now be moved again`);
            
            // Force game to be in a playable state
            tetrisGameRunning = true;
            console.log(`Set tetrisGameRunning to true - game should be playable now`);
            
            // Generate new word FIRST
            generateNewTetrisWord();
            
            // Find the empty position - it should be where the last letter was originally
            // For "CAT", when "T" slides from [0,3] to [0,2], empty should be at [0,3]
            // We need to find where the empty space actually is on the board
            let foundEmpty = false;
            for (let r = 0; r < 7; r++) {
                for (let c = 0; c < 7; c++) {
                    if (tetrisBoard[r][c] === '') {
                        tetrisEmptyPos = { r: r, c: c };
                        foundEmpty = true;
                        console.log(`Found empty position at [${r}][${c}]`);
                        break;
                    }
                }
                if (foundEmpty) break;
            }
            
            if (!foundEmpty) {
                // If no empty space found, create one at the bottom-right
                tetrisEmptyPos = { r: 6, c: 6 };
                tetrisBoard[6][6] = '';
                console.log(`No empty space found, created one at [6][6]`);
            }
            
            // Final verification of game state
            console.log(`=== FINAL GAME STATE VERIFICATION ===`);
            console.log(`tetrisAnimating: ${tetrisAnimating}`);
            console.log(`tetrisAnimation:`, tetrisAnimation);
            console.log(`tetrisEmptyPos: [${tetrisEmptyPos.r}][${tetrisEmptyPos.c}]`);
            console.log(`Board at empty pos: '${tetrisBoard[tetrisEmptyPos.r][tetrisEmptyPos.c]}'`);
            console.log(`tetrisCompletedTiles length: ${tetrisCompletedTiles.length}`);
            console.log(`tetrisGameRunning: ${tetrisGameRunning}`);
            console.log(`Current word: ${tetrisCurrentWord}`);
            console.log(`=== NEW LETTERS ANIMATION COMPLETE ===`);
            console.log(`Game should now be fully playable with new letters and new word`);
            
            // Test if we can actually access the empty position
            console.log(`Testing empty position access:`);
            console.log(`tetrisBoard[${tetrisEmptyPos.r}][${tetrisEmptyPos.c}] = '${tetrisBoard[tetrisEmptyPos.r][tetrisEmptyPos.c]}'`);
            console.log(`typeof tetrisBoard[${tetrisEmptyPos.r}][${tetrisEmptyPos.c}]: ${typeof tetrisBoard[tetrisEmptyPos.r][tetrisEmptyPos.c]}`);
            
            // Visual board representation for debugging
            console.log(`=== VISUAL BOARD REPRESENTATION ===`);
            for (let r = 0; r < 7; r++) {
                let rowStr = `Row ${r}: `;
                for (let c = 0; c < 7; c++) {
                    const cell = tetrisBoard[r][c];
                    const isEmpty = cell === '';
                    const isEmptyPos = r === tetrisEmptyPos.r && c === tetrisEmptyPos.c;
                    if (isEmpty && isEmptyPos) {
                        rowStr += '[EMPTY] '; // This should be the functional empty cell
                    } else if (isEmpty) {
                        rowStr += '[BLANK] '; // Other empty cells
                    } else {
                        rowStr += `[${cell}] `;
                    }
                }
                console.log(rowStr);
            }
            console.log(`=== END VISUAL BOARD ===`);
            console.log(`=== END VERIFICATION ===`);
            
            // Final redraw to ensure everything is properly displayed
            drawTetrisBoard();
            
            // Final board state verification before saving
            console.log(`=== PRE-SAVE BOARD STATE ===`);
            console.log(`tetrisEmptyPos: [${tetrisEmptyPos.r}][${tetrisEmptyPos.c}]`);
            console.log(`Board at empty pos: '${tetrisBoard[tetrisEmptyPos.r][tetrisEmptyPos.c]}'`);
            
            // Count empty spaces to verify we have exactly one
            let finalEmptyCount = 0;
            for (let r = 0; r < 7; r++) {
                for (let c = 0; c < 7; c++) {
                    if (tetrisBoard[r][c] === '') {
                        finalEmptyCount++;
                        console.log(`Empty space found at [${r}][${c}]`);
                    }
                }
            }
            console.log(`Total empty spaces: ${finalEmptyCount}`);
            console.log(`=== END PRE-SAVE VERIFICATION ===`);
            
            // Save game state
            saveTetrisGameState();
        }
    }
    
    // Store the animation function so the main game loop can call it
    tetrisAnimation.animateFunction = animateNewLetters;
    
    animateNewLetters();
}

function drawFallingLetter(ctx, tile, x, y, cellSize, progress) {
    const blockSize = cellSize - 4;
    
    // Simple, clean Tetris-style falling letter - no fancy effects
    const tileX = x - blockSize/2;
    const tileY = y - blockSize/2;
    
    // Draw simple tile background
    ctx.fillStyle = "#DEB887"; // Simple burlywood color
    ctx.fillRect(tileX, tileY, blockSize, blockSize);
    
    // Draw simple border
    ctx.strokeStyle = "#8B4513";
    ctx.lineWidth = 2;
    ctx.strokeRect(tileX, tileY, blockSize, blockSize);
    
    // Draw letter
    ctx.font = `bold ${cellSize / 2.5}px Arial`;
    ctx.fillStyle = "#654321";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(tile.letter, x, y);
}