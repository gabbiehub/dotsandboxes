#!/bin/bash

# Dots and Boxes Project Setup Script
# Run this in your WSL Ubuntu terminal

set -e

echo "🎮 Setting up Dots and Boxes project..."
echo ""

# Create project directory
PROJECT_DIR="$HOME/dots-and-boxes"
cd ~
mkdir -p "$PROJECT_DIR"
cd "$PROJECT_DIR"

echo "📁 Creating directory structure..."
mkdir -p src/server
mkdir -p src/client
mkdir -p src/common
mkdir -p include
mkdir -p web

echo "✅ Directory structure created"
echo ""

echo "📝 You need to create the following files:"
echo ""
echo "Source files (*.c):"
echo "  - src/server/main.c"
echo "  - src/server/server.c"
echo "  - src/server/game.c"
echo "  - src/client/main.c"
echo "  - src/common/protocol.c"
echo ""
echo "Header files (*.h):"
echo "  - include/common.h"
echo "  - include/protocol.h"
echo "  - include/game.h"
echo "  - include/server.h"
echo ""
echo "Web files:"
echo "  - web/index.html"
echo "  - web/style.css"
echo "  - web/game.js"
echo ""
echo "Project files:"
echo "  - Makefile"
echo "  - README.md"
echo "  - PROTOCOL.md"
echo "  - .gitignore"
echo ""
echo "💡 Copy the file contents from the artifacts provided by Claude"
echo ""

read -p "Press Enter when you've created all files..."

echo ""
echo "🔧 Installing dependencies..."
sudo apt update
sudo apt install -y build-essential libjson-c-dev libwebsockets-dev git

echo ""
echo "✅ Dependencies installed"
echo ""

echo "🔨 Building project..."
make build

echo ""
echo "✅ Build successful!"
echo ""

echo "🎉 Setup complete!"
echo ""
echo "Next steps:"
echo "  1. Start server:     make run-server"
echo "  2. In another terminal, run client:  ./client"
echo "  3. Or open web/index.html in browser"
echo ""
echo "📖 Read README.md for detailed instructions"
echo "📡 Read PROTOCOL.md for protocol specification"
echo ""
echo "Good luck with your project! 🚀"