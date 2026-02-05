const { Client } = require('pg');

exports.handler = async (event) => {
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
        
        // Enable CORS
        const allowedOrigins = ['https://word-slide.com', 'http://localhost:3000', 'http://localhost:5173'];
        const origin = event.headers?.origin || event.headers?.Origin;
        const corsOrigin = allowedOrigins.includes(origin) ? origin : 'https://word-slide.com';
        
        // Parse the request body
        const body = JSON.parse(event.body);
        const { userId, gameMode, wordsSolved, totalMoves } = body;
        
        // Validate required fields
        if (!userId || !gameMode || wordsSolved === undefined || totalMoves === undefined) {
            return {
                statusCode: 400,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': corsOrigin,
                    'Access-Control-Allow-Headers': 'Content-Type',
                    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
                },
                body: JSON.stringify({
                    success: false,
                    error: 'Missing required fields: userId, gameMode, wordsSolved, totalMoves'
                })
            };
        }
        
        // Check if stats exist for this user and game mode
        const checkQuery = 'SELECT id FROM game_stats WHERE user_id = $1 AND game_mode = $2';
        const checkResult = await client.query(checkQuery, [userId, gameMode]);
        
        if (checkResult.rows.length > 0) {
            // Update existing stats
            const updateQuery = `
                UPDATE game_stats 
                SET words_solved = words_solved + $1,
                    total_moves = total_moves + $2,
                    games_played = games_played + 1,
                    last_played = NOW()
                WHERE user_id = $3 AND game_mode = $4
            `;
            await client.query(updateQuery, [wordsSolved, totalMoves, userId, gameMode]);
        } else {
            // Insert new stats
            const insertQuery = `
                INSERT INTO game_stats (user_id, game_mode, words_solved, total_moves, games_played, created_at)
                VALUES ($1, $2, $3, $4, 1, NOW())
            `;
            await client.query(insertQuery, [userId, gameMode, wordsSolved, totalMoves]);
        }
        
        // Also create a game session record
        const sessionQuery = `
            INSERT INTO game_sessions (user_id, game_mode, level, words_solved, moves_made, completed, created_at)
            VALUES ($1, $2, 1, $3, $4, true, NOW())
        `;
        await client.query(sessionQuery, [userId, gameMode, wordsSolved, totalMoves]);
        
        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': corsOrigin,
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
            },
            body: JSON.stringify({
                success: true,
                message: 'Game stats saved successfully',
                stats: {
                    userId,
                    gameMode,
                    wordsSolved,
                    totalMoves
                }
            })
        };
        
    } catch (error) {
        console.error('Database error:', error);
        
        return {
            statusCode: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': corsOrigin,
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
            },
            body: JSON.stringify({
                success: false,
                error: 'Failed to save game stats',
                details: error.message
            })
        };
    } finally {
        await client.end();
    }
};
