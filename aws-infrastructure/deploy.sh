#!/bin/bash

# WordSlide Game AWS Deployment Script
# This script sets up the complete AWS infrastructure for your game

set -e

# Configuration
STACK_NAME="wordslide-game"
ENVIRONMENT="dev"
REGION="us-east-1"
JWT_SECRET=$(openssl rand -base64 32)
DB_PASSWORD=$(openssl rand -base64 16)

echo "🚀 WordSlide Game AWS Deployment"
echo "=================================="
echo "Stack Name: $STACK_NAME"
echo "Environment: $ENVIRONMENT"
echo "Region: $REGION"
echo ""

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo "❌ AWS CLI is not installed. Please install it first:"
    echo "   https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html"
    exit 1
fi

# Check if AWS credentials are configured
if ! aws sts get-caller-identity &> /dev/null; then
    echo "❌ AWS credentials are not configured. Please run:"
    echo "   aws configure"
    exit 1
fi

echo "✅ AWS CLI and credentials verified"
echo ""

# Using simplified CloudFormation template
echo "📁 Using simplified CloudFormation template: cloudformation-simple.yaml"

# Deploy CloudFormation stack
echo "🏗️  Deploying CloudFormation stack..."
aws cloudformation deploy \
    --template-file cloudformation-simple.yaml \
    --stack-name "$STACK_NAME" \
    --parameter-overrides \
        Environment="$ENVIRONMENT" \
        DatabasePassword="$DB_PASSWORD" \
        JWTSecret="$JWT_SECRET" \
    --capabilities CAPABILITY_NAMED_IAM \
    --region $REGION

echo "✅ CloudFormation stack deployed successfully"
echo ""

# Get stack outputs
echo "📋 Getting stack outputs..."
API_URL=$(aws cloudformation describe-stacks \
    --stack-name "$STACK_NAME" \
    --region $REGION \
    --query 'Stacks[0].Outputs[?OutputKey==`ApiGatewayUrl`].OutputValue' \
    --output text)

DB_ENDPOINT=$(aws cloudformation describe-stacks \
    --stack-name "$STACK_NAME" \
    --region $REGION \
    --query 'Stacks[0].Outputs[?OutputKey==`DatabaseEndpoint`].OutputValue' \
    --output text)

DB_PORT=$(aws cloudformation describe-stacks \
    --stack-name "$STACK_NAME" \
    --region $REGION \
    --query 'Stacks[0].Outputs[?OutputKey==`DatabasePort`].OutputValue' \
    --output text)

echo "✅ Stack outputs retrieved"
echo ""

# Wait for RDS to be available
echo "⏳ Waiting for RDS database to be available..."
aws rds wait db-instance-available \
    --db-instance-identifier "${ENVIRONMENT}-wordslide-db" \
    --region $REGION

echo "✅ RDS database is available"
echo ""

# Initialize database with schema
echo "🗄️  Initializing database schema..."
echo "   Host: $DB_ENDPOINT"
echo "   Port: $DB_PORT"
echo "   Database: postgres"
echo "   Username: postgres"
echo ""

# Create a temporary file with the database initialization commands
cat > /tmp/init-db.sql << EOF
-- Connect to the postgres database first
\c postgres;

-- Create the wordslide_game database
CREATE DATABASE wordslide_game;

-- Connect to the new database
\c wordslide_game;

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
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

-- Create game_sessions table
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

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_game_stats_user_id ON game_stats(user_id);
CREATE INDEX IF NOT EXISTS idx_game_stats_game_mode ON game_stats(game_mode);
CREATE INDEX IF NOT EXISTS idx_game_sessions_user_id ON game_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_game_sessions_game_mode ON game_sessions(game_mode);

-- Grant permissions
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO postgres;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO postgres;
EOF

echo "📝 Database initialization script created"
echo ""

# Note: You'll need to run this manually or use a tool like psql
echo "⚠️  IMPORTANT: You need to manually initialize the database"
echo "   You can use the script at /tmp/init-db.sql"
echo "   Or connect directly with:"
echo "   psql -h $DB_ENDPOINT -p $DB_PORT -U postgres -d postgres -f /tmp/init-db.sql"
echo ""

# Deploy Lambda functions
echo "🔧 Deploying Lambda functions..."
cd ../lambda

# Build and deploy auth functions
echo "   Building auth functions..."
npm run build:auth
aws lambda update-function-code \
    --function-name "${ENVIRONMENT}-wordslide-register" \
    --zip-file fileb://auth.zip \
    --region $REGION

aws lambda update-function-code \
    --function-name "${ENVIRONMENT}-wordslide-login" \
    --zip-file fileb://auth.zip \
    --region $REGION

echo "✅ Auth functions deployed"

# Build and deploy game functions
echo "   Building game functions..."
npm run build:game
aws lambda update-function-code \
    --function-name "${ENVIRONMENT}-wordslide-leaderboard" \
    --zip-file fileb://game.zip \
    --region $REGION

aws lambda update-function-code \
    --function-name "${ENVIRONMENT}-wordslide-stats" \
    --zip-file fileb://game.zip \
    --region $REGION

echo "✅ Game functions deployed"

# Build and deploy user functions
echo "   Building user functions..."
npm run build:user
aws lambda update-function-code \
    --function-name "${ENVIRONMENT}-wordslide-profile" \
    --zip-file fileb://user.zip \
    --region $REGION

aws lambda update-function-code \
    --function-name "${ENVIRONMENT}-wordslide-user-stats" \
    --zip-file fileb://user.zip \
    --region $REGION

echo "✅ User functions deployed"

cd ..

# Clean up temporary files
rm -f lambda/*.zip
rm -f /tmp/init-db.sql

echo ""
echo "🎉 Deployment completed successfully!"
echo "======================================"
echo "API Gateway URL: $API_URL"
echo "Database Endpoint: $DB_ENDPOINT:$DB_PORT"
echo "Database Name: wordslide_game"
echo "Database Username: postgres"
echo "JWT Secret: $JWT_SECRET"
echo ""
echo "🔑 Next steps:"
echo "1. Initialize the database with the schema"
echo "2. Update your frontend environment variables:"
echo "   API_BASE=$API_URL/api"
echo "3. Deploy your React app to AWS Amplify"
echo "4. Test the authentication and leaderboard features"
echo ""
echo "📚 Documentation: Check SETUP.md for detailed instructions"
echo "🆘 Need help? Check the troubleshooting section in SETUP.md"
