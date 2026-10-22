import { describe, it, expect } from 'vitest';
import { runCDemo } from '../src/services/cDemo';

const rows = [
  { id: 1, origin: 'Jakarta', destination: 'Bandung', departureMinutes: 360, price: 150000 },
  { id: 2, origin: 'Jakarta', destination: 'Surabaya', departureMinutes: 480, price: 350000 },
  { id: 3, origin: 'Bandung', destination: 'Yogyakarta', departureMinutes: 420, price: 200000 },
];

describe('Modul C — Pointer & Struct (biner asli via subprocess)', () => {
  it('demo pointer menampilkan alamat memori aktual', async () => {
    const result = await runCDemo('pointer', rows);
    expect(result.rawOutput).toContain('DEMO POINTER');
    expect(result.addresses.length).toBeGreaterThan(0);
    expect(result.addresses[0]).toMatch(/^0x[0-9a-fA-F]+$/);
    expect(result.rawOutput).toContain('Jakarta');
  }, 30000);

  it('demo struct menampilkan data jadwal & ukuran struct', async () => {
    const result = await runCDemo('struct', rows);
    expect(result.rawOutput).toContain('DEMO STRUCT');
    expect(result.rawOutput).toContain('Bandung');
  }, 30000);

  it('input tidak valid disanitasi / ditolak', async () => {
    const bad = [{ id: -5, origin: 'Ja;karta', destination: 'Bandung', departureMinutes: 99999, price: -1 }];
    await expect(runCDemo('pointer', bad as never)).rejects.toThrow();
  }, 30000);
});
