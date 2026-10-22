import { Router, Request, Response } from 'express';
import { requireAuth } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { asyncHandler } from '../utils/asyncHandler';
import { createBookingSchema, cancelBookingSchema, simulatePaymentSchema } from '../validators/schemas';
import {
  createBooking,
  listMyBookings,
  getBookingDetail,
  cancelBooking,
  simulatePayment
} from '../services/bookingService';
import { BookingStatus, TransportType } from '@prisma/client';
import { ok, created } from '../utils/response';

const router = Router();

/**
 * Create a new booking
 */
router.post(
  '/bookings',
  requireAuth,
  validate(createBookingSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const booking = await createBooking(req.user!.id, req.body);
    
    return created(res, booking);
  })
);

/**
 * List user's bookings
 */
router.get(
  '/bookings',
  requireAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const { status, transportType, page, pageSize } = req.query;
    
    const filters: any = {};
    
    if (status) {
      filters.status = status as BookingStatus;
    }
    
    if (transportType) {
      filters.transportType = transportType as TransportType;
    }
    
    if (page) {
      filters.page = parseInt(page as string, 10);
    }
    
    if (pageSize) {
      filters.pageSize = parseInt(pageSize as string, 10);
    }
    
    const result = await listMyBookings(req.user!.id, filters);
    
    return ok(res, result);
  })
);

/**
 * Get booking detail
 */
router.get(
  '/bookings/:id',
  requireAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const isAdmin = req.user!.role === 'ADMIN';
    const booking = await getBookingDetail(req.user!.id, req.params.id, isAdmin);
    
    return ok(res, booking);
  })
);

/**
 * Cancel a booking
 */
router.post(
  '/bookings/:id/cancel',
  requireAuth,
  validate(cancelBookingSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const booking = await cancelBooking(req.user!.id, req.params.id, req.body.reason);
    
    return ok(res, booking);
  })
);

/**
 * Simulate payment
 */
router.post(
  '/payments/simulate',
  requireAuth,
  validate(simulatePaymentSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { bookingId, scenario } = req.body;
    const booking = await simulatePayment(req.user!.id, bookingId, scenario);
    
    return ok(res, booking);
  })
);

export default router;
