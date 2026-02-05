import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import Game from './Game'
import './game.css'

const SESSION_KEY = 'wordslide_truthordare_unlocked'
const PASSWORD = import.meta.env.VITE_TRUTH_OR_DARE_PASSWORD ?? ''

export default function TruthOrDarePage() {
  const [unlocked, setUnlocked] = useState(false)
  const [passwordInput, setPasswordInput] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!PASSWORD) {
      setUnlocked(true)
      return
    }
    try {
      const stored = sessionStorage.getItem(SESSION_KEY)
      if (stored === '1') setUnlocked(true)
    } catch (_) {
      // ignore
    }
  }, [])

  function handlePasswordSubmit(e) {
    e.preventDefault()
    setError('')
    if (passwordInput.trim() === PASSWORD) {
      try {
        sessionStorage.setItem(SESSION_KEY, '1')
      } catch (_) {
        // ignore
      }
      setUnlocked(true)
      setPasswordInput('')
    } else {
      setError('Wrong password. Try again.')
    }
  }

  if (PASSWORD && !unlocked) {
    return (
      <div className="qtd-game qtd-game-fullscreen">
        <div className="qtd-game-header">
          <Link to="/" className="btn btn-cancel btn-back">
            ← WordSlide
          </Link>
        </div>
        <div className="qtd-game-body qtd-password-gate">
          <div className="qtd-password-card">
            <h1 className="qtd-password-title">Truth or Dare</h1>
            <p className="qtd-password-subtitle">Enter the password to play</p>
            <form onSubmit={handlePasswordSubmit} className="qtd-password-form">
              <input
                type="password"
                value={passwordInput}
                onChange={(e) => { setPasswordInput(e.target.value); setError('') }}
                placeholder="Password"
                className="qtd-password-input"
                autoComplete="current-password"
                autoFocus
              />
              {error && <p className="qtd-password-error" role="alert">{error}</p>}
              <button type="submit" className="btn btn-play">Enter</button>
            </form>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="qtd-game qtd-game-fullscreen">
      <div className="qtd-game-header">
        <Link to="/" className="btn btn-cancel btn-back">
          ← WordSlide
        </Link>
      </div>
      <div className="qtd-game-body">
        <Game />
      </div>
    </div>
  )
}
