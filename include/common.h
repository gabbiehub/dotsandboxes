#ifndef COMMON_H
#define COMMON_H

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>
#include <pthread.h>
#include <errno.h>
#include <sys/socket.h>
#include <netinet/in.h>
#include <arpa/inet.h>
#include <json-c/json.h>

// Configuration
#define SERVER_PORT 50000
#define MAX_CLIENTS 10
#define BUFFER_SIZE 4096
#define MAX_USERNAME 32
#define MAX_ROOM_ID 32

// Grid configuration
#define MAX_GRID_SIZE 6
#define DEFAULT_GRID_SIZE 4

// Message types
#define MSG_LOGIN "LOGIN"
#define MSG_LOGIN_OK "LOGIN_OK"
#define MSG_CREATE_ROOM "CREATE_ROOM"
#define MSG_JOIN_ROOM "JOIN_ROOM"
#define MSG_ROOM_JOINED "ROOM_JOINED"
#define MSG_LIST_ROOMS "LIST_ROOMS"
#define MSG_ROOM_LIST "ROOM_LIST"
#define MSG_GAME_START "GAME_START"
#define MSG_GAME_STATE "GAME_STATE"
#define MSG_PLACE_LINE "PLACE_LINE"
#define MSG_LINE_PLACED "LINE_PLACED"
#define MSG_GAME_OVER "GAME_OVER"
#define MSG_ERROR "ERROR"
#define MSG_PING "PING"
#define MSG_PONG "PONG"

// Orientation
#define ORIENTATION_HORIZONTAL "H"
#define ORIENTATION_VERTICAL "V"

// Player indices
#define PLAYER_NONE -1
#define PLAYER_ONE 0
#define PLAYER_TWO 1

#endif // COMMON_H