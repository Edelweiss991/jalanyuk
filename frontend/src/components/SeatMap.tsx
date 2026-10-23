interface Seat {
  seatNumber: string;
  status: 'AVAILABLE' | 'BOOKED' | 'HELD';
}

interface SeatMapProps {
  seats: Seat[];
  selectedSeats: string[];
  onSeatToggle: (seatNumber: string) => void;
  maxSelection: number;
}

export default function SeatMap({ seats, selectedSeats, onSeatToggle, maxSelection }: SeatMapProps) {
  const canSelect = (seat: Seat) => {
    if (seat.status !== 'AVAILABLE') return false;
    if (selectedSeats.includes(seat.seatNumber)) return true;
    return selectedSeats.length < maxSelection;
  };

  const getSeatColor = (seat: Seat) => {
    if (selectedSeats.includes(seat.seatNumber)) {
      return 'bg-blue-600 text-white border-blue-600';
    }
    if (seat.status === 'BOOKED' || seat.status === 'HELD') {
      // Deliberately dull + struck through so it can never be confused with
      // an available seat (previously both were mid-gray in dark mode).
      return 'bg-gray-200 dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-400 dark:text-gray-600 line-through opacity-70 cursor-not-allowed';
    }
    // Available seats get a clear green tint — unmistakably "free" in both
    // light and dark themes.
    return 'bg-emerald-50 dark:bg-emerald-500/15 border-emerald-500 dark:border-emerald-400 text-emerald-900 dark:text-emerald-100 hover:bg-emerald-100 dark:hover:bg-emerald-500/30';
  };

  // Group seats into rows (assume 4 seats per row: 2-aisle-2)
  const rows: Seat[][] = [];
  for (let i = 0; i < seats.length; i += 4) {
    rows.push(seats.slice(i, i + 4));
  }

  return (
    <div>
      {/* Legend */}
      <div className="flex flex-wrap gap-4 mb-6 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-emerald-50 dark:bg-emerald-500/15 border-2 border-emerald-500 dark:border-emerald-400 rounded" />
          <span className="text-gray-600 dark:text-gray-400">Tersedia</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 border-2 border-blue-600 rounded" />
          <span className="text-gray-600 dark:text-gray-400">Dipilih</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gray-200 dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-700 opacity-70 rounded" />
          <span className="text-gray-600 dark:text-gray-400">Tidak Tersedia</span>
        </div>
      </div>

      {/* Seat Grid */}
      <div className="space-y-2">
        {rows.map((row, rowIndex) => (
          <div key={rowIndex} className="flex justify-center gap-2">
            {row.map((seat, seatIndex) => (
              <div key={seat.seatNumber} className="flex gap-2">
                <button
                  onClick={() => canSelect(seat) && onSeatToggle(seat.seatNumber)}
                  disabled={!canSelect(seat)}
                  className={`w-12 h-12 border-2 rounded font-semibold text-sm transition-colors ${getSeatColor(seat)}`}
                >
                  {seat.seatNumber}
                </button>
                {seatIndex === 1 && <div className="w-8" />} {/* Aisle */}
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Selection Info */}
      <div className="mt-6 text-center">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {selectedSeats.length} dari {maxSelection} kursi dipilih
          {selectedSeats.length > 0 && (
            <span className="ml-2 font-semibold text-gray-900 dark:text-white">
              ({selectedSeats.join(', ')})
            </span>
          )}
        </p>
      </div>
    </div>
  );
}
