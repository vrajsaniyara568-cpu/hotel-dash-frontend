// Hotel Management System Data Types

export type RoomType = 'single' | 'double' | 'suite' | 'deluxe' | 'presidential';

export type RoomStatus = 'available' | 'occupied' | 'maintenance' | 'cleaning';

export type BookingStatus = 'active' | 'checked-in' | 'checked-out' | 'cancelled';

export interface Room {
  id: string;
  number: string;
  type: RoomType;
  pricePerNight: number;
  status: RoomStatus;
  capacity: number;
  amenities: string[];
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Guest {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address?: string;
  idNumber?: string;
  preferences?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Booking {
  id: string;
  guestId: string;
  roomId: string;
  checkIn: Date;
  checkOut: Date;
  status: BookingStatus;
  totalAmount: number;
  paidAmount: number;
  specialRequests?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Invoice {
  id: string;
  bookingId: string;
  guestId: string;
  roomNumber: string;
  checkIn: Date;
  checkOut: Date;
  nights: number;
  roomRate: number;
  subtotal: number;
  taxes: number;
  total: number;
  paid: boolean;
  createdAt: Date;
}

export interface DashboardStats {
  totalRooms: number;
  availableRooms: number;
  occupiedRooms: number;
  maintenanceRooms: number;
  totalGuests: number;
  activeBookings: number;
  todayCheckIns: number;
  todayCheckOuts: number;
  totalRevenue: number;
  monthlyRevenue: number;
  occupancyRate: number;
}

export interface SearchFilters {
  roomType?: RoomType[];
  status?: RoomStatus[];
  priceRange?: { min: number; max: number };
  dateRange?: { start: Date; end: Date };
  guestName?: string;
  roomNumber?: string;
}