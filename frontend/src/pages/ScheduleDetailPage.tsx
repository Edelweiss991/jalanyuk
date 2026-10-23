import { useEffect, useState } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { 
  ArrowLeft, 
  Clock, 
  MapPin, 
  Info, 
  CheckCircle2,
  Briefcase,
  XCircle,
  Users
} from 'lucide-react';
import { scheduleApi, TransportType } from '../services/api';
import { formatTime, formatDuration } from '../lib/format';
import SeatMap from '../components/SeatMap';
import { useAuth } from '../context/AuthContext';

interface ScheduleDetailPageProps {
  transportType: TransportType;
  title: string;
}

export default function ScheduleDetailPage({ transportType, title }: ScheduleDetailPageProps) {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const passengersParam = parseInt(searchParams.get('passengers') || '1');
  const [passengers, setPassengers] = useState(passengersParam);
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);

  useEffect(() => {
    document.title = title;
  }, [title]);

  const { data: rawSchedule, isLoading, isError } = useQuery({
    queryKey: ['schedule', transportType, id],
    queryFn: () => scheduleApi.getDetail(transportType, id!),
    enabled: !!id,
  });

  // Normalize the nested API shape into the flat fields this page renders.
  const schedule: any = rawSchedule
    ? {
        ...rawSchedule,
        operator: rawSchedule.operator?.name ?? '-',
        vehicle: rawSchedule.vehicle?.name ?? '-',
        class: rawSchedule.vehicle?.className ?? '-',
        origin: rawSchedule.route?.origin?.name ?? rawSchedule.route?.origin?.city ?? '-',
        destination: rawSchedule.route?.destination?.name ?? rawSchedule.route?.destination?.city ?? '-',
        departureTime: formatTime(rawSchedule.departureTime),
        arrivalTime: formatTime(rawSchedule.arrivalTime),
        duration: formatDuration(rawSchedule.route?.durationMinutes ?? 0),
        availableSeats: rawSchedule.seatsLeft ?? 0,
        facilities: rawSchedule.vehicle?.facilities ?? [],
      }
    : undefined;

  const { data: seatsData } = useQuery({
    queryKey: ['seats', transportType, id],
    queryFn: () => scheduleApi.getSeats(transportType, id!),
    enabled: !!id,
  });

  useEffect(() => {
    if (selectedSeats.length > passengers) {
      setSelectedSeats(selectedSeats.slice(0, passengers));
    }
  }, [passengers, selectedSeats]);

  const handleSeatToggle = (seatNumber: string) => {
    if (selectedSeats.includes(seatNumber)) {
      setSelectedSeats(selectedSeats.filter(s => s !== seatNumber));
    } else if (selectedSeats.length < passengers) {
      setSelectedSeats([...selectedSeats, seatNumber]);
    }
  };

  const handleContinue = () => {
    if (selectedSeats.length !== passengers) {
      alert(`Silakan pilih ${passengers} kursi`);
      return;
    }

    if (!isAuthenticated) {
      const nextUrl = `/checkout?transportType=${transportType}&scheduleId=${id}&seats=${selectedSeats.join(',')}&passengers=${passengers}`;
      navigate(`/login?next=${encodeURIComponent(nextUrl)}`);
      return;
    }

    navigate(`/checkout?transportType=${transportType}&scheduleId=${id}&seats=${selectedSeats.join(',')}&passengers=${passengers}`);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
          <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded" />
          <div className="h-96 bg-gray-200 dark:bg-gray-700 rounded" />
        </div>
      </div>
    );
  }

  if (isError || !schedule) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-8 shadow text-center">
          <p className="text-red-600 dark:text-red-400 mb-4">
            Jadwal tidak ditemukan
          </p>
          <button
            onClick={() => navigate(-1)}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            Kembali
          </button>
        </div>
      </div>
    );
  }

  const pricePerSeat = schedule.price;
  const subtotal = pricePerSeat * selectedSeats.length;
  const serviceFee = 5000 * passengers;
  const total = subtotal + serviceFee;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          Kembali
        </button>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Schedule Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Info */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    {schedule.operator}
                  </h1>
                  <p className="text-gray-600 dark:text-gray-400">
                    {schedule.vehicle} • {schedule.class}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    Rp {pricePerSeat.toLocaleString('id-ID')}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">per kursi</div>
                </div>
              </div>

              <div className="inline-block bg-yellow-400 text-yellow-900 text-xs font-semibold px-2 py-1 rounded mb-4">
                Data Simulasi
              </div>

              {/* Route Timeline */}
              <div className="flex items-center gap-4 py-4">
                <div className="flex-1">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                    {schedule.departureTime}
                  </div>
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                    <MapPin className="w-4 h-4" />
                    <span>{schedule.origin}</span>
                  </div>
                </div>

                <div className="flex flex-col items-center px-4">
                  <Clock className="w-5 h-5 text-gray-400 mb-1" />
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {schedule.duration}
                  </div>
                  <div className="w-24 h-px bg-gray-300 dark:bg-gray-600 my-2" />
                </div>

                <div className="flex-1 text-right">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                    {schedule.arrivalTime}
                  </div>
                  <div className="flex items-center justify-end gap-2 text-gray-600 dark:text-gray-400">
                    <span>{schedule.destination}</span>
                    <MapPin className="w-4 h-4" />
                  </div>
                </div>
              </div>

              {/* Availability */}
              <div className="flex items-center justify-between py-4 border-t border-gray-200 dark:border-gray-700">
                <span className="text-gray-600 dark:text-gray-400">Kursi Tersedia</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {seatsData
                    ? seatsData.seats.filter((s: any) => s.status === 'AVAILABLE').length
                    : schedule.availableSeats} kursi
                </span>
              </div>
            </div>

            {/* Facilities */}
            {schedule.facilities && schedule.facilities.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                  Fasilitas
                </h2>
                <div className="flex flex-wrap gap-2">
                  {(schedule.facilities || schedule.vehicle?.facilities || []).map((facility: string, index: number) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 px-3 py-1 rounded-full text-sm"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{facility}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Policies */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                Kebijakan & Ketentuan
              </h2>
              
              <div className="space-y-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Briefcase className="w-5 h-5 text-gray-400" />
                    <h3 className="font-semibold text-gray-900 dark:text-white">Bagasi</h3>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 ml-7">
                    Bagasi maksimal 20kg per penumpang. Bagasi berlebih dikenakan biaya tambahan simulasi sesuai ketentuan operator.
                  </p>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <XCircle className="w-5 h-5 text-gray-400" />
                    <h3 className="font-semibold text-gray-900 dark:text-white">Pembatalan</h3>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 ml-7">
                    Pembatalan dapat dilakukan hingga 2 jam sebelum keberangkatan. Refund akan diproses dalam 3-5 hari kerja simulasi dengan potongan biaya administrasi.
                  </p>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Info className="w-5 h-5 text-gray-400" />
                    <h3 className="font-semibold text-gray-900 dark:text-white">Catatan</h3>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 ml-7">
                    Harap tiba di terminal/stasiun 30 menit sebelum keberangkatan. Bawa identitas asli yang sesuai dengan data pemesanan.
                  </p>
                </div>
              </div>
            </div>

            {/* Seat Selection */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                  Pilih Kursi
                </h2>
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-gray-400" />
                  <select
                    value={passengers}
                    onChange={(e) => setPassengers(parseInt(e.target.value))}
                    className="px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 text-gray-900 dark:text-white"
                  >
                    {[...Array(10)].map((_, i) => (
                      <option key={i + 1} value={i + 1}>
                        {i + 1} Penumpang
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mb-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Pilih {passengers} kursi untuk melanjutkan
                </p>
              </div>

              {seatsData && (
                <SeatMap
                  seats={seatsData.seats}
                  selectedSeats={selectedSeats}
                  onSeatToggle={handleSeatToggle}
                  maxSelection={passengers}
                />
              )}
            </div>
          </div>

          {/* Booking Summary - Sticky */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow sticky top-6">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                Ringkasan Pemesanan
              </h2>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Jumlah Penumpang</span>
                  <span className="font-semibold text-gray-900 dark:text-white">{passengers}</span>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Kursi Dipilih</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {selectedSeats.length > 0 ? selectedSeats.join(', ') : '-'}
                  </span>
                </div>

                <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-600 dark:text-gray-400">Harga Tiket</span>
                    <span className="text-gray-900 dark:text-white">
                      Rp {subtotal.toLocaleString('id-ID')}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Biaya Layanan</span>
                    <span className="text-gray-900 dark:text-white">
                      Rp {serviceFee.toLocaleString('id-ID')}
                    </span>
                  </div>
                </div>

                <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
                  <div className="flex justify-between">
                    <span className="font-bold text-gray-900 dark:text-white">Total</span>
                    <span className="font-bold text-xl text-blue-600 dark:text-blue-400">
                      Rp {total.toLocaleString('id-ID')}
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={handleContinue}
                disabled={selectedSeats.length !== passengers}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                {selectedSeats.length !== passengers
                  ? `Pilih ${passengers - selectedSeats.length} kursi lagi`
                  : 'Lanjut Booking'}
              </button>

              <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-4">
                Dengan melanjutkan, Anda menyetujui kebijakan pembatalan dan ketentuan layanan
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
