import { execFile } from 'child_process';
import { promisify } from 'util';
import { existsSync } from 'fs';
import path from 'path';
import { AppError } from '../utils/errors';
import { prisma } from '../config/db';
import { env } from '../config/env';

const execFilePromise = promisify(execFile);

interface CDemoRow {
  id: number;
  origin: string;
  destination: string;
  departureMinutes: number;
  price: number;
}

interface CDemoResult {
  mode: 'pointer' | 'struct';
  rawOutput: string;
  lines: string[];
  addresses: string[];
  rows: CDemoRow[];
}

interface LabDatasetItem {
  id: number;
  transportType: 'BUS' | 'TRAIN';
  label: string;
  origin: string;
  destination: string;
  departureMinutes: number;
  durationMinutes: number;
  price: number;
}

let compilePromise: Promise<void> | null = null;

let resolvedDemoDir: string | null = null;

/**
 * Resolve the algorithms-c directory. The layout differs between dev
 * (tsx, sources under backend/src) and production builds (compiled output
 * under backend/dist/src, one level deeper), so walk a few candidates and
 * pick the first that actually contains the C sources or the binary.
 * An explicit C_DEMO_DIR env var always wins.
 */
function resolveDemoDir(): string {
  if (resolvedDemoDir) {
    return resolvedDemoDir;
  }

  const candidates = [
    ...(process.env.C_DEMO_DIR ? [process.env.C_DEMO_DIR] : []),
    env.C_DEMO_DIR,
    path.resolve(__dirname, '../../../algorithms-c'),
    path.resolve(__dirname, '../../../../algorithms-c'),
    path.resolve(process.cwd(), 'algorithms-c'),
    path.resolve(process.cwd(), '../algorithms-c'),
  ];

  for (const dir of candidates) {
    if (
      existsSync(path.join(dir, 'src', 'main.c')) ||
      existsSync(path.join(dir, 'jalanyuk_algorithms'))
    ) {
      resolvedDemoDir = dir;
      return dir;
    }
  }

  resolvedDemoDir = env.C_DEMO_DIR;
  return resolvedDemoDir;
}

/**
 * Resolve path to C demo binary
 */
function resolveCDemoBin(): string {
  return path.join(resolveDemoDir(), 'jalanyuk_algorithms');
}

/**
 * Ensure C demo is compiled
 */
export async function ensureCompiled(): Promise<void> {
  const binPath = resolveCDemoBin();

  if (existsSync(binPath)) {
    return;
  }

  // Only compile once even if multiple requests arrive
  if (compilePromise) {
    return compilePromise;
  }

  compilePromise = (async () => {
    try {
      const demoDir = resolveDemoDir();
      const sourceFiles = ['main.c', 'pointer_demo.c', 'struct_demo.c'].map((file) =>
        path.join(demoDir, 'src', file)
      );

      const args = [
        '-o',
        binPath,
        ...sourceFiles,
        '-std=c11',
        '-Wall',
        '-Wextra',
      ];

      await execFilePromise('gcc', args, {
        cwd: demoDir,
        timeout: 30000,
      });
    } catch (error) {
      compilePromise = null;
      throw new AppError(
        500,
        'C_COMPILATION_FAILED',
        `Gagal mengompilasi C demo: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  })();

  return compilePromise;
}

/**
 * Sanitize string for CSV output
 */
function sanitizeString(value: string): string {
  // Only allow alphanumeric, space, period, apostrophe, hyphen
  return value.replace(/[^A-Za-z0-9 .'\-]/g, '').substring(0, 60);
}

/**
 * Validate and sanitize a row
 */
function validateRow(row: CDemoRow, index: number): CDemoRow {
  if (typeof row.id !== 'number' || row.id < 1 || row.id > 1000000 || !Number.isInteger(row.id)) {
    throw new AppError(
      400,
      'INVALID_ROW_ID',
      `Baris ${index}: id harus integer antara 1 dan 1000000`
    );
  }

  if (typeof row.origin !== 'string' || !row.origin.trim()) {
    throw new AppError(400, 'INVALID_ROW_ORIGIN', `Baris ${index}: origin tidak valid`);
  }

  if (typeof row.destination !== 'string' || !row.destination.trim()) {
    throw new AppError(400, 'INVALID_ROW_DESTINATION', `Baris ${index}: destination tidak valid`);
  }

  if (
    typeof row.departureMinutes !== 'number' ||
    row.departureMinutes < 0 ||
    row.departureMinutes > 1439 ||
    !Number.isInteger(row.departureMinutes)
  ) {
    throw new AppError(
      400,
      'INVALID_ROW_DEPARTURE',
      `Baris ${index}: departureMinutes harus integer antara 0 dan 1439`
    );
  }

  if (typeof row.price !== 'number' || row.price < 0 || row.price > 100000000) {
    throw new AppError(
      400,
      'INVALID_ROW_PRICE',
      `Baris ${index}: price harus number antara 0 dan 100000000`
    );
  }

  return {
    id: row.id,
    origin: sanitizeString(row.origin),
    destination: sanitizeString(row.destination),
    departureMinutes: row.departureMinutes,
    price: row.price,
  };
}

/**
 * Run C demo with validated input
 */
export async function runCDemo(
  mode: 'pointer' | 'struct',
  rows: CDemoRow[]
): Promise<CDemoResult> {
  if (!Array.isArray(rows) || rows.length === 0) {
    throw new AppError(400, 'EMPTY_ROWS', 'Rows harus array tidak kosong');
  }

  if (rows.length > 50) {
    throw new AppError(400, 'TOO_MANY_ROWS', 'Maksimal 50 baris');
  }

  await ensureCompiled();

  const validatedRows = rows.map((row, idx) => validateRow(row, idx));

  // Build CSV input
  const csvLines = [
    ...validatedRows.map(
      (row) =>
        `${row.id},${row.origin},${row.destination},${row.departureMinutes},${row.price}`
    ),
  ];
  const csvInput = csvLines.join('\n');

  const binPath = resolveCDemoBin();

  try {
    const stdout = await new Promise<string>((resolve, reject) => {
      const child = execFile(
        binPath,
        [mode],
        { timeout: env.C_DEMO_TIMEOUT_MS, maxBuffer: 1024 * 1024 },
        (err, out) => (err ? reject(err) : resolve(out as unknown as string))
      );
      child.stdin?.end(csvInput);
    });

    const lines = stdout.split('\n').filter((line) => line.trim());

    // Extract memory addresses
    const addressPattern = /0x[0-9a-fA-F]+/g;
    const addressSet = new Set<string>();
    stdout.match(addressPattern)?.forEach((addr) => addressSet.add(addr));

    return {
      mode,
      rawOutput: stdout,
      lines,
      addresses: Array.from(addressSet),
      rows: validatedRows,
    };
  } catch (error: any) {
    if (error.killed) {
      throw new AppError(500, 'C_DEMO_TIMEOUT', `C demo timeout setelah ${env.C_DEMO_TIMEOUT_MS}ms`);
    }

    throw new AppError(
      500,
      'C_DEMO_EXECUTION_FAILED',
      `Gagal menjalankan C demo: ${error.message}`
    );
  }
}

/**
 * Generate stable numeric ID from CUID
 */
function stableNumericId(cuid: string): number {
  let sum = 0;
  for (let i = 0; i < cuid.length; i++) {
    sum += cuid.charCodeAt(i);
  }
  return Math.abs(sum);
}

/**
 * Get dataset for Algorithm Lab
 */
export async function getLabDataset(): Promise<{
  items: LabDatasetItem[];
  prices: number[];
}> {
  const [busSchedules, trainSchedules] = await Promise.all([
    prisma.busSchedule.findMany({
      take: 12,
      include: {
        route: {
          include: {
            originTerminal: true,
            destinationTerminal: true,
          },
        },
        operator: true,
      },
      orderBy: { departureTime: 'asc' },
    }),
    prisma.trainSchedule.findMany({
      take: 12,
      include: {
        route: {
          include: {
            originStation: true,
            destinationStation: true,
          },
        },
        train: {
          include: {
            operator: true,
          },
        },
      },
      orderBy: { departureTime: 'asc' },
    }),
  ]);

  const items: LabDatasetItem[] = [];
  const prices: number[] = [];

  // Process bus schedules
  for (const schedule of busSchedules) {
    const departureDate = new Date(schedule.departureTime);
    const departureMinutes = departureDate.getHours() * 60 + departureDate.getMinutes();

    const item: LabDatasetItem = {
      id: stableNumericId(schedule.id),
      transportType: 'BUS',
      label: schedule.operator.name,
      origin: schedule.route.originTerminal.city,
      destination: schedule.route.destinationTerminal.city,
      departureMinutes,
      durationMinutes: schedule.route.durationMinutes,
      price: schedule.price,
    };

    items.push(item);
    prices.push(schedule.price);
  }

  // Process train schedules
  for (const schedule of trainSchedules) {
    const departureDate = new Date(schedule.departureTime);
    const departureMinutes = departureDate.getHours() * 60 + departureDate.getMinutes();

    const item: LabDatasetItem = {
      id: stableNumericId(schedule.id),
      transportType: 'TRAIN',
      label: schedule.train.name,
      origin: schedule.route.originStation.city,
      destination: schedule.route.destinationStation.city,
      departureMinutes,
      durationMinutes: schedule.route.durationMinutes,
      price: schedule.price,
    };

    items.push(item);
    prices.push(schedule.price);
  }

  return { items, prices };
}
