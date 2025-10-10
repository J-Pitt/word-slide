-- Migration: Add game_completions table for permanent leaderboard
-- This table stores COMPLETED GAMES (all 20 levels beaten)
-- Separate from game_stats which tracks ongoing/current progress

-- Connect to wordslide_game database
\c wordslide_game;

-- Create game_completions table
CREATE TABLE IF NOT EXISTS game_completions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    username VARCHAR(50) NOT NULL,
    game_mode VARCHAR(20) NOT NULL DEFAULT 'original',
    total_words INTEGER NOT NULL,
    total_moves INTEGER NOT NULL,
    average_moves_per_level NUMERIC(10, 2) NOT NULL,
    levels_completed INTEGER NOT NULL DEFAULT 20,
    completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Ensure users can have multiple completions (they can beat the game many times)
    -- No unique constraint - allow multiple completions per user
    
    CONSTRAINT valid_words CHECK (total_words >= 0),
    CONSTRAINT valid_moves CHECK (total_moves >= 0),
    CONSTRAINT valid_levels CHECK (levels_completed > 0)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_completions_user_id ON game_completions(user_id);
CREATE INDEX IF NOT EXISTS idx_completions_game_mode ON game_completions(game_mode);
CREATE INDEX IF NOT EXISTS idx_completions_leaderboard ON game_completions(game_mode, total_words DESC, total_moves ASC);
CREATE INDEX IF NOT EXISTS idx_completions_user_history ON game_completions(user_id, completed_at DESC);

-- Grant permissions
GRANT ALL PRIVILEGES ON TABLE game_completions TO postgres;
GRANT USAGE, SELECT ON SEQUENCE game_completions_id_seq TO postgres;

-- Verify table was created
\d game_completions

-- Success message
SELECT 'game_completions table created successfully!' as status;

COMMENT ON TABLE game_completions IS 'Permanent record of completed games (all 20 levels). Users stats stay here forever for leaderboard.';
COMMENT ON COLUMN game_completions.total_words IS 'Total words solved across all 20 levels';
COMMENT ON COLUMN game_completions.total_moves IS 'Total moves used across all 20 levels';
COMMENT ON COLUMN game_completions.average_moves_per_level IS 'Average moves per level (lower is better)';
COMMENT ON COLUMN game_completions.levels_completed IS 'Number of levels completed (should be 20 for full game)';

