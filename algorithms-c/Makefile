CC = gcc
CFLAGS = -std=c11 -Wall -Wextra -O2
SRC_DIR = src
TEST_DIR = tests
TARGET = jalanyuk_algorithms

SOURCES = $(SRC_DIR)/main.c $(SRC_DIR)/pointer_demo.c $(SRC_DIR)/struct_demo.c
HEADERS = $(SRC_DIR)/schedule.h

all: $(TARGET)

$(TARGET): $(SOURCES) $(HEADERS)
	$(CC) $(CFLAGS) $(SOURCES) -o $(TARGET)

test: $(TARGET)
	@echo "=== Testing Pointer Mode ==="
	@cat $(TEST_DIR)/sample_input.csv | ./$(TARGET) pointer
	@echo ""
	@echo "=== Testing Struct Mode ==="
	@cat $(TEST_DIR)/sample_input.csv | ./$(TARGET) struct

clean:
	rm -f $(TARGET)

.PHONY: all test clean
