let ws = null;
let username = '';
let currentRoom = '';
let playerNum = -1;
let gameState = null;
let player1Name = 'Player 1';
let player2Name = 'Player 2';

const GRID_SIZE = 4; // number of dots per row/col
const CELL_SIZE = 100;
const DOT_RADIUS = 8;
const LINE_WIDTH = 6;
const GRID_ROWS = GRID_SIZE;
const GRID_COLS = GRID_SIZE;
const BOX_ROWS = GRID_SIZE - 1;
const BOX_COLS = GRID_SIZE - 1;
const PLAYER_COLORS = ['#e74c3c', '#3498db']; // Red, Blue
let hoveredLine = null;

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Console logging
function log(message, type = 'info') {
    const consoleEl = document.getElementById('console');
    const msg = document.createElement('div');
    msg.className = `console-msg console-${type}`;
    msg.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
    consoleEl.appendChild(msg);
    consoleEl.scrollTop = consoleEl.scrollHeight;
}

// Connection
function connect() {
    const serverUrl = document.getElementById('serverUrl').value;
    username = document.getElementById('username').value;
    
    if (!username) {
        alert('Please enter a username');
        return;
    }
    const PLAYER_COLORS = ['#e74c3c', '#3498db']; // Red, Blue
    try {
        ws = new WebSocket(serverUrl);
        
        ws.onopen = () => {
            log('Connected to server', 'success');
            document.getElementById('connectionStatus').textContent = '✅ Connected';
            document.getElementById('connectionStatus').className = 'status-success';
            
        const threshold = 30; // slightly larger to make edges easier to click
            // persist username
            try { localStorage.setItem('dots_username', username); } catch (e) {}
            sendMessage({op: 'LOGIN', user: username});
            
            document.getElementById('connectionPanel').style.display = 'none';
            document.getElementById('lobbyPanel').style.display = 'block';
        };
        
        ws.onmessage = (event) => {
            handleMessage(event.data);
        };
        
        ws.onerror = (error) => {
            log('WebSocket error', 'error');
            document.getElementById('connectionStatus').textContent = '❌ Connection error';
            document.getElementById('connectionStatus').className = 'status-error';
        };
        
        ws.onclose = () => {
            log('Disconnected from server', 'error');
            document.getElementById('connectionStatus').textContent = '❌ Disconnected';
            document.getElementById('connectionStatus').className = 'status-error';
        };
        
    } catch (error) {
        alert('Failed to connect: ' + error.message);
    }
}

// Prefill server URL and username from localStorage on load
window.addEventListener('load', () => {
    try {
        const saved = localStorage.getItem('dots_username');
        if (saved) document.getElementById('username').value = saved;
    } catch (e) {}
    // Auto-fill serverUrl to use the current page host (works for phones too)
    const serverInput = document.getElementById('serverUrl');
    if (serverInput) {
        const current = (serverInput.value || '').trim();
        const host = (window.location && window.location.hostname) ? window.location.hostname : 'localhost';
        const suggested = `ws://${host}:8080`;
        if (!current || current.includes('localhost') || current.includes('127.0.0.1')) {
            serverInput.value = suggested;
        }
    }
});

function sendMessage(obj) {
    if (ws && ws.readyState === WebSocket.OPEN) {
        const msg = JSON.stringify(obj) + '\n';
        ws.send(msg);
        log('Sent: ' + JSON.stringify(obj));
    }
}

function handleMessage(data) {
    log('Received: ' + data);
    
    const lines = data.split('\n').filter(line => line.trim());
    
    for (const line of lines) {
        try {
            const msg = JSON.parse(line);
            
            switch (msg.op) {
                case 'LOGIN_OK':
                    log('Login successful', 'success');
                    break;
                    
                case 'ROOM_JOINED':
                    currentRoom = msg.room_id;
                    playerNum = msg.player_num;
                    if (playerNum === 0) player1Name = username;
                    log(`Joined room ${currentRoom} as Player ${playerNum + 1}`, 'success');
                    document.getElementById('lobbyStatus').textContent = `✅ Joined room: ${currentRoom} (You are Player ${playerNum + 1})`;
                    document.getElementById('lobbyStatus').className = 'status-success';
                    break;
                    
                case 'GAME_START':
                    log('Game starting!', 'success');
                    if (msg.player2) player2Name = msg.player2;
                    document.getElementById('lobbyPanel').style.display = 'none';
                    document.getElementById('gamePanel').style.display = 'block';
                    break;
                    
                case 'GAME_STATE':
                    console.log('[CLIENT] Received GAME_STATE:', msg);
                    gameState = msg;
                    // Show last GAME_STATE in page for debugging
                    try {
                        const el = document.getElementById('lastMessage');
                        if (el) el.textContent = JSON.stringify(msg, null, 2);
                    } catch (e) {}
                    console.log('[CLIENT] Calling updateGameDisplay and drawBoard');
                    updateGameDisplay();
                    drawBoard();
                    console.log('[CLIENT] Board drawn');
                    break;
                    
                case 'ERROR':
                    log('Error: ' + msg.msg, 'error');
                    alert('Error: ' + msg.msg);
                    break;
                    
                case 'PONG':
                    log('Pong received');
                    break;
            }
        } catch (e) {
            log('Failed to parse message: ' + e.message, 'error');
        }
    }
}

function createRoom() {
    const roomId = document.getElementById('roomId').value;
    if (!roomId) {
        alert('Please enter a room ID');
        return;
    }
    sendMessage({op: 'CREATE_ROOM', room_id: roomId});
}

function joinRoom() {
    const roomId = document.getElementById('roomId').value;
    if (!roomId) {
        alert('Please enter a room ID');
        return;
    }
    sendMessage({op: 'JOIN_ROOM', room_id: roomId});
}

function leaveRoom() {
    currentRoom = '';
    playerNum = -1;
    gameState = null;
    document.getElementById('gamePanel').style.display = 'none';
    document.getElementById('lobbyPanel').style.display = 'block';
}

function updateGameDisplay() {
    if (!gameState) return;
    
    const p1El = document.getElementById('player1Score');
    const p2El = document.getElementById('player2Score');
    p1El.textContent = `${player1Name}: ${gameState.scores[0]}`;
    p1El.style.color = PLAYER_COLORS[0];
    p1El.style.fontWeight = (gameState.turn === 0) ? 'bold' : 'normal';
    p2El.textContent = `${player2Name}: ${gameState.scores[1]}`;
    p2El.style.color = PLAYER_COLORS[1];
    p2El.style.fontWeight = (gameState.turn === 1) ? 'bold' : 'normal';
    document.getElementById('turnIndicator').textContent = `Turn: ${gameState.turn === 0 ? player1Name : player2Name}`;
    document.getElementById('turnIndicator').style.color = PLAYER_COLORS[gameState.turn];
    
    if (gameState.game_over) {
        let msg = 'GAME OVER! ';
        if (gameState.winner === -1) {
            msg += 'It\'s a draw!';
        } else {
            const winnerName = gameState.winner === 0 ? player1Name : player2Name;
            msg += `${winnerName} wins!`;
        }
        document.getElementById('gameStatus').textContent = msg;
        document.getElementById('gameStatus').className = 'status-success';
        // Redirect after 5 seconds
        setTimeout(() => {
            leaveRoom();
        }, 5000);
    } else if (gameState.turn === playerNum) {
        document.getElementById('gameStatus').textContent = '✨ Your turn!';
        document.getElementById('gameStatus').className = 'status-info';
    } else {
        document.getElementById('gameStatus').textContent = 'Waiting for opponent...';
        document.getElementById('gameStatus').className = '';
    }
}

function drawBoard() {
    if (!gameState) return;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const offsetX = 50;
    const offsetY = 50;
    
    // Draw dots
    ctx.fillStyle = '#333';
    for (let i = 0; i < GRID_SIZE; i++) {
        for (let j = 0; j < GRID_SIZE; j++) {
            const x = offsetX + j * CELL_SIZE;
            const y = offsetY + i * CELL_SIZE;
            
            ctx.beginPath();
            ctx.arc(x, y, DOT_RADIUS, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
    // Draw horizontal lines
    ctx.lineWidth = LINE_WIDTH;
    ctx.lineCap = 'round';
    
    console.log('[RENDER] Drawing horizontal lines, array:', gameState.board.horizontal);
    for (let i = 0; i < gameState.board.horizontal.length; i++) {
        for (let j = 0; j < gameState.board.horizontal[i].length; j++) {
            if (gameState.board.horizontal[i][j] === 1) {
                const x1 = offsetX + j * CELL_SIZE;
                const y1 = offsetY + i * CELL_SIZE;
                const x2 = offsetX + (j + 1) * CELL_SIZE;
                const y2 = y1;
                
                console.log(`[RENDER] Drawing H-line at [${i}][${j}]: (${x1},${y1}) to (${x2},${y2})`);
                
                ctx.strokeStyle = '#667eea';
                ctx.beginPath();
                ctx.moveTo(x1, y1);
                ctx.lineTo(x2, y2);
                ctx.stroke();
            }
        }
    }
    
    // Draw vertical lines
    console.log('[RENDER] Drawing vertical lines, array:', gameState.board.vertical);
    for (let i = 0; i < gameState.board.vertical.length; i++) {
        for (let j = 0; j < gameState.board.vertical[i].length; j++) {
            if (gameState.board.vertical[i][j] === 1) {
                const x1 = offsetX + j * CELL_SIZE;
                const y1 = offsetY + i * CELL_SIZE;
                const x2 = x1;
                const y2 = offsetY + (i + 1) * CELL_SIZE;
                
                console.log(`[RENDER] Drawing V-line at [${i}][${j}]: (${x1},${y1}) to (${x2},${y2})`);
                
                ctx.beginPath();
                ctx.moveTo(x1, y1);
                ctx.lineTo(x2, y2);
                ctx.stroke();
            }
        }
    }
    
    // Draw hovered line guide
    if (hoveredLine && !gameState.game_over && gameState.turn === playerNum) {
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.35)';
        ctx.lineWidth = LINE_WIDTH + 6;
        ctx.lineCap = 'round';
        const hl = hoveredLine;
        if (hl.type === 'H') {
            const x1 = offsetX + hl.x * CELL_SIZE;
            const y1 = offsetY + hl.y * CELL_SIZE;
            const x2 = offsetX + (hl.x + 1) * CELL_SIZE;
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y1);
            ctx.stroke();
        } else {
            const x1 = offsetX + hl.x * CELL_SIZE;
            const y1 = offsetY + hl.y * CELL_SIZE;
            const y2 = offsetY + (hl.y + 1) * CELL_SIZE;
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x1, y2);
            ctx.stroke();
        }
    }

    // Draw completed boxes with player colors
    for (let i = 0; i < gameState.board.boxes.length; i++) {
        for (let j = 0; j < gameState.board.boxes[i].length; j++) {
            const owner = gameState.board.boxes[i][j];
            if (owner !== -1) {
                const x = offsetX + j * CELL_SIZE + CELL_SIZE / 2;
                const y = offsetY + i * CELL_SIZE + CELL_SIZE / 2;
                
                const fillColor = owner === 0 ? 'rgba(231, 76, 60, 0.3)' : 'rgba(52, 152, 219, 0.3)'; // Red / Blue with alpha
                ctx.fillStyle = fillColor;
                ctx.fillRect(
                    offsetX + j * CELL_SIZE + 10,
                    offsetY + i * CELL_SIZE + 10,
                    CELL_SIZE - 20,
                    CELL_SIZE - 20
                );
                
                ctx.fillStyle = PLAYER_COLORS[owner];
                ctx.font = 'bold 24px Arial';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                const pName = owner === 0 ? player1Name : player2Name;
                ctx.fillText(pName.substring(0, 8), x, y);
            }
        }
    }
}

function findClickableLine(mouseX, mouseY) {
    const offsetX = 50;
    const offsetY = 50;
    const threshold = 30; // larger to make edges easier to click
    
    // Check horizontal lines using server state sizes
    for (let i = 0; i < gameState.board.horizontal.length; i++) {
        for (let j = 0; j < gameState.board.horizontal[i].length; j++) {
            if (gameState.board.horizontal[i][j] === 1) continue;
            const lineX1 = offsetX + j * CELL_SIZE;
            const lineY = offsetY + i * CELL_SIZE;
            const lineX2 = offsetX + (j + 1) * CELL_SIZE;
            
            // Check distance to line segment
            const dx = mouseX - Math.max(lineX1, Math.min(mouseX, lineX2));
            const dy = mouseY - lineY;
            const dist = Math.sqrt(dx*dx + dy*dy);
            
            if (dist < threshold) {
                return {type: 'H', x: j, y: i};
            }
        }
    }
    
    // Check vertical lines using server state sizes
    for (let i = 0; i < gameState.board.vertical.length; i++) {
        for (let j = 0; j < gameState.board.vertical[i].length; j++) {
            if (gameState.board.vertical[i][j] === 1) continue;
            const lineX = offsetX + j * CELL_SIZE;
            const lineY1 = offsetY + i * CELL_SIZE;
            const lineY2 = offsetY + (i + 1) * CELL_SIZE;
            
            // Check distance to line segment
            const dx = mouseX - lineX;
            const dy = mouseY - Math.max(lineY1, Math.min(mouseY, lineY2));
            const dist = Math.sqrt(dx*dx + dy*dy);
            
            if (dist < threshold) {
                return {type: 'V', x: j, y: i};
            }
        }
    }
    return null;
}

canvas.addEventListener('mousemove', (e) => {
    if (!gameState || gameState.game_over || gameState.turn !== playerNum) {
        hoveredLine = null;
        drawBoard();
        return;
    }
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const line = findClickableLine(mouseX, mouseY);
    if (line !== hoveredLine) {
        hoveredLine = line;
        drawBoard();
    }
    canvas.style.cursor = line ? 'crosshair' : 'default';
});

canvas.addEventListener('click', (e) => {
    if (!gameState || gameState.game_over || gameState.turn !== playerNum) {
        return;
    }
    
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    const line = findClickableLine(mouseX, mouseY);
    if (line) {
        sendMessage({op: 'PLACE_LINE', x: line.x, y: line.y, orientation: line.type});
    }
});