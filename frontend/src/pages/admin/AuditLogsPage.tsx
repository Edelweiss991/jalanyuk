import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '../../services/api';
import { Card, Input, Badge, Skeleton, EmptyState, Pagination } from '../../components/ui';
import { formatDateTime } from '../../lib/format';

export default function AuditLogsPage() {
  const [page, setPage] = useState(1);
  const [entity, setEntity] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'audit-logs', page, entity],
    queryFn: () => adminApi.get('audit-logs', { page, limit: 20, ...(entity ? { entityType: entity } : {}) }),
  });
  const items: any[] = data?.items ?? [];
  const totalPages = data?.pagination ? Math.max(1, Math.ceil((data.pagination.total ?? 0) / (data.pagination.limit ?? 20))) : 1;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Audit Log</h1>
        <p className="text-sm text-muted-foreground">Catatan aktivitas administratif. Log ini terpisah dari log eksekusi Algorithm Lab dan tidak dapat diubah dari Lab.</p>
      </div>
      <Card className="p-4">
        <div className="mb-4">
          <Input placeholder="Filter tipe entitas (mis. Booking, Bus)…" value={entity} onChange={(e) => { setEntity(e.target.value); setPage(1); }} className="w-72" />
        </div>
        {isLoading ? (
          <div className="space-y-2"><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /></div>
        ) : items.length === 0 ? (
          <EmptyState title="Belum ada log" description="Aktivitas admin akan tercatat di sini." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="py-2 pr-3 font-medium">Waktu</th>
                  <th className="py-2 pr-3 font-medium">Admin</th>
                  <th className="py-2 pr-3 font-medium">Aksi</th>
                  <th className="py-2 pr-3 font-medium">Entitas</th>
                  <th className="py-2 font-medium">Detail</th>
                </tr>
              </thead>
              <tbody>
                {items.map((log) => (
                  <tr key={log.id} className="border-b last:border-0 align-top">
                    <td className="py-2 pr-3 whitespace-nowrap">{formatDateTime(log.createdAt)}</td>
                    <td className="py-2 pr-3">{log.user?.email ?? '—'}</td>
                    <td className="py-2 pr-3"><Badge variant="default">{log.action}</Badge></td>
                    <td className="py-2 pr-3">{log.entityType}</td>
                    <td className="py-2 max-w-[320px]">
                      <span className="text-muted-foreground break-words">
                        {log.newValue ? JSON.stringify(log.newValue).slice(0, 160) : log.oldValue ? JSON.stringify(log.oldValue).slice(0, 160) : '—'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {totalPages > 1 && <div className="mt-4"><Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} /></div>}
      </Card>
    </div>
  );
}
