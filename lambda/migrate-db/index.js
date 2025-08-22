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
        
        console.log('Connected to database, starting migration...');
        
        // Check if email column exists
        const checkEmailColumn = await client.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'users' AND column_name = 'email'
        `);
        
        if (checkEmailColumn.rows.length > 0) {
            console.log('Email column exists, removing it...');
            
            // Remove email column and its index
            await client.query('ALTER TABLE users DROP COLUMN IF EXISTS email CASCADE');
            await client.query('DROP INDEX IF EXISTS idx_users_email');
            
            console.log('Email column and index removed successfully');
        } else {
            console.log('Email column does not exist, no migration needed');
        }
        
        // Check if the correct schema exists
        const checkSchema = await client.query(`
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns 
            WHERE table_name = 'users'
            ORDER BY ordinal_position
        `);
        
        console.log('Current users table schema:', checkSchema.rows);
        
        // Verify the table structure
        const tableInfo = await client.query(`
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
                'Access-Control-Allow-Origin': '*',
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
                'Access-Control-Allow-Origin': '*',
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
        await client.end();
    }
};
