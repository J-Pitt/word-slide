import React from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import App from './App.jsx'
import TruthOrDarePage from './pages/truthordare/TruthOrDarePage'
import TriviaPage from './pages/trivia/TriviaPage'

export function AppRouter() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<App />} />
          <Route path="/truthordare" element={<TruthOrDarePage />} />
          <Route path="/trivia" element={<TriviaPage />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
