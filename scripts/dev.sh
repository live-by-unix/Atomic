#!/bin/bash

# Development script for Atomic Chat
# This script starts both the server and client in development mode

set -e

echo "🚀 Starting Atomic Chat in development mode..."

# Check if required directories exist
if [ ! -d "server" ] || [ ! -d "client" ] || [ ! -d "shared" ]; then
    echo "❌ Error: Required directories (server, client, shared) not found"
    exit 1
fi

# Build shared types first
echo "📦 Building shared types..."
cd shared
npm run build
cd ..

# Start server in background
echo "🖥️  Starting server..."
cd server
npm run dev &
SERVER_PID=$!
cd ..

# Wait for server to start
echo "⏳ Waiting for server to be ready..."
sleep 5

# Start client
echo "🌐 Starting client..."
cd client
npm run dev &
CLIENT_PID=$!
cd ..

echo "✅ Development environment started!"
echo "   Server: http://localhost:3001"
echo "   Client: http://localhost:5173"
echo ""
echo "Press Ctrl+C to stop all processes"

# Handle cleanup
trap "echo '🛑 Stopping all processes...'; kill $SERVER_PID $CLIENT_PID 2>/dev/null; exit" INT TERM

# Wait for both processes
wait
