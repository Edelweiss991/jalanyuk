import type { LogStep, SortResult, VisualFrame } from './types';

/**
 * Bubble sort (ascending) with detailed execution logging.
 * Produces one VisualFrame per log step for the bar-chart visualizer:
 * adjacent bars being compared light up orange, a swapped pair flashes
 * green, and the settled tail (largest values, already in final place)
 * turns deep green — mirroring the classic classroom visualization.
 */
export function bubbleSortWithLog<T>(
  items: T[],
  key: (item: T) => number | string,
  dataType: string,
  formatValue?: (value: number | string) => string
): SortResult<T> {
  const fmt =
    formatValue ??
    ((v: number | string) => (typeof v === 'number' ? v.toLocaleString('id-ID') : String(v)));
  const log: LogStep[] = [];
  const frames: VisualFrame[] = [];
  let stepCounter = 0;
  let comparisonCount = 0;
  let swapCount = 0;

  const working: T[] = [...items];
  const n = working.length;
  const orderOf = () => working.map((w) => items.indexOf(w));
  const settledFrom = (start: number) =>
    Array.from({ length: Math.max(0, n - start) }, (_, k) => start + k);

  const record = (
    entry: Omit<LogStep, 'step' | 'timestamp' | 'algorithm' | 'dataType'>,
    frame: VisualFrame
  ) => {
    log.push({
      step: ++stepCounter,
      timestamp: new Date().toISOString(),
      algorithm: 'bubbleSort',
      dataType,
      ...entry,
    });
    frames.push(frame);
  };

  if (n === 0) {
    record(
      { operation: 'trivial', decision: 'Array kosong', result: 'Tidak ada sorting diperlukan' },
      { order: [], active: [], caption: 'Tidak ada data untuk diurutkan.' }
    );
    return { sorted: [], log, frames, comparisons: 0, merges: 0, swaps: 0 };
  }

  record(
    {
      operation: 'start',
      decision: `Memulai bubble sort pada ${n} elemen`,
      result: 'Data awal belum terurut',
    },
    {
      order: orderOf(),
      active: [],
      caption: `Data awal berisi ${n} tiket yang belum terurut. Bubble Sort membandingkan dua data yang bersebelahan — kalau urutannya salah, keduanya ditukar. Nilai besar perlahan "menggelembung" ke kanan.`,
    }
  );

  if (n === 1) {
    record(
      { operation: 'complete', decision: 'Sorting selesai', result: 'Total 0 perbandingan, 0 penukaran' },
      {
        order: orderOf(),
        active: [],
        settled: [0],
        caption: 'Hanya ada satu data — sudah pasti terurut.',
      }
    );
    return { sorted: working, log, frames, comparisons: 0, merges: 0, swaps: 0 };
  }

  for (let pass = 0; pass < n - 1; pass++) {
    let swappedInPass = false;
    const lastUnsorted = n - 1 - pass; // positions > this are settled

    for (let j = 0; j < lastUnsorted; j++) {
      const leftValue = key(working[j]);
      const rightValue = key(working[j + 1]);
      comparisonCount++;
      const willSwap = leftValue > rightValue;

      record(
        {
          operation: 'compare',
          indices: [j, j + 1],
          comparedValues: [leftValue, rightValue],
          decision: willSwap
            ? `${leftValue} > ${rightValue}, urutan salah`
            : `${leftValue} ≤ ${rightValue}, urutan sudah benar`,
          result: willSwap ? 'Tukar posisi' : 'Tidak ditukar',
        },
        {
          order: orderOf(),
          active: [j, j + 1],
          settled: settledFrom(lastUnsorted + 1),
          caption: willSwap
            ? `Bandingkan posisi ${j} (${fmt(leftValue)}) dengan posisi ${j + 1} (${fmt(rightValue)}). Karena ${fmt(leftValue)} lebih besar, urutannya salah — harus ditukar.`
            : `Bandingkan posisi ${j} (${fmt(leftValue)}) dengan posisi ${j + 1} (${fmt(rightValue)}). Urutannya sudah benar, tidak perlu ditukar.`,
        }
      );

      if (willSwap) {
        const tmp = working[j];
        working[j] = working[j + 1];
        working[j + 1] = tmp;
        swapCount++;
        swappedInPass = true;

        record(
          {
            operation: 'swap',
            indices: [j, j + 1],
            comparedValues: [rightValue, leftValue],
            decision: `Tukar posisi ${j} dan ${j + 1}`,
            result: `${rightValue} pindah ke posisi ${j}`,
          },
          {
            order: orderOf(),
            active: [],
            taken: [j, j + 1],
            settled: settledFrom(lastUnsorted + 1),
            caption: `Tukar! ${fmt(rightValue)} pindah ke posisi ${j}, dan ${fmt(leftValue)} bergeser ke posisi ${j + 1}.`,
          }
        );
      }
    }

    const settledStart = n - 1 - pass;
    record(
      {
        operation: 'pass_complete',
        decision: `Putaran ${pass + 1} selesai`,
        result: `Nilai terbesar terkunci di posisi ${settledStart}`,
      },
      {
        order: orderOf(),
        active: [],
        settled: settledFrom(settledStart),
        caption: `Putaran ${pass + 1} selesai — nilai terbesar sudah sampai di ujung kanan dan terkunci di posisi ${settledStart}. Posisi yang hijau tua tidak perlu disentuh lagi.`,
      }
    );

    if (!swappedInPass) {
      break; // already sorted — early exit
    }
  }

  record(
    {
      operation: 'complete',
      decision: 'Sorting selesai',
      result: `Total ${comparisonCount} perbandingan, ${swapCount} penukaran`,
    },
    {
      order: orderOf(),
      active: [],
      settled: settledFrom(0),
      caption: `Selesai! Semua data sudah terurut dari nilai terkecil ke terbesar, dengan ${comparisonCount} kali perbandingan dan ${swapCount} kali penukaran.`,
    }
  );

  return {
    sorted: working,
    log,
    frames,
    comparisons: comparisonCount,
    merges: 0,
    swaps: swapCount,
  };
}
