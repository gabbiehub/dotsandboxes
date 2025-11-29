#ifndef PROTOCOL_H
#define PROTOCOL_H

#include "common.h"

// Protocol functions
char* create_login_message(const char* username);
char* create_login_ok_message(int player_id);
char* create_create_room_message(const char* room_id);
char* create_join_room_message(const char* room_id);
char* create_room_joined_message(const char* room_id, int player_num);
char* create_game_start_message(void);
char* create_place_line_message(int x, int y, const char* orientation);
char* create_error_message(const char* error_msg);
char* create_ping_message(void);
char* create_pong_message(void);

// Parse incoming messages
json_object* parse_json_message(const char* msg);
const char* get_message_op(json_object* jobj);

// Utility
void free_json_message(json_object* jobj);

#endif // PROTOCOL_H