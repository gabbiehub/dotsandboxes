// Simple TCP mock server for Dots and Boxes protocol
// Accepts newline-delimited JSON messages and replies with simple test responses
const net = require('net');

const PORT = 50000;

const rooms = {}; // room_id -> { clients: [socket], usernames: [name] }

function makeEmptyGameState(room_id) {
  return {
    op: 'GAME_STATE',
    room_id: room_id,
    turn: 0,
    scores: [0, 0],
    board: {
      horizontal: Array.from({length: 3}, () => Array.from({length:4}, () => 0)),
      vertical: Array.from({length: 4}, () => Array.from({length:3}, () => 0)),
      boxes: Array.from({length:3}, () => Array.from({length:3}, () => -1))
    },
    game_over: 0,
    winner: -1
  };
}

const server = net.createServer((socket) => {
  console.log('✅ TCP client connected');
  let buf = '';

  socket.on('data', (data) => {
    buf += data.toString();
    let idx;
    while ((idx = buf.indexOf('\n')) !== -1) {
      const line = buf.slice(0, idx).trim();
      buf = buf.slice(idx + 1);
      if (!line) continue;
      console.log('RX TCP:', line);
      let msg;
      try { msg = JSON.parse(line); } catch (e) { console.error('Invalid JSON'); continue; }

      if (msg.op === 'LOGIN') {
        const reply = { op: 'LOGIN_OK', player_id: Math.floor(Math.random()*10000) };
        socket.write(JSON.stringify(reply) + '\n');
      }

      else if (msg.op === 'CREATE_ROOM') {
        const room = msg.room_id;
        rooms[room] = rooms[room] || { clients: [], usernames: [] };
        rooms[room].clients.push(socket);
        rooms[room].usernames.push(msg.user || '');
        const reply = { op: 'ROOM_JOINED', room_id: room, player_num: 0 };
        socket.write(JSON.stringify(reply) + '\n');
      }

      else if (msg.op === 'JOIN_ROOM') {
        const room = msg.room_id;
        if (!rooms[room] || rooms[room].clients.length >= 2) {
          socket.write(JSON.stringify({op:'ERROR', msg:'Room not found or full'}) + '\n');
          continue;
        }
        rooms[room].clients.push(socket);
        rooms[room].usernames.push(msg.user || '');

        // Send ROOM_JOINED to joiner
        socket.write(JSON.stringify({op:'ROOM_JOINED', room_id:room, player_num:1}) + '\n');

        // Notify both players: GAME_START then GAME_STATE
        const clients = rooms[room].clients;
        const gameStart = JSON.stringify({op:'GAME_START'}) + '\n';
        const gameState = JSON.stringify(makeEmptyGameState(room)) + '\n';
        for (const c of clients) {
          if (c.writable) c.write(gameStart);
          if (c.writable) c.write(gameState);
        }
      }

      else if (msg.op === 'PLACE_LINE') {
        // For the mock, simply broadcast an unchanged GAME_STATE to the room
        const roomId = msg.room_id || Object.keys(rooms)[0];
        if (!roomId || !rooms[roomId]) {
          socket.write(JSON.stringify({op:'ERROR', msg:'Not in a room'}) + '\n');
          continue;
        }
        const gs = makeEmptyGameState(roomId);
        // pretend the placed line is set
        if (msg.orientation === 'H') {
          if (gs.board.horizontal[msg.y] && gs.board.horizontal[msg.y][msg.x] === 0) {
            gs.board.horizontal[msg.y][msg.x] = 1;
          }
        } else {
          if (gs.board.vertical[msg.y] && gs.board.vertical[msg.y][msg.x] === 0) {
            gs.board.vertical[msg.y][msg.x] = 1;
          }
        }
        const payload = JSON.stringify(gs) + '\n';
        for (const c of rooms[roomId].clients) if (c.writable) c.write(payload);
      }

      else if (msg.op === 'PING') {
        socket.write(JSON.stringify({op:'PONG'}) + '\n');
      }
    }
  });

  socket.on('close', () => {
    console.log('❌ TCP connection closed');
    // remove socket from any rooms
    for (const r of Object.keys(rooms)) {
      rooms[r].clients = rooms[r].clients.filter(c => c !== socket);
    }
  });

  socket.on('error', (err) => {
    console.error('TCP socket error:', err && err.message);
  });
});

server.listen(PORT, () => console.log(`Mock TCP server listening on ${PORT}`));
