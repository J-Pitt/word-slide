-- Clear all users from the database
DELETE FROM user_stats;
DELETE FROM users;
SELECT 'All users cleared successfully!' as result;
