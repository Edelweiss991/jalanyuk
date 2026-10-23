import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User,
  Mail,
  Phone,
  Calendar,
  Clock,
  Bus,
  Train,
  ChevronRight,
  Edit2,
  Check,
  X,
  Loader2,
  LogOut,
  Ticket,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { bookingApi } from '../services/api';
import { extractBookingList } from '../lib/bookingShape';
import { useToast } from '../components/ui';

export default function DashboardPage() {
  const { addToast } = useToast();
  const navigate = useNavigate();
  const { user, logout, updateUser } = useAuth();

  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    fullName: user?.profile?.fullName || '',
    phone: user?.profile?.phone || '',
  });
  const [isUpdating, setIsUpdating] = useState(false);

  const [upcomingBookings, setUpcomingBookings] = useState<any[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(true);
  const [stats, setStats] = useState({
    totalBookings: 0,
    upcomingTrips: 0,
  });

  useEffect(() => {
    loadUpcomingBookings();
  }, []);

  const loadUpcomingBookings = async () => {
    try {
      setLoadingBookings(true);
      const bookings = extractBookingList(await bookingApi.mine(1, 50));

      // Filter upcoming bookings (CONFIRMED status and future departure)
      const now = new Date();
      const upcoming = bookings
        .filter((b: any) => {
          if (b.bookingStatus !== 'CONFIRMED') return false;

          const departureTime = b.routeInfo?.departureTime;
          if (!departureTime) return false;

          return new Date(departureTime) > now;
        })
        .sort((a: any, b: any) => {
          const aTime = new Date(a.routeInfo?.departureTime || 0);
          const bTime = new Date(b.routeInfo?.departureTime || 0);
          return aTime.getTime() - bTime.getTime();
        })
        .slice(0, 3);

      setUpcomingBookings(upcoming);
      setStats({
        totalBookings: bookings.length,
        upcomingTrips: upcoming.length,
      });
    } catch (error) {
      console.error('Failed to load bookings:', error);
    } finally {
      setLoadingBookings(false);
    }
  };

  const handleEdit = () => {
    setEditForm({
      fullName: user?.profile?.fullName || '',
      phone: user?.profile?.phone || '',
    });
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditForm({
      fullName: user?.profile?.fullName || '',
      phone: user?.profile?.phone || '',
    });
  };

  const handleSaveEdit = async () => {
    if (!editForm.fullName.trim()) {
      addToast('error', 'Nama tidak boleh kosong');
      return;
    }

    if (!editForm.phone.trim()) {
      addToast('error', 'Nomor telepon tidak boleh kosong');
      return;
    }

    if (!/^\d{9,15}$/.test(editForm.phone.replace(/[\s-]/g, ''))) {
      addToast('error', 'Nomor telepon harus 9-15 digit angka');
      return;
    }

    setIsUpdating(true);

    try {
      await updateUser({ fullName: editForm.fullName.trim(), phone: editForm.phone.replace(/[\s-]/g, '') });
      addToast('success', 'Profil berhasil diperbarui');
      setIsEditing(false);
    } catch (error: any) {
      addToast('error', error.message || 'Gagal memperbarui profil');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleLogout = () => {
    logout();
    addToast('success', 'Anda telah keluar');
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Selamat datang kembali, {user?.profile?.fullName}!
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 border border-red-300 dark:border-red-700 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span className="font-medium">Keluar</span>
            </button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                  <Ticket className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Pesanan</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalBookings}</p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Perjalanan Mendatang</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.upcomingTrips}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Profile Card */}
            <div className="lg:col-span-1">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">Profil Saya</h2>
                  {!isEditing && (
                    <button
                      onClick={handleEdit}
                      className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                    >
                      <Edit2 className="w-5 h-5" />
                    </button>
                  )}
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                      <User className="w-4 h-4" />
                      Nama Lengkap
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editForm.fullName}
                        onChange={e => setEditForm(prev => ({ ...prev, fullName: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        disabled={isUpdating}
                      />
                    ) : (
                      <p className="text-gray-900 dark:text-white font-medium">{user?.profile?.fullName}</p>
                    )}
                  </div>

                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                      <Mail className="w-4 h-4" />
                      Email
                    </label>
                    <p className="text-gray-900 dark:text-white font-medium">{user?.email}</p>
                  </div>

                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                      <Phone className="w-4 h-4" />
                      Nomor Telepon
                    </label>
                    {isEditing ? (
                      <input
                        type="tel"
                        value={editForm.phone}
                        onChange={e => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        disabled={isUpdating}
                      />
                    ) : (
                      <p className="text-gray-900 dark:text-white font-medium">{user?.profile?.phone}</p>
                    )}
                  </div>

                  {isEditing && (
                    <div className="flex gap-2 pt-4">
                      <button
                        onClick={handleSaveEdit}
                        disabled={isUpdating}
                        className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white py-2 rounded-lg flex items-center justify-center gap-2"
                      >
                        {isUpdating ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Check className="w-4 h-4" />
                        )}
                        <span>Simpan</span>
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        disabled={isUpdating}
                        className="flex-1 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white py-2 rounded-lg flex items-center justify-center gap-2"
                      >
                        <X className="w-4 h-4" />
                        <span>Batal</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Upcoming Trips */}
            <div className="lg:col-span-2">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">Perjalanan Mendatang</h2>
                  <button
                    onClick={() => navigate('/my-bookings')}
                    className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium flex items-center gap-1"
                  >
                    Lihat Semua
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                {loadingBookings ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                  </div>
                ) : upcomingBookings.length === 0 ? (
                  <div className="text-center py-12">
                    <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-gray-400 mb-2">Belum ada perjalanan mendatang</p>
                    <button
                      onClick={() => navigate('/')}
                      className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium"
                    >
                      Pesan Tiket Sekarang
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {upcomingBookings.map(booking => {
                      const item = booking.routeInfo;
                      if (!item) return null;

                      const Icon = booking.transportType === 'BUS' ? Bus : Train;
                      const departureDate = new Date(item.departureTime);

                      return (
                        <div
                          key={booking.id}
                          onClick={() => navigate(`/my-bookings/${booking.id}`)}
                          className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-md transition-all cursor-pointer"
                        >
                          <div className="flex items-start gap-4">
                            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center flex-shrink-0">
                              <Icon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2 mb-2">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 text-gray-900 dark:text-white font-semibold mb-1">
                                    <span className="truncate">{item.originName}</span>
                                    <span className="text-gray-400">→</span>
                                    <span className="truncate">{item.destinationName}</span>
                                  </div>
                                  <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
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
                                </div>
                                <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
                              </div>
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-600 dark:text-gray-400">
                                  Kode: <span className="font-mono font-semibold">{booking.bookingCode}</span>
                                </span>
                                <span className="text-gray-900 dark:text-white font-semibold">
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

          {/* Footer */}
          <div className="text-center text-sm text-gray-500 dark:text-gray-500 py-6">
            © 2026 JalanYuk. All rights reserved.
          </div>
        </div>
      </div>
    </div>
  );
}
