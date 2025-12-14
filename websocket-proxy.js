// WebSocket to TCP Proxy
// This bridges WebSocket connections from browser to your C TCP server

const WebSocket = require('ws');
const net = require('net');

const WS_PORT = process.env.WS_PORT ? parseInt(process.env.WS_PORT) : 8080;
const TCP_HOST = process.env.TCP_HOST || 'localhost';
const TCP_PORT = process.env.TCP_PORT ? parseInt(process.env.TCP_PORT) : 50000;

const wss = new WebSocket.Server({ port: WS_PORT });

console.log(`🌐 WebSocket proxy listening on ws://0.0.0.0:${WS_PORT}`);
console.log(`🔌 Forwarding to TCP server at ${TCP_HOST}:${TCP_PORT}`);
console.log('');

wss.on('connection', (ws) => {
    const remote = ws._socket && ws._socket.remoteAddress ? ws._socket.remoteAddress : 'unknown';
    console.log('✅ WebSocket client connected from', remote);
    
    // Create TCP connection to your C server
    const tcpClient = net.createConnection({ host: TCP_HOST, port: TCP_PORT }, () => {
        console.log('✅ Connected to TCP server');
    });
    
    // Forward WebSocket messages to TCP
    ws.on('message', (data) => {
        console.log('WS → TCP:', data.toString());
        tcpClient.write(data);
    });
    
    // Forward TCP messages to WebSocket
    tcpClient.on('data', (data) => {
        console.log('TCP → WS:', data.toString());
        ws.send(data.toString());
    });
    
    // Handle disconnections
    ws.on('close', () => {
        console.log('❌ WebSocket client disconnected', remote);
        tcpClient.end();
    });
    
    tcpClient.on('close', () => {
        console.log('❌ TCP connection closed');
        ws.close();
    });
    
    // Handle errors
    ws.on('error', (err) => {
        console.error('WebSocket error from', remote, ':', err && err.message);
    });
    
    tcpClient.on('error', (err) => {
        // Print full error object for diagnostics
        console.error('TCP error (proxy ->', TCP_HOST + ':' + TCP_PORT, ') for ws client', remote, ':', (err && err.message) || err);
        // forward an error message to the ws client if it's open
        try {
            if (ws && ws.readyState === ws.OPEN) {
                ws.send(JSON.stringify({op:'ERROR', msg:'Proxy TCP error: ' + ((err && err.message) || 'unknown')}) + '\n');
            }
        } catch (e) {}
    });
});

console.log('Waiting for connections...');