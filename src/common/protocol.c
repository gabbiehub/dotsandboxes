#include "protocol.h"

char* create_login_message(const char* username) {
    json_object* jobj = json_object_new_object();
    json_object_object_add(jobj, "op", json_object_new_string(MSG_LOGIN));
    json_object_object_add(jobj, "user", json_object_new_string(username));
    
    const char* json_str = json_object_to_json_string(jobj);
    char* msg = malloc(strlen(json_str) + 2);
    sprintf(msg, "%s\n", json_str);
    
    json_object_put(jobj);
    return msg;
}

char* create_login_ok_message(int player_id) {
    json_object* jobj = json_object_new_object();
    json_object_object_add(jobj, "op", json_object_new_string(MSG_LOGIN_OK));
    json_object_object_add(jobj, "player_id", json_object_new_int(player_id));
    
    const char* json_str = json_object_to_json_string(jobj);
    char* msg = malloc(strlen(json_str) + 2);
    sprintf(msg, "%s\n", json_str);
    
    json_object_put(jobj);
    return msg;
}

char* create_create_room_message(const char* room_id) {
    json_object* jobj = json_object_new_object();
    json_object_object_add(jobj, "op", json_object_new_string(MSG_CREATE_ROOM));
    json_object_object_add(jobj, "room_id", json_object_new_string(room_id));
    
    const char* json_str = json_object_to_json_string(jobj);
    char* msg = malloc(strlen(json_str) + 2);
    sprintf(msg, "%s\n", json_str);
    
    json_object_put(jobj);
    return msg;
}

char* create_join_room_message(const char* room_id) {
    json_object* jobj = json_object_new_object();
    json_object_object_add(jobj, "op", json_object_new_string(MSG_JOIN_ROOM));
    json_object_object_add(jobj, "room_id", json_object_new_string(room_id));
    
    const char* json_str = json_object_to_json_string(jobj);
    char* msg = malloc(strlen(json_str) + 2);
    sprintf(msg, "%s\n", json_str);
    
    json_object_put(jobj);
    return msg;
}

char* create_room_joined_message(const char* room_id, int player_num) {
    json_object* jobj = json_object_new_object();
    json_object_object_add(jobj, "op", json_object_new_string(MSG_ROOM_JOINED));
    json_object_object_add(jobj, "room_id", json_object_new_string(room_id));
    json_object_object_add(jobj, "player_num", json_object_new_int(player_num));
    
    const char* json_str = json_object_to_json_string(jobj);
    char* msg = malloc(strlen(json_str) + 2);
    sprintf(msg, "%s\n", json_str);
    
    json_object_put(jobj);
    return msg;
}

char* create_game_start_message(void) {
    json_object* jobj = json_object_new_object();
    json_object_object_add(jobj, "op", json_object_new_string(MSG_GAME_START));
    
    const char* json_str = json_object_to_json_string(jobj);
    char* msg = malloc(strlen(json_str) + 2);
    sprintf(msg, "%s\n", json_str);
    
    json_object_put(jobj);
    return msg;
}

char* create_place_line_message(int x, int y, const char* orientation) {
    json_object* jobj = json_object_new_object();
    json_object_object_add(jobj, "op", json_object_new_string(MSG_PLACE_LINE));
    json_object_object_add(jobj, "x", json_object_new_int(x));
    json_object_object_add(jobj, "y", json_object_new_int(y));
    json_object_object_add(jobj, "orientation", json_object_new_string(orientation));
    
    const char* json_str = json_object_to_json_string(jobj);
    char* msg = malloc(strlen(json_str) + 2);
    sprintf(msg, "%s\n", json_str);
    
    json_object_put(jobj);
    return msg;
}

char* create_error_message(const char* error_msg) {
    json_object* jobj = json_object_new_object();
    json_object_object_add(jobj, "op", json_object_new_string(MSG_ERROR));
    json_object_object_add(jobj, "msg", json_object_new_string(error_msg));
    
    const char* json_str = json_object_to_json_string(jobj);
    char* msg = malloc(strlen(json_str) + 2);
    sprintf(msg, "%s\n", json_str);
    
    json_object_put(jobj);
    return msg;
}

char* create_ping_message(void) {
    json_object* jobj = json_object_new_object();
    json_object_object_add(jobj, "op", json_object_new_string(MSG_PING));
    
    const char* json_str = json_object_to_json_string(jobj);
    char* msg = malloc(strlen(json_str) + 2);
    sprintf(msg, "%s\n", json_str);
    
    json_object_put(jobj);
    return msg;
}

char* create_pong_message(void) {
    json_object* jobj = json_object_new_object();
    json_object_object_add(jobj, "op", json_object_new_string(MSG_PONG));
    
    const char* json_str = json_object_to_json_string(jobj);
    char* msg = malloc(strlen(json_str) + 2);
    sprintf(msg, "%s\n", json_str);
    return msg;
}

json_object* parse_json_message(const char* msg) {
    json_object* jobj = json_tokener_parse(msg);
    if (jobj == NULL) {
        fprintf(stderr, "Failed to parse JSON: %s\n", msg);
    }
    return jobj;
}

const char* get_message_op(json_object* jobj) {
    json_object* op_obj;
    if (json_object_object_get_ex(jobj, "op", &op_obj)) {
        return json_object_get_string(op_obj);
    }
    return NULL;
}

void free_json_message(json_object* jobj) {
    json_object_put(jobj);
}