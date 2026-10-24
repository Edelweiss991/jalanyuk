import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, BadgePercent, Armchair, Headphones, ArrowRight, MapPin, Bus, Train, ChevronRight } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { searchApi } from '../services/api';
import SearchWidget from '../components/SearchWidget';

// Popular-route entries look like "Jakarta - Bandung". Build a real search
// URL from them (tomorrow, so results are reliably available) instead of the
// old ?route= link that the search page never understood.
function routeSearchUrl(type: 'bus' | 'kereta', route: string): string {
  const [origin = '', destination = ''] = route.split(' - ').map((s) => s.trim());
  const d = new Date();
  d.setDate(d.getDate() + 1);
  const date = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  return `/${type}/search?origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}&date=${date}&passengers=1`;
}

export default function HomePage() {
  useEffect(() => {
    document.title = 'AYORA — Tiket Bus & Kereta Antarkota';
  }, []);

  const { data: popularData } = useQuery({
    queryKey: ['popular-routes'],
    queryFn: () => searchApi.popular(),
  });

  const popularBusRoutes: string[] = popularData?.busRoutes?.length
    ? popularData.busRoutes.map((r) => `${r.origin} - ${r.destination}`)
    : [
        'Jakarta - Bandung',
        'Jakarta - Yogyakarta',
        'Surabaya - Malang',
        'Bandung - Surabaya',
      ];

  const popularTrainRoutes: string[] = popularData?.trainRoutes?.length
    ? popularData.trainRoutes.map((r) => `${r.origin} - ${r.destination}`)
    : [
        'Jakarta - Bandung',
        'Jakarta - Surabaya',
        'Bandung - Yogyakarta',
        'Surabaya - Yogyakarta',
      ];

  const cities = [
    { name: 'Jakarta', landmark: 'Monas', image: '/images/photos/jakarta.jpg' },
    { name: 'Bandung', landmark: 'Gedung Sate', image: '/images/photos/bandung.jpg' },
    { name: 'Yogyakarta', landmark: 'Tugu Yogyakarta', image: '/images/photos/yogyakarta.jpg' },
    { name: 'Surabaya', landmark: 'Patung Suro & Boyo', image: '/images/photos/surabaya.jpg' },
    { name: 'Solo', landmark: 'Keraton Surakarta', image: '/images/photos/solo.jpg' },
    { name: 'Semarang', landmark: 'Lawang Sewu', image: '/images/photos/semarang.jpg' },
  ];

  const features = [
    {
      icon: ShieldCheck,
      title: 'Pembayaran Simulasi Aman',
      description: 'Sistem pembayaran dengan enkripsi standar untuk demo platform',
    },
    {
      icon: BadgePercent,
      title: 'Harga Transparan',
      description: 'Tidak ada biaya tersembunyi, harga sudah termasuk semua komponen',
    },
    {
      icon: Armchair,
      title: 'Pilih Kursi Sendiri',
      description: 'Bebas memilih kursi favorit dengan peta kursi interaktif',
    },
    {
      icon: Headphones,
      title: 'Dukungan 24/7',
      description: 'Tim support siap membantu kapan saja melalui email',
    },
  ];

  const promos = [
    {
      code: 'AYORA10',
      discount: '10%',
      description: 'Diskon 10% untuk semua rute',
      minAmount: 'Min. Rp 100.000',
    },
    {
      code: 'HEMAT20',
      discount: '20%',
      description: 'Diskon 20% (maks. Rp 100.000)',
      minAmount: 'Min. Rp 300.000',
    },
    {
      code: 'NEWUSER',
      discount: 'Rp 25.000',
      description: 'Potongan untuk pengguna baru',
      minAmount: 'Min. Rp 75.000',
    },
  ];

  const steps = [
    {
      number: '1',
      title: 'Cari Jadwal',
      description: 'Pilih rute, tanggal, dan jumlah penumpang',
    },
    {
      number: '2',
      title: 'Pilih Kursi',
      description: 'Tentukan kursi favorit Anda',
    },
    {
      number: '3',
      title: 'Isi Data',
      description: 'Lengkapi informasi penumpang',
    },
    {
      number: '4',
      title: 'Bayar & Cetak',
      description: 'Lakukan pembayaran simulasi dan dapatkan e-ticket',
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative text-white py-20 overflow-hidden">
        <img
          src="/images/photos/hero.jpg"
          alt="Kereta Api Argo Bromo Anggrek melintasi persawahan hijau"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-blue-950/85 via-blue-900/70 to-blue-800/85" />
        <div className="relative container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 drop-shadow-lg">
              Perjalanan Lebih Mudah, Tiket dalam Satu Genggaman
            </h1>
            <p className="text-xl md:text-2xl text-blue-50 mb-2 drop-shadow">
              Pesan tiket bus dan kereta antarkota Indonesia dengan mudah
            </p>
            <div className="inline-block bg-yellow-400 text-yellow-900 text-sm font-semibold px-3 py-1 rounded-full">
              Data Simulasi
            </div>
          </div>

          <div className="max-w-4xl mx-auto">
            <SearchWidget />
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 bg-white dark:bg-gray-900">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-900 dark:text-white">
            Keunggulan AYORA
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="text-center p-6 rounded-lg hover:shadow-lg transition-shadow bg-gray-50 dark:bg-gray-800"
              >
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900 mb-4">
                  <feature.icon className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">
                  {feature.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Popular Destinations */}
      <section className="py-16 bg-gray-50 dark:bg-gray-800">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-900 dark:text-white">
            Destinasi Populer
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {cities.map((city, index) => (
              <div
                key={index}
                className="group cursor-pointer"
              >
                <div className="relative aspect-square rounded-lg overflow-hidden shadow-md hover:scale-105 transition-transform">
                  <img
                    src={city.image}
                    alt={`${city.landmark}, ${city.name}`}
                    loading="lazy"
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 via-black/30 to-transparent p-4 pt-10">
                    <h3 className="text-lg font-semibold text-white flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 flex-shrink-0" />
                      {city.name}
                    </h3>
                    <p className="text-xs text-white/85">{city.landmark}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Popular Routes */}
      <section className="py-16 bg-white dark:bg-gray-900">
        <div className="container mx-auto px-4">
          {/* Photo cards: Bus & Kereta */}
          <div className="grid md:grid-cols-2 gap-6 mb-12">
            <Link to="/bus" className="group relative block rounded-2xl overflow-hidden shadow-md h-60">
              <img
                src="/images/photos/bus.jpg"
                alt="Bus antarkota melintasi jalan berkabut di pagi hari"
                loading="lazy"
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
              <div className="absolute bottom-0 inset-x-0 p-5">
                <div className="flex items-center gap-2 text-white font-bold text-2xl">
                  <Bus className="w-7 h-7" /> Bus Antarkota
                </div>
                <p className="text-white/85 text-sm mt-1">
                  Ratusan jadwal bus setiap hari ke berbagai kota di Jawa, dari belasan operator terpercaya.
                </p>
                <span className="inline-flex items-center gap-1 text-sm font-semibold text-white mt-2">
                  Cari Tiket Bus <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </span>
              </div>
            </Link>
            <Link to="/kereta" className="group relative block rounded-2xl overflow-hidden shadow-md h-60">
              <img
                src="/images/photos/train.jpg"
                alt="Kereta api antarkota di stasiun"
                loading="lazy"
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
              <div className="absolute bottom-0 inset-x-0 p-5">
                <div className="flex items-center gap-2 text-white font-bold text-2xl">
                  <Train className="w-7 h-7" /> Kereta Api
                </div>
                <p className="text-white/85 text-sm mt-1">
                  Perjalanan tepat waktu antar stasiun utama di Jawa — eksekutif, bisnis, sampai ekonomi.
                </p>
                <span className="inline-flex items-center gap-1 text-sm font-semibold text-white mt-2">
                  Cari Tiket Kereta <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </span>
              </div>
            </Link>
          </div>

          <div className="grid md:grid-cols-2 gap-12">
            {/* Bus Routes */}
            <div>
              <div className="flex items-center gap-3 mb-6">
                <Bus className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Rute Bus Populer
                </h2>
              </div>
              <div className="space-y-3">
                {popularBusRoutes.slice(0, 6).map((route, index) => (
                  <Link
                    key={index}
                    to={routeSearchUrl('bus', route)}
                    className="flex items-center justify-between p-4 rounded-lg bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <span className="text-gray-900 dark:text-white font-medium">
                      {route}
                    </span>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </Link>
                ))}
              </div>
            </div>

            {/* Train Routes */}
            <div>
              <div className="flex items-center gap-3 mb-6">
                <Train className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Rute Kereta Populer
                </h2>
              </div>
              <div className="space-y-3">
                {popularTrainRoutes.slice(0, 6).map((route, index) => (
                  <Link
                    key={index}
                    to={routeSearchUrl('kereta', route)}
                    className="flex items-center justify-between p-4 rounded-lg bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <span className="text-gray-900 dark:text-white font-medium">
                      {route}
                    </span>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Promos */}
      <section className="py-16 bg-gradient-to-br from-purple-600 to-pink-600 dark:from-purple-800 dark:to-pink-800 text-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">
            Promo Spesial
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {promos.map((promo, index) => (
              <div
                key={index}
                className="bg-white/10 backdrop-blur-sm rounded-lg p-6 hover:bg-white/20 transition-colors"
              >
                <div className="text-3xl font-bold mb-2">{promo.discount}</div>
                <div className="text-xl font-semibold mb-2 bg-white/20 px-3 py-1 rounded inline-block">
                  {promo.code}
                </div>
                <p className="text-white/90 mb-2">{promo.description}</p>
                <p className="text-sm text-white/70">{promo.minAmount}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How to Book */}
      <section className="py-16 bg-white dark:bg-gray-900">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-900 dark:text-white">
            Cara Pemesanan
          </h2>
          <div className="grid md:grid-cols-4 gap-8">
            {steps.map((step, index) => (
              <div key={index} className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-600 text-white text-2xl font-bold mb-4">
                  {step.number}
                </div>
                <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">
                  {step.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative py-16 text-white overflow-hidden">
        <img
          src="/images/photos/bus.jpg"
          alt=""
          aria-hidden="true"
          loading="lazy"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-blue-950/70" />
        <div className="relative container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Siap Memulai Perjalanan Anda?
          </h2>
          <p className="text-xl mb-8 text-blue-100">
            Pesan tiket sekarang dan nikmati kemudahan perjalanan bersama AYORA
          </p>
          <Link
            to="/bus"
            className="inline-flex items-center gap-2 bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
          >
            Mulai Pesan Tiket
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>
    </div>
  );
}
