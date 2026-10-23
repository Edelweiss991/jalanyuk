#include <stdio.h>
#include <string.h>
#include "schedule.h"

// Fungsi untuk mencetak jadwal by value (copy)
void print_schedule_by_value(TrainSchedule s) {
    printf("  [By Value] %s → %s, Berangkat %02d:%02d, Rp%d\n",
           s.origin, s.destination,
           s.departureMinutes / 60, s.departureMinutes % 60,
           s.price);
}

// Fungsi untuk mencetak jadwal by pointer (reference)
void print_schedule_by_pointer(TrainSchedule *s) {
    printf("  [By Pointer] %s → %s, Berangkat %02d:%02d, Rp%d (alamat: %p)\n",
           s->origin, s->destination,
           s->departureMinutes / 60, s->departureMinutes % 60,
           s->price, (void *)s);
}

void run_struct_demo(TrainSchedule *arr, int n) {
    printf("=== DEMO STRUCT (Bahasa C) — AYORA ===\n");
    printf("Demonstrasi penggunaan struct, akses field, dan array of struct\n\n");
    
    // 1. Akses field via operator titik pada variabel lokal
    printf("1. AKSES FIELD VIA OPERATOR TITIK (.)\n");
    if (n > 0) {
        TrainSchedule local = arr[0];
        printf("Variabel lokal (copy dari arr[0]):\n");
        printf("  local.id              = %d\n", local.id);
        printf("  local.origin          = %s\n", local.origin);
        printf("  local.destination     = %s\n", local.destination);
        printf("  local.departureMinutes= %d (%02d:%02d)\n", 
               local.departureMinutes,
               local.departureMinutes / 60,
               local.departureMinutes % 60);
        printf("  local.price           = Rp%d\n", local.price);
    }
    
    // 2. Akses field via operator panah pada pointer
    printf("\n2. AKSES FIELD VIA OPERATOR PANAH (->)\n");
    if (n > 0) {
        TrainSchedule *ptr = &arr[0];
        printf("Pointer ke arr[0] (alamat: %p):\n", (void *)ptr);
        printf("  ptr->id              = %d\n", ptr->id);
        printf("  ptr->origin          = %s\n", ptr->origin);
        printf("  ptr->destination     = %s\n", ptr->destination);
        printf("  ptr->departureMinutes= %d (%02d:%02d)\n",
               ptr->departureMinutes,
               ptr->departureMinutes / 60,
               ptr->departureMinutes % 60);
        printf("  ptr->price           = Rp%d\n", ptr->price);
    }
    
    // 3. Tabel jadwal
    printf("\n3. TABEL JADWAL KERETA\n");
    printf("%-5s %-20s %-20s %-10s %-12s\n",
           "ID", "Asal", "Tujuan", "Berangkat", "Harga");
    printf("------------------------------------------------------------------------\n");
    
    for (int i = 0; i < n; i++) {
        printf("%-5d %-20s %-20s %02d:%02d      Rp%-10d\n",
               arr[i].id,
               arr[i].origin,
               arr[i].destination,
               arr[i].departureMinutes / 60,
               arr[i].departureMinutes % 60,
               arr[i].price);
    }
    
    // 4. Cari jadwal termurah dan tercepat dengan loop pointer
    printf("\n4. ANALISIS JADWAL (LOOP POINTER)\n");
    if (n > 0) {
        TrainSchedule *cheapest = arr;
        TrainSchedule *earliest = arr;
        
        TrainSchedule *ptr = arr;
        for (int i = 0; i < n; i++, ptr++) {
            if (ptr->price < cheapest->price) {
                cheapest = ptr;
            }
            if (ptr->departureMinutes < earliest->departureMinutes) {
                earliest = ptr;
            }
        }
        
        printf("Jadwal Termurah:\n");
        printf("  %s → %s, Berangkat %02d:%02d, Rp%d\n",
               cheapest->origin, cheapest->destination,
               cheapest->departureMinutes / 60, cheapest->departureMinutes % 60,
               cheapest->price);
        
        printf("Jadwal Tercepat (paling pagi):\n");
        printf("  %s → %s, Berangkat %02d:%02d, Rp%d\n",
               earliest->origin, earliest->destination,
               earliest->departureMinutes / 60, earliest->departureMinutes % 60,
               earliest->price);
    }
    
    // 5. Passing by value vs by pointer
    printf("\n5. PASSING BY VALUE VS BY POINTER\n");
    if (n > 0) {
        printf("Jadwal pertama:\n");
        print_schedule_by_value(arr[0]);    // Copy seluruh struct
        print_schedule_by_pointer(&arr[0]); // Hanya copy alamat
    }
    
    // 6. Sizeof dan penjelasan array of struct
    printf("\n6. INFORMASI MEMORI\n");
    printf("sizeof(BusSchedule)   = %zu bytes\n", sizeof(BusSchedule));
    printf("sizeof(TrainSchedule) = %zu bytes\n", sizeof(TrainSchedule));
    printf("Total memori array    = %zu bytes (%d elemen × %zu bytes)\n",
           n * sizeof(TrainSchedule), n, sizeof(TrainSchedule));
    
    printf("\nPenjelasan:\n");
    printf("- Array of struct: arr[0], arr[1], ... disimpan berurutan di memori\n");
    printf("- Setiap elemen berukuran %zu bytes\n", sizeof(TrainSchedule));
    printf("- Akses arr[i] sama dengan *(arr + i)\n");
    printf("- Passing by value: copy seluruh struct (%zu bytes)\n", sizeof(TrainSchedule));
    printf("- Passing by pointer: copy hanya alamat (%zu bytes)\n", sizeof(TrainSchedule *));
    
    printf("\n");
}
