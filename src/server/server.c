#include <stdio.h>
#include <string.h>
#include <stdlib.h>
#include <unistd.h>
#include <sys/socket.h>
#include <netinet/in.h>
#include <pthread.h>
#include "server.h"
#include "protocol.h"

static Room rooms[MAX_ROOMS];
static int server_fd = -1;

static void set_nonblocking(int fd) { (void)fd; }
static void send_error(int fd, const char* msg);

void send_message(int socket, const char* message) {
    if (!message) return;
    size_t len = strlen(message);
    ssize_t w = write(socket, message, len);
    (void)w;
}

void broadcast_to_room(const char* room_id, const char* message, int exclude_fd) {
    if (!room_id || !message) return;
    Room* r = find_room(room_id);
    if (!r) return;
    for (int i = 0; i < 2; i++) {
        int fd = r->players[i];
        if (fd >= 0 && fd != exclude_fd) {
            send_message(fd, message);
        }
    }
}

Room* find_room(const char* room_id) {
    for (int i = 0; i < MAX_ROOMS; i++) {
        if (rooms[i].room_id[0] && strcmp(rooms[i].room_id, room_id) == 0) {
            return &rooms[i];
        }
    }
    return NULL;
}

Room* create_room(const char* room_id, int creator_fd, const char* username, int grid_size) {
    for (int i = 0; i < MAX_ROOMS; i++) {
        if (rooms[i].room_id[0] == '\0') {
            strncpy(rooms[i].room_id, room_id, MAX_ROOM_ID-1);
            rooms[i].room_id[MAX_ROOM_ID-1] = '\0';
            rooms[i].players[0] = creator_fd;
            rooms[i].players[1] = -1;
            strncpy(rooms[i].usernames[0], username ? username : "", MAX_USERNAME-1);
            rooms[i].usernames[0][MAX_USERNAME-1] = '\0';
            rooms[i].usernames[1][0] = '\0';
            rooms[i].player_count = 1;
            rooms[i].game_started = 0;
            rooms[i].grid_size = grid_size;
            pthread_mutex_init(&rooms[i].lock, NULL);
            init_game_state(&rooms[i].game, grid_size);
            return &rooms[i];
        }
    }
    return NULL;
}

int join_room(const char* room_id, int client_fd, const char* username) {
    Room* r = find_room(room_id);
    if (!r) return -1;
    if (r->players[0] == client_fd) return -3;
    if (r->player_count >= 2 || r->players[1] != -1) return -2;
    r->players[1] = client_fd;
    strncpy(r->usernames[1], username ? username : "", MAX_USERNAME-1);
    r->usernames[1][MAX_USERNAME-1] = '\0';
    r->player_count = 2;
    r->game_started = 1;
    return 0;
}

void cleanup_client(int fd) {
    for (int i = 0; i < MAX_ROOMS; i++) {
        if (rooms[i].room_id[0] != '\0') {
            int found = 0;
            if (rooms[i].players[0] == fd) {
                rooms[i].players[0] = -1;
                rooms[i].usernames[0][0] = '\0';
                found = 1;
            } else if (rooms[i].players[1] == fd) {
                rooms[i].players[1] = -1;
                rooms[i].usernames[1][0] = '\0';
                found = 1;
            }
            
            if (found) {
                rooms[i].player_count--;
                if (rooms[i].player_count <= 0) {
                    // Room empty, delete it
                    rooms[i].room_id[0] = '\0';
                    rooms[i].game_started = 0;
                    pthread_mutex_destroy(&rooms[i].lock);
                } else {
                    // Notify other player or end game
                    // For now, if game started and one leaves, maybe end game?
                    // Or just let them wait?
                    // User said: "when the one of the palyers exited the room ... delete the room"
                    // So if game started, we should probably close the room.
                    if (rooms[i].game_started) {
                        // Find the other player
                        int other_fd = (rooms[i].players[0] != -1) ? rooms[i].players[0] : rooms[i].players[1];
                        if (other_fd != -1) {
                            send_error(other_fd, "Opponent disconnected. Room closed.");
                            // Force room close
                            rooms[i].room_id[0] = '\0';
                            rooms[i].player_count = 0;
                            rooms[i].players[0] = -1;
                            rooms[i].players[1] = -1;
                            rooms[i].game_started = 0;
                            pthread_mutex_destroy(&rooms[i].lock);
                        }
                    }
                }
            }
        }
    }
}

void* handle_client(void* arg);

void init_server(void) {
    memset(rooms, 0, sizeof(rooms));
    for (int i = 0; i < MAX_ROOMS; i++) {
        rooms[i].players[0] = -1;
        rooms[i].players[1] = -1;
    }
}

void start_server(void) {
    server_fd = socket(AF_INET, SOCK_STREAM, 0);
    int opt = 1;
    setsockopt(server_fd, SOL_SOCKET, SO_REUSEADDR, &opt, sizeof(opt));
    struct sockaddr_in addr; memset(&addr, 0, sizeof(addr));
    addr.sin_family = AF_INET;
    addr.sin_addr.s_addr = htonl(INADDR_ANY);
    addr.sin_port = htons(SERVER_PORT);
    if (bind(server_fd, (struct sockaddr*)&addr, sizeof(addr)) < 0) {
        perror("bind");
        exit(1);
    }
    if (listen(server_fd, MAX_CLIENTS) < 0) {
        perror("listen");
        exit(1);
    }
    printf("Server listening on TCP %d\n", SERVER_PORT);
    while (1) {
        int cfd = accept(server_fd, NULL, NULL);
        if (cfd < 0) { perror("accept"); continue; }
        pthread_t th; pthread_create(&th, NULL, handle_client, (void*)(long)cfd);
        pthread_detach(th);
    }
}

static int read_line(int fd, char* buf, size_t cap) {
    size_t off = 0;
    while (off + 1 < cap) {
        char ch;
        ssize_t r = read(fd, &ch, 1);
        if (r <= 0) return -1;
        if (ch == '\n') { buf[off] = '\0'; return (int)off; }
        buf[off++] = ch;
    }
    buf[cap-1] = '\0';
    return (int)off;
}

static void send_error(int fd, const char* msg) {
    char buf[256];
    snprintf(buf, sizeof(buf), "{\"op\":\"%s\",\"msg\":\"%s\"}\n", MSG_ERROR, msg);
    send_message(fd, buf);
}

void* handle_client(void* arg) {
    int fd = (int)(long)arg;
    char username[MAX_USERNAME]; username[0] = '\0';
    char current_room[MAX_ROOM_ID]; current_room[0] = '\0';
    char line[BUFFER_SIZE];
    while (1) {
        int n = read_line(fd, line, sizeof(line));
        if (n <= 0) { 
            cleanup_client(fd);
            close(fd); 
            break; 
        }
        json_object* jobj = parse_json_message(line);
        if (!jobj) { send_error(fd, "Invalid JSON"); continue; }
        const char* op = get_message_op(jobj);
        if (!op) { send_error(fd, "Missing op"); free_json_message(jobj); continue; }
        if (strcmp(op, MSG_LOGIN) == 0) {
            json_object* uo; if (json_object_object_get_ex(jobj, "user", &uo)) {
                const char* u = json_object_get_string(uo);
                strncpy(username, u, MAX_USERNAME-1); username[MAX_USERNAME-1] = '\0';
                char* reply = create_login_ok_message(fd);
                send_message(fd, reply); free(reply);
            } else {
                send_error(fd, "Missing username");
            }
        }
        else if (strcmp(op, MSG_CREATE_ROOM) == 0) {
            json_object* ro; if (!username[0]) { send_error(fd, "Not logged in"); }
            else if (json_object_object_get_ex(jobj, "room_id", &ro)) {
                const char* rid = json_object_get_string(ro);
                int grid_size = DEFAULT_GRID_SIZE;
                json_object* gs;
                if (json_object_object_get_ex(jobj, "grid_size", &gs)) {
                    grid_size = json_object_get_int(gs);
                }
                
                if (find_room(rid)) { send_error(fd, "Room exists"); }
                else {
                    Room* r = create_room(rid, fd, username, grid_size);
                    if (!r) { send_error(fd, "No room slots"); }
                    else {
                        strncpy(current_room, rid, MAX_ROOM_ID-1); current_room[MAX_ROOM_ID-1] = '\0';
                        char* msg = create_room_joined_message(rid, 0);
                        send_message(fd, msg); free(msg);
                    }
                }
            } else { send_error(fd, "Missing room_id"); }
        }
        else if (strcmp(op, MSG_JOIN_ROOM) == 0) {
            json_object* ro; if (!username[0]) { send_error(fd, "Not logged in"); }
            else if (json_object_object_get_ex(jobj, "room_id", &ro)) {
                const char* rid = json_object_get_string(ro);
                int rc = join_room(rid, fd, username);
                if (rc == 0) {
                    strncpy(current_room, rid, MAX_ROOM_ID-1); current_room[MAX_ROOM_ID-1] = '\0';
                    char* joined = create_room_joined_message(rid, 1);
                    send_message(fd, joined); free(joined);
                    // Start game for both players with names
                    Room* r = find_room(rid);
                    if (r) {
                        char start_msg[256];
                        snprintf(start_msg, sizeof(start_msg), "{\"op\":\"%s\",\"player1\":\"%s\",\"player2\":\"%s\"}\n", 
                                 MSG_GAME_START, r->usernames[0], r->usernames[1]);
                        broadcast_to_room(rid, start_msg, -1);
                        char* gs = game_state_to_json(&r->game, rid);
                        broadcast_to_room(rid, gs, -1);
                        free(gs);
                    }
                } else if (rc == -1) {
                    send_error(fd, "Room not found");
                } else if (rc == -3) {
                    send_error(fd, "You are already in this room");
                } else {
                    send_error(fd, "Room full");
                }
            } else { send_error(fd, "Missing room_id"); }
        }
        else if (strcmp(op, MSG_LIST_ROOMS) == 0) {
            // Build JSON array of active rooms
            char response[BUFFER_SIZE];
            int pos = snprintf(response, sizeof(response), "{\"op\":\"%s\",\"rooms\":[", MSG_ROOM_LIST);
            int first = 1;
            for (int i = 0; i < MAX_ROOMS; i++) {
                if (rooms[i].room_id[0] != '\0' && !rooms[i].game.game_over) {
                    if (!first) {
                        pos += snprintf(response + pos, sizeof(response) - pos, ",");
                    }
                    first = 0;
                    pos += snprintf(response + pos, sizeof(response) - pos, 
                                    "{\"room_id\":\"%s\",\"player_count\":%d,\"grid_size\":%d,\"status\":\"%s\",\"players\":[",
                                    rooms[i].room_id, rooms[i].player_count, rooms[i].grid_size,
                                    rooms[i].game_started ? "playing" : "waiting");
                    for (int j = 0; j < 2; j++) {
                        if (rooms[i].usernames[j][0] != '\0') {
                            if (j > 0) pos += snprintf(response + pos, sizeof(response) - pos, ",");
                            pos += snprintf(response + pos, sizeof(response) - pos, "\"%s\"", rooms[i].usernames[j]);
                        }
                    }
                    pos += snprintf(response + pos, sizeof(response) - pos, "]}");
                }
            }
            pos += snprintf(response + pos, sizeof(response) - pos, "]}\n");
            send_message(fd, response);
        }
        else if (strcmp(op, MSG_PLACE_LINE) == 0) {
            if (!current_room[0]) { send_error(fd, "Not in a room"); }
            else {
                Room* r = find_room(current_room);
                if (!r) { send_error(fd, "Room not found"); }
                else {
                    json_object* xo; json_object* yo; json_object* oo;
                    if (json_object_object_get_ex(jobj, "x", &xo) && json_object_object_get_ex(jobj, "y", &yo) && json_object_object_get_ex(jobj, "orientation", &oo)) {
                        int x = json_object_get_int(xo); int y = json_object_get_int(yo);
                        const char* o = json_object_get_string(oo);
                        int player = (fd == r->players[0]) ? 0 : 1;
                        int rc = place_line(&r->game, x, y, o, player);
                        if (rc == 0) {
                            char* gs = game_state_to_json(&r->game, current_room);
                            broadcast_to_room(current_room, gs, -1);
                            free(gs);
                        } else if (rc == -2) {
                            send_error(fd, "Line already placed");
                        } else {
                            send_error(fd, "Invalid move");
                        }
                    } else { send_error(fd, "Invalid PLACE_LINE"); }
                }
            }
        }
        else if (strcmp(op, MSG_PING) == 0) {
            char* pong = create_pong_message(); send_message(fd, pong); free(pong);
        }
        else {
            send_error(fd, "Unknown op");
        }
        free_json_message(jobj);
    }
    return NULL;
}
