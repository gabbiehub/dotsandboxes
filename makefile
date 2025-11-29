CC = gcc
CFLAGS = -Wall -Wextra -std=c11 -pthread -I./include -g
LIBS = -ljson-c -lwebsockets -lpthread

# Source files
SRC_SERVER = src/server/main.c src/server/game.c src/server/server.c src/common/protocol.c
SRC_CLIENT = src/client/main.c src/common/protocol.c

# Object files
OBJ_SERVER = $(SRC_SERVER:.c=.o)
OBJ_CLIENT = $(SRC_CLIENT:.c=.o)

# Executables
SERVER = server
CLIENT = client

.PHONY: all build run-server run-client clean test

all: build

build: $(SERVER) $(CLIENT)

$(SERVER): $(OBJ_SERVER)
	$(CC) $(CFLAGS) -o $@ $^ $(LIBS)

$(CLIENT): $(OBJ_CLIENT)
	$(CC) $(CFLAGS) -o $@ $^ $(LIBS)

%.o: %.c
	$(CC) $(CFLAGS) -c $< -o $@

run-server: $(SERVER)
	./$(SERVER)

run-client: $(CLIENT)
	./$(CLIENT)

test:
	@echo "Running tests..."
	@echo "No tests implemented yet"

clean:
	rm -f $(SERVER) $(CLIENT)
	rm -f $(OBJ_SERVER) $(OBJ_CLIENT)
	rm -f src/server/*.o src/client/*.o src/common/*.o

install-deps:
	sudo apt update
	sudo apt install -y build-essential libjson-c-dev libwebsockets-dev

help:
	@echo "Available targets:"
	@echo "  make build       - Build server and client"
	@echo "  make run-server  - Run the server"
	@echo "  make run-client  - Run the client"
	@echo "  make clean       - Remove built files"
	@echo "  make test        - Run tests"
	@echo "  make install-deps - Install required dependencies"