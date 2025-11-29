let ws = null;
let username = '';
let currentRoom = '';
let playerNum = -1;
let gameState = null;

const GRID_SIZE = 4;
const CELL_SIZE = 100;
const DOT_RADIUS = 8;
const LINE_WIDTH = 6;

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
    
    try {
        ws = new WebSocket(serverUrl);
        
        ws.onopen = () => {
            log('Connected to server', 'success');
            document.getElementById('connectionStatus').textContent = '✅ Connected';
            document.getElementById('connectionStatus').className = 'status-success';
            
            // Send login
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
                    log(`Joined room ${currentRoom} as Player ${playerNum + 1}`, 'success');
                    document.getElementById('lobbyStatus').textContent = `✅ Joined room: ${currentRoom} (You are Player ${playerNum + 1})`;
                    document.getElementById('lobbyStatus').className = 'status-success';
                    break;
                    
                case 'GAME_START':
                    log('Game starting!', 'success');
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
    
    document.getElementById('player1Score').textContent = `Player 1: ${gameState.scores[0]}`;
    document.getElementById('player2Score').textContent = `Player 2: ${gameState.scores[1]}`;
    document.getElementById('turnIndicator').textContent = `Turn: Player ${gameState.turn + 1}`;
    
    if (gameState.game_over) {
        let msg = 'GAME OVER! ';
        if (gameState.winner === -1) {
            msg += 'It\'s a draw!';
        } else {
            msg += `Player ${gameState.winner + 1} wins!`;
        }
        document.getElementById('gameStatus').textContent = msg;
        document.getElementById('gameStatus').className = 'status-success';
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
    ctx.strokeStyle = '#667eea';
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
    
    // Draw completed boxes
    for (let i = 0; i < gameState.board.boxes.length; i++) {
        for (let j = 0; j < gameState.board.boxes[i].length; j++) {
            const owner = gameState.board.boxes[i][j];
            if (owner !== -1) {
                const x = offsetX + j * CELL_SIZE + CELL_SIZE / 2;
                const y = offsetY + i * CELL_SIZE + CELL_SIZE / 2;
                
                ctx.fillStyle = owner === 0 ? 'rgba(102, 126, 234, 0.3)' : 'rgba(118, 75, 162, 0.3)';
                ctx.fillRect(
                    offsetX + j * CELL_SIZE + 10,
                    offsetY + i * CELL_SIZE + 10,
                    CELL_SIZE - 20,
                    CELL_SIZE - 20
                );
                
                ctx.fillStyle = owner === 0 ? '#667eea' : '#764ba2';
                ctx.font = 'bold 30px Arial';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(`P${owner + 1}`, x, y);
            }
        }
    }
}

canvas.addEventListener('click', (e) => {
    if (!gameState || gameState.game_over || gameState.turn !== playerNum) {
        return;
    }
    
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    const offsetX = 50;
    const offsetY = 50;
    
    const threshold = 20;
    
    // Check for horizontal line click
    for (let i = 0; i < GRID_SIZE - 1; i++) {
        for (let j = 0; j < GRID_SIZE - 1; j++) {
            const lineX1 = offsetX + j * CELL_SIZE;
            const lineY = offsetY + i * CELL_SIZE;
            const lineX2 = offsetX + (j + 1) * CELL_SIZE;
            
            const midX = (lineX1 + lineX2) / 2;
            const midY = lineY;
            
            const dist = Math.sqrt((mouseX - midX) ** 2 + (mouseY - midY) ** 2);
            
            if (dist < threshold && gameState.board.horizontal[i][j] === 0) {
                sendMessage({op: 'PLACE_LINE', x: j, y: i, orientation: 'H'});
                return;
            }
        }
    }
    
    // Check for vertical line click
    for (let i = 0; i < GRID_SIZE - 1; i++) {
        for (let j = 0; j < GRID_SIZE - 1; j++) {
            const lineX = offsetX + j * CELL_SIZE;
            const lineY1 = offsetY + i * CELL_SIZE;
            const lineY2 = offsetY + (i + 1) * CELL_SIZE;
            
            const midX = lineX;
            const midY = (lineY1 + lineY2) / 2;
            
            const dist = Math.sqrt((mouseX - midX) ** 2 + (mouseY - midY) ** 2);
            
            if (dist < threshold && gameState.board.vertical[i][j] === 0) {
                sendMessage({op: 'PLACE_LINE', x: j, y: i, orientation: 'V'});
                return;
            }
        }
    }
});