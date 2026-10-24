# AYORA — Platform Pemesanan Tiket Bus & Kereta Antarkota

**AYORA** adalah platform pemesanan tiket transportasi darat Indonesia untuk **bus antarkota** dan **kereta antarkota**. Dibangun sebagai aplikasi full-stack yang dapat dijalankan end-to-end: frontend React, backend Express, database PostgreSQL via Prisma, autentikasi JWT dengan RBAC, dashboard customer, dashboard admin, pembayaran simulasi, serta **Algorithm Lab khusus admin** (Array, Pointer & Struct bahasa C, Merge Sort, Linear Search, Binary Search dengan log eksekusi nyata).

> **Penting:** Seluruh jadwal, operator, tarif, dan pembayaran di aplikasi ini adalah **Data Simulasi** untuk keperluan demonstrasi/pembelajaran. Tidak ada integrasi operator, inventaris kursi nyata, atau payment gateway sungguhan. Label "Data Simulasi" dan "Pembayaran Simulasi" ditampilkan di aplikasi.

Tagline: *“Perjalanan Lebih Mudah, Tiket dalam Satu Genggaman.”*

## Demo Online

- **Website (frontend):** https://jalanyuk-rho.vercel.app
- **API (backend):** https://jalanyuk-api.onrender.com — health check: `/api/health`
- **Akun demo:** customer `demo@jalanyuk.id` / `demo123` — admin `admin@jalanyuk.id` / `admin123`
- Catatan: backend memakai paket gratis yang tidur saat tidak dipakai; muat pertama setelah idle bisa memakan waktu ±30–60 detik (cold start).

Deployment: frontend di Vercel (root directory `frontend`, env `VITE_API_URL` menunjuk ke API), backend + PostgreSQL di Render dari blueprint `render.yaml` di repo ini (build menjalankan migrasi Prisma dan mengompilasi modul C; seed dijalankan terpisah satu kali).

---

## Fitur Utama

**Customer**
- Homepage dengan search widget tab Bus/Kereta, rute & destinasi populer, promo.
- Pencarian bus & kereta: filter operator, kelas, rentang harga, jam berangkat, fasilitas; 7 opsi sorting; pagination; parameter tersimpan di URL.
- Detail jadwal + peta kursi interaktif (status AVAILABLE / HELD / BOOKED dari backend).
- Checkout: data penumpang tervalidasi, kupon (AYORA10, HEMAT20, NEWUSER), harga **dihitung ulang di backend**, pembayaran simulasi (berhasil/gagal/kedaluwarsa).
- E-ticket dengan kode booking `JY-XXXXXXXX` setelah pembayaran berhasil.
- Dashboard customer: profil, Pesanan Saya, detail & pembatalan (refund simulasi), perjalanan mendatang.
- Tema Light/Dark (toggle, tersimpan di localStorage, mengikuti preferensi sistem saat pertama kali).

**Admin** (role ADMIN, dibuat via seed)
- Overview dari data database nyata: tiket terjual per tipe, total booking/customer, status, pendapatan, grafik 14 hari, rute populer, aktivitas terbaru.
- Manajemen Bus & Kereta: CRUD operator, terminal/stasiun, armada/kereta, rute, jadwal, tarif, status.
- Manajemen Booking: pencarian & filter, ubah status tervalidasi + audit log, proses refund.
- Manajemen Pengguna, Laporan + ekspor CSV, Pengaturan sistem (SystemSetting), Kupon, Audit Log.
- **Algorithm Lab** — hanya admin (lihat bawah).

**Keamanan & integritas**
- RBAC: register publik selalu CUSTOMER; endpoint admin & Algorithm Lab dilindungi middleware backend (tanpa token → 401, CUSTOMER → 403).
- Password di-hash bcrypt; JWT Bearer; rate limiting; validasi Zod di server.
- Anti double-booking: transaksi database + unique constraint `SeatReservation(transportType, scheduleId, seatNumber)`; konflik → HTTP 409.
- Status booking, reservasi kursi, dan pembayaran terpisah (lihat `docs/database.md`).

## Algorithm Lab (Khusus Admin)

Route: `/admin/algorithm-lab` — API: `/api/algorithm-lab/*` (middleware `requireAuth` + `requireAdmin`).

- **Array**: visualisasi dataset jadwal sebagai array terindeks (sebelum/sesudah proses).
- **Pointer & Struct (Bahasa C)**: modul C11 di `algorithms-c/` dikompilasi dengan gcc dan dijalankan backend sebagai subprocess terisolasi (timeout 5 detik, input dataset tervalidasi dari DB, **bukan** kode bebas dari user). Output menampilkan alamat memori aktual (`0x…`) dari traversal pointer dan demo array-of-struct.
- **Merge Sort** manual (bukan `sort()` bawaan) untuk bus/kereta berdasarkan harga/waktu/durasi/nama — dengan log langkah nyata: perbandingan, tahap divide & merge, jumlah perbandingan & merge, kompleksitas O(n log n) / O(n).
- **Linear Search** manual (operator/nama/rute) dan **Binary Search** manual (tarif pada array yang sudah diurutkan; menolak data tidak terurut) — log low/mid/high, indeks diperiksa, jumlah perbandingan.
- Kontrol visualisasi: Start, Pause, Step, Reset, Clear Log, Copy Log, Export Log (JSON/CSV).

## Tech Stack

| Lapisan | Teknologi |
|---|---|
| Frontend | React 18 + TypeScript + Vite, Tailwind CSS v3, React Router, TanStack Query, Recharts, lucide-react |
| Backend | Node.js + Express 4 + TypeScript, Prisma ORM, JWT (jsonwebtoken), bcryptjs, Zod, express-rate-limit |
| Database | PostgreSQL 16 (Prisma provider `postgresql`) |
| Algoritma native | C11 (gcc) — pointer & struct |
| Testing | Vitest + Supertest (backend), Vitest + React Testing Library (frontend) |

## Struktur Folder

```
jalanyuk/
├── frontend/          # React + TS + Vite (src: components, pages, pages/admin, context, hooks, services, lib, types)
├── backend/           # Express + TS (src: routes, services, middleware, validators, algorithms, config, utils; prisma/: schema.prisma, migrations, seed.ts; tests/)
├── algorithms-c/      # Modul C: src/*.c, Makefile, tests/sample_input.csv
├── docs/              # architecture.md, api.md, database.md, algorithms.md, deployment.md, brief/ (spesifikasi proyek)
├── docker-compose.yml # PostgreSQL untuk deployment/development standar
├── .env.example
└── package.json
```

## Menjalankan Aplikasi

### Prasyarat
Node.js 20+, npm, PostgreSQL 16 (atau Docker), gcc (untuk modul C).

### 1. Database
Cara standar (Docker):
```bash
docker compose up -d db
```
Atau gunakan PostgreSQL lokal yang sudah berjalan di `localhost:5432`.

> Catatan environment build ini: VM pengembangan kehilangan PostgreSQL sistem di tengah pengerjaan, sehingga dipakai **PostgreSQL 16.9 portable** (biner dari Maven Central/Zonky) yang dijalankan dari workspace. Detail & perintahnya ada di `docs/deployment.md`. Untuk penggunaan normal, abaikan catatan ini dan pakai Docker/PostgreSQL biasa.

### 2. Backend
```bash
cd backend
cp .env.example .env   # sesuaikan DATABASE_URL & JWT_SECRET
npm install
npx prisma migrate dev     # menerapkan migration
npm run prisma:seed        # seed data simulasi + akun demo
npm run dev                # http://localhost:4000 (atau npm run build && npm start)
```

### 3. Modul C (Algorithm Lab)
```bash
cd algorithms-c && make    # menghasilkan ./jalanyuk_algorithms
```
Backend juga akan mencoba mengompilasi otomatis saat demo pertama dijalankan bila biner belum ada.

### 4. Frontend
```bash
cd frontend
npm install
npm run dev                # http://localhost:5173
```
`VITE_API_URL` default `http://localhost:4000`.

## Akun Demo (dari seed — hanya untuk demonstrasi)

| Role | Email | Password |
|---|---|---|
| Admin | `admin@jalanyuk.id` | `admin123` |
| Customer | `demo@jalanyuk.id` | `demo123` |

Nilai ini berasal dari environment variable `ADMIN_EMAIL`/`ADMIN_PASSWORD`/`CUSTOMER_EMAIL`/`CUSTOMER_PASSWORD` saat seed dijalankan — ganti di environment nyata. Admin pertama hanya dapat dibuat lewat seed/CLI, **tidak** bisa dari registrasi publik.

**Mengakses Algorithm Lab:** login sebagai admin → menu **Algorithm Lab** di sidebar admin (`/admin/algorithm-lab`).

## Testing

```bash
cd backend && npm test     # 25 test: algoritma, modul C, auth/RBAC, booking & anti double-booking (API)
cd frontend && npm test    # 5 test: format & komponen SeatMap
```
Hasil aktual saat build: **backend 25/25 lulus, frontend 5/5 lulus**; typecheck backend & frontend 0 error; build produksi keduanya berhasil.

## Environment Variables

| Variabel | Keterangan | Default |
|---|---|---|
| `DATABASE_URL` | Koneksi PostgreSQL (Prisma) | — (wajib) |
| `JWT_SECRET` | Secret penandatanganan JWT | ganti di produksi |
| `JWT_EXPIRES_IN` | Masa berlaku token | `7d` |
| `PORT` | Port backend | `4000` |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | Akun admin demo saat seed | `admin@jalanyuk.id` / `admin123` |
| `CUSTOMER_EMAIL` / `CUSTOMER_PASSWORD` | Akun customer demo saat seed | `demo@jalanyuk.id` / `demo123` |
| `C_DEMO_DIR` | Lokasi folder algorithms-c | `../../algorithms-c` relatif backend |
| `C_DEMO_TIMEOUT_MS` | Timeout subprocess C | `5000` |
| `VITE_API_URL` | Base URL API untuk frontend | `http://localhost:4000` |

## Dokumentasi Lanjutan
- Arsitektur: `docs/architecture.md`
- API: `docs/api.md`
- Database: `docs/database.md`
- Algoritma: `docs/algorithms.md`
- Deployment: `docs/deployment.md`
- Spesifikasi asal proyek: `docs/brief/`

## Keterbatasan Integrasi Eksternal
- Tidak ada integrasi operator bus/kereta nyata (jadwal & kursi adalah data simulasi hasil seed).
- Tidak ada payment gateway nyata — pembayaran adalah simulasi berlabel jelas dengan skenario berhasil/gagal/kedaluwarsa.
- E-ticket berupa halaman web yang dapat dicetak/disimpan PDF dari browser; tidak ada pengiriman email sungguhan (notifikasi bersifat in-app di database).
- Harga, ketersediaan, dan status hanya berlaku di dalam sistem ini.

---

© 2026 AYORA. All rights reserved.

## Kredit Foto

Foto-foto di `frontend/public/images/photos/` berasal dari Wikimedia Commons dan dipakai sesuai lisensinya:

- `hero.jpg` — KA Argo Bromo Anggrek di Kedunggedeh, oleh Muhammad Pascal Fajrin, CC BY-SA 4.0
- `train.jpg` — KA Gajayana di Stasiun Blitar, oleh MAtra Pictures, CC BY-SA 4.0
- `bus.jpg` — Bus antar kota antar provinsi, oleh Ariyadi Setiawan, CC BY-SA 4.0
- `jakarta.jpg` — Monumen Nasional Jakarta, oleh Ramayoni, CC BY-SA 4.0
- `bandung.jpg` — Gedung Sate, oleh Anton Leddin, CC BY-SA 3.0
- `yogyakarta.jpg` — Tugu Yogyakarta, oleh CEphoto / Uwe Aranas, CC BY-SA 3.0
- `surabaya.jpg` — Patung Suroboyo, Pemerintah Kota Surabaya, domain publik
- `solo.jpg` — Keraton Surakarta Hadiningrat, oleh Fitri Penyalai, CC BY-SA 4.0
- `semarang.jpg` — Lawang Sewu Semarang, oleh Philip Nalangan, CC BY 4.0
- `bus-front.jpg` — Tiga bus Sinar Jaya di terminal, oleh Sulthan Naufal, CC0
