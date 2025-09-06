import React, { useRef, useEffect, useCallback } from 'react'

const GameBoard = ({ board, emptyPos, animation, completedTiles, onTileClick }) => {
  const canvasRef = useRef(null)
  const cellSize = 490 / 7 // 490px canvas / 7 columns (increased from 420px)

  const drawBoard = useCallback((ctx) => {
    ctx.font = `bold ${cellSize / 2.5}px Arial`
    ctx.textAlign = "center"
    ctx.textBaseline = "middle"

    // Draw wooden board background with enhanced 3D effect
    const boardGradient = ctx.createLinearGradient(0, 0, 490, 490)
    boardGradient.addColorStop(0, "#8B4513") // Saddle brown
    boardGradient.addColorStop(0.3, "#A0522D") // Sienna
    boardGradient.addColorStop(0.7, "#8B4513") // Saddle brown
    boardGradient.addColorStop(1, "#654321") // Dark brown
    
    ctx.fillStyle = boardGradient
    ctx.fillRect(0, 0, 490, 490)
    
    // Add enhanced wood grain effect
    ctx.strokeStyle = "#654321"
    ctx.lineWidth = 1
    for (let i = 0; i < 490; i += 20) {
      ctx.beginPath()
      ctx.moveTo(i, 0)
      ctx.lineTo(i + 10, 490)
      ctx.stroke()
    }
    
    // Add board shadow for 3D effect
    ctx.fillStyle = "rgba(0, 0, 0, 0.3)"
    ctx.fillRect(15, 15, 490, 490)
    
    // Draw board with 3D border
    ctx.fillStyle = boardGradient
    ctx.fillRect(0, 0, 490 - 15, 490 - 15)

    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        const x = c * cellSize
        const y = r * cellSize
        
        // If animating, skip drawing the moving letter in its original spot
        if (animation && animation.from.r === r && animation.from.c === c) continue

        if (board[r] && board[r][c] === "") {
          // Draw empty space as a recessed area
          ctx.fillStyle = "#654321"
          ctx.fillRect(x + 2, y + 2, cellSize - 4, cellSize - 4)
          
          // Add shadow to make it look recessed
          ctx.strokeStyle = "#4A2C1A"
          ctx.lineWidth = 2
          ctx.strokeRect(x + 2, y + 2, cellSize - 4, cellSize - 4)
        } else if (board[r] && board[r][c]) {
          // Check if this tile is part of a completed word
          const isCompleted = completedTiles.some(tile => tile.r === r && tile.c === c)
          
          // Draw enhanced 3D block tile
          const blockHeight = 18 // Much more pronounced 3D effect
          
          // Draw enhanced bottom shadow with multiple layers
          ctx.fillStyle = "rgba(0, 0, 0, 0.6)"
          ctx.fillRect(x + blockHeight, y + blockHeight, cellSize - 4, cellSize - 4)
          
          // Draw additional shadow layers for extreme depth
          ctx.fillStyle = "rgba(0, 0, 0, 0.4)"
          ctx.fillRect(x + blockHeight - 3, y + blockHeight - 3, cellSize - 4, cellSize - 4)
          
          ctx.fillStyle = "rgba(0, 0, 0, 0.2)"
          ctx.fillRect(x + blockHeight - 6, y + blockHeight - 6, cellSize - 4, cellSize - 4)
          
          // Draw right side of block with enhanced 3D
          ctx.fillStyle = isCompleted ? "#2E8B57" : "#A0522D" // Green for completed
          ctx.beginPath()
          ctx.moveTo(x + cellSize - 4, y)
          ctx.lineTo(x + cellSize - 4 + blockHeight, y + blockHeight)
          ctx.lineTo(x + cellSize - 4 + blockHeight, y + cellSize - 4 + blockHeight)
          ctx.lineTo(x + cellSize - 4, y + cellSize - 4)
          ctx.closePath()
          ctx.fill()
          
          // Draw bottom side of block with enhanced 3D
          ctx.fillStyle = isCompleted ? "#228B22" : "#8B4513" // Green for completed
          ctx.beginPath()
          ctx.moveTo(x, y + cellSize - 4)
          ctx.lineTo(x + cellSize - 4, y + cellSize - 4)
          ctx.lineTo(x + cellSize - 4 + blockHeight, y + cellSize - 4 + blockHeight)
          ctx.lineTo(x + blockHeight, y + cellSize - 4 + blockHeight)
          ctx.closePath()
          ctx.fill()
          
          // Add intense highlight on top edge for dramatic 3D effect
          ctx.strokeStyle = isCompleted ? "#90EE90" : "#FFFFFF"
          ctx.lineWidth = 3
          ctx.beginPath()
          ctx.moveTo(x, y)
          ctx.lineTo(x + cellSize - 4, y)
          ctx.stroke()
          
          // Add intense highlight on left edge for dramatic 3D effect
          ctx.beginPath()
          ctx.moveTo(x, y)
          ctx.lineTo(x, y + cellSize - 4)
          ctx.stroke()
          
          // Add secondary highlight for extra depth
          ctx.strokeStyle = isCompleted ? "#90EE90" : "#F5DEB3"
          ctx.lineWidth = 1
          ctx.beginPath()
          ctx.moveTo(x + 1, y + 1)
          ctx.lineTo(x + cellSize - 5, y + 1)
          ctx.stroke()
          
          ctx.beginPath()
          ctx.moveTo(x + 1, y + 1)
          ctx.lineTo(x + 1, y + cellSize - 5)
          ctx.stroke()
          
          // Draw main face of block
          let tileGradient
          if (isCompleted) {
            tileGradient = ctx.createLinearGradient(x, y, x + cellSize, y + cellSize)
            tileGradient.addColorStop(0, "#90EE90") // Light green
            tileGradient.addColorStop(0.3, "#32CD32") // Lime green
            tileGradient.addColorStop(0.7, "#228B22") // Forest green
            tileGradient.addColorStop(1, "#006400") // Dark green
          } else {
            tileGradient = ctx.createLinearGradient(x, y, x + cellSize, y + cellSize)
            tileGradient.addColorStop(0, "#F5DEB3") // Wheat
            tileGradient.addColorStop(0.3, "#DEB887") // Burlywood
            tileGradient.addColorStop(0.7, "#D2B48C") // Tan
            tileGradient.addColorStop(1, "#BC8F8F") // Rosy brown
          }
          
          ctx.fillStyle = tileGradient
          ctx.fillRect(x, y, cellSize - 4, cellSize - 4)
          
          // Add wood grain to tile
          ctx.strokeStyle = "#CD853F"
          ctx.lineWidth = 0.5
          for (let i = 0; i < 3; i++) {
            ctx.beginPath()
            ctx.moveTo(x + 5 + i * 8, y + 5)
            ctx.lineTo(x + 8 + i * 8, y + cellSize - 9)
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
            x + (cellSize - 4) / 2,
            y + (cellSize - 4) / 2
          )
          ctx.restore()

        }
      }
    }

    // Draw the moving letter if animating
    if (animation) {
      const t = animation.progress / animation.duration
      const startX = animation.from.c * cellSize + (cellSize - 4) / 2
      const startY = animation.from.r * cellSize + (cellSize - 4) / 2
      const endX = animation.to.c * cellSize + (cellSize - 4) / 2
      const endY = animation.to.r * cellSize + (cellSize - 4) / 2
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
  }, [board, animation, completedWords, cellSize])

  const handleClick = useCallback((event) => {
    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top
    
    const c = Math.floor(x / cellSize)
    const r = Math.floor(y / cellSize)
    
    if (r >= 0 && r < 5 && c >= 0 && c < 5) {
      onTileClick(r, c)
    }
  }, [onTileClick, cellSize])

  const handleTouch = useCallback((event) => {
    event.preventDefault()
    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()
    const touch = event.touches[0]
    const x = touch.clientX - rect.left
    const y = touch.clientY - rect.top
    
    const c = Math.floor(x / cellSize)
    const r = Math.floor(y / cellSize)
    
    if (r >= 0 && r < 5 && c >= 0 && c < 5) {
      onTileClick(r, c)
    }
  }, [onTileClick, cellSize])

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    drawBoard(ctx)
  }, [drawBoard])

  return (
    <canvas
      ref={canvasRef}
      width={490}
      height={490}
      onClick={handleClick}
      onTouchStart={handleTouch}
      style={{
        borderRadius: '8px',
        boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.3), 0 4px 8px rgba(0,0,0,0.2)',
        touchAction: 'none',
        cursor: 'pointer'
      }}
    />
  )
}

export default GameBoard 