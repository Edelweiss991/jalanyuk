import type { LogStep, SearchResult } from './types';

/**
 * Linear search implementation with detailed execution logging
 */
export function linearSearchWithLog<T>(
  items: T[],
  predicate: (item: T) => boolean,
  targetLabel: string,
  valueOf: (item: T) => string | number,
  dataType: string
): SearchResult {
  const log: LogStep[] = [];
  let stepCounter = 0;
  let comparisonCount = 0;

  log.push({
    step: ++stepCounter,
    timestamp: new Date().toISOString(),
    algorithm: 'linearSearch',
    dataType,
    operation: 'start',
    decision: `Mencari "${targetLabel}" di ${items.length} elemen`,
    result: 'Memulai pencarian linear',
  });

  // Manual linear search - no find/indexOf
  let foundIndex = -1;
  
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const value = valueOf(item);
    const matches = predicate(item);
    
    comparisonCount++;

    log.push({
      step: ++stepCounter,
      timestamp: new Date().toISOString(),
      algorithm: 'linearSearch',
      dataType,
      operation: 'compare',
      indices: [i],
      comparedValues: [value],
      decision: matches
        ? `"${value}" cocok dengan kriteria pencarian`
        : `"${value}" tidak cocok dengan kriteria pencarian`,
      result: matches ? 'DITEMUKAN' : 'Lanjut ke elemen berikutnya',
    });

    if (matches) {
      foundIndex = i;
      break;
    }
  }

  const found = foundIndex !== -1;

  log.push({
    step: ++stepCounter,
    timestamp: new Date().toISOString(),
    algorithm: 'linearSearch',
    dataType,
    operation: 'complete',
    decision: found
      ? `Elemen ditemukan di indeks ${foundIndex}`
      : 'Elemen tidak ditemukan',
    result: `Total ${comparisonCount} perbandingan`,
  });

  return {
    found,
    index: foundIndex,
    log,
    comparisons: comparisonCount,
  };
}
