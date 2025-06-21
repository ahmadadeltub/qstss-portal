#!/bin/bash

# Teacher Portal - Start Both Servers Script
# This script ensures both backend and frontend servers start correctly

echo "🚀 Starting Teacher Portal Servers..."
echo "======================================"

# Change to the project directory
cd "/Users/ahmadtubaishat/Desktop/website "

# Kill any existing processes
echo "🧹 Cleaning up existing processes..."
pkill -f "node.*server.js" 2>/dev/null || true
pkill -f "react-scripts" 2>/dev/null || true
sleep 2

echo "✅ Processes cleaned up"

# Start backend server
echo "🔧 Starting backend server on port 4000..."
cd backend
node server.js &
BACKEND_PID=$!
echo "✅ Backend server started (PID: $BACKEND_PID)"

# Wait a moment for backend to initialize
sleep 3

# Test backend connectivity
echo "🔍 Testing backend connectivity..."
if curl -s http://localhost:4000/api/health > /dev/null; then
    echo "✅ Backend is responding on port 4000"
else
    echo "❌ Backend failed to start properly"
    exit 1
fi

# Start frontend server
echo "🎨 Starting frontend server..."
cd "../frontend"

# Export the port to avoid confusion
export PORT=4001

# Start the React development server with automatic port selection
echo "Y" | npm start &
FRONTEND_PID=$!
echo "✅ Frontend server starting (PID: $FRONTEND_PID)"

# Wait for frontend to start
echo "⏳ Waiting for frontend to initialize..."
sleep 10

# Test frontend connectivity
echo "🔍 Testing frontend connectivity..."
for port in 4001 3001 3000; do
    if curl -s http://localhost:$port > /dev/null; then
        echo "✅ Frontend is responding on port $port"
        FRONTEND_PORT=$port
        break
    fi
done

if [ -z "$FRONTEND_PORT" ]; then
    echo "❌ Frontend failed to start properly"
    exit 1
fi

echo ""
echo "🎉 All servers started successfully!"
echo "======================================"
echo "📊 Backend:  http://localhost:4000"
echo "🌐 Frontend: http://localhost:$FRONTEND_PORT"
echo ""
echo "🔐 Demo Login Credentials:"
echo "   Admin: admin@qstss.edu.qa / admin123"
echo "   Teacher: john.smith@qstss.edu.qa / teacher123"
echo ""
echo "Press Ctrl+C to stop all servers"

# Wait for user to stop the servers
wait
