import { useNavigate } from 'react-router-dom';
import { Clock, MapPin, Users, ArrowRight } from 'lucide-react';
import { TransportType } from '../types';

interface Schedule {
  id: string;
  operator: string;
  vehicle: string;
  class: string;
  origin: string;
  destination: string;
  departureTime: string;
  arrivalTime: string;
  duration: string;
  price: number;
  availableSeats: number;
  facilities?: string[];
}

interface ScheduleCardProps {
  schedule: Schedule;
  transportType: TransportType;
  passengers: number;
}

export default function ScheduleCard({ schedule, transportType, passengers }: ScheduleCardProps) {
  const navigate = useNavigate();

  const handleSelect = () => {
    const path = transportType === 'BUS' ? `/bus/${schedule.id}` : `/kereta/${schedule.id}`;
    navigate(`${path}?passengers=${passengers}`);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-lg transition-shadow p-6">
      <div className="flex flex-col lg:flex-row lg:items-center gap-4">
        {/* Left: Operator & Class */}
        <div className="lg:w-1/4">
          <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-1">
            {schedule.operator}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {schedule.vehicle} • {schedule.class}
          </p>
        </div>

        {/* Middle: Route & Time */}
        <div className="lg:w-2/4 flex items-center gap-4">
          <div className="flex-1">
            <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
              {schedule.departureTime}
            </div>
            <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400 text-sm">
              <MapPin className="w-4 h-4" />
              <span>{schedule.origin}</span>
            </div>
          </div>

          <div className="flex flex-col items-center px-4">
            <Clock className="w-5 h-5 text-gray-400 mb-1" />
            <div className="text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">
              {schedule.duration}
            </div>
            <ArrowRight className="w-6 h-6 text-gray-300 dark:text-gray-600 my-1" />
          </div>

          <div className="flex-1 text-right">
            <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
              {schedule.arrivalTime}
            </div>
            <div className="flex items-center justify-end gap-1 text-gray-600 dark:text-gray-400 text-sm">
              <span>{schedule.destination}</span>
              <MapPin className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* Right: Price & Action */}
        <div className="lg:w-1/4 flex lg:flex-col items-center lg:items-end gap-3">
          <div className="text-right flex-1 lg:flex-none">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              Rp {schedule.price.toLocaleString('id-ID')}
            </div>
            <div className="flex items-center justify-end gap-1 text-sm text-gray-600 dark:text-gray-400 mt-1">
              <Users className="w-4 h-4" />
              <span>{schedule.availableSeats} kursi</span>
            </div>
          </div>

          <button
            onClick={handleSelect}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold transition-colors whitespace-nowrap"
          >
            Pilih
          </button>
        </div>
      </div>

      {/* Facilities */}
      {schedule.facilities && schedule.facilities.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex flex-wrap gap-2">
            {schedule.facilities.slice(0, 5).map((facility, index) => (
              <span
                key={index}
                className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-1 rounded"
              >
                {facility}
              </span>
            ))}
            {schedule.facilities.length > 5 && (
              <span className="text-xs text-gray-500 dark:text-gray-400 px-2 py-1">
                +{schedule.facilities.length - 5} lainnya
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
