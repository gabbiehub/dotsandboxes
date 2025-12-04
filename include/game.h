#ifndef GAME_H
#define GAME_H

#include "common.h"

// Game state structure
typedef struct {
    int rows;
    int cols;
    int horizontal[MAX_GRID_SIZE][MAX_GRID_SIZE];  // Horizontal lines
    int vertical[MAX_GRID_SIZE][MAX_GRID_SIZE];    // Vertical lines
    int boxes[MAX_GRID_SIZE][MAX_GRID_SIZE];        // Box ownership: -1=none, 0=player1, 1=player2
    int scores[2];                         // Player scores
    int current_turn;                      // 0 or 1
    int game_over;                         // 0=playing, 1=finished
    int winner;                            // -1=draw, 0=player1, 1=player2
} GameState;

// Room structure
typedef struct {
    char room_id[MAX_ROOM_ID];
    int players[2];                        // Client socket fds
    char usernames[2][MAX_USERNAME];
    GameState game;
    int player_count;
    int game_started;
    int grid_size;                         // Requested grid size
    pthread_mutex_t lock;
} Room;

// Game functions
void init_game_state(GameState* game, int size);
int place_line(GameState* game, int x, int y, const char* orientation, int player);
int check_boxes_completed(GameState* game, int x, int y, const char* orientation, int player, int* completed_boxes, int* num_completed);
int is_game_over(GameState* game);
char* game_state_to_json(GameState* game, const char* room_id);
char* line_placed_to_json(int x, int y, const char* orientation, int player, int* completed_boxes, int num_completed);

#endif // GAME_H