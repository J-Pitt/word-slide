# 🗄️ WordSlide Database Setup Guide

## 🎯 **Quick Start - Database Initialization**

Your WordSlide game database is ready to be initialized! Here's how to get it running:

### **Step 1: Run the Database Setup Script**

```bash
cd aws-infrastructure
./connect-database.sh
```

Choose option **2** to run the initialization script.

### **Step 2: Enter the Database Password**

When prompted, enter the password you set during the CloudFormation deployment.

## 🔧 **Manual Database Connection**

If you prefer to connect manually:

### **Connection Details:**
- **Host**: `dev-wordslide-db.cszqcws8wjsi.us-east-1.rds.amazonaws.com`
- **Port**: `5432`
- **Database**: `postgres` (initially)
- **Username**: `postgres`
- **Password**: [Your CloudFormation password]

### **Command:**
```bash
psql -h dev-wordslide-db.cszqcws8wjsi.us-east-1.rds.amazonaws.com \
     -p 5432 \
     -U postgres \
     -d postgres
```

## 🚀 **What the Initialization Script Does**

The `init-database.sql` script will:

1. **Create Database**: `wordslide_game`
2. **Create Tables**:
   - `users` - User accounts and authentication
   - `game_stats` - Player statistics and achievements
   - `game_sessions` - Individual game session data
3. **Set Up Indexes** for performance
4. **Configure Permissions** for the postgres user

## 📊 **Database Schema Overview**

### **Users Table**
```sql
users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)
```

### **Game Stats Table**
```sql
game_stats (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    game_mode VARCHAR(20) NOT NULL,
    words_solved INTEGER DEFAULT 0,
    total_moves INTEGER DEFAULT 0,
    games_played INTEGER DEFAULT 0,
    best_score INTEGER DEFAULT 0,
    last_played TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)
```

### **Game Sessions Table**
```sql
game_sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    game_mode VARCHAR(20) NOT NULL,
    level INTEGER NOT NULL,
    words_solved INTEGER DEFAULT 0,
    moves_made INTEGER DEFAULT 0,
    completed BOOLEAN DEFAULT false,
    session_duration INTEGER DEFAULT 0
)
```

## 🧪 **Testing the Database**

After initialization, you can test the setup:

### **Test Connection:**
```sql
-- Check if you're in the right database
SELECT current_database();

-- List all tables
\dt

-- Check table structure
\d users
\d game_stats
\d game_sessions

-- Test insert (optional)
INSERT INTO users (username, email, password_hash) 
VALUES ('testuser', 'test@example.com', 'test_hash');

-- Verify insert
SELECT * FROM users;
```

## 🔒 **Security Notes**

- **Temporary Access**: Your IP (`148.75.243.82`) has been temporarily allowed access
- **Remove Access**: After setup, consider removing this IP access for security
- **Production**: Use VPC endpoints or VPN for production database access

## 🆘 **Troubleshooting**

### **Connection Refused**
- Check if your IP is still allowed in the security group
- Verify the database is running: `aws rds describe-db-instances --db-instance-identifier dev-wordslide-db`

### **Authentication Failed**
- Double-check the password from your CloudFormation deployment
- Ensure you're using the correct username (`postgres`)

### **Permission Denied**
- The script should handle permissions automatically
- If issues persist, check the Lambda function logs

## 📋 **Next Steps After Database Setup**

1. **✅ Database Schema**: Tables created and ready
2. **🔐 Test Authentication**: Try registering a test user
3. **🎮 Test Game Features**: Verify leaderboard functionality
4. **🚀 Deploy Frontend**: Connect to AWS Amplify
5. **🌐 Go Live**: Your game is now cloud-ready!

## 💡 **Pro Tips**

- **Backup**: Consider setting up automated RDS snapshots
- **Monitoring**: Use CloudWatch for database performance metrics
- **Scaling**: RDS can be easily scaled up as your game grows
- **Security**: Regularly rotate database passwords

---

**🎮 Your WordSlide database is ready to store player data and game statistics! 🎮**

Run `./connect-database.sh` and choose option 2 to get started!
