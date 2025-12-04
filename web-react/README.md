# Pastel Dots & Boxes - React UI

Modern, mobile-friendly React + TypeScript UI for Dots & Boxes game.

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Development Server
```bash
npm run dev
```
Opens at `http://localhost:3000`

### 3. Start Backend (in separate terminals)
```bash
# Terminal 1: C Server
cd ..
./server

# Terminal 2: WebSocket Proxy
cd ..
node websocket-proxy.js
```

### 4. Play!
- **Local:** `http://localhost:3000`
- **On phone:** `http://192.168.x.x:3000` (use your LAN IP)

## Build for Production

```bash
npm run build
```
Output in `dist/` folder.

Serve with:
```bash
python3 -m http.server 8000 --directory dist
```

## Dependencies

- React 19.2.1 - UI framework
- TypeScript 5.8.2 - Type safety
- Vite 6.2.0 - Build tool & dev server
- Tailwind CSS - Styling (via CDN)
- Lucide React - Icons

## Features

✨ **Beautiful pastel design**
📱 **Mobile-optimized touch controls**
🎨 **Smooth animations**
⚡ **Fast development with HMR**
🔒 **Type-safe with TypeScript**

## Ports

- **Dev Server:** 3000
- **WebSocket Proxy:** 8080
- **C Game Server:** 50000

## Full Documentation

See `../PASTEL_UI_INTEGRATION.md` for complete integration guide, troubleshooting, and customization options.
