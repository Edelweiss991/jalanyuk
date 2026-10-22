import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Eye } from 'lucide-react';
import { adminApi } from '../../services/api';
import { Button, Card, Input, Select, Modal, Badge, Skeleton, EmptyState, Pagination, useToast } from '../../components/ui';
import { formatIDR, formatDateTime } from '../../lib/format';

const STATUSES = ['PENDING', 'CONFIRMED', 'CANCELLED', 'EXPIRED', 'COMPLETED', 'REFUND_REQUESTED', 'REFUNDED'];

function statusVariant(s: string): any {
  if (s === 'CONFIRMED' || s === 'COMPLETED' || s === 'PAID') return 'success';
  if (s === 'PENDING' || s === 'REFUND_REQUESTED' || s === 'REFUND_PENDING') return 'warning';
  if (s === 'CANCELLED' || s === 'EXPIRED' || s === 'FAILED') return 'danger';
  return 'default';
}

export default function BookingsPage() {
  const queryClient = useQueryClient();
  const { addToast } = useToast();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [type, setType] = useState('');
  const [detailId, setDetailId] = useState<string | null>(null);
  const [newStatus, setNewStatus] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'bookings', page, search, status, type],
    queryFn: () => adminApi.get('bookings', {
      page, limit: 15,
      ...(search ? { search } : {}),
      ...(status ? { status } : {}),
      ...(type ? { transportType: type } : {}),
    }),
  });
  const items: any[] = data?.items ?? [];
  const totalPages = data?.pagination ? Math.max(1, Math.ceil((data.pagination.total ?? 0) / (data.pagination.limit ?? 15))) : 1;

  const { data: detail } = useQuery({
    queryKey: ['admin', 'booking-detail', detailId],
    queryFn: () => adminApi.get(`bookings/${detailId}`),
    enabled: !!detailId,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['admin', 'bookings'] });
    queryClient.invalidateQueries({ queryKey: ['admin', 'booking-detail'] });
  };

  const statusMutation = useMutation({
    mutationFn: () => adminApi.updateBookingStatus(detailId!, newStatus),
    onSuccess: () => { addToast('success', 'Status booking diperbarui'); invalidate(); },
    onError: (e: any) => addToast('error', e?.message || 'Gagal memperbarui status'),
  });

  const refundMutation = useMutation({
    mutationFn: ({ id, action }: { id: string; action: 'PROCESS' | 'REJECT' }) => adminApi.processRefund(id, action),
    onSuccess: () => { addToast('success', 'Refund diproses (simulasi)'); invalidate(); },
    onError: (e: any) => addToast('error', e?.message || 'Gagal memproses refund'),
  });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Manajemen Booking</h1>
        <p className="text-sm text-muted-foreground">Semua booking bus & kereta dari database.</p>
      </div>

      <Card className="p-4">
        <div className="flex flex-wrap gap-2 mb-4">
          <Input placeholder="Cari kode / email…" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="w-52" />
          <Select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className="w-44">
            <option value="">Semua Status</option>
            {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </Select>
          <Select value={type} onChange={(e) => { setType(e.target.value); setPage(1); }} className="w-36">
            <option value="">Semua Tipe</option>
            <option value="BUS">Bus</option>
            <option value="TRAIN">Kereta</option>
          </Select>
        </div>

        {isLoading ? (
          <div className="space-y-2"><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /></div>
        ) : items.length === 0 ? (
          <EmptyState title="Tidak ada booking" description="Belum ada booking yang cocok dengan filter." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="py-2 pr-3 font-medium">Kode</th>
                  <th className="py-2 pr-3 font-medium">Customer</th>
                  <th className="py-2 pr-3 font-medium">Tipe</th>
                  <th className="py-2 pr-3 font-medium">Status</th>
                  <th className="py-2 pr-3 font-medium">Pembayaran</th>
                  <th className="py-2 pr-3 font-medium">Total</th>
                  <th className="py-2 pr-3 font-medium">Dibuat</th>
                  <th className="py-2 font-medium">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {items.map((b) => (
                  <tr key={b.id} className="border-b last:border-0">
                    <td className="py-2 pr-3 font-mono font-medium">{b.code}</td>
                    <td className="py-2 pr-3">{b.user?.email ?? '—'}</td>
                    <td className="py-2 pr-3">{b.transportType}</td>
                    <td className="py-2 pr-3"><Badge variant={statusVariant(b.status)}>{b.status}</Badge></td>
                    <td className="py-2 pr-3"><Badge variant={statusVariant(b.payment?.status ?? '-')}>{b.payment?.status ?? '-'}</Badge></td>
                    <td className="py-2 pr-3">{formatIDR(b.total)}</td>
                    <td className="py-2 pr-3">{formatDateTime(b.createdAt)}</td>
                    <td className="py-2">
                      <Button size="sm" variant="outline" onClick={() => { setDetailId(b.id); setNewStatus(b.status); }}>
                        <Eye className="h-3.5 w-3.5 mr-1" /> Detail
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

      <Modal isOpen={!!detailId} onClose={() => setDetailId(null)} title={`Detail Booking ${detail?.code ?? ''}`}>
        {!detail ? (
          <Skeleton className="h-40 w-full" />
        ) : (
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-2">
              <div><span className="text-muted-foreground">Customer:</span> {detail.user?.profile?.fullName ?? detail.user?.email}</div>
              <div><span className="text-muted-foreground">Email:</span> {detail.user?.email}</div>
              <div><span className="text-muted-foreground">Status:</span> <Badge variant={statusVariant(detail.status)}>{detail.status}</Badge></div>
              <div><span className="text-muted-foreground">Pembayaran:</span> {detail.payment?.method} — <Badge variant={statusVariant(detail.payment?.status ?? '-')}>{detail.payment?.status}</Badge></div>
              <div><span className="text-muted-foreground">Subtotal:</span> {formatIDR(detail.subtotal)}</div>
              <div><span className="text-muted-foreground">Biaya Layanan:</span> {formatIDR(detail.serviceFee)}</div>
              <div><span className="text-muted-foreground">Diskon:</span> −{formatIDR(detail.discount)}</div>
              <div><span className="text-muted-foreground">Total:</span> <b>{formatIDR(detail.total)}</b></div>
            </div>

            <div>
              <div className="font-medium mb-1">Item & Kursi</div>
              {(detail.items ?? []).map((it: any) => (
                <div key={it.id} className="flex justify-between border-b last:border-0 py-1">
                  <span>{it.description} • Kursi {it.seatNumber}</span>
                  <span>{formatIDR(it.price)}</span>
                </div>
              ))}
            </div>

            <div>
              <div className="font-medium mb-1">Penumpang</div>
              {(detail.passengers ?? []).map((p: any) => (
                <div key={p.id} className="py-0.5">{p.fullName} {p.idNumber ? `• ${p.idNumber}` : ''} {p.phone ? `• ${p.phone}` : ''}</div>
              ))}
            </div>

            {(detail.refunds ?? []).length > 0 && (
              <div>
                <div className="font-medium mb-1">Refund (Simulasi)</div>
                {detail.refunds.map((r: any) => (
                  <div key={r.id} className="flex flex-wrap items-center justify-between gap-2 border-b last:border-0 py-1">
                    <span>{formatIDR(r.amount)} — <Badge variant={statusVariant(r.status)}>{r.status}</Badge> {r.reason ?? ''}</span>
                    {r.status === 'PENDING' && (
                      <span className="flex gap-1">
                        <Button size="sm" onClick={() => refundMutation.mutate({ id: r.id, action: 'PROCESS' })}>Proses</Button>
                        <Button size="sm" variant="outline" onClick={() => refundMutation.mutate({ id: r.id, action: 'REJECT' })}>Tolak</Button>
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-end gap-2 pt-2 border-t">
              <div className="flex-1">
                <div className="text-xs text-muted-foreground mb-1">Ubah Status Booking</div>
                <Select value={newStatus} onChange={(e) => setNewStatus(e.target.value)}>
                  {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                </Select>
              </div>
              <Button onClick={() => statusMutation.mutate()} disabled={statusMutation.isPending || newStatus === detail.status}>
                Simpan Status
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">Perubahan status tercatat di Audit Log. Membatalkan/mengedaluwarsakan booking akan membebaskan kursi.</p>
          </div>
        )}
      </Modal>
    </div>
  );
}
