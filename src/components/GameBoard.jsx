import React, { useRef, useEffect, useCallback, useState } from 'react'

const GameBoard = ({ board, emptyPos, animation, completedTiles, onTileClick }) => {
  const canvasRef = useRef(null)
  const [boardSize, setBoardSize] = useState(300)
  const canvasPadding = 20 // Padding around the tile area - consistent throughout
  const gridSize = 6 // Changed from 7 to 6 for better tile sizing
  const cellSize = boardSize / gridSize // Dynamic cell size based on viewport

  // Calculate optimal board size based on container constraints
  const calculateBoardSize = useCallback(() => {
    const viewportWidth = window.innerWidth
    const containerMaxSize = Math.min(viewportWidth * 0.9, 400) // Match board-container size
    const padding = canvasPadding * 2 // Account for canvas padding
    
    // Calculate maximum tile area that fits in container
    const maxTileArea = containerMaxSize - padding
    const minSize = 240 // Minimum size for 6x6 grid playability
    
    // Round down to nearest 6 to ensure clean cell division
    const calculatedSize = Math.max(minSize, Math.floor(maxTileArea / gridSize) * gridSize)
    
    return calculatedSize
  }, [canvasPadding, gridSize])

  const drawBoard = useCallback((ctx) => {
    // Clear canvas with transparent background
    ctx.clearRect(0, 0, canvasSize, canvasSize)
    
    // Fill canvas with a subtle background color to show padding
    ctx.fillStyle = "rgba(139, 69, 19, 0.1)" // Very subtle brown tint
    ctx.fillRect(0, 0, canvasSize, canvasSize)
    
    ctx.font = `bold ${cellSize / 2.5}px Arial`
    ctx.textAlign = "center"
    ctx.textBaseline = "middle"

    // Calculate the actual tile area size (6x6 grid)
    const tileAreaSize = cellSize * gridSize
    
    // Draw wooden board background - exactly matching tile area with no border
    const boardGradient = ctx.createLinearGradient(canvasPadding, canvasPadding, canvasPadding + tileAreaSize, canvasPadding + tileAreaSize)
    boardGradient.addColorStop(0, "#8B4513") // Saddle brown
    boardGradient.addColorStop(0.3, "#A0522D") // Sienna
    boardGradient.addColorStop(0.7, "#8B4513") // Saddle brown
    boardGradient.addColorStop(1, "#654321") // Dark brown
    
    // Draw the main board background - exactly matching tile area with no border
    ctx.fillStyle = boardGradient
    ctx.fillRect(canvasPadding, canvasPadding, tileAreaSize, tileAreaSize)
    
    // Add enhanced wood grain effect
    ctx.strokeStyle = "#654321"
    ctx.lineWidth = 1
    for (let i = canvasPadding; i < canvasPadding + tileAreaSize; i += 20) {
      ctx.beginPath()
      ctx.moveTo(i, canvasPadding)
      ctx.lineTo(i + 10, canvasPadding + tileAreaSize)
      ctx.stroke()
    }

    for (let r = 0; r < gridSize; r++) {
      for (let c = 0; c < gridSize; c++) {
        const x = canvasPadding + c * cellSize
        const y = canvasPadding + r * cellSize
        
        // If animating, skip drawing the moving letter in its original spot
        if (animation && animation.from.r === r && animation.from.c === c) continue

        if (board[r] && board[r][c] === "") {
          // Draw empty space as a recessed area - with margins to fit in container
          const marginX = 2
          const marginY = 4 // More vertical spacing
          ctx.fillStyle = "#654321"
          ctx.fillRect(x + marginX, y + marginY, cellSize - marginX * 2, cellSize - marginY * 2)
          
          // Add shadow to make it look recessed
          ctx.strokeStyle = "#4A2C1A"
          ctx.lineWidth = 1
          ctx.strokeRect(x + marginX, y + marginY, cellSize - marginX * 2, cellSize - marginY * 2)
        } else if (board[r] && board[r][c]) {
          // Check if this tile is part of a completed word
          const isCompleted = completedTiles.some(tile => tile.r === r && tile.c === c)
          
          // Draw enhanced 3D block tile
          const blockHeight = 18 // Much more pronounced 3D effect
          const marginX = 2 // Horizontal margin
          const marginY = 4 // Vertical margin for better spacing
          
          // Draw enhanced bottom shadow with multiple layers
          ctx.fillStyle = "rgba(0, 0, 0, 0.6)"
          ctx.fillRect(x + marginX + blockHeight, y + marginY + blockHeight, cellSize - marginX * 2, cellSize - marginY * 2)
          
          // Draw additional shadow layers for extreme depth
          ctx.fillStyle = "rgba(0, 0, 0, 0.4)"
          ctx.fillRect(x + marginX + blockHeight - 3, y + marginY + blockHeight - 3, cellSize - marginX * 2, cellSize - marginY * 2)
          
          ctx.fillStyle = "rgba(0, 0, 0, 0.2)"
          ctx.fillRect(x + marginX + blockHeight - 6, y + marginY + blockHeight - 6, cellSize - marginX * 2, cellSize - marginY * 2)
          
          // Draw right side of block with enhanced 3D
          ctx.fillStyle = isCompleted ? "#2E8B57" : "#A0522D" // Green for completed
          ctx.beginPath()
          ctx.moveTo(x + marginX + cellSize - marginX * 2, y + marginY)
          ctx.lineTo(x + marginX + cellSize - marginX * 2 + blockHeight, y + marginY + blockHeight)
          ctx.lineTo(x + marginX + cellSize - marginX * 2 + blockHeight, y + marginY + cellSize - marginY * 2 + blockHeight)
          ctx.lineTo(x + marginX + cellSize - marginX * 2, y + marginY + cellSize - marginY * 2)
          ctx.closePath()
          ctx.fill()
          
          // Draw bottom side of block with enhanced 3D
          ctx.fillStyle = isCompleted ? "#228B22" : "#8B4513" // Green for completed
          ctx.beginPath()
          ctx.moveTo(x + marginX, y + marginY + cellSize - marginY * 2)
          ctx.lineTo(x + marginX + cellSize - marginX * 2, y + marginY + cellSize - marginY * 2)
          ctx.lineTo(x + marginX + cellSize - marginX * 2 + blockHeight, y + marginY + cellSize - marginY * 2 + blockHeight)
          ctx.lineTo(x + marginX + blockHeight, y + marginY + cellSize - marginY * 2 + blockHeight)
          ctx.closePath()
          ctx.fill()
          
          // Add intense highlight on top edge for dramatic 3D effect
          ctx.strokeStyle = isCompleted ? "#90EE90" : "#FFFFFF"
          ctx.lineWidth = 3
          ctx.beginPath()
          ctx.moveTo(x + marginX, y + marginY)
          ctx.lineTo(x + marginX + cellSize - marginX * 2, y + marginY)
          ctx.stroke()
          
          // Add intense highlight on left edge for dramatic 3D effect
          ctx.beginPath()
          ctx.moveTo(x + marginX, y + marginY)
          ctx.lineTo(x + marginX, y + marginY + cellSize - marginY * 2)
          ctx.stroke()
          
          // Add secondary highlight for extra depth
          ctx.strokeStyle = isCompleted ? "#90EE90" : "#F5DEB3"
          ctx.lineWidth = 1
          ctx.beginPath()
          ctx.moveTo(x + marginX + 1, y + marginY + 1)
          ctx.lineTo(x + marginX + cellSize - marginX * 2 - 1, y + marginY + 1)
          ctx.stroke()
          
          ctx.beginPath()
          ctx.moveTo(x + marginX + 1, y + marginY + 1)
          ctx.lineTo(x + marginX + 1, y + marginY + cellSize - marginY * 2 - 1)
          ctx.stroke()
          
          // Draw main face of block
          let tileGradient
          if (isCompleted) {
            tileGradient = ctx.createLinearGradient(x + marginX, y + marginY, x + marginX + cellSize - marginX * 2, y + marginY + cellSize - marginY * 2)
            tileGradient.addColorStop(0, "#90EE90") // Light green
            tileGradient.addColorStop(0.3, "#32CD32") // Lime green
            tileGradient.addColorStop(0.7, "#228B22") // Forest green
            tileGradient.addColorStop(1, "#006400") // Dark green
          } else {
            tileGradient = ctx.createLinearGradient(x + marginX, y + marginY, x + marginX + cellSize - marginX * 2, y + marginY + cellSize - marginY * 2)
            tileGradient.addColorStop(0, "#F5DEB3") // Wheat
            tileGradient.addColorStop(0.3, "#DEB887") // Burlywood
            tileGradient.addColorStop(0.7, "#D2B48C") // Tan
            tileGradient.addColorStop(1, "#BC8F8F") // Rosy brown
          }
          
          ctx.fillStyle = tileGradient
          ctx.fillRect(x + marginX, y + marginY, cellSize - marginX * 2, cellSize - marginY * 2)
          
          // Add wood grain to tile
          ctx.strokeStyle = "#CD853F"
          ctx.lineWidth = 0.5
          for (let i = 0; i < 3; i++) {
            ctx.beginPath()
            ctx.moveTo(x + marginX + 5 + i * 8, y + marginY + 5)
            ctx.lineTo(x + marginX + 8 + i * 8, y + marginY + cellSize - marginY * 2 - 5)
            ctx.stroke()
          }
          
          // Draw letter with clean 3D effect (like sliding animation)
          ctx.save()
          ctx.fillStyle = "#8B4513"
          ctx.shadowColor = "#4A2C1A"
          ctx.shadowBlur = 3
          ctx.shadowOffsetX = 2
          ctx.shadowOffsetY = 2
          ctx.fillText(
            board[r][c],
            x + marginX + (cellSize - marginX * 2) / 2,
            y + marginY + (cellSize - marginY * 2) / 2
          )
          ctx.restore()

        }
      }
    }

    // Draw the moving letter if animating
    if (animation) {
      const t = animation.progress / animation.duration
      const marginX = 2
      const marginY = 4
      const startX = canvasPadding + animation.from.c * cellSize + marginX + (cellSize - marginX * 2) / 2
      const startY = canvasPadding + animation.from.r * cellSize + marginY + (cellSize - marginY * 2) / 2
      const endX = canvasPadding + animation.to.c * cellSize + marginX + (cellSize - marginX * 2) / 2
      const endY = canvasPadding + animation.to.r * cellSize + marginY + (cellSize - marginY * 2) / 2
      const x = startX + (endX - startX) * t
      const y = startY + (endY - startY) * t

      // Draw moving tile as a floating block
      const blockSize = cellSize - 8
      const blockHeight = 6
      
      // Shadow
      ctx.fillStyle = "rgba(74, 44, 26, 0.5)"
      ctx.fillRect(x - blockSize/2 + 3, y - blockSize/2 + 3, blockSize, blockSize)
      
      // 3D block sides
      ctx.fillStyle = "#A0522D"
      ctx.beginPath()
      ctx.moveTo(x + blockSize/2, y - blockSize/2)
      ctx.lineTo(x + blockSize/2 + blockHeight, y - blockSize/2 + blockHeight)
      ctx.lineTo(x + blockSize/2 + blockHeight, y + blockSize/2 + blockHeight)
      ctx.lineTo(x + blockSize/2, y + blockSize/2)
      ctx.closePath()
      ctx.fill()
      
      ctx.fillStyle = "#8B4513"
      ctx.beginPath()
      ctx.moveTo(x - blockSize/2, y + blockSize/2)
      ctx.lineTo(x + blockSize/2, y + blockSize/2)
      ctx.lineTo(x + blockSize/2 + blockHeight, y + blockSize/2 + blockHeight)
      ctx.lineTo(x - blockSize/2 + blockHeight, y + blockSize/2 + blockHeight)
      ctx.closePath()
      ctx.fill()
      
      // Main face
      const tileGradient = ctx.createLinearGradient(x - blockSize/2, y - blockSize/2, x + blockSize/2, y + blockSize/2)
      tileGradient.addColorStop(0, "#F5DEB3")
      tileGradient.addColorStop(0.5, "#DEB887")
      tileGradient.addColorStop(1, "#D2B48C")
      
      ctx.fillStyle = tileGradient
      ctx.fillRect(x - blockSize/2, y - blockSize/2, blockSize, blockSize)
      
      // Letter
      ctx.save()
      ctx.fillStyle = "#8B4513"
      ctx.shadowColor = "#4A2C1A"
      ctx.shadowBlur = 3
      ctx.shadowOffsetX = 2
      ctx.shadowOffsetY = 2
      ctx.fillText(animation.letter, x, y)
      ctx.restore()

    }
  }, [board, animation, completedTiles, cellSize, boardSize, canvasPadding, canvasSize, gridSize])

  const handleClick = useCallback((event) => {
    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top
    
    const c = Math.floor((x - canvasPadding) / cellSize)
    const r = Math.floor((y - canvasPadding) / cellSize)
    
    if (r >= 0 && r < gridSize && c >= 0 && c < gridSize) {
      onTileClick(r, c)
    }
  }, [onTileClick, cellSize, canvasPadding])

  const handleTouch = useCallback((event) => {
    event.preventDefault()
    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()
    const touch = event.touches[0]
    const x = touch.clientX - rect.left
    const y = touch.clientY - rect.top
    
    const c = Math.floor((x - canvasPadding) / cellSize)
    const r = Math.floor((y - canvasPadding) / cellSize)
    
    if (r >= 0 && r < gridSize && c >= 0 && c < gridSize) {
      onTileClick(r, c)
    }
  }, [onTileClick, cellSize, canvasPadding])

  // Initialize board size on mount
  useEffect(() => {
    const newSize = calculateBoardSize()
    setBoardSize(newSize)
  }, [calculateBoardSize])

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      const newSize = calculateBoardSize()
      setBoardSize(newSize)
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [calculateBoardSize])

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    drawBoard(ctx)
  }, [drawBoard])

  // Calculate canvas size with padding around the tile area
  const tileAreaSize = cellSize * gridSize
  const canvasSize = tileAreaSize + (canvasPadding * 2)

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center',
      width: '100%',
      height: '100%',
      maxWidth: '100%',
      maxHeight: '100%'
    }}>
      <canvas
        id="game-board-canvas"
        ref={canvasRef}
        width={canvasSize}
        height={canvasSize}
        onClick={handleClick}
        onTouchStart={handleTouch}
        style={{
          borderRadius: '8px',
          boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.3), 0 4px 8px rgba(0,0,0,0.2)',
          touchAction: 'none',
          cursor: 'pointer',
          maxWidth: '100%',
          maxHeight: '100%',
          width: 'auto',
          height: 'auto',
          display: 'block'
        }}
      />
    </div>
  )
}

export default GameBoard 