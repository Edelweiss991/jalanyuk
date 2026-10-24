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
 * One visual frame of an algorithm execution, aligned 1:1 with the log step
 * of the same index. `order` holds indices into the response's `items` array
 * in display order at this step; all other position fields refer to display
 * positions (0-based, matching the index labels under the chart bars/cells).
 */
export interface VisualFrame {
  order: number[];
  /** Positions currently being compared / examined (orange). */
  active: number[];
  /** Positions whose element was just placed / taken at this step (green flash). */
  taken?: number[];
  /** Positions already in their final place (deep green). */
  settled?: number[];
  /** Positions already examined and ruled out (faded). */
  checked?: number[];
  /** Active segment [start, end] being divided / merged / searched. */
  range?: [number, number] | null;
  /** Binary-search boundary markers, in display positions. */
  markers?: { low?: number; mid?: number; high?: number };
  /** Display position where the target was found. */
  foundIndex?: number;
  /** Plain-language Indonesian explanation of this step, for the caption box. */
  caption: string;
}

/**
 * Result of a sorting algorithm with execution log
 */
export interface SortResult<T> {
  sorted: T[];
  log: LogStep[];
  frames: VisualFrame[];
  comparisons: number;
  merges: number;
  swaps?: number;
}

/**
 * Result of a search algorithm with execution log
 */
export interface SearchResult {
  found: boolean;
  index: number;
  log: LogStep[];
  frames: VisualFrame[];
  comparisons: number;
}
