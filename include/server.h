#ifndef SERVER_H
#define SERVER_H

#include "common.h"
#include "game.h"

#define MAX_ROOMS 10

// Client structure
typedef struct {
    int socket;
    char username[MAX_USERNAME];
    int player_id;
    char current_room[MAX_ROOM_ID];
    pthread_t thread;
} Client;

// Server functions
void init_server(void);
void start_server(void);
void* handle_client(void* arg);
void broadcast_to_room(const char* room_id, const char* message, int exclude_fd);
void send_message(int socket, const char* message);
Room* find_room(const char* room_id);
Room* create_room(const char* room_id, int creator_fd, const char* username);
int join_room(const char* room_id, int client_fd, const char* username);

#endif // SERVER_H