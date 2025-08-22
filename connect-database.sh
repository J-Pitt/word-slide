#!/bin/bash

# WordSlide Database Connection Script
# This script helps you connect to the RDS database

echo "🗄️  WordSlide Database Connection"
echo "=================================="

# Database connection details
DB_HOST="dev-wordslide-db.cszqcws8wjsi.us-east-1.rds.amazonaws.com"
DB_PORT="5432"
DB_NAME="postgres"
DB_USER="postgres"

echo "Host: $DB_HOST"
echo "Port: $DB_PORT"
echo "Database: $DB_NAME"
echo "Username: $DB_USER"
echo ""

echo "🔑 You'll be prompted for the database password"
echo "   (This was set during CloudFormation deployment)"
echo ""

echo "📋 Available options:"
echo "1. Connect to postgres database (default)"
echo "2. Run initialization script"
echo "3. Test connection only"
echo ""

read -p "Choose option (1-3): " choice

case $choice in
    1)
        echo "🔌 Connecting to postgres database..."
        psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME"
        ;;
    2)
        echo "🚀 Running database initialization..."
        psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f init-database.sql
        ;;
    3)
        echo "🧪 Testing database connection..."
        psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "SELECT version();"
        ;;
    *)
        echo "❌ Invalid option. Exiting."
        exit 1
        ;;
esac

echo ""
echo "✅ Database operation completed!"
