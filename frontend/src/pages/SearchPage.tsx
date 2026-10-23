import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Filter, X, ChevronDown, ChevronUp } from 'lucide-react';
import { searchApi, TransportType } from '../services/api';
import ScheduleCard from '../components/ScheduleCard';
import { formatTime, formatDuration } from '../lib/format';

interface SearchPageProps {
  transportType: TransportType;
  title: string;
}

export default function SearchPage({ transportType, title }: SearchPageProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    operators: [] as string[],
    classes: [] as string[],
    minPrice: '',
    maxPrice: '',
    departAfter: '',
    departBefore: '',
    facilities: [] as string[],
  });

  const origin = searchParams.get('origin') || '';
  const destination = searchParams.get('destination') || '';
  const date = searchParams.get('date') || '';
  const passengers = parseInt(searchParams.get('passengers') || '1');
  const sortBy = searchParams.get('sortBy') || 'departureTime_asc';
  const page = parseInt(searchParams.get('page') || '1');

  useEffect(() => {
    document.title = title;
  }, [title]);

  // Load filters from URL
  useEffect(() => {
    setFilters({
      operators: searchParams.get('operators')?.split(',').filter(Boolean) || [],
      classes: searchParams.get('classes')?.split(',').filter(Boolean) || [],
      minPrice: searchParams.get('minPrice') || '',
      maxPrice: searchParams.get('maxPrice') || '',
      departAfter: searchParams.get('departAfter') || '',
      departBefore: searchParams.get('departBefore') || '',
      facilities: searchParams.get('facilities')?.split(',').filter(Boolean) || [],
    });
  }, [searchParams]);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['search', transportType, Object.fromEntries(searchParams)],
    queryFn: () => {
      // The API expects `sort` with its own value vocabulary; the URL keeps
      // the UI's `sortBy` names, so translate here.
      const SORT_MAP: Record<string, string> = {
        departureTime_asc: 'departure_asc',
        departureTime_desc: 'departure_desc',
        price_asc: 'price_asc',
        price_desc: 'price_desc',
        duration_asc: 'duration_asc',
        duration_desc: 'duration_desc',
      };
      const params: any = {
        origin,
        destination,
        date,
        passengers,
        sort: SORT_MAP[sortBy] || 'departure_asc',
        page,
        pageSize: 20,
      };

      if (filters.operators.length) params.operators = filters.operators.join(',');
      if (filters.classes.length) params.classes = filters.classes.join(',');
      if (filters.minPrice) params.minPrice = filters.minPrice;
      if (filters.maxPrice) params.maxPrice = filters.maxPrice;
      if (filters.departAfter) params.departAfter = filters.departAfter;
      if (filters.departBefore) params.departBefore = filters.departBefore;
      if (filters.facilities.length) params.facilities = filters.facilities.join(',');

      return searchApi.search(transportType, params);
    },
    enabled: !!(origin && destination && date),
  });

  const updateFilters = (key: string, value: any) => {
    const newParams = new URLSearchParams(searchParams);
    
    if (Array.isArray(value)) {
      if (value.length > 0) {
        newParams.set(key, value.join(','));
      } else {
        newParams.delete(key);
      }
    } else if (value) {
      newParams.set(key, value.toString());
    } else {
      newParams.delete(key);
    }
    
    newParams.set('page', '1');
    setSearchParams(newParams);
  };

  const toggleArrayFilter = (key: string, value: string) => {
    const current = filters[key as keyof typeof filters] as string[];
    const updated = current.includes(value)
      ? current.filter(v => v !== value)
      : [...current, value];
    updateFilters(key, updated);
  };

  const clearFilter = (key: string, value?: string) => {
    if (value) {
      const current = filters[key as keyof typeof filters] as string[];
      updateFilters(key, current.filter(v => v !== value));
    } else {
      updateFilters(key, key.includes('Price') || key.includes('depart') ? '' : []);
    }
  };

  const clearAllFilters = () => {
    const newParams = new URLSearchParams();
    newParams.set('origin', origin);
    newParams.set('destination', destination);
    newParams.set('date', date);
    newParams.set('passengers', passengers.toString());
    newParams.set('sortBy', sortBy);
    setSearchParams(newParams);
  };

  const activeFilterCount = 
    filters.operators.length +
    filters.classes.length +
    filters.facilities.length +
    (filters.minPrice ? 1 : 0) +
    (filters.maxPrice ? 1 : 0) +
    (filters.departAfter ? 1 : 0) +
    (filters.departBefore ? 1 : 0);

  const sortOptions = [
    { value: 'departureTime_asc', label: 'Keberangkatan Terdekat' },
    { value: 'departureTime_desc', label: 'Keberangkatan Terjauh' },
    { value: 'price_asc', label: 'Harga Termurah' },
    { value: 'price_desc', label: 'Harga Termahal' },
    { value: 'duration_asc', label: 'Durasi Tercepat' },
    { value: 'duration_desc', label: 'Durasi Terlama' },
  ];

  const facilityOptions = [
    'AC',
    'Toilet',
    'Reclining Seat',
    'Snack',
    'WiFi',
    'USB Charger',
  ];

  const schedules: any[] = data?.schedules || [];
  const operators: string[] = Array.from(new Set(schedules.map((s: any) => s.operator?.name).filter(Boolean)));
  const classes: string[] = Array.from(new Set(schedules.map((s: any) => s.vehicle?.className).filter(Boolean)));

  if (!origin || !destination || !date) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Silakan pilih rute dan tanggal perjalanan
          </p>
          <button
            onClick={() => navigate(transportType === 'BUS' ? '/bus' : '/kereta')}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            Kembali ke Pencarian
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-6">
        {/* Search Summary */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 mb-6 shadow">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                {origin} → {destination}
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                {new Date(date).toLocaleDateString('id-ID', { 
                  weekday: 'long', 
                  day: 'numeric', 
                  month: 'long', 
                  year: 'numeric' 
                })} · {passengers} penumpang
              </p>
            </div>
            <button
              onClick={() => navigate(transportType === 'BUS' ? '/bus' : '/kereta')}
              className="text-blue-600 dark:text-blue-400 hover:underline"
            >
              Ubah Pencarian
            </button>
          </div>
        </div>

        <div className="flex gap-6">
          {/* Filters Sidebar - Desktop */}
          <aside className="hidden lg:block w-80 flex-shrink-0">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow sticky top-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                  Filter
                </h2>
                {activeFilterCount > 0 && (
                  <button
                    onClick={clearAllFilters}
                    className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    Hapus Semua
                  </button>
                )}
              </div>

              <FilterSection title="Operator">
                {operators.map((op) => (
                  <label key={op} className="flex items-center gap-2 mb-2">
                    <input
                      type="checkbox"
                      checked={filters.operators.includes(op)}
                      onChange={() => toggleArrayFilter('operators', op)}
                      className="rounded"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">{op}</span>
                  </label>
                ))}
              </FilterSection>

              <FilterSection title="Kelas">
                {classes.map((cls) => (
                  <label key={cls} className="flex items-center gap-2 mb-2">
                    <input
                      type="checkbox"
                      checked={filters.classes.includes(cls)}
                      onChange={() => toggleArrayFilter('classes', cls)}
                      className="rounded"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">{cls}</span>
                  </label>
                ))}
              </FilterSection>

              <FilterSection title="Rentang Harga">
                <div className="space-y-3">
                  <input
                    type="number"
                    placeholder="Harga minimum"
                    value={filters.minPrice}
                    onChange={(e) => updateFilters('minPrice', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                  <input
                    type="number"
                    placeholder="Harga maksimum"
                    value={filters.maxPrice}
                    onChange={(e) => updateFilters('maxPrice', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
              </FilterSection>

              <FilterSection title="Jam Keberangkatan">
                <div className="space-y-3">
                  <input
                    type="time"
                    value={filters.departAfter}
                    onChange={(e) => updateFilters('departAfter', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    placeholder="Setelah"
                  />
                  <input
                    type="time"
                    value={filters.departBefore}
                    onChange={(e) => updateFilters('departBefore', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    placeholder="Sebelum"
                  />
                </div>
              </FilterSection>

              <FilterSection title="Fasilitas">
                {facilityOptions.map((facility) => (
                  <label key={facility} className="flex items-center gap-2 mb-2">
                    <input
                      type="checkbox"
                      checked={filters.facilities.includes(facility)}
                      onChange={() => toggleArrayFilter('facilities', facility)}
                      className="rounded"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">{facility}</span>
                  </label>
                ))}
              </FilterSection>
            </div>
          </aside>

          {/* Results */}
          <div className="flex-1">
            {/* Active Filters & Sort */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 mb-4 shadow">
              <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                <button
                  onClick={() => setShowFilters(true)}
                  className="lg:hidden flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <Filter className="w-4 h-4" />
                  Filter {activeFilterCount > 0 && `(${activeFilterCount})`}
                </button>

                <div className="flex items-center gap-2">
                  <label className="text-sm text-gray-600 dark:text-gray-400">Urutkan:</label>
                  <select
                    value={sortBy}
                    onChange={(e) => updateFilters('sortBy', e.target.value)}
                    className="px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  >
                    {sortOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Active Filter Chips */}
              {activeFilterCount > 0 && (
                <div className="flex flex-wrap gap-2">
                  {filters.operators.map((op) => (
                    <FilterChip key={op} label={op} onRemove={() => clearFilter('operators', op)} />
                  ))}
                  {filters.classes.map((cls) => (
                    <FilterChip key={cls} label={cls} onRemove={() => clearFilter('classes', cls)} />
                  ))}
                  {filters.facilities.map((fac) => (
                    <FilterChip key={fac} label={fac} onRemove={() => clearFilter('facilities', fac)} />
                  ))}
                  {filters.minPrice && (
                    <FilterChip label={`Min: Rp ${parseInt(filters.minPrice).toLocaleString('id-ID')}`} onRemove={() => clearFilter('minPrice')} />
                  )}
                  {filters.maxPrice && (
                    <FilterChip label={`Max: Rp ${parseInt(filters.maxPrice).toLocaleString('id-ID')}`} onRemove={() => clearFilter('maxPrice')} />
                  )}
                  {filters.departAfter && (
                    <FilterChip label={`Setelah ${filters.departAfter}`} onRemove={() => clearFilter('departAfter')} />
                  )}
                  {filters.departBefore && (
                    <FilterChip label={`Sebelum ${filters.departBefore}`} onRemove={() => clearFilter('departBefore')} />
                  )}
                </div>
              )}
            </div>

            {/* Results List */}
            {isLoading && (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow animate-pulse">
                    <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4" />
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3 mb-2" />
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
                  </div>
                ))}
              </div>
            )}

            {isError && (
              <div className="bg-white dark:bg-gray-800 rounded-lg p-8 shadow text-center">
                <p className="text-red-600 dark:text-red-400 mb-4">
                  Terjadi kesalahan saat memuat jadwal
                </p>
                <button
                  onClick={() => refetch()}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
                >
                  Coba Lagi
                </button>
              </div>
            )}

            {!isLoading && !isError && data?.schedules && (
              <>
                <div className="mb-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Menampilkan {schedules.length} dari {data.meta.total} jadwal
                  </p>
                  <div className="inline-block bg-yellow-400 text-yellow-900 text-xs font-semibold px-2 py-1 rounded mt-2">
                    Data Simulasi
                  </div>
                </div>

                {schedules.length === 0 ? (
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-8 shadow text-center">
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                      Tidak ada jadwal yang sesuai dengan pencarian Anda
                    </p>
                    <button
                      onClick={clearAllFilters}
                      className="text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      Hapus semua filter
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {schedules.map((s: any) => (
                      <ScheduleCard
                        key={s.id}
                        schedule={{
                          id: s.id,
                          operator: s.operator?.name ?? '-',
                          vehicle: s.vehicle?.name ?? '-',
                          class: s.vehicle?.className ?? '-',
                          origin: s.route?.origin?.city ?? s.route?.origin?.name ?? '-',
                          destination: s.route?.destination?.city ?? s.route?.destination?.name ?? '-',
                          departureTime: formatTime(s.departureTime),
                          arrivalTime: formatTime(s.arrivalTime),
                          duration: formatDuration(s.route?.durationMinutes ?? 0),
                          price: s.price,
                          availableSeats: s.seatsLeft ?? 0,
                          facilities: s.vehicle?.facilities ?? [],
                        }}
                        transportType={transportType}
                        passengers={passengers}
                      />
                    ))}
                  </div>
                )}

                {/* Pagination */}
                {data.meta.totalPages > 1 && (
                  <div className="mt-6 flex justify-center gap-2">
                    {page > 1 && (
                      <button
                        onClick={() => updateFilters('page', page - 1)}
                        className="px-4 py-2 border rounded-lg dark:border-gray-600 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        Sebelumnya
                      </button>
                    )}
                    
                    <span className="px-4 py-2 text-gray-600 dark:text-gray-400">
                      Halaman {page} dari {data.meta.totalPages}
                    </span>

                    {page < data.meta.totalPages && (
                      <button
                        onClick={() => updateFilters('page', page + 1)}
                        className="px-4 py-2 border rounded-lg dark:border-gray-600 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        Selanjutnya
                      </button>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Filter Drawer */}
      {showFilters && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowFilters(false)} />
          <div className="absolute inset-y-0 right-0 w-full max-w-sm bg-white dark:bg-gray-800 shadow-xl overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Filter</h2>
                <button onClick={() => setShowFilters(false)}>
                  <X className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                </button>
              </div>

              <FilterSection title="Operator">
                {operators.map((op) => (
                  <label key={op} className="flex items-center gap-2 mb-2">
                    <input
                      type="checkbox"
                      checked={filters.operators.includes(op)}
                      onChange={() => toggleArrayFilter('operators', op)}
                      className="rounded"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">{op}</span>
                  </label>
                ))}
              </FilterSection>

              <FilterSection title="Kelas">
                {classes.map((cls) => (
                  <label key={cls} className="flex items-center gap-2 mb-2">
                    <input
                      type="checkbox"
                      checked={filters.classes.includes(cls)}
                      onChange={() => toggleArrayFilter('classes', cls)}
                      className="rounded"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">{cls}</span>
                  </label>
                ))}
              </FilterSection>

              <FilterSection title="Rentang Harga">
                <div className="space-y-3">
                  <input
                    type="number"
                    placeholder="Harga minimum"
                    value={filters.minPrice}
                    onChange={(e) => updateFilters('minPrice', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                  <input
                    type="number"
                    placeholder="Harga maksimum"
                    value={filters.maxPrice}
                    onChange={(e) => updateFilters('maxPrice', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
              </FilterSection>

              <FilterSection title="Jam Keberangkatan">
                <div className="space-y-3">
                  <input
                    type="time"
                    value={filters.departAfter}
                    onChange={(e) => updateFilters('departAfter', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                  <input
                    type="time"
                    value={filters.departBefore}
                    onChange={(e) => updateFilters('departBefore', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
              </FilterSection>

              <FilterSection title="Fasilitas">
                {facilityOptions.map((facility) => (
                  <label key={facility} className="flex items-center gap-2 mb-2">
                    <input
                      type="checkbox"
                      checked={filters.facilities.includes(facility)}
                      onChange={() => toggleArrayFilter('facilities', facility)}
                      className="rounded"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">{facility}</span>
                  </label>
                ))}
              </FilterSection>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={clearAllFilters}
                  className="flex-1 px-4 py-2 border rounded-lg dark:border-gray-600 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  Hapus Semua
                </button>
                <button
                  onClick={() => setShowFilters(false)}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Terapkan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function FilterSection({ title, children }: { title: string; children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="border-b border-gray-200 dark:border-gray-700 pb-4 mb-4">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full mb-3"
      >
        <h3 className="font-semibold text-gray-900 dark:text-white">{title}</h3>
        {isOpen ? (
          <ChevronUp className="w-5 h-5 text-gray-400" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-400" />
        )}
      </button>
      {isOpen && <div>{children}</div>}
    </div>
  );
}

function FilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <div className="inline-flex items-center gap-2 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-3 py-1 rounded-full text-sm">
      <span>{label}</span>
      <button onClick={onRemove} className="hover:text-blue-600 dark:hover:text-blue-400">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
