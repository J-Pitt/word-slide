import React, { useState } from 'react'
import { categories } from './data/questions'
import TriviaBoard from './TriviaBoard'
import Dice from '../truthordare/Dice'
import TriviaModal from './TriviaModal'
import LocalChatBox from '../shared/LocalChatBox'

const TOTAL_SQUARES = 50

export default function Trivia() {
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [showSetup, setShowSetup] = useState(false)
  const [players, setPlayers] = useState([])
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0)
  const [positions, setPositions] = useState([])
  const [winner, setWinner] = useState(null)
  const [currentQuestion, setCurrentQuestion] = useState(null)
  const [pendingMove, setPendingMove] = useState(0)
  const [showQuestion, setShowQuestion] = useState(false)
  const [lastResult, setLastResult] = useState(null)
  const [askedQuestionIndices, setAskedQuestionIndices] = useState([])
  const [numPlayers, setNumPlayers] = useState(2)
  const [playerNames, setPlayerNames] = useState(['', ''])
  const [chatMessages, setChatMessages] = useState([])

  const gameStarted = players.length > 0
  const currentPlayer = players[currentPlayerIndex] ?? null
  const categoryInfo = categories.find((c) => c.id === selectedCategory)

  function handleChatSend(text, image) {
    setChatMessages((prev) => [...prev, { playerName: 'You', text, ts: Date.now(), image }])
  }

  function handleNumPlayersChange(v) {
    const n = Math.max(2, Math.min(10, Number(v) || 2))
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

  function handleStartGame(e) {
    e.preventDefault()
    const names = playerNames.map((n, i) => (n.trim() || `Player ${i + 1}`))
    setPlayers(names)
    setPositions(names.map(() => 1))
    setWinner(null)
    setShowSetup(false)
    setCurrentQuestion(null)
    setLastResult(null)
    setCurrentPlayerIndex(0)
    setAskedQuestionIndices([])
  }

  function handleNewGame() {
    setPositions(players.map(() => 1))
    setWinner(null)
    setCurrentQuestion(null)
    setLastResult(null)
    setCurrentPlayerIndex(0)
    setAskedQuestionIndices([])
  }

  function handleDiceComplete(diceValue) {
    const category = categories.find((c) => c.id === selectedCategory)
    if (!category || category.questions.length === 0) return

    const availableIndices = category.questions
      .map((_, i) => i)
      .filter((i) => !askedQuestionIndices.includes(i))

    let selectedIndex
    let newAskedIndices

    if (availableIndices.length === 0) {
      selectedIndex = Math.floor(Math.random() * category.questions.length)
      newAskedIndices = [selectedIndex]
    } else {
      const randomPick = Math.floor(Math.random() * availableIndices.length)
      selectedIndex = availableIndices[randomPick]
      newAskedIndices = [...askedQuestionIndices, selectedIndex]
    }

    const question = category.questions[selectedIndex]
    setAskedQuestionIndices(newAskedIndices)
    setCurrentQuestion(question)
    setPendingMove(diceValue)
    setShowQuestion(true)
  }

  function handleAnswer(answerIndex) {
    if (!currentQuestion) return

    const isCorrect = answerIndex === currentQuestion.correctIndex

    if (isCorrect) {
      const pos = positions[currentPlayerIndex] ?? 1
      const newPos = Math.min(pos + pendingMove, TOTAL_SQUARES)
      setPositions((prev) => {
        const p = [...prev]
        p[currentPlayerIndex] = newPos
        return p
      })
      if (newPos >= TOTAL_SQUARES) {
        setWinner(currentPlayerIndex)
      }
      setLastResult({ correct: true, moved: pendingMove })
    } else {
      setLastResult({ correct: false, moved: 0 })
    }

    setShowQuestion(false)
    setCurrentQuestion(null)
    setPendingMove(0)
    setCurrentPlayerIndex((i) => (i + 1) % players.length)
  }

  // Category selection screen
  if (!selectedCategory) {
    return (
      <div className="trivia title-page">
        <div className="title-page-bg" aria-hidden>
          <span className="title-page-orb title-page-orb-1" />
          <span className="title-page-orb title-page-orb-2" />
        </div>
        <h1 className="trivia-title" data-text="Trivia Time!">
          Trivia Time!
        </h1>
        <p className="tagline">Test Your Knowledge</p>
        <p className="subtitle">Choose a category</p>
        <div className="category-grid">
          {categories.map((cat) => (
            <button
              key={cat.id}
              className="category-btn"
              onClick={() => setSelectedCategory(cat.id)}
            >
              <span className="category-icon">{cat.icon}</span>
              <span className="category-name">{cat.name}</span>
            </button>
          ))}
        </div>
      </div>
    )
  }

  // Player setup screen (before game started)
  if (!gameStarted && !showSetup) {
    return (
      <div className="trivia title-page">
        <div className="title-page-bg" aria-hidden>
          <span className="title-page-orb title-page-orb-1" />
          <span className="title-page-orb title-page-orb-2" />
        </div>
        <h1 className="trivia-title">
          {categoryInfo?.icon} {categoryInfo?.name}
        </h1>
        <p className="subtitle">Answer correctly to move forward!</p>
        <div className="setup-actions play-mode-actions" style={{ flexDirection: 'column', gap: '1rem' }}>
          <button type="button" className="btn btn-play" onClick={() => setShowSetup(true)}>
            Start Game
          </button>
          <button type="button" className="btn btn-cancel" onClick={() => setSelectedCategory(null)}>
            Change Category
          </button>
        </div>
      </div>
    )
  }

  // Player name entry
  if (showSetup) {
    return (
      <div className="trivia">
        <h1>{categoryInfo?.icon} {categoryInfo?.name} Trivia</h1>
        <p className="subtitle">Set up your game</p>
        <form className="setup-form" onSubmit={handleStartGame}>
          <label className="setup-label">
            Number of players
            <input
              type="number"
              min={2}
              max={10}
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
              Start Game
            </button>
            <button type="button" className="btn btn-cancel" onClick={() => setShowSetup(false)}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    )
  }

  // Game screen (with chat)
  const boardPositions = positions.length === players.length ? positions : players.map(() => 1)

  return (
    <div className="trivia trivia-with-chat">
      <div className="trivia-game-area">
        <div className="trivia" style={{ position: 'relative', maxWidth: '100%' }}>
          <h1>{categoryInfo?.icon} {categoryInfo?.name} Trivia</h1>
          <p className="subtitle">Answer correctly to move forward — first to reach END wins!</p>

          <TriviaBoard positions={boardPositions} playerNames={players} winner={winner} />

          {winner == null && (
            <p className="turn">
              It&apos;s <strong>{currentPlayer}</strong>&apos;s turn!
            </p>
          )}

          {winner == null && <Dice onRollComplete={handleDiceComplete} />}

          <TriviaModal
            isOpen={showQuestion}
            question={currentQuestion}
            diceValue={pendingMove}
            playerName={currentPlayer ?? ''}
            onAnswer={handleAnswer}
          />

          {lastResult && !showQuestion && (
            <div className={`result ${lastResult.correct ? 'correct' : 'incorrect'}`}>
              <span className="result-label">
                {lastResult.correct ? '✓ Correct!' : '✗ Wrong!'}
              </span>
              <p className="result-text">
                {lastResult.correct
                  ? `Moved forward ${lastResult.moved} space${lastResult.moved > 1 ? 's' : ''}!`
                  : 'No movement this turn.'}
              </p>
            </div>
          )}

          {winner == null && !lastResult && !showQuestion && (
            <p className="hint">Roll the dice to get a trivia question. Answer correctly to move!</p>
          )}

          <div className="setup-actions" style={{ marginTop: '1rem' }}>
            <button type="button" className="btn btn-new-game" onClick={handleNewGame}>
              {winner != null ? 'Play Again' : 'New Game'}
            </button>
            <button type="button" className="btn btn-cancel" onClick={() => { setPlayers([]); setShowSetup(false); }}>
              Change Players
            </button>
            <button type="button" className="btn btn-cancel" onClick={() => { setPlayers([]); setSelectedCategory(null); }}>
              Change Category
            </button>
          </div>
        </div>
      </div>
      <div className="trivia-sidebar">
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
