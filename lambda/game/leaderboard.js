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
        
        // Get query parameters
        const gameMode = event.queryStringParameters?.gameMode || 'original';
        const limit = parseInt(event.queryStringParameters?.limit) || 20;
        
        // Fetch leaderboard data using the correct schema
        const query = `
            SELECT 
                u.username,
                COALESCE(gs.words_solved, 0) as words_solved,
                COALESCE(gs.total_moves, 0) as total_moves,
                COALESCE(gs.games_played, 0) as games_played,
                CASE 
                    WHEN gs.words_solved > 0 THEN 
                        ROUND(gs.total_moves::numeric / gs.words_solved, 2)
                    ELSE 0 
                END as avg_moves_per_word
            FROM users u
            LEFT JOIN game_stats gs ON u.id = gs.user_id AND gs.game_mode = $1
            ORDER BY gs.words_solved DESC NULLS LAST, gs.total_moves ASC NULLS LAST
            LIMIT $2
        `;
        
        const result = await client.query(query, [gameMode, limit]);
        
        // Format the response
        const leaderboard = result.rows.map((row, index) => ({
            rank: index + 1,
            username: row.username,
            words_solved: parseInt(row.words_solved) || 0,
            total_moves: parseInt(row.total_moves) || 0,
            games_played: parseInt(row.games_played) || 0,
            avg_moves_per_word: parseFloat(row.avg_moves_per_word) || 0
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
                gameMode: gameMode,
                leaderboard: leaderboard,
                total_players: leaderboard.length
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
                error: 'Failed to fetch leaderboard data',
                details: error.message
            })
        };
    } finally {
        await client.end();
    }
};
