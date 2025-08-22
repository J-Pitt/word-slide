#!/bin/bash

echo "🧪 Testing Database Connection"
echo "=============================="

# Test connection with current password
echo "🔑 Testing with password: WordSlide2024!"
PGPASSWORD="WordSlide2024!" psql -h dev-wordslide-db.cszqcws8wjsi.us-east-1.rds.amazonaws.com -p 5432 -U postgres -d postgres -c "SELECT version();" 2>&1

echo ""
echo "🔑 Testing with password: WordSlide2024"
PGPASSWORD="WordSlide2024" psql -h dev-wordslide-db.cszqcws8wjsi.us-east-1.rds.amazonaws.com -p 5432 -U postgres -d postgres -c "SELECT version();" 2>&1

echo ""
echo "🔑 Testing with password: wordslide2024"
PGPASSWORD="wordslide2024" psql -h dev-wordslide-db.cszqcws8wjsi.us-east-1.rds.amazonaws.com -p 5432 -U postgres -d postgres -c "SELECT version();" 2>&1

echo ""
echo "✅ Connection tests completed!"
