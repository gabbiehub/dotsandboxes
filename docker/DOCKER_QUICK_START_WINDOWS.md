# Docker Setup for Windows - Quick Start Guide

## 5-Minute Setup

### Step 1: Install Docker Desktop (5 min)
1. Download Docker Desktop for Windows: https://www.docker.com/products/docker-desktop
2. Run the installer and follow prompts
3. When asked about WSL 2, select **YES**
4. Restart your PC when prompted
5. Start Docker Desktop from Start Menu (you'll see a whale icon in taskbar)

### Step 2: Run the Game (2 min)
1. Extract the `dotsandboxes` folder to your desired location
2. Open **PowerShell** (right-click on folder, "Open with PowerShell")
3. Copy and paste this command:
```powershell
docker-compose up
```

4. Wait for all services to start (look for "Listening on ws://0.0.0.0:8080")
5. Open your browser to: **http://localhost**

**That's it!** 🎮

---

## If Something Goes Wrong

### "Docker is not installed"
- You need to install Docker Desktop: https://www.docker.com/products/docker-desktop
- Make sure you completed the restart step

### "Port 80 is already in use"
```powershell
# Find the process using port 80
Get-NetTCPConnection -LocalPort 80 | Select-Object -Property State, OwningProcess

# Stop it (replace 1234 with the process ID number)
Stop-Process -Id 1234 -Force
```

Then try `docker-compose up` again.

### "Cannot connect to Docker daemon"
1. Check if Docker Desktop is running (look for whale icon in taskbar)
2. If not, open Docker Desktop from Start Menu
3. Wait 30 seconds for it to fully load

### "Error building server"
This is normal if you're missing build tools. Let Docker handle it automatically. It may take 5+ minutes on first run.

---

## Share with Your Friend

Your friend on Windows just needs to:
1. Install Docker Desktop (same as Step 1 above)
2. Extract your `dotsandboxes` folder
3. Run `docker-compose up` in PowerShell
4. Open **http://localhost** in browser

---

## Useful Commands

Stop the game:
```powershell
docker-compose down
```

Restart after code changes:
```powershell
docker-compose build
docker-compose up
```

View detailed logs:
```powershell
docker-compose logs
```

View logs from just the server:
```powershell
docker-compose logs server -f
```

---

## What's Running Behind the Scenes

```
Your Browser
    ↓
http://localhost (Web Interface - React/Vite)
    ↓
WebSocket Connection (ws://localhost:8080)
    ↓
Proxy Server (Node.js)
    ↓
Game Server (C/TCP)
    ↓
Game Logic & Player State
```

Each part runs in its own Docker container, completely isolated.

---

## Accessing from Another PC on Same Network

Add this to `docker-compose.yml` in the `web` section:

```yaml
web:
  ports:
    - "0.0.0.0:80:80"  # Changed this line
  # ... rest of config
```

Then:
1. Find your PC's IP: Open PowerShell and run `ipconfig` (look for "IPv4 Address")
2. Your friend enters: `http://YOUR_IP` (e.g., `http://192.168.1.50`)

---

**Questions?** Check `DOCKER_SETUP.md` for detailed documentation.
