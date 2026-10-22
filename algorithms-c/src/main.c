#define _POSIX_C_SOURCE 200809L /* untuk strtok_r di mode -std=c11 ketat */
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <errno.h>
#include "schedule.h"

#define MAX_SCHEDULES 50
#define MAX_LINE 512

int main(int argc, char *argv[]) {
    // Validasi argumen
    if (argc != 2) {
        fprintf(stderr, "Usage: %s <mode>\n", argv[0]);
        fprintf(stderr, "mode: pointer | struct\n");
        return 1;
    }
    
    char *mode = argv[1];
    if (strcmp(mode, "pointer") != 0 && strcmp(mode, "struct") != 0) {
        fprintf(stderr, "Error: mode tidak dikenal '%s'\n", mode);
        fprintf(stderr, "Mode yang valid: pointer | struct\n");
        return 1;
    }
    
    // Baca data dari stdin
    BusSchedule schedules[MAX_SCHEDULES];
    int count = 0;
    char line[MAX_LINE];
    
    while (fgets(line, sizeof(line), stdin) && count < MAX_SCHEDULES) {
        // Hapus newline
        line[strcspn(line, "\n")] = 0;
        
        // Skip baris kosong
        if (strlen(line) == 0) {
            continue;
        }
        
        // Parse CSV: id,origin,destination,departureMinutes,price
        char origin[100], destination[100];
        char *token;
        char *rest = line;
        int field = 0;
        long id = 0, departureMinutes = 0, price = 0;
        int valid = 1;
        
        while ((token = strtok_r(rest, ",", &rest)) != NULL && field < 5) {
            char *endptr;
            
            switch (field) {
                case 0: // id
                    errno = 0;
                    id = strtol(token, &endptr, 10);
                    if (errno != 0 || *endptr != '\0' || id < 1 || id > 1000000) {
                        fprintf(stderr, "Warning: ID tidak valid '%s', baris dilewati\n", token);
                        valid = 0;
                    }
                    break;
                    
                case 1: // origin
                    strncpy(origin, token, 99);
                    origin[99] = '\0';
                    break;
                    
                case 2: // destination
                    strncpy(destination, token, 99);
                    destination[99] = '\0';
                    break;
                    
                case 3: // departureMinutes
                    errno = 0;
                    departureMinutes = strtol(token, &endptr, 10);
                    if (errno != 0 || *endptr != '\0' || departureMinutes < 0 || departureMinutes > 1439) {
                        fprintf(stderr, "Warning: departureMinutes tidak valid '%s', baris dilewati\n", token);
                        valid = 0;
                    }
                    break;
                    
                case 4: // price
                    errno = 0;
                    price = strtol(token, &endptr, 10);
                    if (errno != 0 || *endptr != '\0' || price < 0 || price > 100000000) {
                        fprintf(stderr, "Warning: price tidak valid '%s', baris dilewati\n", token);
                        valid = 0;
                    }
                    break;
            }
            field++;
        }
        
        // Pastikan semua field ada
        if (field != 5) {
            fprintf(stderr, "Warning: baris tidak lengkap, dilewati\n");
            valid = 0;
        }
        
        // Simpan jika valid
        if (valid) {
            schedules[count].id = (int)id;
            strncpy(schedules[count].origin, origin, 99);
            schedules[count].origin[99] = '\0';
            strncpy(schedules[count].destination, destination, 99);
            schedules[count].destination[99] = '\0';
            schedules[count].departureMinutes = (int)departureMinutes;
            schedules[count].price = (int)price;
            count++;
        }
    }
    
    // Validasi: harus ada data
    if (count == 0) {
        fprintf(stderr, "Error: tidak ada data jadwal yang valid\n");
        return 2;
    }
    
    // Jalankan demo sesuai mode
    if (strcmp(mode, "pointer") == 0) {
        run_pointer_demo(schedules, count);
    } else {
        // Mode struct: gunakan data yang sama (cast ke TrainSchedule)
        run_struct_demo((TrainSchedule *)schedules, count);
    }
    
    return 0;
}
