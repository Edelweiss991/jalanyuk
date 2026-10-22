import { prisma } from '../config/db';
import { badRequest, notFound, conflict } from '../utils/errors';
import { createBookingSchema } from '../validators/schemas';
import { z } from 'zod';
import { BookingStatus, PaymentStatus, ReservationStatus, TransportType, Prisma } from '@prisma/client';

/**
 * Get service fee per passenger from system settings
 */
export async function getServiceFeePerPassenger(): Promise<number> {
  const setting = await prisma.systemSetting.findUnique({
    where: { key: 'service_fee_per_passenger' }
  });
  
  if (!setting || !setting.value) {
    return 5000; // default
  }
  
  const value = parseInt(setting.value, 10);
  return isNaN(value) ? 5000 : value;
}

/**
 * Compute discount amount based on coupon type
 */
export function computeDiscount(coupon: { discountType: string; discountValue: number; maxDiscount: number | null }, subtotal: number): number {
  if (coupon.discountType === 'PERCENT') {
    const discount = Math.floor(subtotal * coupon.discountValue / 100);
    return coupon.maxDiscount ? Math.min(discount, coupon.maxDiscount) : discount;
  } else if (coupon.discountType === 'FIXED') {
    return Math.min(coupon.discountValue, subtotal);
  }
  return 0;
}

/**
 * Validate coupon and return discount amount
 */
export async function validateCoupon(code: string, subtotal: number): Promise<{ coupon: any; discount: number }> {
  const coupon = await prisma.coupon.findUnique({
    where: { code }
  });
  
  if (!coupon || !coupon.isActive || (coupon.expiresAt && coupon.expiresAt < new Date())) {
    throw badRequest('COUPON_INVALID', 'Kupon tidak valid atau sudah kedaluwarsa');
  }
  
  if (subtotal < coupon.minTransaction) {
    throw badRequest('COUPON_MIN_NOT_MET', `Transaksi minimum untuk kupon ini adalah IDR ${coupon.minTransaction.toLocaleString('id-ID')}`);
  }
  
  const discount = computeDiscount(coupon, subtotal);
  return { coupon, discount };
}

/**
 * Expire stale bookings (PENDING bookings past expiresAt)
 */
export async function expireStaleBookings(): Promise<number> {
  const now = new Date();
  
  const staleBookings = await prisma.booking.findMany({
    where: {
      status: BookingStatus.PENDING,
      expiresAt: { lt: now }
    },
    include: {
      payment: true
    }
  });
  
  let expiredCount = 0;
  
  for (const booking of staleBookings) {
    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Update booking status
      await tx.booking.update({
        where: { id: booking.id },
        data: { status: BookingStatus.EXPIRED }
      });
      
      // Update payment status if PENDING
      if (booking.payment && booking.payment.status === PaymentStatus.PENDING) {
        await tx.payment.update({
          where: { id: booking.payment.id },
          data: { status: PaymentStatus.EXPIRED }
        });
      }
      
      // Release seat reservations
      await tx.seatReservation.deleteMany({
        where: { bookingId: booking.id }
      });
      
      expiredCount++;
    });
  }
  
  return expiredCount;
}

/**
 * Generate unique booking code
 */
async function generateBookingCode(maxRetries = 5): Promise<string> {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    let code = 'JY-';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    const existing = await prisma.booking.findUnique({
      where: { code }
    });
    
    if (!existing) {
      return code;
    }
  }
  
  throw badRequest('CODE_GENERATION_FAILED', 'Gagal membuat kode booking unik');
}

/**
 * Create a new booking
 */
export async function createBooking(userId: string, input: z.infer<typeof createBookingSchema>) {
  // Check for idempotency
  if (input.idempotencyKey) {
    const existing = await prisma.booking.findFirst({
      where: {
        userId,
        idempotencyKey: input.idempotencyKey
      },
      include: {
        items: true,
        passengers: true,
        payment: true,
        busSchedule: {
          include: {
            route: {
              include: {
                originTerminal: true,
                destinationTerminal: true
              }
            },
            bus: {
              include: {
                operator: true
              }
            },
            operator: true
          }
        },
        trainSchedule: {
          include: {
            route: {
              include: {
                originStation: true,
                destinationStation: true
              }
            },
            train: {
              include: {
                operator: true
              }
            },
            operator: true
          }
        }
      }
    });
    
    if (existing) {
      return existing;
    }
  }
  
  // Expire stale bookings first
  await expireStaleBookings();
  
  return await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const now = new Date();
    
    // Load schedule based on transport type
    let schedule: any;
    let operator: any;
    let route: any;
    let price: number;
    
    if (input.transportType === TransportType.BUS) {
      schedule = await tx.busSchedule.findUnique({
        where: { id: input.scheduleId },
        include: {
          route: {
            include: {
              originTerminal: true,
              destinationTerminal: true
            }
          },
          bus: {
            include: {
              operator: true
            }
          },
          operator: true,
          departureTerminal: true,
          arrivalTerminal: true
        }
      });
      
      if (!schedule) {
        throw notFound('SCHEDULE_NOT_FOUND', 'Jadwal bus tidak ditemukan');
      }
      
      operator = schedule.operator;
      route = schedule.route;
      price = schedule.price;
    } else {
      schedule = await tx.trainSchedule.findUnique({
        where: { id: input.scheduleId },
        include: {
          route: {
            include: {
              originStation: true,
              destinationStation: true
            }
          },
          train: {
            include: {
              operator: true
            }
          },
          operator: true,
          departureStation: true,
          arrivalStation: true
        }
      });
      
      if (!schedule) {
        throw notFound('SCHEDULE_NOT_FOUND', 'Jadwal kereta tidak ditemukan');
      }
      
      operator = schedule.operator;
      route = schedule.route;
      price = schedule.price;
    }
    
    // Check schedule status
    if (schedule.status !== 'ACTIVE') {
      throw badRequest('SCHEDULE_INACTIVE', 'Jadwal tidak aktif');
    }
    
    // Check if already departed
    if (schedule.departureTime <= now) {
      throw badRequest('SCHEDULE_DEPARTED', 'Jadwal sudah berangkat');
    }
    
    // Load seats
    const seats = input.transportType === TransportType.BUS
      ? await tx.busSeat.findMany({
          where: {
            scheduleId: input.scheduleId,
            seatNumber: { in: input.seatNumbers }
          }
        })
      : await tx.trainSeat.findMany({
          where: {
            scheduleId: input.scheduleId,
            seatNumber: { in: input.seatNumbers }
          }
        });
    
    if (seats.length !== input.seatNumbers.length) {
      throw badRequest('SEAT_NOT_FOUND', 'Satu atau lebih kursi tidak ditemukan');
    }
    
    // Check if any seat is already booked
    const bookedSeats = seats.filter((s: any) => s.isBooked);
    if (bookedSeats.length > 0) {
      throw conflict('SEAT_TAKEN', `Kursi ${bookedSeats.map((s: any) => s.seatNumber).join(', ')} sudah dipesan`);
    }
    
    // Create seat reservations (will throw on conflict)
    const expiresAt = new Date(now.getTime() + 15 * 60 * 1000); // 15 minutes
    
    // Calculate pricing
    const subtotal = price * input.seatNumbers.length;
    const serviceFee = await getServiceFeePerPassenger() * input.passengers.length;
    
    let discount = 0;
    
    if (input.couponCode) {
      const { discount: discountAmount } = await validateCoupon(input.couponCode, subtotal);
      discount = discountAmount;
    }
    
    const total = subtotal + serviceFee - discount;
    
    // Generate unique booking code
    const code = await generateBookingCode();
    
    // Create booking
    const booking = await tx.booking.create({
      data: {
        code,
        userId,
        transportType: input.transportType,
        busScheduleId: input.transportType === TransportType.BUS ? input.scheduleId : null,
        trainScheduleId: input.transportType === TransportType.TRAIN ? input.scheduleId : null,
        status: BookingStatus.PENDING,
        subtotal,
        serviceFee,
        discount,
        total,
        couponCode: input.couponCode || null,
        expiresAt,
        idempotencyKey: input.idempotencyKey || null
      }
    });
    
    // Create seat reservations (unique constraint mencegah double booking; transaksi rollback bila konflik)
try {
      for (const seatNumber of input.seatNumbers) {
        await tx.seatReservation.create({
          data: {
            transportType: input.transportType,
            scheduleId: input.scheduleId,
            seatNumber,
            bookingId: booking.id,
            status: ReservationStatus.HELD,
            expiresAt
          }
        });
      }
    } catch (error: any) {
      if (error.code === 'P2002') {
        throw conflict('SEAT_TAKEN', 'Satu atau lebih kursi sedang dipesan oleh pengguna lain');
      }
      throw error;
    }
    // Create booking items
    const origin = input.transportType === TransportType.BUS
      ? route.originTerminal.city
      : route.originStation.city;
    const destination = input.transportType === TransportType.BUS
      ? route.destinationTerminal.city
      : route.destinationStation.city;
    const description = `${operator.name} — ${origin} → ${destination}`;
    
    for (let i = 0; i < input.seatNumbers.length; i++) {
      const passenger = input.passengers[i];
      
      await tx.bookingItem.create({
        data: {
          bookingId: booking.id,
          description,
          seatNumber: input.seatNumbers[i],
          price,
          passengerName: passenger.fullName
        }
      });
      
      await tx.passenger.create({
        data: {
          bookingId: booking.id,
          fullName: passenger.fullName,
          idNumber: passenger.idNumber || null,
          phone: passenger.phone,
          email: passenger.email,
          seatNumber: input.seatNumbers[i]
        }
      });
    }
    
    // Create payment
    await tx.payment.create({
      data: {
        bookingId: booking.id,
        amount: total,
        method: input.paymentMethod,
        status: PaymentStatus.PENDING
      }
    });
    
    // Create notification
    await tx.notification.create({
      data: {
        userId,
        title: 'Booking Dibuat',
        message: `Booking ${code} dibuat — Pembayaran Simulasi menunggu`,
        isRead: false
      }
    });
    
    // Return complete booking
    return await tx.booking.findUnique({
      where: { id: booking.id },
      include: {
        items: true,
        passengers: true,
        payment: true,
        busSchedule: {
          include: {
            route: {
              include: {
                originTerminal: true,
                destinationTerminal: true
              }
            },
            bus: {
              include: {
                operator: true
              }
            },
            operator: true,
            departureTerminal: true,
            arrivalTerminal: true
          }
        },
        trainSchedule: {
          include: {
            route: {
              include: {
                originStation: true,
                destinationStation: true
              }
            },
            train: {
              include: {
                operator: true
              }
            },
            operator: true,
            departureStation: true,
            arrivalStation: true
          }
        }
      }
    });
  });
}

/**
 * Simulate payment for a booking
 */
export async function simulatePayment(userId: string, bookingId: string, scenario: 'SUCCESS' | 'FAILED' | 'EXPIRED') {
  // Check ownership
  const booking = await prisma.booking.findFirst({
    where: {
      id: bookingId,
      userId
    },
    include: {
      payment: true
    }
  });
  
  if (!booking) {
    throw notFound('BOOKING_NOT_FOUND', 'Booking tidak ditemukan');
  }
  
  if (booking.status !== BookingStatus.PENDING) {
    throw badRequest('BOOKING_NOT_PENDING', 'Booking tidak dalam status pending');
  }
  
  const now = new Date();
  
  // Check expiration
  if (booking.expiresAt && booking.expiresAt < now) {
    await expireStaleBookings();
    throw badRequest('BOOKING_EXPIRED', 'Booking sudah kedaluwarsa');
  }
  
  return await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    if (scenario === 'SUCCESS') {
      // Update payment
      await tx.payment.update({
        where: { id: booking.payment!.id },
        data: {
          status: PaymentStatus.PAID,
          paidAt: now,
          transactionRef: `SIM-${Math.random().toString(36).substring(2, 10).toUpperCase()}`
        }
      });
      
      // Update booking
      await tx.booking.update({
        where: { id: booking.id },
        data: { status: BookingStatus.CONFIRMED }
      });
      
      // Confirm reservations
      await tx.seatReservation.updateMany({
        where: { bookingId: booking.id },
        data: { status: ReservationStatus.CONFIRMED }
      });
      
      // Mark seats as booked
      const reservations = await tx.seatReservation.findMany({
        where: { bookingId: booking.id }
      });
      
      for (const reservation of reservations) {
        if (reservation.transportType === TransportType.BUS) {
          await tx.busSeat.updateMany({
            where: {
              scheduleId: reservation.scheduleId,
              seatNumber: reservation.seatNumber
            },
            data: { isBooked: true }
          });
        } else {
          await tx.trainSeat.updateMany({
            where: {
              scheduleId: reservation.scheduleId,
              seatNumber: reservation.seatNumber
            },
            data: { isBooked: true }
          });
        }
      }
      
      // Create notification
      await tx.notification.create({
        data: {
          userId,
          title: 'Pembayaran Berhasil',
          message: `Pembayaran Simulasi berhasil — E-ticket terbit untuk booking ${booking.code}`,
          isRead: false
        }
      });
    } else if (scenario === 'FAILED') {
      // Update payment to FAILED
      await tx.payment.update({
        where: { id: booking.payment!.id },
        data: { status: PaymentStatus.FAILED }
      });
      // Booking remains PENDING, user can try again
    } else if (scenario === 'EXPIRED') {
      // Update payment
      await tx.payment.update({
        where: { id: booking.payment!.id },
        data: { status: PaymentStatus.EXPIRED }
      });
      
      // Update booking
      await tx.booking.update({
        where: { id: booking.id },
        data: { status: BookingStatus.EXPIRED }
      });
      
      // Release reservations
      await tx.seatReservation.deleteMany({
        where: { bookingId: booking.id }
      });
    }
    
    // Return updated booking
    return await tx.booking.findUnique({
      where: { id: booking.id },
      include: {
        items: true,
        passengers: true,
        payment: true,
        busSchedule: {
          include: {
            route: {
              include: {
                originTerminal: true,
                destinationTerminal: true
              }
            },
            bus: {
              include: {
                operator: true
              }
            },
            operator: true,
            departureTerminal: true,
            arrivalTerminal: true
          }
        },
        trainSchedule: {
          include: {
            route: {
              include: {
                originStation: true,
                destinationStation: true
              }
            },
            train: {
              include: {
                operator: true
              }
            },
            operator: true,
            departureStation: true,
            arrivalStation: true
          }
        }
      }
    });
  });
}

/**
 * Cancel a booking
 */
export async function cancelBooking(userId: string, bookingId: string, reason?: string) {
  const booking = await prisma.booking.findFirst({
    where: {
      id: bookingId,
      userId
    },
    include: {
      payment: true
    }
  });
  
  if (!booking) {
    throw notFound('BOOKING_NOT_FOUND', 'Booking tidak ditemukan');
  }
  
  return await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    if (booking.status === BookingStatus.CONFIRMED && booking.payment?.status === PaymentStatus.PAID) {
      // Request refund
      await tx.booking.update({
        where: { id: booking.id },
        data: { status: BookingStatus.REFUND_REQUESTED }
      });
      
      await tx.payment.update({
        where: { id: booking.payment.id },
        data: { status: PaymentStatus.REFUND_PENDING }
      });
      
      await tx.refund.create({
        data: {
          bookingId: booking.id,
          paymentId: booking.payment.id,
          amount: booking.total,
          reason: reason || 'Pembatalan oleh pengguna',
          status: 'PENDING'
        }
      });
      
      // Release seats
      const reservations = await tx.seatReservation.findMany({
        where: { bookingId: booking.id }
      });
      
      for (const reservation of reservations) {
        if (reservation.transportType === TransportType.BUS) {
          await tx.busSeat.updateMany({
            where: {
              scheduleId: reservation.scheduleId,
              seatNumber: reservation.seatNumber
            },
            data: { isBooked: false }
          });
        } else {
          await tx.trainSeat.updateMany({
            where: {
              scheduleId: reservation.scheduleId,
              seatNumber: reservation.seatNumber
            },
            data: { isBooked: false }
          });
        }
      }
      
      await tx.seatReservation.deleteMany({
        where: { bookingId: booking.id }
      });
      
      await tx.notification.create({
        data: {
          userId,
          title: 'Refund Diminta',
          message: `Permintaan refund untuk booking ${booking.code} sedang diproses`,
          isRead: false
        }
      });
    } else if (booking.status === BookingStatus.PENDING) {
      // Simple cancellation
      await tx.booking.update({
        where: { id: booking.id },
        data: { status: BookingStatus.CANCELLED }
      });
      
      if (booking.payment && (booking.payment.status === PaymentStatus.PENDING || booking.payment.status === PaymentStatus.FAILED)) {
        await tx.payment.update({
          where: { id: booking.payment.id },
          data: { status: PaymentStatus.EXPIRED }
        });
      }
      
      await tx.seatReservation.deleteMany({
        where: { bookingId: booking.id }
      });
    } else {
      throw badRequest('CANNOT_CANCEL', 'Booking tidak dapat dibatalkan dalam status saat ini');
    }
    
    return await tx.booking.findUnique({
      where: { id: booking.id },
      include: {
        items: true,
        passengers: true,
        payment: true,
        busSchedule: {
          include: {
            route: {
              include: {
                originTerminal: true,
                destinationTerminal: true
              }
            },
            bus: {
              include: {
                operator: true
              }
            },
            operator: true,
            departureTerminal: true,
            arrivalTerminal: true
          }
        },
        trainSchedule: {
          include: {
            route: {
              include: {
                originStation: true,
                destinationStation: true
              }
            },
            train: {
              include: {
                operator: true
              }
            },
            operator: true,
            departureStation: true,
            arrivalStation: true
          }
        }
      }
    });
  });
}

/**
 * List user's bookings with filters
 */
export async function listMyBookings(
  userId: string,
  filters: {
    status?: BookingStatus;
    transportType?: TransportType;
    page?: number;
    pageSize?: number;
  }
) {
  const page = filters.page || 1;
  const pageSize = Math.min(filters.pageSize || 10, 100);
  const skip = (page - 1) * pageSize;
  
  const where: any = { userId };
  
  if (filters.status) {
    where.status = filters.status;
  }
  
  if (filters.transportType) {
    where.transportType = filters.transportType;
  }
  
  const [bookings, total] = await Promise.all([
    prisma.booking.findMany({
      where,
      include: {
        items: true,
        passengers: true,
        payment: true,
        busSchedule: {
          include: {
            route: {
              include: {
                originTerminal: true,
                destinationTerminal: true
              }
            },
            bus: {
              include: {
                operator: true
              }
            },
            operator: true,
            departureTerminal: true,
            arrivalTerminal: true
          }
        },
        trainSchedule: {
          include: {
            route: {
              include: {
                originStation: true,
                destinationStation: true
              }
            },
            train: {
              include: {
                operator: true
              }
            },
            operator: true,
            departureStation: true,
            arrivalStation: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: pageSize
    }),
    prisma.booking.count({ where })
  ]);
  
  return {
    bookings,
    meta: {
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize)
    }
  };
}

/**
 * Get booking detail
 */
export async function getBookingDetail(userId: string, bookingId: string, isAdmin = false) {
  const where: any = { id: bookingId };
  
  if (!isAdmin) {
    where.userId = userId;
  }
  
  const booking = await prisma.booking.findFirst({
    where,
    include: {
      items: true,
      passengers: true,
      payment: true,
      busSchedule: {
        include: {
          route: {
            include: {
              originTerminal: true,
              destinationTerminal: true
            }
          },
          bus: {
            include: {
              operator: true
            }
          },
          operator: true,
          departureTerminal: true,
          arrivalTerminal: true
        }
      },
      trainSchedule: {
        include: {
          route: {
            include: {
              originStation: true,
              destinationStation: true
            }
          },
          train: {
            include: {
              operator: true
            }
          },
          operator: true,
          departureStation: true,
          arrivalStation: true
        }
      }
    }
  });
  
  if (!booking) {
    throw notFound('BOOKING_NOT_FOUND', 'Booking tidak ditemukan');
  }
  
  return booking;
}
