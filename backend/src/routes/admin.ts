import { Router } from 'express';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { prisma } from '../config/db';
import { requireAuth, requireAdmin } from '../middleware/auth';
import { asyncHandler } from '../utils/asyncHandler';
import { badRequest, notFound } from '../utils/errors';
import { ok } from '../utils/response';
import { BookingStatus, PaymentStatus, TransportType, RefundStatus, ScheduleStatus } from '@prisma/client';

const router = Router();

// Apply auth + admin middleware to all routes
router.use(requireAuth, requireAdmin);

// ============================================================================
// AUDIT LOG HELPER
// ============================================================================
async function logAudit(params: {
  userId: string;
  action: string;
  entity: string;
  entityId: string;
  changes?: any;
}) {
  await prisma.auditLog.create({
    data: {
      userId: params.userId,
      action: params.action,
      entity: params.entity,
      entityId: params.entityId,
      details: params.changes || {},
    },
  });
}

// ============================================================================
// OVERVIEW
// ============================================================================
router.get(
  '/overview',
  asyncHandler(async (_req, res) => {
    const now = new Date();
    const fourteenDaysAgo = new Date(now);
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

    // Total tickets by transport type
    const busBookings = await prisma.booking.findMany({
      where: {
        transportType: TransportType.BUS,
        status: BookingStatus.CONFIRMED,
      },
      include: {
        items: true,
      },
    });

    const trainBookings = await prisma.booking.findMany({
      where: {
        transportType: TransportType.TRAIN,
        status: BookingStatus.CONFIRMED,
      },
      include: {
        items: true,
      },
    });

    const totalBusTickets = busBookings.reduce((sum, booking) => sum + booking.items.length, 0);
    const totalTrainTickets = trainBookings.reduce((sum, booking) => sum + booking.items.length, 0);

    // Total bookings
    const totalBookings = await prisma.booking.count();

    // Total customers
    const totalCustomers = await prisma.user.count({
      where: { role: 'CUSTOMER' },
    });

    // Bookings by status
    const bookingsByStatusRaw = await prisma.booking.groupBy({
      by: ['status'],
      _count: true,
    });
    const bookingsByStatus = Object.fromEntries(
      bookingsByStatusRaw.map((item) => [item.status, item._count])
    );

    // Revenue from confirmed bookings
    const revenueResult = await prisma.booking.aggregate({
      where: { status: BookingStatus.CONFIRMED },
      _sum: { total: true },
    });
    const revenue = revenueResult._sum.total || 0;

    // Total refunds
    const refundsResult = await prisma.refund.aggregate({
      _sum: { amount: true },
    });
    const refundsTotal = refundsResult._sum.amount || 0;

    // Transactions per date (last 14 days)
    const confirmedBookings = await prisma.booking.findMany({
      where: {
        status: BookingStatus.CONFIRMED,
        createdAt: { gte: fourteenDaysAgo },
      },
      select: {
        createdAt: true,
        total: true,
      },
    });

    const transactionsByDate: Record<string, { date: string; count: number; total: number }> = {};
    confirmedBookings.forEach((booking) => {
      const dateKey = booking.createdAt.toISOString().split('T')[0];
      if (!transactionsByDate[dateKey]) {
        transactionsByDate[dateKey] = { date: dateKey, count: 0, total: 0 };
      }
      transactionsByDate[dateKey].count++;
      transactionsByDate[dateKey].total += booking.total;
    });

    const transactionsPerDate = Object.values(transactionsByDate).sort((a, b) =>
      a.date.localeCompare(b.date)
    );

    // Popular routes (from BookingItem description)
    const bookingItems = await prisma.bookingItem.findMany({
      where: {
        booking: { status: BookingStatus.CONFIRMED },
      },
      select: { description: true },
    });

    const routeCounts: Record<string, number> = {};
    bookingItems.forEach((item) => {
      const route = item.description || 'Unknown';
      routeCounts[route] = (routeCounts[route] || 0) + 1;
    });

    const popularRoutes = Object.entries(routeCounts)
      .map(([route, count]) => ({ route, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Top schedules by booking count
    const allBookings = await prisma.booking.findMany({
      where: { status: BookingStatus.CONFIRMED },
      select: {
        transportType: true,
        busScheduleId: true,
        trainScheduleId: true,
      },
    });

    const scheduleCounts: Record<string, { scheduleId: string; type: string; count: number }> = {};
    allBookings.forEach((item) => {
      if (item.busScheduleId) {
        const key = `BUS-${item.busScheduleId}`;
        if (!scheduleCounts[key]) {
          scheduleCounts[key] = {
            scheduleId: item.busScheduleId,
            type: 'BUS',
            count: 0,
          };
        }
        scheduleCounts[key].count++;
      }
      if (item.trainScheduleId) {
        const key = `TRAIN-${item.trainScheduleId}`;
        if (!scheduleCounts[key]) {
          scheduleCounts[key] = {
            scheduleId: item.trainScheduleId,
            type: 'TRAIN',
            count: 0,
          };
        }
        scheduleCounts[key].count++;
      }
    });

    const topSchedules = Object.values(scheduleCounts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Recent audit logs
    const recentAudit = await prisma.auditLog.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            profile: {
              select: { fullName: true },
            },
          },
        },
      },
    });

    return ok(res, {
      totalBusTickets,
      totalTrainTickets,
      totalBookings,
      totalCustomers,
      bookingsByStatus,
      revenue,
      refundsTotal,
      transactionsPerDate,
      popularRoutes,
      topSchedules,
      recentAudit,
    });
  })
);

// ============================================================================
// BUS OPERATORS
// ============================================================================
const busOperatorCreateSchema = z.object({
  name: z.string().min(1),
  code: z.string().min(1),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
});

const busOperatorUpdateSchema = busOperatorCreateSchema.partial();

router.get(
  '/bus-operators',
  asyncHandler(async (req, res) => {
    const { search, page = '1', limit = '20' } = req.query;
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const where = search
      ? {
          OR: [
            { name: { contains: search as string, mode: 'insensitive' as const } },
            { code: { contains: search as string, mode: 'insensitive' as const } },
          ],
        }
      : {};

    const [items, total] = await Promise.all([
      prisma.busOperator.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { name: 'asc' },
      }),
      prisma.busOperator.count({ where }),
    ]);

    return ok(res, {
      items,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  })
);

router.post(
  '/bus-operators',
  asyncHandler(async (req, res) => {
    const data = busOperatorCreateSchema.parse(req.body);
    const operator = await prisma.busOperator.create({ data });

    await logAudit({
      userId: req.user!.id,
      action: 'CREATE',
      entity: 'BusOperator',
      entityId: operator.id,
      changes: data,
    });

    return ok(res, operator, 201);
  })
);

router.patch(
  '/bus-operators/:id',
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const data = busOperatorUpdateSchema.parse(req.body);

    const operator = await prisma.busOperator.update({
      where: { id },
      data,
    });

    await logAudit({
      userId: req.user!.id,
      action: 'UPDATE',
      entity: 'BusOperator',
      entityId: id,
      changes: data,
    });

    return ok(res, operator);
  })
);

router.delete(
  '/bus-operators/:id',
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    await prisma.busOperator.update({
      where: { id },
      data: { isActive: false },
    });

    await logAudit({
      userId: req.user!.id,
      action: 'DELETE',
      entity: 'BusOperator',
      entityId: id,
      changes: { isActive: false },
    });

    return ok(res, { message: 'Operator bus berhasil dinonaktifkan' });
  })
);

// ============================================================================
// BUS TERMINALS
// ============================================================================
const busTerminalCreateSchema = z.object({
  name: z.string().min(1),
  city: z.string().min(1),
  address: z.string().optional(),
  isActive: z.boolean().optional(),
});

const busTerminalUpdateSchema = busTerminalCreateSchema.partial();

router.get(
  '/bus-terminals',
  asyncHandler(async (req, res) => {
    const { search, page = '1', limit = '20' } = req.query;
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const where = search
      ? {
          OR: [
            { name: { contains: search as string, mode: 'insensitive' as const } },
            { city: { contains: search as string, mode: 'insensitive' as const } },
          ],
        }
      : {};

    const [items, total] = await Promise.all([
      prisma.busTerminal.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { name: 'asc' },
      }),
      prisma.busTerminal.count({ where }),
    ]);

    return ok(res, {
      items,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  })
);

router.post(
  '/bus-terminals',
  asyncHandler(async (req, res) => {
    const data = busTerminalCreateSchema.parse(req.body);
    const terminal = await prisma.busTerminal.create({ data });

    await logAudit({
      userId: req.user!.id,
      action: 'CREATE',
      entity: 'BusTerminal',
      entityId: terminal.id,
      changes: data,
    });

    return ok(res, terminal, 201);
  })
);

router.patch(
  '/bus-terminals/:id',
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const data = busTerminalUpdateSchema.parse(req.body);

    const terminal = await prisma.busTerminal.update({
      where: { id },
      data,
    });

    await logAudit({
      userId: req.user!.id,
      action: 'UPDATE',
      entity: 'BusTerminal',
      entityId: id,
      changes: data,
    });

    return ok(res, terminal);
  })
);

router.delete(
  '/bus-terminals/:id',
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    await prisma.busTerminal.update({
      where: { id },
      data: { isActive: false },
    });

    await logAudit({
      userId: req.user!.id,
      action: 'DELETE',
      entity: 'BusTerminal',
      entityId: id,
      changes: { isActive: false },
    });

    return ok(res, { message: 'Terminal bus berhasil dinonaktifkan' });
  })
);

// ============================================================================
// BUSES
// ============================================================================
const busCreateSchema = z.object({
  operatorId: z.string().min(1),
  name: z.string().min(1),
  plateNumber: z.string().optional(),
  capacity: z.number().int().positive().default(40),
  className: z.string().min(1),
  facilities: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
});

const busUpdateSchema = busCreateSchema.partial();

router.get(
  '/buses',
  asyncHandler(async (req, res) => {
    const { search, page = '1', limit = '20' } = req.query;
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const where = search
      ? {
          OR: [
            { name: { contains: search as string, mode: 'insensitive' as const } },
            { plateNumber: { contains: search as string, mode: 'insensitive' as const } },
            { className: { contains: search as string, mode: 'insensitive' as const } },
          ],
        }
      : {};

    const [items, total] = await Promise.all([
      prisma.bus.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { name: 'asc' },
        include: {
          operator: {
            select: { id: true, name: true, code: true },
          },
        },
      }),
      prisma.bus.count({ where }),
    ]);

    return ok(res, {
      items,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  })
);

router.post(
  '/buses',
  asyncHandler(async (req, res) => {
    const data = busCreateSchema.parse(req.body);
    const bus = await prisma.bus.create({
      data,
      include: {
        operator: {
          select: { id: true, name: true, code: true },
        },
      },
    });

    await logAudit({
      userId: req.user!.id,
      action: 'CREATE',
      entity: 'Bus',
      entityId: bus.id,
      changes: data,
    });

    return ok(res, bus, 201);
  })
);

router.patch(
  '/buses/:id',
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const data = busUpdateSchema.parse(req.body);

    const bus = await prisma.bus.update({
      where: { id },
      data,
      include: {
        operator: {
          select: { id: true, name: true, code: true },
        },
      },
    });

    await logAudit({
      userId: req.user!.id,
      action: 'UPDATE',
      entity: 'Bus',
      entityId: id,
      changes: data,
    });

    return ok(res, bus);
  })
);

router.delete(
  '/buses/:id',
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    await prisma.bus.update({
      where: { id },
      data: { isActive: false },
    });

    await logAudit({
      userId: req.user!.id,
      action: 'DELETE',
      entity: 'Bus',
      entityId: id,
      changes: { isActive: false },
    });

    return ok(res, { message: 'Bus berhasil dinonaktifkan' });
  })
);

// ============================================================================
// BUS ROUTES
// ============================================================================
const busRouteCreateSchema = z.object({
  originTerminalId: z.string().min(1),
  destinationTerminalId: z.string().min(1),
  distanceKm: z.number().int().positive().optional(),
  durationMinutes: z.number().int().positive(),
  isActive: z.boolean().optional(),
});

const busRouteUpdateSchema = busRouteCreateSchema.partial();

router.get(
  '/bus-routes',
  asyncHandler(async (req, res) => {
    const { search, page = '1', limit = '20' } = req.query;
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const where = search
      ? {
          OR: [
            { originTerminal: { name: { contains: search as string, mode: 'insensitive' as const } } },
            { originTerminal: { city: { contains: search as string, mode: 'insensitive' as const } } },
            { destinationTerminal: { name: { contains: search as string, mode: 'insensitive' as const } } },
            { destinationTerminal: { city: { contains: search as string, mode: 'insensitive' as const } } },
          ],
        }
      : {};

    const [items, total] = await Promise.all([
      prisma.busRoute.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
        include: {
          originTerminal: {
            select: { id: true, name: true, city: true },
          },
          destinationTerminal: {
            select: { id: true, name: true, city: true },
          },
        },
      }),
      prisma.busRoute.count({ where }),
    ]);

    return ok(res, {
      items,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  })
);

router.post(
  '/bus-routes',
  asyncHandler(async (req, res) => {
    const data = busRouteCreateSchema.parse(req.body);
    const route = await prisma.busRoute.create({
      data,
      include: {
        originTerminal: {
          select: { id: true, name: true, city: true },
        },
        destinationTerminal: {
          select: { id: true, name: true, city: true },
        },
      },
    });

    await logAudit({
      userId: req.user!.id,
      action: 'CREATE',
      entity: 'BusRoute',
      entityId: route.id,
      changes: data,
    });

    return ok(res, route, 201);
  })
);

router.patch(
  '/bus-routes/:id',
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const data = busRouteUpdateSchema.parse(req.body);

    const route = await prisma.busRoute.update({
      where: { id },
      data,
      include: {
        originTerminal: {
          select: { id: true, name: true, city: true },
        },
        destinationTerminal: {
          select: { id: true, name: true, city: true },
        },
      },
    });

    await logAudit({
      userId: req.user!.id,
      action: 'UPDATE',
      entity: 'BusRoute',
      entityId: id,
      changes: data,
    });

    return ok(res, route);
  })
);

router.delete(
  '/bus-routes/:id',
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    await prisma.busRoute.update({
      where: { id },
      data: { isActive: false },
    });

    await logAudit({
      userId: req.user!.id,
      action: 'DELETE',
      entity: 'BusRoute',
      entityId: id,
      changes: { isActive: false },
    });

    return ok(res, { message: 'Rute bus berhasil dinonaktifkan' });
  })
);

// ============================================================================
// TRAIN OPERATORS
// ============================================================================
const trainOperatorCreateSchema = z.object({
  name: z.string().min(1),
  code: z.string().min(1),
  isActive: z.boolean().optional(),
});

const trainOperatorUpdateSchema = trainOperatorCreateSchema.partial();

router.get(
  '/train-operators',
  asyncHandler(async (req, res) => {
    const { search, page = '1', limit = '20' } = req.query;
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const where = search
      ? {
          OR: [
            { name: { contains: search as string, mode: 'insensitive' as const } },
            { code: { contains: search as string, mode: 'insensitive' as const } },
          ],
        }
      : {};

    const [items, total] = await Promise.all([
      prisma.trainOperator.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { name: 'asc' },
      }),
      prisma.trainOperator.count({ where }),
    ]);

    return ok(res, {
      items,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  })
);

router.post(
  '/train-operators',
  asyncHandler(async (req, res) => {
    const data = trainOperatorCreateSchema.parse(req.body);
    const operator = await prisma.trainOperator.create({ data });

    await logAudit({
      userId: req.user!.id,
      action: 'CREATE',
      entity: 'TrainOperator',
      entityId: operator.id,
      changes: data,
    });

    return ok(res, operator, 201);
  })
);

router.patch(
  '/train-operators/:id',
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const data = trainOperatorUpdateSchema.parse(req.body);

    const operator = await prisma.trainOperator.update({
      where: { id },
      data,
    });

    await logAudit({
      userId: req.user!.id,
      action: 'UPDATE',
      entity: 'TrainOperator',
      entityId: id,
      changes: data,
    });

    return ok(res, operator);
  })
);

router.delete(
  '/train-operators/:id',
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    await prisma.trainOperator.update({
      where: { id },
      data: { isActive: false },
    });

    await logAudit({
      userId: req.user!.id,
      action: 'DELETE',
      entity: 'TrainOperator',
      entityId: id,
      changes: { isActive: false },
    });

    return ok(res, { message: 'Operator kereta berhasil dinonaktifkan' });
  })
);

// ============================================================================
// TRAIN STATIONS
// ============================================================================
const trainStationCreateSchema = z.object({
  name: z.string().min(1),
  code: z.string().min(1),
  city: z.string().min(1),
  address: z.string().optional(),
  isActive: z.boolean().optional(),
});

const trainStationUpdateSchema = trainStationCreateSchema.partial();

router.get(
  '/train-stations',
  asyncHandler(async (req, res) => {
    const { search, page = '1', limit = '20' } = req.query;
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const where = search
      ? {
          OR: [
            { name: { contains: search as string, mode: 'insensitive' as const } },
            { city: { contains: search as string, mode: 'insensitive' as const } },
            { code: { contains: search as string, mode: 'insensitive' as const } },
          ],
        }
      : {};

    const [items, total] = await Promise.all([
      prisma.trainStation.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { name: 'asc' },
      }),
      prisma.trainStation.count({ where }),
    ]);

    return ok(res, {
      items,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  })
);

router.post(
  '/train-stations',
  asyncHandler(async (req, res) => {
    const data = trainStationCreateSchema.parse(req.body);
    const station = await prisma.trainStation.create({ data });

    await logAudit({
      userId: req.user!.id,
      action: 'CREATE',
      entity: 'TrainStation',
      entityId: station.id,
      changes: data,
    });

    return ok(res, station, 201);
  })
);

router.patch(
  '/train-stations/:id',
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const data = trainStationUpdateSchema.parse(req.body);

    const station = await prisma.trainStation.update({
      where: { id },
      data,
    });

    await logAudit({
      userId: req.user!.id,
      action: 'UPDATE',
      entity: 'TrainStation',
      entityId: id,
      changes: data,
    });

    return ok(res, station);
  })
);

router.delete(
  '/train-stations/:id',
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    await prisma.trainStation.update({
      where: { id },
      data: { isActive: false },
    });

    await logAudit({
      userId: req.user!.id,
      action: 'DELETE',
      entity: 'TrainStation',
      entityId: id,
      changes: { isActive: false },
    });

    return ok(res, { message: 'Stasiun kereta berhasil dinonaktifkan' });
  })
);

// ============================================================================
// TRAINS
// ============================================================================
const trainCreateSchema = z.object({
  operatorId: z.string().min(1),
  name: z.string().min(1),
  trainNumber: z.string().min(1),
  className: z.string().min(1),
  capacity: z.number().int().positive().default(64),
  facilities: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
});

const trainUpdateSchema = trainCreateSchema.partial();

router.get(
  '/trains',
  asyncHandler(async (req, res) => {
    const { search, page = '1', limit = '20' } = req.query;
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const where = search
      ? {
          OR: [
            { name: { contains: search as string, mode: 'insensitive' as const } },
            { trainNumber: { contains: search as string, mode: 'insensitive' as const } },
            { className: { contains: search as string, mode: 'insensitive' as const } },
          ],
        }
      : {};

    const [items, total] = await Promise.all([
      prisma.train.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { name: 'asc' },
        include: {
          operator: {
            select: { id: true, name: true, code: true },
          },
        },
      }),
      prisma.train.count({ where }),
    ]);

    return ok(res, {
      items,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  })
);

router.post(
  '/trains',
  asyncHandler(async (req, res) => {
    const data = trainCreateSchema.parse(req.body);
    const train = await prisma.train.create({
      data,
      include: {
        operator: {
          select: { id: true, name: true, code: true },
        },
      },
    });

    await logAudit({
      userId: req.user!.id,
      action: 'CREATE',
      entity: 'Train',
      entityId: train.id,
      changes: data,
    });

    return ok(res, train, 201);
  })
);

router.patch(
  '/trains/:id',
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const data = trainUpdateSchema.parse(req.body);

    const train = await prisma.train.update({
      where: { id },
      data,
      include: {
        operator: {
          select: { id: true, name: true, code: true },
        },
      },
    });

    await logAudit({
      userId: req.user!.id,
      action: 'UPDATE',
      entity: 'Train',
      entityId: id,
      changes: data,
    });

    return ok(res, train);
  })
);

router.delete(
  '/trains/:id',
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    await prisma.train.update({
      where: { id },
      data: { isActive: false },
    });

    await logAudit({
      userId: req.user!.id,
      action: 'DELETE',
      entity: 'Train',
      entityId: id,
      changes: { isActive: false },
    });

    return ok(res, { message: 'Kereta berhasil dinonaktifkan' });
  })
);

// ============================================================================
// TRAIN ROUTES
// ============================================================================
const trainRouteCreateSchema = z.object({
  originStationId: z.string().min(1),
  destinationStationId: z.string().min(1),
  distanceKm: z.number().int().positive().optional(),
  durationMinutes: z.number().int().positive(),
  isActive: z.boolean().optional(),
});

const trainRouteUpdateSchema = trainRouteCreateSchema.partial();

router.get(
  '/train-routes',
  asyncHandler(async (req, res) => {
    const { search, page = '1', limit = '20' } = req.query;
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const where = search
      ? {
          OR: [
            { originStation: { name: { contains: search as string, mode: 'insensitive' as const } } },
            { originStation: { city: { contains: search as string, mode: 'insensitive' as const } } },
            { destinationStation: { name: { contains: search as string, mode: 'insensitive' as const } } },
            { destinationStation: { city: { contains: search as string, mode: 'insensitive' as const } } },
          ],
        }
      : {};

    const [items, total] = await Promise.all([
      prisma.trainRoute.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
        include: {
          originStation: {
            select: { id: true, name: true, city: true, code: true },
          },
          destinationStation: {
            select: { id: true, name: true, city: true, code: true },
          },
        },
      }),
      prisma.trainRoute.count({ where }),
    ]);

    return ok(res, {
      items,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  })
);

router.post(
  '/train-routes',
  asyncHandler(async (req, res) => {
    const data = trainRouteCreateSchema.parse(req.body);
    const route = await prisma.trainRoute.create({
      data,
      include: {
        originStation: {
          select: { id: true, name: true, city: true, code: true },
        },
        destinationStation: {
          select: { id: true, name: true, city: true, code: true },
        },
      },
    });

    await logAudit({
      userId: req.user!.id,
      action: 'CREATE',
      entity: 'TrainRoute',
      entityId: route.id,
      changes: data,
    });

    return ok(res, route, 201);
  })
);

router.patch(
  '/train-routes/:id',
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const data = trainRouteUpdateSchema.parse(req.body);

    const route = await prisma.trainRoute.update({
      where: { id },
      data,
      include: {
        originStation: {
          select: { id: true, name: true, city: true, code: true },
        },
        destinationStation: {
          select: { id: true, name: true, city: true, code: true },
        },
      },
    });

    await logAudit({
      userId: req.user!.id,
      action: 'UPDATE',
      entity: 'TrainRoute',
      entityId: id,
      changes: data,
    });

    return ok(res, route);
  })
);

router.delete(
  '/train-routes/:id',
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    await prisma.trainRoute.update({
      where: { id },
      data: { isActive: false },
    });

    await logAudit({
      userId: req.user!.id,
      action: 'DELETE',
      entity: 'TrainRoute',
      entityId: id,
      changes: { isActive: false },
    });

    return ok(res, { message: 'Rute kereta berhasil dinonaktifkan' });
  })
);

// ============================================================================
// BUS SCHEDULES
// ============================================================================
const busScheduleCreateSchema = z.object({
  routeId: z.string().min(1),
  busId: z.string().min(1),
  operatorId: z.string().min(1),
  departureTerminalId: z.string().min(1),
  arrivalTerminalId: z.string().min(1),
  departureTime: z.string().datetime(),
  arrivalTime: z.string().datetime(),
  price: z.number().int().positive(),
  status: z.nativeEnum(ScheduleStatus).optional(),
});

const busScheduleUpdateSchema = z.object({
  price: z.number().int().positive().optional(),
  status: z.nativeEnum(ScheduleStatus).optional(),
  departureTime: z.string().datetime().optional(),
  arrivalTime: z.string().datetime().optional(),
});

router.get(
  '/bus-schedules',
  asyncHandler(async (req, res) => {
    const { routeId, operatorId, status, date, page = '1', limit = '20' } = req.query;
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const where: Prisma.BusScheduleWhereInput = {};
    if (routeId) where.routeId = routeId as string;
    if (operatorId) where.operatorId = operatorId as string;
    if (status) where.status = status as ScheduleStatus;
    if (date) {
      const targetDate = new Date(date as string);
      const nextDay = new Date(targetDate);
      nextDay.setDate(nextDay.getDate() + 1);
      where.departureTime = {
        gte: targetDate,
        lt: nextDay,
      };
    }

    const [items, total] = await Promise.all([
      prisma.busSchedule.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { departureTime: 'asc' },
        include: {
          route: {
            include: {
              originTerminal: {
                select: { id: true, name: true, city: true },
              },
              destinationTerminal: {
                select: { id: true, name: true, city: true },
              },
            },
          },
          bus: {
            select: { id: true, name: true, plateNumber: true, className: true, capacity: true, facilities: true },
          },
          operator: {
            select: { id: true, name: true, code: true },
          },
        },
      }),
      prisma.busSchedule.count({ where }),
    ]);

    return ok(res, {
      items,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  })
);

router.post(
  '/bus-schedules',
  asyncHandler(async (req, res) => {
    const data = busScheduleCreateSchema.parse(req.body);
    const schedule = await prisma.busSchedule.create({
      data: {
        ...data,
        departureTime: new Date(data.departureTime),
        arrivalTime: new Date(data.arrivalTime),
      },
      include: {
        route: {
          include: {
            originTerminal: {
              select: { id: true, name: true, city: true },
            },
            destinationTerminal: {
              select: { id: true, name: true, city: true },
            },
          },
        },
        bus: {
          select: { id: true, name: true, plateNumber: true, className: true, capacity: true, facilities: true },
        },
        operator: {
          select: { id: true, name: true, code: true },
        },
      },
    });

    await logAudit({
      userId: req.user!.id,
      action: 'CREATE',
      entity: 'BusSchedule',
      entityId: schedule.id,
      changes: data,
    });

    return ok(res, schedule, 201);
  })
);

router.patch(
  '/bus-schedules/:id',
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const data = busScheduleUpdateSchema.parse(req.body);

    const updateData: Prisma.BusScheduleUpdateInput = { ...data };
    if (data.departureTime) updateData.departureTime = new Date(data.departureTime);
    if (data.arrivalTime) updateData.arrivalTime = new Date(data.arrivalTime);

    const schedule = await prisma.busSchedule.update({
      where: { id },
      data: updateData,
      include: {
        route: {
          include: {
            originTerminal: {
              select: { id: true, name: true, city: true },
            },
            destinationTerminal: {
              select: { id: true, name: true, city: true },
            },
          },
        },
        bus: {
          select: { id: true, name: true, plateNumber: true, className: true, capacity: true, facilities: true },
        },
        operator: {
          select: { id: true, name: true, code: true },
        },
      },
    });

    await logAudit({
      userId: req.user!.id,
      action: 'UPDATE',
      entity: 'BusSchedule',
      entityId: id,
      changes: data,
    });

    return ok(res, schedule);
  })
);

router.delete(
  '/bus-schedules/:id',
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    await prisma.busSchedule.update({
      where: { id },
      data: { status: ScheduleStatus.INACTIVE },
    });

    await logAudit({
      userId: req.user!.id,
      action: 'DELETE',
      entity: 'BusSchedule',
      entityId: id,
      changes: { status: 'INACTIVE' },
    });

    return ok(res, { message: 'Jadwal bus berhasil diarsipkan' });
  })
);

// ============================================================================
// TRAIN SCHEDULES
// ============================================================================
const trainScheduleCreateSchema = z.object({
  routeId: z.string().min(1),
  trainId: z.string().min(1),
  operatorId: z.string().min(1),
  departureStationId: z.string().min(1),
  arrivalStationId: z.string().min(1),
  departureTime: z.string().datetime(),
  arrivalTime: z.string().datetime(),
  price: z.number().int().positive(),
  status: z.nativeEnum(ScheduleStatus).optional(),
});

const trainScheduleUpdateSchema = z.object({
  price: z.number().int().positive().optional(),
  status: z.nativeEnum(ScheduleStatus).optional(),
  departureTime: z.string().datetime().optional(),
  arrivalTime: z.string().datetime().optional(),
});

router.get(
  '/train-schedules',
  asyncHandler(async (req, res) => {
    const { routeId, operatorId, status, date, page = '1', limit = '20' } = req.query;
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const where: Prisma.TrainScheduleWhereInput = {};
    if (routeId) where.routeId = routeId as string;
    if (operatorId) where.operatorId = operatorId as string;
    if (status) where.status = status as ScheduleStatus;
    if (date) {
      const targetDate = new Date(date as string);
      const nextDay = new Date(targetDate);
      nextDay.setDate(nextDay.getDate() + 1);
      where.departureTime = {
        gte: targetDate,
        lt: nextDay,
      };
    }

    const [items, total] = await Promise.all([
      prisma.trainSchedule.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { departureTime: 'asc' },
        include: {
          route: {
            include: {
              originStation: {
                select: { id: true, name: true, city: true, code: true },
              },
              destinationStation: {
                select: { id: true, name: true, city: true, code: true },
              },
            },
          },
          train: {
            select: { id: true, name: true, trainNumber: true, className: true, capacity: true, facilities: true },
          },
          operator: {
            select: { id: true, name: true, code: true },
          },
        },
      }),
      prisma.trainSchedule.count({ where }),
    ]);

    return ok(res, {
      items,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  })
);

router.post(
  '/train-schedules',
  asyncHandler(async (req, res) => {
    const data = trainScheduleCreateSchema.parse(req.body);
    const schedule = await prisma.trainSchedule.create({
      data: {
        ...data,
        departureTime: new Date(data.departureTime),
        arrivalTime: new Date(data.arrivalTime),
      },
      include: {
        route: {
          include: {
            originStation: {
              select: { id: true, name: true, city: true, code: true },
            },
            destinationStation: {
              select: { id: true, name: true, city: true, code: true },
            },
          },
        },
        train: {
          select: { id: true, name: true, trainNumber: true, className: true, capacity: true, facilities: true },
        },
        operator: {
          select: { id: true, name: true, code: true },
        },
      },
    });

    await logAudit({
      userId: req.user!.id,
      action: 'CREATE',
      entity: 'TrainSchedule',
      entityId: schedule.id,
      changes: data,
    });

    return ok(res, schedule, 201);
  })
);

router.patch(
  '/train-schedules/:id',
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const data = trainScheduleUpdateSchema.parse(req.body);

    const updateData: Prisma.TrainScheduleUpdateInput = { ...data };
    if (data.departureTime) updateData.departureTime = new Date(data.departureTime);
    if (data.arrivalTime) updateData.arrivalTime = new Date(data.arrivalTime);

    const schedule = await prisma.trainSchedule.update({
      where: { id },
      data: updateData,
      include: {
        route: {
          include: {
            originStation: {
              select: { id: true, name: true, city: true, code: true },
            },
            destinationStation: {
              select: { id: true, name: true, city: true, code: true },
            },
          },
        },
        train: {
          select: { id: true, name: true, trainNumber: true, className: true, capacity: true, facilities: true },
        },
        operator: {
          select: { id: true, name: true, code: true },
        },
      },
    });

    await logAudit({
      userId: req.user!.id,
      action: 'UPDATE',
      entity: 'TrainSchedule',
      entityId: id,
      changes: data,
    });

    return ok(res, schedule);
  })
);

router.delete(
  '/train-schedules/:id',
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    await prisma.trainSchedule.update({
      where: { id },
      data: { status: ScheduleStatus.INACTIVE },
    });

    await logAudit({
      userId: req.user!.id,
      action: 'DELETE',
      entity: 'TrainSchedule',
      entityId: id,
      changes: { status: 'INACTIVE' },
    });

    return ok(res, { message: 'Jadwal kereta berhasil diarsipkan' });
  })
);

// ============================================================================
// BOOKINGS
// ============================================================================
router.get(
  '/bookings',
  asyncHandler(async (req, res) => {
    const { search, transportType, status, paymentStatus, dateFrom, dateTo, page = '1', limit = '20' } = req.query;
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const where: Prisma.BookingWhereInput = {};

    if (search) {
      where.OR = [
        { code: { contains: search as string, mode: 'insensitive' } },
        { user: { email: { contains: search as string, mode: 'insensitive' } } },
      ];
    }

    if (transportType) where.transportType = transportType as TransportType;
    if (status) where.status = status as BookingStatus;
    if (paymentStatus) where.payment = { status: paymentStatus as PaymentStatus };

    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = new Date(dateFrom as string);
      if (dateTo) {
        const endDate = new Date(dateTo as string);
        endDate.setDate(endDate.getDate() + 1);
        where.createdAt.lt = endDate;
      }
    }

    const [items, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              profile: {
                select: { fullName: true, phone: true },
              },
            },
          },
          payment: {
            select: {
              id: true,
              status: true,
              method: true,
              amount: true,
              paidAt: true,
            },
          },
          items: {
            select: {
              id: true,
              seatNumber: true,
              price: true,
              description: true,
            },
          },
        },
      }),
      prisma.booking.count({ where }),
    ]);

    return ok(res, {
      items,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  })
);

router.get(
  '/bookings/:id',
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            profile: {
              select: { fullName: true, phone: true },
            },
          },
        },
        payment: true,
        items: true,
        passengers: true,
        refunds: true,
        busSchedule: {
          include: {
            route: {
              include: {
                originTerminal: true,
                destinationTerminal: true,
              },
            },
            bus: true,
            operator: true,
          },
        },
        trainSchedule: {
          include: {
            route: {
              include: {
                originStation: true,
                destinationStation: true,
              },
            },
            train: true,
            operator: true,
          },
        },
      },
    });

    if (!booking) {
      throw notFound('BOOKING_NOT_FOUND', 'Booking tidak ditemukan');
    }

    return ok(res, booking);
  })
);

const updateBookingStatusSchema = z.object({
  status: z.nativeEnum(BookingStatus),
  reason: z.string().optional(),
});

router.patch(
  '/bookings/:id/status',
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { status, reason } = updateBookingStatusSchema.parse(req.body);

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: { payment: true, items: true },
    });

    if (!booking) {
      throw notFound('BOOKING_NOT_FOUND', 'Booking tidak ditemukan');
    }

    // Simple transition validation
    const currentStatus = booking.status;
    const invalidTransitions: Record<string, BookingStatus[]> = {
      COMPLETED: [BookingStatus.PENDING, BookingStatus.CANCELLED, BookingStatus.EXPIRED],
      REFUNDED: [BookingStatus.PENDING, BookingStatus.CONFIRMED, BookingStatus.CANCELLED, BookingStatus.EXPIRED],
    };

    if (invalidTransitions[currentStatus]?.includes(status)) {
      throw badRequest('INVALID_STATUS_TRANSITION', `Tidak dapat mengubah status dari ${currentStatus} ke ${status}`);
    }

    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Update booking status
      await tx.booking.update({
        where: { id },
        data: { status },
      });

      // Release seats if cancelled or expired
      if (status === BookingStatus.CANCELLED || status === BookingStatus.EXPIRED) {
        const scheduleId = booking.busScheduleId || booking.trainScheduleId;
        if (scheduleId) {
          await tx.seatReservation.deleteMany({
            where: {
              bookingId: id,
            },
          });

          if (booking.busScheduleId) {
            await tx.busSeat.updateMany({
              where: {
                scheduleId: booking.busScheduleId,
                seatNumber: {
                  in: booking.items.map((item: any) => item.seatNumber),
                },
              },
              data: { isBooked: false },
            });
          } else if (booking.trainScheduleId) {
            await tx.trainSeat.updateMany({
              where: {
                scheduleId: booking.trainScheduleId,
                seatNumber: {
                  in: booking.items.map((item: any) => item.seatNumber),
                },
              },
              data: { isBooked: false },
            });
          }
        }
      }

      // Handle refund processing
      if (status === BookingStatus.REFUNDED && booking.payment) {
        const refund = await tx.refund.findFirst({
          where: {
            bookingId: id,
            status: RefundStatus.PENDING,
          },
        });

        if (refund) {
          await tx.refund.update({
            where: { id: refund.id },
            data: { status: RefundStatus.PROCESSED },
          });

          await tx.payment.update({
            where: { id: booking.payment.id },
            data: { status: PaymentStatus.REFUNDED },
          });
        }
      }
    });

    await logAudit({
      userId: req.user!.id,
      action: 'UPDATE',
      entity: 'Booking',
      entityId: id,
      changes: { status, reason },
    });

    const updatedBooking = await prisma.booking.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            profile: {
              select: { fullName: true, phone: true },
            },
          },
        },
        payment: true,
        items: true,
      },
    });

    return ok(res, updatedBooking);
  })
);

// ============================================================================
// REFUNDS
// ============================================================================
const processRefundSchema = z.object({
  action: z.enum(['PROCESS', 'REJECT']),
  note: z.string().optional(),
});

router.post(
  '/refunds/:id/process',
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { action, note } = processRefundSchema.parse(req.body);

    const refund = await prisma.refund.findUnique({
      where: { id },
      include: {
        booking: {
          include: { payment: true },
        },
      },
    });

    if (!refund) {
      throw notFound('REFUND_NOT_FOUND', 'Refund tidak ditemukan');
    }

    if (refund.status !== RefundStatus.PENDING) {
      throw badRequest('REFUND_ALREADY_PROCESSED', 'Refund sudah diproses');
    }

    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      if (action === 'PROCESS') {
        await tx.refund.update({
          where: { id },
          data: {
            status: RefundStatus.PROCESSED,
          },
        });

        await tx.booking.update({
          where: { id: refund.bookingId },
          data: { status: BookingStatus.REFUNDED },
        });

        if (refund.booking.payment) {
          await tx.payment.update({
            where: { id: refund.booking.payment.id },
            data: { status: PaymentStatus.REFUNDED },
          });
        }
      } else {
        await tx.refund.update({
          where: { id },
          data: {
            status: RefundStatus.REJECTED,
          },
        });

        await tx.booking.update({
          where: { id: refund.bookingId },
          data: { status: BookingStatus.CONFIRMED },
        });

        if (refund.booking.payment) {
          await tx.payment.update({
            where: { id: refund.booking.payment.id },
            data: { status: PaymentStatus.PAID },
          });
        }
      }
    });

    await logAudit({
      userId: req.user!.id,
      action: 'UPDATE',
      entity: 'Refund',
      entityId: id,
      changes: { action, note },
    });

    const updatedRefund = await prisma.refund.findUnique({
      where: { id },
      include: {
        booking: {
          include: { payment: true },
        },
      },
    });

    return ok(res, updatedRefund);
  })
);

// ============================================================================
// USERS
// ============================================================================
router.get(
  '/users',
  asyncHandler(async (req, res) => {
    const { search, role, isActive, page = '1', limit = '20' } = req.query;
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const where: Prisma.UserWhereInput = {};

    if (search) {
      where.OR = [
        { email: { contains: search as string, mode: 'insensitive' } },
        { profile: { fullName: { contains: search as string, mode: 'insensitive' } } },
      ];
    }

    if (role) where.role = role as 'CUSTOMER' | 'ADMIN';
    if (isActive !== undefined) where.isActive = isActive === 'true';

    const [items, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          role: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
          profile: {
            select: {
              fullName: true,
              phone: true,
            },
          },
        },
      }),
      prisma.user.count({ where }),
    ]);

    return ok(res, {
      items,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  })
);

router.get(
  '/users/:id',
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        profile: {
          select: {
            fullName: true,
            phone: true,
            address: true,
          },
        },
        _count: {
          select: {
            bookings: true,
          },
        },
      },
    });

    if (!user) {
      throw notFound('USER_NOT_FOUND', 'User tidak ditemukan');
    }

    return ok(res, user);
  })
);

const updateUserSchema = z.object({
  email: z.string().email().optional(),
  role: z.enum(['CUSTOMER', 'ADMIN']).optional(),
  isActive: z.boolean().optional(),
  fullName: z.string().optional(),
  phone: z.string().optional(),
});

router.patch(
  '/users/:id',
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const data = updateUserSchema.parse(req.body);

    // Prevent admin from deactivating themselves
    if (data.isActive === false && id === req.user!.id) {
      throw badRequest('CANNOT_DEACTIVATE_SELF', 'Tidak dapat menonaktifkan akun sendiri');
    }

    const { fullName, phone, ...userData } = data;
    const profileData: Prisma.UserProfileUpdateInput = {};
    if (fullName !== undefined) profileData.fullName = fullName;
    if (phone !== undefined) profileData.phone = phone;

    const user = await prisma.user.update({
      where: { id },
      data: {
        ...userData,
        ...(Object.keys(profileData).length > 0 && {
          profile: {
            update: profileData,
          },
        }),
      },
      select: {
        id: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        profile: {
          select: {
            fullName: true,
            phone: true,
          },
        },
      },
    });

    await logAudit({
      userId: req.user!.id,
      action: 'UPDATE',
      entity: 'User',
      entityId: id,
      changes: data,
    });

    return ok(res, user);
  })
);

// ============================================================================
// REPORTS
// ============================================================================
router.get(
  '/reports/summary',
  asyncHandler(async (req, res) => {
    const { from, to, type } = req.query;

    const where: Prisma.BookingWhereInput = {
      status: BookingStatus.CONFIRMED,
    };

    if (from || to) {
      where.createdAt = {};
      if (from) where.createdAt.gte = new Date(from as string);
      if (to) {
        const endDate = new Date(to as string);
        endDate.setDate(endDate.getDate() + 1);
        where.createdAt.lt = endDate;
      }
    }

    if (type) where.transportType = type as TransportType;

    const bookings = await prisma.booking.findMany({
      where,
      include: {
        items: true,
        payment: true,
      },
    });

    const totalTransactions = bookings.length;
    const totalRevenue = bookings.reduce((sum, b) => sum + b.total, 0);

    const byTransportType = bookings.reduce((acc, b) => {
      const transportType = b.transportType;
      if (!acc[transportType]) {
        acc[transportType] = { count: 0, revenue: 0, tickets: 0 };
      }
      acc[transportType].count++;
      acc[transportType].revenue += b.total;
      acc[transportType].tickets += b.items.length;
      return acc;
    }, {} as Record<string, { count: number; revenue: number; tickets: number }>);

    const cancelledBookings = await prisma.booking.count({
      where: {
        ...where,
        status: BookingStatus.CANCELLED,
      },
    });

    // Refunds belong to bookings that are REFUND_REQUESTED/CANCELLED/REFUNDED —
    // never CONFIRMED — so they must not reuse the revenue `where` (which pins
    // status=CONFIRMED and would always match zero refunds). Apply only the
    // date-range and transport-type filters, mirroring the overview totals.
    const refundBookingWhere: Prisma.BookingWhereInput = {};
    if (where.createdAt) refundBookingWhere.createdAt = where.createdAt;
    if (where.transportType) refundBookingWhere.transportType = where.transportType;

    const refundsData = await prisma.refund.findMany({
      where: {
        booking: refundBookingWhere,
      },
    });

    const totalRefunds = refundsData.reduce((sum, r) => sum + r.amount, 0);
    const refundsCount = refundsData.length;

    return ok(res, {
      totalTransactions,
      totalRevenue,
      byTransportType,
      cancelledBookings,
      refunds: {
        count: refundsCount,
        total: totalRefunds,
      },
    });
  })
);

router.get(
  '/reports/export.csv',
  asyncHandler(async (req, res) => {
    const { from, to, type } = req.query;

    const where: Prisma.BookingWhereInput = {};

    if (from || to) {
      where.createdAt = {};
      if (from) where.createdAt.gte = new Date(from as string);
      if (to) {
        const endDate = new Date(to as string);
        endDate.setDate(endDate.getDate() + 1);
        where.createdAt.lt = endDate;
      }
    }

    if (type) where.transportType = type as TransportType;

    const bookings = await prisma.booking.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { email: true },
        },
        items: {
          select: { description: true },
        },
        payment: {
          select: { status: true },
        },
      },
    });

    const csvHeader = 'Kode Booking,Tanggal,Email,Tipe,Rute,Status,Status Pembayaran,Total\n';
    const csvRows = bookings.map((b) => {
      const date = b.createdAt.toISOString().split('T')[0];
      const route = b.items[0]?.description || '-';
      return `${b.code},${date},${b.user.email},${b.transportType},${route},${b.status},${b.payment?.status || '-'},${b.total}`;
    });

    const csv = csvHeader + csvRows.join('\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="jalanyuk-report.csv"');
    res.send(csv);
  })
);

// ============================================================================
// AUDIT LOGS
// ============================================================================
router.get(
  '/audit-logs',
  asyncHandler(async (req, res) => {
    const { entity, action, page = '1', limit = '50' } = req.query;
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const where: Prisma.AuditLogWhereInput = {};
    if (entity) where.entity = entity as string;
    if (action) where.action = action as string;

    const [items, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              profile: {
                select: { fullName: true },
              },
            },
          },
        },
      }),
      prisma.auditLog.count({ where }),
    ]);

    return ok(res, {
      items,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  })
);

// ============================================================================
// SYSTEM SETTINGS
// ============================================================================
router.get(
  '/settings',
  asyncHandler(async (_req, res) => {
    const settings = await prisma.systemSetting.findMany();
    const settingsObject = Object.fromEntries(settings.map((s) => [s.key, s.value]));

    return ok(res, settingsObject);
  })
);

const settingsSchema = z.record(z.string());

router.put(
  '/settings',
  asyncHandler(async (req, res) => {
    const data = settingsSchema.parse(req.body);

    const updates = Object.entries(data).map(([key, value]) =>
      prisma.systemSetting.upsert({
        where: { key },
        create: { key, value },
        update: { value },
      })
    );

    await prisma.$transaction(updates);

    await logAudit({
      userId: req.user!.id,
      action: 'UPDATE',
      entity: 'SystemSetting',
      entityId: 'bulk',
      changes: data,
    });

    const settings = await prisma.systemSetting.findMany();
    const settingsObject = Object.fromEntries(settings.map((s) => [s.key, s.value]));

    return ok(res, settingsObject);
  })
);

// ============================================================================
// COUPONS
// ============================================================================
const couponCreateSchema = z.object({
  code: z.string().min(1),
  description: z.string().optional(),
  discountType: z.enum(['PERCENT', 'FIXED']),
  discountValue: z.number().int().positive(),
  minTransaction: z.number().int().optional().default(0),
  maxDiscount: z.number().int().optional(),
  isActive: z.boolean().optional(),
  expiresAt: z.string().datetime().optional(),
});

const couponUpdateSchema = couponCreateSchema.partial();

router.get(
  '/coupons',
  asyncHandler(async (req, res) => {
    const { search, page = '1', limit = '20' } = req.query;
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const where = search
      ? {
          code: { contains: search as string, mode: 'insensitive' as const },
        }
      : {};

    const [items, total] = await Promise.all([
      prisma.coupon.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.coupon.count({ where }),
    ]);

    return ok(res, {
      items,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  })
);

router.post(
  '/coupons',
  asyncHandler(async (req, res) => {
    const data = couponCreateSchema.parse(req.body);
    const couponData: Prisma.CouponCreateInput = {
      ...data,
      expiresAt: data.expiresAt ? new Date(data.expiresAt) : undefined,
    };
    const coupon = await prisma.coupon.create({ data: couponData });

    await logAudit({
      userId: req.user!.id,
      action: 'CREATE',
      entity: 'Coupon',
      entityId: coupon.id,
      changes: data,
    });

    return ok(res, coupon, 201);
  })
);

router.patch(
  '/coupons/:id',
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const data = couponUpdateSchema.parse(req.body);

    const updateData: Prisma.CouponUpdateInput = { ...data };
    if (data.expiresAt) updateData.expiresAt = new Date(data.expiresAt);

    const coupon = await prisma.coupon.update({
      where: { id },
      data: updateData,
    });

    await logAudit({
      userId: req.user!.id,
      action: 'UPDATE',
      entity: 'Coupon',
      entityId: id,
      changes: data,
    });

    return ok(res, coupon);
  })
);

export default router;
