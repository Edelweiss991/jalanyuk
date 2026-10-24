import { useEffect, useRef, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Play, Pause, StepForward, FastForward, RotateCcw, Copy, Download, Lightbulb } from 'lucide-react';
import { labApi } from '../services/api';
import { Button, Select, useToast } from './ui';

export interface VisualFrame {
  order?: number[];
  checkedUpTo?: number;
  active: number[];
  taken?: number[];
  settled?: number[];
  checked?: number[];
  range?: [number, number] | null;
  markers?: { low?: number; mid?: number; high?: number };
  foundIndex?: number;
  caption: string;
}

export interface VisLogStep {
  step: number;
  operation: string;
  decision?: string;
  result?: string;
}

type PosState = 'found' | 'active' | 'taken' | 'settled' | 'checked' | 'default';

function posState(frame: VisualFrame, pos: number): PosState {
  if (frame.foundIndex === pos) return 'found';
  if (frame.active?.includes(pos)) return 'active';
  if (frame.taken?.includes(pos)) return 'taken';
  if (frame.settled?.includes(pos)) return 'settled';
  if (frame.checked?.includes(pos)) return 'checked';
  if (frame.checkedUpTo !== undefined && pos < frame.checkedUpTo) return 'checked';
  return 'default';
}

const BAR_COLORS: Record<PosState, string> = {
  found: 'bg-emerald-500 ring-2 ring-emerald-300 dark:ring-emerald-700',
  active: 'bg-orange-500',
  taken: 'bg-emerald-400',
  settled: 'bg-emerald-600',
  checked: 'bg-slate-300 dark:bg-slate-700',
  default: 'bg-blue-500',
};

const CELL_COLORS: Record<PosState, string> = {
  found: 'bg-emerald-500 border-emerald-600 text-white ring-2 ring-emerald-300 dark:ring-emerald-700',
  active: 'bg-orange-500 border-orange-600 text-white ring-2 ring-orange-300 dark:ring-orange-700',
  taken: 'bg-emerald-400 border-emerald-500 text-white',
  settled: 'bg-emerald-600 border-emerald-700 text-white',
  checked: 'bg-slate-200 border-slate-200 text-slate-400 dark:bg-slate-800 dark:border-slate-800 dark:text-slate-500',
  default: 'bg-blue-500 border-blue-600 text-white',
};

function downloadText(content: string, filename: string) {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

interface Props {
  frames: VisualFrame[];
  log: VisLogStep[];
  items: any[];
  variant: 'bars' | 'cells';
  /** Numeric basis for bar heights. */
  barValue: (item: any) => number;
  /** Short value label shown above each bar / inside each cell. */
  formatValue: (item: any) => string;
  /** Operator / train name for tooltips and cell titles. */
  itemLabel: (item: any) => string;
}

/**
 * Step-by-step algorithm visualizer in the style of a classroom bar chart:
 * blue bars (or cells) whose state colors change per step, driven by the
 * real execution frames from the backend, with Indonesian controls, a
 * plain-language caption for the current step, and a synced step log.
 */
export default function StepVisualizer({ frames, log, items, variant, barValue, formatValue, itemLabel }: Props) {
  const { addToast } = useToast();
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(450);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const logBoxRef = useRef<HTMLDivElement | null>(null);
  const currentRowRef = useRef<HTMLDivElement | null>(null);

  const last = Math.max(0, frames.length - 1);

  useEffect(() => {
    setStep(0);
    setPlaying(false);
  }, [frames]);

  useEffect(() => {
    if (playing) {
      timer.current = setInterval(() => {
        setStep((s) => {
          if (s >= last) {
            setPlaying(false);
            return s;
          }
          return s + 1;
        });
      }, speed);
    }
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [playing, speed, last]);

  useEffect(() => {
    currentRowRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [step]);

  const exportMutation = useMutation({
    mutationFn: (format: 'json' | 'csv') => labApi.exportLog(log as any[], format),
    onSuccess: (res) => {
      downloadText(res.content, res.filename);
      addToast('success', 'Log diekspor');
    },
    onError: (e: any) => addToast('error', e?.message || 'Gagal mengekspor log'),
  });

  const copyLog = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(log, null, 2));
      addToast('success', 'Log disalin ke clipboard');
    } catch {
      addToast('error', 'Gagal menyalin log');
    }
  };

  if (!frames || frames.length === 0 || !items || items.length === 0) return null;

  const frame = frames[Math.min(step, last)];
  const maxValue = Math.max(1, ...items.map((it) => barValue(it)));
  // Frames may omit `order` when the display order never changes (search
  // demos on large datasets) — fall back to identity order.
  const displayOrder =
    frame.order && frame.order.length === items.length ? frame.order : items.map((_, i) => i);
  const compactCells = variant === 'cells' && items.length > 60;

  const markerLabel = (pos: number): string => {
    const m = frame.markers;
    if (!m) return '';
    const parts: string[] = [];
    if (m.low === pos) parts.push('low');
    if (m.mid === pos) parts.push('mid');
    if (m.high === pos) parts.push('high');
    return parts.join('=');
  };

  const rangeDim = (pos: number): boolean =>
    frame.range != null && (pos < frame.range[0] || pos > frame.range[1]);

  return (
    <div className="mt-4">
      {/* Chart / grid */}
      <div className="rounded-xl border bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-900/60 p-3 sm:p-4">
        {variant === 'bars' ? (
          <div className="flex items-end gap-1 sm:gap-1.5 h-56 sm:h-64">
            {displayOrder.map((itemIx, pos) => {
              const item = items[itemIx];
              if (!item) return null;
              const state = posState(frame, pos);
              const h = Math.max(4, Math.round((barValue(item) / maxValue) * 100));
              const marker = markerLabel(pos);
              return (
                <div key={pos} className="flex-1 min-w-0 flex flex-col items-center justify-end h-full">
                  <div className="h-4 text-[9px] font-bold uppercase tracking-wide text-violet-600 dark:text-violet-400">
                    {marker}
                  </div>
                  <div className="text-[9px] sm:text-[10px] font-medium leading-tight mb-1 max-w-full truncate" title={formatValue(item)}>
                    {formatValue(item)}
                  </div>
                  <div
                    className={`w-full rounded-t-md transition-all duration-300 ${BAR_COLORS[state]} ${rangeDim(pos) && state === 'default' ? 'opacity-35' : ''}`}
                    style={{ height: `${h}%` }}
                    title={`${itemLabel(item)} — ${formatValue(item)}`}
                  />
                  <div className="text-[10px] font-medium text-muted-foreground mt-1">{pos}</div>
                </div>
              );
            })}
          </div>
        ) : (
          <div
            className={compactCells ? 'grid gap-1' : 'grid grid-cols-2 sm:grid-cols-4 gap-1.5'}
            style={compactCells ? { gridTemplateColumns: 'repeat(auto-fill, minmax(34px, 1fr))' } : undefined}
          >
            {displayOrder.map((itemIx, pos) => {
              const item = items[itemIx];
              if (!item) return null;
              const state = posState(frame, pos);
              if (compactCells) {
                return (
                  <div
                    key={pos}
                    className={`rounded border px-0.5 py-1 text-center text-[9px] font-medium transition-colors duration-200 ${CELL_COLORS[state]}`}
                    title={`[${pos}] ${itemLabel(item)} — ${formatValue(item)}`}
                  >
                    {pos}
                  </div>
                );
              }
              return (
                <div
                  key={pos}
                  className={`rounded-lg border px-2 py-1.5 text-center transition-colors duration-300 ${CELL_COLORS[state]}`}
                  title={`${itemLabel(item)} — ${formatValue(item)}`}
                >
                  <div className="text-[9px] opacity-80">[{pos}]</div>
                  <div className="text-[11px] font-semibold leading-tight truncate">{itemLabel(item)}</div>
                  <div className="text-[10px] opacity-90">{formatValue(item)}</div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-[11px] text-muted-foreground">
        <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-blue-500" /> Data</span>
        <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-orange-500" /> Sedang dibandingkan / diperiksa</span>
        <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-emerald-400" /> Baru dipindah / diambil</span>
        <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-emerald-600" /> Sudah di posisi final</span>
        <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-slate-300 dark:bg-slate-700" /> Sudah diperiksa / di luar rentang</span>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-1.5 mt-3">
        {playing ? (
          <Button size="sm" onClick={() => setPlaying(false)}>
            <Pause className="h-3.5 w-3.5 mr-1" /> Jeda
          </Button>
        ) : (
          <Button size="sm" onClick={() => { if (step >= last) setStep(0); setPlaying(true); }} disabled={frames.length <= 1}>
            <Play className="h-3.5 w-3.5 mr-1" /> Jalankan
          </Button>
        )}
        <Button size="sm" variant="outline" onClick={() => { setPlaying(false); setStep((s) => Math.min(last, s + 1)); }} disabled={step >= last}>
          <StepForward className="h-3.5 w-3.5 mr-1" /> Langkah Berikutnya
        </Button>
        <Button size="sm" variant="outline" onClick={() => { setPlaying(false); setStep(last); }} disabled={step >= last}>
          <FastForward className="h-3.5 w-3.5 mr-1" /> Jalankan Semua
        </Button>
        <Button size="sm" variant="outline" onClick={() => { setPlaying(false); setStep(0); }}>
          <RotateCcw className="h-3.5 w-3.5 mr-1" /> Reset
        </Button>
        <Select value={String(speed)} onChange={(e) => setSpeed(Number(e.target.value))} className="w-28">
          <option value="1000">Lambat</option>
          <option value="450">Normal</option>
          <option value="160">Cepat</option>
        </Select>
        <span className="text-xs text-muted-foreground ml-1">
          Langkah {Math.min(step, last) + 1} dari {frames.length}
          {step >= last && frames.length > 1 ? ' — Selesai' : ''}
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-muted mt-2 overflow-hidden">
        <div
          className="h-full bg-primary transition-all duration-300"
          style={{ width: `${frames.length > 1 ? (Math.min(step, last) / last) * 100 : 100}%` }}
        />
      </div>

      {/* Plain-language caption */}
      <div className="flex gap-2 items-start rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/40 p-3 mt-3">
        <Lightbulb className="h-4 w-4 shrink-0 text-amber-500 mt-0.5" />
        <p className="text-sm leading-relaxed">
          <b>Langkah {Math.min(step, last) + 1}:</b> {frame.caption}
        </p>
      </div>

      {/* Synced step log */}
      <div className="flex flex-wrap items-center justify-between gap-2 mt-4 mb-2">
        <h4 className="font-medium text-sm">Log langkah ({log.length} langkah)</h4>
        <div className="flex flex-wrap items-center gap-1.5">
          <Button size="sm" variant="outline" onClick={copyLog}><Copy className="h-3.5 w-3.5 mr-1" /> Copy Log</Button>
          <Button size="sm" variant="outline" onClick={() => exportMutation.mutate('json')}><Download className="h-3.5 w-3.5 mr-1" /> JSON</Button>
          <Button size="sm" variant="outline" onClick={() => exportMutation.mutate('csv')}><Download className="h-3.5 w-3.5 mr-1" /> CSV</Button>
        </div>
      </div>
      <div ref={logBoxRef} className="max-h-64 overflow-y-auto rounded-lg border bg-muted/30 p-3 font-mono text-xs space-y-1">
        {log.slice(0, Math.min(step, last) + 1).map((s, i) => (
          <div
            key={i}
            ref={i === Math.min(step, last) ? currentRowRef : undefined}
            className={`flex gap-2 rounded px-1.5 py-0.5 ${i === Math.min(step, last) ? 'bg-primary/15 font-semibold' : ''}`}
          >
            <span className="text-muted-foreground w-10 shrink-0">#{s.step}</span>
            <span className="font-semibold w-32 shrink-0">{s.operation}</span>
            <span className="break-words">
              {s.decision && <span>→ {s.decision} </span>}
              {s.result && <span className="text-muted-foreground">({s.result})</span>}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
