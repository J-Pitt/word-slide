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
    
    let gameClient = null;

    try {
        await client.connect();
        
        console.log('Connected to database, starting migration...');
        
        // Create the wordslide_game database if it doesn't exist
        try {
            await client.query('CREATE DATABASE wordslide_game');
            console.log('Database wordslide_game created');
        } catch (error) {
            if (error.code === '42P04') { // Database already exists
                console.log('Database wordslide_game already exists');
            } else {
                throw error;
            }
        }
        
        // Connect to the wordslide_game database
        await client.end();
        const gameClient = new Client({
            host: process.env.DB_HOST,
            port: process.env.DB_PORT,
            database: 'wordslide_game',
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            ssl: { rejectUnauthorized: false }
        });
        await gameClient.connect();
        
        // Create users table
        await gameClient.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                username VARCHAR(50) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        
        // Create game_stats table
        await gameClient.query(`
            CREATE TABLE IF NOT EXISTS game_stats (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                game_mode VARCHAR(20) NOT NULL,
                words_solved INTEGER DEFAULT 0,
                total_moves INTEGER DEFAULT 0,
                games_played INTEGER DEFAULT 0,
                best_score INTEGER DEFAULT 0,
                last_played TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        
        // Create game_sessions table
        await gameClient.query(`
            CREATE TABLE IF NOT EXISTS game_sessions (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                game_mode VARCHAR(20) NOT NULL,
                level INTEGER NOT NULL,
                words_solved INTEGER DEFAULT 0,
                moves_made INTEGER DEFAULT 0,
                completed BOOLEAN DEFAULT false,
                session_duration INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        
        // Create indexes
        await gameClient.query('CREATE INDEX IF NOT EXISTS idx_users_username ON users(username)');
        await gameClient.query('CREATE INDEX IF NOT EXISTS idx_game_stats_user_id ON game_stats(user_id)');
        await gameClient.query('CREATE INDEX IF NOT EXISTS idx_game_stats_game_mode ON game_stats(game_mode)');
        await gameClient.query('CREATE INDEX IF NOT EXISTS idx_game_sessions_user_id ON game_sessions(user_id)');
        await gameClient.query('CREATE INDEX IF NOT EXISTS idx_game_sessions_game_mode ON game_sessions(game_mode)');
        
        console.log('Database schema created successfully');
        
        // Check if the correct schema exists
        const checkSchema = await gameClient.query(`
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns 
            WHERE table_name = 'users'
            ORDER BY ordinal_position
        `);
        
        console.log('Current users table schema:', checkSchema.rows);
        
        // Verify the table structure
        const tableInfo = await gameClient.query(`
            SELECT table_name, column_name, data_type, is_nullable
            FROM information_schema.columns 
            WHERE table_name IN ('users', 'game_stats', 'game_sessions')
            ORDER BY table_name, ordinal_position
        `);
        
        console.log('All tables schema:', tableInfo.rows);
        
        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': 'https://word-slide.com',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
            },
            body: JSON.stringify({
                success: true,
                message: 'Database migration completed successfully',
                schema: tableInfo.rows
            })
        };
        
    } catch (error) {
        console.error('Migration error:', error);
        
        return {
            statusCode: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': 'https://word-slide.com',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
            },
            body: JSON.stringify({
                success: false,
                error: 'Database migration failed',
                details: error.message
            })
        };
    } finally {
        if (gameClient) {
            await gameClient.end();
        }
        if (client) {
            await client.end();
        }
    }
};
