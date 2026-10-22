import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, Power } from 'lucide-react';
import { adminApi } from '../../services/api';
import { Button, Card, Input, Select, Label, Modal, ConfirmDialog, Badge, Skeleton, EmptyState, Pagination, useToast } from '../../components/ui';

export interface FieldDef {
  name: string;
  label: string;
  type?: 'text' | 'number' | 'select' | 'checkbox' | 'datetime' | 'tags';
  options?: { value: string; label: string }[];
  required?: boolean;
}

export interface ColumnDef {
  key: string;
  label: string;
  render?: (row: any) => React.ReactNode;
}

interface Props {
  title: string;
  resource: string;
  columns: ColumnDef[];
  fields: FieldDef[];
  createDefaults?: Record<string, any>;
}

export default function EntityManager({ title, resource, columns, fields, createDefaults = {} }: Props) {
  const queryClient = useQueryClient();
  const { addToast } = useToast();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [form, setForm] = useState<Record<string, any>>({});
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin', resource, page, search],
    queryFn: () => adminApi.get(resource, { page, limit: 10, ...(search ? { search } : {}) }),
  });
  const items: any[] = data?.items ?? [];
  const totalPages = data?.pagination ? Math.max(1, Math.ceil((data.pagination.total ?? items.length) / (data.pagination.limit ?? 10))) : 1;

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['admin', resource] });

  const saveMutation = useMutation({
    mutationFn: () => {
      const payload: Record<string, any> = {};
      for (const f of fields) {
        let v = form[f.name];
        if (v === '' || v === undefined) continue;
        if (f.type === 'number') v = Number(v);
        if (f.type === 'tags') v = String(v).split(',').map((x) => x.trim()).filter(Boolean);
        if (f.type === 'datetime') v = new Date(v).toISOString();
        payload[f.name] = v;
      }
      return editing ? adminApi.patch(resource, editing.id, payload) : adminApi.post(resource, payload);
    },
    onSuccess: () => { addToast('success', `${title} berhasil disimpan`); setModalOpen(false); invalidate(); },
    onError: (e: any) => addToast('error', e?.message || 'Gagal menyimpan'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApi.del(resource, id),
    onSuccess: () => { addToast('success', 'Data dinonaktifkan/dihapus'); setDeleteTarget(null); invalidate(); },
    onError: (e: any) => addToast('error', e?.message || 'Gagal menghapus'),
  });

  const toggleMutation = useMutation({
    mutationFn: (row: any) => adminApi.patch(resource, row.id, { isActive: !row.isActive }),
    onSuccess: () => { addToast('success', 'Status diperbarui'); invalidate(); },
    onError: (e: any) => addToast('error', e?.message || 'Gagal memperbarui status'),
  });

  const openCreate = () => {
    setEditing(null);
    const init: Record<string, any> = { ...createDefaults };
    for (const f of fields) if (init[f.name] === undefined) init[f.name] = f.type === 'checkbox' ? false : '';
    setForm(init);
    setModalOpen(true);
  };

  const openEdit = (row: any) => {
    setEditing(row);
    const init: Record<string, any> = {};
    for (const f of fields) {
      let v = row[f.name];
      if (f.type === 'tags' && Array.isArray(v)) v = v.join(', ');
      if (f.type === 'datetime' && v) v = new Date(v).toISOString().slice(0, 16);
      init[f.name] = v ?? (f.type === 'checkbox' ? false : '');
    }
    setForm(init);
    setModalOpen(true);
  };

  return (
    <Card className="p-4">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h3 className="font-semibold">{title}</h3>
        <div className="flex gap-2">
          <Input placeholder="Cari…" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="w-44" />
          <Button size="sm" onClick={openCreate}><Plus className="h-4 w-4 mr-1" /> Tambah</Button>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-2"><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /></div>
      ) : items.length === 0 ? (
        <EmptyState title="Belum ada data" description="Klik Tambah untuk membuat data baru." />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                {columns.map((c) => <th key={c.key} className="py-2 pr-3 font-medium">{c.label}</th>)}
                <th className="py-2 font-medium">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {items.map((row) => (
                <tr key={row.id} className="border-b last:border-0">
                  {columns.map((c) => (
                    <td key={c.key} className="py-2 pr-3">
                      {c.render ? c.render(row) : String(row[c.key] ?? '—')}
                    </td>
                  ))}
                  <td className="py-2">
                    <div className="flex gap-1">
                      {'isActive' in row && (
                        <Button size="sm" variant="outline" title="Aktif/Nonaktif" onClick={() => toggleMutation.mutate(row)}>
                          <Power className="h-3.5 w-3.5" />
                        </Button>
                      )}
                      <Button size="sm" variant="outline" onClick={() => openEdit(row)}><Pencil className="h-3.5 w-3.5" /></Button>
                      <Button size="sm" variant="outline" onClick={() => setDeleteTarget(row)}><Trash2 className="h-3.5 w-3.5" /></Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && <div className="mt-4"><Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} /></div>}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={`${editing ? 'Ubah' : 'Tambah'} ${title}`}>
        <div className="space-y-3">
          {fields.map((f) => (
            <div key={f.name}>
              <Label>{f.label}{f.required ? ' *' : ''}</Label>
              {f.type === 'select' ? (
                <Select value={String(form[f.name] ?? '')} onChange={(e) => setForm({ ...form, [f.name]: e.target.value })}>
                  <option value="">— Pilih —</option>
                  {(f.options ?? []).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </Select>
              ) : f.type === 'checkbox' ? (
                <div>
                  <input type="checkbox" checked={!!form[f.name]} onChange={(e) => setForm({ ...form, [f.name]: e.target.checked })} className="h-4 w-4" />
                </div>
              ) : (
                <Input
                  type={f.type === 'number' ? 'number' : f.type === 'datetime' ? 'datetime-local' : 'text'}
                  value={String(form[f.name] ?? '')}
                  onChange={(e) => setForm({ ...form, [f.name]: e.target.value })}
                  placeholder={f.type === 'tags' ? 'Pisahkan dengan koma' : undefined}
                />
              )}
            </div>
          ))}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setModalOpen(false)}>Batal</Button>
            <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
              {saveMutation.isPending ? 'Menyimpan…' : 'Simpan'}
            </Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
        title={`Hapus ${title}?`}
        description="Data akan dinonaktifkan (soft delete) dan tidak lagi muncul di pencarian publik."
        confirmText="Ya, nonaktifkan"
      />
    </Card>
  );
}

export function ActiveBadge({ active }: { active: boolean }) {
  return <Badge variant={active ? 'success' : 'default'}>{active ? 'Aktif' : 'Nonaktif'}</Badge>;
}
