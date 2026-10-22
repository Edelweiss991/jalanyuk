import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../../services/api';
import { Button, Card, Input, Select, Label, Badge, Skeleton, useToast } from '../../components/ui';

const KNOWN_KEYS: { key: string; label: string; type?: 'text' | 'number' | 'select'; options?: string[] }[] = [
  { key: 'platform_name', label: 'Nama Platform' },
  { key: 'copyright', label: 'Teks Copyright' },
  { key: 'service_fee_per_passenger', label: 'Biaya Layanan per Penumpang (Rp)', type: 'number' },
  { key: 'default_theme', label: 'Tema Default', type: 'select', options: ['system', 'light', 'dark'] },
  { key: 'support_email', label: 'Email Dukungan' },
];

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const { addToast } = useToast();
  const [form, setForm] = useState<Record<string, string>>({});
  const [couponForm, setCouponForm] = useState({ code: '', type: 'PERCENTAGE', value: '10', minSpend: '0', maxDiscount: '', usageLimit: '', expiresAt: '' });

  const { data: settings, isLoading } = useQuery({ queryKey: ['admin', 'settings'], queryFn: adminApi.settings });
  const { data: coupons } = useQuery({ queryKey: ['admin', 'coupons'], queryFn: () => adminApi.get('coupons', { limit: 50 }) });

  useEffect(() => {
    if (settings) {
      const init: Record<string, string> = {};
      for (const k of KNOWN_KEYS) init[k.key] = settings[k.key] ?? '';
      setForm(init);
    }
  }, [settings]);

  const saveMutation = useMutation({
    mutationFn: () => adminApi.updateSettings(form),
    onSuccess: () => { addToast('success', 'Pengaturan disimpan'); queryClient.invalidateQueries({ queryKey: ['admin', 'settings'] }); },
    onError: (e: any) => addToast('error', e?.message || 'Gagal menyimpan pengaturan'),
  });

  const couponMutation = useMutation({
    mutationFn: () => adminApi.post('coupons', {
      code: couponForm.code.toUpperCase(),
      type: couponForm.type,
      value: Number(couponForm.value),
      minSpend: Number(couponForm.minSpend || 0),
      ...(couponForm.maxDiscount ? { maxDiscount: Number(couponForm.maxDiscount) } : {}),
      ...(couponForm.usageLimit ? { usageLimit: Number(couponForm.usageLimit) } : {}),
      ...(couponForm.expiresAt ? { expiresAt: new Date(couponForm.expiresAt).toISOString() } : {}),
    }),
    onSuccess: () => { addToast('success', 'Kupon dibuat'); queryClient.invalidateQueries({ queryKey: ['admin', 'coupons'] }); },
    onError: (e: any) => addToast('error', e?.message || 'Gagal membuat kupon'),
  });

  const toggleCoupon = useMutation({
    mutationFn: (c: any) => adminApi.patch('coupons', c.id, { isActive: !c.isActive }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'coupons'] }),
    onError: (e: any) => addToast('error', e?.message || 'Gagal memperbarui kupon'),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Pengaturan</h1>
        <p className="text-sm text-muted-foreground">Nilai disimpan di tabel SystemSetting dan dipakai backend (mis. biaya layanan saat checkout).</p>
      </div>

      <Card className="p-4">
        <h3 className="font-semibold mb-3">Pengaturan Platform</h3>
        {isLoading ? <Skeleton className="h-40 w-full" /> : (
          <div className="space-y-3 max-w-xl">
            {KNOWN_KEYS.map((k) => (
              <div key={k.key}>
                <Label>{k.label}</Label>
                {k.type === 'select' ? (
                  <Select value={form[k.key] ?? ''} onChange={(e) => setForm({ ...form, [k.key]: e.target.value })}>
                    {(k.options ?? []).map((o) => <option key={o} value={o}>{o}</option>)}
                  </Select>
                ) : (
                  <Input type={k.type === 'number' ? 'number' : 'text'} value={form[k.key] ?? ''} onChange={(e) => setForm({ ...form, [k.key]: e.target.value })} />
                )}
              </div>
            ))}
            <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
              {saveMutation.isPending ? 'Menyimpan…' : 'Simpan Pengaturan'}
            </Button>
          </div>
        )}
      </Card>

      <Card className="p-4">
        <h3 className="font-semibold mb-3">Kupon Diskon</h3>
        <div className="space-y-2 text-sm mb-5">
          {(coupons?.items ?? []).map((c: any) => (
            <div key={c.id} className="flex flex-wrap items-center justify-between gap-2 border-b last:border-0 pb-2">
              <span>
                <b className="font-mono">{c.code}</b> • {c.type === 'PERCENTAGE' ? `${c.value}%` : `Rp${c.value.toLocaleString('id-ID')}`}
                {c.minSpend ? ` • min. Rp${c.minSpend.toLocaleString('id-ID')}` : ''} • dipakai {c.usedCount ?? 0}x
              </span>
              <span className="flex items-center gap-2">
                <Badge variant={c.isActive ? 'success' : 'default'}>{c.isActive ? 'Aktif' : 'Nonaktif'}</Badge>
                <Button size="sm" variant="outline" onClick={() => toggleCoupon.mutate(c)}>{c.isActive ? 'Nonaktifkan' : 'Aktifkan'}</Button>
              </span>
            </div>
          ))}
          {(coupons?.items ?? []).length === 0 && <p className="text-muted-foreground">Belum ada kupon.</p>}
        </div>

        <h4 className="font-medium mb-2">Buat Kupon Baru</h4>
        <div className="grid md:grid-cols-3 gap-3 max-w-3xl">
          <div><Label>Kode</Label><Input value={couponForm.code} onChange={(e) => setCouponForm({ ...couponForm, code: e.target.value })} placeholder="PROMO2026" /></div>
          <div>
            <Label>Tipe</Label>
            <Select value={couponForm.type} onChange={(e) => setCouponForm({ ...couponForm, type: e.target.value })}>
              <option value="PERCENTAGE">Persentase (%)</option>
              <option value="FIXED">Nominal Tetap (Rp)</option>
            </Select>
          </div>
          <div><Label>Nilai</Label><Input type="number" value={couponForm.value} onChange={(e) => setCouponForm({ ...couponForm, value: e.target.value })} /></div>
          <div><Label>Min. Belanja (Rp)</Label><Input type="number" value={couponForm.minSpend} onChange={(e) => setCouponForm({ ...couponForm, minSpend: e.target.value })} /></div>
          <div><Label>Maks. Diskon (Rp, opsional)</Label><Input type="number" value={couponForm.maxDiscount} onChange={(e) => setCouponForm({ ...couponForm, maxDiscount: e.target.value })} /></div>
          <div><Label>Batas Pemakaian (opsional)</Label><Input type="number" value={couponForm.usageLimit} onChange={(e) => setCouponForm({ ...couponForm, usageLimit: e.target.value })} /></div>
          <div><Label>Kedaluwarsa (opsional)</Label><Input type="date" value={couponForm.expiresAt} onChange={(e) => setCouponForm({ ...couponForm, expiresAt: e.target.value })} /></div>
        </div>
        <Button className="mt-3" onClick={() => couponMutation.mutate()} disabled={couponMutation.isPending || !couponForm.code}>
          Buat Kupon
        </Button>
      </Card>
    </div>
  );
}
