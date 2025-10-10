# AWS Database Setup Guide

This guide covers setting up the PostgreSQL database for WordSlide on AWS RDS.

## Database Architecture

### RDS PostgreSQL Configuration
- **Instance Class**: db.t3.micro (development) / db.t3.small (production)
- **Engine**: PostgreSQL 13.x
- **Storage**: 20GB GP2 (development) / 100GB GP2 (production)
- **Backup**: 7-day retention
- **Multi-AZ**: Enabled for production

### Network Configuration
- **VPC**: Custom VPC with private subnets
- **Security Groups**: Restricted access to Lambda functions
- **Subnet Groups**: Private subnets across multiple AZs

## Database Schema

### Core Tables

#### users
```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### game_stats
```sql
CREATE TABLE game_stats (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  game_mode VARCHAR(20) NOT NULL,
  words_solved INTEGER DEFAULT 0,
  total_moves INTEGER DEFAULT 0,
  games_played INTEGER DEFAULT 0,
  best_score INTEGER DEFAULT 0,
  last_played TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### game_sessions
```sql
CREATE TABLE game_sessions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  game_mode VARCHAR(20) NOT NULL,
  level INTEGER NOT NULL,
  words_solved INTEGER DEFAULT 0,
  moves_made INTEGER DEFAULT 0,
  completed BOOLEAN DEFAULT FALSE,
  session_duration INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### game_completions
```sql
CREATE TABLE game_completions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  username VARCHAR(50) NOT NULL,
  game_mode VARCHAR(20) NOT NULL,
  levels_completed INTEGER NOT NULL,
  total_words_solved INTEGER NOT NULL,
  total_moves INTEGER NOT NULL,
  average_moves_per_level DECIMAL(5,2),
  completion_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Indexes for Performance

### Primary Indexes
```sql
-- User lookup
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);

-- Game stats lookup
CREATE INDEX idx_game_stats_user_id ON game_stats(user_id);
CREATE INDEX idx_game_stats_game_mode ON game_stats(game_mode);

-- Session lookup
CREATE INDEX idx_game_sessions_user_id ON game_sessions(user_id);
CREATE INDEX idx_game_sessions_created_at ON game_sessions(created_at);

-- Completion lookup
CREATE INDEX idx_game_completions_user_id ON game_completions(user_id);
CREATE INDEX idx_game_completions_game_mode ON game_completions(game_mode);
CREATE INDEX idx_game_completions_completion_date ON game_completions(completion_date);
```

### Composite Indexes
```sql
-- Leaderboard queries
CREATE INDEX idx_game_completions_mode_date ON game_completions(game_mode, completion_date DESC);
CREATE INDEX idx_game_stats_mode_score ON game_stats(game_mode, best_score DESC);
```

## Database Initialization

### Automated Setup
```bash
# Run the initialization script
psql -h your-db-endpoint.amazonaws.com \
     -p 5432 \
     -U postgres \
     -d postgres \
     -f init-database.sql
```

### Manual Setup
1. Connect to your RDS instance
2. Create the database: `CREATE DATABASE wordslide_game;`
3. Connect to the new database: `\c wordslide_game`
4. Run the schema creation scripts
5. Create indexes for performance
6. Set up initial data if needed

## Connection Configuration

### Environment Variables
```env
DB_HOST=your-db-endpoint.amazonaws.com
DB_PORT=5432
DB_NAME=wordslide_game
DB_USER=postgres
DB_PASSWORD=your-secure-password
DB_SSL=true
DB_POOL_MIN=2
DB_POOL_MAX=10
```

### Lambda Function Configuration
```javascript
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: process.env.DB_SSL === 'true',
  min: parseInt(process.env.DB_POOL_MIN) || 2,
  max: parseInt(process.env.DB_POOL_MAX) || 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});
```

## Security Configuration

### Security Groups
```json
{
  "SecurityGroupRules": [
    {
      "IpProtocol": "tcp",
      "FromPort": 5432,
      "ToPort": 5432,
      "SourceSecurityGroupId": "sg-lambda-security-group"
    }
  ]
}
```

### IAM Roles
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "rds:DescribeDBInstances",
        "rds:DescribeDBClusters"
      ],
      "Resource": "*"
    }
  ]
}
```

## Backup and Recovery

### Automated Backups
- **Retention**: 7 days (development) / 30 days (production)
- **Window**: 03:00-04:00 UTC (low traffic period)
- **Point-in-time Recovery**: Enabled

### Manual Backups
```bash
# Create manual snapshot
aws rds create-db-snapshot \
  --db-instance-identifier your-db-instance \
  --db-snapshot-identifier wordslide-manual-backup-$(date +%Y%m%d)
```

### Restore from Snapshot
```bash
# Restore from snapshot
aws rds restore-db-instance-from-db-snapshot \
  --db-instance-identifier wordslide-restored \
  --db-snapshot-identifier wordslide-manual-backup-20240101
```

## Monitoring and Alerting

### CloudWatch Metrics
- **Database Connections**: Monitor connection count
- **CPU Utilization**: Track CPU usage
- **Free Storage Space**: Monitor disk usage
- **Read/Write IOPS**: Track database activity

### Alarms
```json
{
  "AlarmName": "wordslide-db-cpu-high",
  "MetricName": "CPUUtilization",
  "Threshold": 80,
  "ComparisonOperator": "GreaterThanThreshold",
  "EvaluationPeriods": 2
}
```

## Performance Optimization

### Connection Pooling
```javascript
// Lambda function connection pooling
const pool = new Pool({
  // ... configuration
  max: 10, // Maximum connections
  min: 2,  // Minimum connections
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});
```

### Query Optimization
```sql
-- Use EXPLAIN ANALYZE for query optimization
EXPLAIN ANALYZE SELECT * FROM game_stats 
WHERE user_id = 1 AND game_mode = 'original';

-- Optimize leaderboard queries
SELECT u.username, gs.best_score, gs.words_solved
FROM game_stats gs
JOIN users u ON gs.user_id = u.id
WHERE gs.game_mode = 'original'
ORDER BY gs.best_score DESC
LIMIT 10;
```

## Scaling Considerations

### Read Replicas
```bash
# Create read replica for read-heavy workloads
aws rds create-db-instance-read-replica \
  --db-instance-identifier wordslide-read-replica \
  --source-db-instance-identifier wordslide-primary
```

### Instance Scaling
```bash
# Scale up instance class
aws rds modify-db-instance \
  --db-instance-identifier wordslide-primary \
  --db-instance-class db.t3.small
```

## Maintenance

### Regular Tasks
- **Weekly**: Review performance metrics
- **Monthly**: Analyze slow queries
- **Quarterly**: Review and optimize indexes
- **Annually**: Plan for scaling needs

### Database Maintenance
```sql
-- Analyze tables for query optimization
ANALYZE users;
ANALYZE game_stats;
ANALYZE game_sessions;
ANALYZE game_completions;

-- Vacuum to reclaim space
VACUUM ANALYZE;

-- Check for long-running queries
SELECT pid, now() - pg_stat_activity.query_start AS duration, query 
FROM pg_stat_activity 
WHERE (now() - pg_stat_activity.query_start) > interval '5 minutes';
```

## Troubleshooting

### Common Issues

1. **Connection Timeouts**
   - Check security group rules
   - Verify VPC configuration
   - Check Lambda subnet configuration

2. **High CPU Usage**
   - Analyze slow queries
   - Check for missing indexes
   - Review connection pool settings

3. **Storage Issues**
   - Monitor free space
   - Clean up old data
   - Consider storage scaling

### Debug Commands
```bash
# Check database status
aws rds describe-db-instances --db-instance-identifier your-db-instance

# View database logs
aws rds describe-db-log-files --db-instance-identifier your-db-instance

# Test connection
psql -h your-db-endpoint.amazonaws.com -p 5432 -U postgres -d postgres
```

## Cost Optimization

### Instance Sizing
- **Development**: db.t3.micro (~$15/month)
- **Production**: db.t3.small (~$30/month)
- **High Traffic**: db.t3.medium (~$60/month)

### Storage Optimization
- **GP2**: General purpose SSD
- **IO1**: Provisioned IOPS for high-performance needs
- **Monitoring**: Track storage usage and optimize

### Backup Costs
- **Automated Backups**: Included in instance cost
- **Manual Snapshots**: $0.095/GB/month
- **Cross-Region**: Additional transfer costs

## Security Best Practices

### Access Control
- **Principle of Least Privilege**: Minimal required permissions
- **Network Isolation**: Private subnets only
- **Encryption**: At rest and in transit
- **Regular Audits**: Review access patterns

### Data Protection
- **Encryption**: AES-256 encryption
- **Backups**: Encrypted backups
- **Transit**: SSL/TLS encryption
- **Access Logging**: Enable audit logs

## Conclusion

This database setup provides a robust, scalable, and secure foundation for the WordSlide game. The configuration supports:

- **High Performance**: Optimized queries and indexes
- **Scalability**: Easy horizontal and vertical scaling
- **Security**: Comprehensive security measures
- **Reliability**: Automated backups and monitoring
- **Cost Efficiency**: Right-sized resources for current needs

The database is ready for production use with proper monitoring, maintenance, and scaling procedures in place.
