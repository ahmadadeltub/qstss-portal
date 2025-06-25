#!/bin/bash

echo "🛑 Stopping QSTSS Portal LAN Servers..."

# Kill backend servers
echo "🔄 Stopping backend servers..."
pkill -f "node.*server.js" && echo "✅ Backend stopped" || echo "ℹ️ No backend servers running"

# Kill frontend servers  
echo "🔄 Stopping frontend servers..."
pkill -f "react-scripts start" && echo "✅ Frontend stopped" || echo "ℹ️ No frontend servers running"

# Kill any remaining node processes related to the portal
pkill -f "node.*3001" 2>/dev/null
pkill -f "node.*4000" 2>/dev/null

echo ""
echo "✅ All QSTSS Portal servers stopped"
echo "🔒 LAN access disabled"
echo ""
echo "To restart the portal, run: ./start-lan-portal.sh"
