import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {/* Bantuan */}
          <div>
            <h3 className="mb-4 text-sm font-semibold text-gray-900 dark:text-white">Bantuan</h3>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <li>
                <Link to="/bantuan" className="hover:text-indigo-600 dark:hover:text-indigo-400">
                  Pusat Bantuan
                </Link>
              </li>
              <li>
                <Link to="/bantuan#faq" className="hover:text-indigo-600 dark:hover:text-indigo-400">
                  FAQ
                </Link>
              </li>
              <li>
                <Link to="/bantuan#cara-pesan" className="hover:text-indigo-600 dark:hover:text-indigo-400">
                  Cara Pesan Tiket
                </Link>
              </li>
            </ul>
          </div>

          {/* Kebijakan */}
          <div>
            <h3 className="mb-4 text-sm font-semibold text-gray-900 dark:text-white">Kebijakan</h3>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <li>
                <Link to="/kebijakan-privasi" className="hover:text-indigo-600 dark:hover:text-indigo-400">
                  Kebijakan Privasi
                </Link>
              </li>
              <li>
                <Link to="/syarat-ketentuan" className="hover:text-indigo-600 dark:hover:text-indigo-400">
                  Syarat & Ketentuan
                </Link>
              </li>
              <li>
                <Link to="/kebijakan-pembatalan" className="hover:text-indigo-600 dark:hover:text-indigo-400">
                  Kebijakan Pembatalan
                </Link>
              </li>
            </ul>
          </div>

          {/* Kontak */}
          <div>
            <h3 className="mb-4 text-sm font-semibold text-gray-900 dark:text-white">Kontak</h3>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                <a href="mailto:info@ayora.id" className="hover:text-indigo-600 dark:hover:text-indigo-400">
                  info@ayora.id
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                <a href="tel:+622112345678" className="hover:text-indigo-600 dark:hover:text-indigo-400">
                  +62 21 1234 5678
                </a>
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="h-4 w-4 mt-0.5" />
                <span>Jakarta, Indonesia</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t border-gray-200 pt-8 dark:border-gray-700">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              © 2026 AYORA. All rights reserved.
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-500">
              Data Simulasi — bukan layanan operator resmi
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-500">
              Foto: kontributor Wikimedia Commons (CC BY / CC BY-SA)
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
