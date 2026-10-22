import type { LogStep, SortResult } from './types';

/**
 * Merge sort implementation with detailed execution logging
 */
export function mergeSortWithLog<T>(
  items: T[],
  key: (item: T) => number | string,
  dataType: string
): SortResult<T> {
  const log: LogStep[] = [];
  let stepCounter = 0;
  let comparisonCount = 0;
  let mergeCount = 0;

  // Handle trivial cases
  if (items.length === 0) {
    log.push({
      step: ++stepCounter,
      timestamp: new Date().toISOString(),
      algorithm: 'mergeSort',
      dataType,
      operation: 'trivial',
      decision: 'Array kosong',
      result: 'Tidak ada sorting diperlukan',
    });
    return { sorted: [], log, comparisons: 0, merges: 0 };
  }

  if (items.length === 1) {
    log.push({
      step: ++stepCounter,
      timestamp: new Date().toISOString(),
      algorithm: 'mergeSort',
      dataType,
      operation: 'trivial',
      decision: 'Array dengan 1 elemen',
      result: 'Sudah terurut',
    });
    return { sorted: [...items], log, comparisons: 0, merges: 0 };
  }

  /**
   * Recursive merge sort with logging
   */
  function sort(arr: T[], offset: number): T[] {
    if (arr.length <= 1) {
      return arr;
    }

    const mid = Math.floor(arr.length / 2);
    
    log.push({
      step: ++stepCounter,
      timestamp: new Date().toISOString(),
      algorithm: 'mergeSort',
      dataType,
      operation: 'divide',
      low: offset,
      mid: offset + mid,
      high: offset + arr.length - 1,
      decision: `Membagi array menjadi 2 bagian di indeks ${offset + mid}`,
      result: `Kiri: ${arr.length - mid} elemen, Kanan: ${mid} elemen`,
    });

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

    mergeCount++;

    log.push({
      step: ++stepCounter,
      timestamp: new Date().toISOString(),
      algorithm: 'mergeSort',
      dataType,
      operation: 'merge',
      decision: `Memulai merge ${left.length} elemen kiri dengan ${right.length} elemen kanan`,
      result: `Offset global: ${offset}`,
    });

    while (leftIdx < left.length && rightIdx < right.length) {
      const leftValue = key(left[leftIdx]);
      const rightValue = key(right[rightIdx]);
      const globalLeftIdx = offset + leftIdx;
      const globalRightIdx = offset + left.length + rightIdx;

      comparisonCount++;

      const leftSmaller = leftValue <= rightValue;

      log.push({
        step: ++stepCounter,
        timestamp: new Date().toISOString(),
        algorithm: 'mergeSort',
        dataType,
        operation: 'compare',
        indices: [globalLeftIdx, globalRightIdx],
        comparedValues: [leftValue, rightValue],
        decision: leftSmaller
          ? `${leftValue} ≤ ${rightValue}, ambil dari kiri`
          : `${leftValue} > ${rightValue}, ambil dari kanan`,
        result: leftSmaller
          ? `Tambahkan elemen kiri (indeks ${globalLeftIdx})`
          : `Tambahkan elemen kanan (indeks ${globalRightIdx})`,
      });

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
      log.push({
        step: ++stepCounter,
        timestamp: new Date().toISOString(),
        algorithm: 'mergeSort',
        dataType,
        operation: 'copy',
        indices: [globalLeftIdx],
        decision: 'Kanan habis, salin sisa kiri',
        result: `Tambahkan elemen kiri (indeks ${globalLeftIdx})`,
      });
      result.push(left[leftIdx]);
      leftIdx++;
    }

    // Copy remaining elements from right
    while (rightIdx < right.length) {
      const globalRightIdx = offset + left.length + rightIdx;
      log.push({
        step: ++stepCounter,
        timestamp: new Date().toISOString(),
        algorithm: 'mergeSort',
        dataType,
        operation: 'copy',
        indices: [globalRightIdx],
        decision: 'Kiri habis, salin sisa kanan',
        result: `Tambahkan elemen kanan (indeks ${globalRightIdx})`,
      });
      result.push(right[rightIdx]);
      rightIdx++;
    }

    log.push({
      step: ++stepCounter,
      timestamp: new Date().toISOString(),
      algorithm: 'mergeSort',
      dataType,
      operation: 'merge_complete',
      decision: `Merge selesai untuk rentang offset ${offset}`,
      result: `Hasil: ${result.length} elemen terurut`,
    });

    return result;
  }

  const sorted = sort(items, 0);

  log.push({
    step: ++stepCounter,
    timestamp: new Date().toISOString(),
    algorithm: 'mergeSort',
    dataType,
    operation: 'complete',
    decision: 'Sorting selesai',
    result: `Total ${comparisonCount} perbandingan, ${mergeCount} operasi merge`,
  });

  return {
    sorted,
    log,
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
