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
      return 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed';
    }
    return 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 hover:border-blue-500 dark:hover:border-blue-400 text-gray-900 dark:text-white';
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
          <div className="w-8 h-8 bg-white dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 rounded" />
          <span className="text-gray-600 dark:text-gray-400">Tersedia</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 border-2 border-blue-600 rounded" />
          <span className="text-gray-600 dark:text-gray-400">Dipilih</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded" />
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
