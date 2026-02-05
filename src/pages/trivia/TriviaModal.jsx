import React, { useState, useEffect } from 'react'

export default function TriviaModal({ isOpen, question, diceValue, playerName, onAnswer }) {
  const [selectedAnswer, setSelectedAnswer] = useState(null)
  const [showResult, setShowResult] = useState(false)

  useEffect(() => {
    if (isOpen && question) {
      setSelectedAnswer(null)
      setShowResult(false)
    }
  }, [isOpen, question?.question])

  if (!isOpen || !question) return null

  function handleSelectAnswer(index) {
    if (showResult) return
    setSelectedAnswer(index)
    setShowResult(true)
  }

  function handleContinue() {
    if (selectedAnswer !== null) {
      onAnswer(selectedAnswer)
    }
  }

  const isCorrect = selectedAnswer === question.correctIndex
  const correctAnswer = question.answers[question.correctIndex]

  return (
    <div className="trivia-modal-backdrop">
      <div className={`trivia-modal ${showResult ? (isCorrect ? 'result-correct' : 'result-wrong') : ''}`}>
        <div className="trivia-modal-header">
          <span className="trivia-modal-icon">
            {showResult ? (isCorrect ? '✅' : '❌') : '🧠'}
          </span>
          <span className="trivia-modal-label">
            {showResult
              ? (isCorrect ? 'Correct!' : 'Wrong!')
              : `${playerName} rolled a ${diceValue}!`}
          </span>
        </div>
        <p className="trivia-modal-question">{question.question}</p>
        <div className="trivia-modal-answers">
          {question.answers.map((answer, i) => {
            let btnClass = 'trivia-answer-btn'
            if (showResult) {
              if (i === question.correctIndex) {
                btnClass += ' correct'
              } else if (i === selectedAnswer) {
                btnClass += ' wrong'
              }
            }
            return (
              <button
                key={i}
                className={btnClass}
                onClick={() => handleSelectAnswer(i)}
                disabled={showResult}
              >
                <span className="answer-letter">{String.fromCharCode(65 + i)}</span>
                <span className="answer-text">{answer}</span>
              </button>
            )
          })}
        </div>
        {!showResult && (
          <p className="trivia-modal-hint">Answer correctly to move {diceValue} space{diceValue > 1 ? 's' : ''}!</p>
        )}
        {showResult && (
          <div className="trivia-result-feedback">
            {isCorrect ? (
              <p className="feedback-text correct">🎉 You move forward {diceValue} space{diceValue > 1 ? 's' : ''}!</p>
            ) : (
              <p className="feedback-text wrong">The correct answer was: <strong>{correctAnswer}</strong></p>
            )}
            <button className="btn btn-play" onClick={handleContinue}>
              Continue
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
