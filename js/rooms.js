// Rooms page functionality

const Rooms = {
  searchTerm: '',
  filterType: 'all',
  filterStatus: 'all',
  
  render: function() {
    const rooms = this.getFilteredRooms();
    
    return `
      <div class="space-y-6 animate-fade-in">
        <!-- Header -->
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-3xl font-bold text-gradient">Room Management</h1>
            <p class="text-muted-foreground">Manage your hotel rooms and availability</p>
          </div>
          <button class="btn btn-primary" onclick="Rooms.showAddRoomModal()">
            <i class="fas fa-plus mr-2"></i>
            Add Room
          </button>
        </div>

        <!-- Filters -->
        <div class="hotel-card">
          <div class="p-6">
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              ${createSearchBox('Search rooms...', 'Rooms.handleSearch')}
              
              <select class="form-select" onchange="Rooms.handleTypeFilter(this.value)">
                <option value="all">All Types</option>
                <option value="single">Single</option>
                <option value="double">Double</option>
                <option value="suite">Suite</option>
              </select>
              
              <select class="form-select" onchange="Rooms.handleStatusFilter(this.value)">
                <option value="all">All Status</option>
                <option value="available">Available</option>
                <option value="occupied">Occupied</option>
                <option value="maintenance">Maintenance</option>
              </select>
            </div>
          </div>
        </div>

        <!-- Rooms Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" id="roomsGrid">
          ${rooms.map(room => this.renderRoomCard(room)).join('')}
        </div>

        ${rooms.length === 0 ? '<div class="text-center py-20 text-muted-foreground">No rooms found</div>' : ''}
      </div>
    `;
  },
  
  renderRoomCard: function(room) {
    return `
      <div class="hotel-card">
        <div class="p-6">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-semibold">Room ${room.number}</h3>
            ${createStatusBadge(room.status)}
          </div>
          
          <div class="space-y-2 mb-4">
            <p class="text-sm text-muted-foreground">
              <i class="fas fa-bed mr-2"></i>
              ${room.type.charAt(0).toUpperCase() + room.type.slice(1)} • ${room.capacity} guest${room.capacity > 1 ? 's' : ''}
            </p>
            <p class="text-sm text-muted-foreground">
              <i class="fas fa-dollar-sign mr-2"></i>
              ${formatCurrency(room.pricePerNight)} per night
            </p>
            <p class="text-sm text-muted-foreground line-clamp-2">${room.description}</p>
          </div>
          
          <div class="mb-4">
            <p class="text-xs text-muted-foreground mb-2">Amenities:</p>
            <div class="flex flex-wrap gap-1">
              ${room.amenities.map(amenity => `
                <span class="px-2 py-1 bg-muted text-xs rounded-full">${amenity}</span>
              `).join('')}
            </div>
          </div>
          
          <div class="flex gap-2">
            <button class="btn btn-outline flex-1" onclick="Rooms.editRoom('${room.id}')">
              <i class="fas fa-edit mr-2"></i>
              Edit
            </button>
            <button class="btn btn-outline text-destructive" onclick="Rooms.deleteRoom('${room.id}')">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </div>
      </div>
    `;
  },
  
  init: function() {
    // Initialize rooms page
  },
  
  getFilteredRooms: function() {
    let rooms = roomStorage.getAll();
    
    // Search filter
    if (this.searchTerm) {
      rooms = rooms.filter(room => 
        room.number.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        room.type.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        room.description.toLowerCase().includes(this.searchTerm.toLowerCase())
      );
    }
    
    // Type filter
    if (this.filterType !== 'all') {
      rooms = rooms.filter(room => room.type === this.filterType);
    }
    
    // Status filter
    if (this.filterStatus !== 'all') {
      rooms = rooms.filter(room => room.status === this.filterStatus);
    }
    
    return rooms;
  },
  
  handleSearch: function(term) {
    this.searchTerm = term;
    this.refreshRoomsGrid();
  },
  
  handleTypeFilter: function(type) {
    this.filterType = type;
    this.refreshRoomsGrid();
  },
  
  handleStatusFilter: function(status) {
    this.filterStatus = status;
    this.refreshRoomsGrid();
  },
  
  refreshRoomsGrid: function() {
    const grid = document.getElementById('roomsGrid');
    if (grid) {
      const rooms = this.getFilteredRooms();
      grid.innerHTML = rooms.map(room => this.renderRoomCard(room)).join('');
    }
  },
  
  showAddRoomModal: function() {
    const content = `
      <form id="roomForm" class="space-y-4">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium mb-2">Room Number</label>
            <input type="text" name="number" class="form-input" required>
          </div>
          <div>
            <label class="block text-sm font-medium mb-2">Room Type</label>
            <select name="type" class="form-select" required>
              <option value="">Select type</option>
              <option value="single">Single</option>
              <option value="double">Double</option>
              <option value="suite">Suite</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium mb-2">Price per Night</label>
            <input type="number" name="pricePerNight" class="form-input" min="0" step="0.01" required>
          </div>
          <div>
            <label class="block text-sm font-medium mb-2">Capacity</label>
            <input type="number" name="capacity" class="form-input" min="1" required>
          </div>
          <div>
            <label class="block text-sm font-medium mb-2">Status</label>
            <select name="status" class="form-select" required>
              <option value="available">Available</option>
              <option value="occupied">Occupied</option>
              <option value="maintenance">Maintenance</option>
            </select>
          </div>
        </div>
        <div>
          <label class="block text-sm font-medium mb-2">Description</label>
          <textarea name="description" class="form-input" rows="3"></textarea>
        </div>
        <div>
          <label class="block text-sm font-medium mb-2">Amenities (comma-separated)</label>
          <input type="text" name="amenities" class="form-input" placeholder="WiFi, TV, Air Conditioning">
        </div>
      </form>
    `;
    
    const actions = `
      <button class="btn btn-outline" onclick="Modal.close()">Cancel</button>
      <button class="btn btn-primary" onclick="Rooms.saveRoom()">Add Room</button>
    `;
    
    Modal.show('Add New Room', content, actions);
  },
  
  editRoom: function(roomId) {
    const room = roomStorage.findById(roomId);
    if (!room) return;
    
    const content = `
      <form id="roomForm" class="space-y-4">
        <input type="hidden" name="id" value="${room.id}">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium mb-2">Room Number</label>
            <input type="text" name="number" class="form-input" value="${room.number}" required>
          </div>
          <div>
            <label class="block text-sm font-medium mb-2">Room Type</label>
            <select name="type" class="form-select" required>
              <option value="single" ${room.type === 'single' ? 'selected' : ''}>Single</option>
              <option value="double" ${room.type === 'double' ? 'selected' : ''}>Double</option>
              <option value="suite" ${room.type === 'suite' ? 'selected' : ''}>Suite</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium mb-2">Price per Night</label>
            <input type="number" name="pricePerNight" class="form-input" value="${room.pricePerNight}" min="0" step="0.01" required>
          </div>
          <div>
            <label class="block text-sm font-medium mb-2">Capacity</label>
            <input type="number" name="capacity" class="form-input" value="${room.capacity}" min="1" required>
          </div>
          <div>
            <label class="block text-sm font-medium mb-2">Status</label>
            <select name="status" class="form-select" required>
              <option value="available" ${room.status === 'available' ? 'selected' : ''}>Available</option>
              <option value="occupied" ${room.status === 'occupied' ? 'selected' : ''}>Occupied</option>
              <option value="maintenance" ${room.status === 'maintenance' ? 'selected' : ''}>Maintenance</option>
            </select>
          </div>
        </div>
        <div>
          <label class="block text-sm font-medium mb-2">Description</label>
          <textarea name="description" class="form-input" rows="3">${room.description}</textarea>
        </div>
        <div>
          <label class="block text-sm font-medium mb-2">Amenities (comma-separated)</label>
          <input type="text" name="amenities" class="form-input" value="${room.amenities.join(', ')}">
        </div>
      </form>
    `;
    
    const actions = `
      <button class="btn btn-outline" onclick="Modal.close()">Cancel</button>
      <button class="btn btn-primary" onclick="Rooms.saveRoom()">Save Changes</button>
    `;
    
    Modal.show('Edit Room', content, actions);
  },
  
  saveRoom: function() {
    const form = document.getElementById('roomForm');
    if (!FormHelpers.validateForm(form)) {
      Toast.show('Please fill in all required fields', 'error');
      return;
    }
    
    const formData = FormHelpers.serializeForm(form);
    const amenitiesArray = formData.amenities ? formData.amenities.split(',').map(a => a.trim()).filter(a => a) : [];
    
    const roomData = {
      number: formData.number,
      type: formData.type,
      pricePerNight: parseFloat(formData.pricePerNight),
      capacity: parseInt(formData.capacity),
      status: formData.status,
      description: formData.description || '',
      amenities: amenitiesArray
    };
    
    if (formData.id) {
      // Update existing room
      roomStorage.update(formData.id, roomData);
      Toast.show('Room updated successfully', 'success');
    } else {
      // Check for duplicate room number
      if (roomStorage.findByNumber(roomData.number)) {
        Toast.show('Room number already exists', 'error');
        return;
      }
      
      // Add new room
      const newRoom = {
        id: generateId(),
        ...roomData,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      roomStorage.add(newRoom);
      Toast.show('Room added successfully', 'success');
    }
    
    Modal.close();
    this.refreshRoomsGrid();
  },
  
  deleteRoom: function(roomId) {
    const room = roomStorage.findById(roomId);
    if (!room) return;
    
    // Check if room has active bookings
    const activeBookings = bookingStorage.findByRoomId(roomId)
      .filter(b => b.status === 'active' || b.status === 'checked-in');
    
    if (activeBookings.length > 0) {
      Toast.show('Cannot delete room with active bookings', 'error');
      return;
    }
    
    confirmDialog(
      `Are you sure you want to delete Room ${room.number}? This action cannot be undone.`,
      () => {
        roomStorage.delete(roomId);
        Toast.show('Room deleted successfully', 'success');
        this.refreshRoomsGrid();
      }
    );
  }
};