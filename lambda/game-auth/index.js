/**
 * Game auth: password protection for Question · Truth · Dare.
 * - GET status: { configured: true } when GAME_PASSWORD is set
 * - POST login: { password } → set HTTP-only cookie, 24h
 * - GET check: verify cookie, return 200 or 401
 * Password is only in env; never in client bundle.
 */

const crypto = require('crypto');

const COOKIE_NAME = 'game_session';
const MAX_AGE = 86400; // 24 hours
const ALLOWED_ORIGINS = ['https://word-slide.com', 'http://localhost:3000', 'http://localhost:5173'];

function sign(payload, secret) {
  const data = JSON.stringify(payload);
  const sig = crypto.createHmac('sha256', secret).update(data).digest('base64url');
  return Buffer.from(data, 'utf8').toString('base64url') + '.' + sig;
}

function verify(token, secret) {
  if (!token || !secret) return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [dataB64, sig] = parts;
  let data;
  try {
    data = JSON.parse(Buffer.from(dataB64, 'base64url').toString('utf8'));
  } catch (_) {
    return null;
  }
  const expectedSig = crypto.createHmac('sha256', secret).update(JSON.stringify(data)).digest('base64url');
  if (sig !== expectedSig) return null;
  if (data.exp && Date.now() > data.exp) return null;
  return data;
}

function parsePath(event) {
  const raw = event.path || event.requestContext?.http?.path || '';
  const parts = raw.split('/').filter(Boolean);
  if (parts[0] === 'dev' || parts[0] === 'prod' || parts[0] === 'stage') parts.shift();
  return parts;
}

exports.handler = async (event) => {
  const origin = event.headers?.origin || event.headers?.Origin || '';
  const corsOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': corsOrigin,
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Headers': 'Content-Type,Cookie',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  };

  const method = event.requestContext?.http?.method || event.httpMethod || 'GET';
  if (method === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  const pathParts = parsePath(event);
  const secret = process.env.GAME_PASSWORD || '';
  const isConfigured = secret.length > 0;

  // GET game-auth/status
  if (pathParts[0] === 'game-auth' && pathParts[1] === 'status' && method === 'GET') {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ configured: isConfigured }),
    };
  }

  // GET game-auth/check
  if (pathParts[0] === 'game-auth' && pathParts[1] === 'check' && method === 'GET') {
    if (!isConfigured) {
      return { statusCode: 200, headers, body: JSON.stringify({ ok: false }) };
    }
    const cookieHeader = event.headers?.Cookie || event.headers?.cookie || '';
    const match = cookieHeader.match(new RegExp(`${COOKIE_NAME}=([^;]+)`));
    const token = match ? decodeURIComponent(match[1].trim()) : null;
    const payload = verify(token, secret);
    if (payload) {
      return { statusCode: 200, headers, body: JSON.stringify({ ok: true }) };
    }
    return { statusCode: 401, headers, body: JSON.stringify({ ok: false }) };
  }

  // POST game-auth/login
  if (pathParts[0] === 'game-auth' && pathParts[1] === 'login' && method === 'POST') {
    if (!isConfigured) {
      return { statusCode: 503, headers, body: JSON.stringify({ error: 'Game is not configured' }) };
    }
    let body = {};
    try {
      body = event.body ? (typeof event.body === 'string' ? JSON.parse(event.body) : event.body) : {};
    } catch (_) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid JSON' }) };
    }
    const password = body.password;
    if (password !== secret) {
      return { statusCode: 401, headers, body: JSON.stringify({ error: 'Wrong password' }) };
    }
    const payload = { v: 1, exp: Date.now() + MAX_AGE * 1000 };
    const token = sign(payload, secret);
    const isSecure = /^https:/.test(corsOrigin);
    const cookieParts = [
      `${COOKIE_NAME}=${encodeURIComponent(token)}`,
      'HttpOnly',
      'Path=/',
      `Max-Age=${MAX_AGE}`,
      isSecure ? 'Secure' : '',
      corsOrigin.includes('localhost') ? 'SameSite=Lax' : 'SameSite=None',
    ].filter(Boolean);
    const setCookie = cookieParts.join('; ');
    return {
      statusCode: 200,
      headers: { ...headers, 'Set-Cookie': setCookie },
      body: JSON.stringify({ ok: true }),
    };
  }

  return { statusCode: 404, headers, body: JSON.stringify({ error: 'Not found' }) };
};
