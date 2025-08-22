-- WordSlide Game Database Setup Script
-- Run this script in your PostgreSQL database

-- Create the database (run this as a superuser)
-- CREATE DATABASE wordslide_game;

-- Connect to the wordslide_game database and run the following:

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create game_stats table
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
);

-- Create game_sessions table for detailed tracking
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
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_game_stats_user_id ON game_stats(user_id);
CREATE INDEX IF NOT EXISTS idx_game_stats_game_mode ON game_stats(game_mode);
CREATE INDEX IF NOT EXISTS idx_game_sessions_user_id ON game_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_game_sessions_game_mode ON game_sessions(game_mode);

-- Insert some sample data for testing (optional)
-- INSERT INTO users (username, password_hash) VALUES 
-- ('demo_user', '$2a$10$demo_hash_placeholder');

-- INSERT INTO game_stats (user_id, game_mode, words_solved, total_moves, games_played, best_score) VALUES 
-- (1, 'original', 15, 120, 5, 300),
-- (1, 'tetris', 8, 85, 3, 250);

-- Grant permissions (adjust as needed for your setup)
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO your_app_user;
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO your_app_user;
