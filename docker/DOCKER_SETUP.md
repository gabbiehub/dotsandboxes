# Docker Setup Guide - Dots and Boxes Game

This document explains how the Docker setup works and how to run it on Windows and other platforms.

## Overview

The application is containerized using Docker and docker-compose with three main services:

1. **Server** - C-based game server (port 50000)
2. **Proxy** - WebSocket proxy to bridge TCP and WebSocket (port 8080)
3. **Web** - React web interface (port 80)

## Architecture Diagram

```
┌─────────────────────────────────────────────────────┐
│            Client Browser (Web-React)               │
│         Accessible at: http://localhost              │
└─────────────┬───────────────────────────────────────┘
              │
              │ WebSocket (ws://localhost:8080)
              ▼
┌─────────────────────────────────────────────────────┐
│      Proxy Service (Node.js WebSocket Server)        │
│      Port: 8080 (Inside Container Network)          │
│      Bridges WebSocket ↔ TCP Protocol               │
└─────────────┬───────────────────────────────────────┘
              │
              │ TCP Port 50000 (Internal Network)
              ▼
┌─────────────────────────────────────────────────────┐
│     Server Service (C Game Engine)                   │
│     Port: 50000 (Inside Container Network)          │
│     - Game Logic                                     │
│     - Player Management                              │
│     - State Broadcasting                             │
└─────────────────────────────────────────────────────┘
```

## Prerequisites

### Windows
1. **Docker Desktop for Windows**
   - Download: https://www.docker.com/products/docker-desktop
   - Installation: Follow the official installer
   - Ensure WSL 2 (Windows Subsystem for Linux 2) is installed
   - **Important**: Start Docker Desktop before running commands

2. **Git for Windows** (Optional, for cloning the repository)

### macOS
1. **Docker Desktop for Mac**
   - Download: https://www.docker.com/products/docker-desktop
   - Installation: Follow the official installer

### Linux
1. **Docker Engine**: `sudo apt-get install docker.io`
2. **Docker Compose**: `sudo apt-get install docker-compose`

## Installation Steps

### 1. Clone or Extract the Repository

```bash
# If you have git installed
git clone <repository-url>
cd dotsandboxes

# Or extract the zip file and navigate to the directory
```

### 2. Build the Docker Images

Navigate to the repository root directory and run:

```bash
docker-compose build
```

This will:
- Build the C server from source
- Build the Node.js proxy service
- Build the web interface (React with Vite)

**Note**: This may take 2-5 minutes on first run as it downloads base images and dependencies.

### 3. Start the Services

```bash
docker-compose up
```

**Success indicators**:
- You should see output from three services: `dots_server`, `dots_proxy`, `dots_web`
- The proxy should show: `Listening on ws://0.0.0.0:8080`
- The server should initialize and be ready for connections

### 4. Access the Game

Open your browser and navigate to:
```
http://localhost
```

The web interface will load and you can start playing!

## Service Details

### Server Service (`dots_server`)
- **Port**: 50000 (internal to container network)
- **Language**: C
- **Purpose**: Core game logic and state management
- **Build**: Compiled from source using `Makefile`
- **Base Image**: `ubuntu:22.04`
- **Dependencies**: libwebsockets-dev, libjson-c-dev

### Proxy Service (`dots_proxy`)
- **Port**: 8080 (exposed to host)
- **Language**: Node.js (JavaScript)
- **Purpose**: Converts WebSocket connections to TCP for server communication
- **File**: `websocket-proxy.js`
- **Environment Variables**:
  - `TCP_HOST=server` (Docker service name)
  - `TCP_PORT=50000` (Server port)
  - `WS_PORT=8080` (WebSocket port)

### Web Service (`dots_web`)
- **Port**: 80 (exposed to host)
- **Language**: TypeScript/React
- **Purpose**: User interface
- **Framework**: React with Vite
- **Base Image**: Node.js official image
- **Build Output**: Served via Nginx

## Networking

The three services communicate via Docker's internal bridge network (`dots_net`):

```
┌──────────────────────────────────┐
│       Docker Bridge Network      │
│          (dots_net)              │
│                                  │
│  ┌─────────┐  ┌─────────┐       │
│  │ server  │  │  proxy  │       │
│  └────┬────┘  └────┬────┘       │
│       │ TCP        │ WS          │
│       └─────────────┘            │
│                                  │
│        (No direct access)        │
└──────────────────────────────────┘
         ▲
         │ Port mapping to host
    ┌────┴────┐
    │   web   │ (port 80)
    └────┬────┘
         │
    Local Machine
```

## Windows-Specific Notes

### WSL 2 Integration
- Docker Desktop on Windows uses **WSL 2 backend** by default
- This provides better performance and stability
- Files in WSL file system (`\\wsl$\`) are faster than Windows directories

### File Paths
- Use forward slashes or backslashes in terminal commands
- Both work in PowerShell and Command Prompt

### Ports on Windows
- Port 80, 8080, 50000 are bound to `localhost` (127.0.0.1)
- Access via: `http://localhost` or `http://127.0.0.1`

### Firewall
- Windows Firewall may prompt on first run
- Allow Docker Desktop and Node.js services

### Performance
- First build: ~3-5 minutes
- Subsequent builds: ~30-60 seconds (cached layers)
- Runtime: Should be smooth with minimal latency

## Common Commands

### Start Services (with logs visible)
```bash
docker-compose up
```

### Start Services in Background
```bash
docker-compose up -d
```

### Stop Services
```bash
docker-compose down
```

### View Logs from a Specific Service
```bash
docker-compose logs -f server      # Follow C server logs
docker-compose logs -f proxy       # Follow proxy logs
docker-compose logs -f web         # Follow web server logs
```

### Rebuild Images (after code changes)
```bash
docker-compose build --no-cache
docker-compose up
```

### Remove All Containers and Images
```bash
docker-compose down -v
docker system prune -a
```

## Troubleshooting

### Port Already in Use
If you get "port already in use" error:

**Windows PowerShell**:
```powershell
# Find what's using port 80
Get-NetTCPConnection -LocalPort 80 | Select-Object -Property State, OwningProcess
# Kill process (replace PID with the process ID)
Stop-Process -Id <PID> -Force
```

**Linux/Mac**:
```bash
# Find what's using port 80
lsof -i :80
# Kill process
kill -9 <PID>
```

Or use a different port by editing `docker-compose.yml`:
```yaml
web:
  ports:
    - "3000:80"  # Access via http://localhost:3000
```

### Docker Desktop Not Running (Windows)
- Open Docker Desktop application from Start Menu
- Wait for it to fully load before running docker commands

### Services Keep Restarting
- Check logs: `docker-compose logs`
- Common causes:
  - Server compilation failed
  - Port conflicts
  - Network issues
- Solution: `docker-compose down` then `docker-compose build --no-cache`

### Can't Connect to Proxy (WebSocket Error)
- Ensure proxy service started: `docker-compose logs proxy`
- Verify port 8080 is accessible
- Check network connectivity between containers

### Web Page Loads But Game Won't Connect
- Check browser console for errors (F12)
- Verify WebSocket URL points to `ws://localhost:8080`
- Ensure server service is running: `docker-compose logs server`

## Deployment to Friend's Windows PC

### Step 1: Prepare the Package
```bash
# Clone/copy the entire repository to friend's PC
# Include all files, especially:
# - docker-compose.yml
# - Dockerfile files in docker/ directory
# - All source code in src/
# - Web files in web-react/
```

### Step 2: Your Friend Should:
1. Install Docker Desktop for Windows
2. Start Docker Desktop
3. Open PowerShell/Command Prompt in the repository directory
4. Run: `docker-compose build`
5. Run: `docker-compose up`
6. Open browser to `http://localhost`

### Step 3: Network Considerations
- Local Network Play: Both PCs must be on same network
- To expose to network (not recommended for internet):
  - Edit `docker-compose.yml`
  - Change `- "80:80"` to `- "0.0.0.0:80:80"` (web service)
  - Friend accesses via your PC's IP: `http://YOUR_IP`

## Performance Expectations

| Operation | Time |
|-----------|------|
| First build (clean) | 3-5 minutes |
| Rebuild (cached) | 30-60 seconds |
| Server startup | 2-3 seconds |
| Web page load | 1-2 seconds |
| Game connection | <1 second |
| Line placement response | <100ms |

## File Structure in Containers

```
Server Container:
/src/                    # Repository code
├── src/server/main.c    # Server entry point
├── src/server/server.c  # Server implementation
├── src/server/game.c    # Game logic
└── Makefile

Proxy Container:
/app/                    # Proxy code
├── websocket-proxy.js   # Main proxy file
└── node_modules/        # Dependencies

Web Container:
/app/                    # Web application
├── build/               # Compiled React output
└── Served by Nginx      # On port 80
```

## Security Notes

⚠️ **For Development Only** ⚠️

Current setup:
- No authentication
- No encryption (except HTTPS headers)
- Services accessible to anyone on the network

For production deployment:
- Add authentication layer
- Use SSL/TLS certificates
- Implement rate limiting
- Use Docker secrets for sensitive data

## Environment Variables

The proxy service uses these environment variables:

```
TCP_HOST=server      # Docker service name (resolves to container IP)
TCP_PORT=50000       # Server listening port
WS_PORT=8080         # WebSocket port
```

These are set in `docker-compose.yml` and don't require user configuration.

## Additional Resources

- Docker Documentation: https://docs.docker.com/
- Docker Compose Documentation: https://docs.docker.com/compose/
- WebSockets: https://developer.mozilla.org/en-US/docs/Web/API/WebSocket

## Support

If you encounter issues:

1. Check the logs: `docker-compose logs`
2. Verify Docker Desktop is running
3. Ensure no port conflicts
4. Try a clean rebuild: `docker-compose down -v && docker-compose build --no-cache`
5. Check that the repository has all required files

---

**Last Updated**: December 2024
**Tested On**: Windows 10/11, macOS 12+, Ubuntu 20.04+
