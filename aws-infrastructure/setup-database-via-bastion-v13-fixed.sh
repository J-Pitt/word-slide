#!/bin/bash

echo "🗄️  WordSlide Database Access via Bastion Host"
echo "================================================"
echo "Bastion Host: 44.201.231.206"
echo "Database: dev-wordslide-db.cszqcws8wjsi.us-east-1.rds.amazonaws.com:5432"
echo "Username: postgres"
echo "Password: WordSlide2024!"
echo ""

echo "🔑 Connecting to bastion host and then to database..."
echo ""

# Connect to bastion host and then to database
ssh -i ~/wordslide-db-setup.pem ec2-user@44.201.231.206 << "EOF"
    echo "✅ Connected to bastion host"
    echo "🔌 Installing newer PostgreSQL client..."
    
    # Enable PostgreSQL 13 repository
    sudo amazon-linux-extras enable postgresql13
    sudo yum clean metadata
    sudo yum install -y postgresql13
    
    echo "🗄️  Testing database connection..."
    PGPASSWORD="WordSlide2024!" psql -h dev-wordslide-db.cszqcws8wjsi.us-east-1.rds.amazonaws.com -p 5432 -U postgres -d postgres -c "SELECT version();"
    
    echo "🚀 Running database initialization..."
    cat > /tmp/init-db.sql << "SQL_EOF"
-- Connect to the postgres database first
