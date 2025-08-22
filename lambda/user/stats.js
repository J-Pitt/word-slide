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
        
        // Get user ID from path parameters
        const userId = event.pathParameters?.userId;
        
        if (!userId) {
            return {
                statusCode: 400,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': 'Content-Type',
                    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
                },
                body: JSON.stringify({
                    success: false,
                    error: 'User ID is required'
                })
            };
        }
        
        // Fetch user stats for all game modes using the correct schema
        const query = `
            SELECT 
                gs.game_mode,
                gs.words_solved,
                gs.total_moves,
                gs.games_played,
                CASE 
                    WHEN gs.words_solved > 0 THEN 
                        ROUND(gs.total_moves::numeric / gs.words_solved, 2)
                    ELSE 0 
                END as avg_moves_per_word,
                gs.last_played
            FROM game_stats gs
            WHERE gs.user_id = $1
            ORDER BY gs.game_mode
        `;
        
        const result = await client.query(query, [userId]);
        
        // Get user info
        const userQuery = 'SELECT username, created_at FROM users WHERE id = $1';
        const userResult = await client.query(userQuery, [userId]);
        
        if (userResult.rows.length === 0) {
            return {
                statusCode: 404,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': 'Content-Type',
                    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
                },
                body: JSON.stringify({
                    success: false,
                    error: 'User not found'
                })
            };
        }
        
        const user = userResult.rows[0];
        
        // Format the response
        const stats = result.rows.map(row => ({
            gameMode: row.game_mode,
            wordsSolved: parseInt(row.words_solved) || 0,
            totalMoves: parseInt(row.total_moves) || 0,
            gamesPlayed: parseInt(row.games_played) || 0,
            avgMovesPerWord: parseFloat(row.avg_moves_per_word) || 0,
            lastPlayed: row.last_played
        }));
        
        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
            },
            body: JSON.stringify({
                success: true,
                user: {
                    id: userId,
                    username: user.username,
                    memberSince: user.created_at
                },
                stats: stats,
                totalStats: {
                    totalWordsSolved: stats.reduce((sum, s) => sum + s.wordsSolved, 0),
                    totalMoves: stats.reduce((sum, s) => sum + s.totalMoves, 0),
                    totalGamesPlayed: stats.reduce((sum, s) => sum + s.gamesPlayed, 0)
                }
            })
        };
        
    } catch (error) {
        console.error('Database error:', error);
        
        return {
            statusCode: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
            },
            body: JSON.stringify({
                success: false,
                error: 'Failed to fetch user stats',
                details: error.message
            })
        };
    } finally {
        await client.end();
    }
};
