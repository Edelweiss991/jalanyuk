import { Router, Request, Response } from 'express';
import { prisma } from '../config/db';
import { asyncHandler } from '../utils/asyncHandler';
import { searchSchema } from '../validators/schemas';
import { TransportType, ReservationStatus } from '@prisma/client';
import { ok } from '../utils/response';

const router = Router();

/**
 * Search bus schedules
 */
router.get('/search/bus', asyncHandler(async (req: Request, res: Response) => {
  const params = searchSchema.parse(req.query);
  
  // Build where clause
  const where: any = {
    status: 'ACTIVE',
    departureTime: {
      gte: new Date(params.date ?? new Date().toISOString().slice(0, 10)),
      lt: new Date(new Date(params.date ?? new Date().toISOString().slice(0, 10)).getTime() + 24 * 60 * 60 * 1000)
    }
  };
  
  // Filter by origin (terminal name or city)
  if (params.origin) {
    where.departureTerminal = {
      OR: [
        { name: { contains: params.origin, mode: 'insensitive' } },
        { city: { contains: params.origin, mode: 'insensitive' } }
      ]
    };
  }
  
  // Filter by destination (terminal name or city)
  if (params.destination) {
    where.arrivalTerminal = {
      OR: [
        { name: { contains: params.destination, mode: 'insensitive' } },
        { city: { contains: params.destination, mode: 'insensitive' } }
      ]
    };
  }
  
  // Filter by operator
  if (params.operatorId) {
    where.operatorId = params.operatorId;
  }
  
  // Fetch schedules
  let schedules = await prisma.busSchedule.findMany({
    where,
    include: {
      operator: true,
      bus: true,
      route: {
        include: {
          originTerminal: true,
          destinationTerminal: true
        }
      },
      departureTerminal: true,
      arrivalTerminal: true,
      seats: true
    }
  });
  
  // Get all active reservations for these schedules
  const scheduleIds = schedules.map((s) => s.id);
  const reservations = await prisma.seatReservation.findMany({
    where: {
      scheduleId: { in: scheduleIds },
      transportType: TransportType.BUS,
      OR: [
        { status: ReservationStatus.CONFIRMED },
        { status: ReservationStatus.HELD, expiresAt: { gt: new Date() } }
      ]
    }
  });
  
  // Build reservation map
  const reservationMap = new Map<string, Set<string>>();
  for (const res of reservations) {
    if (!reservationMap.has(res.scheduleId)) {
      reservationMap.set(res.scheduleId, new Set());
    }
    reservationMap.get(res.scheduleId)!.add(res.seatNumber);
  }
  
  // Apply in-memory filters and compute seats left
  let results = schedules.map((schedule) => {
    const reservedSeats = reservationMap.get(schedule.id) || new Set();
    const totalSeats = schedule.seats.length;
    const bookedSeats = schedule.seats.filter((s) => s.isBooked).length;
    const seatsLeft = totalSeats - bookedSeats - reservedSeats.size;
    
    return {
      schedule,
      seatsLeft,
      departureMinutes: schedule.departureTime.getHours() * 60 + schedule.departureTime.getMinutes()
    };
  });
  
  // Filter by class name
  if (params.className) {
    results = results.filter((r) => 
      r.schedule.bus.className.toLowerCase().includes(params.className!.toLowerCase())
    );
  }
  
  // Filter by price range
  if (params.minPrice !== undefined) {
    results = results.filter((r) => r.schedule.price >= params.minPrice!);
  }
  if (params.maxPrice !== undefined) {
    results = results.filter((r) => r.schedule.price <= params.maxPrice!);
  }
  
  // Filter by departure time range
  if (params.departAfter) {
    const [hours, minutes] = params.departAfter.split(':').map(Number);
    const afterMinutes = hours * 60 + minutes;
    results = results.filter((r) => r.departureMinutes >= afterMinutes);
  }
  if (params.departBefore) {
    const [hours, minutes] = params.departBefore.split(':').map(Number);
    const beforeMinutes = hours * 60 + minutes;
    results = results.filter((r) => r.departureMinutes <= beforeMinutes);
  }
  
  // Filter by facilities
  if (params.facilities && params.facilities.length > 0) {
    results = results.filter((r) => {
      const busFacilities = r.schedule.bus.facilities as string[];
      return params.facilities!.split(',').map((f: string) => f.trim()).every((f: string) => busFacilities.includes(f));
    });
  }
  
  // Sort
  if (params.sort === 'price_asc') {
    results.sort((a, b) => a.schedule.price - b.schedule.price);
  } else if (params.sort === 'price_desc') {
    results.sort((a, b) => b.schedule.price - a.schedule.price);
  } else if (params.sort === 'departure_asc') {
    results.sort((a, b) => a.schedule.departureTime.getTime() - b.schedule.departureTime.getTime());
  } else if (params.sort === 'departure_desc') {
    results.sort((a, b) => b.schedule.departureTime.getTime() - a.schedule.departureTime.getTime());
  } else if (params.sort === 'duration_asc') {
    results.sort((a, b) => a.schedule.route.durationMinutes - b.schedule.route.durationMinutes);
  } else if (params.sort === 'name_asc') {
    results.sort((a, b) => a.schedule.operator.name.localeCompare(b.schedule.operator.name));
  }
  
  // Pagination
  const page = params.page;
  const pageSize = params.pageSize;
  const total = results.length;
  const totalPages = Math.ceil(total / pageSize);
  const paginatedResults = results.slice((page - 1) * pageSize, page * pageSize);
  
  // Format response
  const data = paginatedResults.map((r) => ({
    id: r.schedule.id,
    transportType: TransportType.BUS,
    operator: {
      id: r.schedule.operator.id,
      name: r.schedule.operator.name,
      code: r.schedule.operator.code
    },
    vehicle: {
      name: r.schedule.bus.name,
      className: r.schedule.bus.className,
      facilities: r.schedule.bus.facilities,
      capacity: r.schedule.bus.capacity
    },
    route: {
      origin: {
        name: r.schedule.route.originTerminal.name,
        city: r.schedule.route.originTerminal.city
      },
      destination: {
        name: r.schedule.route.destinationTerminal.name,
        city: r.schedule.route.destinationTerminal.city
      },
      durationMinutes: r.schedule.route.durationMinutes
    },
    departureTime: r.schedule.departureTime,
    arrivalTime: r.schedule.arrivalTime,
    price: r.schedule.price,
    seatsLeft: r.seatsLeft,
    status: r.schedule.status,
    isSimulation: true
  }));
  
  return ok(res, {
    schedules: data,
    meta: {
      total,
      page,
      pageSize,
      totalPages
    }
  });
}));

/**
 * Search train schedules
 */
router.get('/search/train', asyncHandler(async (req: Request, res: Response) => {
  const params = searchSchema.parse(req.query);
  
  // Build where clause
  const where: any = {
    status: 'ACTIVE',
    departureTime: {
      gte: new Date(params.date ?? new Date().toISOString().slice(0, 10)),
      lt: new Date(new Date(params.date ?? new Date().toISOString().slice(0, 10)).getTime() + 24 * 60 * 60 * 1000)
    }
  };
  
  // Filter by origin (station name or city)
  if (params.origin) {
    where.departureStation = {
      OR: [
        { name: { contains: params.origin, mode: 'insensitive' } },
        { city: { contains: params.origin, mode: 'insensitive' } }
      ]
    };
  }
  
  // Filter by destination (station name or city)
  if (params.destination) {
    where.arrivalStation = {
      OR: [
        { name: { contains: params.destination, mode: 'insensitive' } },
        { city: { contains: params.destination, mode: 'insensitive' } }
      ]
    };
  }
  
  // Filter by operator
  if (params.operatorId) {
    where.operatorId = params.operatorId;
  }
  
  // Fetch schedules
  let schedules = await prisma.trainSchedule.findMany({
    where,
    include: {
      operator: true,
      train: true,
      route: {
        include: {
          originStation: true,
          destinationStation: true
        }
      },
      departureStation: true,
      arrivalStation: true,
      seats: true
    }
  });
  
  // Get all active reservations for these schedules
  const scheduleIds = schedules.map((s) => s.id);
  const reservations = await prisma.seatReservation.findMany({
    where: {
      scheduleId: { in: scheduleIds },
      transportType: TransportType.TRAIN,
      OR: [
        { status: ReservationStatus.CONFIRMED },
        { status: ReservationStatus.HELD, expiresAt: { gt: new Date() } }
      ]
    }
  });
  
  // Build reservation map
  const reservationMap = new Map<string, Set<string>>();
  for (const res of reservations) {
    if (!reservationMap.has(res.scheduleId)) {
      reservationMap.set(res.scheduleId, new Set());
    }
    reservationMap.get(res.scheduleId)!.add(res.seatNumber);
  }
  
  // Apply in-memory filters and compute seats left
  let results = schedules.map((schedule) => {
    const reservedSeats = reservationMap.get(schedule.id) || new Set();
    const totalSeats = schedule.seats.length;
    const bookedSeats = schedule.seats.filter((s) => s.isBooked).length;
    const seatsLeft = totalSeats - bookedSeats - reservedSeats.size;
    
    return {
      schedule,
      seatsLeft,
      departureMinutes: schedule.departureTime.getHours() * 60 + schedule.departureTime.getMinutes()
    };
  });
  
  // Filter by class name
  if (params.className) {
    results = results.filter((r) => 
      r.schedule.train.className.toLowerCase().includes(params.className!.toLowerCase())
    );
  }
  
  // Filter by price range
  if (params.minPrice !== undefined) {
    results = results.filter((r) => r.schedule.price >= params.minPrice!);
  }
  if (params.maxPrice !== undefined) {
    results = results.filter((r) => r.schedule.price <= params.maxPrice!);
  }
  
  // Filter by departure time range
  if (params.departAfter) {
    const [hours, minutes] = params.departAfter.split(':').map(Number);
    const afterMinutes = hours * 60 + minutes;
    results = results.filter((r) => r.departureMinutes >= afterMinutes);
  }
  if (params.departBefore) {
    const [hours, minutes] = params.departBefore.split(':').map(Number);
    const beforeMinutes = hours * 60 + minutes;
    results = results.filter((r) => r.departureMinutes <= beforeMinutes);
  }
  
  // Filter by facilities
  if (params.facilities && params.facilities.length > 0) {
    results = results.filter((r) => {
      const trainFacilities = r.schedule.train.facilities as string[];
      return params.facilities!.split(',').map((f: string) => f.trim()).every((f: string) => trainFacilities.includes(f));
    });
  }
  
  // Sort
  if (params.sort === 'price_asc') {
    results.sort((a, b) => a.schedule.price - b.schedule.price);
  } else if (params.sort === 'price_desc') {
    results.sort((a, b) => b.schedule.price - a.schedule.price);
  } else if (params.sort === 'departure_asc') {
    results.sort((a, b) => a.schedule.departureTime.getTime() - b.schedule.departureTime.getTime());
  } else if (params.sort === 'departure_desc') {
    results.sort((a, b) => b.schedule.departureTime.getTime() - a.schedule.departureTime.getTime());
  } else if (params.sort === 'duration_asc') {
    results.sort((a, b) => a.schedule.route.durationMinutes - b.schedule.route.durationMinutes);
  } else if (params.sort === 'name_asc') {
    results.sort((a, b) => a.schedule.operator.name.localeCompare(b.schedule.operator.name));
  }
  
  // Pagination
  const page = params.page;
  const pageSize = params.pageSize;
  const total = results.length;
  const totalPages = Math.ceil(total / pageSize);
  const paginatedResults = results.slice((page - 1) * pageSize, page * pageSize);
  
  // Format response
  const data = paginatedResults.map((r) => ({
    id: r.schedule.id,
    transportType: TransportType.TRAIN,
    operator: {
      id: r.schedule.operator.id,
      name: r.schedule.operator.name,
      code: r.schedule.operator.code
    },
    vehicle: {
      name: r.schedule.train.name,
      className: r.schedule.train.className,
      facilities: r.schedule.train.facilities,
      capacity: r.schedule.train.capacity
    },
    route: {
      origin: {
        name: r.schedule.route.originStation.name,
        city: r.schedule.route.originStation.city
      },
      destination: {
        name: r.schedule.route.destinationStation.name,
        city: r.schedule.route.destinationStation.city
      },
      durationMinutes: r.schedule.route.durationMinutes
    },
    departureTime: r.schedule.departureTime,
    arrivalTime: r.schedule.arrivalTime,
    price: r.schedule.price,
    seatsLeft: r.seatsLeft,
    status: r.schedule.status,
    isSimulation: true
  }));
  
  return ok(res, {
    schedules: data,
    meta: {
      total,
      page,
      pageSize,
      totalPages
    }
  });
}));

/**
 * Get bus schedule detail with seat availability
 */
router.get('/bus-schedules/:id', asyncHandler(async (req: Request, res: Response) => {
  const schedule = await prisma.busSchedule.findUnique({
    where: { id: req.params.id },
    include: {
      operator: true,
      bus: true,
      route: {
        include: {
          originTerminal: true,
          destinationTerminal: true
        }
      },
      departureTerminal: true,
      arrivalTerminal: true,
      seats: true
    }
  });
  
  if (!schedule) {
    return res.status(404).json({
      success: false,
      error: {
        code: 'SCHEDULE_NOT_FOUND',
        message: 'Jadwal tidak ditemukan'
      }
    });
  }
  
  // Get active reservations
  const reservations = await prisma.seatReservation.findMany({
    where: {
      scheduleId: schedule.id,
      transportType: TransportType.BUS,
      OR: [
        { status: ReservationStatus.CONFIRMED },
        { status: ReservationStatus.HELD, expiresAt: { gt: new Date() } }
      ]
    }
  });
  
  const reservedSeats = new Set(reservations.map((r) => r.seatNumber));
  
  // Build seat availability
  const seats = schedule.seats.map((seat) => ({
    seatNumber: seat.seatNumber,
    status: seat.isBooked ? 'BOOKED' : reservedSeats.has(seat.seatNumber) ? 'HELD' : 'AVAILABLE'
  }));
  
  return ok(res, {
    schedule: {
      id: schedule.id,
      transportType: TransportType.BUS,
      operator: {
        id: schedule.operator.id,
        name: schedule.operator.name,
        code: schedule.operator.code
      },
      vehicle: {
        name: schedule.bus.name,
        className: schedule.bus.className,
        facilities: schedule.bus.facilities,
        capacity: schedule.bus.capacity
      },
      route: {
        origin: {
          name: schedule.route.originTerminal.name,
          city: schedule.route.originTerminal.city
        },
        destination: {
          name: schedule.route.destinationTerminal.name,
          city: schedule.route.destinationTerminal.city
        },
        durationMinutes: schedule.route.durationMinutes
      },
      departureTime: schedule.departureTime,
      arrivalTime: schedule.arrivalTime,
      price: schedule.price,
      status: schedule.status,
      isSimulation: true
    },
    seats
  });
}));

/**
 * Get train schedule detail with seat availability
 */
router.get('/train-schedules/:id', asyncHandler(async (req: Request, res: Response) => {
  const schedule = await prisma.trainSchedule.findUnique({
    where: { id: req.params.id },
    include: {
      operator: true,
      train: true,
      route: {
        include: {
          originStation: true,
          destinationStation: true
        }
      },
      departureStation: true,
      arrivalStation: true,
      seats: true
    }
  });
  
  if (!schedule) {
    return res.status(404).json({
      success: false,
      error: {
        code: 'SCHEDULE_NOT_FOUND',
        message: 'Jadwal tidak ditemukan'
      }
    });
  }
  
  // Get active reservations
  const reservations = await prisma.seatReservation.findMany({
    where: {
      scheduleId: schedule.id,
      transportType: TransportType.TRAIN,
      OR: [
        { status: ReservationStatus.CONFIRMED },
        { status: ReservationStatus.HELD, expiresAt: { gt: new Date() } }
      ]
    }
  });
  
  const reservedSeats = new Set(reservations.map((r) => r.seatNumber));
  
  // Build seat availability
  const seats = schedule.seats.map((seat) => ({
    seatNumber: seat.seatNumber,
    status: seat.isBooked ? 'BOOKED' : reservedSeats.has(seat.seatNumber) ? 'HELD' : 'AVAILABLE'
  }));
  
  return ok(res, {
    schedule: {
      id: schedule.id,
      transportType: TransportType.TRAIN,
      operator: {
        id: schedule.operator.id,
        name: schedule.operator.name,
        code: schedule.operator.code
      },
      vehicle: {
        name: schedule.train.name,
        className: schedule.train.className,
        facilities: schedule.train.facilities,
        capacity: schedule.train.capacity
      },
      route: {
        origin: {
          name: schedule.route.originStation.name,
          city: schedule.route.originStation.city
        },
        destination: {
          name: schedule.route.destinationStation.name,
          city: schedule.route.destinationStation.city
        },
        durationMinutes: schedule.route.durationMinutes
      },
      departureTime: schedule.departureTime,
      arrivalTime: schedule.arrivalTime,
      price: schedule.price,
      status: schedule.status,
      isSimulation: true
    },
    seats
  });
}));

/**
 * Get bus terminals for autocomplete
 */
router.get('/meta/bus-terminals', asyncHandler(async (_req: Request, res: Response) => {
  const terminals = await prisma.busTerminal.findMany({
    where: { isActive: true },
    select: {
      id: true,
      name: true,
      city: true
    },
    orderBy: { name: 'asc' }
  });
  
  return ok(res, terminals);
}));

/**
 * Get train stations for autocomplete
 */
router.get('/meta/train-stations', asyncHandler(async (_req: Request, res: Response) => {
  const stations = await prisma.trainStation.findMany({
    where: { isActive: true },
    select: {
      id: true,
      name: true,
      city: true,
      code: true
    },
    orderBy: { name: 'asc' }
  });
  
  return ok(res, stations);
}));

/**
 * Get bus operators
 */
router.get('/meta/bus-operators', asyncHandler(async (_req: Request, res: Response) => {
  const operators = await prisma.busOperator.findMany({
    where: { isActive: true },
    select: {
      id: true,
      name: true,
      code: true
    },
    orderBy: { name: 'asc' }
  });
  
  return ok(res, operators);
}));

/**
 * Get train operators
 */
router.get('/meta/train-operators', asyncHandler(async (_req: Request, res: Response) => {
  const operators = await prisma.trainOperator.findMany({
    where: { isActive: true },
    select: {
      id: true,
      name: true,
      code: true
    },
    orderBy: { name: 'asc' }
  });
  
  return ok(res, operators);
}));

/**
 * Get popular routes and destinations
 */
router.get('/meta/popular', asyncHandler(async (_req: Request, res: Response) => {
  // Get popular bus routes
  const busBookings = await prisma.booking.groupBy({
    by: ['busScheduleId'],
    where: {
      transportType: TransportType.BUS,
      busScheduleId: { not: null }
    },
    _count: { id: true },
    orderBy: { _count: { id: 'desc' } },
    take: 5
  });
  
  const popularBusRoutes = await Promise.all(
    busBookings.map(async (b) => {
      const schedule = await prisma.busSchedule.findUnique({
        where: { id: b.busScheduleId! },
        include: {
          route: {
            include: {
              originTerminal: true,
              destinationTerminal: true
            }
          }
        }
      });
      return schedule ? {
        origin: schedule.route.originTerminal.city,
        destination: schedule.route.destinationTerminal.city,
        count: b._count.id
      } : null;
    })
  );
  
  // Get popular train routes
  const trainBookings = await prisma.booking.groupBy({
    by: ['trainScheduleId'],
    where: {
      transportType: TransportType.TRAIN,
      trainScheduleId: { not: null }
    },
    _count: { id: true },
    orderBy: { _count: { id: 'desc' } },
    take: 5
  });
  
  const popularTrainRoutes = await Promise.all(
    trainBookings.map(async (b) => {
      const schedule = await prisma.trainSchedule.findUnique({
        where: { id: b.trainScheduleId! },
        include: {
          route: {
            include: {
              originStation: true,
              destinationStation: true
            }
          }
        }
      });
      return schedule ? {
        origin: schedule.route.originStation.city,
        destination: schedule.route.destinationStation.city,
        count: b._count.id
      } : null;
    })
  );
  
  // Fallback to first routes if no bookings
  let busRoutes = popularBusRoutes.filter((r) => r !== null);
  if (busRoutes.length === 0) {
    const firstRoute = await prisma.busRoute.findFirst({
      include: {
        originTerminal: true,
        destinationTerminal: true
      }
    });
    if (firstRoute) {
      busRoutes = [{
        origin: firstRoute.originTerminal.city,
        destination: firstRoute.destinationTerminal.city,
        count: 0
      }];
    }
  }
  
  let trainRoutes = popularTrainRoutes.filter((r) => r !== null);
  if (trainRoutes.length === 0) {
    const firstRoute = await prisma.trainRoute.findFirst({
      include: {
        originStation: true,
        destinationStation: true
      }
    });
    if (firstRoute) {
      trainRoutes = [{
        origin: firstRoute.originStation.city,
        destination: firstRoute.destinationStation.city,
        count: 0
      }];
    }
  }
  
  // Get unique popular destinations
  const allDestinations = [
    ...busRoutes.map((r) => r!.destination),
    ...trainRoutes.map((r) => r!.destination)
  ];
  const uniqueDestinations = Array.from(new Set(allDestinations));
  
  return ok(res, {
    busRoutes,
    trainRoutes,
    destinations: uniqueDestinations
  });
}));

export default router;
