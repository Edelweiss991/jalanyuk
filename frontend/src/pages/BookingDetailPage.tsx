import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Printer, Ticket, XCircle, CreditCard } from 'lucide-react';
import { bookingApi } from '../services/api';
import { Button, Card, Badge, Skeleton, ConfirmDialog, useToast } from '../components/ui';
import { formatIDR, formatDateTime, formatDate, formatTime } from '../lib/format';

const PAYMENT_LABEL: Record<string, string> = {
  QRIS: 'QRIS (Simulasi)',
  VIRTUAL_ACCOUNT: 'Virtual Account (Simulasi)',
  E_WALLET: 'E-Wallet (Simulasi)',
  CARD: 'Kartu Kredit/Debit (Simulasi)',
};

export default function BookingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const { addToast } = useToast();
  const [cancelOpen, setCancelOpen] = useState(false);
  const [method, setMethod] = useState('QRIS');

  const { data: booking, isLoading } = useQuery({
    queryKey: ['booking', id],
    queryFn: () => bookingApi.detail(id!),
    enabled: !!id,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['booking', id] });
    queryClient.invalidateQueries({ queryKey: ['bookings'] });
  };

  const payMutation = useMutation({
    mutationFn: (scenario: 'SUCCESS' | 'FAILED' | 'EXPIRED') => bookingApi.simulatePayment(id!, scenario),
    onSuccess: (res: any) => {
      if (res?.paymentStatus === 'PAID') addToast('success', 'Pembayaran simulasi berhasil — e-ticket terbit!');
      else addToast('error', `Hasil simulasi pembayaran: ${res?.paymentStatus}`);
      invalidate();
    },
    onError: (e: any) => addToast('error', e?.message || 'Simulasi pembayaran gagal'),
  });

  const cancelMutation = useMutation({
    mutationFn: () => bookingApi.cancel(id!),
    onSuccess: () => { addToast('success', 'Booking dibatalkan'); setCancelOpen(false); invalidate(); },
    onError: (e: any) => addToast('error', e?.message || 'Gagal membatalkan booking'),
  });

  if (isLoading) return <div className="container py-8"><Skeleton className="h-64 w-full" /></div>;
  if (!booking) return <div className="container py-8"><p>Booking tidak ditemukan.</p></div>;

  const schedule = booking.busSchedule || booking.trainSchedule;
  const route = schedule?.route;
  const origin = route?.originTerminal?.name || route?.originStation?.name || schedule?.departureTerminal?.name || schedule?.departureStation?.name || '';
  const destination = route?.destinationTerminal?.name || route?.destinationStation?.name || schedule?.arrivalTerminal?.name || schedule?.arrivalStation?.name || '';
  const vehicleName = booking.busSchedule?.bus?.name || booking.trainSchedule?.train?.name || schedule?.operator?.name || '';
  const isPaid = booking.payment?.status === 'PAID' && booking.status === 'CONFIRMED';
  const canAct = booking.status === 'PENDING';

  return (
    <div className="container py-8 max-w-3xl">
      <Link to="/my-bookings" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
        <ArrowLeft className="h-4 w-4" /> Kembali ke Pesanan Saya
      </Link>

      <Card className="p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="text-xs text-muted-foreground">Kode Booking</div>
            <div className="text-2xl font-bold font-mono">{booking.code}</div>
            <div className="text-sm text-muted-foreground">{booking.transportType === 'BUS' ? 'Bus' : 'Kereta'} • {vehicleName}</div>
          </div>
          <div className="flex gap-2">
            <Badge variant={booking.status === 'CONFIRMED' ? 'success' : booking.status === 'PENDING' ? 'warning' : 'default'}>{booking.status}</Badge>
            <Badge variant={booking.payment?.status === 'PAID' ? 'success' : 'default'}>{booking.payment?.status}</Badge>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-4 mt-6 text-sm">
          <div>
            <div className="text-muted-foreground">Keberangkatan</div>
            <div className="font-semibold">{origin}</div>
            <div>{schedule ? `${formatDate(schedule.departureTime)} • ${formatTime(schedule.departureTime)}` : '-'}</div>
          </div>
          <div>
            <div className="text-muted-foreground">Tujuan</div>
            <div className="font-semibold">{destination}</div>
            <div>{schedule ? `${formatDate(schedule.arrivalTime)} • ${formatTime(schedule.arrivalTime)}` : '-'}</div>
          </div>
          <div>
            <div className="text-muted-foreground">Dibuat</div>
            <div className="font-semibold">{formatDateTime(booking.createdAt)}</div>
            {booking.status === 'PENDING' && booking.expiresAt && (
              <div className="text-amber-600">Bayar sebelum {formatDateTime(booking.expiresAt)}</div>
            )}
          </div>
        </div>

        <div className="mt-6 border-t pt-4">
          <h3 className="font-semibold mb-2">Kursi & Penumpang</h3>
          {(booking.items ?? []).map((it: any) => (
            <div key={it.id} className="flex justify-between text-sm py-1 border-b last:border-0">
              <span>{it.description} • Kursi <b>{it.seatNumber}</b></span>
              <span>{formatIDR(it.price)}</span>
            </div>
          ))}
          {(booking.passengers ?? []).map((p: any) => (
            <div key={p.id} className="text-sm py-0.5 text-muted-foreground">{p.fullName}{p.idNumber ? ` • ${p.idNumber}` : ''}</div>
          ))}
        </div>

        <div className="mt-4 border-t pt-4 space-y-1 text-sm">
          <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{formatIDR(booking.subtotal)}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Biaya layanan</span><span>{formatIDR(booking.serviceFee)}</span></div>
          {booking.discount > 0 && <div className="flex justify-between text-green-600"><span>Diskon{booking.couponCode ? ` (${booking.couponCode})` : ''}</span><span>−{formatIDR(booking.discount)}</span></div>}
          <div className="flex justify-between font-bold text-base"><span>Total</span><span>{formatIDR(booking.total)}</span></div>
          <div className="text-xs text-muted-foreground">Metode: {booking.payment?.method} • Pembayaran Simulasi — bukan transaksi sungguhan.</div>
        </div>

        {isPaid && (
          <div className="mt-6 rounded-xl border-2 border-dashed border-primary/50 bg-primary/5 p-5 text-center print:border-black">
            <Ticket className="h-8 w-8 mx-auto text-primary mb-2" />
            <div className="text-xs tracking-widest text-muted-foreground">E-TICKET • DATA SIMULASI</div>
            <div className="text-3xl font-bold font-mono my-1">{booking.code}</div>
            <div className="text-sm">{origin} → {destination} • {schedule ? `${formatDate(schedule.departureTime)} ${formatTime(schedule.departureTime)}` : ''}</div>
            <div className="text-sm">Kursi: {(booking.items ?? []).map((i: any) => i.seatNumber).join(', ')}</div>
            <Button className="mt-3 print:hidden" variant="outline" onClick={() => window.print()}>
              <Printer className="h-4 w-4 mr-1" /> Cetak E-Ticket
            </Button>
          </div>
        )}

        {canAct && (
          <div className="mt-6 border-t pt-4">
            <h3 className="font-semibold mb-2 flex items-center gap-2"><CreditCard className="h-4 w-4" /> Pembayaran Simulasi</h3>
            <div className="flex flex-wrap gap-2 mb-3">
              {Object.entries(PAYMENT_LABEL).map(([k, v]) => (
                <button key={k} onClick={() => setMethod(k)} className={`px-3 py-1.5 rounded-full text-sm border ${method === k ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'}`}>{v}</button>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => payMutation.mutate('SUCCESS')} disabled={payMutation.isPending}>Simulasikan Bayar Berhasil</Button>
              <Button variant="outline" onClick={() => payMutation.mutate('FAILED')} disabled={payMutation.isPending}>Simulasikan Gagal</Button>
              <Button variant="outline" onClick={() => setCancelOpen(true)}>
                <XCircle className="h-4 w-4 mr-1" /> Batalkan Booking
              </Button>
            </div>
          </div>
        )}

        {(booking.status === 'CONFIRMED') && (
          <div className="mt-6 border-t pt-4">
            <Button variant="outline" onClick={() => setCancelOpen(true)}>
              <XCircle className="h-4 w-4 mr-1" /> Minta Refund / Batalkan
            </Button>
            <p className="text-xs text-muted-foreground mt-1">Booking yang sudah dibayar akan berstatus REFUND_REQUESTED dan diproses admin (refund simulasi).</p>
          </div>
        )}
      </Card>

      <ConfirmDialog
        isOpen={cancelOpen}
        onClose={() => setCancelOpen(false)}
        onConfirm={() => cancelMutation.mutate()}
        title="Batalkan booking ini?"
        description={booking.status === 'CONFIRMED' ? 'Booking dibatalkan dan permintaan refund simulasi dibuat untuk diproses admin. Kursi akan dibebaskan.' : 'Booking dibatalkan dan kursi yang ditahan akan dibebaskan.'}
        confirmText="Ya, batalkan"
      />
    </div>
  );
}
