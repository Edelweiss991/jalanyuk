import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../../services/api';
import { Button, Card, Input, Select, Badge, Skeleton, EmptyState, Pagination, useToast } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import { formatDateTime } from '../../lib/format';

export default function UsersPage() {
  const queryClient = useQueryClient();
  const { addToast } = useToast();
  const { user: me } = useAuth();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'users', page, search],
    queryFn: () => adminApi.get('users', { page, limit: 15, ...(search ? { search } : {}) }),
  });
  const items: any[] = data?.items ?? [];
  const totalPages = data?.pagination ? Math.max(1, Math.ceil((data.pagination.total ?? 0) / (data.pagination.limit ?? 15))) : 1;

  const patchMutation = useMutation({
    mutationFn: ({ id, body }: { id: string; body: any }) => adminApi.patch('users', id, body),
    onSuccess: () => { addToast('success', 'Pengguna diperbarui'); queryClient.invalidateQueries({ queryKey: ['admin', 'users'] }); },
    onError: (e: any) => addToast('error', e?.message || 'Gagal memperbarui pengguna'),
  });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Manajemen Pengguna</h1>
        <p className="text-sm text-muted-foreground">Password tidak pernah ditampilkan. Admin tidak dapat menonaktifkan akunnya sendiri.</p>
      </div>
      <Card className="p-4">
        <div className="mb-4">
          <Input placeholder="Cari nama / email…" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="w-64" />
        </div>
        {isLoading ? (
          <div className="space-y-2"><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /></div>
        ) : items.length === 0 ? (
          <EmptyState title="Tidak ada pengguna" description="Belum ada pengguna yang cocok." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="py-2 pr-3 font-medium">Nama</th>
                  <th className="py-2 pr-3 font-medium">Email</th>
                  <th className="py-2 pr-3 font-medium">Role</th>
                  <th className="py-2 pr-3 font-medium">Status</th>
                  <th className="py-2 pr-3 font-medium">Terdaftar</th>
                  <th className="py-2 font-medium">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {items.map((u) => (
                  <tr key={u.id} className="border-b last:border-0">
                    <td className="py-2 pr-3">{u.profile?.fullName ?? '—'}</td>
                    <td className="py-2 pr-3">{u.email}</td>
                    <td className="py-2 pr-3">
                      <Select
                        value={u.role}
                        disabled={u.id === me?.id}
                        onChange={(e) => patchMutation.mutate({ id: u.id, body: { role: e.target.value } })}
                        className="w-32"
                      >
                        <option value="CUSTOMER">CUSTOMER</option>
                        <option value="ADMIN">ADMIN</option>
                      </Select>
                    </td>
                    <td className="py-2 pr-3">
                      <Badge variant={u.isActive ? 'success' : 'default'}>{u.isActive ? 'Aktif' : 'Nonaktif'}</Badge>
                    </td>
                    <td className="py-2 pr-3">{formatDateTime(u.createdAt)}</td>
                    <td className="py-2">
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={u.id === me?.id}
                        onClick={() => patchMutation.mutate({ id: u.id, body: { isActive: !u.isActive } })}
                      >
                        {u.isActive ? 'Nonaktifkan' : 'Aktifkan'}
                      </Button>
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
