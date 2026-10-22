import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Download } from 'lucide-react';
import { adminApi } from '../../services/api';
import { Button, Card, Input, Select, Label, Skeleton, useToast } from '../../components/ui';
import { formatIDR } from '../../lib/format';

export default function ReportsPage() {
  const { addToast } = useToast();
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [type, setType] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'reports', from, to, type],
    queryFn: () => adminApi.get('reports/summary', {
      ...(from ? { from } : {}),
      ...(to ? { to } : {}),
      ...(type ? { type } : {}),
    }),
  });

  const downloadCsv = async () => {
    try {
      const blob = await adminApi.exportCsv({
        ...(from ? { from } : {}),
        ...(to ? { to } : {}),
        ...(type ? { type } : {}),
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'jalanyuk-laporan-booking.csv';
      a.click();
      URL.revokeObjectURL(url);
      addToast('success', 'CSV laporan diunduh');
    } catch (e: any) {
      addToast('error', e?.message || 'Gagal mengunduh CSV');
    }
  };

  const byType = data?.byTransportType ?? data?.byType ?? {};

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Laporan</h1>
        <p className="text-sm text-muted-foreground">Ringkasan transaksi dari database; ekspor CSV berisi data booking pada rentang terpilih.</p>
      </div>

      <Card className="p-4">
        <div className="flex flex-wrap items-end gap-3">
          <div><Label>Dari Tanggal</Label><Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} /></div>
          <div><Label>Sampai Tanggal</Label><Input type="date" value={to} onChange={(e) => setTo(e.target.value)} /></div>
          <div>
            <Label>Tipe</Label>
            <Select value={type} onChange={(e) => setType(e.target.value)}>
              <option value="">Semua</option>
              <option value="BUS">Bus</option>
              <option value="TRAIN">Kereta</option>
            </Select>
          </div>
          <Button onClick={downloadCsv}><Download className="h-4 w-4 mr-1" /> Export CSV</Button>
        </div>
      </Card>

      {isLoading || !data ? (
        <Skeleton className="h-40 w-full" />
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          <Card className="p-4 space-y-2 text-sm">
            <h3 className="font-semibold">Ringkasan</h3>
            <div className="flex justify-between"><span className="text-muted-foreground">Total Transaksi</span><b>{data.totalTransactions ?? 0}</b></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Pendapatan (booking tidak batal)</span><b>{formatIDR(data.totalRevenue ?? 0)}</b></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Booking Dibatalkan</span><b>{data.cancelledBookings ?? 0}</b></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Jumlah Refund</span><b>{data.refundCount ?? 0}</b></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Total Refund</span><b>{formatIDR(data.refundTotal ?? data.totalRefunds ?? 0)}</b></div>
          </Card>
          <Card className="p-4 space-y-2 text-sm">
            <h3 className="font-semibold">Per Tipe Transportasi</h3>
            {Object.entries(byType).map(([k, v]: [string, any]) => (
              <div key={k} className="flex justify-between border-b last:border-0 pb-1">
                <span className="text-muted-foreground">{k}</span>
                <span>{v.count} transaksi • {v.tickets} tiket • <b>{formatIDR(v.revenue)}</b></span>
              </div>
            ))}
            {Object.keys(byType).length === 0 && <p className="text-muted-foreground">Tidak ada data pada rentang ini.</p>}
          </Card>
        </div>
      )}
    </div>
  );
}
