# API AYORA

Base URL default: `http://localhost:4000`. Semua respons mengikuti kontrak:

```json
{ "success": true, "data": { } }
{ "success": false, "error": { "code": "SEAT_TAKEN", "message": "..." } }
```

Autentikasi: header `Authorization: Bearer <JWT>` dari endpoint login/register. Role: `CUSTOMER` | `ADMIN`.

## Publik & Customer

### Auth — `/api/auth`
| Method | Endpoint | Keterangan |
|---|---|---|
| POST | `/register` | Registrasi (selalu CUSTOMER). Respons `{user, token}`. |
| POST | `/login` | Login (rate-limited). Respons `{user, token}`. |
| GET | `/me` | Profil user aktif. Respons `{user}`. |
| PATCH | `/me` | Perbarui profil (nama/telepon). Respons `{user}`. |
| POST | `/logout` | Logout (stateless JWT). |

### Pencarian & Detail
| Method | Endpoint | Keterangan |
|---|---|---|
| GET | `/api/search/bus` | Query: `origin, destination, date, passengers, operatorId, className, minPrice, maxPrice, departAfter, departBefore, facilities` (koma), `sort` (`price_asc|price_desc|departure_asc|departure_desc|duration_asc|duration_desc|name_asc`), `page, pageSize`. Respons `{schedules[], meta{total,page,pageSize,totalPages}}`. Setiap item berisi operator, kendaraan (kelas/fasilitas), rute, jam, durasi, harga, `seatsLeft`, `isSimulation: true`. |
| GET | `/api/search/train` | Sama seperti bus (stasiun). |
| GET | `/api/bus-schedules/:id` | Detail + `seats[]` berstatus `AVAILABLE|HELD|BOOKED`. |
| GET | `/api/train-schedules/:id` | Sama untuk kereta. |
| GET | `/api/meta/bus-terminals` · `/train-stations` · `/bus-operators` · `/train-operators` | Data referensi aktif untuk autocomplete/filter. |
| GET | `/api/meta/popular` | `{busRoutes[], trainRoutes[], destinations[]}` dari agregasi booking (fallback rute pertama). |

### Booking & Pembayaran (login wajib) — `/api`
| Method | Endpoint | Keterangan |
|---|---|---|
| POST | `/bookings` | Body: `transportType, scheduleId, seatNumbers[], passengers[{fullName, idNumber?, phone, email}], paymentMethod (SIMULATION_*), couponCode?, idempotencyKey?`. Harga dihitung ulang server. 201 → booking PENDING + kode `JY-…`. Error: 409 `SEAT_TAKEN`, 400 `COUPON_INVALID`/`SCHEDULE_*`. |
| GET | `/bookings?status&transportType&page&pageSize` | Booking milik user aktif saja. |
| GET | `/bookings/:id` | Detail (pemilik atau admin; user lain → 404). |
| POST | `/bookings/:id/cancel` | Batalkan; bila sudah PAID → REFUND_REQUESTED + Refund PENDING. |
| POST | `/payments/simulate` | Body: `bookingId, scenario: SUCCESS|FAILED|EXPIRED`. Label: **Pembayaran Simulasi**. SUCCESS → booking CONFIRMED & payment PAID (e-ticket terbit). |

## Admin (role ADMIN) — `/api/admin`
| Method | Endpoint | Keterangan |
|---|---|---|
| GET | `/overview` | Statistik nyata dari DB + grafik 14 hari + rute populer + audit terbaru. |
| GET/POST/PATCH/DELETE | `/bus-operators`, `/bus-terminals`, `/buses`, `/bus-routes` | CRUD master bus (delete = nonaktifkan). |
| GET/POST/PATCH/DELETE | `/train-operators`, `/train-stations`, `/trains`, `/train-routes` | CRUD master kereta. |
| GET/POST/PATCH/DELETE | `/bus-schedules`, `/train-schedules` | Jadwal; delete = status INACTIVE (arsip). |
| GET | `/bookings` · GET `/bookings/:id` | Semua booking + detail. |
| PATCH | `/bookings/:id/status` | Transisi status tervalidasi; membebaskan kursi bila CANCELLED/EXPIRED; tercatat di audit log. |
| POST | `/refunds/:id/process` | `{action: PROCESS|REJECT}` untuk refund simulasi. |
| GET/PATCH | `/users`, `/users/:id` | Daftar & kelola user (tanpa passwordHash; admin tidak dapat menonaktifkan dirinya). |
| GET | `/reports/summary?from&to&type` | Ringkasan transaksi/pendapatan/pembatalan/refund. |
| GET | `/reports/export.csv` | Unduh CSV laporan booking. |
| GET | `/audit-logs` | Log aktivitas administratif. |
| GET/PUT | `/settings` | SystemSetting (platform_name, copyright, service_fee_per_passenger, default_theme, support_email). |
| GET/POST/PATCH | `/coupons` | Kelola kupon. |

## Algorithm Lab (role ADMIN saja) — `/api/algorithm-lab`
Tanpa token → **401**; token CUSTOMER → **403**; ADMIN → 200.

| Method | Endpoint | Keterangan |
|---|---|---|
| GET | `/dataset` | Dataset jadwal terstruktur + `demoArray` harga. |
| GET | `/array` | Visualisasi array mentah terindeks. |
| POST | `/sort` | Body `{dataType: BUS|TRAIN, key: price|departureMinutes|duration|label}` → Merge Sort manual: `{sorted, log[], comparisons, merges, complexity}`. |
| POST | `/search/linear` | Body `{dataType, query}` → Linear Search manual + log. |
| POST | `/search/binary` | Body `{dataType, targetPrice}` → dataset diurutkan dulu (Merge Sort), lalu Binary Search + log low/mid/high. |
| POST | `/pointer` | Menjalankan demo pointer dari biner C: `{rawOutput, lines, addresses[] (aktual), rows}`. |
| POST | `/struct` | Demo struct dari biner C (format respons sama). |
| POST | `/export` | Body `{log[], format: json|csv}` → `{content, filename}` untuk diunduh. |

## Health
`GET /api/health` → `{status: "ok", service: "AYORA API", time}`.
