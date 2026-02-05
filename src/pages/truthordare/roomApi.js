/**
 * Truth or Dare room API (game code create / join / get / update).
 * Uses VITE_TRUTHORDARE_ROOM_API_BASE if set, else same base as rest of app.
 * Auth: pass { token, apiKey } so we send Authorization: Bearer and/or x-api-key
 * (fixes "Missing authentication token" when API Gateway requires key or Bearer).
 */

function getApiBase() {
  const envBase = typeof import.meta !== 'undefined' && import.meta.env?.VITE_TRUTHORDARE_ROOM_API_BASE
  if (envBase && String(envBase).trim()) return String(envBase).replace(/\/$/, '')
  const isLocalhost = typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
  return isLocalhost ? '/api' : (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_BASE) || 'https://63jgwqvqyf.execute-api.us-east-1.amazonaws.com/dev'
}

const ROOM_PATH = '/truthordare/room'

/** Build headers for room requests. auth: { token?, apiKey? } */
function roomHeaders(auth = {}) {
  const headers = { 'Content-Type': 'application/json' }
  if (auth?.apiKey) headers['x-api-key'] = auth.apiKey
  if (auth?.token) headers['Authorization'] = `Bearer ${auth.token}`
  return headers
}

async function parseResponse(res, fallbackError) {
  const text = await res.text()
  let data
  try {
    data = text ? JSON.parse(text) : {}
  } catch (_) {
    data = {}
  }
  if (!res.ok) {
    const msg = data.error || data.message || res.statusText || fallbackError
    const hint = res.status === 404 ? ' (Is the room API deployed and routed at /truthordare/room?)' : ''
    throw new Error(msg + hint)
  }
  return data
}

/** Call fetch; on network error throw with a clear message. */
async function fetchRoom(url, options) {
  try {
    return await fetch(url, options)
  } catch (err) {
    const msg = err.message || 'Network error'
    throw new Error(msg.includes('fetch') ? 'Network error. Check the room API URL and CORS.' : msg)
  }
}

export async function createRoom(hostName = 'Host', auth = {}) {
  const BASE = getApiBase()
  const res = await fetchRoom(`${BASE}${ROOM_PATH}`, {
    method: 'POST',
    headers: roomHeaders(auth),
    body: JSON.stringify({ hostName: (hostName || 'Host').trim() || 'Host' })
  })
  const data = await parseResponse(res, 'Failed to create room')
  return data
}

export async function joinRoom(gameCode, playerName, auth = {}) {
  const BASE = getApiBase()
  const res = await fetchRoom(`${BASE}${ROOM_PATH}/join`, {
    method: 'POST',
    headers: roomHeaders(auth),
    body: JSON.stringify({
      gameCode: String(gameCode || '').trim().toUpperCase(),
      playerName: (playerName || 'Player').trim() || 'Player'
    })
  })
  const data = await parseResponse(res, 'Failed to join room')
  return data
}

export async function getRoom(roomId, auth = {}) {
  const BASE = getApiBase()
  const res = await fetchRoom(`${BASE}${ROOM_PATH}?roomId=${encodeURIComponent(roomId)}`, {
    method: 'GET',
    headers: roomHeaders(auth)
  })
  const data = await parseResponse(res, 'Failed to get room')
  return data
}

export async function updateRoomState(roomId, state, auth = {}) {
  const BASE = getApiBase()
  const res = await fetchRoom(`${BASE}${ROOM_PATH}`, {
    method: 'POST',
    headers: roomHeaders(auth),
    body: JSON.stringify({ roomId, state })
  })
  const data = await parseResponse(res, 'Failed to update room')
  return data
}
