import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email('Email tidak valid'),
  password: z.string().min(8, 'Password minimal 8 karakter'),
  fullName: z.string().min(3, 'Nama lengkap minimal 3 karakter'),
  phone: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email('Email tidak valid'),
  password: z.string().min(1, 'Password diperlukan'),
});

export const updateProfileSchema = z.object({
  fullName: z.string().min(3, 'Nama lengkap minimal 3 karakter').optional(),
  phone: z.string().optional(),
  dateOfBirth: z.string().datetime().optional(),
  address: z.string().optional(),
});

export const searchSchema = z.object({
  origin: z.string().optional(),
  destination: z.string().optional(),
  date: z
    .string()
    .refine(
      (v) => /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(v)),
      'Format tanggal harus YYYY-MM-DD dan tanggal harus valid'
    )
    .optional(),
  passengers: z.coerce.number().int().min(1).max(10).default(1),
  operatorId: z.string().optional(),
  className: z.string().optional(),
  minPrice: z.coerce.number().optional(),
  maxPrice: z.coerce.number().optional(),
  departAfter: z.string().optional(),
  departBefore: z.string().optional(),
  facilities: z.string().optional(),
  sort: z
    .enum([
      'price_asc',
      'price_desc',
      'departure_asc',
      'departure_desc',
      'duration_asc',
      'duration_desc',
      'name_asc',
    ])
    .default('departure_asc'),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
});

const passengerSchema = z.object({
  fullName: z.string().min(3, 'Nama penumpang minimal 3 karakter'),
  idNumber: z.string().optional(),
  phone: z.string().min(10, 'Nomor telepon tidak valid'),
  email: z.string().email('Email tidak valid'),
});

export const createBookingSchema = z
  .object({
    transportType: z.enum(['BUS', 'TRAIN']),
    scheduleId: z.string().cuid('ID jadwal tidak valid'),
    seatNumbers: z.array(z.string()).min(1, 'Minimal 1 kursi harus dipilih'),
    passengers: z.array(passengerSchema),
    couponCode: z.string().optional(),
    paymentMethod: z.enum(['SIMULATION_QRIS', 'SIMULATION_VA', 'SIMULATION_EWALLET', 'SIMULATION_CARD']),
    idempotencyKey: z.string().optional(),
  })
  .refine((data) => data.passengers.length === data.seatNumbers.length, {
    message: 'Jumlah penumpang harus sama dengan jumlah kursi',
    path: ['passengers'],
  });

export const simulatePaymentSchema = z.object({
  bookingId: z.string().cuid('ID booking tidak valid'),
  scenario: z.enum(['SUCCESS', 'FAILED', 'EXPIRED']),
});

export const cancelBookingSchema = z.object({
  reason: z.string().optional(),
});

export const adminScheduleSchema = z.object({
  operatorId: z.string().cuid('ID operator tidak valid'),
  vehicleId: z.string().cuid('ID kendaraan tidak valid'),
  routeId: z.string().cuid('ID rute tidak valid'),
  departureTime: z.string().datetime('Waktu keberangkatan tidak valid'),
  arrivalTime: z.string().datetime('Waktu kedatangan tidak valid'),
  price: z.number().int().positive('Harga harus positif'),
  status: z.enum(['SCHEDULED', 'ACTIVE', 'CANCELLED', 'COMPLETED']).optional(),
});

export const updateBookingStatusSchema = z.object({
  status: z.enum([
    'PENDING',
    'CONFIRMED',
    'CANCELLED',
    'EXPIRED',
    'COMPLETED',
    'REFUND_REQUESTED',
    'REFUNDED',
  ]),
  reason: z.string().optional(),
});

export const updateUserSchema = z.object({
  isActive: z.boolean().optional(),
  role: z.enum(['CUSTOMER', 'ADMIN']).optional(),
});

export const settingsSchema = z.object({
  platform_name: z.string().optional(),
  copyright: z.string().optional(),
  service_fee_per_passenger: z.string().optional(),
  default_theme: z.string().optional(),
  support_email: z.string().optional(),
}).partial();
