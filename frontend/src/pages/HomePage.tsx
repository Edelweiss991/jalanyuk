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
    document.title = 'JalanYuk — Tiket Bus & Kereta Antarkota';
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
    { name: 'Jakarta', gradient: 'from-blue-500 to-cyan-500' },
    { name: 'Bandung', gradient: 'from-purple-500 to-pink-500' },
    { name: 'Yogyakarta', gradient: 'from-orange-500 to-red-500' },
    { name: 'Surabaya', gradient: 'from-green-500 to-teal-500' },
    { name: 'Solo', gradient: 'from-yellow-500 to-orange-500' },
    { name: 'Semarang', gradient: 'from-indigo-500 to-purple-500' },
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
      code: 'JALANYUK10',
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
      <section className="relative bg-gradient-to-br from-blue-600 to-blue-800 dark:from-blue-800 dark:to-blue-950 text-white py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Perjalanan Lebih Mudah, Tiket dalam Satu Genggaman
            </h1>
            <p className="text-xl md:text-2xl text-blue-100 mb-2">
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
            Keunggulan JalanYuk
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
                <div className={`aspect-square rounded-lg bg-gradient-to-br ${city.gradient} p-6 flex flex-col items-center justify-center text-white hover:scale-105 transition-transform`}>
                  <MapPin className="w-8 h-8 mb-2" />
                  <h3 className="text-lg font-semibold text-center">
                    {city.name}
                  </h3>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Popular Routes */}
      <section className="py-16 bg-white dark:bg-gray-900">
        <div className="container mx-auto px-4">
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
      <section className="py-16 bg-blue-600 dark:bg-blue-800 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Siap Memulai Perjalanan Anda?
          </h2>
          <p className="text-xl mb-8 text-blue-100">
            Pesan tiket sekarang dan nikmati kemudahan perjalanan bersama JalanYuk
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
