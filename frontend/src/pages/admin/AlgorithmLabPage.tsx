import { useEffect, useRef, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Play, Pause, StepForward, RotateCcw, Trash2, Copy, Download, FlaskConical } from 'lucide-react';
import { labApi } from '../../services/api';
import { Button, Card, Input, Select, Label, Badge, useToast } from '../../components/ui';
import { formatIDR } from '../../lib/format';

interface LogStep {
  step: number;
  operation: string;
  decision?: string;
  result?: string;
  comparedValues?: any;
  indices?: any;
  low?: number;
  mid?: number;
  high?: number;
}

function downloadText(content: string, filename: string) {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function LogViewer({ title, log, stats }: { title: string; log: LogStep[]; stats?: React.ReactNode }) {
  const { addToast } = useToast();
  const [visible, setVisible] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(400);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => { setVisible(0); setPlaying(false); }, [log]);
  useEffect(() => {
    if (playing) {
      timer.current = setInterval(() => {
        setVisible((v) => {
          if (v >= log.length) { setPlaying(false); return v; }
          return v + 1;
        });
      }, speed);
    }
    return () => { if (timer.current) clearInterval(timer.current); };
  }, [playing, speed, log.length]);

  const exportMutation = useMutation({
    mutationFn: (format: 'json' | 'csv') => labApi.exportLog(log as any[], format),
    onSuccess: (res) => { downloadText(res.content, res.filename); addToast('success', 'Log diekspor'); },
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

  if (log.length === 0) return null;

  return (
    <div className="mt-4">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
        <h4 className="font-medium">{title} — {log.length} langkah</h4>
        <div className="flex flex-wrap items-center gap-1.5">
          <Select value={String(speed)} onChange={(e) => setSpeed(Number(e.target.value))} className="w-28">
            <option value="100">Cepat</option>
            <option value="400">Normal</option>
            <option value="900">Lambat</option>
          </Select>
          <Button size="sm" onClick={() => setPlaying(true)} disabled={playing || visible >= log.length}><Play className="h-3.5 w-3.5 mr-1" /> Start</Button>
          <Button size="sm" variant="outline" onClick={() => setPlaying(false)} disabled={!playing}><Pause className="h-3.5 w-3.5 mr-1" /> Pause</Button>
          <Button size="sm" variant="outline" onClick={() => setVisible((v) => Math.min(log.length, v + 1))} disabled={visible >= log.length}><StepForward className="h-3.5 w-3.5 mr-1" /> Step</Button>
          <Button size="sm" variant="outline" onClick={() => { setPlaying(false); setVisible(0); }}><RotateCcw className="h-3.5 w-3.5 mr-1" /> Reset</Button>
          <Button size="sm" variant="outline" onClick={() => { setPlaying(false); setVisible(0); }}><Trash2 className="h-3.5 w-3.5 mr-1" /> Clear Log</Button>
          <Button size="sm" variant="outline" onClick={copyLog}><Copy className="h-3.5 w-3.5 mr-1" /> Copy Log</Button>
          <Button size="sm" variant="outline" onClick={() => exportMutation.mutate('json')}><Download className="h-3.5 w-3.5 mr-1" /> JSON</Button>
          <Button size="sm" variant="outline" onClick={() => exportMutation.mutate('csv')}><Download className="h-3.5 w-3.5 mr-1" /> CSV</Button>
        </div>
      </div>
      {stats}
      <div className="max-h-80 overflow-y-auto rounded-lg border bg-muted/30 p-3 font-mono text-xs space-y-1">
        {log.slice(0, visible).map((s, i) => (
          <div key={i} className="flex gap-2">
            <span className="text-muted-foreground w-10 shrink-0">#{s.step}</span>
            <span className="font-semibold w-36 shrink-0">{s.operation}</span>
            <span className="break-words">
              {s.comparedValues !== undefined && <span>nilai: {JSON.stringify(s.comparedValues)} </span>}
              {(s.low !== undefined || s.mid !== undefined) && <span>[low={s.low} mid={s.mid} high={s.high}] </span>}
              {s.decision && <span>→ {s.decision} </span>}
              {s.result && <span className="text-muted-foreground">({s.result})</span>}
            </span>
          </div>
        ))}
        {visible === 0 && <p className="text-muted-foreground">Tekan Start atau Step untuk memutar log eksekusi nyata.</p>}
        <div className="text-muted-foreground pt-1">Ditampilkan {visible} dari {log.length} langkah</div>
      </div>
    </div>
  );
}

export default function AlgorithmLabPage() {
  const { addToast } = useToast();
  const [dataType, setDataType] = useState<'BUS' | 'TRAIN'>('BUS');
  const [dataset, setDataset] = useState<any | null>(null);
  const [arrayData, setArrayData] = useState<any | null>(null);
  const [sortKey, setSortKey] = useState('price');
  const [sortResult, setSortResult] = useState<any | null>(null);
  const [linearQuery, setLinearQuery] = useState('');
  const [linearResult, setLinearResult] = useState<any | null>(null);
  const [binaryTarget, setBinaryTarget] = useState('');
  const [binaryResult, setBinaryResult] = useState<any | null>(null);
  const [pointerResult, setPointerResult] = useState<any | null>(null);
  const [structResult, setStructResult] = useState<any | null>(null);

  const err = (e: any) => addToast('error', e?.message || 'Terjadi kesalahan');

  const datasetMutation = useMutation({ mutationFn: labApi.dataset, onSuccess: setDataset, onError: err });
  const arrayMutation = useMutation({ mutationFn: labApi.array, onSuccess: setArrayData, onError: err });
  const sortMutation = useMutation({ mutationFn: () => labApi.sort(dataType, sortKey), onSuccess: setSortResult, onError: err });
  const linearMutation = useMutation({ mutationFn: () => labApi.linear(dataType, linearQuery), onSuccess: setLinearResult, onError: err });
  const binaryMutation = useMutation({ mutationFn: () => labApi.binary(dataType, Number(binaryTarget)), onSuccess: setBinaryResult, onError: err });
  const pointerMutation = useMutation({ mutationFn: labApi.pointer, onSuccess: setPointerResult, onError: err });
  const structMutation = useMutation({ mutationFn: labApi.struct, onSuccess: setStructResult, onError: err });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2"><FlaskConical className="h-6 w-6 text-primary" /> Algorithm Lab</h1>
        <p className="text-sm text-muted-foreground">
          Khusus admin. Semua algoritma berjalan pada data jadwal nyata dari database dan demo C asli — log adalah hasil eksekusi, bukan contoh statis.
        </p>
      </div>

      <Card className="p-4">
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <Label>Tipe Data</Label>
            <Select value={dataType} onChange={(e) => setDataType(e.target.value as any)}>
              <option value="BUS">Bus</option>
              <option value="TRAIN">Kereta</option>
            </Select>
          </div>
          <Button variant="outline" onClick={() => datasetMutation.mutate()} disabled={datasetMutation.isPending}>Muat Dataset</Button>
          <Button variant="outline" onClick={() => arrayMutation.mutate()} disabled={arrayMutation.isPending}>Visualisasi Array</Button>
        </div>

        {dataset && (
          <div className="mt-4">
            <div className="text-sm mb-2">Dataset {dataType}: <b>{(dataset.items ?? []).filter((it: any) => it.transportType === dataType).length}</b> jadwal • Demo array harga: {dataset.demoArray?.length ?? 0} elemen</div>
            <div className="max-h-56 overflow-y-auto grid md:grid-cols-2 gap-2">
              {(dataset.items ?? []).filter((it: any) => it.transportType === dataType).slice(0, 20).map((it: any) => (
                <div key={it.id} className="rounded-lg border p-2 text-xs">
                  <span className="font-mono text-muted-foreground">[{it.id}]</span> <b>{it.label}</b><br />
                  {it.origin} → {it.destination} • {formatIDR(it.price)}
                </div>
              ))}
            </div>
          </div>
        )}

        {arrayData && (
          <div className="mt-4">
            <div className="text-sm font-medium mb-2">Array mentah ({(arrayData.before ?? []).length} elemen, terindeks)</div>
            <div className="flex flex-wrap gap-1.5">
              {(arrayData.before ?? []).map((it: any) => (
                <div key={it.index} className="rounded-md border px-2 py-1 text-xs text-center">
                  <div className="text-muted-foreground">[{it.index}]</div>
                  <div className="font-semibold">{formatIDR(it.price)}</div>
                  <div className="max-w-[110px] truncate">{it.label}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>

      <Card className="p-4">
        <h3 className="font-semibold">Merge Sort — Sorting Manual (O(n log n))</h3>
        <p className="text-sm text-muted-foreground mb-3">Implementasi rekursif manual di backend (bukan Array.sort bawaan untuk logika inti).</p>
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <Label>Kunci Urutan</Label>
            <Select value={sortKey} onChange={(e) => setSortKey(e.target.value)}>
              <option value="price">Harga</option>
              <option value="departureMinutes">Waktu Berangkat</option>
              <option value="duration">Durasi Rute</option>
              <option value="label">Nama Operator/Kereta</option>
            </Select>
          </div>
          <Button onClick={() => sortMutation.mutate()} disabled={sortMutation.isPending}>Jalankan Merge Sort</Button>
        </div>
        {sortResult && (
          <>
            <div className="flex flex-wrap gap-2 mt-3 text-sm">
              <Badge variant="default">Perbandingan: {sortResult.comparisons}</Badge>
              <Badge variant="default">Penggabungan: {sortResult.merges}</Badge>
              <Badge variant="default">{sortResult.complexity?.time}</Badge>
              <Badge variant="default">Ruang {sortResult.complexity?.space}</Badge>
            </div>
            <div className="flex flex-wrap gap-1.5 mt-3">
              {(sortResult.sorted ?? []).slice(0, 24).map((it: any, i: number) => (
                <span key={i} className="rounded-md bg-primary/10 px-2 py-1 text-xs">{formatIDR(it.price)}</span>
              ))}
            </div>
            <LogViewer title="Log Merge Sort" log={sortResult.log ?? []} />
          </>
        )}
      </Card>

      <div className="grid lg:grid-cols-2 gap-4">
        <Card className="p-4">
          <h3 className="font-semibold">Linear Search — Searching Manual (O(n))</h3>
          <p className="text-sm text-muted-foreground mb-3">Memeriksa elemen satu per satu dari indeks 0. Cocok untuk label operator/nama/kota.</p>
          <div className="flex items-end gap-2">
            <div className="flex-1"><Label>Kata Kunci</Label><Input value={linearQuery} onChange={(e) => setLinearQuery(e.target.value)} placeholder="mis. Rosalia / Gambir / Argo" /></div>
            <Button onClick={() => linearMutation.mutate()} disabled={linearMutation.isPending || !linearQuery}>Cari</Button>
          </div>
          {linearResult && (
            <>
              <p className="text-sm mt-3">
                {linearResult.found
                  ? <>Ditemukan di indeks <b>{linearResult.index}</b>: {linearResult.item?.label} ({linearResult.item?.origin} → {linearResult.item?.destination}) setelah {linearResult.comparisons} perbandingan.</>
                  : <>Tidak ditemukan setelah memeriksa {linearResult.comparisons} elemen.</>}
              </p>
              <LogViewer title="Log Linear Search" log={linearResult.log ?? []} />
            </>
          )}
        </Card>

        <Card className="p-4">
          <h3 className="font-semibold">Binary Search — Searching Manual (O(log n))</h3>
          <p className="text-sm text-muted-foreground mb-3">Dataset diurutkan dulu (Merge Sort), lalu pencarian biner atas harga. Binary Search hanya valid pada data terurut.</p>
          <div className="flex items-end gap-2">
            <div className="flex-1"><Label>Target Harga (Rp)</Label><Input type="number" value={binaryTarget} onChange={(e) => setBinaryTarget(e.target.value)} placeholder="mis. 250000" /></div>
            <Button onClick={() => binaryMutation.mutate()} disabled={binaryMutation.isPending || !binaryTarget}>Cari</Button>
          </div>
          {binaryResult && (
            <>
              <p className="text-sm mt-3">
                {binaryResult.result?.found
                  ? <>Harga ditemukan di indeks <b>{binaryResult.result.index}</b> pada array terurut setelah {binaryResult.result.comparisons} langkah: {binaryResult.result.item?.label} ({binaryResult.result.item?.origin} → {binaryResult.result.item?.destination}).</>
                  : <>Harga tidak ditemukan ({binaryResult.result?.comparisons ?? 0} langkah). Array sudah terurut sebelum pencarian.</>}
              </p>
              <LogViewer title="Log Binary Search" log={binaryResult.log ?? []} />
            </>
          )}
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <Card className="p-4">
          <h3 className="font-semibold">Demo Pointer — Bahasa C Asli</h3>
          <p className="text-sm text-muted-foreground mb-3">Program C dikompilasi gcc dan dijalankan backend sebagai subprocess terisolasi (timeout, input tervalidasi). Alamat di bawah adalah alamat memori aktual proses.</p>
          <Button onClick={() => pointerMutation.mutate()} disabled={pointerMutation.isPending}>Jalankan Demo Pointer</Button>
          {pointerResult && (
            <div className="mt-3">
              <div className="flex flex-wrap gap-1.5 mb-2">
                {(pointerResult.addresses ?? []).slice(0, 10).map((a: string, i: number) => (
                  <Badge key={i} variant="default" className="font-mono">{a}</Badge>
                ))}
              </div>
              <pre className="max-h-72 overflow-auto rounded-lg bg-slate-950 text-green-300 text-xs p-3 whitespace-pre-wrap">{pointerResult.rawOutput}</pre>
            </div>
          )}
        </Card>

        <Card className="p-4">
          <h3 className="font-semibold">Demo Struct — Bahasa C Asli</h3>
          <p className="text-sm text-muted-foreground mb-3">Array of struct BusSchedule/TrainSchedule, operator titik vs panah, passing by value vs pointer, dan sizeof struct.</p>
          <Button onClick={() => structMutation.mutate()} disabled={structMutation.isPending}>Jalankan Demo Struct</Button>
          {structResult && (
            <pre className="max-h-72 overflow-auto rounded-lg bg-slate-950 text-green-300 text-xs p-3 whitespace-pre-wrap mt-3">{structResult.rawOutput}</pre>
          )}
        </Card>
      </div>
    </div>
  );
}
