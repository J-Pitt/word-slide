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
const MAX_LEVELS = 10;
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
    moveCount = 0;
    completedTiles = [];
    updateMoveCounter();
    updateLevelDisplay();
    updateTargetWordsDisplay();
    generateBoard();
    drawBoard();
}

// Make resetGame globally accessible
window.resetGame = resetGame;

// Function to advance to next level (called from HTML button)
function nextLevel() {
    if (currentLevel < MAX_LEVELS) {
        currentLevel++;
        moveCount = 0;
        completedTiles = [];
        updateMoveCounter();
        updateLevelDisplay();
        updateTargetWordsDisplay();
        generateBoard();
        drawBoard();
    } else {
        alert("You've completed all levels! Congratulations!");
    }
}

// Make nextLevel globally accessible
window.nextLevel = nextLevel;

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
        button.textContent = 'Play Again';
        button.onclick = () => {
            currentLevel = 1;
            moveCount = 0;
            updateMoveCounter();
            updateLevelDisplay();
            updateTargetWordsDisplay();
            generateBoard();
            drawBoard();
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
                duration: 15 // frames
            };
            moveCount++;
            updateMoveCounter(); // Update the display
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
];

function getCurrentWordSet() {
    return WORD_SETS[currentLevel - 1] || WORD_SETS[0];
}

// Track which individual tiles are part of completed words
let completedTiles = [];

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
    const isCompleted = completedTiles.some(tile => tile.r === r && tile.c === c);
    if (isCompleted) {
        console.log(`Tile at (${r}, ${c}) is completed!`); // Debug
    }
    return isCompleted;
}

function checkWordCompletion() {
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
    // Create a solvable board with the target words
    const targetWords = getCurrentWordSet();
    board = [];
    
    // Initialize empty board
    for (let r = 0; r < rows; r++) {
        board[r] = [];
        for (let c = 0; c < cols; c++) {
            board[r][c] = "";
        }
    }
    
    // Create a truly scrambled board based on current target words
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
    
    // Place letters on the board in scrambled positions
    let letterIndex = 0;
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            if (r === rows - 1 && c === cols - 1) {
                board[r][c] = ""; // Empty space in bottom-right
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
    emptyPos = { r: rows - 1, c: cols - 1 };
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
    
    generateBoard();
    console.log(board); // Debug: See the board in the console
    gameRunning = true;
    completedTiles = [];
    updateMoveCounter(); // Initialize move counter
    updateLevelDisplay(); // Initialize level display
    updateTargetWordsDisplay(); // Initialize target words display
    drawBoard(); // <-- Add this line
    updateGame();
    

}

function drawBoard(anim = null) {
    const cellSize = canvas.width / cols;
    ctx.font = `bold ${cellSize / 2.5}px Arial`; // Smaller font for mobile
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

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
                const isCompleted = isTileCompleted(r, c);
                
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

window.addEventListener('touchstart', handleInput);
window.addEventListener('mousedown', handleInput);
window.addEventListener('DOMContentLoaded', startGame);