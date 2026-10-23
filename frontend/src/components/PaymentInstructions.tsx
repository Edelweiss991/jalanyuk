import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Copy, Check, QrCode, Landmark, Wallet, CreditCard } from 'lucide-react';
import { formatIDR, formatDateTime } from '../lib/format';

/**
 * Payment instructions for the SIMULATED payment methods.
 *
 * The VA / e-wallet numbers are derived deterministically from the booking
 * code, so the same booking always shows the same number — no backend state
 * needed. Everything here is a simulation: no real money moves.
 */
function digitsFromCode(code: string, count: number): string {
  // Simple stable hash → decimal digits (same idea as the C demo's stable id).
  let h1 = 0x811c9dc5;
  let h2 = 0x01000193;
  for (let i = 0; i < code.length; i++) {
    h1 = Math.imul(h1 ^ code.charCodeAt(i), 0x01000193) >>> 0;
    h2 = (Math.imul(h2, 31) + code.charCodeAt(i) * (i + 7)) >>> 0;
  }
  let out = '';
  let x = h1;
  let y = h2;
  while (out.length < count) {
    x = (Math.imul(x, 1103515245) + 12345) >>> 0;
    y = (Math.imul(y, 22695477) + 1) >>> 0;
    out += String((x + y) % 10);
  }
  return out;
}

export function virtualAccountNumber(code: string): string {
  return '8808' + digitsFromCode(code, 12); // 16 digits, bank-style VA
}

export function ewalletNumber(code: string): string {
  return '0812' + digitsFromCode('EW' + code, 8); // phone-like number
}

export const SIMULATION_CARD_NUMBER = '4242 4242 4242 4242';

function group4(n: string): string {
  return n.replace(/(.{4})/g, '$1 ').trim();
}

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value.replace(/\s/g, ''));
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable — number is visible to copy manually */
    }
  };
  return (
    <button
      onClick={copy}
      className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
      aria-label="Salin nomor"
    >
      {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
      {copied ? 'Disalin' : 'Salin'}
    </button>
  );
}

interface Props {
  method?: string;
  code: string;
  total: number;
  expiresAt?: string | null;
}

export default function PaymentInstructions({ method, code, total, expiresAt }: Props) {
  const [qrUrl, setQrUrl] = useState<string>('');

  useEffect(() => {
    if (method !== 'SIMULATION_QRIS') return;
    const payload = `AYORA-SIMULASI|QRIS|${code}|${total}|IDR`;
    QRCode.toDataURL(payload, { width: 260, margin: 2 })
      .then(setQrUrl)
      .catch(() => setQrUrl(''));
  }, [method, code, total]);

  const deadline = expiresAt ? (
    <p className="text-sm text-amber-600 dark:text-amber-400 font-medium">
      Bayar sebelum {formatDateTime(expiresAt)}
    </p>
  ) : null;

  if (method === 'SIMULATION_QRIS') {
    return (
      <div className="rounded-xl border bg-white dark:bg-gray-900 p-5 text-center">
        <div className="flex items-center justify-center gap-2 font-semibold">
          <QrCode className="h-5 w-5 text-primary" /> QRIS
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">AYORA • Kode {code}</p>
        {qrUrl ? (
          <img src={qrUrl} alt={`Kode QR pembayaran ${code}`} className="mx-auto my-3 h-[240px] w-[240px] rounded-lg border" />
        ) : (
          <div className="mx-auto my-3 h-[240px] w-[240px] rounded-lg border animate-pulse bg-gray-100 dark:bg-gray-800" />
        )}
        <div className="text-2xl font-bold">{formatIDR(total)}</div>
        <p className="text-xs text-muted-foreground mt-1">
          Pindai dengan aplikasi pembayaran apa pun — ini simulasi, tidak ada dana yang berpindah.
        </p>
        <div className="mt-2">{deadline}</div>
      </div>
    );
  }

  if (method === 'SIMULATION_VA') {
    const va = virtualAccountNumber(code);
    return (
      <div className="rounded-xl border bg-white dark:bg-gray-900 p-5">
        <div className="flex items-center gap-2 font-semibold">
          <Landmark className="h-5 w-5 text-primary" /> Transfer Virtual Account
        </div>
        <p className="text-sm text-muted-foreground mt-0.5">Bank AYORA (Simulasi) • Kode {code}</p>
        <div className="mt-4">
          <div className="text-xs text-muted-foreground">Nomor Virtual Account</div>
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-2xl md:text-3xl font-bold font-mono tracking-wider">{group4(va)}</span>
            <CopyButton value={va} />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-xs text-muted-foreground">Jumlah transfer (persis):</span>
          <span className="text-xl font-bold">{formatIDR(total)}</span>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Transfer ke nomor VA di atas melalui ATM / mobile banking (simulasi). Pembayaran terverifikasi otomatis setelah kamu konfirmasi.
        </p>
        <div className="mt-2">{deadline}</div>
      </div>
    );
  }

  if (method === 'SIMULATION_EWALLET') {
    const num = ewalletNumber(code);
    return (
      <div className="rounded-xl border bg-white dark:bg-gray-900 p-5">
        <div className="flex items-center gap-2 font-semibold">
          <Wallet className="h-5 w-5 text-primary" /> E-Wallet
        </div>
        <p className="text-sm text-muted-foreground mt-0.5">Kirim ke nomor tujuan simulasi • Kode {code}</p>
        <div className="mt-4">
          <div className="text-xs text-muted-foreground">Nomor Tujuan</div>
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-2xl md:text-3xl font-bold font-mono tracking-wider">{num.replace(/(.{4})/g, '$1 ').trim()}</span>
            <CopyButton value={num} />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-xs text-muted-foreground">Jumlah:</span>
          <span className="text-xl font-bold">{formatIDR(total)}</span>
        </div>
        <div className="mt-2">{deadline}</div>
      </div>
    );
  }

  // SIMULATION_CARD (default)
  return (
    <div className="rounded-xl border bg-white dark:bg-gray-900 p-5">
      <div className="flex items-center gap-2 font-semibold">
        <CreditCard className="h-5 w-5 text-primary" /> Kartu Kredit/Debit
      </div>
      <p className="text-sm text-muted-foreground mt-0.5">Gunakan kartu simulasi berikut • Kode {code}</p>
      <div className="mt-4">
        <div className="text-xs text-muted-foreground">Nomor Kartu Simulasi</div>
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-2xl md:text-3xl font-bold font-mono tracking-wider">{SIMULATION_CARD_NUMBER}</span>
          <CopyButton value={SIMULATION_CARD_NUMBER} />
        </div>
        <p className="text-xs text-muted-foreground mt-1">Tanggal kedaluwarsa & CVV: bebas (mode simulasi).</p>
      </div>
      <div className="mt-3 flex items-baseline gap-2">
        <span className="text-xs text-muted-foreground">Jumlah:</span>
        <span className="text-xl font-bold">{formatIDR(total)}</span>
      </div>
      <div className="mt-2">{deadline}</div>
    </div>
  );
}
