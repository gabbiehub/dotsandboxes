#!/bin/bash

echo "🎮 Dots & Boxes - React UI Setup"
echo "================================"
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found"
    echo "Please run this script from the web-react directory"
    exit 1
fi

# Check for Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed"
    echo "Please install Node.js from https://nodejs.org/"
    exit 1
fi

echo "✅ Node.js version: $(node --version)"
echo "✅ npm version: $(npm --version)"
echo ""

# Install dependencies
echo "📦 Installing dependencies..."
npm install

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Setup complete!"
    echo ""
    echo "Next steps:"
    echo ""
    echo "1. Start the C server (in a separate terminal):"
    echo "   cd .. && ./server"
    echo ""
    echo "2. Start the WebSocket proxy (in another terminal):"
    echo "   cd .. && node websocket-proxy.js"
    echo ""
    echo "3. Start the React dev server:"
    echo "   npm run dev"
    echo ""
    echo "4. Open your browser to http://localhost:3000"
    echo ""
    echo "📖 For more info, see README.md or ../PASTEL_UI_INTEGRATION.md"
else
    echo ""
    echo "❌ Installation failed"
    echo "Please check the error messages above"
    exit 1
fi
