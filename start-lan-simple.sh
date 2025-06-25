#!/bin/bash

# Simple LAN Portal Startup for QSTSS
echo "🏫 Starting Qatar Science & Technology School Portal for LAN..."

# Get local IP address
LOCAL_IP=$(ifconfig en0 | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}' | head -1)
if [ -z "$LOCAL_IP" ]; then
    LOCAL_IP=$(ifconfig | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}' | head -1)
fi

echo "📡 Local IP: $LOCAL_IP"

# Make sure we're in the right directory
cd "/Users/ahmadtubaishat/Desktop/website "

# Start backend
echo "🚀 Starting backend server..."
cd backend
NODE_ENV=development \
PORT=4000 \
MONGODB_URI=mongodb://localhost:27017/teacher-portal \
JWT_SECRET=qstss-jwt-secret-lan-2024 \
CORS_ORIGIN=http://$LOCAL_IP:3001 \
node server.js &

echo "✅ Backend starting on port 4000..."
sleep 5

# Start frontend
echo "🎨 Starting frontend server..."
cd ../frontend
REACT_APP_API_URL=http://$LOCAL_IP:4000/api \
PORT=3001 \
HOST=0.0.0.0 \
npm start &

echo "✅ Frontend starting on port 3001..."
sleep 3

echo ""
echo "🎓 =========================================="
echo "   QATAR SCIENCE & TECHNOLOGY SCHOOL"
echo "        PORTAL - LAN ACCESS READY"
echo "=========================================="
echo ""
echo "🌐 TEACHERS ACCESS THE PORTAL AT:"
echo "   📱 http://$LOCAL_IP:3001"
echo ""
echo "🔧 ADMIN/IT ACCESS:"
echo "   Backend API: http://$LOCAL_IP:4000/api"
echo ""
echo "📋 SHARE THIS URL WITH ALL TEACHERS:"
echo "   http://$LOCAL_IP:3001"
echo ""
echo "🔐 LOGIN CREDENTIALS:"
echo "   Admin: admin@qstss.edu.qa / admin123"
echo "   Teachers: Contact admin for credentials"
echo ""
echo "📱 DEVICE COMPATIBILITY:"
echo "   ✅ Desktop, Laptop, Tablet, Smartphone"
echo "   ✅ All browsers (Chrome, Safari, Firefox)"
echo ""
echo "⚠️  REQUIREMENTS:"
echo "   - Device must be on school WiFi/LAN"
echo "   - Same network as this computer"
echo ""
echo "🛑 TO STOP: Run ./stop-lan-servers.sh"
echo ""

echo "Servers are running! Teachers can now access the portal."
