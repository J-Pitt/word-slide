import React, { useState, useRef, useEffect } from 'react'

/**
 * Local-only chat (no API). Messages are stored in parent state.
 * @param {{ messages: Array<{ playerName: string, text: string, ts: number, image?: string }>, senderName?: string, onSend: (text: string, image?: string) => void, className?: string }} props
 */
export default function LocalChatBox({ messages = [], senderName = 'You', onSend, className = '' }) {
  const [chatInput, setChatInput] = useState('')
  const [chatImage, setChatImage] = useState(null)
  const chatEndRef = useRef(null)
  const fileInputRef = useRef(null)

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length])

  function handleSend(e) {
    e.preventDefault()
    const text = chatInput.trim()
    if (!text && !chatImage) return
    if (typeof onSend === 'function') {
      onSend(text || '', chatImage || undefined)
      setChatInput('')
      setChatImage(null)
    }
  }

  function handleFileSelect(e) {
    const file = e.target.files?.[0]
    if (!file) return
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      const MAX_SIZE = 200
      let width = img.width
      let height = img.height
      if (width > height && width > MAX_SIZE) {
        height = (height * MAX_SIZE) / width
        width = MAX_SIZE
      } else if (height > MAX_SIZE) {
        width = (width * MAX_SIZE) / height
        height = MAX_SIZE
      }
      canvas.width = width
      canvas.height = height
      ctx.drawImage(img, 0, 0, width, height)
      const compressed = canvas.toDataURL('image/jpeg', 0.3)
      if (compressed.length > 100000) {
        alert('Image too large. Try a smaller image.')
        return
      }
      setChatImage(compressed)
    }
    const reader = new FileReader()
    reader.onload = () => { img.src = reader.result }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  return (
    <div className={`local-chat-box ${className}`}>
      <div className="chat-messages">
        {messages.length === 0 && <p className="chat-empty">No messages yet</p>}
        {messages.map((m, i) => (
          <div key={i} className="chat-msg">
            <span className="chat-name">{m.playerName}:</span>{' '}
            {m.text && <span>{m.text}</span>}
            {m.image && (
              <img
                src={m.image}
                alt="shared"
                className="chat-image"
                onClick={() => window.open(m.image, '_blank')}
              />
            )}
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>
      {chatImage && (
        <div className="chat-image-preview">
          <img src={chatImage} alt="preview" />
          <button type="button" className="chat-image-remove" onClick={() => setChatImage(null)}>✕</button>
        </div>
      )}
      <form className="chat-form" onSubmit={handleSend}>
        <button
          type="button"
          className="btn-chat-attach"
          onClick={() => fileInputRef.current?.click()}
          title="Attach image"
        >
          📷
        </button>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          accept="image/*"
          style={{ display: 'none' }}
        />
        <input
          type="text"
          value={chatInput}
          onChange={(e) => setChatInput(e.target.value)}
          placeholder="Type a message…"
          className="chat-input"
          maxLength={500}
        />
        <button type="submit" className="btn btn-chat-send">Send</button>
      </form>
    </div>
  )
}
