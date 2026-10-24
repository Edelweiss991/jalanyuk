import type { LogStep, SearchResult, VisualFrame } from './types';
import { AppError } from '../utils/errors';

/**
 * Binary search implementation with detailed execution logging.
 * Requires array to be sorted in ascending order by the key function.
 * Also produces one VisualFrame per log step for the bar-chart visualizer:
 * bars outside the active [low, high] range fade out, the mid bar lights
 * up orange with low/mid/high markers, and a found bar turns green.
 */
export function binarySearchWithLog<T>(
  sortedItems: T[],
  key: (item: T) => number,
  target: number,
  dataType: string,
  formatValue?: (value: number) => string
): SearchResult {
  const fmt = formatValue ?? ((v: number) => v.toLocaleString('id-ID'));
  const log: LogStep[] = [];
  const frames: VisualFrame[] = [];
  let stepCounter = 0;
  let comparisonCount = 0;

  const n = sortedItems.length;
  const identityOrder = sortedItems.map((_, i) => i);
  const outsideRange = (lo: number, hi: number) =>
    identityOrder.filter((i) => i < lo || i > hi);

  const record = (
    entry: Omit<LogStep, 'step' | 'timestamp' | 'algorithm' | 'dataType'>,
    frame: VisualFrame
  ) => {
    log.push({
      step: ++stepCounter,
      timestamp: new Date().toISOString(),
      algorithm: 'binarySearch',
      dataType,
      ...entry,
    });
    frames.push(frame);
  };

  // Verify array is sorted
  for (let i = 1; i < sortedItems.length; i++) {
    if (key(sortedItems[i - 1]) > key(sortedItems[i])) {
      throw new AppError(
        400,
        'BINARY_SEARCH_REQUIRES_SORTED',
        'Array harus terurut ascending untuk binary search'
      );
    }
  }

  record(
    {
      operation: 'start',
      decision: `Mencari nilai ${target} di ${sortedItems.length} elemen terurut`,
      result: 'Memulai pencarian biner',
    },
    {
      order: identityOrder,
      active: [],
      range: n > 0 ? [0, n - 1] : null,
      markers: n > 0 ? { low: 0, high: n - 1 } : undefined,
      caption: `Harga-harga sudah terurut dari yang termurah. Kita mencari ${fmt(target)} dengan cara membelah dua rentang pencarian di setiap langkah — jauh lebih cepat daripada memeriksa satu per satu.`,
    }
  );

  let low = 0;
  let high = n - 1;
  let foundIndex = -1;

  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    const midValue = key(sortedItems[mid]);

    comparisonCount++;

    record(
      {
        operation: 'compare',
        indices: [mid],
        comparedValues: [midValue, target],
        low,
        mid,
        high,
        decision: `Bandingkan nilai tengah ${midValue} dengan target ${target}`,
        result:
          midValue === target
            ? 'DITEMUKAN'
            : midValue < target
              ? `${midValue} < ${target}, cari di kanan`
              : `${midValue} > ${target}, cari di kiri`,
      },
      {
        order: identityOrder,
        active: midValue === target ? [] : [mid],
        checked: outsideRange(low, high),
        range: [low, high],
        markers: { low, mid, high },
        foundIndex: midValue === target ? mid : undefined,
        caption:
          midValue === target
            ? `Nilai tengah di posisi ${mid} adalah ${fmt(midValue)} — sama persis dengan target. KETEMU!`
            : midValue < target
              ? `Rentang pencarian posisi ${low} sampai ${high}. Nilai tengahnya di posisi ${mid}, yaitu ${fmt(midValue)} — lebih kecil dari target ${fmt(target)}, jadi separuh kiri dibuang.`
              : `Rentang pencarian posisi ${low} sampai ${high}. Nilai tengahnya di posisi ${mid}, yaitu ${fmt(midValue)} — lebih besar dari target ${fmt(target)}, jadi separuh kanan dibuang.`,
      }
    );

    if (midValue === target) {
      foundIndex = mid;
      break;
    } else if (midValue < target) {
      low = mid + 1;
      record(
        {
          operation: 'adjust',
          low,
          high,
          decision: `Update low = ${low}`,
          result: `Rentang baru: [${low}, ${high}]`,
        },
        {
          order: identityOrder,
          active: [],
          checked: outsideRange(low, high),
          range: low <= high ? [low, high] : null,
          markers: low <= high ? { low, high } : undefined,
          caption:
            low <= high
              ? `Rentang menyempit: sekarang hanya posisi ${low} sampai ${high} yang diperiksa.`
              : 'Rentangnya sudah habis — tidak ada lagi posisi yang bisa diperiksa.',
        }
      );
    } else {
      high = mid - 1;
      record(
        {
          operation: 'adjust',
          low,
          high,
          decision: `Update high = ${high}`,
          result: `Rentang baru: [${low}, ${high}]`,
        },
        {
          order: identityOrder,
          active: [],
          checked: outsideRange(low, high),
          range: low <= high ? [low, high] : null,
          markers: low <= high ? { low, high } : undefined,
          caption:
            low <= high
              ? `Rentang menyempit: sekarang hanya posisi ${low} sampai ${high} yang diperiksa.`
              : 'Rentangnya sudah habis — tidak ada lagi posisi yang bisa diperiksa.',
        }
      );
    }
  }

  const found = foundIndex !== -1;

  record(
    {
      operation: 'complete',
      decision: found
        ? `Nilai ditemukan di indeks ${foundIndex}`
        : 'Nilai tidak ditemukan',
      result: `Total ${comparisonCount} perbandingan`,
    },
    {
      order: identityOrder,
      active: [],
      checked: found ? outsideRange(foundIndex, foundIndex) : identityOrder,
      foundIndex: found ? foundIndex : undefined,
      caption: found
        ? `Selesai — ${fmt(target)} ditemukan di posisi ${foundIndex} hanya dengan ${comparisonCount} kali percobaan. Kalau dicek satu per satu, bisa sampai ${n} kali.`
        : `Selesai — ${fmt(target)} tidak ada di data. Rentang pencarian habis setelah ${comparisonCount} kali percobaan.`,
    }
  );

  return {
    found,
    index: foundIndex,
    log,
    frames,
    comparisons: comparisonCount,
  };
}
