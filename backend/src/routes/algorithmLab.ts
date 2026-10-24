import { Router } from 'express';
import { z } from 'zod';
import { requireAuth, requireAdmin } from '../middleware/auth';
import { asyncHandler } from '../utils/asyncHandler';
import { ok } from '../utils/response';
import { badRequest } from '../utils/errors';
import { mergeSortWithLog, mergeSort } from '../algorithms/mergeSort';
import { bubbleSortWithLog } from '../algorithms/bubbleSort';
import { linearSearchWithLog } from '../algorithms/linearSearch';
import { binarySearchWithLog } from '../algorithms/binarySearch';
import { getLabDataset, getLabSearchPool, runCDemo } from '../services/cDemo';
import type { LogStep } from '../algorithms/types';

const router = Router();

// All routes require authentication and admin role
router.use(requireAuth, requireAdmin);

/**
 * GET /api/algorithm-lab/dataset
 * Get dataset for algorithm demonstrations
 */
router.get(
  '/dataset',
  asyncHandler(async (_req, res) => {
    const { items, prices } = await getLabDataset();

    return ok(res, {
      items,
      demoArray: prices,
    });
  })
);

/**
 * GET /api/algorithm-lab/array
 * Visualize dataset as raw array
 */
router.get(
  '/array',
  asyncHandler(async (_req, res) => {
    const { items } = await getLabDataset();

    const arrayVisualization = items.map((item, index) => ({
      index,
      id: item.id,
      label: item.label,
      price: item.price,
      departureMinutes: item.departureMinutes,
    }));

    return ok(res, {
      before: arrayVisualization,
    });
  })
);

/**
 * POST /api/algorithm-lab/sort
 * Execute bubble sort or merge sort with logging + visual frames
 */
const sortSchema = z.object({
  dataType: z.enum(['BUS', 'TRAIN']),
  key: z.enum(['price', 'departureMinutes', 'duration', 'label']),
  algorithm: z.enum(['merge', 'bubble']).default('merge'),
});

router.post(
  '/sort',
  asyncHandler(async (req, res) => {
    const parsed = sortSchema.safeParse(req.body);
    if (!parsed.success) {
      throw badRequest('VALIDATION_ERROR', parsed.error.errors[0].message);
    }

    const { dataType, key, algorithm } = parsed.data;

    const { items } = await getLabDataset();

    // Filter by transport type
    const filtered = items.filter((item) => item.transportType === dataType);

    // Define key function
    const keyFn = (item: any) => {
      if (key === 'duration') {
        return item.durationMinutes;
      }
      return item[key];
    };

    // Human-readable value formatter used in the visualizer captions
    const formatValue = (value: number | string): string => {
      if (key === 'price') return `Rp${Number(value).toLocaleString('id-ID')}`;
      if (key === 'duration') return `${value} menit`;
      if (key === 'departureMinutes') {
        const m = Number(value);
        return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
      }
      return String(value);
    };

    const result =
      algorithm === 'bubble'
        ? bubbleSortWithLog(filtered, keyFn, dataType, formatValue)
        : mergeSortWithLog(filtered, keyFn, dataType, formatValue);

    return ok(res, {
      algorithm,
      sorted: result.sorted,
      items: filtered,
      log: result.log,
      frames: result.frames,
      comparisons: result.comparisons,
      merges: result.merges,
      swaps: result.swaps ?? 0,
      complexity:
        algorithm === 'bubble'
          ? { time: 'O(n²)', space: 'O(1)' }
          : { time: 'O(n log n)', space: 'O(n)' },
    });
  })
);

/**
 * POST /api/algorithm-lab/search/linear
 * Execute linear search with logging
 */
const linearSearchSchema = z.object({
  dataType: z.enum(['BUS', 'TRAIN']),
  query: z.string().min(1),
});

router.post(
  '/search/linear',
  asyncHandler(async (req, res) => {
    const parsed = linearSearchSchema.safeParse(req.body);
    if (!parsed.success) {
      throw badRequest('VALIDATION_ERROR', parsed.error.errors[0].message);
    }

    const { dataType, query } = parsed.data;

    // Linear search runs on the LARGE pool of real schedules (up to 500),
    // not the small visualization sample — scanning a long list one by one
    // is the whole point of O(n).
    const filtered = await getLabSearchPool(dataType, 500);

    // Search predicate (case-insensitive contains)
    const queryLower = query.toLowerCase();
    const predicate = (item: any) => {
      const label = item.label.toLowerCase();
      const origin = item.origin.toLowerCase();
      const destination = item.destination.toLowerCase();

      return (
        label.includes(queryLower) ||
        origin.includes(queryLower) ||
        destination.includes(queryLower)
      );
    };

    const valueOf = (item: any) => `${item.label} (${item.origin} → ${item.destination})`;

    const result = linearSearchWithLog(filtered, predicate, query, valueOf, dataType);

    return ok(res, {
      found: result.found,
      index: result.index,
      item: result.found ? filtered[result.index] : null,
      items: filtered,
      datasetSize: filtered.length,
      log: result.log,
      frames: result.frames,
      comparisons: result.comparisons,
    });
  })
);

/**
 * POST /api/algorithm-lab/search/binary
 * Execute binary search with logging
 */
const binarySearchSchema = z.object({
  dataType: z.enum(['BUS', 'TRAIN']),
  targetPrice: z.number().positive(),
});

router.post(
  '/search/binary',
  asyncHandler(async (req, res) => {
    const parsed = binarySearchSchema.safeParse(req.body);
    if (!parsed.success) {
      throw badRequest('VALIDATION_ERROR', parsed.error.errors[0].message);
    }

    const { dataType, targetPrice } = parsed.data;

    const { items } = await getLabDataset();

    // Filter by transport type
    const filtered = items.filter((item) => item.transportType === dataType);

    // Sort by price first using internal merge sort
    const sorted = mergeSort(filtered, (item) => item.price);

    // Perform binary search
    const result = binarySearchWithLog(
      sorted,
      (item) => item.price,
      targetPrice,
      dataType,
      (v) => `Rp${v.toLocaleString('id-ID')}`
    );

    return ok(res, {
      sortedArray: sorted,
      result: {
        found: result.found,
        index: result.index,
        item: result.found ? sorted[result.index] : null,
        comparisons: result.comparisons,
      },
      log: result.log,
      frames: result.frames,
    });
  })
);

/**
 * POST /api/algorithm-lab/pointer
 * Run C pointer demonstration
 */
router.post(
  '/pointer',
  asyncHandler(async (_req, res) => {
    const { items } = await getLabDataset();

    // Take up to 10 items for demo
    const demoItems = items.slice(0, 10).map((item) => ({
      id: item.id,
      origin: item.origin,
      destination: item.destination,
      departureMinutes: item.departureMinutes,
      price: item.price,
    }));

    const result = await runCDemo('pointer', demoItems);

    return ok(res, result);
  })
);

/**
 * POST /api/algorithm-lab/struct
 * Run C struct demonstration
 */
router.post(
  '/struct',
  asyncHandler(async (_req, res) => {
    const { items } = await getLabDataset();

    // Take up to 10 items for demo
    const demoItems = items.slice(0, 10).map((item) => ({
      id: item.id,
      origin: item.origin,
      destination: item.destination,
      departureMinutes: item.departureMinutes,
      price: item.price,
    }));

    const result = await runCDemo('struct', demoItems);

    return ok(res, result);
  })
);

/**
 * POST /api/algorithm-lab/export
 * Export algorithm execution log
 */
const exportSchema = z.object({
  log: z.array(z.any()),
  format: z.enum(['json', 'csv']),
});

router.post(
  '/export',
  asyncHandler(async (req, res) => {
    const parsed = exportSchema.safeParse(req.body);
    if (!parsed.success) {
      throw badRequest('VALIDATION_ERROR', parsed.error.errors[0].message);
    }

    const { log, format } = parsed.data as { log: LogStep[]; format: 'json' | 'csv' };

    if (!Array.isArray(log)) {
      throw badRequest('INVALID_LOG', 'Log harus berupa array');
    }

    let content: string;
    let filename: string;

    if (format === 'json') {
      content = JSON.stringify(log, null, 2);
      filename = `algorithm-log-${Date.now()}.json`;
    } else {
      // CSV format
      const headers = ['step', 'timestamp', 'algorithm', 'operation', 'decision', 'result'];
      const rows = log.map((step) => [
        step.step,
        step.timestamp,
        step.algorithm,
        step.operation,
        step.decision.replace(/,/g, ';'),
        step.result.replace(/,/g, ';'),
      ]);

      content = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
      filename = `algorithm-log-${Date.now()}.csv`;
    }

    return ok(res, {
      content,
      filename,
    });
  })
);

export default router;
