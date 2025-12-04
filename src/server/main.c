#include <stdio.h>
#include <stdlib.h>
#include <signal.h>
#include "server.h"

static volatile int running = 1;
static void handle_sigint(int sig) { (void)sig; running = 0; }

int main(void) {
    signal(SIGINT, handle_sigint);
    init_server();
    start_server();
    return 0;
}
