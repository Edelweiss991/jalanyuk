import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Bus,
  Train,
  MapPin,
  Clock,
  Calendar,
  Users,
  CreditCard,
  Tag,
  AlertCircle,
  Check,
  Loader2,
  CheckCircle2,
  XCircle,
  Timer,
} from 'lucide-react';
import { bookingApi, busApi, trainApi } from '../services/api';
import { useToast } from '../components/ui';

interface PassengerForm {
  fullName: string;
  identityNumber: string;
  phone: string;
  email: string;
}

type PaymentMethod = 'QRIS' | 'VIRTUAL_ACCOUNT' | 'E_WALLET' | 'CARD';

const PAYMENT_METHOD_MAP: Record<PaymentMethod, string> = {
  QRIS: 'SIMULATION_QRIS',
  VIRTUAL_ACCOUNT: 'SIMULATION_VA',
  E_WALLET: 'SIMULATION_EWALLET',
  CARD: 'SIMULATION_CARD',
};

const PAYMENT_METHODS: { value: PaymentMethod; label: string }[] = [
  { value: 'QRIS', label: 'QRIS (Pembayaran Simulasi)' },
  { value: 'VIRTUAL_ACCOUNT', label: 'Virtual Account (Pembayaran Simulasi)' },
  { value: 'E_WALLET', label: 'E-Wallet (Pembayaran Simulasi)' },
  { value: 'CARD', label: 'Kartu Kredit/Debit (Pembayaran Simulasi)' },
];

const SERVICE_FEE_PER_PASSENGER = 5000;

// Mirror of the server-side coupon definitions (backend seed + validateCoupon).
// Keep these in sync with the backend or the displayed total will differ
// from what the server actually charges.
const COUPONS = [
  { code: 'AYORA10', type: 'PERCENT' as const, value: 0.1, maxDiscount: 50000, minTransaction: 100000, description: 'Diskon 10% min. Rp100.000 (maks. Rp50.000)' },
  { code: 'HEMAT20', type: 'PERCENT' as const, value: 0.2, maxDiscount: 100000, minTransaction: 300000, description: 'Diskon 20% min. Rp300.000 (maks. Rp100.000)' },
  { code: 'NEWUSER', type: 'FIXED' as const, value: 25000, maxDiscount: null as number | null, minTransaction: 75000, description: 'Potongan Rp25.000 min. Rp75.000 untuk pengguna baru' },
];

export default function CheckoutPage() {
  const { addToast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const transportType = searchParams.get('transportType') as 'BUS' | 'TRAIN' | null;
  const scheduleId = searchParams.get('scheduleId');
  const seatsParam = searchParams.get('seats');
  const passengersParam = searchParams.get('passengers');

  const seats = seatsParam ? seatsParam.split(',') : [];
  const passengerCount = passengersParam ? parseInt(passengersParam, 10) : seats.length;

  const [schedule, setSchedule] = useState<any>(null);
  const [loadingSchedule, setLoadingSchedule] = useState(true);
  const [scheduleError, setScheduleError] = useState('');

  const [passengers, setPassengers] = useState<PassengerForm[]>(
    Array.from({ length: passengerCount }, () => ({
      fullName: '',
      identityNumber: '',
      phone: '',
      email: '',
    }))
  );

  const [passengerErrors, setPassengerErrors] = useState<Record<number, Record<string, string>>>({});

  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<typeof COUPONS[0] | null>(null);
  const [checkingCoupon, setCheckingCoupon] = useState(false);

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('QRIS');
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const [isCreatingBooking, setIsCreatingBooking] = useState(false);
  const [idempotencyKey] = useState(() => crypto.randomUUID());

  const [booking, setBooking] = useState<any>(null);
  const [isSimulatingPayment, setIsSimulatingPayment] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);

  // Load schedule
  useEffect(() => {
    if (!transportType || !scheduleId) {
      setScheduleError('Parameter tidak lengkap');
      setLoadingSchedule(false);
      return;
    }

    const loadSchedule = async () => {
      try {
        setLoadingSchedule(true);
        if (transportType === 'BUS') {
          const data = await busApi.getSchedule(scheduleId);
          setSchedule((data as any).schedule ?? data);
        } else if (transportType === 'TRAIN') {
          const data = await trainApi.getSchedule(scheduleId);
          setSchedule((data as any).schedule ?? data);
        }
      } catch (error: any) {
        setScheduleError(error.response?.data?.error?.message || 'Gagal memuat jadwal');
        addToast('error', 'Gagal memuat jadwal');
      } finally {
        setLoadingSchedule(false);
      }
    };

    loadSchedule();
  }, [transportType, scheduleId]);

  // Countdown timer
  useEffect(() => {
    if (!booking?.expiresAt) return;

    const updateTimer = () => {
      const now = new Date().getTime();
      const expires = new Date(booking.expiresAt).getTime();
      const diff = expires - now;

      if (diff <= 0) {
        setTimeRemaining(0);
      } else {
        setTimeRemaining(Math.floor(diff / 1000));
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [booking?.expiresAt]);

  // Calculate pricing
  const pricing = useMemo(() => {
    if (!schedule) return null;

    const pricePerSeat = schedule.price || 0;
    const subtotal = pricePerSeat * seats.length;
    const serviceFee = SERVICE_FEE_PER_PASSENGER * passengerCount;

    let discount = 0;
    if (appliedCoupon && subtotal >= appliedCoupon.minTransaction) {
      if (appliedCoupon.type === 'PERCENT') {
        discount = Math.floor(subtotal * appliedCoupon.value);
        if (appliedCoupon.maxDiscount != null) {
          discount = Math.min(discount, appliedCoupon.maxDiscount);
        }
      } else {
        discount = Math.min(appliedCoupon.value, subtotal);
      }
    }

    const total = subtotal + serviceFee - discount;

    return {
      pricePerSeat,
      subtotal,
      serviceFee,
      discount,
      total,
    };
  }, [schedule, seats.length, passengerCount, appliedCoupon]);

  const validatePassenger = (index: number) => {
    const passenger = passengers[index];
    const errors: Record<string, string> = {};

    if (!passenger.fullName.trim()) {
      errors.fullName = 'Nama lengkap wajib diisi';
    } else if (passenger.fullName.trim().length < 3) {
      errors.fullName = 'Nama minimal 3 karakter';
    }

    if (passenger.phone && !/^\d{9,15}$/.test(passenger.phone.replace(/[\s-]/g, ''))) {
      errors.phone = 'Nomor telepon harus 9-15 digit angka';
    }

    if (!passenger.phone.trim()) {
      errors.phone = 'Nomor telepon wajib diisi';
    }

    if (!passenger.email.trim()) {
      errors.email = 'Email wajib diisi';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(passenger.email)) {
      errors.email = 'Format email tidak valid';
    }

    return errors;
  };

  const validateAllPassengers = () => {
    const allErrors: Record<number, Record<string, string>> = {};
    let hasError = false;

    passengers.forEach((_, index) => {
      const errors = validatePassenger(index);
      if (Object.keys(errors).length > 0) {
        allErrors[index] = errors;
        hasError = true;
      }
    });

    setPassengerErrors(allErrors);
    return !hasError;
  };

  const handlePassengerChange = (index: number, field: keyof PassengerForm, value: string) => {
    setPassengers(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });

    // Clear error for this field
    if (passengerErrors[index]?.[field]) {
      setPassengerErrors(prev => {
        const updated = { ...prev };
        if (updated[index]) {
          const fieldErrors = { ...updated[index] };
          delete fieldErrors[field];
          if (Object.keys(fieldErrors).length === 0) {
            delete updated[index];
          } else {
            updated[index] = fieldErrors;
          }
        }
        return updated;
      });
    }
  };

  const handleCheckCoupon = () => {
    if (!couponCode.trim()) {
      addToast('error', 'Masukkan kode kupon');
      return;
    }

    if (!pricing) return;

    setCheckingCoupon(true);

    setTimeout(() => {
      const found = COUPONS.find(c => c.code === couponCode.toUpperCase());

      if (!found) {
        addToast('error', 'Kode kupon tidak valid');
        setAppliedCoupon(null);
      } else if (pricing.subtotal < found.minTransaction) {
        addToast('error', `Minimal transaksi Rp${found.minTransaction.toLocaleString('id-ID')} untuk kupon ini`);
        setAppliedCoupon(null);
      } else {
        addToast('success', `Kupon diterapkan: ${found.description}`);
        setAppliedCoupon(found);
      }

      setCheckingCoupon(false);
    }, 500);
  };

  const handleCreateBooking = async () => {
    if (!validateAllPassengers()) {
      addToast('error', 'Mohon lengkapi data penumpang dengan benar');
      return;
    }

    if (!agreedToTerms) {
      addToast('error', 'Anda harus menyetujui syarat dan ketentuan');
      return;
    }

    setIsCreatingBooking(true);

    try {
      const bookingData = {
        transportType: transportType!,
        scheduleId: scheduleId!,
        seatNumbers: seats,
        passengers: passengers.map((p, idx) => ({
          fullName: p.fullName.trim(),
          identityNumber: p.identityNumber.trim() || undefined,
          phone: p.phone.replace(/[\s-]/g, ''),
          email: p.email.trim(),
          seatNumber: seats[idx],
        })),
        paymentMethod: PAYMENT_METHOD_MAP[paymentMethod],
        couponCode: appliedCoupon?.code,
      };

      const result = await bookingApi.create(bookingData, idempotencyKey);
      setBooking(result);
      addToast('success', 'Pesanan berhasil dibuat');
    } catch (error: any) {
      const message = error.message || 'Gagal membuat pesanan';
      addToast('error', message);
    } finally {
      setIsCreatingBooking(false);
    }
  };

  const handleSimulatePayment = async (status: 'PAID' | 'FAILED' | 'EXPIRED') => {
    if (!booking) return;

    setIsSimulatingPayment(true);

    try {
      const result = await bookingApi.simulatePayment(booking.id, status);
      setBooking(result);

      if (status === 'PAID') {
        addToast('success', 'Pembayaran berhasil!');
      } else if (status === 'FAILED') {
        addToast('error', 'Pembayaran gagal');
      } else {
        addToast('error', 'Pembayaran kedaluwarsa');
      }
    } catch (error: any) {
      addToast('error', error.response?.data?.error?.message || 'Simulasi pembayaran gagal');
    } finally {
      setIsSimulatingPayment(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!transportType || !scheduleId || seats.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Parameter Tidak Lengkap</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Data pemesanan tidak lengkap. Silakan kembali ke halaman pencarian.
          </p>
          <button
            onClick={() => navigate('/')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg"
          >
            Kembali ke Beranda
          </button>
        </div>
      </div>
    );
  }

  if (loadingSchedule) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Memuat jadwal...</p>
        </div>
      </div>
    );
  }

  if (scheduleError || !schedule) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Jadwal Tidak Ditemukan</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">{scheduleError}</p>
          <button
            onClick={() => navigate('/')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg"
          >
            Kembali ke Beranda
          </button>
        </div>
      </div>
    );
  }

  const Icon = transportType === 'BUS' ? Bus : Train;
  const origin = transportType === 'BUS' ? schedule.route?.origin?.name : schedule.route?.originStation?.name;
  const destination = transportType === 'BUS' ? schedule.route?.destination?.name : schedule.route?.destinationStation?.name;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center flex-shrink-0">
              <Icon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Detail Pemesanan</h1>
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 mb-1">
                <MapPin className="w-4 h-4" />
                <span className="font-medium">{origin}</span>
                <span>→</span>
                <span className="font-medium">{destination}</span>
              </div>
              <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-500">
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  <span>{new Date(schedule.departureTime).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  <span>{new Date(schedule.departureTime).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  <span>{passengerCount} Penumpang</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {!booking ? (
          <>
            {/* Passenger Forms */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Data Penumpang</h2>
              <div className="space-y-6">
                {passengers.map((passenger, index) => (
                  <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
                      Penumpang {index + 1} - Kursi {seats[index]}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Nama Lengkap <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={passenger.fullName}
                          onChange={e => handlePassengerChange(index, 'fullName', e.target.value)}
                          className={`w-full px-3 py-2 border ${
                            passengerErrors[index]?.fullName
                              ? 'border-red-300 dark:border-red-700'
                              : 'border-gray-300 dark:border-gray-600'
                          } rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
                          placeholder="Nama sesuai identitas"
                        />
                        {passengerErrors[index]?.fullName && (
                          <p className="mt-1 text-sm text-red-600 dark:text-red-400">{passengerErrors[index].fullName}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          No. Identitas (KTP/Paspor)
                        </label>
                        <input
                          type="text"
                          value={passenger.identityNumber}
                          onChange={e => handlePassengerChange(index, 'identityNumber', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          placeholder="Opsional"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Nomor Telepon <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="tel"
                          value={passenger.phone}
                          onChange={e => handlePassengerChange(index, 'phone', e.target.value)}
                          className={`w-full px-3 py-2 border ${
                            passengerErrors[index]?.phone
                              ? 'border-red-300 dark:border-red-700'
                              : 'border-gray-300 dark:border-gray-600'
                          } rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
                          placeholder="08xxxxxxxxxx"
                        />
                        {passengerErrors[index]?.phone && (
                          <p className="mt-1 text-sm text-red-600 dark:text-red-400">{passengerErrors[index].phone}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Email <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="email"
                          value={passenger.email}
                          onChange={e => handlePassengerChange(index, 'email', e.target.value)}
                          className={`w-full px-3 py-2 border ${
                            passengerErrors[index]?.email
                              ? 'border-red-300 dark:border-red-700'
                              : 'border-gray-300 dark:border-gray-600'
                          } rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
                          placeholder="email@example.com"
                        />
                        {passengerErrors[index]?.email && (
                          <p className="mt-1 text-sm text-red-600 dark:text-red-400">{passengerErrors[index].email}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Price Summary */}
            {pricing && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Rincian Harga</h2>
                <div className="space-y-3">
                  <div className="flex justify-between text-gray-600 dark:text-gray-400">
                    <span>
                      Harga Tiket ({seats.length} kursi × Rp{pricing.pricePerSeat.toLocaleString('id-ID')})
                    </span>
                    <span>Rp{pricing.subtotal.toLocaleString('id-ID')}</span>
                  </div>
                  <div className="flex justify-between text-gray-600 dark:text-gray-400">
                    <span>
                      Biaya Layanan ({passengerCount} penumpang × Rp{SERVICE_FEE_PER_PASSENGER.toLocaleString('id-ID')})
                    </span>
                    <span>Rp{pricing.serviceFee.toLocaleString('id-ID')}</span>
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-500 -mt-1">
                    * Estimasi biaya layanan (dihitung ulang oleh server)
                  </div>

                  {/* Coupon */}
                  <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Kode Kupon
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={couponCode}
                        onChange={e => setCouponCode(e.target.value.toUpperCase())}
                        className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        placeholder="Masukkan kode kupon"
                        disabled={checkingCoupon}
                      />
                      <button
                        onClick={handleCheckCoupon}
                        disabled={checkingCoupon || !couponCode.trim()}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg flex items-center gap-2"
                      >
                        {checkingCoupon ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Tag className="w-4 h-4" />
                        )}
                        <span>Cek</span>
                      </button>
                    </div>
                    {appliedCoupon && (
                      <div className="mt-2 text-sm text-green-600 dark:text-green-400 flex items-center gap-1">
                        <Check className="w-4 h-4" />
                        <span>{appliedCoupon.description}</span>
                      </div>
                    )}
                    <div className="mt-2 text-xs text-gray-500 dark:text-gray-500">
                      Kode tersedia: AYORA10, HEMAT20, NEWUSER (validasi final di server)
                    </div>
                  </div>

                  {appliedCoupon && pricing.discount > 0 && (
                    <div className="flex justify-between text-green-600 dark:text-green-400">
                      <span>Diskon Kupon ({appliedCoupon.code})</span>
                      <span>- Rp{pricing.discount.toLocaleString('id-ID')}</span>
                    </div>
                  )}

                  <div className="pt-3 border-t border-gray-200 dark:border-gray-700 flex justify-between text-lg font-bold text-gray-900 dark:text-white">
                    <span>Total</span>
                    <span>Rp{pricing.total.toLocaleString('id-ID')}</span>
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-500 -mt-1">
                    * Total akhir dihitung ulang oleh server
                  </div>
                </div>
              </div>
            )}

            {/* Payment Method */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Metode Pembayaran</h2>
              <div className="space-y-3">
                {PAYMENT_METHODS.map(method => (
                  <label
                    key={method.value}
                    className={`flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                      paymentMethod === method.value
                        ? 'border-blue-600 dark:border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value={method.value}
                      checked={paymentMethod === method.value}
                      onChange={e => setPaymentMethod(e.target.value as PaymentMethod)}
                      className="w-4 h-4"
                    />
                    <CreditCard className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    <span className="flex-1 text-gray-900 dark:text-white">{method.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Terms */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreedToTerms}
                  onChange={e => setAgreedToTerms(e.target.checked)}
                  className="w-5 h-5 mt-0.5"
                />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Saya menyetujui{' '}
                  <a href="/bantuan" className="text-blue-600 hover:text-blue-700 dark:text-blue-400">
                    syarat dan ketentuan
                  </a>{' '}
                  yang berlaku
                </span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              onClick={handleCreateBooking}
              disabled={isCreatingBooking || !agreedToTerms}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-4 rounded-xl flex items-center justify-center gap-2"
            >
              {isCreatingBooking ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Memproses Pesanan...</span>
                </>
              ) : (
                <>
                  <CreditCard className="w-5 h-5" />
                  <span>Buat Pesanan</span>
                </>
              )}
            </button>
          </>
        ) : (
          /* Payment Simulation Panel */
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Pesanan Berhasil Dibuat</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-1">Kode Booking: <span className="font-mono font-bold">{booking.code}</span></p>
              {timeRemaining !== null && timeRemaining > 0 && (
                <div className="flex items-center justify-center gap-2 text-orange-600 dark:text-orange-400 mt-3">
                  <Timer className="w-5 h-5" />
                  <span className="font-semibold">Sisa Waktu: {formatTime(timeRemaining)}</span>
                </div>
              )}
              {timeRemaining === 0 && (
                <div className="text-red-600 dark:text-red-400 mt-3 font-semibold">
                  Waktu pembayaran habis
                </div>
              )}
            </div>

            {booking.paymentStatus === 'PENDING' && (
              <div className="space-y-4">
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                  <p className="text-sm text-yellow-800 dark:text-yellow-200 text-center">
                    <strong>Pembayaran Simulasi</strong> — Pilih skenario untuk melanjutkan
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <button
                    onClick={() => handleSimulatePayment('PAID')}
                    disabled={isSimulatingPayment || timeRemaining === 0}
                    className="flex flex-col items-center gap-2 p-4 border-2 border-green-300 dark:border-green-700 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/20 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-400" />
                    <span className="font-semibold text-gray-900 dark:text-white">Bayar Berhasil</span>
                  </button>

                  <button
                    onClick={() => handleSimulatePayment('FAILED')}
                    disabled={isSimulatingPayment || timeRemaining === 0}
                    className="flex flex-col items-center gap-2 p-4 border-2 border-red-300 dark:border-red-700 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <XCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
                    <span className="font-semibold text-gray-900 dark:text-white">Bayar Gagal</span>
                  </button>

                  <button
                    onClick={() => handleSimulatePayment('EXPIRED')}
                    disabled={isSimulatingPayment}
                    className="flex flex-col items-center gap-2 p-4 border-2 border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900/20 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Timer className="w-8 h-8 text-gray-600 dark:text-gray-400" />
                    <span className="font-semibold text-gray-900 dark:text-white">Kedaluwarsa</span>
                  </button>
                </div>
              </div>
            )}

            {booking.paymentStatus === 'PAID' && (
              <div className="space-y-4">
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6 text-center">
                  <CheckCircle2 className="w-16 h-16 text-green-600 dark:text-green-400 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-green-900 dark:text-green-100 mb-2">Pembayaran Berhasil!</h3>
                  <p className="text-green-800 dark:text-green-200 mb-4">Pesanan Anda telah dikonfirmasi</p>
                  <p className="text-sm text-green-700 dark:text-green-300 mb-6">
                    Kode Booking: <span className="font-mono font-bold text-lg">{booking.code}</span>
                  </p>
                  <button
                    onClick={() => navigate(`/my-bookings/${booking.id}`)}
                    className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold"
                  >
                    Lihat E-Ticket
                  </button>
                </div>
              </div>
            )}

            {booking.paymentStatus === 'FAILED' && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 text-center">
                <XCircle className="w-16 h-16 text-red-600 dark:text-red-400 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-red-900 dark:text-red-100 mb-2">Pembayaran Gagal</h3>
                <p className="text-red-800 dark:text-red-200 mb-4">Silakan coba lagi atau gunakan metode lain</p>
                <button
                  onClick={() => handleSimulatePayment('PAID')}
                  disabled={isSimulatingPayment}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold"
                >
                  Coba Bayar Lagi
                </button>
              </div>
            )}

            {booking.paymentStatus === 'EXPIRED' && (
              <div className="bg-gray-50 dark:bg-gray-900/20 border border-gray-200 dark:border-gray-700 rounded-lg p-6 text-center">
                <Timer className="w-16 h-16 text-gray-600 dark:text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Pembayaran Kedaluwarsa</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">Waktu pembayaran telah habis</p>
                <button
                  onClick={() => navigate('/')}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold"
                >
                  Buat Pesanan Baru
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
