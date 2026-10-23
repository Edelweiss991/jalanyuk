// The bookings API returns Prisma-shaped objects:
//   { id, code, status, total, payment: { status }, items: [...],
//     busSchedule | trainSchedule: { departureTime, route: { originTerminal... } } }
// and the list endpoint wraps them: { bookings: [...], meta: {...} }.
// Several customer pages were written against friendlier field names
// (bookingCode, bookingStatus, totalAmount, items[0].originName, ...).
// Normalize once here so every page consumes the same shape.

export interface NormalizedBooking {
  [key: string]: any;
  bookingCode: string;
  bookingStatus: string;
  paymentStatus: string;
  totalAmount: number;
  routeInfo: {
    originName: string;
    destinationName: string;
    departureTime?: string;
  };
}

export function normalizeBooking(b: any): NormalizedBooking {
  const schedule = b?.busSchedule || b?.trainSchedule || null;
  const route = schedule?.route || {};
  const originName =
    route.originTerminal?.name ||
    route.originStation?.name ||
    schedule?.departureTerminal?.name ||
    schedule?.departureStation?.name ||
    '-';
  const destinationName =
    route.destinationTerminal?.name ||
    route.destinationStation?.name ||
    schedule?.arrivalTerminal?.name ||
    schedule?.arrivalStation?.name ||
    '-';

  return {
    ...b,
    bookingCode: b?.code ?? '',
    bookingStatus: b?.status ?? '',
    paymentStatus: b?.payment?.status ?? 'PENDING',
    totalAmount: b?.total ?? 0,
    routeInfo: {
      originName,
      destinationName,
      departureTime: schedule?.departureTime,
    },
  };
}

export function extractBookingList(data: any): NormalizedBooking[] {
  const list = Array.isArray(data) ? data : data?.bookings ?? [];
  return list.map(normalizeBooking);
}
