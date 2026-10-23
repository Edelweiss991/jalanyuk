import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bus,
  Train,
  Calendar,
  Clock,
  MapPin,
  ChevronRight,
  Filter,
  Loader2,
  Package,
} from 'lucide-react';
import { bookingApi } from '../services/api';
import { extractBookingList } from '../lib/bookingShape';

type TransportFilter = 'ALL' | 'BUS' | 'TRAIN';
type StatusFilter = 'ALL' | 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED' | 'EXPIRED';

const TRANSPORT_FILTERS: { value: TransportFilter; label: string }[] = [
  { value: 'ALL', label: 'Semua' },
  { value: 'BUS', label: 'Bus' },
  { value: 'TRAIN', label: 'Kereta' },
];

const STATUS_FILTERS: { value: StatusFilter; label: string }[] = [
  { value: 'ALL', label: 'Semua Status' },
  { value: 'PENDING', label: 'Menunggu' },
  { value: 'CONFIRMED', label: 'Dikonfirmasi' },
  { value: 'COMPLETED', label: 'Selesai' },
  { value: 'CANCELLED', label: 'Dibatalkan' },
  { value: 'EXPIRED', label: 'Kedaluwarsa' },
];

const BOOKING_STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  PENDING: { label: 'Menunggu', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400' },
  CONFIRMED: { label: 'Dikonfirmasi', color: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' },
  CANCELLED: { label: 'Dibatalkan', color: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400' },
  EXPIRED: { label: 'Kedaluwarsa', color: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400' },
  COMPLETED: { label: 'Selesai', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400' },
  REFUND_REQUESTED: { label: 'Refund Diminta', color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400' },
  REFUNDED: { label: 'Refund', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400' },
};

const PAYMENT_STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  PENDING: { label: 'Belum Dibayar', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400' },
  PAID: { label: 'Dibayar', color: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' },
  FAILED: { label: 'Gagal', color: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400' },
  EXPIRED: { label: 'Kedaluwarsa', color: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400' },
  REFUND_PENDING: { label: 'Proses Refund', color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400' },
  REFUNDED: { label: 'Refund', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400' },
};

export default function MyBookingsPage() {
  const navigate = useNavigate();

  const [bookings, setBookings] = useState<any[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [transportFilter, setTransportFilter] = useState<TransportFilter>('ALL');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');

  useEffect(() => {
    loadBookings();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [bookings, transportFilter, statusFilter]);

  const loadBookings = async () => {
    try {
      setIsLoading(true);
      const data = await bookingApi.mine(1, 50);
      setBookings(extractBookingList(data));
    } catch (error) {
      console.error('Failed to load bookings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...bookings];

    if (transportFilter !== 'ALL') {
      filtered = filtered.filter(b => b.transportType === transportFilter);
    }

    if (statusFilter !== 'ALL') {
      filtered = filtered.filter(b => b.bookingStatus === statusFilter);
    }

    // Sort by created date, newest first
    filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    setFilteredBookings(filtered);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Memuat pesanan...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Pesanan Saya</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Kelola dan lihat riwayat pesanan Anda
            </p>
          </div>

          {/* Filters */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
            <div className="flex items-center gap-2 mb-4">
              <Filter className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Filter</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Transport Type Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Jenis Transportasi
                </label>
                <div className="flex gap-2">
                  {TRANSPORT_FILTERS.map(filter => (
                    <button
                      key={filter.value}
                      onClick={() => setTransportFilter(filter.value)}
                      className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                        transportFilter === filter.value
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Status Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Status
                </label>
                <select
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value as StatusFilter)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  {STATUS_FILTERS.map(filter => (
                    <option key={filter.value} value={filter.value}>
                      {filter.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Bookings List */}
          {filteredBookings.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-12 text-center">
              <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Tidak Ada Pesanan
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {bookings.length === 0
                  ? 'Anda belum memiliki pesanan'
                  : 'Tidak ada pesanan yang sesuai dengan filter'}
              </p>
              <button
                onClick={() => navigate('/')}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-semibold"
              >
                Pesan Tiket Sekarang
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredBookings.map(booking => {
                const item = booking.routeInfo;
                if (!item?.departureTime) return null;

                const Icon = booking.transportType === 'BUS' ? Bus : Train;
                const bookingStatusConfig = BOOKING_STATUS_CONFIG[booking.bookingStatus] || {
                  label: booking.bookingStatus,
                  color: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400',
                };
                const paymentStatusConfig = PAYMENT_STATUS_CONFIG[booking.paymentStatus] || {
                  label: booking.paymentStatus,
                  color: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400',
                };

                const departureDate = new Date(item.departureTime);

                return (
                  <div
                    key={booking.id}
                    onClick={() => navigate(`/my-bookings/${booking.id}`)}
                    className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Icon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4 mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-mono font-semibold text-gray-900 dark:text-white">
                                {booking.bookingCode}
                              </span>
                              <span
                                className={`px-2 py-0.5 rounded-full text-xs font-medium ${bookingStatusConfig.color}`}
                              >
                                {bookingStatusConfig.label}
                              </span>
                              <span
                                className={`px-2 py-0.5 rounded-full text-xs font-medium ${paymentStatusConfig.color}`}
                              >
                                {paymentStatusConfig.label}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-gray-900 dark:text-white font-medium">
                              <MapPin className="w-4 h-4 text-gray-400" />
                              <span className="truncate">{item.originName}</span>
                              <span className="text-gray-400">→</span>
                              <span className="truncate">{item.destinationName}</span>
                            </div>
                          </div>
                          <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
                        </div>

                        <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mb-3">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            <span>
                              {departureDate.toLocaleDateString('id-ID', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              })}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            <span>
                              {departureDate.toLocaleTimeString('id-ID', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {booking.items.length} kursi • {booking.passengers.length} penumpang
                          </span>
                          <span className="text-lg font-bold text-gray-900 dark:text-white">
                            Rp{booking.totalAmount.toLocaleString('id-ID')}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
