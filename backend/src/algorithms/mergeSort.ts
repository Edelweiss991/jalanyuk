import type { LogStep, SortResult, VisualFrame } from './types';

/**
 * Merge sort implementation with detailed execution logging.
 * Also produces one VisualFrame per log step for the bar-chart visualizer:
 * a `working` mirror of the array is maintained so frames can show the real
 * element order at every step (segments are written back when a merge
 * completes, exactly like the recursive result arrays).
 */
export function mergeSortWithLog<T>(
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
  let mergeCount = 0;

  const working: T[] = [...items];
  const orderOf = () => working.map((w) => items.indexOf(w));

  const record = (
    entry: Omit<LogStep, 'step' | 'timestamp' | 'algorithm' | 'dataType'>,
    frame: VisualFrame
  ) => {
    log.push({
      step: ++stepCounter,
      timestamp: new Date().toISOString(),
      algorithm: 'mergeSort',
      dataType,
      ...entry,
    });
    frames.push(frame);
  };

  // Handle trivial cases
  if (items.length === 0) {
    record(
      { operation: 'trivial', decision: 'Array kosong', result: 'Tidak ada sorting diperlukan' },
      { order: [], active: [], caption: 'Tidak ada data untuk diurutkan.' }
    );
    return { sorted: [], log, frames, comparisons: 0, merges: 0 };
  }

  if (items.length === 1) {
    record(
      { operation: 'trivial', decision: 'Array dengan 1 elemen', result: 'Sudah terurut' },
      {
        order: orderOf(),
        active: [],
        settled: [0],
        caption: 'Hanya ada satu data — sudah pasti terurut.',
      }
    );
    return { sorted: [...items], log, frames, comparisons: 0, merges: 0 };
  }

  /**
   * Recursive merge sort with logging
   */
  function sort(arr: T[], offset: number): T[] {
    if (arr.length <= 1) {
      return arr;
    }

    const mid = Math.floor(arr.length / 2);
    const high = offset + arr.length - 1;

    record(
      {
        operation: 'divide',
        low: offset,
        mid: offset + mid,
        high,
        decision: `Membagi array menjadi 2 bagian di indeks ${offset + mid}`,
        result: `Kiri: ${mid} elemen, Kanan: ${arr.length - mid} elemen`,
      },
      {
        order: orderOf(),
        active: [],
        range: [offset, high],
        caption: `Bagi data posisi ${offset} sampai ${high} menjadi dua bagian: kiri posisi ${offset} sampai ${offset + mid - 1}, kanan posisi ${offset + mid} sampai ${high}.`,
      }
    );

    const left = sort(arr.slice(0, mid), offset);
    const right = sort(arr.slice(mid), offset + mid);

    return merge(left, right, offset);
  }

  /**
   * Merge two sorted arrays with logging
   */
  function merge(left: T[], right: T[], offset: number): T[] {
    const result: T[] = [];
    let leftIdx = 0;
    let rightIdx = 0;
    const end = offset + left.length + right.length - 1;
    const segment: [number, number] = [offset, end];

    mergeCount++;

    record(
      {
        operation: 'merge',
        decision: `Memulai merge ${left.length} elemen kiri dengan ${right.length} elemen kanan`,
        result: `Offset global: ${offset}`,
      },
      {
        order: orderOf(),
        active: [],
        range: segment,
        caption: `Mulai menggabungkan posisi ${offset} sampai ${end}. Dari ujung kiri dan ujung kanan, selalu ambil nilai yang lebih kecil.`,
      }
    );

    while (leftIdx < left.length && rightIdx < right.length) {
      const leftValue = key(left[leftIdx]);
      const rightValue = key(right[rightIdx]);
      const globalLeftIdx = offset + leftIdx;
      const globalRightIdx = offset + left.length + rightIdx;

      comparisonCount++;

      const leftSmaller = leftValue <= rightValue;
      const takenIdx = leftSmaller ? globalLeftIdx : globalRightIdx;
      const takenValue = leftSmaller ? leftValue : rightValue;

      record(
        {
          operation: 'compare',
          indices: [globalLeftIdx, globalRightIdx],
          comparedValues: [leftValue, rightValue],
          decision: leftSmaller
            ? `${leftValue} ≤ ${rightValue}, ambil dari kiri`
            : `${leftValue} > ${rightValue}, ambil dari kanan`,
          result: leftSmaller
            ? `Tambahkan elemen kiri (indeks ${globalLeftIdx})`
            : `Tambahkan elemen kanan (indeks ${globalRightIdx})`,
        },
        {
          order: orderOf(),
          active: [globalLeftIdx, globalRightIdx],
          taken: [takenIdx],
          range: segment,
          caption: `Bandingkan ${fmt(leftValue)} di posisi ${globalLeftIdx} dengan ${fmt(rightValue)} di posisi ${globalRightIdx}. Yang lebih kecil diambil dulu: ${fmt(takenValue)}.`,
        }
      );

      if (leftSmaller) {
        result.push(left[leftIdx]);
        leftIdx++;
      } else {
        result.push(right[rightIdx]);
        rightIdx++;
      }
    }

    // Copy remaining elements from left
    while (leftIdx < left.length) {
      const globalLeftIdx = offset + leftIdx;
      record(
        {
          operation: 'copy',
          indices: [globalLeftIdx],
          decision: 'Kanan habis, salin sisa kiri',
          result: `Tambahkan elemen kiri (indeks ${globalLeftIdx})`,
        },
        {
          order: orderOf(),
          active: [globalLeftIdx],
          taken: [globalLeftIdx],
          range: segment,
          caption: `Sisi kanan sudah habis. Salin sisanya: ${fmt(key(left[leftIdx]))} di posisi ${globalLeftIdx} ikut masuk ke hasil gabungan.`,
        }
      );
      result.push(left[leftIdx]);
      leftIdx++;
    }

    // Copy remaining elements from right
    while (rightIdx < right.length) {
      const globalRightIdx = offset + left.length + rightIdx;
      record(
        {
          operation: 'copy',
          indices: [globalRightIdx],
          decision: 'Kiri habis, salin sisa kanan',
          result: `Tambahkan elemen kanan (indeks ${globalRightIdx})`,
        },
        {
          order: orderOf(),
          active: [globalRightIdx],
          taken: [globalRightIdx],
          range: segment,
          caption: `Sisi kiri sudah habis. Salin sisanya: ${fmt(key(right[rightIdx]))} di posisi ${globalRightIdx} ikut masuk ke hasil gabungan.`,
        }
      );
      result.push(right[rightIdx]);
      rightIdx++;
    }

    // Write the merged segment back into the working mirror before framing,
    // so the bars show the segment in its new, sorted order.
    for (let i = 0; i < result.length; i++) {
      working[offset + i] = result[i];
    }

    record(
      {
        operation: 'merge_complete',
        decision: `Merge selesai untuk rentang offset ${offset}`,
        result: `Hasil: ${result.length} elemen terurut`,
      },
      {
        order: orderOf(),
        active: [],
        taken: result.map((_, i) => offset + i),
        range: segment,
        caption: `Posisi ${offset} sampai ${end} selesai digabung — di rentang ini urutannya sekarang sudah benar.`,
      }
    );

    return result;
  }

  const sorted = sort([...items], 0);

  record(
    {
      operation: 'complete',
      decision: 'Sorting selesai',
      result: `Total ${comparisonCount} perbandingan, ${mergeCount} operasi merge`,
    },
    {
      order: orderOf(),
      active: [],
      settled: items.map((_, i) => i),
      caption: 'Selesai! Semua data sudah terurut dari nilai terkecil ke terbesar.',
    }
  );

  return {
    sorted,
    log,
    frames,
    comparisons: comparisonCount,
    merges: mergeCount,
  };
}

/**
 * Simple merge sort without logging for internal use
 */
export function mergeSort<T>(items: T[], key: (item: T) => number | string): T[] {
  if (items.length <= 1) {
    return items;
  }

  const mid = Math.floor(items.length / 2);
  const left = mergeSort(items.slice(0, mid), key);
  const right = mergeSort(items.slice(mid), key);

  return merge(left, right);

  function merge(left: T[], right: T[]): T[] {
    const result: T[] = [];
    let leftIdx = 0;
    let rightIdx = 0;

    while (leftIdx < left.length && rightIdx < right.length) {
      if (key(left[leftIdx]) <= key(right[rightIdx])) {
        result.push(left[leftIdx]);
        leftIdx++;
      } else {
        result.push(right[rightIdx]);
        rightIdx++;
      }
    }

    return result.concat(left.slice(leftIdx)).concat(right.slice(rightIdx));
  }
}
