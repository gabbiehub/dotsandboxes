# Dots & Boxes — Docker compose

This document explains how to run the Dots & Boxes stack using Docker Compose, and provides alternatives for running the services locally.

## Services
- `server` — C TCP server (built inside container)
- `proxy` — Node WebSocket → TCP proxy (for browser → C server bridging)
- `web`   — React frontend (served by nginx)

## Quick start (recommended)
Prerequisites:
- Docker Desktop (Windows / macOS) or Docker Engine (Linux)
- `docker compose` available on your PATH

1. Build and start the stack:

```bash
# from repository root
docker compose up --build -d
```

2. Open the frontend in a browser (on the host machine or another device on the same LAN):

- Local:  http://localhost/
- Network: http://<host-ip>/  (e.g. http://192.168.1.5/)

The WebSocket proxy listens on port `8080` inside the host and forwards to the C server on port `50000`.

## Development (non-Docker)
If you prefer to run the services manually for development:

1. Build and run the C server (Linux):

```bash
make clean && make
./server
```

2. Run the proxy (Node):

```bash
node websocket-proxy.js
```

3. Frontend (React / Vite):

```bash
cd web-react
npm install
npm run dev
```

## Windows notes
- On Windows, use **Docker Desktop** (WSL2 backend recommended). The containers will be reachable at your machine's LAN IP.
- If you choose not to use Docker, install WSL2 (Ubuntu) and follow the Linux development steps inside WSL.

## Firewall and connectivity
- If you want devices on your LAN (phones) to reach the server/proxy hosted on your machine, ensure Windows/macOS firewall allows inbound connections on ports `80` and `8080`.

## Troubleshooting
- If Vite fails with `Failed to resolve import` errors, run `npm install` inside `web-react/` to install dependencies.
- If containers fail to build because system packages are missing, ensure your Docker environment can reach external APT/NPM repositories.

## Notes
- The Dockerfile for the server compiles the C code from the repository. The first build may take several minutes.
- The compose stack exposes services to the host; be careful when exposing services to untrusted networks.
