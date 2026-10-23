# PROGRESS — AYORA Build

Update terakhir: 2026-10-23 (builder via Kiro kr/claude-sonnet-4.5 @ 9router)

## Environment
- node v24.20.0, npm 10.9.4, gcc 13.3.0 — OK
- Database FINAL: **PostgreSQL via Prisma** (sesuai spek). PostgreSQL sistem sempat hilang karena image VM berganti → dipakai PostgreSQL 16.9 PORTABLE (biner Zonky/Maven Central) di ~/workspace/.pg (biner), data di /tmp/pgdata, jalan di 127.0.0.1:5432, database `postgres`, trust auth. DATABASE_URL di backend/.env menunjuk ke sana. docker-compose.yml tetap disediakan untuk deployment normal.
- Brief tersimpan verbatim: docs/brief/prompt-master.md, docs/brief/prompt-scope-update.md
- npm install memakai registry mirror npmmirror + PRISMA_ENGINES_MIRROR (registry default & binaries.prisma.sh tidak stabil dari VM ini).
- @types/express diturunkan ke v4 (mengikuti express 4) — memperbaiki ~95 error type.

## Status per tahap
- Tahap 1–2 Foundation: SELESAI. 24 model Prisma, migration `init` ter-apply, seed sukses: 50 jadwal bus + 40 jadwal kereta, 2.000 + 2.560 kursi, user admin & customer demo.
- Tahap 3 Customer flow: SELESAI & TERUJI via curl — register/login, search bus/kereta (filter/sort/pagination), detail+kursi, booking (total dihitung ulang backend: subtotal+fee−diskon kupon), anti double-booking 409 (unique SeatReservation + transaksi), pembayaran simulasi SUCCESS→CONFIRMED/PAID, revenue tercatat.
- Tahap 4 Admin: API SELESAI (overview dari DB, CRUD master, jadwal, booking+status, refund, users, reports+CSV, audit log, settings, coupons). UI admin selesai (10 halaman).
- Tahap 5 Algorithm Lab: SELESAI & TERUJI — 401 tanpa login, 403 customer, 200 admin; Merge Sort manual (log nyata, 31 comparisons utk dataset uji), Linear Search, Binary Search, demo Pointer & Struct dari biner C asli (alamat memori aktual 0x… tampil), export log.
- Typecheck: backend 0 error, frontend 0 error. Build: backend tsc OK (dist/src/index.js), frontend vite build OK.
- Bug diperbaiki selama verifikasi: strtok_r POSIX di C (segfault), mount router search, validator uuid→cuid, urutan FK booking/reservasi, date guard search, @types/express.

## Berikutnya
- Tests Vitest (backend + frontend) — sedang dikerjakan
- Dokumentasi README + docs/*, grep nama brand lama final, ZIP交付

## Finalisasi (selesai)
- [x] README.md lengkap + docs/architecture.md, docs/api.md, docs/database.md, docs/algorithms.md, docs/deployment.md ditulis sesuai kondisi nyata proyek.
- [x] TEMUAN & PERBAIKAN AKHIR: file halaman admin frontend + BookingDetailPage yang sempat hilang dari disk (kemungkinan ikut hilang saat pergantian image VM) ditulis ulang manual dan App.tsx disambungkan kembali: route /admin (AdminLayout + Overview, Bus, Kereta, Booking, Pengguna, Laporan, Pengaturan, Audit Log, Algorithm Lab) dan /my-bookings/:id. adminApi/labApi di api.ts diselaraskan persis dengan route backend (termasuk PUT /settings, export CSV, /search/linear|binary, /export log).
- [x] Backend: include refunds ditambahkan pada detail booking admin (untuk tombol proses refund).
- [x] Verifikasi final: backend tsc 0 error; frontend tsc 0 error; vite build OK; backend test 25/25 PASS; frontend test 5/5 PASS; C `make test` OK; health 200; admin bookings list/detail/settings/users smoke OK (bentuk {items, pagination} cocok dengan UI).
- [x] grep nama brand lama: 0 hasil di kode aplikasi, docs proyek, seed, dan konfigurasi. Satu-satunya kemunculan adalah di docs/brief/*.md — salinan verbatim prompt user yang justru memerintahkan penghapusannya (disimpan sebagai dokumentasi spesifikasi sesuai instruksi langkah pertama).
- [x] Footer "© 2026 AYORA. All rights reserved." terpasang di Footer publik/customer, DashboardPage, dan AdminLayout; juga tersimpan sebagai SystemSetting `copyright` dari seed.
- Catatan deviasi final: (1) DB runtime lokal = PostgreSQL 16.9 portable (biner Zonky) karena PostgreSQL apt hilang saat image VM berganti — schema/migration tetap PostgreSQL murni, docker-compose disediakan; (2) @types/express dipin ke v4 (paket v5 dari scaffold awal tidak kompatibel dengan Express 4); (3) register mengembalikan token (auto-login) agar cocok dengan alur frontend; (4) Kiro API sempat 503 berkepanjangan di fase akhir — perbaikan & penulisan halaman admin tahap akhir dikerjakan manual lalu diverifikasi dengan toolchain yang sama.

## Perbaikan pasca-rilis (2026-10-23, oleh Jack saat menyiapkan screenshot iPad)
- BUG runtime ditemukan: halaman putih total — <BrowserRouter> ganda (main.tsx + App.tsx). Diperbaiki: Router di App.tsx dihapus.
- BUG: halaman pencarian & detail crash "Objects are not valid as a React child" — ScheduleCard/ScheduleDetailPage menerima objek API mentah (operator/vehicle/route bersarang) padahal mengharapkan field datar. Diperbaiki dengan normalisasi data di SearchPage.tsx & ScheduleDetailPage.tsx memakai helper lib/format.ts (formatTime/formatDuration, Asia/Jakarta).
- Verifikasi ulang: typecheck frontend 0 error, test frontend 5/5 PASS, screenshot browser nyata 7 halaman (beranda terang/gelap, hasil cari bus, detail+peta kursi, dashboard customer, admin overview, algorithm lab) semua tampil benar. ZIP dibangun ulang dengan perbaikan ini.
