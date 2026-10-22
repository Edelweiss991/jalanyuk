SCOPE UPDATE — JALANYUK 2026: BUS & TRAIN ONLY

PENTING: Perbarui seluruh spesifikasi proyek JalanYuk sebelumnya. Website ini secara eksklusif menyediakan layanan pemesanan tiket BUS dan KERETA di Indonesia.

Jangan implementasikan fitur pemesanan pesawat, hotel, rental kendaraan, atau aktivitas wisata. Hapus seluruh navigasi, halaman, API, tabel database, kategori, filter, dan komponen UI yang hanya berkaitan dengan layanan tersebut.

Pertahankan teknologi, sistem autentikasi, tema Light/Dark, customer dashboard, admin dashboard, keamanan, serta persyaratan Array, Pointer, Struct, Sorting, dan Searching dari spesifikasi sebelumnya.

Gunakan nama brand JalanYuk di seluruh aplikasi, termasuk logo teks, title halaman, metadata, navbar, dashboard, email atau notifikasi, dokumentasi, dan seed data jika relevan.

Tambahkan copyright berikut pada footer seluruh halaman publik dan halaman dashboard:

© 2026 JalanYuk. All rights reserved.

1. PRODUCT SCOPE

JalanYuk merupakan platform pemesanan tiket bus dan kereta antarkota dengan pengalaman pengguna modern, sederhana, aman, dan responsif.

Kategori utama hanya:

* Bus antarkota.
* Kereta antarkota.

Gunakan bahasa Indonesia sebagai bahasa utama dan format mata uang Rupiah (IDR).

Gunakan zona waktu Asia/Jakarta sebagai default untuk tampilan jadwal, dengan dukungan zona waktu lain jika diperlukan.

Jangan mengklaim memiliki integrasi operator, inventaris kursi, atau pembayaran nyata jika integrasi tersebut belum tersedia.

Jika menggunakan data simulasi, tampilkan label Data Simulasi secara jelas pada halaman yang relevan.

1. CUSTOMER HOMEPAGE

Buat homepage dengan:

* Navbar JalanYuk.
* Logo atau wordmark JalanYuk.
* Menu Beranda, Bus, Kereta, Pesanan Saya, dan Bantuan.
* Login, Registrasi, Profil, dan toggle tema.
* Hero section dengan headline seperti "Perjalanan Lebih Mudah, Tiket dalam Satu Genggaman".
* Search widget dengan tab Bus dan Kereta.
* Destinasi populer di Indonesia.
* Rute bus populer.
* Rute kereta populer.
* Promo tiket.
* Keunggulan layanan.
* Footer dengan bantuan, kebijakan, kontak, dan copyright © 2026 JalanYuk. All rights reserved.

Gunakan foto transportasi darat, stasiun, terminal, dan destinasi Indonesia yang relevan.

Jangan tampilkan tautan, menu, banner, atau promosi yang berkaitan dengan Algorithm Lab pada homepage atau area publik.

1. BUS BOOKING

Implementasikan pencarian bus dengan:

* Kota atau terminal keberangkatan.
* Kota atau terminal tujuan.
* Tanggal perjalanan.
* Jumlah penumpang.
* Filter operator bus.
* Filter rentang harga.
* Filter jam keberangkatan.
* Filter kelas layanan.
* Filter fasilitas.
* Sorting harga termurah, harga tertinggi, waktu keberangkatan, dan durasi perjalanan.

Setiap hasil bus menampilkan:

* Nama operator.
* Logo atau gambar operator jika tersedia.
* Terminal asal dan tujuan.
* Waktu keberangkatan dan kedatangan.
* Durasi perjalanan.
* Kelas bus.
* Fasilitas.
* Harga per penumpang.
* Sisa kursi jika datanya benar-benar tersedia.
* Tombol Pilih Kursi atau Lanjut Booking.

Bus Seat Selection

Buat visualisasi kursi bus berdasarkan konfigurasi yang dimiliki setiap jadwal bus.

Ketentuan:

* Kursi tersedia dapat dipilih.
* Kursi yang telah dipesan tidak dapat dipilih.
* Kursi pilihan customer diberi penanda visual.
* Kursi tidak tersedia memiliki tampilan berbeda.
* Ringkasan kursi dan total harga diperbarui secara langsung.
* Backend memvalidasi kembali ketersediaan saat booking dibuat.
* Gunakan mekanisme transaksi atau reservasi sementara untuk mencegah dua pengguna membeli kursi yang sama.
* Jangan menganggap pilihan kursi di frontend sebagai bukti reservasi berhasil.

Jika layout kursi operator belum diketahui, gunakan konfigurasi demo yang jelas diberi label simulasi.

1. TRAIN BOOKING

Implementasikan pencarian kereta dengan:

* Stasiun keberangkatan.
* Stasiun tujuan.
* Tanggal keberangkatan.
* Jumlah penumpang.
* Kelas kereta.
* Filter harga.
* Filter waktu keberangkatan.
* Filter durasi perjalanan.
* Sorting berdasarkan harga, jadwal, dan durasi.

Setiap hasil menampilkan:

* Nama kereta.
* Operator.
* Stasiun asal dan tujuan.
* Jadwal keberangkatan dan kedatangan.
* Durasi.
* Kelas kereta.
* Harga tiket per penumpang.
* Ketersediaan tiket jika data tersedia.
* Tombol pilih tiket dan lanjut booking.

Train Booking Details

Sediakan:

* Form identitas penumpang.
* Ringkasan perjalanan.
* Informasi kelas dan jadwal.
* Pemilihan kursi jika didukung oleh data atau integrasi.
* Ringkasan harga.
* Konfirmasi pesanan.
* E-ticket atau kode booking setelah status pesanan terkonfirmasi.

Jangan mengarang nomor kereta, jadwal resmi, tarif resmi, atau ketersediaan real-time. Jika menggunakan dataset contoh, tampilkan label "Data Simulasi".

1. BOOKING FLOW

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

Pisahkan status booking, status reservasi kursi, dan status pembayaran agar alur transaksi tidak membingungkan.

1. CUSTOMER DASHBOARD

Sediakan:

* Profil customer.
* Riwayat tiket bus.
* Riwayat tiket kereta.
* Detail pesanan.
* Kode booking.
* Informasi penumpang.
* Status pembayaran.
* E-ticket.
* Jadwal perjalanan mendatang.
* Riwayat perjalanan.
* Permintaan pembatalan sesuai kebijakan.
* Notifikasi.
* Bantuan.
* Logout.
* Footer atau bagian informasi dengan copyright © 2026 JalanYuk. All rights reserved.

Customer hanya dapat melihat pesanan miliknya sendiri.

Jangan tampilkan menu, tautan, tombol, atau akses menuju Algorithm Lab pada customer dashboard.

1. ADMIN DASHBOARD

Admin memiliki akses operasional penuh sesuai otorisasi.

Gunakan branding JalanYuk pada admin dashboard, termasuk judul halaman, sidebar, logo, metadata, dan footer.

Dashboard Overview

Tampilkan:

* Total tiket bus terjual.
* Total tiket kereta terjual.
* Total booking.
* Total customer.
* Booking pending.
* Booking confirmed.
* Booking cancelled.
* Pendapatan tercatat.
* Grafik transaksi berdasarkan tanggal.
* Rute populer.
* Jadwal dengan jumlah pemesanan tertinggi.

Bus Management

Admin dapat mengelola:

* Operator bus.
* Terminal.
* Kota dan rute.
* Jadwal keberangkatan.
* Jadwal kedatangan.
* Armada.
* Kelas layanan.
* Konfigurasi kursi.
* Fasilitas.
* Tarif.
* Ketersediaan.
* Status jadwal.
* Data demo atau integrasi operator.

Train Management

Admin dapat mengelola:

* Operator kereta.
* Stasiun.
* Rute kereta.
* Nama dan nomor kereta.
* Jadwal perjalanan.
* Kelas.
* Tarif.
* Konfigurasi kursi jika tersedia.
* Ketersediaan tiket.
* Status jadwal.
* Data demo atau integrasi resmi.

Booking Management

Admin dapat:

* Mencari seluruh pesanan.
* Memfilter berdasarkan bus atau kereta.
* Memfilter tanggal dan status.
* Melihat detail penumpang sesuai izin.
* Memeriksa status pembayaran.
* Mengelola pembatalan sesuai kebijakan.
* Memproses refund melalui mekanisme yang sah.
* Mengekspor laporan.
* Melihat audit log.

User Management

Admin dapat:

* Mengelola akun customer.
* Mengelola role sesuai otorisasi.
* Menonaktifkan akun.
* Melihat aktivitas yang relevan.
* Melindungi data pribadi dan kredensial pengguna.

1. DATABASE SCHEMA UPDATE

Sesuaikan database agar khusus bus dan kereta.

Gunakan tabel atau model yang relevan, antara lain:

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
* AuditLog.
* SystemSetting.

Tambahkan:

* Relasi foreign key yang tepat.
* Unique constraint untuk nomor kursi per jadwal.
* Index untuk pencarian rute, tanggal, operator, dan status.
* Validasi tarif.
* Pencegahan pemesanan ganda.
* Transaksi database untuk reservasi dan booking.
* Migration dan seed data.

Jangan menganggap ketersediaan tiket selalu sama dengan status kursi di frontend. Gunakan data backend sebagai sumber kebenaran.

Gunakan nama JalanYuk pada seed data, konfigurasi platform, system settings, dan metadata aplikasi jika relevan.

1. ARRAY, POINTER, STRUCT, SORTING & SEARCHING

Pertahankan seluruh persyaratan algoritma dari prompt sebelumnya, tetapi gunakan data bus dan kereta.

PENTING: Seluruh fitur Algorithm Lab hanya boleh ditampilkan dan dapat diakses melalui panel admin. Jangan tampilkan Algorithm Lab pada homepage, navbar customer, customer dashboard, halaman pencarian, halaman detail, checkout, atau area publik lainnya. Customer tidak boleh melihat, mengakses, atau menjalankan visualisasi algoritma dan log algoritma. Lindungi halaman serta endpoint Algorithm Lab menggunakan otorisasi role ADMIN di backend, bukan hanya dengan menyembunyikan menu di frontend.

Tambahkan menu Algorithm Lab hanya pada sidebar atau navigasi panel admin, misalnya pada route /admin/algorithm-lab.

Array

Gunakan array untuk menyimpan:

* Daftar jadwal bus.
* Daftar jadwal kereta.
* Hasil pencarian.
* Daftar tarif.
* Data kursi.
* Sorting log dan searching log.

Visualisasi array, indeks, perubahan urutan, dan log pemrosesan hanya tersedia di halaman admin Algorithm Lab.

Pointer dan Struct

Gunakan bahasa C untuk:

* Pointer ke elemen array.
* Pointer arithmetic.
* Passing pointer ke fungsi.
* Struct BusSchedule.
* Struct TrainSchedule.
* Array of struct.
* Akses field melalui operator titik dan panah.

Contoh struktur:

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

Sesuaikan representasi waktu dan ID agar tervalidasi saat dikonversi dari database ke program C.

Seluruh demonstrasi pointer dan struct hanya dapat dijalankan dari Algorithm Lab pada panel admin. Jangan menyediakan endpoint publik untuk menjalankan demonstrasi tersebut.

Sorting

Implementasikan Merge Sort secara manual.

Sediakan pengurutan:

* Bus berdasarkan harga.
* Bus berdasarkan waktu keberangkatan.
* Bus berdasarkan durasi.
* Kereta berdasarkan harga.
* Kereta berdasarkan waktu keberangkatan.
* Kereta berdasarkan durasi.

Tampilkan sorting log aktual:

* Langkah algoritma.
* Indeks yang dibandingkan.
* Nilai yang dibandingkan.
* Tahap merge.
* Array sementara.
* Array akhir.
* Jumlah perbandingan.
* Kompleksitas algoritma.

Kontrol visualisasi seperti Start, Pause, Step, Reset, Clear Log, Copy Log, dan Export Log hanya tersedia bagi admin pada halaman Algorithm Lab.

Searching

Implementasikan:

* Linear Search untuk mencari operator, nama kereta, atau rute.
* Binary Search untuk mencari ID atau tarif numerik dalam dataset yang sudah diurutkan sesuai key pencarian.

Tampilkan searching log:

* Langkah.
* Low, mid, dan high untuk Binary Search.
* Indeks yang diperiksa untuk Linear Search.
* Nilai target.
* Nilai pembanding.
* Keputusan.
* Jumlah perbandingan.
* Hasil pencarian.

Sediakan visualisasi interaktif dan ekspor log ke JSON atau CSV hanya di panel admin.

Algoritma harus benar-benar berjalan pada data yang diproses, bukan sekadar menampilkan log hardcoded.

Pastikan endpoint /api/algorithm-lab dan seluruh endpoint terkait visualisasi, eksekusi algoritma, serta ekspor log memiliki middleware yang memverifikasi role ADMIN. Customer yang mencoba mengakses route atau endpoint tersebut harus menerima respons unauthorized atau forbidden sesuai kondisi autentikasi.

1. SEARCH & URL

Gunakan URL yang mudah dipahami, misalnya:

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

Gunakan title dan metadata yang mencerminkan brand JalanYuk, misalnya:

* "JalanYuk — Pesan Tiket Bus dan Kereta"
* "JalanYuk — Pencarian Tiket Bus"
* "JalanYuk — Pencarian Tiket Kereta"
* "JalanYuk Admin Dashboard"
* "JalanYuk Algorithm Lab"

1. ACCEPTANCE CRITERIA

Website dianggap sesuai jika:

1. Nama website di seluruh aplikasi adalah JalanYuk.
2. Copyright © 2026 JalanYuk. All rights reserved. tampil pada footer yang relevan.
3. Hanya memiliki layanan bus dan kereta.
4. Tidak ada menu atau fitur pesawat, hotel, dan wisata.
5. Customer dapat mencari dan memesan tiket menggunakan data yang tersedia.
6. Customer dapat melihat riwayat booking dan tiket.
7. Admin dapat mengelola operator, rute, jadwal, tarif, kursi, pengguna, dan booking sesuai izin.
8. Light Mode dan Dark Mode berfungsi.
9. Layout responsif pada mobile, tablet, dan desktop.
10. Array, Pointer, dan Struct benar-benar diimplementasikan.
11. Merge Sort, Linear Search, dan Binary Search menampilkan log eksekusi nyata.
12. Database dan backend memvalidasi ketersediaan tiket.
13. Sistem mencegah pemesanan ganda pada kursi yang sama.
14. Pembayaran demo tidak diklaim sebagai pembayaran nyata.
15. Data simulasi diberi label yang jelas.
16. Testing dan dokumentasi tersedia.
17. Algorithm Lab hanya muncul di panel admin.
18. Customer tidak dapat melihat atau mengakses halaman, endpoint, visualisasi, maupun log Algorithm Lab.
19. Endpoint Algorithm Lab dilindungi middleware role ADMIN di backend.
20. Navigasi customer dan halaman publik tidak memuat tautan menuju Algorithm Lab.
21. Tidak ada branding NexTrip yang tersisa pada UI, metadata, dokumentasi, seed data, atau konfigurasi aplikasi.
22. Tidak ada copyright tahun atau nama brand lama yang tersisa pada aplikasi.

23. FINAL INSTRUCTION

Periksa seluruh implementasi NexTrip sebelumnya dan lakukan penyesuaian menyeluruh terhadap scope bus dan kereta serta perubahan nama brand menjadi JalanYuk.

Hapus fitur yang tidak relevan, perbarui database, API, halaman, navigasi, dashboard, seed data, metadata, konfigurasi, dan dokumentasi.

Ganti seluruh penyebutan NexTrip menjadi JalanYuk. Pastikan tidak ada teks, logo, title, route label, komentar dokumentasi, atau konfigurasi yang masih menggunakan nama NexTrip, kecuali pada catatan migrasi internal yang memang diperlukan.

Tambahkan copyright © 2026 JalanYuk. All rights reserved. pada footer halaman publik dan area aplikasi yang relevan.

Pastikan seluruh alur customer, admin, booking, dan Algorithm Lab konsisten dengan layanan bus dan kereta. Algorithm Lab harus menjadi fitur internal khusus admin untuk memvisualisasikan Array, Pointer, Struct, Sorting, dan Searching. Jangan tampilkan atau berikan akses fitur tersebut kepada customer maupun pengguna publik.

Lanjutkan implementasi hingga fitur yang dapat dijalankan di environment tersedia, jalankan testing, dan laporkan hasil aktual serta integrasi yang masih diperlukan.
