import React from 'react'
import { Link } from 'react-router-dom'
import Trivia from './Trivia'
import './trivia.css'

export default function TriviaPage() {
  return (
    <div className="trivia-game-wrapper trivia-game-fullscreen">
      <div className="trivia-game-header">
        <Link to="/" className="btn btn-cancel btn-back">
          ← WordSlide
        </Link>
      </div>
      <div className="trivia-game-body">
        <Trivia />
      </div>
    </div>
  )
}
