import type { LogStep, SearchResult } from './types';
import { AppError } from '../utils/errors';

/**
 * Binary search implementation with detailed execution logging
 * Requires array to be sorted in ascending order by the key function
 */
export function binarySearchWithLog<T>(
  sortedItems: T[],
  key: (item: T) => number,
  target: number,
  dataType: string
): SearchResult {
  const log: LogStep[] = [];
  let stepCounter = 0;
  let comparisonCount = 0;

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

  log.push({
    step: ++stepCounter,
    timestamp: new Date().toISOString(),
    algorithm: 'binarySearch',
    dataType,
    operation: 'start',
    decision: `Mencari nilai ${target} di ${sortedItems.length} elemen terurut`,
    result: 'Memulai pencarian biner',
  });

  let low = 0;
  let high = sortedItems.length - 1;
  let foundIndex = -1;

  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    const midValue = key(sortedItems[mid]);

    comparisonCount++;

    log.push({
      step: ++stepCounter,
      timestamp: new Date().toISOString(),
      algorithm: 'binarySearch',
      dataType,
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
    });

    if (midValue === target) {
      foundIndex = mid;
      break;
    } else if (midValue < target) {
      low = mid + 1;
      log.push({
        step: ++stepCounter,
        timestamp: new Date().toISOString(),
        algorithm: 'binarySearch',
        dataType,
        operation: 'adjust',
        low,
        high,
        decision: `Update low = ${low}`,
        result: `Rentang baru: [${low}, ${high}]`,
      });
    } else {
      high = mid - 1;
      log.push({
        step: ++stepCounter,
        timestamp: new Date().toISOString(),
        algorithm: 'binarySearch',
        dataType,
        operation: 'adjust',
        low,
        high,
        decision: `Update high = ${high}`,
        result: `Rentang baru: [${low}, ${high}]`,
      });
    }
  }

  const found = foundIndex !== -1;

  log.push({
    step: ++stepCounter,
    timestamp: new Date().toISOString(),
    algorithm: 'binarySearch',
    dataType,
    operation: 'complete',
    decision: found
      ? `Nilai ditemukan di indeks ${foundIndex}`
      : 'Nilai tidak ditemukan',
    result: `Total ${comparisonCount} perbandingan`,
  });

  return {
    found,
    index: foundIndex,
    log,
    comparisons: comparisonCount,
  };
}
