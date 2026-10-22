import { type ClassValue, clsx } from 'clsx';

/**
 * Format number to Indonesian Rupiah (IDR)
 */
export function formatIDR(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format ISO datetime string to Indonesian locale with Jakarta timezone
 */
export function formatDateTime(isoString: string): string {
  return new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Jakarta',
  }).format(new Date(isoString));
}

/**
 * Format ISO datetime string to date only
 */
export function formatDate(isoString: string): string {
  return new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'medium',
    timeZone: 'Asia/Jakarta',
  }).format(new Date(isoString));
}

/**
 * Format ISO datetime string to time only
 */
export function formatTime(isoString: string): string {
  return new Intl.DateTimeFormat('id-ID', {
    timeStyle: 'short',
    timeZone: 'Asia/Jakarta',
  }).format(new Date(isoString));
}

/**
 * Format duration in minutes to "X j Y mnt"
 */
export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  
  if (hours === 0) {
    return `${mins} mnt`;
  }
  
  return `${hours} j ${mins} mnt`;
}

/**
 * Simple className utility for conditional classes
 */
export function cn(...inputs: ClassValue[]): string {
  return clsx(inputs);
}
