import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import Game from './Game'
import { getStatus, check, login } from './gameAuthApi'
import './game.css'

const SESSION_KEY = 'wordslide_truthordare_unlocked'
const CLIENT_PASSWORD = import.meta.env.VITE_TRUTH_OR_DARE_PASSWORD ?? ''

export default function TruthOrDarePage() {
  const [unlocked, setUnlocked] = useState(false)
  const [passwordInput, setPasswordInput] = useState('')
  const [error, setError] = useState('')
  const [authMode, setAuthMode] = useState(null) // null loading, 'server' use API, 'client' use VITE password, 'not_configured' show message

  useEffect(() => {
    async function init() {
      if (CLIENT_PASSWORD) {
        try {
          const stored = sessionStorage.getItem(SESSION_KEY)
          if (stored === '1') {
            setUnlocked(true)
            setAuthMode('client')
            return
          }
        } catch (_) {}
      }

      try {
        const { configured } = await getStatus()
        if (!configured) {
          if (CLIENT_PASSWORD) {
            setAuthMode('client')
            return
          }
          setAuthMode('not_configured')
          return
        }
        setAuthMode('server')
        const { ok } = await check()
        if (ok) setUnlocked(true)
      } catch (_) {
        if (CLIENT_PASSWORD) setAuthMode('client')
        else setAuthMode('not_configured')
      }
    }
    init()
  }, [])

  async function handlePasswordSubmit(e) {
    e.preventDefault()
    setError('')

    if (authMode === 'client') {
      if (passwordInput.trim() === CLIENT_PASSWORD) {
        try {
          sessionStorage.setItem(SESSION_KEY, '1')
        } catch (_) {}
        setUnlocked(true)
        setPasswordInput('')
      } else {
        setError('Wrong password. Try again.')
      }
      return
    }

    if (authMode === 'server') {
      try {
        await login(passwordInput)
        try {
          sessionStorage.setItem(SESSION_KEY, '1')
        } catch (_) {}
        setUnlocked(true)
        setPasswordInput('')
      } catch (err) {
        setError(err.message || 'Wrong password. Try again.')
      }
    }
  }

  const showPasswordGate = !unlocked && (authMode === 'server' || authMode === 'client')
  const showNotConfigured = !unlocked && authMode === 'not_configured'

  if (showNotConfigured) {
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
            <p className="qtd-password-subtitle qtd-password-not-configured">Game isn’t configured.</p>
            <p className="qtd-password-hint">Set GAME_PASSWORD in your deployment environment and redeploy.</p>
          </div>
        </div>
      </div>
    )
  }

  if (showPasswordGate) {
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

  if (authMode === null) {
    return (
      <div className="qtd-game qtd-game-fullscreen">
        <div className="qtd-game-header">
          <Link to="/" className="btn btn-cancel btn-back">
            ← WordSlide
          </Link>
        </div>
        <div className="qtd-game-body qtd-password-gate">
          <div className="qtd-password-card">
            <p className="qtd-password-subtitle">Loading…</p>
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
