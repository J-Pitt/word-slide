const { Client } = require('pg');

const ALLOWED_ORIGINS = ['https://word-slide.com', 'http://localhost:3000', 'http://localhost:5173'];

function corsHeaders(origin) {
  const corsOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : 'https://word-slide.com';
  return {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': corsOrigin,
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
  };
}

function jsonResponse(statusCode, body, origin) {
  return {
    statusCode,
    headers: corsHeaders(origin),
    body: JSON.stringify(body)
  };
}

function randomGameCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) code += chars.charAt(Math.floor(Math.random() * chars.length));
  return code;
}

exports.handler = async (event) => {
  const origin = event.headers?.origin || event.headers?.Origin || '';
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: corsHeaders(origin), body: '' };
  }

  const path = (event.path || '').replace(/^\/[^/]+/, ''); // strip stage prefix e.g. /dev
  const isJoin = path.includes('join');
  const query = event.queryStringParameters || {};
  let body = {};
  try {
    if (event.body) body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
  } catch (_) {
    return jsonResponse(400, { success: false, error: 'Invalid JSON body' }, origin);
  }

  const client = new Client({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();

    // POST .../join -> join room with gameCode + playerName
    if (event.httpMethod === 'POST' && isJoin) {
      const { gameCode, playerName } = body;
      if (!gameCode || !playerName || !String(playerName).trim()) {
        return jsonResponse(400, { success: false, error: 'gameCode and playerName required' }, origin);
      }
      const code = String(gameCode).trim().toUpperCase();
      const res = await client.query(
        'SELECT room_id, players, state FROM truthordare_rooms WHERE game_code = $1',
        [code]
      );
      if (res.rows.length === 0) {
        return jsonResponse(404, { success: false, error: 'Game code not found' }, origin);
      }
      const row = res.rows[0];
      const players = Array.isArray(row.players) ? row.players : (row.players ? JSON.parse(JSON.stringify(row.players)) : []);
      const name = String(playerName).trim() || 'Player';
      if (players.includes(name)) {
        return jsonResponse(200, {
          success: true,
          roomId: row.room_id,
          players,
          state: row.state || null
        }, origin);
      }
      players.push(name);
      await client.query(
        'UPDATE truthordare_rooms SET players = $1, updated_at = NOW() WHERE room_id = $2',
        [JSON.stringify(players), row.room_id]
      );
      return jsonResponse(200, {
        success: true,
        roomId: row.room_id,
        players,
        state: row.state || null
      }, origin);
    }

    // GET .../room?roomId=... -> get room state
    if (event.httpMethod === 'GET') {
      const roomId = query.roomId || body.roomId;
      if (!roomId) {
        return jsonResponse(400, { success: false, error: 'roomId required' }, origin);
      }
      const res = await client.query(
        'SELECT room_id, game_code, players, state, updated_at FROM truthordare_rooms WHERE room_id = $1',
        [roomId]
      );
      if (res.rows.length === 0) {
        return jsonResponse(404, { success: false, error: 'Room not found' }, origin);
      }
      const row = res.rows[0];
      return jsonResponse(200, {
        success: true,
        roomId: row.room_id,
        gameCode: row.game_code,
        players: row.players || [],
        state: row.state || null,
        updatedAt: row.updated_at
      }, origin);
    }

    // POST .../room with roomId + state -> update state (host sync)
    if (event.httpMethod === 'POST' && body.roomId && body.state !== undefined) {
      const { roomId, state } = body;
      await client.query(
        'UPDATE truthordare_rooms SET state = $1, updated_at = NOW() WHERE room_id = $2',
        [JSON.stringify(state), roomId]
      );
      const res = await client.query('SELECT room_id FROM truthordare_rooms WHERE room_id = $1', [roomId]);
      if (res.rows.length === 0) {
        return jsonResponse(404, { success: false, error: 'Room not found' }, origin);
      }
      return jsonResponse(200, { success: true, roomId }, origin);
    }

    // POST .../room (no roomId) -> create room
    if (event.httpMethod === 'POST') {
      const hostName = (body.hostName && String(body.hostName).trim()) ? String(body.hostName).trim() : 'Host';
      let code;
      let exists = true;
      for (let attempt = 0; attempt < 10 && exists; attempt++) {
        code = randomGameCode();
        const r = await client.query('SELECT 1 FROM truthordare_rooms WHERE game_code = $1', [code]);
        exists = r.rows.length > 0;
      }
      if (exists) {
        return jsonResponse(500, { success: false, error: 'Could not generate unique code' }, origin);
      }
      const res = await client.query(
        `INSERT INTO truthordare_rooms (game_code, host_name, players) VALUES ($1, $2, $3)
         RETURNING room_id, game_code`,
        [code, hostName, JSON.stringify([hostName])]
      );
      const row = res.rows[0];
      return jsonResponse(200, {
        success: true,
        roomId: row.room_id,
        gameCode: row.game_code,
        players: [hostName]
      }, origin);
    }

    return jsonResponse(405, { success: false, error: 'Method not allowed' }, origin);
  } catch (err) {
    console.error('Truth or Dare room error:', err);
    return jsonResponse(500, {
      success: false,
      error: 'Server error',
      details: err.message
    }, origin);
  } finally {
    await client.end();
  }
};
