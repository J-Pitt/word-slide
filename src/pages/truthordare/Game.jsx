import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { TOTAL_SQUARES } from './data/board'
import { listB } from './data/listB'
import Dice from './Dice'
import GameBoard from './GameBoard'
import ResultModal from './ResultModal'
import LocalChatBox from '../shared/LocalChatBox'
import { createRoom, joinRoom, getRoom, updateRoomState } from './roomApi'

const POLL_MS = 2500

function serializeState(s) {
  return {
    players: s.players,
    positions: s.positions,
    currentPlayerIndex: s.currentPlayerIndex,
    winner: s.winner,
    result: s.result,
    category: s.category,
    resultForPlayer: s.resultForPlayer,
    usedQuestions: s.usedQuestions ? [...s.usedQuestions] : [],
    gameStarted: true
  }
}

function applyState(setters, state) {
  if (!state || !state.players?.length) return
  setters.setPlayers(state.players)
  setters.setPositions(Array.isArray(state.positions) ? state.positions : state.players.map(() => 1))
  setters.setCurrentPlayerIndex(state.currentPlayerIndex ?? 0)
  setters.setWinner(state.winner ?? null)
  setters.setResult(state.result ?? null)
  setters.setCategory(state.category ?? null)
  setters.setResultForPlayer(state.resultForPlayer ?? null)
  setters.setUsedQuestions(state.usedQuestions ? new Set(state.usedQuestions) : new Set())
}

export default function Game() {
  const { token } = useAuth() || {}
  const roomApiKey = typeof import.meta !== 'undefined' && (import.meta.env?.VITE_TRUTHORDARE_ROOM_API_KEY || import.meta.env?.VITE_API_KEY)
  const roomAuth = useMemo(
    () => ({ token: token || undefined, apiKey: roomApiKey || undefined }),
    [token, roomApiKey]
  )

  const [result, setResult] = useState(null)
  const [category, setCategory] = useState(null)
  const [resultForPlayer, setResultForPlayer] = useState(null)
  const [showSetup, setShowSetup] = useState(false)
  const [playWithOthers, setPlayWithOthers] = useState(false)
  const [players, setPlayers] = useState([])
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0)
  const [numPlayers, setNumPlayers] = useState(2)
  const [playerNames, setPlayerNames] = useState(['', ''])
  const [positions, setPositions] = useState([])
  const [winner, setWinner] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [usedQuestions, setUsedQuestions] = useState(new Set())
  const [chatMessages, setChatMessages] = useState([])
  // Room (play with others via game code)
  const [roomId, setRoomId] = useState(null)
  const [roomGameCode, setRoomGameCode] = useState('')
  const [roomPlayers, setRoomPlayers] = useState([])
  const [isHost, setIsHost] = useState(false)
  const [roomChoice, setRoomChoice] = useState(null) // 'create' | 'join'
  const [roomError, setRoomError] = useState('')
  const [roomLoading, setRoomLoading] = useState(false)
  const [createName, setCreateName] = useState('')
  const [joinCode, setJoinCode] = useState('')
  const [joinName, setJoinName] = useState('')
  const lastStateRef = useRef(null)
  const pollRef = useRef(null)

  const gameStarted = players.length > 0
  const currentPlayer = players[currentPlayerIndex] ?? null

  const setters = {
    setPlayers, setPositions, setCurrentPlayerIndex, setWinner, setResult,
    setCategory, setResultForPlayer, setUsedQuestions
  }

  const pushRoomState = useCallback(() => {
    if (!roomId || !isHost || !gameStarted) return
    const state = serializeState({
      players, positions, currentPlayerIndex, winner, result, category,
      resultForPlayer, usedQuestions
    })
    updateRoomState(roomId, state, roomAuth).catch((e) => console.warn('Room sync failed', e))
  }, [roomId, isHost, gameStarted, players, positions, currentPlayerIndex, winner, result, category, resultForPlayer, usedQuestions, roomAuth])

  useEffect(() => {
    if (!roomId || !gameStarted || !isHost) return
    pushRoomState()
  }, [roomId, isHost, gameStarted, players, positions, currentPlayerIndex, winner, result, category, resultForPlayer, usedQuestions, pushRoomState])

  useEffect(() => {
    if (!roomId) return
    const tick = async () => {
      try {
        const data = await getRoom(roomId, roomAuth)
        setRoomPlayers(data.players || [])
        if (data.state && data.state.gameStarted && !isHost) {
          const state = data.state
          if (state.players?.length && lastStateRef.current !== data.updatedAt) {
            lastStateRef.current = data.updatedAt
            applyState(setters, state)
          }
        }
      } catch (_) {
        // ignore poll errors
      }
    }
    tick()
    pollRef.current = setInterval(tick, POLL_MS)
    return () => { if (pollRef.current) clearInterval(pollRef.current) }
  }, [roomId, isHost, roomAuth])

  function handleChatSend(text, image) {
    setChatMessages((prev) => [...prev, { playerName: 'You', text, ts: Date.now(), image }])
  }

  function handleNumPlayersChange(v) {
    const n = Math.max(2, Math.min(20, Number(v) || 2))
    setNumPlayers(n)
    setPlayerNames((p) => {
      const next = []
      for (let i = 0; i < n; i++) next[i] = p[i] ?? ''
      return next
    })
  }

  function handleNameChange(i, value) {
    setPlayerNames((p) => {
      const next = [...p]
      next[i] = value
      return next
    })
  }

  async function handleCreateRoom(e) {
    e.preventDefault()
    setRoomError('')
    setRoomLoading(true)
    try {
      const data = await createRoom(createName || 'Host', roomAuth)
      setRoomId(data.roomId)
      setRoomGameCode(data.gameCode)
      setRoomPlayers(data.players || [])
      setIsHost(true)
      setRoomChoice(null)
    } catch (err) {
      setRoomError(err.message || 'Could not create room')
    } finally {
      setRoomLoading(false)
    }
  }

  async function handleJoinRoom(e) {
    e.preventDefault()
    setRoomError('')
    setRoomLoading(true)
    try {
      const data = await joinRoom(joinCode, joinName, roomAuth)
      setRoomId(data.roomId)
      setRoomPlayers(data.players || [])
      setIsHost(false)
      setRoomChoice(null)
    } catch (err) {
      setRoomError(err.message || 'Could not join room')
    } finally {
      setRoomLoading(false)
    }
  }

  function handleStartRoomGame() {
    if (roomPlayers.length < 2) return
    const initialPositions = roomPlayers.map(() => 1)
    setPlayers(roomPlayers)
    setPositions(initialPositions)
    setWinner(null)
    setResult(null)
    setCategory(null)
    setResultForPlayer(null)
    setCurrentPlayerIndex(0)
    setUsedQuestions(new Set())
    lastStateRef.current = null
    const state = serializeState({
      players: roomPlayers,
      positions: initialPositions,
      currentPlayerIndex: 0,
      winner: null,
      result: null,
      category: null,
      resultForPlayer: null,
      usedQuestions: []
    })
    updateRoomState(roomId, state, roomAuth).catch((e) => console.warn('Room start sync failed', e))
  }

  function handleStartGame(e) {
    e.preventDefault()
    const names = playerNames.map((n, i) => (n.trim() || `Player ${i + 1}`))
    setPlayers(names)
    setPositions(names.map(() => 1))
    setWinner(null)
    setShowSetup(false)
    setResult(null)
    setCategory(null)
    setResultForPlayer(null)
    setCurrentPlayerIndex(0)
    setUsedQuestions(new Set())
  }

  function exitRoom() {
    setRoomId(null)
    setRoomGameCode('')
    setRoomPlayers([])
    setIsHost(false)
    setRoomChoice(null)
    setRoomError('')
    if (pollRef.current) clearInterval(pollRef.current)
    lastStateRef.current = null
  }

  function handleNewGame() {
    setPositions(players.map(() => 1))
    setWinner(null)
    setResult(null)
    setCategory(null)
    setResultForPlayer(null)
    setCurrentPlayerIndex(0)
    setUsedQuestions(new Set())
  }

  function getRandomUnusedQuestion() {
    const unused = listB.filter((q) => !usedQuestions.has(q))
    if (unused.length === 0) {
      setUsedQuestions(new Set())
      if (listB.length === 0) return null
      const randomIndex = Math.floor(Math.random() * listB.length)
      const question = listB[randomIndex]
      setUsedQuestions(new Set([question]))
      return question
    }
    const randomIndex = Math.floor(Math.random() * unused.length)
    const question = unused[randomIndex]
    setUsedQuestions((prev) => new Set(prev).add(question))
    return question
  }

  function handleDiceComplete(diceValue) {
    const pos = positions[currentPlayerIndex] ?? 1
    const newPos = Math.min(pos + diceValue, TOTAL_SQUARES)
    setPositions((prev) => {
      const p = [...prev]
      p[currentPlayerIndex] = newPos
      return p
    })
    if (newPos >= TOTAL_SQUARES) setWinner(currentPlayerIndex)
    const question = getRandomUnusedQuestion()
    setResultForPlayer(currentPlayer)
    setResult(question ?? '')
    setCategory(question ? 'Dice' : null)
    setModalOpen(true)
    setCurrentPlayerIndex((i) => (i + 1) % players.length)
  }

  if (!gameStarted && !showSetup && !roomId) {
    if (playWithOthers && (roomChoice === 'choice' || roomChoice === null)) {
      return (
        <div className="game title-page">
          <div className="title-page-bg" aria-hidden>
            <span className="title-page-orb title-page-orb-1" />
            <span className="title-page-orb title-page-orb-2" />
          </div>
          <h1 className="dare-title" data-text="Do you Dare??">
            Do you Dare??
          </h1>
          <p className="tagline">Question · Truth · Dare</p>
          <p className="subtitle">Play with others using a game code</p>
          <div className="setup-actions play-mode-actions" style={{ flexDirection: 'column', gap: '1rem' }}>
            <button type="button" className="btn btn-play" onClick={() => setRoomChoice('create')}>
              Create game
            </button>
            <button type="button" className="btn btn-play btn-play-secondary" onClick={() => setRoomChoice('join')}>
              Join game
            </button>
            <button type="button" className="btn btn-cancel" onClick={() => { setPlayWithOthers(false); setRoomChoice(null); }}>
              Back
            </button>
          </div>
        </div>
      )
    }
    if (playWithOthers && roomChoice === 'create') {
      return (
        <div className="game">
          <h1>Create game</h1>
          <p className="subtitle">Enter your name. You&apos;ll get a game code to share.</p>
          <form className="setup-form" onSubmit={handleCreateRoom}>
            <label className="setup-label">
              Your name
              <input
                type="text"
                value={createName}
                onChange={(e) => setCreateName(e.target.value)}
                placeholder="Host"
                className="setup-input"
              />
            </label>
            {roomError && <p className="room-error" role="alert">{roomError}</p>}
            <div className="setup-actions">
              <button type="submit" className="btn btn-play" disabled={roomLoading}>
                {roomLoading ? 'Creating…' : 'Create game'}
              </button>
              <button type="button" className="btn btn-cancel" onClick={() => { setRoomChoice(null); setRoomError(''); }}>
                Back
              </button>
            </div>
          </form>
        </div>
      )
    }
    if (playWithOthers && roomChoice === 'join') {
      return (
        <div className="game">
          <h1>Join game</h1>
          <p className="subtitle">Enter the game code and your name.</p>
          <form className="setup-form" onSubmit={handleJoinRoom}>
            <label className="setup-label">
              Game code
              <input
                type="text"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                placeholder="e.g. ABC123"
                className="setup-input"
                maxLength={6}
              />
            </label>
            <label className="setup-label">
              Your name
              <input
                type="text"
                value={joinName}
                onChange={(e) => setJoinName(e.target.value)}
                placeholder="Your name"
                className="setup-input"
              />
            </label>
            {roomError && <p className="room-error" role="alert">{roomError}</p>}
            <div className="setup-actions">
              <button type="submit" className="btn btn-play" disabled={roomLoading}>
                {roomLoading ? 'Joining…' : 'Join'}
              </button>
              <button type="button" className="btn btn-cancel" onClick={() => { setRoomChoice(null); setRoomError(''); }}>
                Back
              </button>
            </div>
          </form>
        </div>
      )
    }
    if (!playWithOthers) {
      return (
        <div className="game title-page">
          <div className="title-page-bg" aria-hidden>
            <span className="title-page-orb title-page-orb-1" />
            <span className="title-page-orb title-page-orb-2" />
          </div>
          <h1 className="dare-title" data-text="Do you Dare??">
            Do you Dare??
          </h1>
          <p className="tagline">Question · Truth · Dare</p>
          <p className="subtitle">Choose how to play</p>
          <div className="setup-actions play-mode-actions" style={{ flexDirection: 'column', gap: '1rem' }}>
            <button type="button" className="btn btn-play" onClick={() => setShowSetup(true)}>
              Play locally
            </button>
            <button type="button" className="btn btn-play btn-play-secondary" onClick={() => { setPlayWithOthers(true); setRoomChoice('choice'); }}>
              Play with others
            </button>
          </div>
        </div>
      )
    }
  }

  if (roomId && !gameStarted) {
    return (
      <div className="game">
        <h1>{isHost ? 'Your game' : "You're in"}</h1>
        {isHost ? (
          <>
            <p className="subtitle">Share this game code with friends</p>
            <p className="room-code-display" aria-live="polite">{roomGameCode}</p>
            <p className="room-players-label">Players ({roomPlayers.length})</p>
            <ul className="room-players-list">
              {roomPlayers.map((name, i) => (
                <li key={i}>{name}</li>
              ))}
            </ul>
            <div className="setup-actions">
              <button type="button" className="btn btn-play" disabled={roomPlayers.length < 2} onClick={handleStartRoomGame}>
                Start game
              </button>
              <button type="button" className="btn btn-cancel" onClick={exitRoom}>
                Cancel
              </button>
            </div>
          </>
        ) : (
          <>
            <p className="subtitle">Waiting for the host to start the game…</p>
            <p className="room-players-label">Players ({roomPlayers.length})</p>
            <ul className="room-players-list">
              {roomPlayers.map((name, i) => (
                <li key={i}>{name}</li>
              ))}
            </ul>
            <button type="button" className="btn btn-cancel" onClick={exitRoom}>
              Leave
            </button>
          </>
        )}
      </div>
    )
  }

  if (showSetup) {
    return (
      <div className="game">
        <h1>Question · Truth · Dare</h1>
        <p className="subtitle">
          {playWithOthers
            ? "Add everyone's names — pass the device when it's their turn."
            : 'Set up your game'}
        </p>
        <form className="setup-form" onSubmit={handleStartGame}>
          <label className="setup-label">
            Number of players
            <input
              type="number"
              min={2}
              max={20}
              value={numPlayers}
              onChange={(e) => handleNumPlayersChange(e.target.value)}
              className="setup-input"
            />
          </label>
          <div className="setup-names">
            {playerNames.map((name, i) => (
              <input
                key={i}
                type="text"
                value={name}
                onChange={(e) => handleNameChange(i, e.target.value)}
                placeholder={`Player ${i + 1}`}
                className="setup-input"
              />
            ))}
          </div>
          <div className="setup-actions">
            <button type="submit" className="btn btn-play">
              Start game
            </button>
            <button type="button" className="btn btn-cancel" onClick={() => { setShowSetup(false); setPlayWithOthers(false); }}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    )
  }

  const boardPositions = positions.length === players.length ? positions : players.map(() => 1)

  return (
    <div className="game-with-chat">
      <div className="game-area">
        <div className="game">
          <h1>Question · Truth · Dare</h1>
          <p className="subtitle">Roll to move — first to reach END wins. When you land, you get a challenge.</p>

          <GameBoard positions={boardPositions} playerNames={players} winner={winner} />

          {winner == null && (
            <p className="turn">
              It&apos;s <strong>{currentPlayer}</strong>&apos;s turn!
            </p>
          )}

          {winner == null && <Dice onRollComplete={handleDiceComplete} />}

          <ResultModal
            isOpen={modalOpen}
            onClose={() => setModalOpen(false)}
            category={category}
            forPlayer={resultForPlayer}
            text={result}
            onReroll={() => {
              const question = getRandomUnusedQuestion()
              setResult(question ?? '')
              setCategory(question ? 'Dice' : null)
            }}
          />

          {result === null && winner == null && (
            <p className="hint">Click the dice to move your piece. You&apos;ll get a random challenge when you land.</p>
          )}
          {result !== null && !modalOpen && (
            <button type="button" className="btn btn-cancel" onClick={() => setModalOpen(true)} style={{ marginTop: '1rem' }}>
              Show last challenge
            </button>
          )}

          <div className="setup-actions" style={{ marginTop: '1rem' }}>
            <button type="button" className="btn btn-new-game" onClick={handleNewGame}>
              {winner != null ? 'Play again' : 'New game'}
            </button>
            <button type="button" className="btn btn-cancel" onClick={() => { setPlayers([]); setShowSetup(false); setPositions([]); setWinner(null); }}>
              Change players
            </button>
          </div>
        </div>
      </div>
      <div className="chat-sidebar">
        <div className="chat-sidebar-title">💬 Chat</div>
        <LocalChatBox
          messages={chatMessages}
          senderName="You"
          onSend={handleChatSend}
        />
      </div>
    </div>
  )
}
