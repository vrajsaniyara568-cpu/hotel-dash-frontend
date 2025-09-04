// Dashboard page functionality

const Dashboard = {
  render: function() {
    const stats = this.calculateStats();
    const recentBookings = this.getRecentBookings();
    const upcomingCheckIns = this.getUpcomingCheckIns();
    
    return `
      <div class="space-y-8 animate-fade-in">
        <!-- Header -->
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-4xl font-bold text-gradient">Hotel Dashboard</h1>
            <p class="text-muted-foreground mt-2">
              Welcome back! Here's what's happening at your hotel today.
            </p>
          </div>
          <div class="text-right">
            <p class="text-sm text-muted-foreground">
              ${new Date().toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>
          </div>
        </div>

        <!-- Main Stats Grid -->
        <div class="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          ${createStatCard('Total Rooms', stats.totalRooms, 'Available inventory', 'fas fa-bed')}
          ${createStatCard('Occupancy Rate', `${stats.occupancyRate}%`, 'Current occupancy', 'fas fa-chart-line', '+5.2% from yesterday')}
          ${createStatCard('Active Bookings', stats.activeBookings, 'Current reservations', 'fas fa-calendar-check')}
          ${createStatCard('Monthly Revenue', formatCurrency(stats.monthlyRevenue), "This month's earnings", 'fas fa-dollar-sign', '+12.3% from last month')}
        </div>

        <!-- Secondary Stats -->
        <div class="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          ${createStatCard('Available Rooms', stats.availableRooms, 'Ready for booking', 'fas fa-check-circle')}
          ${createStatCard('Occupied Rooms', stats.occupiedRooms, 'Currently booked', 'fas fa-users')}
          ${createStatCard("Today's Check-ins", stats.todayCheckIns, 'Expected arrivals', 'fas fa-clock')}
          ${createStatCard("Today's Check-outs", stats.todayCheckOuts, 'Expected departures', 'fas fa-sign-out-alt')}
        </div>

        <!-- Recent Activity & Upcoming -->
        <div class="grid gap-6 lg:grid-cols-2">
          <!-- Recent Bookings -->
          <div class="hotel-card">
            <div class="p-6 border-b border-border">
              <h3 class="text-lg font-semibold flex items-center gap-2">
                <i class="fas fa-calendar-check text-accent"></i>
                Recent Bookings
              </h3>
              <p class="text-sm text-muted-foreground">Latest reservations made</p>
            </div>
            <div class="p-6">
              <div class="space-y-4">
                ${recentBookings.length > 0 ? recentBookings.map(booking => {
                  const guest = guestStorage.findById(booking.guestId);
                  const room = roomStorage.findById(booking.roomId);
                  return `
                    <div class="flex items-center justify-between p-3 border border-border/50 rounded-lg hover:bg-muted/50 transition-colors">
                      <div>
                        <p class="font-medium">${guest ? `${guest.firstName} ${guest.lastName}` : 'Unknown Guest'}</p>
                        <p class="text-sm text-muted-foreground">Room ${room?.number} • ${createStatusBadge(booking.status)}</p>
                      </div>
                      <div class="text-right">
                        <p class="text-sm font-medium">${formatCurrency(booking.totalAmount)}</p>
                        <p class="text-xs text-muted-foreground">${formatDate(booking.createdAt)}</p>
                      </div>
                    </div>
                  `;
                }).join('') : '<p class="text-muted-foreground text-center py-4">No recent bookings</p>'}
              </div>
            </div>
          </div>

          <!-- Upcoming Check-ins -->
          <div class="hotel-card">
            <div class="p-6 border-b border-border">
              <h3 class="text-lg font-semibold flex items-center gap-2">
                <i class="fas fa-users text-accent"></i>
                Upcoming Check-ins
              </h3>
              <p class="text-sm text-muted-foreground">Expected arrivals</p>
            </div>
            <div class="p-6">
              <div class="space-y-4">
                ${upcomingCheckIns.length > 0 ? upcomingCheckIns.map(booking => {
                  const guest = guestStorage.findById(booking.guestId);
                  const room = roomStorage.findById(booking.roomId);
                  const nights = Math.ceil((new Date(booking.checkOut).getTime() - new Date(booking.checkIn).getTime()) / (1000 * 60 * 60 * 24));
                  return `
                    <div class="flex items-center justify-between p-3 border border-border/50 rounded-lg hover:bg-muted/50 transition-colors">
                      <div>
                        <p class="font-medium">${guest ? `${guest.firstName} ${guest.lastName}` : 'Unknown Guest'}</p>
                        <p class="text-sm text-muted-foreground">Room ${room?.number}</p>
                      </div>
                      <div class="text-right">
                        <p class="text-sm font-medium">${formatDate(booking.checkIn)}</p>
                        <p class="text-xs text-muted-foreground">${nights} nights</p>
                      </div>
                    </div>
                  `;
                }).join('') : '<p class="text-muted-foreground text-center py-4">No upcoming check-ins</p>'}
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  },
  
  init: function() {
    // Dashboard initialization
  },
  
  calculateStats: function() {
    const rooms = roomStorage.getAll();
    const guests = guestStorage.getAll();
    const bookings = bookingStorage.getAll();
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const availableRooms = rooms.filter(r => r.status === 'available').length;
    const occupiedRooms = rooms.filter(r => r.status === 'occupied').length;
    const maintenanceRooms = rooms.filter(r => r.status === 'maintenance').length;
    
    const activeBookings = bookings.filter(b => b.status === 'active' || b.status === 'checked-in').length;
    
    const todayCheckIns = bookings.filter(b => {
      const checkIn = new Date(b.checkIn);
      return checkIn >= today && checkIn < tomorrow;
    }).length;
    
    const todayCheckOuts = bookings.filter(b => {
      const checkOut = new Date(b.checkOut);
      return checkOut >= today && checkOut < tomorrow;
    }).length;
    
    const totalRevenue = bookings
      .filter(b => b.status === 'checked-out')
      .reduce((sum, b) => sum + b.totalAmount, 0);
    
    const currentMonth = new Date();
    currentMonth.setDate(1);
    currentMonth.setHours(0, 0, 0, 0);
    
    const monthlyRevenue = bookings
      .filter(b => {
        const createdDate = new Date(b.createdAt);
        return createdDate >= currentMonth && (b.status === 'checked-out' || b.status === 'checked-in');
      })
      .reduce((sum, b) => sum + b.totalAmount, 0);
    
    const occupancyRate = rooms.length > 0 ? Math.round((occupiedRooms / rooms.length) * 100) : 0;
    
    return {
      totalRooms: rooms.length,
      availableRooms,
      occupiedRooms,
      maintenanceRooms,
      totalGuests: guests.length,
      activeBookings,
      todayCheckIns,
      todayCheckOuts,
      totalRevenue,
      monthlyRevenue,
      occupancyRate,
    };
  },
  
  getRecentBookings: function() {
    return bookingStorage.getAll()
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);
  },
  
  getUpcomingCheckIns: function() {
    const today = new Date();
    return bookingStorage.getAll()
      .filter(b => {
        const checkIn = new Date(b.checkIn);
        return checkIn >= today && b.status === 'active';
      })
      .sort((a, b) => new Date(a.checkIn).getTime() - new Date(b.checkIn).getTime())
      .slice(0, 5);
  }
};