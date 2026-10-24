import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { FlaskConical } from 'lucide-react';
import { labApi } from '../../services/api';
import { Button, Card, Input, Select, Label, Badge, useToast } from '../../components/ui';
import StepVisualizer from '../../components/StepVisualizer';
import { formatIDR } from '../../lib/format';

export default function AlgorithmLabPage() {
  const { addToast } = useToast();
  const [dataType, setDataType] = useState<'BUS' | 'TRAIN'>('BUS');
  const [dataset, setDataset] = useState<any | null>(null);
  const [arrayData, setArrayData] = useState<any | null>(null);
  const [sortKey, setSortKey] = useState('price');
  const [sortAlgorithm, setSortAlgorithm] = useState<'bubble' | 'merge'>('bubble');
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
  const sortMutation = useMutation({
    mutationFn: () => labApi.sort(dataType, sortKey, sortAlgorithm),
    onSuccess: setSortResult,
    onError: err,
  });

  // Value displayed on each sorted-result chip: the ACTIVE sort key, so the
  // ordering is verifiable (previously chips always showed price, which made
  // duration/label sorts look random).
  const sortKeyValue = (it: any): string => {
    switch (sortKey) {
      case 'duration':
        return `${it.durationMinutes} mnt`;
      case 'departureMinutes': {
        const h = String(Math.floor((it.departureMinutes ?? 0) / 60)).padStart(2, '0');
        const m = String((it.departureMinutes ?? 0) % 60).padStart(2, '0');
        return `${h}:${m}`;
      }
      case 'label':
        return it.label ?? '';
      default:
        return formatIDR(it.price);
    }
  };

  // Numeric basis for bar heights, following the active sort key. For the
  // label key there is no natural magnitude, so bars use the final rank.
  const sortBarValue = (it: any): number => {
    switch (sortKey) {
      case 'duration':
        return it.durationMinutes ?? 0;
      case 'departureMinutes':
        return it.departureMinutes ?? 0;
      case 'label': {
        const sorted: any[] = sortResult?.sorted ?? [];
        const ix = sorted.findIndex((s) => s.id === it.id);
        return ix >= 0 ? ix + 1 : 1;
      }
      default:
        return it.price ?? 0;
    }
  };

  const linearMutation = useMutation({ mutationFn: () => labApi.linear(dataType, linearQuery), onSuccess: setLinearResult, onError: err });
  const binaryMutation = useMutation({ mutationFn: () => labApi.binary(dataType, Number(binaryTarget)), onSuccess: setBinaryResult, onError: err });
  const pointerMutation = useMutation({ mutationFn: labApi.pointer, onSuccess: setPointerResult, onError: err });
  const structMutation = useMutation({ mutationFn: labApi.struct, onSuccess: setStructResult, onError: err });

  const routeLabel = (it: any) => `${it.label} (${it.origin} → ${it.destination})`;

  const arrayMaxPrice = Math.max(1, ...((arrayData?.before ?? []).map((x: any) => x.price ?? 0)));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2"><FlaskConical className="h-6 w-6 text-primary" /> Algorithm Lab</h1>
        <p className="text-sm text-muted-foreground">
          Khusus admin. Semua algoritma berjalan pada data jadwal nyata dari database dan demo C asli — diagram dan log adalah hasil eksekusi, bukan contoh statis.
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
            <div className="rounded-xl border bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-900/60 p-3 sm:p-4 mb-3">
              <div className="flex items-end gap-1 sm:gap-1.5 h-44 sm:h-52">
                {(arrayData.before ?? []).map((it: any) => {
                  const h = Math.max(6, Math.round(((it.price ?? 0) / arrayMaxPrice) * 100));
                  return (
                    <div key={it.index} className="flex-1 min-w-0 flex flex-col items-center justify-end h-full">
                      <div className="text-[9px] sm:text-[10px] font-medium mb-1 max-w-full truncate" title={formatIDR(it.price)}>
                        {formatIDR(it.price)}
                      </div>
                      <div
                        className="w-full rounded-t-md bg-gradient-to-t from-blue-600 to-blue-400 flex justify-center pt-1"
                        style={{ height: `${h}%` }}
                        title={`${it.label} — ${formatIDR(it.price)}`}
                      >
                        <span className="text-[9px] sm:text-[10px] font-bold text-white">{it.index}</span>
                      </div>
                      <div className="text-[9px] text-muted-foreground mt-1 max-w-full truncate">{it.label}</div>
                    </div>
                  );
                })}
              </div>
              <div className="text-[11px] text-muted-foreground mt-2">
                Diagram batang: setiap batang adalah satu elemen array — tingginya mengikuti harga tiket, angka di dalam batang adalah indeks array-nya.
              </div>
            </div>
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
        <h3 className="font-semibold">Sorting — Urutkan Tiket (Diagram Batang)</h3>
        <p className="text-sm text-muted-foreground mb-3">
          Setiap batang adalah satu tiket; tingginya mengikuti kunci urutan yang dipilih. Tekan <b>Jalankan</b> untuk melihat cara algoritma bekerja langkah demi langkah.
          Bubble Sort membandingkan dua batang bersebelahan lalu menukar bila salah urutan; Merge Sort membagi data jadi dua, mengurutkan tiap bagian, lalu menggabungkannya.
        </p>
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <Label>Algoritma</Label>
            <Select value={sortAlgorithm} onChange={(e) => setSortAlgorithm(e.target.value as 'bubble' | 'merge')}>
              <option value="bubble">Bubble Sort — O(n²)</option>
              <option value="merge">Merge Sort — O(n log n)</option>
            </Select>
          </div>
          <div>
            <Label>Kunci Urutan</Label>
            <Select value={sortKey} onChange={(e) => setSortKey(e.target.value)}>
              <option value="price">Harga</option>
              <option value="departureMinutes">Waktu Berangkat</option>
              <option value="duration">Durasi Rute</option>
              <option value="label">Nama Operator/Kereta</option>
            </Select>
          </div>
          <Button onClick={() => sortMutation.mutate()} disabled={sortMutation.isPending}>Jalankan Sorting</Button>
        </div>
        {sortResult && (
          <>
            <div className="flex flex-wrap gap-2 mt-3 text-sm">
              <Badge variant="default">Perbandingan: {sortResult.comparisons}</Badge>
              {sortResult.algorithm === 'bubble' ? (
                <Badge variant="default">Penukaran: {sortResult.swaps}</Badge>
              ) : (
                <Badge variant="default">Penggabungan: {sortResult.merges}</Badge>
              )}
              <Badge variant="default">{sortResult.complexity?.time}</Badge>
              <Badge variant="default">Ruang {sortResult.complexity?.space}</Badge>
            </div>
            <StepVisualizer
              frames={sortResult.frames ?? []}
              log={sortResult.log ?? []}
              items={sortResult.items ?? []}
              variant="bars"
              barValue={sortBarValue}
              formatValue={sortKeyValue}
              itemLabel={routeLabel}
            />
            <div className="text-sm font-medium mt-4 mb-2">Hasil akhir (sudah terurut)</div>
            <div className="flex flex-wrap gap-1.5">
              {(sortResult.sorted ?? []).slice(0, 24).map((it: any, i: number) => (
                <div key={i} className="rounded-md bg-primary/10 px-2 py-1 text-xs text-center">
                  <div className="font-semibold">{sortKeyValue(it)}</div>
                  <div className="max-w-[130px] truncate text-muted-foreground">{it.label} • {it.origin} → {it.destination}</div>
                </div>
              ))}
            </div>
          </>
        )}
      </Card>

      <div className="grid lg:grid-cols-2 gap-4">
        <Card className="p-4">
          <h3 className="font-semibold">Linear Search — Cari Satu per Satu (O(n))</h3>
          <p className="text-sm text-muted-foreground mb-3">Setiap kotak adalah satu tiket — dan di sini datasetnya BESAR: ratusan jadwal asli dari database (bukan sampel kecil), supaya terasa bedanya mencari satu per satu di data yang banyak. Kotak yang sedang diperiksa menyala oranye; yang sudah dilewati memudar; yang cocok berubah hijau. Cocok untuk label operator/nama/kota.</p>
          <div className="flex items-end gap-2">
            <div className="flex-1"><Label>Kata Kunci</Label><Input value={linearQuery} onChange={(e) => setLinearQuery(e.target.value)} placeholder="mis. Rosalia / Gambir / Argo" /></div>
            <Button onClick={() => linearMutation.mutate()} disabled={linearMutation.isPending || !linearQuery}>Cari</Button>
          </div>
          {linearResult && (
            <>
              <p className="text-sm mt-3">
                {linearResult.found
                  ? <>Dari <b>{linearResult.items?.length ?? 0} jadwal</b> yang diperiksa: ditemukan di indeks <b>{linearResult.index}</b>: {linearResult.item?.label} ({linearResult.item?.origin} → {linearResult.item?.destination}) setelah {linearResult.comparisons} perbandingan.</>
                  : <>Tidak ditemukan setelah memeriksa semua {linearResult.comparisons} dari {linearResult.items?.length ?? 0} jadwal.</>}
              </p>
              <StepVisualizer
                frames={linearResult.frames ?? []}
                log={linearResult.log ?? []}
                items={linearResult.items ?? []}
                variant="cells"
                barValue={(it) => it.price ?? 0}
                formatValue={(it) => formatIDR(it.price)}
                itemLabel={(it) => it.label}
              />
            </>
          )}
        </Card>

        <Card className="p-4">
          <h3 className="font-semibold">Binary Search — Cari dengan Membelah Dua (O(log n))</h3>
          <p className="text-sm text-muted-foreground mb-3">Harga tiket diurutkan dulu, lalu ditampilkan sebagai diagram batang menaik. Di setiap langkah, batang di luar rentang <b>low–high</b> memudar dan hanya nilai tengah (<b>mid</b>) yang diperiksa. Binary Search hanya valid pada data terurut.</p>
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
              <StepVisualizer
                frames={binaryResult.frames ?? []}
                log={binaryResult.log ?? []}
                items={binaryResult.sortedArray ?? []}
                variant="bars"
                barValue={(it) => it.price ?? 0}
                formatValue={(it) => formatIDR(it.price)}
                itemLabel={routeLabel}
              />
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
