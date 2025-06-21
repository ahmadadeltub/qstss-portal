#!/bin/bash

# Qatar Science & Technology Secondary School - Teacher Portal Startup Script
# This script ensures both backend and frontend servers start correctly

echo "🏫 Starting Qatar STSS Teacher Portal..."
echo "=================================="

# Check if required directories exist
if [ ! -d "backend" ]; then
    echo "❌ Backend directory not found!"
    exit 1
fi

if [ ! -d "frontend" ]; then
    echo "❌ Frontend directory not found!"
    exit 1
fi

# Kill any existing Node.js processes to prevent conflicts
echo "🧹 Cleaning up existing processes..."
pkill -f "node.*server.js" 2>/dev/null || true
pkill -f "react-scripts start" 2>/dev/null || true

# Wait a moment for processes to stop
sleep 2

# Check if MongoDB is running
echo "🍃 Checking MongoDB connection..."
if ! mongostat --host localhost:27017 --rowcount 1 >/dev/null 2>&1; then
    echo "⚠️  MongoDB not running. Starting MongoDB..."
    brew services start mongodb/brew/mongodb-community 2>/dev/null || true
    sleep 3
fi

# Start Backend Server
echo "🚀 Starting Backend Server (Port 4000)..."
cd backend
node server.js &
BACKEND_PID=$!
cd ..

# Wait for backend to start
echo "⏳ Waiting for backend to initialize..."
sleep 5

# Check if backend is responding
if curl -s http://localhost:4000/api/health >/dev/null 2>&1; then
    echo "✅ Backend server is running successfully!"
else
    echo "❌ Backend server failed to start!"
    kill $BACKEND_PID 2>/dev/null || true
    exit 1
fi

# Start Frontend Server
echo "🎨 Starting Frontend Server (Port 3001)..."
cd frontend
PORT=3001 npm start &
FRONTEND_PID=$!
cd ..

# Wait for frontend to start
echo "⏳ Waiting for frontend to initialize..."
sleep 10

# Check if frontend is responding
if curl -s http://localhost:3001 >/dev/null 2>&1; then
    echo "✅ Frontend server is running successfully!"
else
    echo "❌ Frontend server failed to start!"
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null || true
    exit 1
fi

echo ""
echo "🎉 Teacher Portal Started Successfully!"
echo "=================================="
echo "🌐 Frontend: http://localhost:3001"
echo "⚙️  Backend API: http://localhost:4000/api"
echo "🔍 Health Check: http://localhost:4000/api/health"
echo ""
echo "📋 Demo Credentials:"
echo "👨‍💼 Admin: admin@qstss.edu.qa / admin123"
echo "👨‍🏫 Teacher: john.smith@qstss.edu.qa / teacher123"
echo ""
echo "Press Ctrl+C to stop both servers"

# Keep script running and handle shutdown
cleanup() {
    echo ""
    echo "🛑 Shutting down servers..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null || true
    echo "✅ Servers stopped successfully!"
    exit 0
}

trap cleanup INT TERM

# Wait for background processes
wait
