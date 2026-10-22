import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '../../services/api';
import EntityManager, { ActiveBadge } from './EntityManager';
import { formatIDR, formatTime } from '../../lib/format';
import { Badge } from '../../components/ui';

const TABS = ['Operator', 'Stasiun', 'Kereta', 'Rute', 'Jadwal'] as const;

export default function TrainsPage() {
  const [tab, setTab] = useState<(typeof TABS)[number]>('Operator');

  const { data: operators } = useQuery({ queryKey: ['admin-look', 'train-operators'], queryFn: () => adminApi.get('train-operators', { limit: 100 }) });
  const { data: stations } = useQuery({ queryKey: ['admin-look', 'train-stations'], queryFn: () => adminApi.get('train-stations', { limit: 100 }) });
  const { data: trains } = useQuery({ queryKey: ['admin-look', 'trains'], queryFn: () => adminApi.get('trains', { limit: 100 }) });
  const { data: routes } = useQuery({ queryKey: ['admin-look', 'train-routes'], queryFn: () => adminApi.get('train-routes', { limit: 100 }) });

  const opOptions = (operators?.items ?? []).map((o: any) => ({ value: o.id, label: o.name }));
  const stOptions = (stations?.items ?? []).map((s: any) => ({ value: s.id, label: `${s.name} (${s.city})` }));
  const trainOptions = (trains?.items ?? []).map((t: any) => ({ value: t.id, label: `${t.name} • ${t.className}` }));
  const routeOptions = (routes?.items ?? []).map((r: any) => ({
    value: r.id,
    label: `${r.originStation?.name ?? r.originStationId} → ${r.destinationStation?.name ?? r.destinationStationId}`,
  }));

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Manajemen Kereta</h1>
        <p className="text-sm text-muted-foreground">Kelola operator, stasiun, rangkaian kereta, rute, dan jadwal kereta.</p>
      </div>
      <div className="flex gap-2 flex-wrap">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-3 py-1.5 rounded-full text-sm border ${tab === t ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'}`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'Operator' && (
        <EntityManager
          title="Operator Kereta"
          resource="train-operators"
          columns={[
            { key: 'name', label: 'Nama' },
            { key: 'code', label: 'Kode' },
            { key: 'status', label: 'Status', render: (r) => <ActiveBadge active={r.isActive} /> },
          ]}
          fields={[
            { name: 'name', label: 'Nama Operator', required: true },
            { name: 'code', label: 'Kode', required: true },
            { name: 'description', label: 'Deskripsi' },
            { name: 'isActive', label: 'Aktif', type: 'checkbox' },
          ]}
          createDefaults={{ isActive: true }}
        />
      )}

      {tab === 'Stasiun' && (
        <EntityManager
          title="Stasiun Kereta"
          resource="train-stations"
          columns={[
            { key: 'name', label: 'Nama' },
            { key: 'code', label: 'Kode' },
            { key: 'city', label: 'Kota' },
            { key: 'status', label: 'Status', render: (r) => <ActiveBadge active={r.isActive} /> },
          ]}
          fields={[
            { name: 'name', label: 'Nama Stasiun', required: true },
            { name: 'code', label: 'Kode Stasiun', required: true },
            { name: 'city', label: 'Kota', required: true },
            { name: 'address', label: 'Alamat' },
            { name: 'isActive', label: 'Aktif', type: 'checkbox' },
          ]}
          createDefaults={{ isActive: true }}
        />
      )}

      {tab === 'Kereta' && (
        <EntityManager
          title="Rangkaian Kereta"
          resource="trains"
          columns={[
            { key: 'name', label: 'Nama' },
            { key: 'trainNumber', label: 'Nomor KA' },
            { key: 'className', label: 'Kelas' },
            { key: 'capacity', label: 'Kapasitas' },
            { key: 'status', label: 'Status', render: (r) => <ActiveBadge active={r.isActive} /> },
          ]}
          fields={[
            { name: 'operatorId', label: 'Operator', type: 'select', options: opOptions, required: true },
            { name: 'name', label: 'Nama Kereta', required: true },
            { name: 'trainNumber', label: 'Nomor KA', required: true },
            { name: 'className', label: 'Kelas', required: true },
            { name: 'capacity', label: 'Kapasitas Kursi', type: 'number' },
            { name: 'facilities', label: 'Fasilitas', type: 'tags' },
            { name: 'isActive', label: 'Aktif', type: 'checkbox' },
          ]}
          createDefaults={{ isActive: true, capacity: 64 }}
        />
      )}

      {tab === 'Rute' && (
        <EntityManager
          title="Rute Kereta"
          resource="train-routes"
          columns={[
            { key: 'origin', label: 'Asal', render: (r) => r.originStation?.name ?? '—' },
            { key: 'destination', label: 'Tujuan', render: (r) => r.destinationStation?.name ?? '—' },
            { key: 'durationMinutes', label: 'Durasi (mnt)' },
            { key: 'distanceKm', label: 'Jarak (km)' },
            { key: 'status', label: 'Status', render: (r) => <ActiveBadge active={r.isActive} /> },
          ]}
          fields={[
            { name: 'originStationId', label: 'Stasiun Asal', type: 'select', options: stOptions, required: true },
            { name: 'destinationStationId', label: 'Stasiun Tujuan', type: 'select', options: stOptions, required: true },
            { name: 'durationMinutes', label: 'Durasi (menit)', type: 'number', required: true },
            { name: 'distanceKm', label: 'Jarak (km)', type: 'number' },
            { name: 'isActive', label: 'Aktif', type: 'checkbox' },
          ]}
          createDefaults={{ isActive: true }}
        />
      )}

      {tab === 'Jadwal' && (
        <EntityManager
          title="Jadwal Kereta"
          resource="train-schedules"
          columns={[
            { key: 'route', label: 'Rute', render: (r) => `${r.route?.originStation?.name ?? ''} → ${r.route?.destinationStation?.name ?? ''}` },
            { key: 'train', label: 'Kereta', render: (r) => r.train?.name ?? '—' },
            { key: 'departureTime', label: 'Berangkat', render: (r) => `${new Date(r.departureTime).toLocaleDateString('id-ID')} ${formatTime(r.departureTime)}` },
            { key: 'price', label: 'Harga', render: (r) => formatIDR(r.price) },
            { key: 'status', label: 'Status', render: (r) => <Badge variant={r.status === 'ACTIVE' ? 'success' : 'default'}>{r.status}</Badge> },
          ]}
          fields={[
            { name: 'routeId', label: 'Rute', type: 'select', options: routeOptions, required: true },
            { name: 'trainId', label: 'Kereta', type: 'select', options: trainOptions, required: true },
            { name: 'operatorId', label: 'Operator', type: 'select', options: opOptions, required: true },
            { name: 'departureStationId', label: 'Stasiun Keberangkatan', type: 'select', options: stOptions, required: true },
            { name: 'arrivalStationId', label: 'Stasiun Kedatangan', type: 'select', options: stOptions, required: true },
            { name: 'departureTime', label: 'Waktu Berangkat', type: 'datetime', required: true },
            { name: 'arrivalTime', label: 'Waktu Tiba', type: 'datetime', required: true },
            { name: 'price', label: 'Harga (Rp)', type: 'number', required: true },
          ]}
        />
      )}
    </div>
  );
}
