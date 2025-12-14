## Overview
This guide explains how to integrate the **Pastel Dots & Boxes** React/TypeScript UI into your existing C server + WebSocket proxy architecture.

The pastel UI is a modern, mobile-friendly React application with:
- Beautiful pastel color scheme (pink & blue)
- Smooth animations and transitions
- Touch-optimized canvas-based game board
- Responsive design that works on phones and desktops
- TypeScript for type safety

## Architecture

```
┌─────────────────────┐
│  React Frontend     │  (Port 3000 dev, or static build)
│  TypeScript + Vite  │
└──────────┬──────────┘
           │ WebSocket (ws://host:8080)
           │
┌──────────▼──────────┐
│  WebSocket Proxy    │  (Port 8080)
│  Node.js            │
└──────────┬──────────┘
           │ TCP
           │
┌──────────▼──────────┐
│  C Game Server      │  (Port 50000)
│  Game Logic         │
└─────────────────────┘
```

**Key point:** The C server and WebSocket proxy remain unchanged. We're only replacing the frontend.

## What Changes?

### Stays the Same ✅
- C server on TCP port 50000
- WebSocket proxy on port 8080
- Protocol: newline-delimited JSON messages
- Operations: LOGIN, CREATE_ROOM, JOIN_ROOM, GAME_STATE, PLACE_LINE, etc.

### Changes 🔄
- Replace `web/` vanilla HTML/JS/CSS with React/TypeScript app
- Use Vite as the build tool and dev server
- Add TypeScript for type-safe development
- Use Tailwind CSS for styling (via CDN in production or as dependency)

### Removed ❌
- `web/index.html` (old vanilla version)
- `web/game.js` (replaced by React components)
- `web/style.css` (replaced by Tailwind inline styles)

### Added ✨
- React components (`App.tsx`, `GameBoard.tsx`, `Button.tsx`)
- TypeScript types (`types.ts`)
- Game service for WebSocket management (`services/gameService.ts`)
- Vite build configuration
- Modern development workflow with hot module reload

---

## Installation Steps

### Prerequisites
- **Node.js** (v18 or higher recommended)
- **npm** or **yarn**
- Existing C server must be built (`make build`)

### Step 1: Install Dependencies

Navigate to the new React app directory:
```bash
cd web-react
npm install
```

This installs:
- `react` (19.2.1) - UI framework
- `react-dom` (19.2.1) - DOM rendering
- `lucide-react` (0.555.0) - Icon library
- `vite` (6.2.0) - Build tool and dev server
- `@vitejs/plugin-react` (5.0.0) - React support for Vite
- `typescript` (~5.8.2) - Type checking
- `@types/node` (22.14.0) - Node.js types

### Step 2: Verify File Structure

The new React app should be in `web-react/` with this structure:
```
web-react/
├── index.html              # Entry HTML (loads Tailwind CDN and React)
├── index.tsx               # React entry point (mounts App)
├── App.tsx                 # Main app component (screens: login, lobby, game)
├── types.ts                # TypeScript interfaces
├── vite.config.ts          # Vite configuration
├── tsconfig.json           # TypeScript configuration
├── package.json            # Dependencies
├── components/
│   ├── Button.tsx          # Reusable button component
│   └── GameBoard.tsx       # Canvas-based game board
└── services/
    └── gameService.ts      # WebSocket connection manager
```

---

## Development Workflow

### Run the Full Stack

You need **4 terminals** running simultaneously:

#### Terminal 1: C Server
```bash
# From repository root
./server
# or
make run-server
```
Expected output: `Server listening on port 50000`

#### Terminal 2: WebSocket Proxy
```bash
# From repository root
node websocket-proxy.js
```
Expected output: `WebSocket proxy listening on port 8080`

#### Terminal 3: React Dev Server
```bash
# From web-react directory
cd web-react
npm run dev
```
Expected output: 
```
VITE v6.2.0  ready in 500 ms
➜  Local:   http://localhost:3000/
➜  Network: http://192.168.x.x:3000/
```

#### Terminal 4: (Optional) Watch Server Build
If you're making changes to the C server:
```bash
# From repository root
make build && ./server
```

### Access the Game

**On the same machine:**
- Open browser to `http://localhost:3000`
- Server URL should auto-fill to `ws://localhost:8080`

**On other devices (phone/tablet on same Wi-Fi):**
1. Find your server's LAN IP:
   ```bash
   ip route get 1.1.1.1
   # Look for 'src 192.168.x.x'
   ```
2. Open browser to `http://192.168.x.x:3000`
3. Server URL will auto-fill to `ws://192.168.x.x:8080` ✨

---

## Production Build

### Build for Production

```bash
cd web-react
npm run build
```

This creates optimized static files in `web-react/dist/`:
```
dist/
├── index.html
├── assets/
│   ├── index-[hash].js
│   └── index-[hash].css
└── ...
```

### Deployment Options

#### Option A: Replace Old `web/` Folder (Simple)
```bash
# Backup old web folder
mv web web-backup

# Copy production build
cp -r web-react/dist web

# Serve with Python (for testing)
python3 -m http.server 8000 --directory web
```
Access at `http://<server-ip>:8000`

#### Option B: Serve from `web-react/dist` (Keep Both)
```bash
# Serve the production build directly
python3 -m http.server 8000 --directory web-react/dist
```

#### Option C: Use Nginx (Production Recommended)
```nginx
# /etc/nginx/sites-available/dotsandboxes
server {
    listen 80;
    server_name your-domain.com;
    
    root /home/liby30/Desktop/dotsandboxes/web-react/dist;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # WebSocket proxy
    location /ws {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

Enable and restart:
```bash
sudo ln -s /etc/nginx/sites-available/dotsandboxes /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## Configuration

### Environment Variables (Optional)

Create `web-react/.env.local`:
```env
# Not needed for this app, but available if you want to add features
VITE_WS_URL=ws://localhost:8080
```

Access in code:
```typescript
const wsUrl = import.meta.env.VITE_WS_URL || `ws://${window.location.hostname}:8080`;
```

### Customize Server Ports

If you need to change ports, update:

1. **C Server Port** (`include/common.h`):
   ```c
   #define SERVER_PORT 50000  // Change this
   ```
   Rebuild: `make build`

2. **WebSocket Proxy Port** (`websocket-proxy.js`):
   ```javascript
   const WS_PORT = 8080;        // Change this
   const TCP_PORT = 50000;      // Match C server
   ```

3. **React Dev Server Port** (`web-react/vite.config.ts`):
   ```typescript
   server: {
     port: 3000,  // Change this
   }
   ```

4. **Update Auto-Fill Logic** (`web-react/App.tsx`):
   ```typescript
   const [serverUrl, setServerUrl] = useState(
     `ws://${window.location.hostname || 'localhost'}:8080`  // Update port
   );
   ```

---

## Troubleshooting

### Issue: "Cannot connect to server"
**Check:**
1. Is C server running? `ps aux | grep server`
2. Is WebSocket proxy running? `ps aux | grep websocket-proxy`
3. Is firewall blocking ports? `sudo ufw status`
4. Correct server URL? Should be `ws://` not `http://`

**Test connectivity:**
```bash
# Test TCP server
nc -zv localhost 50000

# Test WebSocket proxy
curl -i -N -H "Connection: Upgrade" -H "Upgrade: websocket" http://localhost:8080
```

### Issue: "Room full" or unexpected errors
**Check server logs** - errors are printed to stdout by the C server.

**Common causes:**
- Room already has 2 players
- Invalid room ID characters
- Server crashed (check with `ps`)

### Issue: Canvas not rendering
**Check browser console** for JavaScript errors.

**Verify:**
- GameBoard component received valid `gameState` prop
- Canvas element exists in DOM
- No TypeScript type errors (run `npm run build` to check)

### Issue: Hover/click not working
**Cause:** Mouse/touch event coordinates not scaled properly.

**Fix:** `GameBoard.tsx` already handles scaling:
```typescript
const scaleX = CANVAS_SIZE / rect.width;
const scaleY = CANVAS_SIZE / rect.height;
const mouseX = (e.clientX - rect.left) * scaleX;
```

### Issue: Phone can't connect
**Ensure:**
1. Phone and server on same Wi-Fi network
2. Using server's LAN IP, not `localhost`
3. Router AP isolation is OFF (check router settings)
4. Firewall allows port 8080 incoming

**Test from phone:**
```bash
# On server machine
ip addr show | grep inet

# From phone browser, test proxy
http://192.168.x.x:8080
# Should show "Cannot GET /" - that's OK, means proxy is reachable
```

---

## Protocol Reference

The React app uses the exact same protocol as your C server. No changes needed to server code.

### Client → Server Messages

```typescript
// Login
{ op: 'LOGIN', user: 'username' }

// Create room
{ op: 'CREATE_ROOM', room_id: 'room1' }

// Join room
{ op: 'JOIN_ROOM', room_id: 'room1' }

// Place line
{ op: 'PLACE_LINE', x: 2, y: 1, orientation: 'H' }  // H or V

// Ping (optional)
{ op: 'PING' }
```

### Server → Client Messages

```typescript
// Login success
{ op: 'LOGIN_OK' }

// Room joined
{ op: 'ROOM_JOINED', room_id: 'room1', player_num: 0 }

// Game starting
{ op: 'GAME_START', player2: 'opponent_name' }

// Game state update
{
  op: 'GAME_STATE',
  board: {
    horizontal: [[0,1,0,0], [1,0,0,1], [0,0,1,0]],
    vertical: [[1,0,0], [0,1,0], [0,0,1], [1,0,0]],
    boxes: [[-1,0,-1], [-1,1,-1], [0,-1,1]]
  },
  scores: [3, 2],
  turn: 0,  // 0 or 1
  game_over: false,
  winner: -1  // -1 (ongoing), 0 (player 1), 1 (player 2)
}

// Error
{ op: 'ERROR', msg: 'Room full' }

// Pong
{ op: 'PONG' }
```

**Format:** Each message is one JSON object followed by `\n` (newline).

---

## Customization

### Change Colors

Edit `web-react/index.html` Tailwind config:
```javascript
tailwind.config = {
  theme: {
    extend: {
      colors: {
        pastel: {
          p1: '#ff8fab',       // Player 1 color (pink)
          p1Light: '#ffe5ec',
          p2: '#8ecae6',       // Player 2 color (blue)
          p2Light: '#e0f4fc',
          // ... customize more
        }
      }
    }
  }
}
```

### Add Features

Want to add room listing, chat, or spectator mode?

1. **Add protocol ops** in C server (`src/server/server.c`)
2. **Update TypeScript types** (`web-react/types.ts`)
3. **Handle in gameService** (`web-react/services/gameService.ts`)
4. **Update UI** (`web-react/App.tsx`)

Example: Adding room list
```typescript
// types.ts
export interface RoomListMessage {
  op: 'ROOM_LIST';
  rooms: Array<{ id: string; players: number }>;
}

// App.tsx
if (msg.op === 'ROOM_LIST') {
  setRoomList(msg.rooms);
}
```

---

## Performance Tips

### Optimize Canvas Rendering

The current `GameBoard` re-renders on every `gameState` or `hoveredLine` change. For very large grids, consider:

1. **Memo-ize components:**
   ```typescript
   export default React.memo(GameBoard, (prev, next) => 
     prev.gameState === next.gameState && prev.isMyTurn === next.isMyTurn
   );
   ```

2. **Use requestAnimationFrame for hover:**
   ```typescript
   const rafRef = useRef<number>();
   const handleMouseMove = (e) => {
     if (rafRef.current) cancelAnimationFrame(rafRef.current);
     rafRef.current = requestAnimationFrame(() => {
       // ... update hover logic
     });
   };
   ```

3. **Offscreen canvas for static elements** (dots, filled boxes) - draw once, composite with hover layer.

### Reduce Bundle Size

If you want faster loads:

```bash
# Use production React (already happens in build)
npm run build

# Analyze bundle
npm install --save-dev rollup-plugin-visualizer
# Add to vite.config.ts plugins
```

Consider replacing Tailwind CDN with a built version to reduce external requests.

---

## Migration Checklist

- [ ] Install Node.js and npm
- [ ] Run `npm install` in `web-react/`
- [ ] Verify C server builds and runs (`./server`)
- [ ] Start WebSocket proxy (`node websocket-proxy.js`)
- [ ] Start React dev server (`npm run dev`)
- [ ] Test login → lobby → create/join room → gameplay
- [ ] Test on phone using LAN IP
- [ ] Build for production (`npm run build`)
- [ ] Deploy static files (choose option A, B, or C)
- [ ] Update documentation with your server IP
- [ ] (Optional) Setup nginx with SSL for internet access
- [ ] (Optional) Add room list feature
- [ ] (Optional) Persist game state / reconnection logic

---

## File Changes Summary

### Files to DELETE (old vanilla web UI):
```
web/index.html
web/game.js
web/style.css
```

### Files to ADD (new React app):
```
web-react/
├── index.html
├── index.tsx
├── App.tsx
├── types.ts
├── vite.config.ts
├── tsconfig.json
├── package.json
├── components/
│   ├── Button.tsx
│   └── GameBoard.tsx
└── services/
    └── gameService.ts
```

### Files UNCHANGED (keep as-is):
```
makefile
src/server/*
src/common/*
include/*
websocket-proxy.js
scripts/mock_tcp_server.js
```

---

## Support & Next Steps

### Quick Start Command Summary

```bash
# Terminal 1
./server

# Terminal 2
node websocket-proxy.js

# Terminal 3
cd web-react && npm install && npm run dev

# Browser
http://localhost:3000
```

### Useful Commands

```bash
# Check what's using ports
ss -ltnp | grep -E '3000|8080|50000'

# Kill a stuck process
lsof -ti:8080 | xargs kill -9

# Rebuild C server after changes
make clean && make build

# React type checking
cd web-react && npx tsc --noEmit

# Format React code (if prettier installed)
cd web-react && npx prettier --write .
```

---

## Additional Resources

- **Vite Docs:** https://vite.dev/
- **React Docs:** https://react.dev/
- **TypeScript Handbook:** https://www.typescriptlang.org/docs/
- **Tailwind CSS:** https://tailwindcss.com/docs
- **WebSocket API:** https://developer.mozilla.org/en-US/docs/Web/API/WebSocket

---

**You're all set!** 🎉

The pastel UI gives your game a modern, polished look while keeping all your existing C server logic intact. Happy coding!
