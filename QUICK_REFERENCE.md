# 🎮 Dots & Boxes - Quick Reference Card

## 🚀 Super Quick Start

```bash
# One command to start everything
./start-all.sh
```

Then open: `http://localhost:3000`

---

## 📦 First Time Setup

```bash
cd web-react
./setup.sh
```

---

## 🎯 Manual Start (3 terminals)

### Terminal 1: C Server
```bash
./server
```

### Terminal 2: WebSocket Proxy
```bash
node websocket-proxy.js
```

### Terminal 3: React UI
```bash
cd web-react
npm run dev
```

---

## 🌐 Access URLs

- **On your computer:** `http://localhost:3000`
- **On your phone:** `http://192.168.x.x:3000` (use your IP)

**Find your IP:**
```bash
hostname -I | awk '{print $1}'
```

---

## 🔧 Useful Commands

### Build C Server
```bash
make build
```

### Rebuild Everything
```bash
make clean && make build
```

### Production Build (React)
```bash
cd web-react
npm run build
# Output in dist/
```

### Check What's Running
```bash
ss -ltnp | grep -E '3000|8080|50000'
```

### Kill Stuck Ports
```bash
lsof -ti:3000 | xargs kill -9
lsof -ti:8080 | xargs kill -9
lsof -ti:50000 | xargs kill -9
```

---

## 📂 Key Files

### Documentation
- `PASTEL_UI_INTEGRATION.md` - Complete guide
- `MIGRATION_SUMMARY.md` - What changed
- `web-react/README.md` - React app guide

### Scripts
- `start-all.sh` - Start everything
- `web-react/setup.sh` - Install dependencies

### Configuration
- `web-react/vite.config.ts` - Dev server config
- `websocket-proxy.js` - Proxy settings
- `include/common.h` - C server port

---

## 🐛 Troubleshooting

### "Cannot connect"
1. Check all 3 services running: `ps aux | grep -E 'server|proxy|vite'`
2. Check ports open: `ss -ltnp | grep -E '3000|8080|50000'`
3. Check firewall: `sudo ufw status`

### "Room full"
- Server allows max 2 players per room
- Create a new room with different ID

### Phone can't connect
- Use server's LAN IP (not localhost)
- Ensure same Wi-Fi network
- Check router AP isolation is OFF

---

## 🎨 Customization

### Change Colors
Edit `web-react/index.html`:
```javascript
colors: {
  pastel: {
    p1: '#ff8fab',     // Player 1 pink
    p2: '#8ecae6',     // Player 2 blue
  }
}
```

### Change Ports
- **React dev:** `web-react/vite.config.ts`
- **WebSocket:** `websocket-proxy.js` line 3
- **C Server:** `include/common.h` SERVER_PORT (rebuild needed)

---

## 📊 Ports Reference

| Service | Port | Protocol |
|---------|------|----------|
| React Dev | 3000 | HTTP |
| WebSocket Proxy | 8080 | WS |
| C Game Server | 50000 | TCP |

---

## 🎓 Learn More

- Vite: https://vite.dev/
- React: https://react.dev/
- TypeScript: https://typescriptlang.org/
- Tailwind: https://tailwindcss.com/

---

## 💡 Tips

- Use `Ctrl+C` to stop `start-all.sh` (stops all services)
- Dev server auto-reloads on file changes
- Check browser console (F12) for errors
- C server logs to stdout (terminal)

---

## 🏆 Next Steps

1. ✅ Run `./start-all.sh`
2. ✅ Test locally at `localhost:3000`
3. ✅ Test on phone using LAN IP
4. 🎨 Customize colors
5. 🚀 Deploy to production

---

**Need help?** Check `PASTEL_UI_INTEGRATION.md` for detailed guide!
