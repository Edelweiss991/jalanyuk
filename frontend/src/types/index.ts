export type TransportType = 'BUS' | 'TRAIN';
export type BookingStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'EXPIRED' | 'COMPLETED' | 'REFUND_REQUESTED' | 'REFUNDED';
export type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'EXPIRED' | 'REFUND_PENDING' | 'REFUNDED';
export type UserRole = 'CUSTOMER' | 'ADMIN';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  profile?: {
    fullName: string;
    phone?: string;
  };
}

export interface ScheduleResult {
  id: string;
  transportType: TransportType;
  operator: {
    id: string;
    name: string;
  };
  route: {
    origin: string;
    destination: string;
    originCity: string;
    destinationCity: string;
  };
  departureTime: string;
  arrivalTime: string;
  duration: number;
  price: number;
  availableSeats: number;
  class?: string;
  facilities?: string[];
}

export interface SeatInfo {
  seatNumber: string;
  status: 'AVAILABLE' | 'BOOKED' | 'HELD';
}

export interface Passenger {
  id: string;
  fullName: string;
  idNumber: string;
  phone?: string;
}

export interface BookingItem {
  id: string;
  seatNumber: string;
  price: number;
  snapshotRoute: string;
  snapshotDepartureTime: string;
  snapshotArrivalTime: string;
  passenger?: Passenger;
}

export interface Payment {
  id: string;
  status: PaymentStatus;
  amount: number;
  method?: string;
  paidAt?: string;
}

export interface Booking {
  id: string;
  bookingCode: string;
  transportType: TransportType;
  status: BookingStatus;
  subtotal: number;
  serviceFee: number;
  discount: number;
  total: number;
  createdAt: string;
  expiresAt?: string;
  items: BookingItem[];
  passengers: Passenger[];
  payment?: Payment;
  schedule?: {
    operator: {
      name: string;
    };
    route: {
      origin: string;
      destination: string;
    };
    departureTime: string;
  };
}

export interface Paginated<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface LogStep {
  step: number;
  action: string;
  state?: string;
}

export interface AdminOverview {
  totalBookings: number;
  totalRevenue: number;
  activeUsers: number;
  pendingPayments: number;
  recentBookings: Array<{
    id: string;
    bookingCode: string;
    user: { email: string };
    total: number;
    status: BookingStatus;
    createdAt: string;
  }>;
}
