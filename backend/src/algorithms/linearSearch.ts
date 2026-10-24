import type { LogStep, SearchResult, VisualFrame } from './types';

/**
 * Linear search implementation with detailed execution logging.
 * Also produces one VisualFrame per log step for the cell-grid visualizer:
 * the cell being examined lights up orange, cells already ruled out fade,
 * and the found cell turns green.
 */
export function linearSearchWithLog<T>(
  items: T[],
  predicate: (item: T) => boolean,
  targetLabel: string,
  valueOf: (item: T) => string | number,
  dataType: string
): SearchResult {
  const log: LogStep[] = [];
  const frames: VisualFrame[] = [];
  let stepCounter = 0;
  let comparisonCount = 0;

  const record = (
    entry: Omit<LogStep, 'step' | 'timestamp' | 'algorithm' | 'dataType'>,
    frame: VisualFrame
  ) => {
    log.push({
      step: ++stepCounter,
      timestamp: new Date().toISOString(),
      algorithm: 'linearSearch',
      dataType,
      ...entry,
    });
    frames.push(frame);
  };

  record(
    {
      operation: 'start',
      decision: `Mencari "${targetLabel}" di ${items.length} elemen`,
      result: 'Memulai pencarian linear',
    },
    {
      active: [],
      caption: `Kita mencari "${targetLabel}" di ${items.length} jadwal. Linear Search memeriksa data satu per satu, mulai dari posisi 0 — seperti mencari nama di daftar panjang dengan membaca dari baris paling atas.`,
    }
  );

  // Manual linear search - no find/indexOf
  let foundIndex = -1;

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const value = valueOf(item);
    const matches = predicate(item);

    comparisonCount++;

    record(
      {
        operation: 'compare',
        indices: [i],
        comparedValues: [value],
        decision: matches
          ? `"${value}" cocok dengan kriteria pencarian`
          : `"${value}" tidak cocok dengan kriteria pencarian`,
        result: matches ? 'DITEMUKAN' : 'Lanjut ke elemen berikutnya',
      },
      {
        active: matches ? [] : [i],
        checkedUpTo: i,
        foundIndex: matches ? i : undefined,
        caption: matches
          ? `Posisi ${i}: ${value} — COCOK! Ini data yang dicari.`
          : i === items.length - 1
            ? `Posisi ${i}: ${value} — tidak cocok. Ini data terakhir.`
            : `Posisi ${i}: ${value} — tidak cocok, lanjut periksa posisi ${i + 1}.`,
      }
    );

    if (matches) {
      foundIndex = i;
      break;
    }
  }

  const found = foundIndex !== -1;

  record(
    {
      operation: 'complete',
      decision: found
        ? `Elemen ditemukan di indeks ${foundIndex}`
        : 'Elemen tidak ditemukan',
      result: `Total ${comparisonCount} perbandingan`,
    },
    {
      active: [],
      checkedUpTo: found ? foundIndex : items.length,
      foundIndex: found ? foundIndex : undefined,
      caption: found
        ? `Pencarian berhenti. Data ditemukan di posisi ${foundIndex} setelah memeriksa ${comparisonCount} data.`
        : `Semua ${items.length} data sudah diperiksa satu per satu — tidak ada yang cocok dengan "${targetLabel}".`,
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
