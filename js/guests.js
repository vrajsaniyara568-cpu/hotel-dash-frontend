// Guests page functionality

const Guests = {
  searchTerm: '',
  
  render: function() {
    const guests = this.getFilteredGuests();
    
    return `
      <div class="space-y-6 animate-fade-in">
        <!-- Header -->
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-3xl font-bold text-gradient">Guest Management</h1>
            <p class="text-muted-foreground">Manage your hotel guests and their information</p>
          </div>
          <button class="btn btn-primary" onclick="Guests.showAddGuestModal()">
            <i class="fas fa-plus mr-2"></i>
            Add Guest
          </button>
        </div>

        <!-- Search -->
        <div class="hotel-card">
          <div class="p-6">
            ${createSearchBox('Search guests...', 'Guests.handleSearch')}
          </div>
        </div>

        <!-- Guests Table -->
        <div class="hotel-card">
          <div class="p-6">
            ${this.renderGuestsTable(guests)}
          </div>
        </div>
      </div>
    `;
  },
  
  renderGuestsTable: function(guests) {
    const columns = [
      { key: 'firstName', label: 'Name', render: (value, guest) => `${guest.firstName} ${guest.lastName}` },
      { key: 'email', label: 'Email' },
      { key: 'phone', label: 'Phone' },
      { 
        key: 'id', 
        label: 'Bookings', 
        render: (value) => {
          const bookings = bookingStorage.findByGuestId(value);
          return bookings.length;
        }
      },
      { 
        key: 'id', 
        label: 'Current Status', 
        render: (value) => {
          const activeBookings = bookingStorage.findByGuestId(value)
            .filter(b => b.status === 'checked-in');
          return activeBookings.length > 0 ? createStatusBadge('checked-in') : createStatusBadge('available');
        }
      },
      { key: 'createdAt', label: 'Registered', render: (value) => formatDate(value) }
    ];
    
    const actions = [
      { label: 'View', onclick: 'Guests.viewGuest' },
      { label: 'Edit', onclick: 'Guests.editGuest' },
      { label: 'Delete', onclick: 'Guests.deleteGuest' }
    ];
    
    return createTable(guests, columns, actions);
  },
  
  init: function() {
    // Initialize guests page
  },
  
  getFilteredGuests: function() {
    let guests = guestStorage.getAll();
    
    // Search filter
    if (this.searchTerm) {
      guests = guests.filter(guest =>
        `${guest.firstName} ${guest.lastName}`.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        guest.email.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        guest.phone.toLowerCase().includes(this.searchTerm.toLowerCase())
      );
    }
    
    return guests.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  },
  
  handleSearch: function(term) {
    this.searchTerm = term;
    window.app.refreshCurrentPage();
  },
  
  showAddGuestModal: function() {
    const content = `
      <form id="guestForm" class="space-y-4">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium mb-2">First Name</label>
            <input type="text" name="firstName" class="form-input" required>
          </div>
          <div>
            <label class="block text-sm font-medium mb-2">Last Name</label>
            <input type="text" name="lastName" class="form-input" required>
          </div>
          <div>
            <label class="block text-sm font-medium mb-2">Email</label>
            <input type="email" name="email" class="form-input" required>
          </div>
          <div>
            <label class="block text-sm font-medium mb-2">Phone</label>
            <input type="tel" name="phone" class="form-input" required>
          </div>
        </div>
        <div>
          <label class="block text-sm font-medium mb-2">Address</label>
          <textarea name="address" class="form-input" rows="3"></textarea>
        </div>
      </form>
    `;
    
    const actions = `
      <button class="btn btn-outline" onclick="Modal.close()">Cancel</button>
      <button class="btn btn-primary" onclick="Guests.saveGuest()">Add Guest</button>
    `;
    
    Modal.show('Add New Guest', content, actions);
  },
  
  editGuest: function(guestId) {
    const guest = guestStorage.findById(guestId);
    if (!guest) return;
    
    const content = `
      <form id="guestForm" class="space-y-4">
        <input type="hidden" name="id" value="${guest.id}">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium mb-2">First Name</label>
            <input type="text" name="firstName" class="form-input" value="${guest.firstName}" required>
          </div>
          <div>
            <label class="block text-sm font-medium mb-2">Last Name</label>
            <input type="text" name="lastName" class="form-input" value="${guest.lastName}" required>
          </div>
          <div>
            <label class="block text-sm font-medium mb-2">Email</label>
            <input type="email" name="email" class="form-input" value="${guest.email}" required>
          </div>
          <div>
            <label class="block text-sm font-medium mb-2">Phone</label>
            <input type="tel" name="phone" class="form-input" value="${guest.phone}" required>
          </div>
        </div>
        <div>
          <label class="block text-sm font-medium mb-2">Address</label>
          <textarea name="address" class="form-input" rows="3">${guest.address || ''}</textarea>
        </div>
      </form>
    `;
    
    const actions = `
      <button class="btn btn-outline" onclick="Modal.close()">Cancel</button>
      <button class="btn btn-primary" onclick="Guests.saveGuest()">Save Changes</button>
    `;
    
    Modal.show('Edit Guest', content, actions);
  },
  
  saveGuest: function() {
    const form = document.getElementById('guestForm');
    if (!FormHelpers.validateForm(form)) {
      Toast.show('Please fill in all required fields', 'error');
      return;
    }
    
    const formData = FormHelpers.serializeForm(form);
    
    if (formData.id) {
      // Update existing guest
      guestStorage.update(formData.id, {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        address: formData.address || ''
      });
      Toast.show('Guest updated successfully', 'success');
    } else {
      // Check for duplicate email
      if (guestStorage.findByEmail(formData.email)) {
        Toast.show('Email already exists', 'error');
        return;
      }
      
      // Add new guest
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
      Toast.show('Guest added successfully', 'success');
    }
    
    Modal.close();
    window.app.refreshCurrentPage();
  },
  
  viewGuest: function(guestId) {
    const guest = guestStorage.findById(guestId);
    const guestBookings = bookingStorage.findByGuestId(guestId);
    
    if (!guest) return;
    
    const activeBookings = guestBookings.filter(b => b.status === 'checked-in');
    const upcomingBookings = guestBookings.filter(b => b.status === 'active');
    const pastBookings = guestBookings.filter(b => b.status === 'checked-out');
    
    const content = `
      <div class="space-y-6">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 class="font-medium mb-3">Guest Information</h4>
            <div class="space-y-2 text-sm">
              <p><span class="text-muted-foreground">Name:</span> ${guest.firstName} ${guest.lastName}</p>
              <p><span class="text-muted-foreground">Email:</span> ${guest.email}</p>
              <p><span class="text-muted-foreground">Phone:</span> ${guest.phone}</p>
              <p><span class="text-muted-foreground">Address:</span> ${guest.address || 'N/A'}</p>
              <p><span class="text-muted-foreground">Registered:</span> ${formatDate(guest.createdAt)}</p>
            </div>
          </div>
          
          <div>
            <h4 class="font-medium mb-3">Booking Summary</h4>
            <div class="space-y-2 text-sm">
              <p><span class="text-muted-foreground">Total Bookings:</span> ${guestBookings.length}</p>
              <p><span class="text-muted-foreground">Active Bookings:</span> ${activeBookings.length}</p>
              <p><span class="text-muted-foreground">Upcoming Bookings:</span> ${upcomingBookings.length}</p>
              <p><span class="text-muted-foreground">Past Bookings:</span> ${pastBookings.length}</p>
            </div>
          </div>
        </div>
        
        ${guestBookings.length > 0 ? `
          <div>
            <h4 class="font-medium mb-3">Recent Bookings</h4>
            <div class="space-y-2">
              ${guestBookings.slice(0, 5).map(booking => {
                const room = roomStorage.findById(booking.roomId);
                return `
                  <div class="flex items-center justify-between p-3 border border-border/50 rounded-lg">
                    <div>
                      <p class="font-medium">Room ${room?.number || 'Unknown'}</p>
                      <p class="text-sm text-muted-foreground">
                        ${formatDate(booking.checkIn)} - ${formatDate(booking.checkOut)}
                      </p>
                    </div>
                    <div class="text-right">
                      <p class="text-sm font-medium">${formatCurrency(booking.totalAmount)}</p>
                      <p class="text-xs">${createStatusBadge(booking.status)}</p>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          </div>
        ` : ''}
      </div>
    `;
    
    const actions = `
      <button class="btn btn-outline" onclick="Modal.close()">Close</button>
      <button class="btn btn-primary" onclick="Modal.close(); Guests.editGuest('${guest.id}')">Edit Guest</button>
    `;
    
    Modal.show(`${guest.firstName} ${guest.lastName}`, content, actions);
  },
  
  deleteGuest: function(guestId) {
    const guest = guestStorage.findById(guestId);
    if (!guest) return;
    
    // Check if guest has active bookings
    const activeBookings = bookingStorage.findByGuestId(guestId)
      .filter(b => b.status === 'active' || b.status === 'checked-in');
    
    if (activeBookings.length > 0) {
      Toast.show('Cannot delete guest with active bookings', 'error');
      return;
    }
    
    confirmDialog(
      `Are you sure you want to delete ${guest.firstName} ${guest.lastName}? This action cannot be undone.`,
      () => {
        guestStorage.delete(guestId);
        Toast.show('Guest deleted successfully', 'success');
        window.app.refreshCurrentPage();
      }
    );
  }
};