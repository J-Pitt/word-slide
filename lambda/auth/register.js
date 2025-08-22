const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Client } = require('pg');

// Database connection configuration
const dbConfig = {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: { rejectUnauthorized: false } // Force SSL for RDS
};

exports.handler = async (event) => {
  // Enable CORS
  const headers = {
    'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGIN || '*',
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

    // Validate input
    if (!username || !password) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Username and password are required' })
      };
    }

    if (password.length < 6) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Password must be at least 6 characters' })
      };
    }

    // Connect to database
    const client = new Client(dbConfig);
    await client.connect();

    try {
      // Check if user already exists
      const userExists = await client.query(
        'SELECT id FROM users WHERE username = $1',
        [username]
      );

      if (userExists.rows.length > 0) {
        await client.end();
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Username already exists' })
        };
      }

      // Hash password
      const saltRounds = 10;
      const passwordHash = await bcrypt.hash(password, saltRounds);

      // Create user
      const newUser = await client.query(
        'INSERT INTO users (username, password_hash) VALUES ($1, $2) RETURNING id, username',
        [username, passwordHash]
      );

      // Create initial game stats
      await client.query(
        'INSERT INTO game_stats (user_id, game_mode) VALUES ($1, $2), ($1, $3)',
        [newUser.rows[0].id, 'original', 'tetris']
      );

      // Generate JWT token
      const token = jwt.sign(
        { userId: newUser.rows[0].id, username: newUser.rows[0].username },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      await client.end();

      return {
        statusCode: 201,
        headers,
        body: JSON.stringify({
          message: 'User created successfully',
          user: {
            id: newUser.rows[0].id,
            username: newUser.rows[0].username
          },
          token
        })
      };
    } catch (dbError) {
      await client.end();
      throw dbError;
    }
  } catch (error) {
    console.error('Registration error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};
