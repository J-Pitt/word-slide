const { Client } = require('pg');

/**
 * Lambda function to save game completion to permanent leaderboard
 * This is called when a user beats all 20 levels
 */
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
        
        // Handle OPTIONS request
        if (event.httpMethod === 'OPTIONS' || event.requestContext?.http?.method === 'OPTIONS') {
            return {
                statusCode: 200,
                headers: {
                    'Access-Control-Allow-Origin': corsOrigin,
                    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
                    'Access-Control-Allow-Methods': 'POST, OPTIONS'
                },
                body: ''
            };
        }
        
        // Parse request body
        const body = JSON.parse(event.body);
        const { userId, gameMode, totalWords, totalMoves, levelsCompleted } = body;
        
        // Validate required fields
        if (!userId || !gameMode || totalWords === undefined || totalMoves === undefined || levelsCompleted === undefined) {
            return {
                statusCode: 400,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': corsOrigin,
                    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
                    'Access-Control-Allow-Methods': 'POST, OPTIONS'
                },
                body: JSON.stringify({
                    success: false,
                    error: 'Missing required fields: userId, gameMode, totalWords, totalMoves, levelsCompleted'
                })
            };
        }
        
        // Get user info
        const userQuery = 'SELECT username FROM users WHERE id = $1';
        const userResult = await client.query(userQuery, [userId]);
        
        if (userResult.rows.length === 0) {
            return {
                statusCode: 404,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': corsOrigin,
                    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
                    'Access-Control-Allow-Methods': 'POST, OPTIONS'
                },
                body: JSON.stringify({
                    success: false,
                    error: 'User not found'
                })
            };
        }
        
        const username = userResult.rows[0].username;
        
        // Save completion to permanent leaderboard
        const insertQuery = `
            INSERT INTO game_completions (
                user_id,
                username,
                game_mode,
                total_words,
                total_moves,
                average_moves_per_level,
                levels_completed,
                completed_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
            RETURNING id, completed_at
        `;
        
        const avgMovesPerLevel = levelsCompleted > 0 
            ? Math.round((totalMoves / levelsCompleted) * 10) / 10 
            : 0;
        
        const insertResult = await client.query(insertQuery, [
            userId,
            username,
            gameMode,
            totalWords,
            totalMoves,
            avgMovesPerLevel,
            levelsCompleted
        ]);
        
        const completionId = insertResult.rows[0].id;
        const completedAt = insertResult.rows[0].completed_at;
        
        // Reset user's current game stats (they can play again)
        const resetQuery = `
            UPDATE game_stats 
            SET words_solved = 0,
                total_moves = 0,
                games_played = games_played + 1,
                last_played = NOW()
            WHERE user_id = $1 AND game_mode = $2
        `;
        
        await client.query(resetQuery, [userId, gameMode]);
        
        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': corsOrigin,
                'Access-Control-Allow-Headers': 'Content-Type,Authorization',
                'Access-Control-Allow-Methods': 'POST, OPTIONS'
            },
            body: JSON.stringify({
                success: true,
                message: 'Game completion saved to leaderboard!',
                completion: {
                    id: completionId,
                    username,
                    gameMode,
                    totalWords,
                    totalMoves,
                    averageMovesPerLevel: avgMovesPerLevel,
                    levelsCompleted,
                    completedAt
                }
            })
        };
        
    } catch (error) {
        console.error('Database error:', error);
        
        return {
            statusCode: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': corsOrigin || 'https://word-slide.com',
                'Access-Control-Allow-Headers': 'Content-Type,Authorization',
                'Access-Control-Allow-Methods': 'POST, OPTIONS'
            },
            body: JSON.stringify({
                success: false,
                error: 'Failed to save game completion',
                details: error.message
            })
        };
    } finally {
        await client.end();
    }
};

