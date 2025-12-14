# Docker Verification & Testing Guide

This document helps you verify that your Docker setup works correctly before sharing with your friend.

## Pre-Flight Checklist

### ✅ Windows System Check
- [ ] Docker Desktop installed
- [ ] Docker Desktop running (whale icon in taskbar)
- [ ] WSL 2 enabled (Docker Desktop should show this in Settings)
- [ ] At least 4GB RAM available for Docker
- [ ] At least 10GB free disk space

### ✅ Repository Check
- [ ] `docker-compose.yml` exists in root
- [ ] `docker/` folder contains: `server/`, `proxy/`, `web/` with Dockerfiles
- [ ] `websocket-proxy.js` exists in root
- [ ] `src/` folder contains C source code
- [ ] `web-react/` folder exists with React files

Run this in PowerShell to verify:
```powershell
# Check critical files
Test-Path docker-compose.yml
Test-Path docker/server/Dockerfile
Test-Path docker/proxy/Dockerfile
Test-Path docker/web/Dockerfile
Test-Path websocket-proxy.js
```

All should return `True`.

---

## Build Verification

### Step 1: Clean Build
```powershell
# Remove old containers and images
docker-compose down -v

# Build fresh images
docker-compose build --no-cache
```

**Expected Output**:
- `[+] Building X.X s` for each service
- `[+] FINISHED` at the end
- No error messages (warnings are OK)

**Time**: 3-5 minutes on first run

### Step 2: Check Images Were Built
```powershell
docker images | findstr dots_
```

**Expected Output**:
```
dotsandboxes-server    latest    ...
dotsandboxes-proxy     latest    ...
dotsandboxes-web       latest    ...
```

If you see these three images, ✅ build succeeded.

---

## Service Startup Verification

### Step 1: Start Services
```powershell
docker-compose up
```

**Expected Output** (in order):
1. Services starting messages
2. Server initializes
3. Proxy prints: `🌐 WebSocket proxy listening on ws://0.0.0.0:8080`
4. Web service prints nginx startup messages

### Step 2: Network Connectivity Test
Open a **new PowerShell window** and test each service:

```powershell
# Test Web Service (port 80)
(Invoke-WebRequest -Uri http://localhost -UseBasicParsing).StatusCode

# Test Proxy Service (port 8080)
Test-NetConnection -ComputerName localhost -Port 8080

# Test Server Service (port 50000)
Test-NetConnection -ComputerName localhost -Port 50000 -InformationLevel Detailed
```

**Expected Results**:
- Web: `200` (HTTP status code)
- Proxy: `TcpTestSucceeded: True`
- Server: `TcpTestSucceeded: True`

---

## Browser Verification

### Step 1: Load Web Interface
1. Open browser to `http://localhost`
2. You should see the game board with dots and lines

**If blank page**:
- Check browser console (F12)
- Look for errors about WebSocket or network
- Check `docker-compose logs web`

### Step 2: Test WebSocket Connection
Open browser console (F12) and run:
```javascript
const ws = new WebSocket('ws://localhost:8080');
ws.onopen = () => console.log('✅ Connected to proxy');
ws.onerror = () => console.log('❌ Connection failed');
ws.onmessage = (msg) => console.log('Message:', msg.data);
```

**Expected**: Should see "✅ Connected to proxy" immediately

---

## Functional Testing

### Test 1: Single Player Local Test
1. Open browser to `http://localhost`
2. Login with username `test1`
3. Create new game
4. Try clicking on box edges
5. Line should turn dark gray when clicked

### Test 2: Two-Player Network Test
1. Open `http://localhost` in two browser windows
2. Player 1: Login as `player1`, create game
3. Player 2: Login as `player2`, join game
4. Take turns clicking lines
5. Boxes should fill when completed
6. Scores should update

### Test 3: Mobile Testing
1. Find your PC's IP address:
```powershell
ipconfig
# Look for "IPv4 Address" under network adapter (e.g., 192.168.1.50)
```

2. On your phone (same WiFi):
   - Open browser
   - Go to `http://YOUR_IP` (e.g., `http://192.168.1.50`)
   - Test that you can click box edges

**Expected**: Box edges should be clickable with larger touch area

---

## Log Verification

### Check Server Logs
```powershell
docker-compose logs server -f
```

**Expected**: Should show server startup messages and game events

**Bad signs**:
- Segmentation fault
- Cannot bind to port
- Compilation errors

### Check Proxy Logs
```powershell
docker-compose logs proxy -f
```

**Expected**: 
- `WebSocket proxy listening on ws://0.0.0.0:8080`
- Connection messages when players join
- Message forwarding logs

**Bad signs**:
- Cannot connect to TCP server
- Port already in use

### Check Web Logs
```powershell
docker-compose logs web -f
```

**Expected**: Nginx startup and access logs

---

## Docker System Health Check

### Memory Usage
```powershell
docker stats --no-stream
```

**Expected**: 
- Total memory < 2GB (unless you have many players)
- CPU < 20% at idle

### Container Status
```powershell
docker ps
```

**Expected**: All three containers should show `Up`:
```
CONTAINER ID   STATUS
...            Up 5 minutes
...            Up 5 minutes
...            Up 5 minutes
```

---

## Stress Testing (Optional)

### Test High Load
Simulate multiple players rapidly:

```powershell
# Run this in the scripts directory or create test file
node test_ws_clients.js
```

**Expected**: Game handles multiple connections without crashing

---

## Troubleshooting Checklist

| Issue | Check | Fix |
|-------|-------|-----|
| Port 80 already in use | `netstat -ano \| findstr :80` | Stop conflicting service or use different port |
| Docker daemon not running | Whale icon in taskbar | Start Docker Desktop |
| Build fails | `docker-compose logs` | Run `docker-compose down -v` then rebuild |
| Can't connect to proxy | `docker ps` verify all running | Restart: `docker-compose down` then `docker-compose up` |
| Web page blank | Browser console (F12) | Check for WebSocket errors, verify proxy running |
| Lines won't register on mobile | Responsive design test | Touch hit detection threshold may need adjustment |

---

## Pre-Share Checklist

Before sharing with your friend, verify:

- [ ] Web interface loads at `http://localhost`
- [ ] Game board displays correctly
- [ ] Can click lines on desktop (hover works)
- [ ] Can click lines on mobile (touch works)
- [ ] Login system works
- [ ] Can create game
- [ ] Can join game with second player
- [ ] All three containers running: `docker ps`
- [ ] All three images exist: `docker images | findstr dots_`
- [ ] No error messages in: `docker-compose logs`

---

## Share Instructions for Your Friend

Give your friend:
1. The entire `dotsandboxes` folder
2. `DOCKER_QUICK_START_WINDOWS.md` (quick start guide)
3. `DOCKER_SETUP.md` (detailed reference)

They just need to:
1. Install Docker Desktop
2. Run `docker-compose up`
3. Open `http://localhost`

---

## Advanced Debugging

### View Raw TCP Traffic (Advanced)
```powershell
# Install Wireshark from https://www.wireshark.org/
# Or use tcpdump in WSL2:
# Run in WSL terminal:
sudo tcpdump -i eth0 -n 'port 8080 or port 50000'
```

### Access Container Shell
```powershell
# Access server container
docker exec -it dots_server /bin/bash

# Access proxy container  
docker exec -it dots_proxy /bin/sh

# Access web container
docker exec -it dots_web /bin/sh
```

### Rebuild Just One Service
```powershell
# Rebuild only proxy after code changes
docker-compose build proxy --no-cache
docker-compose up -d proxy
```

---

## Performance Benchmarks

Expected performance on Windows 10/11 with Docker Desktop:

| Operation | Time | Notes |
|-----------|------|-------|
| Cold build | 3-5 min | First time only |
| Warm build | 30-60 sec | With cached layers |
| Container startup | 5-10 sec | All services ready |
| Web page load | 1-2 sec | React + Vite optimized |
| Game connection | <500ms | WebSocket handshake |
| Move processing | <100ms | C server is fast |
| Two-player sync | <200ms | Over WebSocket |

If significantly slower, check:
- Available RAM (Docker needs 4GB+)
- CPU usage (might be other processes)
- Network latency (if on different network)

---

## Next Steps

✅ All tests passed? Ready to share!

If issues remain:
1. Check `DOCKER_SETUP.md` troubleshooting section
2. Review `docker-compose logs` output
3. Ensure all files are present in repository

---

**Last Updated**: December 2024
