PROJECT: AYORA — MODERN BUS & TRAIN BOOKING PLATFORM 2026

1. ROLE & OBJECTIVE

Bertindak sebagai Senior Full-Stack Developer, UI/UX Designer, Software Architect, Database Engineer, Security Engineer, dan QA Engineer.

Bangun website pemesanan tiket transportasi darat bernama AYORA, yaitu platform modern untuk pemesanan tiket bus dan kereta antarkota di Indonesia.

Website harus memiliki pengalaman pengguna modern, aman, responsif, mudah digunakan, dan relevan dengan kebutuhan tahun 2026.

Jangan hanya membuat prototype atau mockup statis. Implementasikan frontend, backend, database, autentikasi, otorisasi, pencarian, filter, sorting, pemesanan tiket, pemilihan kursi, pembayaran simulasi atau sandbox, dashboard customer, dashboard admin, laporan, audit log, serta Algorithm Lab khusus admin.

Semua tombol, formulir, filter, pencarian, sorting, navigasi, aksi CRUD, pemesanan, pemilihan kursi, pembayaran simulasi, dan fitur administrasi harus berfungsi sesuai perannya.

Gunakan nama brand AYORA di seluruh aplikasi, termasuk:

* Logo teks.
* Wordmark.
* Navbar.
* Sidebar.
* Title halaman.
* Metadata.
* Dashboard.
* Email atau notifikasi.
* Seed data.
* Dokumentasi.
* Konfigurasi aplikasi.
* System settings.
* Pesan sukses dan error jika relevan.

Jangan gunakan nama NexTrip di UI, metadata, dokumentasi, seed data, konfigurasi, route label, komentar dokumentasi, atau bagian aplikasi lainnya, kecuali pada catatan migrasi internal yang memang diperlukan.

Tambahkan copyright berikut pada footer seluruh halaman publik dan halaman dashboard:

© 2026 AYORA. All rights reserved.

2. PRODUCT SCOPE

AYORA secara eksklusif menyediakan layanan pemesanan:

1. Tiket bus antarkota.
2. Tiket kereta antarkota.

Jangan implementasikan fitur:

* Pesawat.
* Hotel.
* Rental kendaraan.
* Aktivitas wisata.
* Paket wisata.
* Kapal atau layanan transportasi lain di luar bus dan kereta, kecuali diminta secara eksplisit di masa mendatang.

Hapus seluruh navigasi, halaman, API, tabel database, kategori, filter, komponen UI, seed data, dan dokumentasi yang hanya berkaitan dengan layanan selain bus dan kereta.

Gunakan:

* Bahasa Indonesia sebagai bahasa utama.
* Mata uang Rupiah atau IDR.
* Zona waktu Asia/Jakarta sebagai default.
* Format tanggal dan waktu Indonesia.
* Format harga yang sesuai dengan standar Indonesia.

Jangan mengklaim memiliki integrasi operator, inventaris kursi, jadwal resmi, tarif resmi, ketersediaan real-time, atau pembayaran nyata jika integrasi tersebut belum tersedia.

Jika menggunakan data simulasi, tampilkan label Data Simulasi secara jelas pada halaman yang relevan.

3. TECH STACK

Gunakan teknologi berikut:

* Frontend: React + TypeScript + Vite.
* Styling: Tailwind CSS.
* UI Components: shadcn/ui atau komponen reusable yang setara.
* Icons: Lucide React.
* Backend: Node.js + Express + TypeScript.
* Database: PostgreSQL dengan Prisma ORM.
* Authentication: Session atau JWT dengan mekanisme keamanan yang sesuai.
* Form validation: Zod.
* Data fetching: TanStack Query atau solusi setara.
* Charts: Recharts.
* Testing frontend: Vitest dan React Testing Library.
* Testing backend: Vitest atau Jest dengan integration test.
* API: REST API dengan validasi request dan error handling yang konsisten.
* Algoritma native: Bahasa C untuk demonstrasi Pointer dan Struct.
* Containerization opsional: Docker dan Docker Compose.

Gunakan versi dependency stabil yang kompatibel saat implementasi. Jika terdapat keterbatasan environment, pilih alternatif yang masuk akal dan dokumentasikan alasannya.

4. BRANDING & VISUAL DESIGN

Nama platform: AYORA

Tagline utama:

"Perjalanan Lebih Mudah, Tiket dalam Satu Genggaman."

Alternatif tagline yang dapat digunakan pada bagian tertentu:

* "Berangkat Nyaman, Sampai Tujuan."
* "Pesan Tiket Bus dan Kereta dengan Mudah."
* "Temukan Perjalananmu Bersama AYORA."

Buat desain premium, modern, minimalis, profesional, dan berorientasi pada kenyamanan pengguna.

Jangan meniru logo, identitas visual, layout, atau desain kompetitor secara persis.

Theme System

Sediakan dua tema yang dapat diganti kapan saja:

Light Mode

* Background putih atau abu-abu sangat terang.
* Text hitam atau abu-abu gelap.
* Border tipis.
* Card bersih.
* Accent color biru, indigo, atau teal yang konsisten.
* Kontras warna yang baik.

Dark Mode

* Background hitam atau charcoal.
* Surface abu-abu gelap.
* Text putih atau abu-abu terang.
* Accent color tetap konsisten dengan Light Mode.
* Pastikan border, input, tabel, modal, dan chart tetap terbaca.

Ketentuan:

* Sediakan toggle tema di navbar.
* Sediakan toggle tema di area dashboard jika relevan.
* Gunakan CSS variables atau design tokens.
* Simpan preferensi tema di localStorage.
* Hormati preferensi sistem pengguna pada kunjungan pertama.
* Pastikan seluruh komponen mendukung Light Mode dan Dark Mode.
* Tambahkan transisi warna yang halus tanpa mengganggu performa.
* Pastikan chart, tabel, dropdown, modal, toast, dan form mendukung kedua tema.

Design Guidelines

* Responsive untuk mobile, tablet, laptop, dan desktop.
* Gunakan whitespace yang cukup.
* Gunakan typography modern dan mudah dibaca.
* Gunakan card dengan radius konsisten.
* Gunakan shadow halus.
* Gunakan micro-interactions pada tombol, card, dropdown, dan navigasi.
* Sediakan loading skeleton.
* Sediakan empty state.
* Sediakan error state.
* Sediakan success feedback.
* Gunakan toast notification untuk aksi penting.
* Gunakan modal konfirmasi untuk aksi destruktif.
* Gunakan semantic HTML.
* Pastikan aksesibilitas keyboard.
* Pastikan focus indicator terlihat.
* Jangan menggunakan terlalu banyak gradient, animasi, atau efek dekoratif.
* Jangan membuat animasi yang mengganggu pengguna.
* Pastikan kontras warna memenuhi standar aksesibilitas.
* Jangan menampilkan Algorithm Lab pada area publik atau customer.

5. CUSTOMER-FACING WEBSITE

A. Homepage

Buat homepage profesional dengan komponen berikut:

* Navbar dengan logo atau wordmark AYORA.
* Menu Beranda.
* Menu Bus.
* Menu Kereta.
* Menu Pesanan Saya.
* Menu Bantuan.
* Tombol Login dan Register jika belum login.
* Avatar dan menu akun jika sudah login.
* Toggle Light/Dark Mode.
* Hero section dengan headline:
    * "Perjalanan Lebih Mudah, Tiket dalam Satu Genggaman."
* Subheadline yang menjelaskan layanan bus dan kereta.
* Search widget dengan tab Bus dan Kereta.
* Destinasi populer di Indonesia.
* Rute bus populer.
* Rute kereta populer.
* Promo tiket.
* Keunggulan layanan.
* Informasi cara pemesanan.
* Customer support.
* Footer dengan bantuan, kebijakan, kontak, dan copyright.

Gunakan gambar yang relevan dengan:

* Bus antarkota.
* Kereta.
* Stasiun.
* Terminal.
* Destinasi Indonesia.
* Perjalanan darat.

Jangan tampilkan:

* Link Algorithm Lab.
* Banner Algorithm Lab.
* Promosi Algorithm Lab.
* Menu admin.
* Link dashboard admin.
* Informasi internal sistem.
* Fitur pesawat, hotel, rental kendaraan, atau aktivitas wisata.

B. Search Widget

Buat search widget dengan dua tab utama:

1. Bus.
2. Kereta.

Search Bus

Field minimal:

* Kota atau terminal keberangkatan.
* Kota atau terminal tujuan.
* Tanggal perjalanan.
* Jumlah penumpang.
* Tombol Cari Bus.

Search Kereta

Field minimal:

* Stasiun keberangkatan.
* Stasiun tujuan.
* Tanggal perjalanan.
* Jumlah penumpang.
* Tombol Cari Kereta.

Ketentuan:

* Validasi field wajib.
* Pastikan kota atau stasiun asal dan tujuan tidak sama.
* Tanggal perjalanan tidak boleh berada di masa lalu jika tidak diizinkan.
* Jumlah penumpang harus berupa angka valid.
* Tampilkan pesan error yang mudah dipahami.
* Gunakan autocomplete jika data tersedia.
* Gunakan debounce pada pencarian autocomplete.
* Simpan parameter pencarian pada URL query parameters.
* Pastikan halaman dapat di-refresh tanpa kehilangan konteks pencarian.

6. BUS BOOKING

A. Bus Search

Implementasikan pencarian bus dengan:

* Kota keberangkatan.
* Terminal keberangkatan.
* Kota tujuan.
* Terminal tujuan.
* Tanggal perjalanan.
* Jumlah penumpang.
* Operator bus.
* Rentang harga.
* Jam keberangkatan.
* Kelas layanan.
* Fasilitas.
* Durasi perjalanan.
* Ketersediaan kursi jika data tersedia.

Sorting:

* Harga termurah.
* Harga tertinggi.
* Waktu keberangkatan paling awal.
* Waktu keberangkatan paling akhir.
* Durasi perjalanan terpendek.
* Durasi perjalanan terpanjang.
* Operator A–Z.

B. Bus Search Results

Setiap hasil bus menampilkan:

* Nama operator.
* Logo atau gambar operator jika tersedia.
* Label Data Simulasi jika data simulasi.
* Terminal asal.
* Terminal tujuan.
* Kota asal.
* Kota tujuan.
* Waktu keberangkatan.
* Waktu kedatangan.
* Durasi perjalanan.
* Kelas bus.
* Fasilitas.
* Harga per penumpang.
* Sisa kursi jika data benar-benar tersedia.
* Status jadwal.
* Tombol Pilih Kursi.
* Tombol Lanjut Booking.
* Tombol Lihat Detail.

Sediakan:

* Filter sidebar pada desktop.
* Filter drawer pada mobile.
* Sorting dropdown.
* Pagination atau infinite loading yang terkontrol.
* Loading skeleton.
* Empty state.
* Error state.
* Search summary.
* Filter chip yang dapat dihapus.
* URL query parameters.
* Backend pagination untuk dataset besar.

C. Bus Seat Selection

Buat visualisasi kursi bus berdasarkan konfigurasi yang dimiliki setiap jadwal bus.

Ketentuan:

* Kursi tersedia dapat dipilih.
* Kursi yang telah dipesan tidak dapat dipilih.
* Kursi yang sedang direservasi sementara memiliki status berbeda.
* Kursi pilihan customer diberi penanda visual.
* Kursi tidak tersedia memiliki tampilan berbeda.
* Kursi pengemudi atau area yang tidak dapat dipilih diberi label.
* Ringkasan kursi diperbarui secara langsung.
* Total harga diperbarui secara langsung.
* Jumlah kursi yang dipilih tidak boleh melebihi jumlah penumpang.
* Customer tidak dapat memilih kursi yang sama lebih dari satu kali.
* Backend memvalidasi kembali ketersediaan saat booking dibuat.
* Gunakan transaksi database atau mekanisme reservasi sementara.
* Terapkan expiration time untuk reservasi sementara.
* Cegah dua pengguna membeli kursi yang sama.
* Jangan menganggap pilihan kursi di frontend sebagai bukti reservasi berhasil.

Jika layout kursi operator belum diketahui, gunakan konfigurasi demo yang jelas diberi label Data Simulasi.

D. Bus Detail

Buat halaman detail bus dengan:

* Nama operator.
* Logo operator.
* Rute.
* Terminal asal.
* Terminal tujuan.
* Jadwal keberangkatan.
* Jadwal kedatangan.
* Durasi.
* Kelas layanan.
* Fasilitas.
* Kebijakan bagasi jika tersedia.
* Kebijakan pembatalan.
* Informasi kursi.
* Harga.
* Label Data Simulasi jika relevan.
* Tombol Pilih Kursi.
* Tombol Lanjut Booking.

7. TRAIN BOOKING

A. Train Search

Implementasikan pencarian kereta dengan:

* Stasiun keberangkatan.
* Stasiun tujuan.
* Tanggal keberangkatan.
* Jumlah penumpang.
* Kelas kereta.
* Operator kereta.
* Rentang harga.
* Waktu keberangkatan.
* Durasi perjalanan.
* Ketersediaan tiket.
* Ketersediaan kursi jika didukung.

Sorting:

* Harga termurah.
* Harga tertinggi.
* Waktu keberangkatan paling awal.
* Waktu keberangkatan paling akhir.
* Durasi perjalanan terpendek.
* Durasi perjalanan terpanjang.
* Nama kereta A–Z.

B. Train Search Results

Setiap hasil kereta menampilkan:

* Nama kereta.
* Operator.
* Nomor kereta jika data tersedia.
* Label Data Simulasi jika data simulasi.
* Stasiun asal.
* Stasiun tujuan.
* Jadwal keberangkatan.
* Jadwal kedatangan.
* Durasi.
* Kelas kereta.
* Harga tiket per penumpang.
* Ketersediaan tiket jika data tersedia.
* Status jadwal.
* Tombol Pilih Tiket.
* Tombol Lanjut Booking.
* Tombol Lihat Detail.

C. Train Booking Details

Sediakan:

* Form identitas penumpang.
* Nama lengkap.
* Nomor identitas sesuai kebutuhan data simulasi.
* Nomor telepon.
* Email.
* Ringkasan perjalanan.
* Informasi kelas dan jadwal.
* Pemilihan kursi jika didukung oleh data atau integrasi.
* Ringkasan harga.
* Kebijakan pembatalan.
* Konfirmasi pesanan.
* E-ticket atau kode booking setelah status pesanan terkonfirmasi.

Jangan mengarang:

* Nomor kereta resmi.
* Jadwal resmi.
* Tarif resmi.
* Ketersediaan real-time.
* Integrasi operator.
* Status pembayaran nyata.

Jika menggunakan dataset contoh, tampilkan label Data Simulasi.

D. Train Detail

Buat halaman detail kereta dengan:

* Nama kereta.
* Operator.
* Nomor kereta jika tersedia.
* Stasiun asal.
* Stasiun tujuan.
* Jadwal keberangkatan.
* Jadwal kedatangan.
* Durasi.
* Kelas.
* Harga.
* Fasilitas.
* Kebijakan bagasi jika tersedia.
* Kebijakan pembatalan.
* Ketersediaan.
* Label Data Simulasi jika relevan.
* Tombol Pilih Tiket.
* Tombol Lanjut Booking.

8. BOOKING FLOW

Gunakan alur pemesanan yang konsisten untuk bus dan kereta:

1. Customer memilih jenis transportasi.
2. Customer mencari rute dan tanggal.
3. Sistem menampilkan hasil yang tersedia.
4. Customer memilih jadwal.
5. Customer memilih kursi jika fitur tersebut didukung.
6. Customer mengisi identitas penumpang.
7. Backend memvalidasi jadwal, tarif, kursi, dan ketersediaan.
8. Sistem menghitung total pembayaran.
9. Customer memeriksa ringkasan pesanan.
10. Sistem membuat booking.
11. Customer menyelesaikan pembayaran melalui sandbox atau simulasi yang diberi label jelas.
12. Sistem memverifikasi hasil pembayaran.
13. Sistem menerbitkan e-ticket hanya jika persyaratan konfirmasi terpenuhi.
14. Customer dapat melihat, mencetak, atau mengunduh tiket dari dashboard.

Pisahkan status berikut:

Booking Status

* PENDING.
* CONFIRMED.
* CANCELLED.
* EXPIRED.
* COMPLETED.
* REFUND_REQUESTED.
* REFUNDED.

Seat Reservation Status

* HELD.
* CONFIRMED.
* RELEASED.
* EXPIRED.

Payment Status

* PENDING.
* PAID.
* FAILED.
* EXPIRED.
* REFUND_PENDING.
* REFUNDED.

Ketentuan keamanan dan integritas:

* Jangan pernah mempercayai total harga dari frontend.
* Hitung ulang harga di backend.
* Validasi harga berdasarkan jadwal dan tarif yang tersimpan.
* Gunakan transaksi database.
* Gunakan idempotency key untuk operasi pembuatan booking atau pembayaran yang relevan.
* Cegah double booking.
* Jangan menyimpan nomor kartu, CVV, atau informasi pembayaran sensitif.
* Jangan mengklaim pembayaran berhasil hanya karena tombol diklik.
* Jika pembayaran simulasi digunakan, tampilkan label Pembayaran Simulasi.
* E-ticket hanya diterbitkan setelah status booking dan pembayaran memenuhi syarat.

9. CHECKOUT

Buat halaman checkout dengan:

* Ringkasan bus atau kereta.
* Rute.
* Jadwal.
* Kursi.
* Jumlah penumpang.
* Data penumpang.
* Harga dasar.
* Biaya layanan.
* Pajak jika diterapkan.
* Diskon atau voucher jika tersedia.
* Total pembayaran.
* Kebijakan pembatalan.
* Checkbox persetujuan syarat dan ketentuan.
* Tombol Buat Pesanan.
* Tombol Bayar.
* Loading state.
* Error state.
* Confirmation dialog jika meninggalkan halaman saat proses penting.

Validasi:

* Semua data wajib harus lengkap.
* Nomor telepon harus valid.
* Email harus valid.
* Jumlah penumpang harus sesuai jumlah kursi.
* Kursi harus tersedia.
* Jadwal harus masih aktif.
* Harga harus dihitung ulang di backend.
* Voucher harus divalidasi di backend.

10. CUSTOMER DASHBOARD

Buat dashboard customer dengan:

* Profil customer.
* Edit nama dan informasi kontak yang diperbolehkan.
* Riwayat tiket bus.
* Riwayat tiket kereta.
* Detail pesanan.
* Kode booking.
* Informasi penumpang.
* Status booking.
* Status pembayaran.
* E-ticket.
* Jadwal perjalanan mendatang.
* Riwayat perjalanan.
* Permintaan pembatalan sesuai kebijakan.
* Notifikasi.
* Bantuan.
* Logout.
* Footer atau bagian informasi dengan copyright:

© 2026 AYORA. All rights reserved.

Customer hanya dapat melihat dan mengelola data miliknya sendiri.

Jangan tampilkan:

* Menu Algorithm Lab.
* Link Algorithm Lab.
* Tombol Algorithm Lab.
* Visualisasi algoritma.
* Log algoritma.
* Endpoint internal.
* Menu admin.
* Link dashboard admin.

11. ADMIN DASHBOARD

Admin memiliki akses operasional penuh sesuai otorisasi.

Gunakan branding AYORA pada:

* Admin dashboard.
* Sidebar.
* Logo.
* Title halaman.
* Metadata.
* Footer.
* Notifikasi.
* Laporan.
* Export file.
* System settings.

A. Admin Overview

Tampilkan data aktual dari database:

* Total tiket bus terjual.
* Total tiket kereta terjual.
* Total booking.
* Total customer.
* Booking pending.
* Booking confirmed.
* Booking cancelled.
* Booking expired.
* Pendapatan tercatat.
* Refund.
* Grafik transaksi berdasarkan tanggal.
* Grafik pendapatan.
* Rute populer.
* Jadwal dengan jumlah pemesanan tertinggi.
* Operator dengan transaksi terbanyak.
* Aktivitas admin terbaru.

Jangan menggunakan angka statis jika data database tersedia.

B. Bus Management

Admin dapat melakukan CRUD terhadap:

* Operator bus.
* Terminal.
* Kota.
* Rute bus.
* Armada.
* Kelas layanan.
* Fasilitas.
* Konfigurasi kursi.
* Jadwal keberangkatan.
* Jadwal kedatangan.
* Durasi perjalanan.
* Tarif.
* Ketersediaan.
* Status jadwal.
* Data simulasi.
* Integrasi operator jika tersedia.

Sediakan:

* Search.
* Sorting.
* Filter.
* Pagination.
* Form tambah.
* Form edit.
* Preview detail.
* Validasi.
* Konfirmasi penghapusan.
* Bulk actions yang aman.
* Status aktif/nonaktif.
* Arsip data.

Produk atau jadwal yang sudah direferensikan oleh transaksi sebaiknya dinonaktifkan atau diarsipkan daripada dihapus permanen.

C. Train Management

Admin dapat melakukan CRUD terhadap:

* Operator kereta.
* Stasiun.
* Kota.
* Rute kereta.
* Nama kereta.
* Nomor kereta.
* Jadwal perjalanan.
* Kelas.
* Tarif.
* Konfigurasi kursi jika tersedia.
* Ketersediaan tiket.
* Status jadwal.
* Data simulasi.
* Integrasi resmi jika tersedia.

Sediakan:

* Search.
* Sorting.
* Filter.
* Pagination.
* Form tambah.
* Form edit.
* Preview detail.
* Validasi.
* Konfirmasi penghapusan.
* Bulk actions yang aman.
* Status aktif/nonaktif.
* Arsip data.

D. Booking Management

Admin dapat:

* Mencari seluruh pesanan.
* Mencari berdasarkan kode booking.
* Mencari berdasarkan customer.
* Mencari berdasarkan operator.
* Mencari berdasarkan rute.
* Memfilter berdasarkan bus atau kereta.
* Memfilter tanggal.
* Memfilter status booking.
* Memfilter status pembayaran.
* Melihat detail transaksi.
* Melihat detail penumpang sesuai izin.
* Memeriksa status pembayaran.
* Mengelola pembatalan sesuai kebijakan.
* Memproses refund melalui mekanisme yang sah.
* Mengelola reservasi kursi.
* Mengekspor laporan.
* Melihat audit log.

Setiap perubahan status harus:

* Divalidasi backend.
* Memiliki alasan jika diperlukan.
* Dicatat dalam audit log.
* Tidak dapat dilakukan oleh role yang tidak memiliki izin.

E. User Management

Admin dapat:

* Melihat daftar customer dan admin.
* Mencari pengguna.
* Melihat detail akun yang diizinkan.
* Mengubah status akun.
* Menonaktifkan akun.
* Mengatur role sesuai otorisasi.
* Melihat aktivitas administratif yang relevan.
* Mengelola status customer.

Jangan pernah:

* Menampilkan password.
* Menampilkan token rahasia.
* Menampilkan data pembayaran sensitif.
* Mengizinkan admin biasa mengubah role super admin tanpa izin khusus.

Perubahan role admin harus dibatasi kepada admin yang memiliki izin khusus.

F. Reports & Settings

Sediakan:

* Laporan transaksi.
* Laporan pendapatan.
* Laporan tiket bus.
* Laporan tiket kereta.
* Laporan rute populer.
* Laporan operator.
* Laporan pembatalan.
* Laporan refund.
* Filter berdasarkan rentang tanggal.
* Filter berdasarkan jenis transportasi.
* Export CSV.
* Export JSON jika relevan.
* Pengaturan website.
* Pengaturan promo.
* Pengaturan biaya layanan.
* Pengaturan tema default.
* Pengaturan identitas platform.
* Pengaturan nama brand AYORA.
* Pengaturan copyright.

Semua laporan harus dihitung berdasarkan data yang benar-benar tersimpan.

12. AUTHENTICATION & AUTHORIZATION

Gunakan role-based access control atau RBAC.

Role minimum:

* CUSTOMER.
* ADMIN.

Role tambahan dapat digunakan jika diperlukan, misalnya:

* SUPER_ADMIN.
* OPERATIONS_ADMIN.
* FINANCE_ADMIN.

Namun, jangan menambahkan role yang tidak diperlukan.

Ketentuan keamanan:

* Register publik hanya dapat membuat akun CUSTOMER.
* Role ADMIN tidak boleh ditentukan oleh request registrasi publik.
* Sediakan mekanisme pembuatan admin pertama melalui seed atau command CLI yang aman.
* Lindungi endpoint admin menggunakan middleware backend.
* Jangan hanya menyembunyikan menu admin di frontend.
* Customer tidak boleh mengakses endpoint administratif.
* Customer tidak boleh membaca atau mengubah booking customer lain.
* Customer tidak boleh mengakses Algorithm Lab.
* Customer tidak boleh menjalankan endpoint algoritma.
* Terapkan validasi input.
* Terapkan rate limiting.
* Terapkan proteksi brute-force.
* Gunakan session atau token dengan keamanan yang sesuai.
* Jika memakai cookie autentikasi, gunakan HttpOnly, Secure pada HTTPS, dan SameSite yang sesuai.
* Terapkan proteksi CSRF bila relevan.
* Simpan secret di environment variables.
* Jangan menyimpan password dalam bentuk plaintext.
* Gunakan password hashing yang sesuai.
* Sediakan logout.
* Terapkan session atau token invalidation sesuai mekanisme autentikasi.
* Terapkan authorization pada setiap endpoint sensitif.
* Terapkan audit log untuk aktivitas admin penting.

13. DATABASE DESIGN

Buat schema database yang rapi dan memiliki relasi yang tepat.

Minimal mencakup model berikut:

* User.
* UserProfile.
* BusOperator.
* Bus.
* BusTerminal.
* BusRoute.
* BusSchedule.
* BusSeat.
* TrainOperator.
* TrainStation.
* TrainRoute.
* Train.
* TrainSchedule.
* TrainSeat jika relevan.
* Passenger.
* Booking.
* BookingItem jika diperlukan.
* SeatReservation.
* Payment.
* Refund.
* Coupon.
* Notification.
* Review jika fitur ulasan digunakan.
* AuditLog.
* SystemSetting.

Database Requirements

Gunakan:

* Primary key.
* Foreign key.
* Unique constraints.
* Index pada kolom pencarian yang sering digunakan.
* Tipe data harga yang tepat.
* Timestamp createdAt.
* Timestamp updatedAt.
* Soft delete atau archival untuk data yang perlu dipertahankan.
* Status enum yang konsisten.
* Relasi yang jelas antara booking, passenger, schedule, seat, dan payment.

Tambahkan:

* Unique constraint untuk nomor kursi per jadwal.
* Index untuk pencarian rute.
* Index untuk tanggal perjalanan.
* Index untuk operator.
* Index untuk status booking.
* Index untuk status pembayaran.
* Validasi tarif.
* Pencegahan pemesanan ganda.
* Transaksi database untuk reservasi dan booking.
* Migration.
* Seed data.

Jangan menganggap ketersediaan tiket selalu sama dengan status kursi di frontend. Gunakan data backend sebagai sumber kebenaran.

Gunakan nama AYORA pada:

* Seed data.
* Konfigurasi platform.
* System settings.
* Metadata aplikasi.
* Nama aplikasi.
* Notifikasi jika relevan.

14. API & BUSINESS LOGIC

Buat REST API terstruktur, misalnya:

* /api/auth
* /api/users
* /api/bus-operators
* /api/buses
* /api/bus-terminals
* /api/bus-routes
* /api/bus-schedules
* /api/train-operators
* /api/trains
* /api/train-stations
* /api/train-routes
* /api/train-schedules
* /api/search/bus
* /api/search/train
* /api/bookings
* /api/seat-reservations
* /api/payments
* /api/refunds
* /api/coupons
* /api/notifications
* /api/admin
* /api/admin/reports
* /api/admin/audit-logs
* /api/algorithm-lab

Pisahkan:

* Routes.
* Controllers.
* Services.
* Repositories jika diperlukan.
* Validation schemas.
* Middleware.
* Types.
* Algorithm modules.
* Database access.
* Error handling.

Gunakan:

* Centralized error handling.
* HTTP status yang benar.
* Pagination.
* Filtering.
* Sorting.
* Respons API yang konsisten.
* Validasi request.
* Validasi response jika relevan.
* Authorization middleware.
* Audit logging.

Jangan memberikan akses ke data sensitif yang tidak diperlukan.

15. ARRAY, POINTER, STRUCT, SORTING & SEARCHING

Pertahankan seluruh persyaratan algoritma, tetapi gunakan data bus dan kereta.

PENTING:

Seluruh fitur Algorithm Lab hanya boleh ditampilkan dan dapat diakses melalui panel admin.

Jangan tampilkan Algorithm Lab pada:

* Homepage.
* Navbar customer.
* Customer dashboard.
* Halaman pencarian.
* Halaman detail.
* Checkout.
* Halaman booking.
* Area publik lainnya.

Customer tidak boleh:

* Melihat Algorithm Lab.
* Mengakses halaman Algorithm Lab.
* Menjalankan visualisasi algoritma.
* Melihat sorting log.
* Melihat searching log.
* Mengekspor log algoritma.
* Memanggil endpoint algoritma.

Lindungi halaman dan endpoint Algorithm Lab menggunakan otorisasi role ADMIN di backend, bukan hanya dengan menyembunyikan menu di frontend.

Tambahkan menu Algorithm Lab hanya pada sidebar atau navigasi panel admin, misalnya pada route:

/admin/algorithm-lab

A. Array

Gunakan array untuk menyimpan:

* Daftar jadwal bus.
* Daftar jadwal kereta.
* Hasil pencarian.
* Daftar tarif.
* Data kursi.
* Sorting log.
* Searching log.
* Dataset demonstrasi.

Tampilkan pada halaman admin Algorithm Lab:

* Array sebelum diproses.
* Array setelah diproses.
* Indeks setiap elemen.
* Jumlah elemen.
* Perubahan urutan elemen.
* Visualisasi proses.
* Log pemrosesan.

Gunakan array yang benar-benar digunakan oleh algoritma.

B. Pointer

Implementasikan pointer menggunakan bahasa C.

Buat modul algoritma native C yang memuat:

* Pointer ke elemen array.
* Pointer arithmetic.
* Pointer sebagai parameter fungsi.
* Traversal array menggunakan pointer.
* Demonstrasi alamat memori dan nilai yang diakses.
* Validasi input.
* Output yang dapat dibaca oleh backend.

Contoh konseptual:

int prices[] = {150000, 250000, 350000};
int *ptr = prices;

Jelaskan bagaimana ptr menunjuk ke elemen array dan bagaimana *(ptr + i) mengakses elemen berikutnya.

Jangan menampilkan alamat memori palsu. Gunakan alamat aktual yang diperoleh saat program berjalan jika alamat ditampilkan.

Jangan menggunakan pointer C seolah-olah JavaScript atau TypeScript memiliki pointer mentah seperti C.

Jika proyek utama menggunakan TypeScript, buat modul demonstrasi C yang terpisah dengan input dan output yang jelas.

Integrasikan melalui:

* Script runner.
* Proses backend terisolasi.
* CLI internal.
* Adapter yang tervalidasi.

Jangan mengompilasi atau mengeksekusi kode C bebas yang dikirim oleh pengguna.

Seluruh demonstrasi pointer hanya dapat dijalankan dari Algorithm Lab pada panel admin.

Jangan menyediakan endpoint publik untuk menjalankan demonstrasi pointer.

C. Struct

Gunakan struct pada modul C untuk merepresentasikan jadwal bus dan kereta.

Contoh:

typedef struct {
    int id;
    char origin[100];
    char destination[100];
    int departureMinutes;
    int price;
} BusSchedule;
typedef struct {
    int id;
    char origin[100];
    char destination[100];
    int departureMinutes;
    int price;
} TrainSchedule;

Implementasikan:

* Array of struct.
* Akses field menggunakan operator titik.
* Akses field melalui pointer menggunakan operator panah.
* Passing struct ke fungsi.
* Passing pointer ke fungsi.
* Konversi data dari dataset aplikasi ke format demonstrasi yang tervalidasi.
* Validasi panjang string.
* Validasi ID.
* Validasi harga.
* Validasi waktu.

Jelaskan hubungan antara struct pada C dan object atau interface pada TypeScript, tetapi jangan menganggap keduanya identik.

Seluruh demonstrasi struct hanya dapat dijalankan dari Algorithm Lab pada panel admin.

D. Sorting

Implementasikan minimal satu algoritma sorting secara manual.

Algoritma utama:

Merge Sort

Sediakan pengurutan:

* Bus berdasarkan harga.
* Bus berdasarkan waktu keberangkatan.
* Bus berdasarkan durasi.
* Bus berdasarkan nama operator.
* Kereta berdasarkan harga.
* Kereta berdasarkan waktu keberangkatan.
* Kereta berdasarkan durasi.
* Kereta berdasarkan nama kereta.

Tampilkan sorting log aktual:

* Langkah algoritma.
* Indeks yang dibandingkan.
* Nilai yang dibandingkan.
* Tahap pembagian array.
* Tahap merge.
* Array sementara.
* Array final.
* Jumlah perbandingan.
* Jumlah operasi merge.
* Kompleksitas waktu.
* Kompleksitas ruang.

Kompleksitas Merge Sort:

* Waktu: O(n log n).
* Ruang: O(n).

Sediakan kontrol visualisasi:

* Start.
* Pause.
* Step.
* Reset.
* Clear Log.
* Copy Log.
* Export Log.
* Speed control jika relevan.

Kontrol tersebut hanya tersedia bagi admin pada halaman Algorithm Lab.

Jangan sekadar memanggil built-in sort() lalu mengklaim algoritma Merge Sort telah diimplementasikan.

Built-in sorting boleh digunakan sebagai pembanding atau pengujian hasil, tetapi bukan sebagai implementasi utama.

E. Searching

Implementasikan minimal dua algoritma searching:

1. Linear Search.
2. Binary Search.

Linear Search

Gunakan untuk mencari:

* Operator bus.
* Nama kereta.
* Rute.
* Kota asal.
* Kota tujuan.
* ID jika diperlukan.

Tampilkan:

* Indeks yang diperiksa.
* Nilai target.
* Nilai pembanding.
* Keputusan setiap langkah.
* Jumlah perbandingan.
* Hasil ditemukan atau tidak ditemukan.
* Kompleksitas waktu O(n).

Jangan menggunakan find(), filter(), atau indexOf() sebagai implementasi utama algoritma demonstrasi.

Binary Search

Gunakan untuk mencari:

* ID.
* Tarif numerik.
* Nilai numerik lain yang relevan.

Ketentuan:

* Array harus diurutkan berdasarkan key yang dicari.
* Tampilkan low.
* Tampilkan mid.
* Tampilkan high.
* Tampilkan nilai yang dibandingkan.
* Tampilkan keputusan pencarian.
* Tampilkan jumlah perbandingan.
* Tampilkan hasil ditemukan atau tidak ditemukan.
* Jelaskan kompleksitas waktu O(log n).

Jangan menggunakan built-in search sebagai implementasi utama Binary Search.

Jika Binary Search tidak cocok untuk pencarian teks atau dataset yang belum terurut, jelaskan alasannya dan gunakan algoritma yang sesuai.

F. Sorting Log & Searching Log

Buat dua panel visualisasi pada Algorithm Lab:

1. Sorting Log.
2. Searching Log.

Setiap log minimal memiliki:

* Timestamp.
* Nama algoritma.
* Jenis data.
* Operasi.
* Indeks terkait.
* Nilai yang dibandingkan.
* Kondisi atau keputusan.
* Hasil langkah.
* Nomor langkah.
* Dataset atau filter yang digunakan.

Sediakan tombol:

* Clear Log.
* Export Log ke JSON.
* Export Log ke CSV.
* Copy Log.
* Step-by-Step.
* Reset Visualization.

Log harus berasal dari eksekusi algoritma sebenarnya, bukan teks hardcoded.

Bedakan antara:

* Log algoritma demonstrasi.
* Audit log aktivitas sistem.

Audit log administratif tidak boleh dapat dimanipulasi melalui fitur visualisasi.

G. Integrasi Algoritma

Gunakan implementasi Merge Sort, Binary Search, dan Linear Search dalam fitur yang relevan.

Contoh:

* Admin mengurutkan jadwal bus berdasarkan harga menggunakan Merge Sort.
* Admin mengurutkan jadwal kereta berdasarkan durasi menggunakan Merge Sort.
* Admin mencari operator bus menggunakan Linear Search.
* Admin mencari ID jadwal menggunakan Binary Search.
* Admin menjalankan visualisasi algoritma pada Algorithm Lab.

Jika algoritma dijalankan pada fitur customer, pastikan customer tidak dapat melihat log internal atau mengakses Algorithm Lab. Namun, untuk menjaga batasan akses, fitur visualisasi dan log algoritma harus tetap eksklusif admin.

Hindari menjalankan proses C yang berat atau blocking pada event loop server.

Jika menggunakan subprocess:

* Terapkan timeout.
* Batasi resource.
* Validasi input.
* Isolasi proses.
* Jangan menerima kode bebas dari pengguna.
* Tangani error proses.
* Bersihkan file sementara.
* Catat kegagalan tanpa membocorkan secret.

16. ALGORITHM LAB ACCESS CONTROL

Route utama:

/admin/algorithm-lab

Ketentuan:

* Route harus berada di dalam layout admin.
* Route tidak boleh terdaftar sebagai route publik.
* Route tidak boleh terdaftar sebagai route customer.
* Endpoint harus dilindungi middleware role ADMIN.
* Customer yang belum login menerima unauthorized.
* Customer yang sudah login tetapi bukan admin menerima forbidden.
* Admin dapat mengakses sesuai izin.
* Frontend guard hanya menjadi lapisan tambahan.
* Backend authorization adalah sumber perlindungan utama.

Endpoint yang harus dilindungi:

* /api/algorithm-lab
* /api/algorithm-lab/array
* /api/algorithm-lab/pointer
* /api/algorithm-lab/struct
* /api/algorithm-lab/sort
* /api/algorithm-lab/search
* /api/algorithm-lab/logs
* /api/algorithm-lab/export

Jangan menyediakan endpoint publik untuk menjalankan algoritma.

17. SEARCH & URL

Gunakan URL yang mudah dipahami:

* /
* /bus
* /bus/search
* /bus/:id
* /kereta
* /kereta/search
* /kereta/:id
* /checkout
* /my-bookings
* /dashboard
* /admin
* /admin/buses
* /admin/trains
* /admin/bookings
* /admin/users
* /admin/reports
* /admin/algorithm-lab

Simpan parameter pencarian dalam query URL jika relevan agar halaman dapat di-refresh tanpa kehilangan konteks.

Route /admin/algorithm-lab harus berada di dalam layout admin dan tidak boleh terdaftar sebagai route publik atau route customer.

Gunakan title dan metadata yang mencerminkan brand AYORA, misalnya:

* "AYORA — Pesan Tiket Bus dan Kereta"
* "AYORA — Pencarian Tiket Bus"
* "AYORA — Pencarian Tiket Kereta"
* "AYORA — Detail Tiket Bus"
* "AYORA — Detail Tiket Kereta"
* "AYORA — Checkout"
* "AYORA — Pesanan Saya"
* "AYORA Admin Dashboard"
* "AYORA Algorithm Lab"

Jangan gunakan title atau metadata yang masih menyebut NexTrip.

18. UX DETAILS

Implementasikan:

* Navbar responsif.
* Mobile navigation.
* Accessible modal.
* Accessible dropdown.
* Search autocomplete dengan debounce.
* Filter yang dapat dihapus satu per satu.
* Empty state yang informatif.
* Skeleton loading.
* Error message yang mudah dipahami.
* Toast untuk aksi berhasil atau gagal.
* Breadcrumb pada dashboard.
* Form dengan inline validation.
* Confirmation dialog untuk tindakan berisiko.
* Pagination yang jelas.
* State yang tetap konsisten setelah refresh.
* URL query parameters untuk halaman pencarian.
* Kontras warna yang memadai.
* Keyboard navigation.
* Focus indicator.
* Responsive seat map.
* Responsive table.
* Responsive chart.
* Responsive admin sidebar.
* Mobile filter drawer.
* Loading state pada proses booking.
* Error recovery pada proses pembayaran simulasi.
* Countdown reservasi kursi jika digunakan.
* Informasi status booking yang jelas.

Pastikan layout tidak overflow pada viewport mobile.

19. SECURITY & DATA INTEGRITY

* Validasi semua input di server.
* Gunakan ORM dengan query yang aman.
* Terapkan authorization pada setiap endpoint sensitif.
* Cegah mass assignment.
* Gunakan rate limiting.
* Lindungi konfigurasi environment.
* Validasi file upload.
* Batasi ukuran file upload.
* Batasi tipe file upload.
* Jangan mempercayai nominal transaksi dari client.
* Gunakan transaksi database untuk operasi booking.
* Cegah perubahan status pembayaran tanpa verifikasi yang sah.
* Catat aktivitas administratif penting.
* Jangan menyimpan secret, password, atau token pada log.
* Jangan menampilkan data pribadi berlebihan pada audit log.
* Jangan menampilkan password kepada admin.
* Jangan menampilkan token kepada admin.
* Jangan menampilkan data pembayaran sensitif.
* Jangan menjalankan kode C bebas dari pengguna.
* Lindungi endpoint Algorithm Lab.
* Terapkan timeout pada proses algoritma native.
* Validasi dataset sebelum dikirim ke modul C.
* Bersihkan file sementara.
* Gunakan environment variables untuk secret.
* Gunakan HTTPS pada deployment.
* Gunakan secure cookie jika memakai cookie.
* Terapkan CSRF protection jika relevan.
* Terapkan Content Security Policy jika memungkinkan.
* Terapkan security headers.
* Terapkan audit log untuk perubahan status booking, pembayaran, refund, role, dan data produk.

20. TESTING

Buat automated tests minimal untuk:

Authentication

* Registrasi customer.
* Login customer.
* Login admin.
* Logout.
* Password hashing.
* Proteksi route.
* Expired session atau token.
* Role authorization.

Customer

* Customer dapat mencari bus.
* Customer dapat mencari kereta.
* Customer dapat melihat detail jadwal.
* Customer dapat membuat booking.
* Customer hanya dapat melihat booking miliknya.
* Customer tidak dapat melihat booking customer lain.
* Customer tidak dapat mengakses dashboard admin.
* Customer tidak dapat mengakses Algorithm Lab.
* Customer tidak dapat memanggil endpoint Algorithm Lab.

Admin

* Admin dapat mengakses dashboard admin.
* Admin dapat mengelola operator bus.
* Admin dapat mengelola jadwal bus.
* Admin dapat mengelola operator kereta.
* Admin dapat mengelola jadwal kereta.
* Admin dapat mengelola booking.
* Admin dapat mengelola customer sesuai izin.
* Admin dapat mengakses Algorithm Lab.
* Admin dapat menjalankan algoritma.
* Admin dapat mengekspor log.

Booking

* Validasi form booking.
* Perhitungan harga.
* Pembuatan booking.
* Validasi status pembayaran.
* Reservasi kursi.
* Pencegahan double booking.
* Expiration reservasi.
* Pembatalan.
* Refund.
* Idempotency.

Algorithms

* Merge Sort.
* Binary Search.
* Linear Search.
* Pointer demonstration.
* Struct demonstration.
* Sorting log.
* Searching log.
* Dataset kosong.
* Dataset satu elemen.
* Data duplikat.
* Target tidak ditemukan.
* Hasil sorting sesuai urutan.
* Binary Search hanya digunakan pada data yang memenuhi prasyarat.
* Validasi output modul C.
* Timeout proses C.

UI

* Light Mode.
* Dark Mode.
* Responsive layout.
* Mobile navigation.
* Seat selection.
* Filter.
* Sorting.
* Empty state.
* Error state.
* Loading state.
* Footer copyright.
* Tidak ada branding NexTrip.
* Tidak ada link Algorithm Lab pada area customer.

21. PROJECT STRUCTURE

Buat struktur folder yang jelas dan scalable, misalnya:

jalanyuk/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── layouts/
│   │   ├── features/
│   │   │   ├── auth/
│   │   │   ├── bus/
│   │   │   ├── train/
│   │   │   ├── booking/
│   │   │   ├── customer/
│   │   │   ├── admin/
│   │   │   └── algorithm-lab/
│   │   ├── hooks/
│   │   ├── services/
│   │   ├── types/
│   │   ├── routes/
│   │   ├── lib/
│   │   └── styles/
│   └── package.json
├── backend/
│   ├── src/
│   │   ├── routes/
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── repositories/
│   │   ├── middleware/
│   │   ├── validators/
│   │   ├── algorithms/
│   │   ├── auth/
│   │   ├── utils/
│   │   └── config/
│   ├── prisma/
│   │   ├── schema.prisma
│   │   ├── migrations/
│   │   └── seed.ts
│   └── package.json
├── algorithms-c/
│   ├── src/
│   │   ├── pointer_demo.c
│   │   ├── struct_demo.c
│   │   ├── bus_schedule.c
│   │   ├── train_schedule.c
│   │   └── main.c
│   ├── tests/
│   ├── Makefile
│   └── README.md
├── docs/
│   ├── architecture.md
│   ├── api.md
│   ├── database.md
│   ├── algorithms.md
│   └── deployment.md
├── .env.example
├── docker-compose.yml
├── README.md
└── package.json

Struktur di atas adalah panduan. Sesuaikan jika ada alasan teknis yang lebih baik.

22. SEED DATA

Buat seed data realistis untuk demonstrasi, tetapi tandai sebagai data simulasi.

Seed data minimal:

Bus

* Beberapa operator bus.
* Beberapa terminal.
* Beberapa kota.
* Beberapa rute.
* Beberapa armada.
* Beberapa kelas layanan.
* Beberapa jadwal.
* Beberapa konfigurasi kursi.
* Beberapa fasilitas.
* Beberapa tarif.

Kereta

* Beberapa operator kereta.
* Beberapa stasiun.
* Beberapa kota.
* Beberapa rute.
* Beberapa nama kereta.
* Beberapa nomor kereta simulasi.
* Beberapa jadwal.
* Beberapa kelas.
* Beberapa tarif.
* Beberapa konfigurasi kursi jika relevan.

User

* Customer demo.
* Admin demo melalui mekanisme seed yang aman.

Jangan menanamkan password asli atau kredensial sensitif di source code produksi.

Jika menyediakan akun demo, dokumentasikan cara membuat atau mengatur password melalui environment variable atau command CLI.

Gunakan nama AYORA pada:

* Nama platform.
* System settings.
* Seed data.
* Notifikasi.
* Metadata.
* Konfigurasi.

23. PAYMENT SIMULATION

Jika payment gateway nyata belum tersedia, implementasikan payment simulation dengan label yang jelas:

Pembayaran Simulasi

Sediakan skenario:

* Pembayaran berhasil.
* Pembayaran gagal.
* Pembayaran kedaluwarsa.
* Refund simulasi.
* Pembatalan sebelum pembayaran.
* Pembatalan setelah pembayaran sesuai kebijakan.

Jangan:

* Menyimpan nomor kartu.
* Menyimpan CVV.
* Mengklaim pembayaran nyata.
* Menggunakan kredensial payment gateway asli.
* Menampilkan data pembayaran sensitif.

Gunakan status pembayaran yang konsisten dan audit log untuk perubahan status.

24. DOCUMENTATION

Buat dokumentasi lengkap yang mencakup:

* Deskripsi proyek.
* Scope bus dan kereta.
* Arsitektur sistem.
* Tech stack.
* Struktur folder.
* Cara instalasi.
* Cara menjalankan frontend.
* Cara menjalankan backend.
* Cara menjalankan database.
* Cara menjalankan migration.
* Cara menjalankan seed.
* Cara membuat admin pertama.
* Cara menjalankan modul C.
* Cara menjalankan Algorithm Lab.
* Cara menjalankan testing.
* Dokumentasi API.
* Dokumentasi database.
* Dokumentasi autentikasi.
* Dokumentasi RBAC.
* Dokumentasi booking.
* Dokumentasi reservasi kursi.
* Dokumentasi pembayaran simulasi.
* Dokumentasi Merge Sort.
* Dokumentasi Binary Search.
* Dokumentasi Linear Search.
* Dokumentasi Pointer.
* Dokumentasi Struct.
* Dokumentasi keamanan.
* Dokumentasi deployment.
* Daftar environment variables.
* Daftar keterbatasan integrasi eksternal.

Pastikan seluruh dokumentasi menggunakan nama AYORA.

Jangan meninggalkan dokumentasi yang masih menggunakan nama NexTrip.

25. DELIVERY REQUIREMENTS

Kerjakan implementasi secara bertahap.

Tahap 1 — Planning

* Analisis kebutuhan.
* Rancang arsitektur.
* Rancang database schema.
* Buat route map.
* Tentukan alur autentikasi.
* Tentukan alur booking.
* Tentukan alur reservasi kursi.
* Tentukan alur pembayaran simulasi.
* Tentukan alur refund.
* Buat daftar halaman.
* Tentukan batas akses customer dan admin.
* Tentukan desain Algorithm Lab khusus admin.

Tahap 2 — Foundation

* Setup proyek.
* Setup frontend.
* Setup backend.
* Setup database.
* Buat migration.
* Buat seed.
* Buat design system.
* Implementasikan Light Mode.
* Implementasikan Dark Mode.
* Implementasikan autentikasi.
* Implementasikan RBAC.
* Implementasikan middleware admin.
* Implementasikan middleware Algorithm Lab.

Tahap 3 — Customer Features

* Homepage.
* Search bus.
* Search kereta.
* Filter.
* Sorting.
* Detail bus.
* Detail kereta.
* Seat selection.
* Checkout.
* Booking.
* Payment simulation.
* Customer dashboard.
* E-ticket.
* Riwayat booking.
* Pembatalan.

Tahap 4 — Admin Features

* Admin overview.
* Bus management.
* Train management.
* Booking management.
* User management.
* Reports.
* Settings.
* Audit log.
* Export laporan.

Tahap 5 — Algorithm Lab

* Array visualization.
* Pointer demonstration menggunakan C.
* Struct demonstration menggunakan C.
* Merge Sort dengan log.
* Binary Search dengan log.
* Linear Search dengan log.
* Step-by-step visualization.
* Export log.
* Admin-only access control.
* Backend authorization.
* Timeout dan isolasi proses C.

Tahap 6 — Quality

* Automated tests.
* Security checks.
* Responsive checks.
* Error handling.
* Performance improvements.
* Database integrity checks.
* Double booking checks.
* Payment state checks.
* Perbaikan bug.
* Pemeriksaan branding.
* Pemeriksaan copyright.
* Pemeriksaan akses Algorithm Lab.

Tahap 7 — Documentation

* README lengkap.
* Panduan instalasi.
* Panduan konfigurasi database.
* Panduan environment variables.
* Panduan menjalankan frontend dan backend.
* Panduan membuat akun admin pertama.
* Panduan menjalankan algoritma C.
* Panduan menjalankan Algorithm Lab.
* Panduan menjalankan tests.
* Dokumentasi API.
* Dokumentasi struktur database.
* Dokumentasi keamanan.
* Dokumentasi keterbatasan integrasi.

26. BRANDING CLEANUP

Lakukan pencarian menyeluruh pada seluruh repository untuk memastikan:

* Tidak ada teks NexTrip pada UI.
* Tidak ada logo NexTrip.
* Tidak ada title NexTrip.
* Tidak ada metadata NexTrip.
* Tidak ada route label NexTrip.
* Tidak ada seed data NexTrip.
* Tidak ada system setting NexTrip.
* Tidak ada dokumentasi NexTrip.
* Tidak ada komentar dokumentasi NexTrip yang tidak diperlukan.
* Tidak ada copyright lama.
* Tidak ada nama brand lama pada notifikasi.
* Tidak ada nama brand lama pada email template.
* Tidak ada nama brand lama pada konfigurasi.

Ganti seluruh penyebutan NexTrip menjadi AYORA.

Tambahkan copyright:

© 2026 AYORA. All rights reserved.

pada footer halaman publik dan area aplikasi yang relevan.

27. ACCEPTANCE CRITERIA

Website dianggap sesuai jika:

1. Nama website di seluruh aplikasi adalah AYORA.
2. Copyright © 2026 AYORA. All rights reserved. tampil pada footer yang relevan.
3. Hanya memiliki layanan bus dan kereta.
4. Tidak ada menu atau fitur pesawat, hotel, rental kendaraan, atau wisata.
5. Customer dapat mencari tiket bus.
6. Customer dapat mencari tiket kereta.
7. Customer dapat melihat detail jadwal.
8. Customer dapat memilih kursi jika tersedia.
9. Customer dapat melakukan booking.
10. Customer dapat melakukan pembayaran simulasi.
11. Customer dapat melihat riwayat booking.
12. Customer dapat melihat dan mengunduh e-ticket.
13. Customer dapat mengajukan pembatalan sesuai kebijakan.
14. Admin dapat mengelola operator bus.
15. Admin dapat mengelola rute bus.
16. Admin dapat mengelola jadwal bus.
17. Admin dapat mengelola operator kereta.
18. Admin dapat mengelola rute kereta.
19. Admin dapat mengelola jadwal kereta.
20. Admin dapat mengelola tarif.
21. Admin dapat mengelola kursi.
22. Admin dapat mengelola pengguna sesuai izin.
23. Admin dapat mengelola booking.
24. Admin dapat melihat laporan.
25. Admin dapat melihat audit log.
26. Light Mode berfungsi.
27. Dark Mode berfungsi.
28. Layout responsif pada mobile, tablet, dan desktop.
29. Array benar-benar diimplementasikan.
30. Pointer benar-benar diimplementasikan menggunakan C.
31. Struct benar-benar diimplementasikan menggunakan C.
32. Merge Sort benar-benar diimplementasikan secara manual.
33. Linear Search benar-benar diimplementasikan secara manual.
34. Binary Search benar-benar diimplementasikan secara manual.
35. Sorting log berasal dari eksekusi algoritma nyata.
36. Searching log berasal dari eksekusi algoritma nyata.
37. Log dapat diekspor oleh admin.
38. Database dan backend memvalidasi ketersediaan tiket.
39. Sistem mencegah pemesanan ganda pada kursi yang sama.
40. Pembayaran demo tidak diklaim sebagai pembayaran nyata.
41. Data simulasi diberi label yang jelas.
42. Testing tersedia dan dapat dijalankan.
43. Dokumentasi tersedia.
44. Algorithm Lab hanya muncul di panel admin.
45. Customer tidak dapat melihat Algorithm Lab.
46. Customer tidak dapat mengakses halaman Algorithm Lab.
47. Customer tidak dapat mengakses endpoint Algorithm Lab.
48. Endpoint Algorithm Lab dilindungi middleware role ADMIN.
49. Navigasi customer tidak memuat tautan menuju Algorithm Lab.
50. Halaman publik tidak memuat tautan menuju Algorithm Lab.
51. Tidak ada branding NexTrip yang tersisa pada UI.
52. Tidak ada branding NexTrip yang tersisa pada metadata.
53. Tidak ada branding NexTrip yang tersisa pada dokumentasi.
54. Tidak ada branding NexTrip yang tersisa pada seed data.
55. Tidak ada copyright tahun atau nama brand lama yang tersisa.
56. Tidak ada secret, password, atau kredensial sensitif yang di-hardcode.
57. Tidak ada tombol utama yang hanya menjadi dekorasi.
58. Tidak ada klaim integrasi operator atau pembayaran nyata yang belum tersedia.
59. Hasil testing dilaporkan berdasarkan eksekusi aktual.
60. Fitur yang belum dapat diintegrasikan dijelaskan secara transparan.

28. FINAL INSTRUCTIONS TO KIRO

Mulai dengan memeriksa workspace dan tools yang tersedia.

Jika proyek sudah memiliki struktur atau implementasi, analisis terlebih dahulu dan pertahankan bagian yang masih relevan. Jangan menghapus file penting tanpa alasan.

Periksa seluruh implementasi sebelumnya dan lakukan penyesuaian menyeluruh terhadap:

* Scope bus dan kereta.
* Perubahan nama brand menjadi AYORA.
* Penghapusan fitur pesawat, hotel, rental kendaraan, dan wisata.
* Penambahan copyright.
* Pembatasan Algorithm Lab hanya untuk admin.
* Perlindungan endpoint Algorithm Lab.
* Pembaruan database.
* Pembaruan API.
* Pembaruan halaman.
* Pembaruan navigasi.
* Pembaruan dashboard.
* Pembaruan seed data.
* Pembaruan metadata.
* Pembaruan konfigurasi.
* Pembaruan dokumentasi.

Ganti seluruh penyebutan NexTrip menjadi AYORA.

Pastikan tidak ada teks, logo, title, route label, komentar dokumentasi, seed data, atau konfigurasi yang masih menggunakan nama NexTrip, kecuali pada catatan migrasi internal yang memang diperlukan.

Tambahkan copyright:

© 2026 AYORA. All rights reserved.

pada footer halaman publik dan area aplikasi yang relevan.

Pastikan seluruh alur customer, admin, booking, pembayaran simulasi, reservasi kursi, laporan, dan Algorithm Lab konsisten dengan layanan bus dan kereta.

Algorithm Lab harus menjadi fitur internal khusus admin untuk memvisualisasikan:

* Array.
* Pointer.
* Struct.
* Sorting.
* Searching.

Jangan tampilkan atau berikan akses fitur tersebut kepada customer maupun pengguna publik.

Jangan hanya membuat landing page atau mockup statis. Implementasikan alur end-to-end yang dapat dijalankan.

Prioritaskan satu alur yang benar-benar selesai terlebih dahulu:

Login → Pencarian Bus atau Kereta → Detail Jadwal → Pemilihan Kursi → Checkout → Pembayaran Simulasi → E-ticket → Dashboard Customer.

Setelah alur customer selesai, lanjutkan:

Admin Login → Admin Dashboard → Manajemen Bus dan Kereta → Manajemen Booking → Laporan → Algorithm Lab.

Jangan mengarang hasil testing. Jalankan test, periksa error, dan laporkan hasil aktual.

Jika terdapat fitur yang tidak dapat diselesaikan karena keterbatasan API atau environment, jelaskan keterbatasannya dan berikan implementasi alternatif yang tetap dapat dijalankan.

Di akhir pekerjaan, tampilkan:

* Fitur yang berhasil dibuat.
* Arsitektur proyek.
* Struktur folder.
* Database dan cara migrasi.
* Cara menjalankan seed.
* Cara membuat akun admin pertama.
* Cara menjalankan frontend.
* Cara menjalankan backend.
* Cara menjalankan modul C.
* Cara mengakses Algorithm Lab sebagai admin.
* Hasil pengujian aktual.
* Daftar endpoint utama.
* Daftar environment variables.
* Fitur yang masih membutuhkan integrasi eksternal.
* Konfirmasi bahwa tidak ada branding NexTrip yang tersisa.
* Konfirmasi bahwa copyright AYORA telah ditambahkan.
* Konfirmasi bahwa Algorithm Lab hanya dapat diakses admin.

Mulai implementasi sekarang dan teruskan sampai acceptance criteria yang dapat dikerjakan dalam environment ini terpenuhi.
