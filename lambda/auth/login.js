const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Client } = require('pg');

// Database connection configuration
const dbConfig = {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: 'wordslide_game',
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: { rejectUnauthorized: false } // Force SSL for RDS
};

exports.handler = async (event) => {
  // Enable CORS
  const allowedOrigins = ['https://word-slide.com', 'http://localhost:3000', 'http://localhost:5173'];
  const origin = event.headers?.origin || event.headers?.Origin;
  const corsOrigin = allowedOrigins.includes(origin) ? origin : 'https://word-slide.com';
  
  const headers = {
    'Access-Control-Allow-Origin': corsOrigin,
    'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
    'Access-Control-Allow-Methods': 'POST,OPTIONS',
    'Content-Type': 'application/json'
  };

  // Handle preflight OPTIONS request
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ message: 'OK' })
    };
  }

  try {
    const { username, password } = JSON.parse(event.body);

    if (!username || !password) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Username and password are required' })
      };
    }

    // Connect to database
    const client = new Client(dbConfig);
    await client.connect();

    try {
      // Find user by username only
      const user = await client.query(
        'SELECT id, username, password_hash FROM users WHERE username = $1',
        [username]
      );

      if (user.rows.length === 0) {
        await client.end();
        return {
          statusCode: 401,
          headers,
          body: JSON.stringify({ error: 'Invalid credentials' })
        };
      }

      // Check password
      const validPassword = await bcrypt.compare(password, user.rows[0].password_hash);
      if (!validPassword) {
        await client.end();
        return {
          statusCode: 401,
          headers,
          body: JSON.stringify({ error: 'Invalid credentials' })
        };
      }

      // Generate JWT token
      const token = jwt.sign(
        { userId: user.rows[0].id, username: user.rows[0].username },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      await client.end();

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          message: 'Login successful',
          user: {
            id: user.rows[0].id,
            username: user.rows[0].username
          },
          token
        })
      };
    } catch (dbError) {
      await client.end();
      throw dbError;
    }
  } catch (error) {
    console.error('Login error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};
