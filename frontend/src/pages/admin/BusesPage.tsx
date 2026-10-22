import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '../../services/api';
import EntityManager, { ActiveBadge } from './EntityManager';
import { formatIDR, formatTime } from '../../lib/format';
import { Badge } from '../../components/ui';

const TABS = ['Operator', 'Terminal', 'Bus', 'Rute', 'Jadwal'] as const;

export default function BusesPage() {
  const [tab, setTab] = useState<(typeof TABS)[number]>('Operator');

  const { data: operators } = useQuery({ queryKey: ['admin-look', 'bus-operators'], queryFn: () => adminApi.get('bus-operators', { limit: 100 }) });
  const { data: terminals } = useQuery({ queryKey: ['admin-look', 'bus-terminals'], queryFn: () => adminApi.get('bus-terminals', { limit: 100 }) });
  const { data: buses } = useQuery({ queryKey: ['admin-look', 'buses'], queryFn: () => adminApi.get('buses', { limit: 100 }) });
  const { data: routes } = useQuery({ queryKey: ['admin-look', 'bus-routes'], queryFn: () => adminApi.get('bus-routes', { limit: 100 }) });

  const opOptions = (operators?.items ?? []).map((o: any) => ({ value: o.id, label: o.name }));
  const termOptions = (terminals?.items ?? []).map((t: any) => ({ value: t.id, label: `${t.name} (${t.city})` }));
  const busOptions = (buses?.items ?? []).map((b: any) => ({ value: b.id, label: `${b.name} • ${b.className}` }));
  const routeOptions = (routes?.items ?? []).map((r: any) => ({
    value: r.id,
    label: `${r.originTerminal?.name ?? r.originTerminalId} → ${r.destinationTerminal?.name ?? r.destinationTerminalId}`,
  }));

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Manajemen Bus</h1>
        <p className="text-sm text-muted-foreground">Kelola operator, terminal, armada, rute, dan jadwal bus.</p>
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
          title="Operator Bus"
          resource="bus-operators"
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

      {tab === 'Terminal' && (
        <EntityManager
          title="Terminal Bus"
          resource="bus-terminals"
          columns={[
            { key: 'name', label: 'Nama' },
            { key: 'city', label: 'Kota' },
            { key: 'status', label: 'Status', render: (r) => <ActiveBadge active={r.isActive} /> },
          ]}
          fields={[
            { name: 'name', label: 'Nama Terminal', required: true },
            { name: 'city', label: 'Kota', required: true },
            { name: 'address', label: 'Alamat' },
            { name: 'isActive', label: 'Aktif', type: 'checkbox' },
          ]}
          createDefaults={{ isActive: true }}
        />
      )}

      {tab === 'Bus' && (
        <EntityManager
          title="Armada Bus"
          resource="buses"
          columns={[
            { key: 'name', label: 'Nama' },
            { key: 'className', label: 'Kelas' },
            { key: 'capacity', label: 'Kapasitas' },
            { key: 'operator', label: 'Operator', render: (r) => r.operator?.name ?? '—' },
            { key: 'status', label: 'Status', render: (r) => <ActiveBadge active={r.isActive} /> },
          ]}
          fields={[
            { name: 'operatorId', label: 'Operator', type: 'select', options: opOptions, required: true },
            { name: 'name', label: 'Nama Bus', required: true },
            { name: 'plateNumber', label: 'Nomor Polisi' },
            { name: 'className', label: 'Kelas', required: true },
            { name: 'capacity', label: 'Kapasitas Kursi', type: 'number' },
            { name: 'facilities', label: 'Fasilitas', type: 'tags' },
            { name: 'isActive', label: 'Aktif', type: 'checkbox' },
          ]}
          createDefaults={{ isActive: true, capacity: 40 }}
        />
      )}

      {tab === 'Rute' && (
        <EntityManager
          title="Rute Bus"
          resource="bus-routes"
          columns={[
            { key: 'origin', label: 'Asal', render: (r) => r.originTerminal?.name ?? '—' },
            { key: 'destination', label: 'Tujuan', render: (r) => r.destinationTerminal?.name ?? '—' },
            { key: 'durationMinutes', label: 'Durasi (mnt)' },
            { key: 'distanceKm', label: 'Jarak (km)' },
            { key: 'status', label: 'Status', render: (r) => <ActiveBadge active={r.isActive} /> },
          ]}
          fields={[
            { name: 'originTerminalId', label: 'Terminal Asal', type: 'select', options: termOptions, required: true },
            { name: 'destinationTerminalId', label: 'Terminal Tujuan', type: 'select', options: termOptions, required: true },
            { name: 'durationMinutes', label: 'Durasi (menit)', type: 'number', required: true },
            { name: 'distanceKm', label: 'Jarak (km)', type: 'number' },
            { name: 'isActive', label: 'Aktif', type: 'checkbox' },
          ]}
          createDefaults={{ isActive: true }}
        />
      )}

      {tab === 'Jadwal' && (
        <EntityManager
          title="Jadwal Bus"
          resource="bus-schedules"
          columns={[
            { key: 'route', label: 'Rute', render: (r) => `${r.route?.originTerminal?.name ?? ''} → ${r.route?.destinationTerminal?.name ?? ''}` },
            { key: 'bus', label: 'Bus', render: (r) => r.bus?.name ?? '—' },
            { key: 'departureTime', label: 'Berangkat', render: (r) => `${new Date(r.departureTime).toLocaleDateString('id-ID')} ${formatTime(r.departureTime)}` },
            { key: 'price', label: 'Harga', render: (r) => formatIDR(r.price) },
            { key: 'status', label: 'Status', render: (r) => <Badge variant={r.status === 'ACTIVE' ? 'success' : 'default'}>{r.status}</Badge> },
          ]}
          fields={[
            { name: 'routeId', label: 'Rute', type: 'select', options: routeOptions, required: true },
            { name: 'busId', label: 'Bus', type: 'select', options: busOptions, required: true },
            { name: 'operatorId', label: 'Operator', type: 'select', options: opOptions, required: true },
            { name: 'departureTerminalId', label: 'Terminal Keberangkatan', type: 'select', options: termOptions, required: true },
            { name: 'arrivalTerminalId', label: 'Terminal Kedatangan', type: 'select', options: termOptions, required: true },
            { name: 'departureTime', label: 'Waktu Berangkat', type: 'datetime', required: true },
            { name: 'arrivalTime', label: 'Waktu Tiba', type: 'datetime', required: true },
            { name: 'price', label: 'Harga (Rp)', type: 'number', required: true },
          ]}
        />
      )}
    </div>
  );
}
