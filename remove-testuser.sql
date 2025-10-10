-- Remove testuser from the database
-- This will remove the user and all their associated data

-- First, let's see what data exists for testuser
SELECT 'Before deletion - Users:' as info;
SELECT id, username, email FROM users WHERE username = 'testuser';

SELECT 'Before deletion - User stats:' as info;
SELECT user_id, game_mode, words_solved, total_moves, best_words_per_game, best_moves_per_game 
FROM user_stats us 
JOIN users u ON us.user_id = u.id 
WHERE u.username = 'testuser';

SELECT 'Before deletion - Game completions:' as info;
SELECT user_id, game_mode, levels_completed, total_words_solved, total_moves, completion_date
FROM game_completions gc
JOIN users u ON gc.user_id = u.id 
WHERE u.username = 'testuser';

-- Delete user stats first (foreign key constraint)
DELETE FROM user_stats 
WHERE user_id IN (SELECT id FROM users WHERE username = 'testuser');

-- Delete game completions (foreign key constraint)
DELETE FROM game_completions 
WHERE user_id IN (SELECT id FROM users WHERE username = 'testuser');

-- Finally delete the user
DELETE FROM users WHERE username = 'testuser';

-- Verify deletion
SELECT 'After deletion - Users:' as info;
SELECT id, username, email FROM users WHERE username = 'testuser';

SELECT 'After deletion - User stats:' as info;
SELECT user_id, game_mode, words_solved, total_moves 
FROM user_stats us 
JOIN users u ON us.user_id = u.id 
WHERE u.username = 'testuser';

SELECT 'After deletion - Game completions:' as info;
SELECT user_id, game_mode, levels_completed, total_words_solved 
FROM game_completions gc
JOIN users u ON gc.user_id = u.id 
WHERE u.username = 'testuser';

SELECT 'testuser successfully removed from database!' as result;
