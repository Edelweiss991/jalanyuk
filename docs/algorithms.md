# Algoritma JalanYuk — Array, Pointer, Struct, Sorting, Searching

Seluruh fitur di dokumen ini hanya dapat diakses admin melalui **Algorithm Lab** (`/admin/algorithm-lab`, API `/api/algorithm-lab/*` dengan middleware role ADMIN di backend). Algoritma berjalan pada data jadwal bus/kereta nyata dari database — log yang ditampilkan adalah hasil eksekusi, bukan teks hardcoded.

## Array
Dataset lab adalah array jadwal terstruktur `{id, transportType, label, origin, destination, departureMinutes, durationMinutes, price}` yang diambil dari `BusSchedule`/`TrainSchedule`. Lab menampilkan array sebelum diproses (dengan indeks), array sesudah sorting, dan daftar harga sebagai demo array numerik.

## Merge Sort (Sorting) — implementasi manual
File: `backend/src/algorithms/mergeSort.ts`. Rekursif divide & conquer tanpa memakai `Array.prototype.sort` untuk logika utama:
- **Divide**: array dibagi dua sampai ukuran 1.
- **Merge**: dua subarray terurut digabung sambil membandingkan elemen terdepan.
- Setiap perbandingan dicatat ke log: nomor langkah, timestamp, operasi, nilai yang dibandingkan, keputusan, dan hasil tahap (termasuk snapshot hasil merge).
- Statistik: `comparisons`, `merges`. Kompleksitas waktu **O(n log n)**, ruang **O(n)**.
- Kunci pengurutan: bus/kereta berdasarkan `price`, `departureMinutes` (waktu berangkat), `duration` (durasi rute), `label` (nama operator/kereta).
- Kasus tepi teruji: array kosong, satu elemen, duplikat.

## Linear Search (Searching) — implementasi manual
File: `backend/src/algorithms/linearSearch.ts`. Memeriksa elemen satu per satu dari indeks 0 (loop manual, bukan `find`/`indexOf`) hingga predicate cocok (label operator/nama kereta/kota asal/tujuan, pencocokan *contains* tidak peka huruf). Log mencatat indeks diperiksa, nilai pembanding, keputusan; berhenti pada kecocokan pertama. Kompleksitas **O(n)**; target tidak ditemukan → seluruh elemen diperiksa (`comparisons = n`).

## Binary Search (Searching) — implementasi manual
File: `backend/src/algorithms/binarySearch.ts`. Mencari tarif numerik pada array yang **sudah terurut ascending menurut kunci yang dicari**:
- Prasyarat diperiksa di awal — array tidak terurut → `AppError 400 BINARY_SEARCH_REQUIRES_SORTED`.
- Log mencatat `low`, `mid`, `high`, nilai pembanding, dan keputusan setiap langkah. Kompleksitas **O(log n)**.
- Di endpoint, dataset selalu diurutkan dulu dengan Merge Sort internal sebelum Binary Search dijalankan.

## Pointer & Struct (Bahasa C)
Folder: `algorithms-c/` (C11). Struktur data:

```c
typedef struct {
    int id;
    char origin[100];
    char destination[100];
    int departureMinutes;
    int price;
} BusSchedule;   // TrainSchedule identik bentuknya
```

- `pointer_demo.c` — traversal array hanya dengan pointer arithmetic (`*(ptr + i)`), pencetakan alamat elemen & alamat field (`%p`, alamat aktual saat runtime), akses field lewat operator panah (`ptr->price`), dan `swap_via_pointer(BusSchedule*, BusSchedule*)`.
- `struct_demo.c` — array of struct, akses operator titik pada variabel lokal vs operator panah pada pointer, passing struct by value vs by pointer, jadwal termurah/tercepat, `sizeof` struct.
- `main.c` — membaca CSV tervalidasi dari stdin (`id,origin,destination,departureMinutes,price`), menolak baris di luar rentang (id 1–1.000.000, menit 0–1439, harga 0–100.000.000, string dibatasi 99 karakter). Mode dari argv: `pointer` | `struct`.

Kompilasi & uji manual:
```bash
cd algorithms-c
make            # gcc -std=c11 -Wall -Wextra -O2 → ./jalanyuk_algorithms
make test       # menjalankan kedua mode dengan tests/sample_input.csv
./jalanyuk_algorithms pointer < tests/sample_input.csv
```

Integrasi backend (`backend/src/services/cDemo.ts`): dataset dari DB dikonversi ke baris CSV tervalidasi (nama hanya `[A-Za-z0-9 .'-]`, maks 50 baris), biner dijalankan via `execFile` dengan timeout 5 detik & buffer terbatas; alamat `0x…` diekstrak dari output untuk ditampilkan. Tidak ada endpoint publik untuk demo ini dan tidak ada kode bebas dari pengguna yang dieksekusi.

Hubungan dengan TypeScript: `struct` C dan `interface` TypeScript mirip bentuk (kumpulan field bernama), tetapi **tidak identik** — struct C adalah tata letak memori biner dengan pointer & alamat nyata, sedangkan interface TS hanya kontrak tipe saat kompilasi.

## Log & Ekspor
Setiap langkah log: `{step, timestamp, algorithm, dataType, operation, indices?, comparedValues?, low?, mid?, high?, decision, result}`. Kontrol di UI admin: Start (auto-play + pilihan kecepatan), Pause, Step, Reset, Clear Log, Copy Log, Export Log ke JSON/CSV (endpoint `/api/algorithm-lab/export`). Log algoritma terpisah dari Audit Log sistem — audit administratif tidak dapat diubah dari Lab.
