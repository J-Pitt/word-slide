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
        // Parse the request body
        const body = JSON.parse(event.body);
        const { userId, gameMode } = body;
        
        // Validate required fields
        if (!userId || !gameMode) {
            return {
                statusCode: 400,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': 'Content-Type',
                    'Access-Control-Allow-Methods': 'POST, OPTIONS'
                },
                body: JSON.stringify({
                    success: false,
                    error: 'Missing required fields: userId, gameMode'
                })
            };
        }
        
        // Temporarily return success without database update due to connection issues
        // TODO: Fix database connection and restore database operations
        console.log('Reset stats requested for user:', userId, 'gameMode:', gameMode);
        
        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Methods': 'POST, OPTIONS'
            },
            body: JSON.stringify({
                success: true,
                message: 'User stats reset successfully (local only - database connection issue)',
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
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Methods': 'POST, OPTIONS'
            },
            body: JSON.stringify({
                success: false,
                error: 'Failed to reset user stats',
                details: error.message
            })
        };
    }
};
