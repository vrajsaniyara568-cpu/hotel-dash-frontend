// Bookings page functionality

const Bookings = {
  searchTerm: '',
  filterStatus: 'all',
  
  render: function() {
    const bookings = this.getFilteredBookings();
    
    return `
      <div class="space-y-6 animate-fade-in">
        <!-- Header -->
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-3xl font-bold text-gradient">Booking Management</h1>
            <p class="text-muted-foreground">Manage reservations and check-ins</p>
          </div>
          <button class="btn btn-primary" onclick="Bookings.showAddBookingModal()">
            <i class="fas fa-plus mr-2"></i>
            New Booking
          </button>
        </div>

        <!-- Filters -->
        <div class="hotel-card">
          <div class="p-6">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              ${createSearchBox('Search bookings...', 'Bookings.handleSearch')}
              
              <select class="form-select" onchange="Bookings.handleStatusFilter(this.value)">
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="checked-in">Checked In</option>
                <option value="checked-out">Checked Out</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>
        </div>

        <!-- Bookings Table -->
        <div class="hotel-card">
          <div class="p-6">
            ${this.renderBookingsTable(bookings)}
          </div>
        </div>
      </div>
    `;
  },
  
  renderBookingsTable: function(bookings) {
    const columns = [
      { key: 'id', label: 'Booking ID', render: (value) => `#${value.slice(-6)}` },
      { 
        key: 'guestId', 
        label: 'Guest', 
        render: (value) => {
          const guest = guestStorage.findById(value);
          return guest ? `${guest.firstName} ${guest.lastName}` : 'Unknown';
        }
      },
      { 
        key: 'roomId', 
        label: 'Room', 
        render: (value) => {
          const room = roomStorage.findById(value);
          return room ? `Room ${room.number}` : 'Unknown';
        }
      },
      { key: 'checkIn', label: 'Check In', render: (value) => formatDate(value) },
      { key: 'checkOut', label: 'Check Out', render: (value) => formatDate(value) },
      { key: 'totalAmount', label: 'Amount', render: (value) => formatCurrency(value) },
      { key: 'status', label: 'Status', render: (value) => createStatusBadge(value) }
    ];
    
    const actions = [
      { label: 'View', onclick: 'Bookings.viewBooking' },
      { label: 'Edit', onclick: 'Bookings.editBooking' },
      { label: 'Delete', onclick: 'Bookings.deleteBooking' }
    ];
    
    return createTable(bookings, columns, actions);
  },
  
  init: function() {
    // Initialize bookings page
  },
  
  getFilteredBookings: function() {
    let bookings = bookingStorage.getAll();
    
    // Search filter
    if (this.searchTerm) {
      bookings = bookings.filter(booking => {
        const guest = guestStorage.findById(booking.guestId);
        const room = roomStorage.findById(booking.roomId);
        const guestName = guest ? `${guest.firstName} ${guest.lastName}` : '';
        const roomNumber = room ? room.number : '';
        
        return (
          booking.id.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
          guestName.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
          roomNumber.toLowerCase().includes(this.searchTerm.toLowerCase())
        );
      });
    }
    
    // Status filter
    if (this.filterStatus !== 'all') {
      bookings = bookings.filter(booking => booking.status === this.filterStatus);
    }
    
    return bookings.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  },
  
  handleSearch: function(term) {
    this.searchTerm = term;
    window.app.refreshCurrentPage();
  },
  
  handleStatusFilter: function(status) {
    this.filterStatus = status;
    window.app.refreshCurrentPage();
  },
  
  showAddBookingModal: function() {
    const availableRooms = roomStorage.getAll().filter(r => r.status === 'available');
    const guests = guestStorage.getAll();
    
    const content = `
      <form id="bookingForm" class="space-y-4">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium mb-2">Guest</label>
            <select name="guestId" class="form-select" required onchange="Bookings.handleGuestChange(this.value)">
              <option value="">Select guest</option>
              ${guests.map(guest => `
                <option value="${guest.id}">${guest.firstName} ${guest.lastName}</option>
              `).join('')}
              <option value="new">+ Add New Guest</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium mb-2">Room</label>
            <select name="roomId" class="form-select" required onchange="Bookings.handleRoomChange(this.value)">
              <option value="">Select room</option>
              ${availableRooms.map(room => `
                <option value="${room.id}" data-price="${room.pricePerNight}">
                  Room ${room.number} - ${room.type} (${formatCurrency(room.pricePerNight)}/night)
                </option>
              `).join('')}
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium mb-2">Check-in Date</label>
            <input type="date" name="checkIn" class="form-input" required onchange="Bookings.calculateTotal()">
          </div>
          <div>
            <label class="block text-sm font-medium mb-2">Check-out Date</label>
            <input type="date" name="checkOut" class="form-input" required onchange="Bookings.calculateTotal()">
          </div>
        </div>
        
        <div id="newGuestForm" style="display: none;" class="p-4 border border-border rounded-lg space-y-4">
          <h4 class="font-medium">New Guest Information</h4>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input type="text" name="firstName" class="form-input" placeholder="First Name">
            <input type="text" name="lastName" class="form-input" placeholder="Last Name">
            <input type="email" name="email" class="form-input" placeholder="Email">
            <input type="tel" name="phone" class="form-input" placeholder="Phone">
          </div>
          <textarea name="address" class="form-input" placeholder="Address" rows="2"></textarea>
        </div>
        
        <div class="p-4 bg-muted/20 rounded-lg">
          <div class="flex justify-between items-center">
            <span class="font-medium">Total Amount:</span>
            <span id="totalAmount" class="text-xl font-bold text-primary">$0.00</span>
          </div>
          <p id="nightsInfo" class="text-sm text-muted-foreground mt-1"></p>
        </div>
      </form>
    `;
    
    const actions = `
      <button class="btn btn-outline" onclick="Modal.close()">Cancel</button>
      <button class="btn btn-primary" onclick="Bookings.saveBooking()">Create Booking</button>
    `;
    
    Modal.show('New Booking', content, actions);
  },
  
  handleGuestChange: function(guestId) {
    const newGuestForm = document.getElementById('newGuestForm');
    if (guestId === 'new') {
      newGuestForm.style.display = 'block';
      // Make new guest fields required
      newGuestForm.querySelectorAll('input').forEach(input => {
        if (['firstName', 'lastName', 'email', 'phone'].includes(input.name)) {
          input.required = true;
        }
      });
    } else {
      newGuestForm.style.display = 'none';
      // Remove required from new guest fields
      newGuestForm.querySelectorAll('input').forEach(input => {
        input.required = false;
      });
    }
  },
  
  handleRoomChange: function() {
    this.calculateTotal();
  },
  
  calculateTotal: function() {
    const form = document.getElementById('bookingForm');
    const roomSelect = form.querySelector('[name="roomId"]');
    const checkInInput = form.querySelector('[name="checkIn"]');
    const checkOutInput = form.querySelector('[name="checkOut"]');
    const totalElement = document.getElementById('totalAmount');
    const nightsElement = document.getElementById('nightsInfo');
    
    if (roomSelect.value && checkInInput.value && checkOutInput.value) {
      const selectedOption = roomSelect.options[roomSelect.selectedIndex];
      const pricePerNight = parseFloat(selectedOption.dataset.price);
      const checkIn = new Date(checkInInput.value);
      const checkOut = new Date(checkOutInput.value);
      
      if (checkOut > checkIn) {
        const nights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));
        const total = nights * pricePerNight;
        
        totalElement.textContent = formatCurrency(total);
        nightsElement.textContent = `${nights} night${nights > 1 ? 's' : ''} × ${formatCurrency(pricePerNight)}`;
      } else {
        totalElement.textContent = '$0.00';
        nightsElement.textContent = 'Invalid date range';
      }
    } else {
      totalElement.textContent = '$0.00';
      nightsElement.textContent = '';
    }
  },
  
  saveBooking: function() {
    const form = document.getElementById('bookingForm');
    if (!FormHelpers.validateForm(form)) {
      Toast.show('Please fill in all required fields', 'error');
      return;
    }
    
    const formData = FormHelpers.serializeForm(form);
    
    // Validate dates
    const checkIn = new Date(formData.checkIn);
    const checkOut = new Date(formData.checkOut);
    if (checkOut <= checkIn) {
      Toast.show('Check-out date must be after check-in date', 'error');
      return;
    }
    
    let guestId = formData.guestId;
    
    // Create new guest if needed
    if (guestId === 'new') {
      if (!formData.firstName || !formData.lastName || !formData.email || !formData.phone) {
        Toast.show('Please fill in all guest information', 'error');
        return;
      }
      
      // Check if guest already exists
      const existingGuest = guestStorage.findByEmail(formData.email);
      if (existingGuest) {
        guestId = existingGuest.id;
      } else {
        const newGuest = {
          id: generateId(),
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phone: formData.phone,
          address: formData.address || '',
          createdAt: new Date(),
          updatedAt: new Date()
        };
        guestStorage.add(newGuest);
        guestId = newGuest.id;
      }
    }
    
    // Calculate total
    const room = roomStorage.findById(formData.roomId);
    const nights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));
    const totalAmount = nights * room.pricePerNight;
    
    // Create booking
    const booking = {
      id: generateId(),
      guestId: guestId,
      roomId: formData.roomId,
      checkIn: checkIn,
      checkOut: checkOut,
      totalAmount: totalAmount,
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    bookingStorage.add(booking);
    
    // Update room status
    roomStorage.update(formData.roomId, { status: 'occupied' });
    
    Toast.show('Booking created successfully', 'success');
    Modal.close();
    window.app.refreshCurrentPage();
  },
  
  viewBooking: function(bookingId) {
    const booking = bookingStorage.findById(bookingId);
    const guest = guestStorage.findById(booking.guestId);
    const room = roomStorage.findById(booking.roomId);
    
    if (!booking) return;
    
    const nights = Math.ceil((new Date(booking.checkOut) - new Date(booking.checkIn)) / (1000 * 60 * 60 * 24));
    
    const content = `
      <div class="space-y-6">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 class="font-medium mb-3">Booking Details</h4>
            <div class="space-y-2 text-sm">
              <p><span class="text-muted-foreground">Booking ID:</span> #${booking.id.slice(-6)}</p>
              <p><span class="text-muted-foreground">Status:</span> ${createStatusBadge(booking.status)}</p>
              <p><span class="text-muted-foreground">Check-in:</span> ${formatDate(booking.checkIn)}</p>
              <p><span class="text-muted-foreground">Check-out:</span> ${formatDate(booking.checkOut)}</p>
              <p><span class="text-muted-foreground">Nights:</span> ${nights}</p>
              <p><span class="text-muted-foreground">Total Amount:</span> ${formatCurrency(booking.totalAmount)}</p>
            </div>
          </div>
          
          <div>
            <h4 class="font-medium mb-3">Guest Information</h4>
            <div class="space-y-2 text-sm">
              <p><span class="text-muted-foreground">Name:</span> ${guest ? `${guest.firstName} ${guest.lastName}` : 'Unknown'}</p>
              <p><span class="text-muted-foreground">Email:</span> ${guest?.email || 'N/A'}</p>
              <p><span class="text-muted-foreground">Phone:</span> ${guest?.phone || 'N/A'}</p>
              <p><span class="text-muted-foreground">Address:</span> ${guest?.address || 'N/A'}</p>
            </div>
          </div>
        </div>
        
        <div>
          <h4 class="font-medium mb-3">Room Information</h4>
          <div class="space-y-2 text-sm">
            <p><span class="text-muted-foreground">Room:</span> ${room ? `Room ${room.number}` : 'Unknown'}</p>
            <p><span class="text-muted-foreground">Type:</span> ${room?.type || 'N/A'}</p>
            <p><span class="text-muted-foreground">Price per Night:</span> ${room ? formatCurrency(room.pricePerNight) : 'N/A'}</p>
          </div>
        </div>
      </div>
    `;
    
    let actions = `<button class="btn btn-outline" onclick="Modal.close()">Close</button>`;
    
    if (booking.status === 'active') {
      actions = `
        <button class="btn btn-outline" onclick="Modal.close()">Close</button>
        <button class="btn btn-primary" onclick="Modal.close(); Bookings.checkIn('${booking.id}')">Check In</button>
      `;
    } else if (booking.status === 'checked-in') {
      actions = `
        <button class="btn btn-outline" onclick="Modal.close()">Close</button>
        <button class="btn btn-primary" onclick="Modal.close(); Bookings.checkOut('${booking.id}')">Check Out</button>
      `;
    }
    
    Modal.show('Booking Details', content, actions);
  },
  
  editBooking: function(bookingId) {
    // Implementation for editing booking
    Toast.show('Edit booking feature coming soon', 'info');
  },
  
  deleteBooking: function(bookingId) {
    const booking = bookingStorage.findById(bookingId);
    if (!booking) return;
    
    confirmDialog(
      'Are you sure you want to delete this booking? This action cannot be undone.',
      () => {
        // If booking is active, make room available
        if (booking.status === 'active' || booking.status === 'checked-in') {
          roomStorage.update(booking.roomId, { status: 'available' });
        }
        
        bookingStorage.delete(bookingId);
        Toast.show('Booking deleted successfully', 'success');
        window.app.refreshCurrentPage();
      }
    );
  },
  
  checkIn: function(bookingId) {
    const booking = bookingStorage.findById(bookingId);
    if (!booking || booking.status !== 'active') return;
    
    bookingStorage.update(bookingId, { 
      status: 'checked-in',
      actualCheckIn: new Date()
    });
    
    Toast.show('Guest checked in successfully', 'success');
    window.app.refreshCurrentPage();
  },
  
  checkOut: function(bookingId) {
    const booking = bookingStorage.findById(bookingId);
    if (!booking || booking.status !== 'checked-in') return;
    
    bookingStorage.update(bookingId, { 
      status: 'checked-out',
      actualCheckOut: new Date()
    });
    
    // Make room available
    roomStorage.update(booking.roomId, { status: 'available' });
    
    // Create invoice
    const invoice = {
      id: generateId(),
      bookingId: booking.id,
      amount: booking.totalAmount,
      status: 'paid',
      createdAt: new Date()
    };
    invoiceStorage.add(invoice);
    
    Toast.show('Guest checked out successfully', 'success');
    window.app.refreshCurrentPage();
  }
};