#include <stdio.h>
#include <string.h>
#include <stdlib.h>
#include "game.h"

void init_game_state(GameState* game, int size) {
    // User specifies boxes (e.g. 3x3 boxes), so we need size+1 dots (e.g. 4x4 dots)
    int dot_size = size + 1;
    if (dot_size < 3) dot_size = 3;
    if (dot_size > MAX_GRID_SIZE) dot_size = MAX_GRID_SIZE;
    
    game->rows = dot_size;
    game->cols = dot_size;
    
    memset(game->horizontal, 0, sizeof(game->horizontal));
    memset(game->vertical, 0, sizeof(game->vertical));
    for (int i = 0; i < MAX_GRID_SIZE; i++) {
        for (int j = 0; j < MAX_GRID_SIZE; j++) {
            game->boxes[i][j] = -1;
        }
    }
    game->scores[0] = 0;
    game->scores[1] = 0;
    game->current_turn = 0;
    game->game_over = 0;
    game->winner = -1;
}

static void append_int_array(char* buf, size_t* off, const int* arr, int len) {
    *off += sprintf(buf + *off, "[");
    for (int i = 0; i < len; i++) {
        *off += sprintf(buf + *off, "%d%s", arr[i], (i+1<len)?",":"");
    }
    *off += sprintf(buf + *off, "]");
}

char* game_state_to_json(GameState* game, const char* room_id) {
    // Build JSON manually to avoid extra deps; matches protocol.md
    // Allocate a generous buffer
    size_t cap = 8192;
    char* out = (char*)malloc(cap);
    size_t off = 0;
    off += sprintf(out + off, "{\"op\":\"%s\",", MSG_GAME_STATE);
    off += sprintf(out + off, "\"room_id\":\"%s\",", room_id);
    off += sprintf(out + off, "\"turn\":%d,", game->current_turn);
    off += sprintf(out + off, "\"scores\":");
    int scores[2] = {game->scores[0], game->scores[1]};
    append_int_array(out, &off, scores, 2);
    off += sprintf(out + off, ",\"board\":{");

    int grid_rows = game->rows;
    int grid_cols = game->cols;
    int box_rows = grid_rows - 1;
    int box_cols = grid_cols - 1;

    // horizontal: grid_rows x box_cols (horizontal lines between adjacent dots in each row)
    off += sprintf(out + off, "\"horizontal\":[");
    for (int i = 0; i < grid_rows; i++) {
        off += sprintf(out + off, "[");
        for (int j = 0; j < box_cols; j++) {
            off += sprintf(out + off, "%d%s", game->horizontal[i][j], (j+1<box_cols)?",":"");
        }
        off += sprintf(out + off, "]%s", (i+1<grid_rows)?",":"");
    }
    off += sprintf(out + off, "],");

    // vertical: box_rows x grid_cols (vertical lines between adjacent dots in each column)
    off += sprintf(out + off, "\"vertical\":[");
    for (int i = 0; i < box_rows; i++) {
        off += sprintf(out + off, "[");
        for (int j = 0; j < grid_cols; j++) {
            off += sprintf(out + off, "%d%s", game->vertical[i][j], (j+1<grid_cols)?",":"");
        }
        off += sprintf(out + off, "]%s", (i+1<box_rows)?",":"");
    }
    off += sprintf(out + off, "],");

    // boxes (rows-1) x (cols-1)
    off += sprintf(out + off, "\"boxes\":[");
    for (int i = 0; i < box_rows; i++) {
        off += sprintf(out + off, "[");
        for (int j = 0; j < box_cols; j++) {
            off += sprintf(out + off, "%d%s", game->boxes[i][j], (j+1<box_cols)?",":"");
        }
        off += sprintf(out + off, "]%s", (i+1<box_rows)?",":"");
    }
    off += sprintf(out + off, "]},");

    off += sprintf(out + off, "\"game_over\":%d,\"winner\":%d}", game->game_over, game->winner);
    // append newline as framing delimiter
    out[off++] = '\n';
    out[off] = '\0';
    return out;
}

static int check_box(GameState* game, int box_row, int box_col, int player) {
    int box_rows = game->rows - 1;
    int box_cols = game->cols - 1;
    // Check if box at (box_row, box_col) is complete
    if (box_row < 0 || box_row >= box_rows || box_col < 0 || box_col >= box_cols) return 0;
    if (game->boxes[box_row][box_col] != -1) return 0; // already owned
    
    // Check 4 edges: top, bottom, left, right
    // horizontal[row][col]: lines along row, between col and col+1
    // vertical[row][col]: lines along col, between row and row+1
    int top = game->horizontal[box_row][box_col];
    int bottom = game->horizontal[box_row + 1][box_col];
    int left = game->vertical[box_row][box_col];
    int right = game->vertical[box_row][box_col + 1];
    
    if (top && bottom && left && right) {
        game->boxes[box_row][box_col] = player;
        game->scores[player]++;
        return 1;
    }
    return 0;
}

int place_line(GameState* game, int x, int y, const char* orientation, int player) {
    if (game->game_over) return -1;
    int scored = 0;
    int grid_rows = game->rows;
    int grid_cols = game->cols;
    int box_rows = grid_rows - 1;
    int box_cols = grid_cols - 1;
    
    if (orientation && strcmp(orientation, ORIENTATION_HORIZONTAL) == 0) {
        // horizontal[y][x]: y is row (0 to grid_rows-1), x is col (0 to box_cols-1)
        if (y < 0 || y >= grid_rows || x < 0 || x >= box_cols) return -1;
        if (game->horizontal[y][x] == 1) return -2;
        game->horizontal[y][x] = 1;
        
        // Check boxes above and below this horizontal line
        if (y > 0) scored += check_box(game, y - 1, x, player);
        if (y < box_rows) scored += check_box(game, y, x, player);
        
    } else if (orientation && strcmp(orientation, ORIENTATION_VERTICAL) == 0) {
        // vertical[y][x]: y is row (0 to box_rows-1), x is col (0 to grid_cols-1)
        if (y < 0 || y >= box_rows || x < 0 || x >= grid_cols) return -1;
        if (game->vertical[y][x] == 1) return -2;
        game->vertical[y][x] = 1;
        
        // Check boxes left and right of this vertical line
        if (x > 0) scored += check_box(game, y, x - 1, player);
        if (x < box_cols) scored += check_box(game, y, x, player);
        
    } else {
        return -1;
    }
    
    // Only switch turn if no box was completed
    if (scored == 0) {
        game->current_turn = (game->current_turn == 0) ? 1 : 0;
    }
    
    // Check if game is over
    int total_boxes = box_rows * box_cols;
    int filled = game->scores[0] + game->scores[1];
    if (filled >= total_boxes) {
        game->game_over = 1;
        if (game->scores[0] > game->scores[1]) {
            game->winner = 0;
        } else if (game->scores[1] > game->scores[0]) {
            game->winner = 1;
        } else {
            game->winner = -1; // draw
        }
    }
    
    return 0;
}

int check_boxes_completed(GameState* game, int x, int y, const char* orientation, int player, int* completed_boxes, int* num_completed) {
    (void)game; (void)x; (void)y; (void)orientation; (void)player; (void)completed_boxes; (void)num_completed;
    return 0; // TODO: implement full box detection later
}

int is_game_over(GameState* game) {
    return game->game_over;
}

char* line_placed_to_json(int x, int y, const char* orientation, int player, int* completed_boxes, int num_completed) {
    (void)completed_boxes; (void)num_completed;
    char* out = (char*)malloc(256);
    snprintf(out, 256, "{\"op\":\"%s\",\"x\":%d,\"y\":%d,\"orientation\":\"%s\",\"player\":%d}\n", MSG_LINE_PLACED, x, y, orientation, player);
    return out;
}
