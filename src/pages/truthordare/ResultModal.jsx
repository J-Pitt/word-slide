import React, { useEffect, useRef } from 'react'

export default function ResultModal({ isOpen, onClose, category, forPlayer, text, onReroll }) {
  const modalRef = useRef(null)

  useEffect(() => {
    if (!isOpen) return
    function handleKey(e) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [isOpen, onClose])

  function handleBackdropClick(e) {
    if (e.target === modalRef.current) {
      onClose()
    }
  }

  if (!isOpen || text === null) return null

  const categoryClass = (category || '').toLowerCase().replace(/\s+/g, '-')

  return (
    <div className="result-modal-backdrop" ref={modalRef} onClick={handleBackdropClick}>
      <div className={`result-modal ${categoryClass}`}>
        <button className="result-modal-close" onClick={onClose} aria-label="Close">
          ✕
        </button>
        <div className="result-modal-icon">
          {categoryClass === 'dice' && '🎲'}
          {categoryClass === 'truth' && '💜'}
          {categoryClass === 'dare' && '🔥'}
          {categoryClass === 'question' && '❓'}
          {!['dice', 'truth', 'dare', 'question'].includes(categoryClass) && '✨'}
        </div>
        <span className="result-modal-label">
          {category} for {forPlayer}
        </span>
        {text === '' ? (
          <p className="result-modal-empty">No challenges yet!</p>
        ) : (
          <p className="result-modal-text">{text}</p>
        )}
        <div className="result-modal-actions">
          {onReroll && text !== '' && (
            <button type="button" className="btn btn-cancel result-modal-reroll" onClick={onReroll}>
              Reroll
            </button>
          )}
          <button type="button" className="btn btn-play result-modal-done" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </div>
  )
}
