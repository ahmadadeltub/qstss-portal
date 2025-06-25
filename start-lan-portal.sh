#!/bin/bash

# Qatar Science & Technology School Portal - LAN Setup
echo "🏫 Setting up QSTSS Portal for LAN Access..."

# Get the local IP address
LOCAL_IP=$(ifconfig en0 | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}' | head -1)

if [ -z "$LOCAL_IP" ]; then
    # Try alternative interface
    LOCAL_IP=$(ifconfig en1 | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}' | head -1)
fi

if [ -z "$LOCAL_IP" ]; then
    # Fallback to any available interface
    LOCAL_IP=$(ifconfig | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}' | head -1)
fi

echo "🌐 Local IP Address: $LOCAL_IP"

# Kill any existing servers
echo "🔄 Stopping existing servers..."
pkill -f "node.*server.js" || echo "No backend servers running"
pkill -f "react-scripts start" || echo "No frontend servers running"

# Start MongoDB (if using local MongoDB)
echo "🗄️ Starting MongoDB..."
brew services start mongodb-community || echo "MongoDB not installed via brew, assuming external database"

# Wait for MongoDB to start
sleep 3

# Start Backend Server
echo "🚀 Starting Backend Server..."
cd backend

# Create LAN environment file
cat > .env.lan << EOF
NODE_ENV=development
PORT=4000
MONGODB_URI=mongodb://localhost:27017/teacher-portal
JWT_SECRET=qstss-jwt-secret-lan-2024
CORS_ORIGIN=http://$LOCAL_IP:3001
EOF

# Start backend with LAN environment
NODE_ENV=development \
PORT=4000 \
MONGODB_URI=mongodb://localhost:27017/teacher-portal \
JWT_SECRET=qstss-jwt-secret-lan-2024 \
CORS_ORIGIN=http://$LOCAL_IP:3001 \
node server.js &

BACKEND_PID=$!
echo "✅ Backend running on http://$LOCAL_IP:4000"

# Wait for backend to start
sleep 5

cd ../frontend

# Create LAN environment for frontend
cat > .env.lan << EOF
REACT_APP_API_URL=http://$LOCAL_IP:4000/api
REACT_APP_ENV=lan
PORT=3001
HOST=0.0.0.0
EOF

echo "🎨 Starting Frontend Server..."

# Start frontend with LAN configuration
REACT_APP_API_URL=http://$LOCAL_IP:4000/api \
REACT_APP_ENV=lan \
PORT=3001 \
HOST=0.0.0.0 \
npm start &

FRONTEND_PID=$!

# Display access information
echo ""
echo "🎓 =========================================="
echo "   QATAR SCIENCE & TECHNOLOGY SCHOOL"
echo "        PORTAL - LAN ACCESS READY"
echo "=========================================="
echo ""
echo "🌐 TEACHER ACCESS URLS:"
echo "   Main Portal: http://$LOCAL_IP:3001"
echo "   Admin Panel: http://$LOCAL_IP:3001/admin"
echo ""
echo "🔧 TECHNICAL INFO:"
echo "   Backend API: http://$LOCAL_IP:4000/api"
echo "   Local IP: $LOCAL_IP"
echo "   Network: LAN Only (Secure)"
echo ""
echo "📱 DEVICE COMPATIBILITY:"
echo "   ✅ Desktop Computers"
echo "   ✅ Laptops"
echo "   ✅ Tablets"
echo "   ✅ Smartphones"
echo "   ✅ Chromebooks"
echo ""
echo "👥 TEACHER INSTRUCTIONS:"
echo "   1. Connect to school WiFi/LAN"
echo "   2. Open browser (Chrome, Safari, Firefox)"
echo "   3. Visit: http://$LOCAL_IP:3001"
echo "   4. Bookmark for easy access"
echo "   5. Login with provided credentials"
echo ""
echo "🔐 LOGIN CREDENTIALS:"
echo "   Admin: admin@qstss.edu.qa / admin123"
echo "   Sample Teacher: john.smith@qstss.edu.qa / teacher123"
echo ""
echo "⚡ NETWORK REQUIREMENTS:"
echo "   - Same WiFi/LAN network as server"
echo "   - No internet required after initial setup"
echo "   - Fast local performance"
echo ""
echo "🛑 TO STOP SERVERS:"
echo "   Press Ctrl+C or run: ./stop-lan-servers.sh"
echo ""
echo "📋 Share this URL with teachers:"
echo "   📱 http://$LOCAL_IP:3001"
echo ""

# Keep script running and wait for user interrupt
trap 'echo ""; echo "🛑 Stopping servers..."; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; echo "✅ Servers stopped"; exit 0' INT

echo "✅ Both servers are running!"
echo "Press Ctrl+C to stop all servers"
echo ""

# Wait for both processes
wait $BACKEND_PID $FRONTEND_PID
