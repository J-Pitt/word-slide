const { Client } = require('pg');

exports.handler = async (event) => {
    const client = new Client({
        host: 'dev-wordslide-db.cszqcws8wjsi.us-east-1.rds.amazonaws.com',
        port: 5432,
        database: 'postgres',
        user: 'postgres',
        password: 'WordSlide2024',
        ssl: {
            rejectUnauthorized: false
        }
    });

    try {
        console.log('Connecting to database...');
        await client.connect();
        console.log('Connected successfully!');

        // Create the wordslide_game database
        console.log('Creating wordslide_game database...');
        await client.query('CREATE DATABASE wordslide_game');
        console.log('Database created successfully!');

        // Close connection to postgres database
        await client.end();

        // Connect to the new wordslide_game database
        const gameClient = new Client({
            host: 'dev-wordslide-db.cszqcws8wjsi.us-east-1.rds.amazonaws.com',
            port: 5432,
            database: 'wordslide_game',
            user: 'postgres',
            password: 'WordSlide2024',
            ssl: {
                rejectUnauthorized: false
            }
        });

        await gameClient.connect();
        console.log('Connected to wordslide_game database');

        // Create users table (username-only authentication)
        console.log('Creating users table...');
        await gameClient.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                username VARCHAR(50) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Create game_stats table
        console.log('Creating game_stats table...');
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
        console.log('Creating game_sessions table...');
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
        console.log('Creating indexes...');
        await gameClient.query('CREATE INDEX IF NOT EXISTS idx_users_username ON users(username)');
        await gameClient.query('CREATE INDEX IF NOT EXISTS idx_game_stats_user_id ON game_stats(user_id)');
        await gameClient.query('CREATE INDEX IF NOT EXISTS idx_game_stats_game_mode ON game_stats(game_mode)');
        await gameClient.query('CREATE INDEX IF NOT EXISTS idx_game_sessions_user_id ON game_sessions(user_id)');
        await gameClient.query('CREATE INDEX IF NOT EXISTS idx_game_sessions_game_mode ON game_sessions(game_mode)');

        // Verify tables
        console.log('Verifying tables...');
        const tables = await gameClient.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
        `);

        await gameClient.end();

        console.log('Database initialization completed successfully!');
        console.log('Tables created:', tables.rows.map(row => row.table_name));

        return {
            statusCode: 200,
            body: JSON.stringify({
                message: 'WordSlide database initialized successfully with username-only authentication!',
                tables: tables.rows.map(row => row.table_name),
                schema: 'username-only (no email required)'
            })
        };

    } catch (error) {
        console.error('Error:', error);
        
        if (client) {
            await client.end();
        }

        return {
            statusCode: 500,
            body: JSON.stringify({
                error: 'Database initialization failed',
                message: error.message
            })
        };
    }
};
