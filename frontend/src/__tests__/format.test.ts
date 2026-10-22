import { describe, it, expect } from 'vitest';
import { formatIDR, formatDuration, formatDate } from '../lib/format';

describe('formatIDR', () => {
  it('memformat Rupiah tanpa desimal', () => {
    expect(formatIDR(150000)).toContain('150.000');
    expect(formatIDR(150000)).toContain('Rp');
    expect(formatIDR(0)).toContain('0');
  });
});

describe('formatDuration', () => {
  it('mengubah menit ke format jam-menit Indonesia', () => {
    expect(formatDuration(180)).toBe('3 j 0 mnt');
    expect(formatDuration(45)).toBe('45 mnt');
    expect(formatDuration(125)).toBe('2 j 5 mnt');
  });
});

describe('formatDate', () => {
  it('menghasilkan tanggal berbahasa Indonesia', () => {
    const out = formatDate('2026-10-24T06:00:00.000Z');
    expect(out).toContain('2026');
    expect(out).toContain('24');
  });
});
