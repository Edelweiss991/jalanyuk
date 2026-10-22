import { useEffect, useState } from 'react';
import { ChevronDown, ChevronUp, Mail } from 'lucide-react';

export default function HelpPage() {
  useEffect(() => {
    document.title = 'JalanYuk — Bantuan';
  }, []);

  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      question: 'Bagaimana cara memesan tiket?',
      answer: 'Pilih rute dan tanggal perjalanan, lalu pilih jadwal yang sesuai. Setelah memilih kursi dan mengisi data penumpang, lakukan pembayaran simulasi untuk mendapatkan e-ticket.',
    },
    {
      question: 'Metode pembayaran apa saja yang tersedia?',
      answer: 'Saat ini kami menyediakan pembayaran simulasi melalui berbagai metode: transfer bank, e-wallet, dan kartu kredit. Semua pembayaran bersifat simulasi untuk keperluan demo platform.',
    },
    {
      question: 'Bagaimana cara membatalkan pesanan?',
      answer: 'Pembatalan dapat dilakukan melalui halaman "Pesanan Saya". Pilih booking yang ingin dibatalkan, lalu klik tombol "Ajukan Pembatalan". Pembatalan dapat dilakukan hingga 2 jam sebelum keberangkatan. Refund akan diproses dalam 3-5 hari kerja simulasi dengan potongan biaya administrasi.',
    },
    {
      question: 'Apakah saya bisa memilih kursi sendiri?',
      answer: 'Ya, Anda dapat memilih kursi favorit melalui peta kursi interaktif saat proses pemesanan. Kursi yang sudah dipesan oleh penumpang lain akan ditandai dan tidak dapat dipilih.',
    },
    {
      question: 'Bagaimana cara mendapatkan e-ticket?',
      answer: 'E-ticket akan tersedia setelah pembayaran berhasil dikonfirmasi. Anda dapat mengunduh e-ticket melalui halaman "Pesanan Saya" atau melalui email yang telah terdaftar. E-ticket berisi kode booking dan informasi perjalanan lengkap.',
    },
    {
      question: 'Apakah saya perlu membuat akun?',
      answer: 'Ya, Anda perlu membuat akun untuk melakukan pemesanan. Pendaftaran gratis dan mudah, cukup dengan email dan password. Dengan akun, Anda dapat melihat riwayat pemesanan dan mengelola booking dengan lebih mudah.',
    },
    {
      question: 'Bagaimana jika saya lupa password?',
      answer: 'Klik tombol "Lupa Password" di halaman login, masukkan email terdaftar, dan kami akan mengirimkan link reset password ke email Anda.',
    },
    {
      question: 'Apakah ada biaya tambahan selain harga tiket?',
      answer: 'Ya, terdapat biaya layanan sebesar Rp 5.000 per penumpang. Total yang dibayarkan adalah harga tiket + biaya layanan - diskon (jika ada kupon).',
    },
    {
      question: 'Bagaimana cara menggunakan kode promo?',
      answer: 'Masukkan kode promo pada halaman checkout sebelum melakukan pembayaran. Diskon akan otomatis diterapkan jika kode valid dan memenuhi syarat minimum pembelian.',
    },
    {
      question: 'Bagaimana jika jadwal perjalanan berubah?',
      answer: 'Perubahan jadwal dari operator akan diinformasikan melalui email dan notifikasi di aplikasi. Anda dapat mengajukan refund atau reschedule sesuai kebijakan yang berlaku. Ini adalah simulasi untuk demo platform.',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Pusat Bantuan
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Temukan jawaban untuk pertanyaan umum tentang JalanYuk
          </p>
          <div className="inline-block bg-yellow-400 text-yellow-900 text-sm font-semibold px-3 py-1 rounded-full mt-4">
            Data Simulasi
          </div>
        </div>

        {/* FAQ Section */}
        <div className="max-w-3xl mx-auto mb-12">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Pertanyaan yang Sering Diajukan
          </h2>
          
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden"
              >
                <button
                  onClick={() => setOpenIndex(openIndex === index ? null : index)}
                  className="w-full flex items-center justify-between p-6 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <span className="font-semibold text-gray-900 dark:text-white pr-4">
                    {faq.question}
                  </span>
                  {openIndex === index ? (
                    <ChevronUp className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  )}
                </button>
                
                {openIndex === index && (
                  <div className="px-6 pb-6">
                    <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                      {faq.answer}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Contact Support */}
        <div className="max-w-3xl mx-auto">
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-8 text-center">
            <Mail className="w-12 h-12 text-blue-600 dark:text-blue-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Masih Butuh Bantuan?
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Tim support kami siap membantu Anda 24/7 melalui email
            </p>
            <a
              href="mailto:support@jalanyuk.id"
              className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              <Mail className="w-5 h-5" />
              support@jalanyuk.id
            </a>
          </div>
        </div>

        {/* Additional Info */}
        <div className="max-w-3xl mx-auto mt-12 bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
          <h3 className="font-bold text-gray-900 dark:text-white mb-3">
            Catatan Penting
          </h3>
          <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
            <li className="flex items-start gap-2">
              <span className="text-blue-600 dark:text-blue-400 mt-0.5">•</span>
              <span>Semua data dan transaksi di platform ini bersifat simulasi untuk keperluan demo</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 dark:text-blue-400 mt-0.5">•</span>
              <span>Pembayaran tidak menggunakan uang sungguhan dan tidak akan diproses ke sistem pembayaran riil</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 dark:text-blue-400 mt-0.5">•</span>
              <span>E-ticket yang dihasilkan tidak dapat digunakan untuk perjalanan sebenarnya</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 dark:text-blue-400 mt-0.5">•</span>
              <span>Untuk akun demo, gunakan: demo@jalanyuk.id / demo123 (customer) atau admin@jalanyuk.id / admin123 (admin)</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
