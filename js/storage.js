// LocalStorage utilities for Hotel Management System

const STORAGE_KEYS = {
  ROOMS: 'hotel_rooms',
  GUESTS: 'hotel_guests',
  BOOKINGS: 'hotel_bookings',
  INVOICES: 'hotel_invoices',
  USER_PREFERENCES: 'hotel_user_preferences',
};

// Generic storage functions
function getFromStorage(key) {
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

function saveToStorage(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error(`Error saving to localStorage key "${key}":`, error);
  }
}

// Room storage functions
const roomStorage = {
  getAll: () => getFromStorage(STORAGE_KEYS.ROOMS),
  
  save: (rooms) => saveToStorage(STORAGE_KEYS.ROOMS, rooms),
  
  add: (room) => {
    const rooms = roomStorage.getAll();
    rooms.push(room);
    roomStorage.save(rooms);
  },
  
  update: (id, updates) => {
    const rooms = roomStorage.getAll();
    const index = rooms.findIndex(r => r.id === id);
    if (index !== -1) {
      rooms[index] = { ...rooms[index], ...updates, updatedAt: new Date() };
      roomStorage.save(rooms);
    }
  },
  
  delete: (id) => {
    const rooms = roomStorage.getAll().filter(r => r.id !== id);
    roomStorage.save(rooms);
  },
  
  findById: (id) => {
    return roomStorage.getAll().find(r => r.id === id);
  },
  
  findByNumber: (number) => {
    return roomStorage.getAll().find(r => r.number === number);
  }
};

// Guest storage functions
const guestStorage = {
  getAll: () => getFromStorage(STORAGE_KEYS.GUESTS),
  
  save: (guests) => saveToStorage(STORAGE_KEYS.GUESTS, guests),
  
  add: (guest) => {
    const guests = guestStorage.getAll();
    guests.push(guest);
    guestStorage.save(guests);
  },
  
  update: (id, updates) => {
    const guests = guestStorage.getAll();
    const index = guests.findIndex(g => g.id === id);
    if (index !== -1) {
      guests[index] = { ...guests[index], ...updates, updatedAt: new Date() };
      guestStorage.save(guests);
    }
  },
  
  delete: (id) => {
    const guests = guestStorage.getAll().filter(g => g.id !== id);
    guestStorage.save(guests);
  },
  
  findById: (id) => {
    return guestStorage.getAll().find(g => g.id === id);
  },
  
  findByEmail: (email) => {
    return guestStorage.getAll().find(g => g.email.toLowerCase() === email.toLowerCase());
  }
};

// Booking storage functions
const bookingStorage = {
  getAll: () => getFromStorage(STORAGE_KEYS.BOOKINGS),
  
  save: (bookings) => saveToStorage(STORAGE_KEYS.BOOKINGS, bookings),
  
  add: (booking) => {
    const bookings = bookingStorage.getAll();
    bookings.push(booking);
    bookingStorage.save(bookings);
  },
  
  update: (id, updates) => {
    const bookings = bookingStorage.getAll();
    const index = bookings.findIndex(b => b.id === id);
    if (index !== -1) {
      bookings[index] = { ...bookings[index], ...updates, updatedAt: new Date() };
      bookingStorage.save(bookings);
    }
  },
  
  delete: (id) => {
    const bookings = bookingStorage.getAll().filter(b => b.id !== id);
    bookingStorage.save(bookings);
  },
  
  findById: (id) => {
    return bookingStorage.getAll().find(b => b.id === id);
  },
  
  findByGuestId: (guestId) => {
    return bookingStorage.getAll().filter(b => b.guestId === guestId);
  },
  
  findByRoomId: (roomId) => {
    return bookingStorage.getAll().filter(b => b.roomId === roomId);
  }
};

// Invoice storage functions
const invoiceStorage = {
  getAll: () => getFromStorage(STORAGE_KEYS.INVOICES),
  
  save: (invoices) => saveToStorage(STORAGE_KEYS.INVOICES, invoices),
  
  add: (invoice) => {
    const invoices = invoiceStorage.getAll();
    invoices.push(invoice);
    invoiceStorage.save(invoices);
  },
  
  update: (id, updates) => {
    const invoices = invoiceStorage.getAll();
    const index = invoices.findIndex(i => i.id === id);
    if (index !== -1) {
      invoices[index] = { ...invoices[index], ...updates };
      invoiceStorage.save(invoices);
    }
  },
  
  delete: (id) => {
    const invoices = invoiceStorage.getAll().filter(i => i.id !== id);
    invoiceStorage.save(invoices);
  },
  
  findById: (id) => {
    return invoiceStorage.getAll().find(i => i.id === id);
  },
  
  findByBookingId: (bookingId) => {
    return invoiceStorage.getAll().find(i => i.bookingId === bookingId);
  }
};

// Initialize with sample data if empty
function initializeSampleData() {
  if (roomStorage.getAll().length === 0) {
    const sampleRooms = [
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
    const sampleGuests = [
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

// Generate unique ID
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}