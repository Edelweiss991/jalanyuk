# JalanYuk Algorithms (C)

Modul algoritma dalam bahasa C untuk demonstrasi konsep pointer dan struct dalam konteks sistem booking transportasi JalanYuk.

## Konsep yang Didemonstrasikan

### 1. Pointer
Pointer adalah variabel yang menyimpan alamat memori variabel lain. Dalam C, pointer memberikan kontrol langsung terhadap memori dan efisiensi dalam manipulasi data.

**Fitur yang didemonstrasikan:**
- **Pointer arithmetic**: navigasi array dengan `ptr + i`, `*(ptr + i)`
- **Operator panah (`->`)**: akses field struct melalui pointer
- **Alamat memori**: menampilkan alamat aktual dengan `%p`
- **Pass by pointer**: modifikasi data tanpa copy (fungsi `swap_via_pointer`)
- **Efisiensi**: passing pointer (8 bytes) vs copy struct (200+ bytes)

### 2. Struct
Struct adalah tipe data komposit yang menggabungkan beberapa field dengan tipe berbeda menjadi satu unit.

**Fitur yang didemonstrasikan:**
- **Array of struct**: penyimpanan koleksi jadwal dalam satu array
- **Operator titik (`.`)**: akses field pada variabel struct
- **Operator panah (`->`)**: akses field pada pointer ke struct
- **Sizeof**: ukuran memori struct dan array
- **Pass by value vs pass by pointer**: perbandingan copy vs reference

## Struktur Data

