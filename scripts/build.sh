#!/bin/bash

# Production build script for Atomic Chat
# This script builds the entire application for production deployment

set -e

echo "🔨 Building Atomic Chat for production..."

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

# Build server
echo "🖥️  Building server..."
cd server
npm run build
cd ..

# Build client
echo "🌐 Building client..."
cd client
npm run build
cd ..

echo "✅ Production build completed!"
echo "   Server build: server/dist"
echo "   Client build: client/dist"
echo "   Shared build: shared/dist"
