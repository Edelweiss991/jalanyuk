# Deployment AYORA

## Opsi A — Docker Compose (standar)
`docker-compose.yml` di root proyek menyediakan PostgreSQL 16:

```yaml
services:
  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: jalanyuk
      POSTGRES_PASSWORD: jalanyuk123
      POSTGRES_DB: jalanyuk_db
    ports: ["5432:5432"]
```

Langkah:
```bash
docker compose up -d db
cd backend && cp .env.example .env   # DATABASE_URL=postgresql://jalanyuk:jalanyuk123@localhost:5432/jalanyuk_db
npm install && npx prisma migrate deploy && npm run prisma:seed
npm run build && npm start            # backend :4000
cd ../frontend && npm install && npm run build   # sajikan dist/ lewat server statis / reverse proxy
```

Set `JWT_SECRET` yang kuat dan kredensial admin demo (`ADMIN_PASSWORD`) yang berbeda untuk lingkungan selain lokal.

## Opsi B — PostgreSQL lokal tanpa Docker
Instal PostgreSQL 16 dari paket sistem, buat database `jalanyuk`, lalu ikuti langkah backend yang sama.

## Catatan environment build ini (VM pengembangan)
Selama pengerjaan, PostgreSQL yang terinstal via apt **hilang** ketika image VM berganti (filesystem di luar `~` bersifat ephemeral). Agar verifikasi tetap memakai PostgreSQL asli (bukan pengganti), dipakai biner **PostgreSQL 16.9 portable** (paket `embedded-postgres-binaries-linux-amd64` dari Maven Central / Zonky):

- Biner: `~/workspace/.pg/bin` (dari `postgres-linux-x86_64.txz` di dalam JAR Maven).
- Karena server tidak boleh berjalan sebagai root dan workspace tidak mengizinkan chown, biner disalin ke `/tmp/bin`, `/tmp/lib`, `/tmp/share` (chmod 755) dan data diinisialisasi di `/tmp/pgdata` milik user `nobody`:
  ```bash
  su nobody -s /bin/bash -c "/tmp/bin/initdb -D /tmp/pgdata -U postgres --auth=trust"
  su nobody -s /bin/bash -c "/tmp/bin/pg_ctl -D /tmp/pgdata -o '-p 5432 -k /tmp' -l /tmp/pg.log start"
  ```
- `DATABASE_URL` di `backend/.env`: `postgresql://postgres:postgres@localhost:5432/postgres` (database bawaan `postgres`, trust auth).
- Konsekuensi: data berada di `/tmp` → hilang saat VM reboot. Untuk melanjutkan pengembangan setelah reboot, ulangi inisialisasi di atas lalu `npx prisma migrate dev && npm run prisma:seed`. Ini murni keterbatasan environment pengembangan, bukan bagian dari arsitektur aplikasi.

## Modul C
Di server produksi, kompilasi sekali: `cd algorithms-c && make`. Pastikan `gcc` tersedia atau biner `jalanyuk_algorithms` sudah ter-commit di artefak deploy; backend dapat mengompilasi otomatis pada pemanggilan pertama (butuh gcc + izin tulis) atau arahkan `C_DEMO_DIR` ke lokasi biner.

## Checklist Produksi
- HTTPS di depan backend & frontend; cookie tidak dipakai untuk auth (JWT di header), jadi tidak ada konfigurasi cookie tambahan.
- `JWT_SECRET` kuat & unik; kredensial demo diganti/dihapus.
- Backup database; jalankan `prisma migrate deploy` pada pipeline rilis.
- Rate limit sudah aktif secara default; sesuaikan di `backend/src/app.ts` bila perlu.
- Jangan mengekspos endpoint `/api/algorithm-lab` di luar proteksi role ADMIN (sudah dilindungi middleware backend).
