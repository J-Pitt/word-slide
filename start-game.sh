#!/bin/bash

echo "🎮 Starting WordSlide Game with Authentication & Leaderboards! 🎮"
echo ""

# Check if .env file exists
if [ ! -f .env ]; then
    echo "⚠️  Warning: .env file not found!"
    echo "   Please copy env.example to .env and configure your database settings"
    echo "   Then run this script again."
    echo ""
    echo "   Example: cp env.example .env"
    echo ""
    exit 1
fi

echo "✅ Environment configuration found"
echo ""

# Check if PostgreSQL is running (macOS compatible)
if ! pg_isready -q -h localhost -p 5432; then
    echo "❌ PostgreSQL is not running!"
    echo "   Please start PostgreSQL and try again"
    echo ""
    echo "   On macOS, you can:"
    echo "   - Use Homebrew: brew services start postgresql@14"
    echo "   - Or launch PostgreSQL.app"
    echo "   - Or start the service manually"
    echo ""
    exit 1
fi

echo "✅ PostgreSQL is running"
echo ""

echo "🚀 Starting backend server..."
echo "   Backend will be available at: http://localhost:3001"
echo ""

# Start backend server in background
npm run server &
BACKEND_PID=$!

# Wait a moment for backend to start
sleep 3

echo "🌐 Starting frontend development server..."
echo "   Frontend will be available at: http://localhost:5173"
echo ""

# Start frontend server
npm run dev

# When frontend stops, kill backend
echo ""
echo "🛑 Shutting down backend server..."
kill $BACKEND_PID 2>/dev/null

echo "✅ Game servers stopped"
echo "   Thanks for playing WordSlide! 🎉"

