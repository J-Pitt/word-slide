import React, { useState, useRef } from 'react'

const DICE_FACES = {
  1: [5],
  2: [1, 9],
  3: [1, 5, 9],
  4: [1, 3, 7, 9],
  5: [1, 3, 5, 7, 9],
  6: [1, 3, 4, 6, 7, 9],
}

export default function Dice({ onRollComplete }) {
  const [value, setValue] = useState(1)
  const [isRolling, setIsRolling] = useState(false)
  const intervalRef = useRef(null)

  function roll() {
    if (isRolling) return
    setIsRolling(true)
    const final = Math.floor(Math.random() * 6) + 1
    const DURATION = 2000
    const STEP = 80
    intervalRef.current = setInterval(() => {
      setValue(() => Math.floor(Math.random() * 6) + 1)
    }, STEP)
    setTimeout(() => {
      if (intervalRef.current) clearInterval(intervalRef.current)
      setValue(final)
      setIsRolling(false)
      if (onRollComplete) onRollComplete(final)
    }, DURATION)
  }

  return (
    <div className="dice-stage">
      <button
        type="button"
        className={`dice ${isRolling ? 'dice-rolling' : ''}`}
        onClick={roll}
        aria-label="Roll dice"
      >
        <div className="dice-face">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
            <span
              key={i}
              className={`dice-dot ${DICE_FACES[value]?.includes(i) ? 'dice-dot-on' : ''}`}
            />
          ))}
        </div>
      </button>
    </div>
  )
}
