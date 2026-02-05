/**
 * Game auth API: server-side password protection (cookie + 24h).
 * Use credentials: 'include' so cookies are sent/received when same-origin or CORS allows.
 * Falls back to client-side password when API is not configured or unavailable.
 */

function getApiBase() {
  if (typeof window === 'undefined') return ''
  const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  return isLocalhost ? '/api' : (import.meta.env?.VITE_API_BASE || 'https://63jgwqvqyf.execute-api.us-east-1.amazonaws.com/dev')
}

const GAME_AUTH_PREFIX = '/game-auth'

export async function getStatus() {
  const base = getApiBase()
  const res = await fetch(`${base}${GAME_AUTH_PREFIX}/status`, { credentials: 'include' })
  const data = await res.json().catch(() => ({}))
  return { configured: !!data.configured }
}

export async function check() {
  const base = getApiBase()
  const res = await fetch(`${base}${GAME_AUTH_PREFIX}/check`, { credentials: 'include' })
  const data = await res.json().catch(() => ({}))
  return { ok: res.ok && !!data.ok }
}

export async function login(password) {
  const base = getApiBase()
  const res = await fetch(`${base}${GAME_AUTH_PREFIX}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ password: String(password ?? '') })
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(data.error || 'Login failed')
  }
  return { ok: true }
}
