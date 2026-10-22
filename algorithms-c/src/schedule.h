#ifndef SCHEDULE_H
#define SCHEDULE_H

// Struct untuk jadwal bus
typedef struct {
    int id;
    char origin[100];
    char destination[100];
    int departureMinutes;
    int price;
} BusSchedule;

// Struct untuk jadwal kereta (identik dengan BusSchedule untuk demo)
typedef struct {
    int id;
    char origin[100];
    char destination[100];
    int departureMinutes;
    int price;
} TrainSchedule;

// Deklarasi fungsi demo pointer
void run_pointer_demo(BusSchedule *arr, int n);

// Deklarasi fungsi demo struct
void run_struct_demo(TrainSchedule *arr, int n);

#endif // SCHEDULE_H
