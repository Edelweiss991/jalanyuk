# Database AYORA

Engine: **PostgreSQL 16** melalui Prisma ORM (`backend/prisma/schema.prisma`). Provider pada schema adalah `postgresql` — inilah schema kanonis proyek; `docker-compose.yml` di root menyediakan instance PostgreSQL yang cocok untuk development/deployment standar.

> Catatan environment build: saat pengerjaan, PostgreSQL sistem pada VM pengembangan hilang karena pergantian image VM. Untuk menjalankan & memverifikasi aplikasi dipakai PostgreSQL 16.9 **portable** (biner resmi dari paket Zonky di Maven Central) di `~/workspace/.pg`, data di `/tmp/pgdata`, port 5432, database `postgres`, dengan `DATABASE_URL` backend menunjuk ke sana. Schema, migration, dan perilaku aplikasi identik — hanya lokasi server databasenya yang berbeda. Lihat `docs/deployment.md`.

## Model (24)

| Kelompok | Model |
|---|---|
| Pengguna | `User`, `UserProfile` |
| Bus | `BusOperator`, `Bus`, `BusTerminal`, `BusRoute`, `BusSchedule`, `BusSeat` |
| Kereta | `TrainOperator`, `TrainStation`, `TrainRoute`, `Train`, `TrainSchedule`, `TrainSeat` |
| Transaksi | `Passenger`, `Booking`, `BookingItem`, `SeatReservation`, `Payment`, `Refund`, `Coupon` |
| Sistem | `Notification`, `AuditLog`, `SystemSetting` |

Relasi penting:
- `BusSchedule` → `operator`, `bus`, `route` (dengan `originTerminal`/`destinationTerminal`), `departureTerminal`, `arrivalTerminal`, `seats`, `bookings`. Pola yang sama untuk `TrainSchedule` (dengan `originStation`/`destinationStation`, `departureStation`, `arrivalStation`).
- `BusSeat`/`TrainSeat` terhubung ke jadwal lewat `scheduleId` dengan `@@unique([scheduleId, seatNumber])`.
- `Booking` memiliki `transportType` (BUS/TRAIN) dan tepat satu dari `busScheduleId`/`trainScheduleId`; berisi `items` (snapshot rute/harga/kursi), `passengers`, satu `payment`, dan `reservations`.
- `SeatReservation` adalah sumber kebenaran anti double-booking: `@@unique([transportType, scheduleId, seatNumber])`. Baris dibuat dalam transaksi booking; dilepas (dihapus) saat booking batal/kedaluwarsa — riwayat perubahan tercatat di `AuditLog`.

## Enum Status

- `BookingStatus`: PENDING, CONFIRMED, CANCELLED, EXPIRED, COMPLETED, REFUND_REQUESTED, REFUNDED
- `PaymentStatus`: PENDING, PAID, FAILED, EXPIRED, REFUND_PENDING, REFUNDED
- `ReservationStatus`: HELD, CONFIRMED, RELEASED, EXPIRED
- `ScheduleStatus`: ACTIVE, INACTIVE
- `PaymentMethod`: SIMULATION_QRIS, SIMULATION_VA, SIMULATION_EWALLET, SIMULATION_CARD (seluruhnya simulasi)
- `Role`: CUSTOMER, ADMIN

Harga selalu `Int` (Rupiah penuh, tanpa desimal). Semua model memiliki `createdAt`/`updatedAt`.

## Index & Constraint Kunci
- Index pencarian: `BusSchedule(routeId, departureTime)`, `operatorId`, `status` (dan padanannya untuk kereta); `Booking(userId)`, `status`, `createdAt`; `SeatReservation(expiresAt)`; `AuditLog(createdAt)`.
- Unique: `User.email`, `Coupon.code`, `SystemSetting.key`, `Booking.code`, `Booking.idempotencyKey`, pasangan rute `BusRoute(originTerminalId, destinationTerminalId)` / `TrainRoute(originStationId, destinationStationId)`.

## Migration & Seed
```bash
cd backend
npx prisma migrate dev     # menerapkan migration di prisma/migrations
npm run prisma:seed        # menjalankan prisma/seed.ts
```
Seed membuat: SystemSetting (`platform_name=AYORA`, `copyright="© 2026 AYORA. All rights reserved."`, `service_fee_per_passenger=5000`, tema, email dukungan), 3 kupon demo (AYORA10, HEMAT20, NEWUSER), operator/terminal/stasiun/rute bus & kereta Indonesia, jadwal untuk +1 s.d. +7 hari dari tanggal seed (50 bus, 40 kereta saat build), kursi per jadwal (bus 40, kereta 64; ±10% ditandai terisi secara deterministik), serta akun demo admin & customer (dari env `ADMIN_*`/`CUSTOMER_*`).

Ketersediaan kursi yang ditampilkan = kursi tidak `isBooked` dikurangi reservasi aktif (HELD belum kedaluwarsa / CONFIRMED), dihitung dari database pada setiap permintaan — bukan dari state frontend.
