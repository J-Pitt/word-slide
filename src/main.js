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
    console.log('=== RE-SCRAMBLING INCOMPLETE TILES ===');
    
    // Create a set of completed tile positions for fast lookup
    const completedPositions = new Set();
    for (const tile of completedTiles) {
        completedPositions.add(`${tile.r},${tile.c}`);
    }
    
    console.log('Completed positions:', Array.from(completedPositions));
    
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
    
    console.log('Incomplete tiles to scramble:', incompleteTiles);
    console.log('Incomplete positions:', incompletePositions);
    
    // Shuffle the incomplete tiles
    shuffleArray(incompleteTiles);
    
    // Choose a random position for the empty space (must be from incomplete positions)
    const randomIndex = Math.floor(Math.random() * incompletePositions.length);
    const newEmptyPos = incompletePositions[randomIndex];
    
    // Remove the chosen position from incomplete positions and tiles
    incompletePositions.splice(randomIndex, 1);
    incompleteTiles.splice(randomIndex, 1);
    
    // Place the shuffled incomplete tiles back in their positions
    for (let i = 0; i < incompleteTiles.length; i++) {
        const pos = incompletePositions[i];
        board[pos.r][pos.c] = incompleteTiles[i];
    }
    
    // Set the new empty space
    emptyPos = { r: newEmptyPos.r, c: newEmptyPos.c };
    board[emptyPos.r][emptyPos.c] = "";
    console.log(`Re-scrambling - new empty space position: (${emptyPos.r}, ${emptyPos.c})`);
    
    console.log('Re-scrambling complete. New board state:', board);
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
    console.log('=== STARTING TETRIS GAME ===');
    
    document.getElementById('mainMenu').style.display = 'none';
    document.getElementById('originalGameContainer').style.display = 'none';
    document.getElementById('tetrisGameContainer').style.display = 'block';
    
    // Force immediate canvas setup
    const tetrisCanvas = document.getElementById('tetrisCanvas');
    if (tetrisCanvas) {
        console.log('Canvas found, setting dimensions...');
        tetrisCanvas.width = 450;
        tetrisCanvas.height = 450;
        console.log('Canvas dimensions set to:', tetrisCanvas.width, 'x', tetrisCanvas.height);
        
        // Force immediate draw of empty board
        const ctx = tetrisCanvas.getContext('2d');
        ctx.clearRect(0, 0, tetrisCanvas.width, tetrisCanvas.height);
        drawTetrisBoardBackground();
        console.log('Initial board background drawn');
    } else {
        console.error('Tetris canvas not found!');
    }
    
    // Start the tetris game
    if (!window.tetrisGameStarted) {
        startTetrisGameLogic();
        window.tetrisGameStarted = true;
    }
}

function newTetrisGame() {
    // Reset tetris game state
    window.tetrisGameStarted = false;
    tetrisUsedWords.clear(); // Reset used words for new game
    clearSavedTetrisGame(); // Clear saved state for new game
    startTetrisGame();
}

function debugTetrisBoard() {
    console.log('=== DEBUGGING TETRIS BOARD ===');
    
    // Check if canvas exists
    const tetrisCanvas = document.getElementById('tetrisCanvas');
    if (!tetrisCanvas) {
        console.error('Canvas not found!');
        return;
    }
    console.log('Canvas found:', tetrisCanvas.width, 'x', tetrisCanvas.height);
    
    // Check current board state
    console.log('Current tetrisBoard:', tetrisBoard);
    console.log('Current tetrisEmptyPos:', tetrisEmptyPos);
    
    // Count empty spaces
    let emptyCount = 0;
    for (let r = 0; r < 7; r++) {
        for (let c = 0; c < 7; c++) {
            if (tetrisBoard[r][c] === '') {
                emptyCount++;
                console.log(`Empty space at (${r}, ${c})`);
            }
        }
    }
    console.log(`Total empty spaces: ${emptyCount}`);
    
    // Force regenerate board
    console.log('Forcing board regeneration...');
    generateTetrisBoard();
    
    // Force draw
    console.log('Forcing board draw...');
    drawTetrisBoard();
    
    console.log('=== DEBUG COMPLETE ===');
}

function forceDrawTetrisBoard() {
    console.log('=== FORCING TETRIS BOARD DRAW ===');
    
    // Check if canvas exists
    const tetrisCanvas = document.getElementById('tetrisCanvas');
    if (!tetrisCanvas) {
        console.error('Canvas not found!');
        return;
    }
    
    // Ensure canvas has proper dimensions
    tetrisCanvas.width = 450;
    tetrisCanvas.height = 450;
    console.log('Canvas dimensions:', tetrisCanvas.width, 'x', tetrisCanvas.height);
    
    // Force draw background
    const ctx = tetrisCanvas.getContext('2d');
    ctx.clearRect(0, 0, tetrisCanvas.width, tetrisCanvas.height);
    drawTetrisBoardBackground();
    console.log('Background drawn');
    
    // Force draw board
    drawTetrisBoard();
    console.log('Board drawn');
    
    console.log('=== FORCE DRAW COMPLETE ===');
}

// Tetris Game Variables
let tetrisBoard = [];
let tetrisEmptyPos = { r: 0, c: 0 };
let tetrisMoveCount = 0;
let tetrisWordsSolved = 0;
let tetrisCurrentWord = '';
let tetrisGameRunning = false;
let tetrisAnimating = false;
let tetrisAnimation = null;
let tetrisCompletedTiles = [];

// Tetris Game Functions
function startTetrisGameLogic() {
    console.log('Starting Tetris game logic...');
    
    // Ensure canvas is properly initialized
    const tetrisCanvas = document.getElementById('tetrisCanvas');
    if (!tetrisCanvas) {
        console.error('Tetris canvas not found!');
        return;
    }
    
    // Ensure canvas has proper dimensions
    if (tetrisCanvas.width === 0 || tetrisCanvas.height === 0) {
        tetrisCanvas.width = 450;
        tetrisCanvas.height = 450;
        console.log('Canvas initialized with dimensions:', tetrisCanvas.width, 'x', tetrisCanvas.height);
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
        setTimeout(() => {
            console.log('Forcing immediate draw of Tetris board...');
            drawTetrisBoard();
        }, 100);
    } else {
        // Update displays with loaded state
        document.getElementById('tetrisMoveCounter').textContent = tetrisMoveCount;
        document.getElementById('wordsSolvedCounter').textContent = tetrisWordsSolved;
        document.getElementById('tetrisTargetWords').textContent = tetrisCurrentWord;
        
        // Force immediate draw for loaded state
        setTimeout(() => {
            console.log('Forcing immediate draw of loaded Tetris board...');
            drawTetrisBoard();
        }, 100);
    }
    
    // Start tetris game loop
    updateTetrisGame();
    
    // Add event listeners for tetris canvas
    tetrisCanvas.addEventListener('click', handleTetrisInput);
    tetrisCanvas.addEventListener('touchstart', handleTetrisInput);
}

function generateTetrisBoard() {
    console.log('Generating Tetris board...');
    
    const rows = 7;
    const cols = 7;
    
    // Initialize empty board
    tetrisBoard = [];
    for (let r = 0; r < rows; r++) {
        tetrisBoard[r] = [];
        for (let c = 0; c < cols; c++) {
            tetrisBoard[r][c] = '';
        }
    }
    
    // Fill board with random letters
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            tetrisBoard[r][c] = letters[Math.floor(Math.random() * letters.length)];
        }
    }
    
    // FORCE empty space at a specific location for testing
    const emptyRow = 3; // Middle row
    const emptyCol = 3; // Middle column
    tetrisBoard[emptyRow][emptyCol] = '';
    tetrisEmptyPos = { r: emptyRow, c: emptyCol };
    
    console.log(`FORCED Tetris board with empty space at (${emptyRow}, ${emptyCol})`);
    
    // Add a test pattern to make sure board is visible
    tetrisBoard[0][0] = 'T';
    tetrisBoard[0][1] = 'E';
    tetrisBoard[0][2] = 'S';
    tetrisBoard[0][3] = 'T';
    console.log('Added TEST pattern to top row');
    
    console.log(`Tetris board generated with empty space at (${emptyRow}, ${emptyCol})`);
    console.log('Tetris board state after generation:', tetrisBoard);
    console.log('Tetris empty position:', tetrisEmptyPos);
    
    // Generate initial word
    generateNewTetrisWord();
    
    // Draw the board
    console.log('About to draw Tetris board...');
    
    // Ensure canvas is properly sized
    const tetrisCanvas = document.getElementById('tetrisCanvas');
    if (tetrisCanvas) {
        console.log('Canvas dimensions before drawing:', tetrisCanvas.width, 'x', tetrisCanvas.height);
        // Set canvas size if needed
        if (tetrisCanvas.width === 0 || tetrisCanvas.height === 0) {
            tetrisCanvas.width = 450;
            tetrisCanvas.height = 450;
            console.log('Canvas resized to:', tetrisCanvas.width, 'x', tetrisCanvas.height);
        }
    }
    
    // Verify board has exactly one empty space
    let emptyCount = 0;
    for (let r = 0; r < 7; r++) {
        for (let c = 0; c < 7; c++) {
            if (tetrisBoard[r][c] === '') {
                emptyCount++;
                console.log(`Found empty space at (${r}, ${c})`);
            }
        }
    }
    console.log(`Total empty spaces found: ${emptyCount}`);
    
    if (emptyCount === 0) {
        console.error('ERROR: No empty space found in board!');
        // Force create an empty space
        tetrisBoard[0][0] = '';
        tetrisEmptyPos = { r: 0, c: 0 };
        console.log('Forced empty space at (0, 0)');
    } else if (emptyCount > 1) {
        console.error(`ERROR: Too many empty spaces found: ${emptyCount}`);
    }
    
    // Force immediate draw multiple times to ensure it appears
    console.log('About to draw Tetris board...');
    drawTetrisBoard();
    console.log('Tetris board drawn once');
    
    // Force another draw after a short delay
    setTimeout(() => {
        console.log('Forcing second draw...');
        drawTetrisBoard();
        console.log('Tetris board drawn twice');
    }, 100);
    
    // Force a third draw after another delay
    setTimeout(() => {
        console.log('Forcing third draw...');
        drawTetrisBoard();
        console.log('Tetris board drawn three times');
    }, 500);
}

function generateNewTetrisWord() {
    // Analyze current board and generate a word that can be completed
    const availableLetters = getAvailableLetters();
    tetrisCurrentWord = selectWordFromLetters(availableLetters);
    
    // Update display
    document.getElementById('tetrisTargetWords').textContent = tetrisCurrentWord;
    
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
    // Enhanced word selection using the same word bank as original game
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
        
        return selectedWord;
    }
    
    // If all possible words have been used, clear the set and use any possible word
    if (possibleWords.length > 0) {
        tetrisUsedWords.clear();
        const selectedWord = possibleWords[Math.floor(Math.random() * possibleWords.length)];
        tetrisUsedWords.add(selectedWord);
        return selectedWord;
    }
    
    // If no words can be made with available letters, return a simple word
    // and we'll add needed letters to the board
    return 'CAT';
}

function handleTetrisInput(event) {
    if (!tetrisGameRunning) return;
    
    event.preventDefault();
    
    const tetrisCanvas = document.getElementById('tetrisCanvas');
    const rect = tetrisCanvas.getBoundingClientRect();
    const x = (event.clientX || event.touches[0].clientX) - rect.left;
    const y = (event.clientY || event.touches[0].clientY) - rect.top;
    
    const cell = getTetrisCellFromCoords(x, y);
    if (cell) {
        tryTetrisMove(cell.r, cell.c);
    }
}

function getTetrisCellFromCoords(x, y) {
    // Scale coordinates to match actual canvas size (exactly same as original game)
    const tetrisCanvas = document.getElementById('tetrisCanvas');
    const scaleX = tetrisCanvas.width / tetrisCanvas.offsetWidth;
    const scaleY = tetrisCanvas.height / tetrisCanvas.offsetHeight;
    const scaledX = x * scaleX;
    const scaledY = y * scaleY;
    
    const cellSize = tetrisCanvas.width / 7;
    const c = Math.floor(scaledX / cellSize);
    const r = Math.floor(scaledY / cellSize);
    
    console.log(`getTetrisCellFromCoords: x=${x}, y=${y}, scaledX=${scaledX}, scaledY=${scaledY}, cellSize=${cellSize}, result=(${r}, ${c})`); // Debug
    
    if (r >= 0 && r < 7 && c >= 0 && c < 7) {
        return { r, c };
    }
    return null;
}

function tryTetrisMove(r, c) {
    console.log(`tryTetrisMove called with (${r}, ${c})`); // Debug
    const dr = Math.abs(r - tetrisEmptyPos.r);
    const dc = Math.abs(c - tetrisEmptyPos.c);
    console.log(`Distance: dr=${dr}, dc=${dc}`); // Debug
    console.log(`Can move: ${(dr === 1 && dc === 0) || (dr === 0 && dc === 1)}`); // Debug
    console.log(`Currently animating: ${tetrisAnimating}`); // Debug
    
    if ((dr === 1 && dc === 0) || (dr === 0 && dc === 1)) {
        // Remove animation check - always process valid moves (same as original game)
        // Valid move - start sliding animation (exactly same as original game)
        const letter = tetrisBoard[r][c];
        
        console.log(`Starting tetris animation from (${r}, ${c}) to (${tetrisEmptyPos.r}, ${tetrisEmptyPos.c})`);
        tetrisAnimating = true;
        tetrisAnimation = {
            from: { r, c },
            to: { r: tetrisEmptyPos.r, c: tetrisEmptyPos.c },
            letter: letter,
            progress: 0,
            duration: 8 // frames (exactly same as original game)
        };
        
        tetrisMoveCount++;
        document.getElementById('tetrisMoveCounter').textContent = tetrisMoveCount;
        saveTetrisGameState(); // Save after each move
    } else {
        console.log(`Invalid tetris move - not adjacent to empty space`); // Debug
    }
}

function checkTetrisWordCompletion() {
    // Don't check for word completion if we're already in a word completion animation
    if (tetrisAnimating && tetrisAnimation && tetrisAnimation.isWordCompletion) {
        return;
    }
    
    // Check if the current word is completed horizontally or vertically
    const word = tetrisCurrentWord;
    console.log(`Checking for word completion: "${word}"`);
    console.log('Current board state:', tetrisBoard);
    
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
    
    console.log('No word completion found');
}

function completeTetrisWord(startRow, startCol, direction) {
    console.log(`Tetris word completed: ${tetrisCurrentWord} at (${startRow}, ${startCol}) ${direction}`);
    
    // Set word completion animation flag to prevent further checks
    tetrisAnimating = true;
    tetrisAnimation = { isWordCompletion: true };
    
    tetrisWordsSolved++;
    document.getElementById('wordsSolvedCounter').textContent = tetrisWordsSolved;
    saveTetrisGameState(); // Save after word completion
    
    // Mark completed tiles
    const completedTiles = [];
    for (let i = 0; i < tetrisCurrentWord.length; i++) {
        const r = direction === 'horizontal' ? startRow : startRow + i;
        const c = direction === 'horizontal' ? startCol + i : startCol;
        completedTiles.push({ r, c, letter: tetrisCurrentWord[i] });
    }
    
    // Animate word completion
    animateTetrisWordCompletion(completedTiles);
}

function animateTetrisWordCompletion(completedTiles) {
    console.log('Starting enhanced Tetris word completion animation');
    
    // Step 1: Green highlight for 2 seconds
    let highlightStartTime = Date.now();
    const highlightDuration = 2000; // 2 seconds
    
    function animateHighlight() {
        const elapsed = Date.now() - highlightStartTime;
        const progress = Math.min(elapsed / highlightDuration, 1);
        
        // Draw board with green highlight
        drawTetrisBoardWithHighlight(completedTiles);
        
        if (progress < 1) {
            requestAnimationFrame(animateHighlight);
        } else {
            // Step 2: Start disappearing animation
            startDisappearingAnimation(completedTiles);
        }
    }
    
    animateHighlight();
}

function startDisappearingAnimation(completedTiles) {
    console.log('Starting disappearing animation');
    
    const disappearingTiles = completedTiles.map(tile => ({
        ...tile,
        scale: 1,
        rotation: 0,
        alpha: 1,
        startTime: Date.now()
    }));
    
    const disappearDuration = 1500; // 1.5 seconds for disappearing animation
    
    function animateDisappearing() {
        const currentTime = Date.now();
        const tetrisCanvas = document.getElementById('tetrisCanvas');
        const ctx = tetrisCanvas.getContext('2d');
        const cellSize = tetrisCanvas.width / 7;
        
        // Clear canvas and draw background
        ctx.clearRect(0, 0, tetrisCanvas.width, tetrisCanvas.height);
        drawTetrisBoardBackground();
        
        // Draw all non-completed tiles
        for (let r = 0; r < 7; r++) {
            for (let c = 0; c < 7; c++) {
                const isCompleted = completedTiles.some(tile => tile.r === r && tile.c === c);
                if (!isCompleted && tetrisBoard[r][c] !== '') {
                    // Draw the tile with the correct letter
                    const letter = tetrisBoard[r][c];
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
            }
        }
        
        // Animate disappearing tiles
        let allDisappeared = true;
        for (const tile of disappearingTiles) {
            const elapsed = currentTime - tile.startTime;
            const progress = Math.min(elapsed / disappearDuration, 1);
            
            if (progress < 1) {
                allDisappeared = false;
                
                // Animate scale, rotation, and alpha
                tile.scale = 1 - (progress * 0.5); // Scale down to 50%
                tile.rotation = progress * Math.PI * 2; // Full rotation
                tile.alpha = 1 - progress; // Fade out
                
                // Draw disappearing tile with effects
                drawDisappearingTile(ctx, tile, cellSize);
            }
        }
        
        if (!allDisappeared) {
            requestAnimationFrame(animateDisappearing);
        } else {
            // Step 3: Start gravity animation
            startGravityAnimation(completedTiles);
        }
    }
    
    animateDisappearing();
}

function startGravityAnimation(completedTiles) {
    console.log('Starting gravity animation');
    
    // Remove completed tiles from board
    for (const tile of completedTiles) {
        tetrisBoard[tile.r][tile.c] = '';
    }
    
    // Find the lowest row that had completed tiles
    const lowestCompletedRow = Math.max(...completedTiles.map(tile => tile.r));
    
    // Create falling animations for tiles above the completed area
    const fallingTiles = [];
    const tetrisCanvas = document.getElementById('tetrisCanvas');
    for (let c = 0; c < 7; c++) {
        for (let r = lowestCompletedRow - 1; r >= 0; r--) {
            if (tetrisBoard[r][c] !== '') {
                fallingTiles.push({
                    r: r,
                    c: c,
                    letter: tetrisBoard[r][c],
                    startY: r * (tetrisCanvas.width / 7),
                    targetY: (r + 1) * (tetrisCanvas.width / 7),
                    startTime: Date.now(),
                    delay: (lowestCompletedRow - r) * 100 // Stagger the falling
                });
            }
        }
    }
    
    const gravityDuration = 800; // 0.8 seconds for gravity
    
    function animateGravity() {
        const currentTime = Date.now();
        const tetrisCanvas = document.getElementById('tetrisCanvas');
        const ctx = tetrisCanvas.getContext('2d');
        const cellSize = tetrisCanvas.width / 7;
        
        // Clear canvas and draw background
        ctx.clearRect(0, 0, tetrisCanvas.width, tetrisCanvas.height);
        drawTetrisBoardBackground();
        
        // Draw static tiles (those not falling)
        for (let r = 0; r < 7; r++) {
            for (let c = 0; c < 7; c++) {
                const isFalling = fallingTiles.some(tile => tile.r === r && tile.c === c);
                const isCompleted = completedTiles.some(tile => tile.r === r && tile.c === c);
                if (!isFalling && !isCompleted && tetrisBoard[r][c] !== '') {
                    drawTetrisTile(ctx, r, c, tetrisBoard[r][c], cellSize);
                }
            }
        }
        
        // Animate falling tiles
        let allFallen = true;
        for (const tile of fallingTiles) {
            const elapsed = currentTime - tile.startTime - tile.delay;
            if (elapsed < 0) {
                allFallen = false;
                continue;
            }
            
            const progress = Math.min(elapsed / gravityDuration, 1);
            
            if (progress < 1) {
                allFallen = false;
                
                // Ease-out animation for smooth falling
                const easeProgress = 1 - Math.pow(1 - progress, 3);
                const currentY = tile.startY + (tile.targetY - tile.startY) * easeProgress;
                
                // Draw falling tile
                drawFallingTile(ctx, tile, currentY, cellSize);
            }
        }
        
        if (!allFallen) {
            requestAnimationFrame(animateGravity);
        } else {
            // Step 4: Apply gravity to board and add new letters
            applyTetrisGravity();
            startNewLettersAnimation();
        }
    }
    
    animateGravity();
}

function startNewLettersAnimation() {
    console.log('Starting new letters animation');
    
    // Add new letters to empty spaces
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const newLetters = [];
    const tetrisCanvas = document.getElementById('tetrisCanvas');
    
    for (let r = 0; r < 7; r++) {
        for (let c = 0; c < 7; c++) {
            if (tetrisBoard[r][c] === '') {
                const letter = letters[Math.floor(Math.random() * letters.length)];
                tetrisBoard[r][c] = letter;
                newLetters.push({
                    r: r,
                    c: c,
                    letter: letter,
                    startY: -tetrisCanvas.width / 7, // Start above the board
                    targetY: r * (tetrisCanvas.width / 7),
                    startTime: Date.now(),
                    delay: Math.random() * 300 // Random delay for natural effect
                });
            }
        }
    }
    
    const dropDuration = 600; // 0.6 seconds for dropping
    
    function animateNewLetters() {
        const currentTime = Date.now();
        const tetrisCanvas = document.getElementById('tetrisCanvas');
        const ctx = tetrisCanvas.getContext('2d');
        const cellSize = tetrisCanvas.width / 7;
        
        // Clear canvas and draw background
        ctx.clearRect(0, 0, tetrisCanvas.width, tetrisCanvas.height);
        drawTetrisBoardBackground();
        
        // Draw all existing tiles
        for (let r = 0; r < 7; r++) {
            for (let c = 0; c < 7; c++) {
                const isNewLetter = newLetters.some(tile => tile.r === r && tile.c === c);
                if (!isNewLetter && tetrisBoard[r][c] !== '') {
                    drawTetrisTile(ctx, r, c, tetrisBoard[r][c], cellSize);
                }
            }
        }
        
        // Animate dropping new letters
        let allDropped = true;
        for (const tile of newLetters) {
            const elapsed = currentTime - tile.startTime - tile.delay;
            if (elapsed < 0) {
                allDropped = false;
                continue;
            }
            
            const progress = Math.min(elapsed / dropDuration, 1);
            
            if (progress < 1) {
                allDropped = false;
                
                // Bounce effect for dropping
                const bounceProgress = progress < 0.8 ? progress / 0.8 : 1;
                const currentY = tile.startY + (tile.targetY - tile.startY) * bounceProgress;
                
                // Draw dropping tile
                drawDroppingTile(ctx, tile, currentY, cellSize);
            } else {
                // Draw final position
                drawTetrisTile(ctx, tile.r, tile.c, tile.letter, cellSize);
            }
        }
        
        if (!allDropped) {
            requestAnimationFrame(animateNewLetters);
        } else {
            // Animation complete - generate new word and save
            generateNewTetrisWord();
            drawTetrisBoard();
            saveTetrisGameState();
            
            // Clear word completion animation flag
            tetrisAnimating = false;
            tetrisAnimation = null;
            
            console.log('Tetris word completion animation finished');
        }
    }
    
    animateNewLetters();
}

// Helper function to draw Tetris board background
function drawTetrisBoardBackground() {
    const tetrisCanvas = document.getElementById('tetrisCanvas');
    const ctx = tetrisCanvas.getContext('2d');
    
    // Draw oak wood board background with realistic texture
    const boardGradient = ctx.createLinearGradient(0, 0, tetrisCanvas.width, tetrisCanvas.height);
    boardGradient.addColorStop(0, "#F5DEB3"); // Wheat
    boardGradient.addColorStop(0.2, "#DEB887"); // Burlywood
    boardGradient.addColorStop(0.4, "#D2B48C"); // Tan
    boardGradient.addColorStop(0.6, "#CD853F"); // Peru
    boardGradient.addColorStop(0.8, "#A0522D"); // Sienna
    boardGradient.addColorStop(1, "#8B4513"); // Saddle brown
    
    ctx.fillStyle = boardGradient;
    ctx.fillRect(0, 0, tetrisCanvas.width, tetrisCanvas.height);
    
    // Add oak wood grain patterns
    ctx.strokeStyle = "rgba(139, 69, 19, 0.4)";
    ctx.lineWidth = 1;
    
    // Vertical grain lines (characteristic of oak)
    for (let i = 0; i < tetrisCanvas.width; i += 3) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i + 1, tetrisCanvas.height);
        ctx.stroke();
    }
    
    // Horizontal growth rings
    ctx.strokeStyle = "rgba(160, 82, 45, 0.5)";
    ctx.lineWidth = 2;
    for (let i = 0; i < tetrisCanvas.height; i += 12) {
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(tetrisCanvas.width, i);
        ctx.stroke();
    }
    
    // Diagonal grain patterns
    ctx.strokeStyle = "rgba(101, 67, 33, 0.3)";
    ctx.lineWidth = 1;
    for (let i = 0; i < tetrisCanvas.width + tetrisCanvas.height; i += 20) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i + 8, tetrisCanvas.height);
        ctx.stroke();
    }
    
    // Add oak medullary rays (characteristic white lines in oak)
    ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
    ctx.lineWidth = 1;
    for (let i = 0; i < tetrisCanvas.height; i += 8) {
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(tetrisCanvas.width, i);
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
function drawDisappearingTile(ctx, tile, cellSize) {
    const x = tile.c * cellSize;
    const y = tile.r * cellSize;
    const centerX = x + cellSize / 2;
    const centerY = y + cellSize / 2;
    
    ctx.save();
    ctx.globalAlpha = tile.alpha;
    ctx.translate(centerX, centerY);
    ctx.rotate(tile.rotation);
    ctx.scale(tile.scale, tile.scale);
    ctx.translate(-centerX, -centerY);
    
    // Draw tile with glow effect
    const glowGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, cellSize);
    glowGradient.addColorStop(0, `rgba(255, 255, 0, ${tile.alpha * 0.8})`);
    glowGradient.addColorStop(0.5, `rgba(255, 255, 0, ${tile.alpha * 0.4})`);
    glowGradient.addColorStop(1, `rgba(255, 255, 0, 0)`);
    
    ctx.fillStyle = glowGradient;
    ctx.fillRect(x - cellSize/2, y - cellSize/2, cellSize * 2, cellSize * 2);
    
    // Draw the tile itself
    drawTetrisTile(ctx, tile.r, tile.c, tile.letter, cellSize);
    
    ctx.restore();
}

// Helper function to draw falling tile
function drawFallingTile(ctx, tile, currentY, cellSize) {
    const x = tile.c * cellSize;
    const y = currentY;
    
    // Draw tile at current falling position
    ctx.save();
    ctx.translate(0, y - (tile.r * cellSize));
    drawTetrisTile(ctx, tile.r, tile.c, tile.letter, cellSize);
    ctx.restore();
}

// Helper function to draw dropping tile
function drawDroppingTile(ctx, tile, currentY, cellSize) {
    const x = tile.c * cellSize;
    const y = currentY;
    
    // Draw tile at current dropping position
    ctx.save();
    ctx.translate(0, y - (tile.r * cellSize));
    drawTetrisTile(ctx, tile.r, tile.c, tile.letter, cellSize);
    ctx.restore();
}

function drawTetrisBoardWithHighlight(completedTiles) {
    const tetrisCanvas = document.getElementById('tetrisCanvas');
    const ctx = tetrisCanvas.getContext('2d');
    const cellSize = tetrisCanvas.width / 7;
    
    // Set font for letters
    ctx.font = `bold ${cellSize / 2.5}px Arial`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    
    // Draw background
    drawTetrisBoardBackground();
    
    // Draw all tiles with green highlight for completed ones
    for (let r = 0; r < 7; r++) {
        for (let c = 0; c < 7; c++) {
            if (tetrisBoard[r][c] !== '') {
                const isCompleted = completedTiles.some(tile => tile.r === r && tile.c === c);
                
                if (isCompleted) {
                    // Draw green highlight background
                    const x = c * cellSize;
                    const y = r * cellSize;
                    
                    // Green glow effect
                    const glowGradient = ctx.createRadialGradient(
                        x + cellSize/2, y + cellSize/2, 0,
                        x + cellSize/2, y + cellSize/2, cellSize
                    );
                    glowGradient.addColorStop(0, "rgba(0, 255, 0, 0.8)");
                    glowGradient.addColorStop(0.7, "rgba(0, 255, 0, 0.4)");
                    glowGradient.addColorStop(1, "rgba(0, 255, 0, 0)");
                    
                    ctx.fillStyle = glowGradient;
                    ctx.fillRect(x - cellSize/2, y - cellSize/2, cellSize * 2, cellSize * 2);
                    
                    // Draw tile with green tint
                    ctx.save();
                    ctx.globalCompositeOperation = 'multiply';
                    ctx.fillStyle = 'rgba(0, 255, 0, 0.3)';
                    ctx.fillRect(x + 2, y + 2, cellSize - 4, cellSize - 4);
                    ctx.restore();
                }
                
                drawTetrisTile(ctx, r, c, tetrisBoard[r][c], cellSize);
            }
        }
    }
}

function applyTetrisGravity() {
    console.log('Applying Tetris gravity...');
    
    // Apply gravity to make letters fall down
    for (let c = 0; c < 7; c++) {
        let writeRow = 6; // Start from bottom
        for (let r = 6; r >= 0; r--) {
            if (tetrisBoard[r][c] !== '') {
                if (writeRow !== r) {
                    tetrisBoard[writeRow][c] = tetrisBoard[r][c];
                    tetrisBoard[r][c] = '';
                }
                writeRow--;
            }
        }
    }
    
    // Find the actual empty space after gravity
    let foundEmpty = false;
    for (let r = 0; r < 7; r++) {
        for (let c = 0; c < 7; c++) {
            if (tetrisBoard[r][c] === '') {
                tetrisEmptyPos = { r: r, c: c };
                foundEmpty = true;
                console.log(`Gravity: Found empty space at (${r}, ${c})`);
                break;
            }
        }
        if (foundEmpty) break;
    }
    
    // If no empty space found, create one at the top
    if (!foundEmpty) {
        tetrisEmptyPos = { r: 0, c: Math.floor(Math.random() * 7) };
        tetrisBoard[tetrisEmptyPos.r][tetrisEmptyPos.c] = '';
        console.log(`Gravity: Created empty space at (${tetrisEmptyPos.r}, ${tetrisEmptyPos.c})`);
    }
    
    console.log('Gravity applied, empty position:', tetrisEmptyPos);
}

function addNewTetrisLetters() {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    
    // Count empty spaces
    let emptyCount = 0;
    for (let r = 0; r < 7; r++) {
        for (let c = 0; c < 7; c++) {
            if (tetrisBoard[r][c] === '') {
                emptyCount++;
            }
        }
    }
    
    console.log(`Empty spaces before filling: ${emptyCount}`);
    
    // Fill all but one empty space with new letters
    let filledCount = 0;
    for (let r = 0; r < 7; r++) {
        for (let c = 0; c < 7; c++) {
            if (tetrisBoard[r][c] === '' && filledCount < emptyCount - 1) {
                tetrisBoard[r][c] = letters[Math.floor(Math.random() * letters.length)];
                filledCount++;
            }
        }
    }
    
    // Ensure there's exactly one empty space
    if (emptyCount === 0) {
        // If no empty spaces, create one at the top
        tetrisEmptyPos = { r: 0, c: Math.floor(Math.random() * 7) };
        tetrisBoard[tetrisEmptyPos.r][tetrisEmptyPos.c] = '';
        console.log('Created new empty space at top');
    } else {
        // Find the remaining empty space and set it as the empty position
        let foundEmpty = false;
        for (let r = 0; r < 7; r++) {
            for (let c = 0; c < 7; c++) {
                if (tetrisBoard[r][c] === '') {
                    tetrisEmptyPos = { r: r, c: c };
                    foundEmpty = true;
                    console.log(`Found remaining empty space at (${r}, ${c})`);
                    break;
                }
            }
            if (foundEmpty) break;
        }
        
        // If no empty space was found, create one
        if (!foundEmpty) {
            tetrisEmptyPos = { r: 3, c: 3 }; // Default to center
            tetrisBoard[tetrisEmptyPos.r][tetrisEmptyPos.c] = '';
            console.log('No empty space found, created one at center');
        }
    }
    
    // Verify we have exactly one empty space
    let finalEmptyCount = 0;
    for (let r = 0; r < 7; r++) {
        for (let c = 0; c < 7; c++) {
            if (tetrisBoard[r][c] === '') {
                finalEmptyCount++;
            }
        }
    }
    
    console.log(`Empty spaces after filling: ${finalEmptyCount}`);
    console.log(`Empty position: (${tetrisEmptyPos.r}, ${tetrisEmptyPos.c})`);
    
    if (finalEmptyCount !== 1) {
        console.error(`ERROR: Expected 1 empty space, found ${finalEmptyCount}`);
        // Force exactly one empty space
        for (let r = 0; r < 7; r++) {
            for (let c = 0; c < 7; c++) {
                tetrisBoard[r][c] = letters[Math.floor(Math.random() * letters.length)];
            }
        }
        tetrisEmptyPos = { r: 3, c: 3 };
        tetrisBoard[tetrisEmptyPos.r][tetrisEmptyPos.c] = '';
        console.log('Forced exactly one empty space at center');
    }
}

function drawTetrisBoard(anim = null) {
    console.log('drawTetrisBoard called with anim:', anim);
    const tetrisCanvas = document.getElementById('tetrisCanvas');
    
    if (!tetrisCanvas) {
        console.error('Tetris canvas not found!');
        return;
    }
    
    console.log('Tetris canvas found, dimensions:', tetrisCanvas.width, 'x', tetrisCanvas.height);
    console.log('Current tetris board state:', tetrisBoard);
    console.log('Current tetris empty position:', tetrisEmptyPos);
    
    const ctx = tetrisCanvas.getContext('2d');
    const cellSize = tetrisCanvas.width / 7;
    
    // Set font for letters
    ctx.font = `bold ${cellSize / 2.5}px Arial`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    
    // Draw oak wood board background with realistic texture
    const boardGradient = ctx.createLinearGradient(0, 0, tetrisCanvas.width, tetrisCanvas.height);
    boardGradient.addColorStop(0, "#F5DEB3"); // Wheat
    boardGradient.addColorStop(0.2, "#DEB887"); // Burlywood
    boardGradient.addColorStop(0.4, "#D2B48C"); // Tan
    boardGradient.addColorStop(0.6, "#CD853F"); // Peru
    boardGradient.addColorStop(0.8, "#A0522D"); // Sienna
    boardGradient.addColorStop(1, "#8B4513"); // Saddle brown
    
    ctx.fillStyle = boardGradient;
    ctx.fillRect(0, 0, tetrisCanvas.width, tetrisCanvas.height);
    
    // Add oak wood grain patterns
    ctx.strokeStyle = "rgba(139, 69, 19, 0.4)";
    ctx.lineWidth = 1;
    
    // Vertical grain lines (characteristic of oak)
    for (let i = 0; i < tetrisCanvas.width; i += 3) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i + 1, tetrisCanvas.height);
        ctx.stroke();
    }
    
    // Horizontal growth rings
    ctx.strokeStyle = "rgba(160, 82, 45, 0.5)";
    ctx.lineWidth = 2;
    for (let i = 0; i < tetrisCanvas.height; i += 12) {
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(tetrisCanvas.width, i);
        ctx.stroke();
    }
    
    // Diagonal grain patterns
    ctx.strokeStyle = "rgba(101, 67, 33, 0.3)";
    ctx.lineWidth = 1;
    for (let i = 0; i < tetrisCanvas.width + tetrisCanvas.height; i += 20) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i + 8, tetrisCanvas.height);
        ctx.stroke();
    }
    
    // Add oak medullary rays (characteristic white lines in oak)
    ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
    ctx.lineWidth = 1;
    for (let i = 0; i < tetrisCanvas.height; i += 8) {
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(tetrisCanvas.width, i);
        ctx.stroke();
    }
    
    // Add light variations across the wood
    const lightGradient = ctx.createLinearGradient(0, 0, tetrisCanvas.width, 0);
    lightGradient.addColorStop(0, "rgba(255, 255, 255, 0.1)");
    lightGradient.addColorStop(0.3, "transparent");
    lightGradient.addColorStop(0.7, "transparent");
    lightGradient.addColorStop(1, "rgba(0, 0, 0, 0.1)");
    
    ctx.fillStyle = lightGradient;
    ctx.fillRect(0, 0, tetrisCanvas.width, tetrisCanvas.height);
    
    // Add board shadow for 3D effect
    ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
    ctx.fillRect(15, 15, tetrisCanvas.width, tetrisCanvas.height);
    
    // Draw board with 3D border
    ctx.fillStyle = boardGradient;
    ctx.fillRect(0, 0, tetrisCanvas.width - 15, tetrisCanvas.height - 15);

    // Draw tiles
    for (let r = 0; r < 7; r++) {
        for (let c = 0; c < 7; c++) {
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

            if (tetrisBoard[r][c] === "") {
                // Draw empty space as a recessed area
                ctx.fillStyle = "#654321";
                ctx.fillRect(x + 2, y + 2, cellSize - 4, cellSize - 4);
                
                // Add shadow to make it look recessed
                ctx.strokeStyle = "#4A2C1A";
                ctx.lineWidth = 2;
                ctx.strokeRect(x + 2, y + 2, cellSize - 4, cellSize - 4);
            } else {
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
    // Only run the game loop if tetrisGameRunning is true (exactly same as original game)
    if (!tetrisGameRunning) {
        requestAnimationFrame(updateTetrisGame);
        return;
    }
    
    const tetrisCanvas = document.getElementById('tetrisCanvas');
    if (!tetrisCanvas) {
        console.error('Tetris canvas not found in updateTetrisGame!');
        requestAnimationFrame(updateTetrisGame);
        return;
    }
    
    const ctx = tetrisCanvas.getContext('2d');
    ctx.clearRect(0, 0, tetrisCanvas.width, tetrisCanvas.height);

    if (tetrisAnimating && tetrisAnimation) {
        // Check if this is a word completion animation
        if (tetrisAnimation.isWordCompletion) {
            // Don't update progress for word completion animations
            // The animation functions handle their own timing
            console.log('Word completion animation in progress');
        } else {
            // Regular tile sliding animation
            drawTetrisBoard(tetrisAnimation);
            tetrisAnimation.progress++;
            if (tetrisAnimation.progress >= tetrisAnimation.duration) {
                // Finish animation and swap (exactly same as original game)
                tetrisBoard[tetrisAnimation.to.r][tetrisAnimation.to.c] = tetrisAnimation.letter;
                tetrisBoard[tetrisAnimation.from.r][tetrisAnimation.from.c] = "";
                tetrisEmptyPos = { r: tetrisAnimation.from.r, c: tetrisAnimation.from.c };
                tetrisAnimating = false;
                tetrisAnimation = null;
                
                console.log("Tetris board after move:", tetrisBoard); // Debug
                console.log("Tetris empty pos:", tetrisEmptyPos); // Debug
                
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
        
        // Select 3 words for each level
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
                console.log('Saved Tetris game state is too old, starting fresh');
                return false;
            }
            
            // Restore Tetris game state
            tetrisMoveCount = parsedState.tetrisMoveCount || 0;
            tetrisWordsSolved = parsedState.tetrisWordsSolved || 0;
            tetrisCurrentWord = parsedState.tetrisCurrentWord || '';
            tetrisBoard = parsedState.tetrisBoard || [];
            tetrisEmptyPos = parsedState.tetrisEmptyPos || { r: 0, c: 0 };
            tetrisGameRunning = parsedState.tetrisGameRunning !== undefined ? parsedState.tetrisGameRunning : true;
            tetrisAnimating = parsedState.tetrisAnimating || false;
            tetrisAnimation = parsedState.tetrisAnimation || null;
            tetrisCompletedTiles = parsedState.tetrisCompletedTiles || [];
            tetrisUsedWords = new Set(parsedState.tetrisUsedWords || []);
            
            console.log('Tetris game state loaded successfully');
            return true;
        }
        return false;
    } catch (error) {
        console.error('Error loading Tetris game state:', error);
        return false;
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
    console.log(`Canvas dimensions: ${canvas.width}x${canvas.height}`); // Debug
    console.log(`Canvas display size: ${canvas.offsetWidth}x${canvas.offsetHeight}`); // Debug
    const { r, c } = getCellFromCoords(x, y);
    console.log(`Click at (${x}, ${y}) -> Cell (${r}, ${c})`); // Debug
    console.log(`Empty position: (${emptyPos.r}, ${emptyPos.c})`); // Debug
    console.log(`Board state:`, board); // Debug
    tryMove(r, c);
}

function createDarkWoodPaneling() {
    // Create dark wood paneling background container
    const panelingContainer = document.createElement('div');
    panelingContainer.id = 'dark-wood-paneling';
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
    `;
    
    // Create wood paneling strips - single column
    const panelWidth = window.innerWidth; // Full width
    const panelHeight = 80; // Taller panels
    const panelsPerCol = Math.ceil(window.innerHeight / panelHeight) + 1;
    
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
            panelingContainer.appendChild(panel);
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
    panelingContainer.appendChild(trim);
    
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
    panelingContainer.appendChild(ambientLight);
    
    document.body.appendChild(panelingContainer);
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

window.addEventListener('mousedown', handleInput);
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