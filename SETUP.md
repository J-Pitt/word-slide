# WordSlide Game - Authentication & Leaderboard Setup

This guide will help you set up the PostgreSQL database and authentication system for your WordSlide game.

## Prerequisites

- Node.js (v14 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn package manager

## Installation Steps

### 1. Install Dependencies

```bash
npm install
```

This will install all the required packages including:
- Express.js (backend server)
- PostgreSQL client (pg)
- bcryptjs (password hashing)
- jsonwebtoken (JWT authentication)
- cors (cross-origin requests)

### 2. Set Up PostgreSQL Database

#### Option A: Using psql command line
```bash
# Connect to PostgreSQL as superuser
sudo -u postgres psql

# Create database
CREATE DATABASE wordslide_game;

# Connect to the new database
\c wordslide_game

# Run the setup script
\i setup-database.sql
```

#### Option B: Using pgAdmin or other GUI tool
1. Create a new database called `wordslide_game`
2. Run the contents of `setup-database.sql` in the query tool

### 3. Configure Environment Variables

Create a `.env` file in your project root (copy from `config.env.example`):

```bash
cp config.env.example .env
```

Edit the `.env` file with your database credentials:

```env
# Database Configuration
DB_USER=your_postgres_username
DB_HOST=localhost
DB_NAME=wordslide_game
DB_PASSWORD=your_postgres_password
DB_PORT=5432

# JWT Secret (change this to a secure random string)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Server Port
PORT=3001
```

### 4. Start the Backend Server

```bash
npm run server
```

The server will start on port 3001 (or the port specified in your .env file).

### 5. Start the Frontend Development Server

In a new terminal:

```bash
npm run dev
```

Or run both simultaneously:

```bash
npm run dev:full
```

## Database Schema

The system creates three main tables:

### users
- `id`: Unique user identifier
- `username`: Unique username
- `email`: Unique email address
- `password_hash`: Encrypted password
- `created_at`: Account creation timestamp

### game_stats
- `id`: Unique stat record identifier
- `user_id`: Reference to user
- `game_mode`: Game type ('original' or 'tetris')
- `words_solved`: Total words completed
- `total_moves`: Total moves made
- `games_played`: Number of games completed
- `best_score`: Highest score achieved
- `last_played`: Last game session timestamp

### game_sessions
- `id`: Unique session identifier
- `user_id`: Reference to user
- `game_mode`: Game type
- `level`: Game level completed
- `words_solved`: Words solved in this session
- `moves_made`: Moves made in this session
- `completed`: Whether session was completed
- `session_duration`: Session duration in seconds

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login

### User Management
- `GET /api/user/profile` - Get user profile (requires auth)
- `GET /api/user/stats` - Get user game statistics (requires auth)

### Game Statistics
- `POST /api/game/stats` - Update game statistics (requires auth)
- `GET /api/leaderboard/:gameMode` - Get leaderboard for specific game mode

### Health Check
- `GET /api/health` - Server health status

## Features

### User Authentication
- Secure user registration and login
- JWT token-based authentication
- Password hashing with bcrypt
- Session management

### Leaderboards
- Real-time leaderboard updates
- Separate rankings for each game mode
- Personal statistics tracking
- Beautiful oak-paneled UI design

### Game Integration
- Automatic stat tracking
- Session recording
- Progress monitoring
- Performance analytics

## Security Features

- Password hashing with salt rounds
- JWT token expiration (24 hours)
- Input validation and sanitization
- CORS protection
- SQL injection prevention

## Troubleshooting

### Common Issues

1. **Database Connection Error**
   - Verify PostgreSQL is running
   - Check database credentials in `.env`
   - Ensure database exists

2. **Port Already in Use**
   - Change PORT in `.env` file
   - Kill process using the port: `lsof -ti:3001 | xargs kill -9`

3. **Authentication Errors**
   - Check JWT_SECRET in `.env`
   - Verify token expiration
   - Check CORS settings

4. **Frontend Can't Connect to Backend**
   - Ensure backend server is running
   - Check API_BASE URL in AuthContext
   - Verify CORS configuration

### Database Maintenance

```sql
-- View all users
SELECT * FROM users;

-- View game statistics
SELECT u.username, gs.* FROM game_stats gs 
JOIN users u ON gs.user_id = u.id;

-- View recent game sessions
SELECT u.username, gs.* FROM game_sessions gs 
JOIN users u ON gs.user_id = u.id 
ORDER BY gs.created_at DESC LIMIT 10;

-- Reset user statistics (for testing)
UPDATE game_stats SET words_solved = 0, total_moves = 0, games_played = 0;
```

## Production Considerations

1. **Environment Variables**
   - Use strong, unique JWT_SECRET
   - Secure database credentials
   - Set appropriate CORS origins

2. **Database Security**
   - Create dedicated database user
   - Limit database permissions
   - Enable SSL connections

3. **Server Security**
   - Use HTTPS in production
   - Implement rate limiting
   - Add request logging
   - Set up monitoring

4. **Backup Strategy**
   - Regular database backups
   - User data export functionality
   - Disaster recovery plan

## Support

If you encounter issues:
1. Check the console for error messages
2. Verify database connectivity
3. Check environment variable configuration
4. Review the API endpoints documentation

Happy gaming! 🎮

