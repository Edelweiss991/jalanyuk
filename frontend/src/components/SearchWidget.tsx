import { useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Search, Calendar, Users, Bus, Train, MapPin, ChevronDown } from 'lucide-react';
import { searchApi } from '../services/api';

const INPUT_CLASS =
  'w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 text-gray-900 dark:text-white';

interface CityInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  cities: string[];
  placeholder: string;
}

/**
 * City field with a suggestion list: click/tap the field to see every city
 * served, type to filter, click a city to pick it. Free text is still
 * allowed (the search page shows a proper empty state for unknown cities).
 */
function CityInput({ label, value, onChange, cities, placeholder }: CityInputProps) {
  const [open, setOpen] = useState(false);
  const blurTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const suggestions = useMemo(() => {
    const q = value.trim().toLowerCase();
    const list = q ? cities.filter((c) => c.toLowerCase().includes(q)) : cities;
    return list.slice(0, 10);
  }, [cities, value]);

  const closeSoon = () => {
    blurTimer.current = setTimeout(() => setOpen(false), 150);
  };

  const pick = (city: string) => {
    if (blurTimer.current) clearTimeout(blurTimer.current);
    onChange(city);
    setOpen(false);
  };

  return (
    <div className="relative">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        {label}
      </label>
      <div className="relative">
        <input
          type="text"
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={closeSoon}
          onKeyDown={(e) => {
            if (e.key === 'Escape') setOpen(false);
          }}
          placeholder={placeholder}
          autoComplete="off"
          className={`${INPUT_CLASS} pr-10`}
          required
        />
        <ChevronDown className="w-5 h-5 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
      </div>

      {open && suggestions.length > 0 && (
        <ul className="absolute z-30 left-0 right-0 mt-1 max-h-60 overflow-auto bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-xl py-1">
          {suggestions.map((city) => (
            <li key={city}>
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  pick(city);
                }}
                className="w-full flex items-center gap-2 px-4 py-2.5 text-left text-gray-900 dark:text-white hover:bg-blue-50 dark:hover:bg-gray-700"
              >
                <MapPin className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                <span>{city}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function SearchWidget() {
  const navigate = useNavigate();
  const [transportType, setTransportType] = useState<'BUS' | 'TRAIN'>('BUS');
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [date, setDate] = useState('');
  const [passengers, setPassengers] = useState(1);

  const { data: terminals } = useQuery({
    queryKey: ['meta', 'bus-terminals'],
    queryFn: () => searchApi.getTerminals(),
    staleTime: 5 * 60 * 1000,
  });
  const { data: stations } = useQuery({
    queryKey: ['meta', 'train-stations'],
    queryFn: () => searchApi.getStations(),
    staleTime: 5 * 60 * 1000,
  });

  const cities = useMemo(() => {
    const source = transportType === 'BUS' ? terminals : stations;
    const unique = new Set<string>();
    (source ?? []).forEach((place: any) => {
      if (place?.city) unique.add(place.city);
    });
    return Array.from(unique).sort((a, b) => a.localeCompare(b, 'id'));
  }, [transportType, terminals, stations]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();

    if (!origin || !destination || !date) {
      alert('Harap lengkapi semua field pencarian');
      return;
    }

    const path = transportType === 'BUS' ? '/bus/search' : '/kereta/search';
    const params = new URLSearchParams({
      origin,
      destination,
      date,
      passengers: passengers.toString(),
    });

    navigate(`${path}?${params.toString()}`);
  };

  const minDate = new Date().toISOString().split('T')[0];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6">
      {/* Transport Type Toggle */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setTransportType('BUS')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-semibold transition-colors ${
            transportType === 'BUS'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
          }`}
        >
          <Bus className="w-5 h-5" />
          Bus
        </button>
        <button
          onClick={() => setTransportType('TRAIN')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-semibold transition-colors ${
            transportType === 'TRAIN'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
          }`}
        >
          <Train className="w-5 h-5" />
          Kereta
        </button>
      </div>

      {/* Search Form */}
      <form onSubmit={handleSearch} className="space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <CityInput
            label="Dari"
            value={origin}
            onChange={setOrigin}
            cities={cities}
            placeholder="Kota asal"
          />

          <CityInput
            label="Ke"
            value={destination}
            onChange={setDestination}
            cities={cities}
            placeholder="Kota tujuan"
          />
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <Calendar className="w-4 h-4 inline mr-1" />
              Tanggal
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              min={minDate}
              className={INPUT_CLASS}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <Users className="w-4 h-4 inline mr-1" />
              Penumpang
            </label>
            <select
              value={passengers}
              onChange={(e) => setPassengers(parseInt(e.target.value))}
              className={INPUT_CLASS}
            >
              {[...Array(10)].map((_, i) => (
                <option key={i + 1} value={i + 1}>
                  {i + 1} Penumpang
                </option>
              ))}
            </select>
          </div>
        </div>

        <button
          type="submit"
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg flex items-center justify-center gap-2 transition-colors"
        >
          <Search className="w-5 h-5" />
          Cari Jadwal
        </button>
      </form>
    </div>
  );
}
