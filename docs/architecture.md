# Arsitektur AYORA

## Gambaran Umum

AYORA adalah aplikasi tiga lapis + satu modul native:

```
Browser (React SPA)
   │  REST/JSON, JWT Bearer
   ▼
Backend Express (TypeScript)  ── subprocess (execFile, timeout 5s, input tervalidasi) ──▶  Biner C (algorithms-c)
   │
   ▼
PostgreSQL (Prisma ORM)
```

## Frontend (`frontend/`)
- **React 18 + TypeScript + Vite**, routing dengan React Router; data fetching & caching dengan TanStack Query.
- **State**: `AuthContext` (user, token di localStorage `jalanyuk-token`, `loginWithSession`, `updateUser`), `ThemeProvider` di `hooks/useTheme` (class `dark` di `<html>`, localStorage `jalanyuk-theme`, default mengikuti `prefers-color-scheme`).
- **API client** (`src/services/api.ts`): membungkus respons kontrak `{success, data}` / `{success, error}`, menyisipkan header Authorization, dan menyediakan adapter (`searchApi`, `busApi`, `trainApi`, `scheduleApi`, `bookingApi`, `adminApi`, `labApi`) agar halaman konsisten dengan bentuk data backend.
- **Halaman publik**: Home, Search (bus/kereta), Detail jadwal + SeatMap, Bantuan.
- **Halaman customer** (ProtectedRoute): Login, Register, Checkout, Dashboard, Pesanan Saya, Detail Booking/E-ticket.
- **Halaman admin** (AdminRoute + `AdminLayout`): Overview, Bus, Kereta, Booking, Pengguna, Laporan, Pengaturan, Audit Log, Algorithm Lab. Tidak ada tautan Algorithm Lab di area publik/customer.
- **Komponen UI** reusable di `src/components/ui.tsx` (Button, Input, Card, Modal, Toast, Pagination, dsb.), styling Tailwind dengan design tokens (CSS variables light/dark).

## Backend (`backend/`)
Struktur `src/`:
- `routes/` — definisi endpoint: `auth.ts`, `search.ts` (pencarian, detail, meta), `bookings.ts` (booking & pembayaran), `admin.ts`, `algorithmLab.ts`.
- `services/` — logika bisnis: `authService`, `bookingService` (harga, kupon, reservasi, pembayaran, refund, kedaluwarsa), `cDemo` (jembatan ke modul C + dataset lab).
- `middleware/` — `auth` (requireAuth: verifikasi JWT + muat user dari DB; requireAdmin: role ADMIN), `validate` (Zod), `error` (error handler terpusat).
- `validators/schemas.ts` — skema Zod untuk semua input.
- `algorithms/` — implementasi manual Merge Sort, Linear Search, Binary Search + tipe log (`types.ts`).
- `config/` — `env` (Zod env), `db` (PrismaClient singleton).
- `utils/` — response helper, AppError, audit, booking code, asyncHandler.

### Alur Booking (integritas)
1. Customer memilih jadwal & kursi di frontend — pilihan frontend **bukan** bukti reservasi.
2. `POST /api/bookings` (login wajib): server memuat jadwal dari DB, memeriksa status & kursi, menghitung ulang harga (subtotal dari tarif DB, biaya layanan dari `SystemSetting`, diskon kupon tervalidasi), lalu dalam **satu transaksi** membuat Booking (PENDING, kedaluwarsa 15 menit), BookingItem, Passenger, Payment (PENDING), dan SeatReservation (HELD) yang dilindungi unique constraint — tabrakan kursi menghasilkan 409 `SEAT_TAKEN` dan seluruh transaksi rollback.
3. `POST /api/payments/simulate`: skenario SUCCESS → Payment PAID, Booking CONFIRMED, reservasi CONFIRMED, kursi `isBooked=true`, e-ticket terbit. FAILED → Payment FAILED (booking tetap PENDING, dapat dicoba lagi). EXPIRED → semua dibebaskan. Booking PENDING yang melewati `expiresAt` dikedaluwarsakan secara lazy (`expireStaleBookings`).
4. Pembatalan: PENDING → CANCELLED; CONFIRMED/PAID → REFUND_REQUESTED + Payment REFUND_PENDING + baris Refund untuk diproses admin; kursi dibebaskan.

### Keamanan
- JWT ditandatangani `JWT_SECRET`; payload `{sub, role}`; middleware memuat ulang user dari DB sehingga akun nonaktif/role berubah langsung berlaku.
- Password bcrypt (cost 10). Registrasi publik memaksa role CUSTOMER.
- Rate limit global + limiter khusus login. Validasi Zod di semua endpoint tulis.
- Audit log untuk aksi admin (CRUD master, perubahan status booking, refund, role, settings).

## Modul C (`algorithms-c/`)
- C11, dikompilasi `make` (gcc `-std=c11 -Wall -Wextra -O2`) menjadi `jalanyuk_algorithms`.
- `main.c` membaca baris CSV tervalidasi dari stdin: `id,origin,destination,departureMinutes,price`; mode `pointer` / `struct` dari argv.
- Backend menjalankannya via `execFile` dengan timeout, buffer terbatas, dan dataset yang dibersihkan (karakter nama dibatasi, rentang angka diperiksa). Tidak ada jalur untuk mengeksekusi kode kiriman pengguna.
- Output demo pointer menampilkan alamat memori aktual proses (`%p`), traversal `*(ptr+i)`, akses `ptr->field`, dan swap via pointer; demo struct menampilkan array of struct `BusSchedule`/`TrainSchedule`, akses `.` dan `->`, passing by value vs pointer, dan `sizeof`.

## Database
PostgreSQL 16 dengan Prisma. 24 model — detail relasi, enum status, dan constraint ada di `docs/database.md`. Migration di `backend/prisma/migrations/`, seed idempoten-ish untuk development di `backend/prisma/seed.ts` (jadwal relatif terhadap tanggal seed agar selalu dapat dipesan).

## Pengujian
- Backend (Vitest + Supertest): unit algoritma (termasuk kasus kosong/duplikat/tidak terurut), validasi output modul C, integrasi API (auth, RBAC 401/403, booking & perhitungan harga, idempotency, double booking 409, pembayaran, isolasi antar-customer).
- Frontend (Vitest + RTL): util format (IDR, durasi, tanggal) dan interaksi SeatMap.
