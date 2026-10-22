/**
 * Log step for algorithm execution tracking
 */
export interface LogStep {
  step: number;
  timestamp: string; // ISO 8601
  algorithm: string;
  dataType: string;
  operation: string;
  indices?: number[];
  comparedValues?: (string | number)[];
  low?: number;
  mid?: number;
  high?: number;
  decision: string;
  result: string;
}

/**
 * Result of a sorting algorithm with execution log
 */
export interface SortResult<T> {
  sorted: T[];
  log: LogStep[];
  comparisons: number;
  merges: number;
}

/**
 * Result of a search algorithm with execution log
 */
export interface SearchResult {
  found: boolean;
  index: number;
  log: LogStep[];
  comparisons: number;
}
