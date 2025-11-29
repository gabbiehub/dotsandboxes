// WebSocket to TCP Proxy
// This bridges WebSocket connections from browser to your C TCP server

const WebSocket = require('ws');
const net = require('net');

const WS_PORT = 8080;
const TCP_HOST = 'localhost';
const TCP_PORT = 50000;

const wss = new WebSocket.Server({ port: WS_PORT });

console.log(`🌐 WebSocket proxy listening on ws://localhost:${WS_PORT}`);
console.log(`🔌 Forwarding to TCP server at ${TCP_HOST}:${TCP_PORT}`);
console.log('');

wss.on('connection', (ws) => {
    console.log('✅ WebSocket client connected');
    
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
        console.log('❌ WebSocket client disconnected');
        tcpClient.end();
    });
    
    tcpClient.on('close', () => {
        console.log('❌ TCP connection closed');
        ws.close();
    });
    
    // Handle errors
    ws.on('error', (err) => {
        console.error('WebSocket error:', err.message);
    });
    
    tcpClient.on('error', (err) => {
        console.error('TCP error:', err.message);
    });
});

console.log('Waiting for connections...');