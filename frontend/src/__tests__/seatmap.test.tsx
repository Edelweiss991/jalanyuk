import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import SeatMap from '../components/SeatMap';

const seats = [
  { seatNumber: '1A', status: 'AVAILABLE' as const },
  { seatNumber: '1B', status: 'BOOKED' as const },
  { seatNumber: '1C', status: 'HELD' as const },
  { seatNumber: '1D', status: 'AVAILABLE' as const },
];

describe('SeatMap', () => {
  it('kursi tersedia bisa dipilih, kursi BOOKED/HELD tidak', () => {
    const onToggle = vi.fn();
    render(<SeatMap seats={seats} selectedSeats={[]} onSeatToggle={onToggle} maxSelection={2} />);

    fireEvent.click(screen.getByText('1A'));
    expect(onToggle).toHaveBeenCalledWith('1A');

    fireEvent.click(screen.getByText('1B'));
    fireEvent.click(screen.getByText('1C'));
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it('menampilkan legenda status kursi', () => {
    render(<SeatMap seats={seats} selectedSeats={[]} onSeatToggle={() => {}} maxSelection={2} />);
    expect(screen.getByText('Dipilih')).toBeInTheDocument();
    expect(screen.getByText('Tidak Tersedia')).toBeInTheDocument();
  });
});
