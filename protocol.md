# Dots and Boxes Protocol Specification

## Overview

This document describes the application-layer protocol used for communication between clients and the Dots and Boxes game server.

## Transport Layer

- **Protocol**: TCP (reliable stream-oriented)
- **Port**: 50000 (configurable in `include/common.h`)
- **Connection**: Persistent (clients maintain connection throughout gameplay)

## Message Format

### Framing

**Text Mode: Newline-Delimited JSON**

Each message is a JSON object terminated by a newline character (`\n`):

```
{"op":"MESSAGE_TYPE","param1":"value1",...}\n
```

- **Delimiter**: Single newline (`\n`, ASCII 10)
- **Encoding**: UTF-8
- **Max Message Size**: 4096 bytes (BUFFER_SIZE)

### Message Structure

All messages MUST contain an `"op"` field specifying the operation type.

```json
{
  "op": "OPERATION_NAME",
  "field1": "value1",
  "field2": 123
}
```

## Message Types

### 1. Authentication & Session

#### LOGIN (Client → Server)
Authenticate with the server.

**Request:**
```json
{"op":"LOGIN","user":"alice"}
```

**Fields:**
- `user` (string, required): Username (max 32 chars)

**Response:**
```json
{"op":"LOGIN_OK","player_id":12345}
```

**Fields:**
- `player_id` (int): Unique player identifier (socket fd)

**Errors:**
- Invalid JSON format
- Missing username

---

### 2. Room Management

#### CREATE_ROOM (Client → Server)
Create a new game room.

**Request:**
```json
{"op":"CREATE_ROOM","room_id":"room1"}
```

**Fields:**
- `room_id` (string, required): Unique room identifier (max 32 chars)

**Response:**
```json
{"op":"ROOM_JOINED","room_id":"room1","player_num":0}
```

**Fields:**
- `room_id` (string): Echo of room ID
- `player_num` (int): Player number (0 = Player 1, 1 = Player 2)

**Errors:**
- Room already exists
- No room slots available (max 10 rooms)

---

#### JOIN_ROOM (Client → Server)
Join an existing game room.

**Request:**
```json
{"op":"JOIN_ROOM","room_id":"room1"}
```

**Fields:**
- `room_id` (string, required): Target room identifier

**Response:**
```json
{"op":"ROOM_JOINED","room_id":"room1","player_num":1}
```

**Then immediately:**
```json
{"op":"GAME_START"}
```

**Errors:**
- Room not found
- Room full (2 players max)
- Game already started

---

### 3. Game State

#### GAME_START (Server → All Clients in Room)
Broadcast when second player joins.

**Message:**
```json
{"op":"GAME_START"}
```

Followed immediately by `GAME_STATE`.

---

#### GAME_STATE (Server → All Clients in Room)
Full game state update.

**Message:**
```json
{
  "op":"GAME_STATE",
  "room_id":"room1",
  "turn":0,
  "scores":[3,2],
  "board":{
    "horizontal":[[0,1,0,0],[1,1,0,1],[0,0,1,1]],
    "vertical":[[1,0,1],[0,1,1],[1,1,0],[0,1,1]],
    "boxes":[[0,-1,1],[-1,1,-1],[0,1,0]]
  },
  "game_over":0,
  "winner":-1
}
```

**Fields:**
- `room_id` (string): Current room
- `turn` (int): Current player's turn (0 or 1)
- `scores` (array[2]): [player0_score, player1_score]
- `board` (object):
  - `horizontal` (2D array): 3×4 grid of horizontal lines (0=none, 1=placed)
  - `vertical` (2D array): 4×3 grid of vertical lines (0=none, 1=placed)
  - `boxes` (2D array): 3×3 grid of box ownership (-1=empty, 0=player0, 1=player1)
- `game_over` (int): 0=playing, 1=finished
- `winner` (int): -1=draw/ongoing, 0=player0 wins, 1=player1 wins

**Grid Indexing:**
```
Dots (4×4):
  0---1---2---3
  |   |   |   |
  0---1---2---3
  |   |   |   |
  0---1---2---3
  |   |   |   |
  0---1---2---3

Horizontal lines (3 rows × 4 cols):
  Row 0: lines between dot rows 0-1
  Row 1: lines between dot rows 1-2
  Row 2: lines between dot rows 2-3

Vertical lines (4 rows × 3 cols):
  Col 0: lines between dot cols 0-1
  Col 1: lines between dot cols 1-2
  Col 2: lines between dot cols 2-3

Boxes (3×3):
  Each box formed by 4 surrounding lines
```

---

### 4. Gameplay

#### PLACE_LINE (Client → Server)
Place a line on the board.

**Request:**
```json
{"op":"PLACE_LINE","x":2,"y":1,"orientation":"H"}
```

**Fields:**
- `x` (int, required): Column index (0-3 for H, 0-2 for V)
- `y` (int, required): Row index (0-2 for H, 0-3 for V)
- `orientation` (string, required): "H" (horizontal) or "V" (vertical)

**Response:**
Always replies with updated `GAME_STATE` to all clients in room.

**Validation:**
- Must be your turn
- Line coordinates must be valid
- Line must not already be placed
- Game must not be over

**Errors:**
```json
{"op":"ERROR","msg":"Not your turn"}
{"op":"ERROR","msg":"Invalid move"}
{"op":"ERROR","msg":"Line already placed"}
```

**Box Completion:**
If placing a line completes one or more boxes:
1. Score(s) incremented for the player
2. Same player gets another turn (turn doesn't switch)
3. Updated `GAME_STATE` reflects new scores and box ownership

---

### 5. Connection Management

#### PING (Client → Server)
Heartbeat to keep connection alive.

**Request:**
```json
{"op":"PING"}
```

**Response:**
```json
{"op":"PONG"}
```

**Recommended interval**: 30-60 seconds

---

#### PONG (Server → Client)
Heartbeat response.

**Message:**
```json
{"op":"PONG"}
```

---

### 6. Error Handling

#### ERROR (Server → Client)
General error response.

**Message:**
```json
{"op":"ERROR","msg":"Description of error"}
```

**Fields:**
- `msg` (string): Human-readable error description

**Common Errors:**
- "Invalid JSON"
- "Missing 'op' field"
- "Not logged in"
- "Not in a room"
- "Room not found"
- "Not your turn"
- "Invalid move"

---

## Connection Lifecycle

### 1. Initial Connection
```
Client                          Server
  |                               |
  |-------- TCP Connect -------->|
  |                               |
  |<------- Connected ----------|
```

### 2. Authentication
```
Client                          Server
  |                               |
  |-- {"op":"LOGIN",...} ------->|
  |                               |
  |<-- {"op":"LOGIN_OK",...} ----|
```

### 3. Room Creation/Joining
```
Player 1                        Server                        Player 2
  |                               |                               |
  |-- CREATE_ROOM -------------->|                               |
  |<-- ROOM_JOINED --------------|                               |
  |                               |<--------- JOIN_ROOM ---------|
  |                               |-- ROOM_JOINED -------------->|
  |<--------- GAME_START ---------|-- GAME_START -------------->|
  |<--------- GAME_STATE ---------|-- GAME_STATE -------------->|
```

### 4. Gameplay Loop
```
Player 1                        Server                        Player 2
  |                               |                               |
  |-- PLACE_LINE --------------->|                               |
  |<--------- GAME_STATE ---------|-- GAME_STATE -------------->|
  |                               |<--------- PLACE_LINE --------|
  |<--------- GAME_STATE ---------|-- GAME_STATE -------------->|
  |                               |                               |
```

### 5. Game End
```
Player 1                        Server                        Player 2
  |                               |                               |
  |-- PLACE_LINE (last move) --->|                               |
  |<- GAME_STATE (game_over=1) --|-- GAME_STATE (game_over=1)->|
  |                               |                               |
```

### 6. Disconnection
```
Client                          Server
  |                               |
  |-------- TCP Close ---------->|
  |                               |
  |                        [Cleanup room]
```

**Server Behavior on Disconnect:**
- Remove player from room
- Set player slot to -1
- Room remains available for new players (if not in-progress game)

---

## Implementation Notes

### Server-Side

**Concurrency:**
- One pthread per client connection
- Room state protected by `pthread_mutex_t`
- Acquire room lock before modifying game state

**Broadcast:**
```c
void broadcast_to_room(const char* room_id, const char* message, int exclude_fd);
```
Sends message to all players in room except `exclude_fd` (use -1 to send to all).

### Client-Side

**Parsing:**
1. Read until newline delimiter
2. Strip newline
3. Parse JSON using `json-c` library
4. Check `"op"` field
5. Handle based on message type

**State Management:**
- Maintain local copy of `gameState`
- Update on each `GAME_STATE` message
- Use for UI rendering

---

## Security Considerations

1. **Input Validation:**
   - Limit username length (32 chars)
   - Limit room_id length (32 chars)
   - Validate JSON structure
   - Sanitize all string inputs

2. **Message Size:**
   - Max 4096 bytes per message
   - Reject oversized messages

3. **Rate Limiting:**
   - Not implemented (future enhancement)
   - Could limit messages per second per client

4. **Authentication:**
   - Current: Simple username (not secure)
   - Production: Add password/token system

---

## Testing

### Using CLI Client
```bash
./client
> login alice
> create room1
> place 0 0 H
> place 1 0 H
> ping
```

### Using `netcat`
```bash
nc localhost 50000
{"op":"LOGIN","user":"testuser"}
{"op":"PING"}
```

### Using `telnet`
```bash
telnet localhost 50000
{"op":"LOGIN","user":"testuser"}
```

---

## Future Enhancements

1. **Binary Protocol**: Length-prefixed binary for efficiency
2. **Compression**: gzip/zlib for large state updates
3. **Encryption**: TLS/SSL for secure communication
4. **Spectators**: Additional client role for watching games
5. **Chat**: In-game text messaging
6. **Replay**: Store and replay game moves