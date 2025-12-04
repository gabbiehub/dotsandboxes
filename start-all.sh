#!/bin/bash

# Dots & Boxes - Start All Services
# This script starts the C server, WebSocket proxy, and React dev server

PROJECT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

echo "🎮 Starting Dots & Boxes"
echo "======================="
echo ""

# Check if server is built
if [ ! -f "$PROJECT_DIR/server" ]; then
    echo "⚠️  Server not built. Building now..."
    cd "$PROJECT_DIR"
    make build
    if [ $? -ne 0 ]; then
        echo "❌ Build failed. Please fix errors and try again."
        exit 1
    fi
fi

# Check if node_modules exists in web-react
if [ ! -d "$PROJECT_DIR/web-react/node_modules" ]; then
    echo "⚠️  Dependencies not installed. Installing now..."
    cd "$PROJECT_DIR/web-react"
    npm install
    if [ $? -ne 0 ]; then
        echo "❌ npm install failed. Please check your Node.js installation."
        exit 1
    fi
fi

echo "✅ All dependencies ready"
echo ""
echo "Starting services in 3 seconds..."
echo "Press Ctrl+C to stop all services"
echo ""
sleep 3

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Stopping all services..."
    kill $SERVER_PID $PROXY_PID $REACT_PID 2>/dev/null
    wait $SERVER_PID $PROXY_PID $REACT_PID 2>/dev/null
    echo "✅ All services stopped"
    exit 0
}

trap cleanup SIGINT SIGTERM

# Start C Server
echo "🚀 Starting C Server on port 50000..."
cd "$PROJECT_DIR"
./server &
SERVER_PID=$!
sleep 1

# Start WebSocket Proxy
echo "🔌 Starting WebSocket Proxy on port 8080..."
node websocket-proxy.js &
PROXY_PID=$!
sleep 1

# Start React Dev Server
echo "⚛️  Starting React Dev Server on port 3000..."
cd "$PROJECT_DIR/web-react"
npm run dev &
REACT_PID=$!

echo ""
echo "✅ All services started!"
echo ""
echo "📍 Access the game at:"
echo "   Local:    http://localhost:3000"
echo "   Network:  http://$(hostname -I | awk '{print $1}'):3000"
echo ""
echo "Press Ctrl+C to stop all services"
echo ""

# Wait for any process to exit
wait $SERVER_PID $PROXY_PID $REACT_PID
