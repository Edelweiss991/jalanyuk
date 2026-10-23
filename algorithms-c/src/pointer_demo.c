#include <stdio.h>
#include <string.h>
#include "schedule.h"

// Fungsi untuk menukar dua jadwal via pointer
void swap_via_pointer(BusSchedule *a, BusSchedule *b) {
    BusSchedule temp = *a;
    *a = *b;
    *b = temp;
}

void run_pointer_demo(BusSchedule *arr, int n) {
    printf("=== DEMO POINTER (Bahasa C) — AYORA ===\n");
    printf("Demonstrasi pointer arithmetic dan akses memori dalam bahasa C\n\n");
    
    // 1. Traversal array dengan pointer arithmetic
    printf("1. TRAVERSAL ARRAY DENGAN POINTER ARITHMETIC\n");
    printf("%-5s %-18s %-18s %-20s %-10s %-10s\n", 
           "Index", "Alamat Elemen", "Alamat Field Price", "ID", "Rute", "Harga");
    printf("--------------------------------------------------------------------------------\n");
    
    BusSchedule *ptr = arr;
    for (int i = 0; i < n; i++) {
        // Akses elemen menggunakan pointer arithmetic: *(ptr + i)
        printf("%-5d %p   %p   %-10d %s→%s  Rp%d\n",
               i,
               (void *)(ptr + i),                    // Alamat elemen
               (void *)&((ptr + i)->price),          // Alamat field price
               (ptr + i)->id,
               (ptr + i)->origin,
               (ptr + i)->destination,
               (ptr + i)->price);
    }
    
    // 2. Akses field via pointer
    printf("\n2. AKSES FIELD VIA OPERATOR PANAH (->)\n");
    printf("Jadwal pertama:\n");
    printf("  ID              : %d\n", ptr->id);
    printf("  Origin          : %s\n", ptr->origin);
    printf("  Destination     : %s\n", ptr->destination);
    printf("  Departure       : %02d:%02d\n", ptr->departureMinutes / 60, ptr->departureMinutes % 60);
    printf("  Price           : Rp%d\n", ptr->price);
    
    // 3. Demonstrasi swap via pointer
    if (n >= 2) {
        printf("\n3. DEMONSTRASI SWAP VIA POINTER\n");
        
        // Buat salinan kecil untuk demo
        BusSchedule demo[2];
        demo[0] = arr[0];
        demo[1] = arr[1];
        
        printf("Sebelum swap:\n");
        printf("  demo[0]: %s → %s (Rp%d)\n", demo[0].origin, demo[0].destination, demo[0].price);
        printf("  demo[1]: %s → %s (Rp%d)\n", demo[1].origin, demo[1].destination, demo[1].price);
        
        // Swap menggunakan pointer
        swap_via_pointer(&demo[0], &demo[1]);
        
        printf("Sesudah swap_via_pointer(&demo[0], &demo[1]):\n");
        printf("  demo[0]: %s → %s (Rp%d)\n", demo[0].origin, demo[0].destination, demo[0].price);
        printf("  demo[1]: %s → %s (Rp%d)\n", demo[1].origin, demo[1].destination, demo[1].price);
    }
    
    // 4. Pointer arithmetic untuk iterasi
    printf("\n4. ITERASI DENGAN INCREMENT POINTER\n");
    printf("Menampilkan semua harga dengan pointer increment:\n");
    BusSchedule *p = arr;
    for (int i = 0; i < n; i++, p++) {
        printf("  Jadwal %d: Rp%d (alamat: %p)\n", i + 1, p->price, (void *)&(p->price));
    }
    
    printf("\n");
}
