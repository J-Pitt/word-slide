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
        // Enable CORS
        const allowedOrigins = ['https://word-slide.com', 'http://localhost:3000', 'http://localhost:5173'];
        const origin = event.headers?.origin || event.headers?.Origin;
        const corsOrigin = allowedOrigins.includes(origin) ? origin : 'https://word-slide.com';
        
        // Parse the request body
        const body = JSON.parse(event.body);
        const { userId, gameMode } = body;
        
        // Validate required fields
        if (!userId || !gameMode) {
            return {
                statusCode: 400,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': corsOrigin,
                    'Access-Control-Allow-Headers': 'Content-Type',
                    'Access-Control-Allow-Methods': 'POST, OPTIONS'
                },
                body: JSON.stringify({
                    success: false,
                    error: 'Missing required fields: userId, gameMode'
                })
            };
        }
        
        // Connect to database and reset stats
        await client.connect();
        console.log('Connected to database, resetting stats for user:', userId, 'gameMode:', gameMode);
        
        // Reset game_stats for the specific user and game mode
        const resetStatsQuery = `
            UPDATE game_stats 
            SET words_solved = 0, total_moves = 0, games_played = 0, last_played = NOW()
            WHERE user_id = $1 AND game_mode = $2
        `;
        await client.query(resetStatsQuery, [userId, gameMode]);
        
        // Also delete all game sessions for this user and game mode
        const deleteSessionsQuery = `
            DELETE FROM game_sessions 
            WHERE user_id = $1 AND game_mode = $2
        `;
        await client.query(deleteSessionsQuery, [userId, gameMode]);
        
        console.log('Stats reset successfully for user:', userId, 'gameMode:', gameMode);
        
        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': corsOrigin,
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Methods': 'POST, OPTIONS'
            },
            body: JSON.stringify({
                success: true,
                message: 'User stats reset successfully',
                stats: {
                    userId,
                    gameMode,
                    wordsSolved: 0,
                    totalMoves: 0,
                    gamesPlayed: 0
                }
            })
        };
        
    } catch (error) {
        console.error('Error:', error);
        
        return {
            statusCode: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': corsOrigin,
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Methods': 'POST, OPTIONS'
            },
            body: JSON.stringify({
                success: false,
                error: 'Failed to reset user stats',
                details: error.message
            })
        };
    } finally {
        await client.end();
    }
};
