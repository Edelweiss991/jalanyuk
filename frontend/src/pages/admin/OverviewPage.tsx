import { useQuery } from '@tanstack/react-query';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Bus, TrainFront, TicketCheck, Users, Wallet, Undo2 } from 'lucide-react';
import { adminApi } from '../../services/api';
import { Card, Skeleton, Badge } from '../../components/ui';
import PhotoSlideshow from '../../components/PhotoSlideshow';
import { formatIDR } from '../../lib/format';

function StatCard({ icon: Icon, label, value, sub }: { icon: any; label: string; value: string; sub?: string }) {
  return (
    <Card className="p-4 flex items-start gap-3">
      <div className="rounded-lg bg-primary/10 p-2 text-primary"><Icon className="h-5 w-5" /></div>
      <div>
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="text-xl font-bold">{value}</div>
        {sub && <div className="text-xs text-muted-foreground">{sub}</div>}
      </div>
    </Card>
  );
}

export default function OverviewPage() {
  const { data, isLoading } = useQuery({ queryKey: ['admin', 'overview'], queryFn: adminApi.overview });

  if (isLoading || !data) {
    return <div className="space-y-3"><Skeleton className="h-24 w-full" /><Skeleton className="h-64 w-full" /></div>;
  }

  const chartData = (data.transactionsPerDate ?? []).map((d: any) => ({
    date: d.date,
    Booking: d.count ?? d.bookings ?? d.total ?? 0,
    Pendapatan: d.revenue ?? 0,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Overview</h1>
        <p className="text-sm text-muted-foreground">Ringkasan dari data database nyata (label: Data Simulasi).</p>
      </div>

      {/* Welcome banner with rotating bus/train photos */}
      <div className="relative h-44 rounded-2xl overflow-hidden shadow">
        <PhotoSlideshow showControls={false} intervalMs={4500} />
        <div className="absolute inset-0 bg-gradient-to-r from-blue-950/85 via-blue-900/55 to-blue-900/10" />
        <div className="relative h-full flex flex-col justify-center p-6">
          <h2 className="text-white text-xl sm:text-2xl font-bold drop-shadow">
            Selamat datang di Panel Admin AYORA
          </h2>
          <p className="text-white/85 text-sm mt-1 max-w-xl">
            Kelola bus, kereta, jadwal, booking, dan pengguna — semua angka di bawah ini nyata dari
            database.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard icon={Bus} label="Tiket Bus Terjual" value={String(data.totalBusTickets ?? 0)} />
        <StatCard icon={TrainFront} label="Tiket Kereta Terjual" value={String(data.totalTrainTickets ?? 0)} />
        <StatCard icon={TicketCheck} label="Total Booking" value={String(data.totalBookings ?? 0)} />
        <StatCard icon={Users} label="Total Customer" value={String(data.totalCustomers ?? 0)} />
        <StatCard icon={Wallet} label="Pendapatan (PAID)" value={formatIDR(data.revenue ?? 0)} />
        <StatCard icon={Undo2} label="Total Refund" value={formatIDR(data.refundsTotal ?? 0)} />
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="p-4 lg:col-span-2">
          <h3 className="font-semibold mb-3">Transaksi 14 Hari Terakhir</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="Booking" fill="#7c3aed" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card className="p-4">
          <h3 className="font-semibold mb-3">Booking per Status</h3>
          <div className="space-y-2">
            {Object.entries(data.bookingsByStatus ?? {}).map(([status, count]) => (
              <div key={status} className="flex items-center justify-between text-sm">
                <Badge variant="default">{status}</Badge>
                <span className="font-semibold">{String(count)}</span>
              </div>
            ))}
          </div>
          <h3 className="font-semibold mt-5 mb-3">Rute Populer</h3>
          <div className="space-y-2 text-sm">
            {(data.popularRoutes ?? []).slice(0, 5).map((r: any, i: number) => (
              <div key={i} className="flex justify-between gap-2">
                <span className="truncate">{r.route ?? r.label ?? r.description ?? '-'}</span>
                <span className="font-semibold">{r.count ?? r.total ?? ''}</span>
              </div>
            ))}
            {(data.popularRoutes ?? []).length === 0 && <p className="text-muted-foreground text-sm">Belum ada data.</p>}
          </div>
        </Card>
      </div>

      <Card className="p-4">
        <h3 className="font-semibold mb-3">Aktivitas Admin Terbaru</h3>
        <div className="space-y-2 text-sm">
          {(data.recentAudit ?? []).map((a: any) => (
            <div key={a.id} className="flex flex-wrap justify-between gap-2 border-b last:border-0 pb-2">
              <span><span className="font-medium">{a.action}</span> • {a.entityType} {a.user?.email ? `oleh ${a.user.email}` : ''}</span>
              <span className="text-muted-foreground">{new Date(a.createdAt).toLocaleString('id-ID')}</span>
            </div>
          ))}
          {(data.recentAudit ?? []).length === 0 && <p className="text-muted-foreground">Belum ada aktivitas.</p>}
        </div>
      </Card>
    </div>
  );
}
