#!/bin/bash

echo "Starting WordSlide development environment..."

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "Warning: .env file not found. Please copy env.example to .env and configure your database settings."
    echo "You can run: cp env.example .env"
fi

# Start the backend server in the background
echo "Starting backend server on port 3001..."
npm run server &
BACKEND_PID=$!

# Wait a moment for backend to start
sleep 3

# Start the frontend development server
echo "Starting frontend development server on port 3000..."
npm run dev &
FRONTEND_PID=$!

echo "Development servers started!"
echo "Frontend: http://localhost:3000"
echo "Backend: http://localhost:3001"
echo ""
echo "Press Ctrl+C to stop both servers"

# Function to cleanup background processes
cleanup() {
    echo "Stopping servers..."
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    exit 0
}

# Trap Ctrl+C and cleanup
trap cleanup SIGINT

# Wait for both processes
wait
