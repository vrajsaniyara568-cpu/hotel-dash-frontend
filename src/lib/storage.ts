// LocalStorage utilities for Hotel Management System

import type { Room, Guest, Booking, Invoice } from '@/types/hotel';

const STORAGE_KEYS = {
  ROOMS: 'hotel_rooms',
  GUESTS: 'hotel_guests',
  BOOKINGS: 'hotel_bookings',
  INVOICES: 'hotel_invoices',
  USER_PREFERENCES: 'hotel_user_preferences',
} as const;

// Generic storage functions
function getFromStorage<T>(key: string): T[] {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data, (key, value) => {
      // Parse dates back from JSON
      if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value)) {
        return new Date(value);
      }
      return value;
    }) : [];
  } catch (error) {
    console.error(`Error reading from localStorage key "${key}":`, error);
    return [];
  }
}

function saveToStorage<T>(key: string, data: T[]): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error(`Error saving to localStorage key "${key}":`, error);
  }
}

// Room storage functions
export const roomStorage = {
  getAll: (): Room[] => getFromStorage<Room>(STORAGE_KEYS.ROOMS),
  
  save: (rooms: Room[]): void => saveToStorage(STORAGE_KEYS.ROOMS, rooms),
  
  add: (room: Room): void => {
    const rooms = roomStorage.getAll();
    rooms.push(room);
    roomStorage.save(rooms);
  },
  
  update: (id: string, updates: Partial<Room>): void => {
    const rooms = roomStorage.getAll();
    const index = rooms.findIndex(r => r.id === id);
    if (index !== -1) {
      rooms[index] = { ...rooms[index], ...updates, updatedAt: new Date() };
      roomStorage.save(rooms);
    }
  },
  
  delete: (id: string): void => {
    const rooms = roomStorage.getAll().filter(r => r.id !== id);
    roomStorage.save(rooms);
  },
  
  findById: (id: string): Room | undefined => {
    return roomStorage.getAll().find(r => r.id === id);
  },
  
  findByNumber: (number: string): Room | undefined => {
    return roomStorage.getAll().find(r => r.number === number);
  }
};

// Guest storage functions
export const guestStorage = {
  getAll: (): Guest[] => getFromStorage<Guest>(STORAGE_KEYS.GUESTS),
  
  save: (guests: Guest[]): void => saveToStorage(STORAGE_KEYS.GUESTS, guests),
  
  add: (guest: Guest): void => {
    const guests = guestStorage.getAll();
    guests.push(guest);
    guestStorage.save(guests);
  },
  
  update: (id: string, updates: Partial<Guest>): void => {
    const guests = guestStorage.getAll();
    const index = guests.findIndex(g => g.id === id);
    if (index !== -1) {
      guests[index] = { ...guests[index], ...updates, updatedAt: new Date() };
      guestStorage.save(guests);
    }
  },
  
  delete: (id: string): void => {
    const guests = guestStorage.getAll().filter(g => g.id !== id);
    guestStorage.save(guests);
  },
  
  findById: (id: string): Guest | undefined => {
    return guestStorage.getAll().find(g => g.id === id);
  },
  
  findByEmail: (email: string): Guest | undefined => {
    return guestStorage.getAll().find(g => g.email.toLowerCase() === email.toLowerCase());
  }
};

// Booking storage functions
export const bookingStorage = {
  getAll: (): Booking[] => getFromStorage<Booking>(STORAGE_KEYS.BOOKINGS),
  
  save: (bookings: Booking[]): void => saveToStorage(STORAGE_KEYS.BOOKINGS, bookings),
  
  add: (booking: Booking): void => {
    const bookings = bookingStorage.getAll();
    bookings.push(booking);
    bookingStorage.save(bookings);
  },
  
  update: (id: string, updates: Partial<Booking>): void => {
    const bookings = bookingStorage.getAll();
    const index = bookings.findIndex(b => b.id === id);
    if (index !== -1) {
      bookings[index] = { ...bookings[index], ...updates, updatedAt: new Date() };
      bookingStorage.save(bookings);
    }
  },
  
  delete: (id: string): void => {
    const bookings = bookingStorage.getAll().filter(b => b.id !== id);
    bookingStorage.save(bookings);
  },
  
  findById: (id: string): Booking | undefined => {
    return bookingStorage.getAll().find(b => b.id === id);
  },
  
  findByGuestId: (guestId: string): Booking[] => {
    return bookingStorage.getAll().filter(b => b.guestId === guestId);
  },
  
  findByRoomId: (roomId: string): Booking[] => {
    return bookingStorage.getAll().filter(b => b.roomId === roomId);
  }
};

// Invoice storage functions
export const invoiceStorage = {
  getAll: (): Invoice[] => getFromStorage<Invoice>(STORAGE_KEYS.INVOICES),
  
  save: (invoices: Invoice[]): void => saveToStorage(STORAGE_KEYS.INVOICES, invoices),
  
  add: (invoice: Invoice): void => {
    const invoices = invoiceStorage.getAll();
    invoices.push(invoice);
    invoiceStorage.save(invoices);
  },
  
  update: (id: string, updates: Partial<Invoice>): void => {
    const invoices = invoiceStorage.getAll();
    const index = invoices.findIndex(i => i.id === id);
    if (index !== -1) {
      invoices[index] = { ...invoices[index], ...updates };
      invoiceStorage.save(invoices);
    }
  },
  
  delete: (id: string): void => {
    const invoices = invoiceStorage.getAll().filter(i => i.id !== id);
    invoiceStorage.save(invoices);
  },
  
  findById: (id: string): Invoice | undefined => {
    return invoiceStorage.getAll().find(i => i.id === id);
  },
  
  findByBookingId: (bookingId: string): Invoice | undefined => {
    return invoiceStorage.getAll().find(i => i.bookingId === bookingId);
  }
};

// Initialize with sample data if empty
export function initializeSampleData(): void {
  if (roomStorage.getAll().length === 0) {
    const sampleRooms: Room[] = [
      {
        id: '1',
        number: '101',
        type: 'single',
        pricePerNight: 120,
        status: 'available',
        capacity: 1,
        amenities: ['WiFi', 'TV', 'Air Conditioning'],
        description: 'Cozy single room with city view',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: '2',
        number: '102',
        type: 'double',
        pricePerNight: 180,
        status: 'occupied',
        capacity: 2,
        amenities: ['WiFi', 'TV', 'Air Conditioning', 'Mini Bar'],
        description: 'Spacious double room with garden view',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: '3',
        number: '201',
        type: 'suite',
        pricePerNight: 350,
        status: 'available',
        capacity: 4,
        amenities: ['WiFi', 'TV', 'Air Conditioning', 'Mini Bar', 'Balcony', 'Kitchenette'],
        description: 'Luxury suite with ocean view',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
    roomStorage.save(sampleRooms);
  }

  if (guestStorage.getAll().length === 0) {
    const sampleGuests: Guest[] = [
      {
        id: '1',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@email.com',
        phone: '+1-555-0123',
        address: '123 Main St, City, State',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
    guestStorage.save(sampleGuests);
  }
}