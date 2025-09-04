// Settings page functionality

const Settings = {
  render: function() {
    const stats = this.getDataStats();
    
    return `
      <div class="space-y-6 animate-fade-in">
        <!-- Header -->
        <div>
          <h1 class="text-3xl font-bold text-gradient">Settings</h1>
          <p class="text-muted-foreground">Manage your hotel management system settings</p>
        </div>

        <!-- Hotel Information -->
        <div class="hotel-card">
          <div class="p-6 border-b border-border">
            <h3 class="text-lg font-semibold flex items-center gap-2">
              <i class="fas fa-hotel text-accent"></i>
              Hotel Information
            </h3>
            <p class="text-sm text-muted-foreground">Basic information about your hotel</p>
          </div>
          <div class="p-6">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 class="font-semibold text-lg">LuxeStay Hotel</h4>
                <p class="text-muted-foreground">123 Luxury Avenue</p>
                <p class="text-muted-foreground">City, State 12345</p>
                <p class="text-muted-foreground">Phone: +1-555-HOTEL</p>
              </div>
              <div>
                <h4 class="font-medium mb-2">System Statistics</h4>
                <div class="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p class="text-muted-foreground">Total Rooms</p>
                    <p class="font-semibold">${stats.rooms}</p>
                  </div>
                  <div>
                    <p class="text-muted-foreground">Total Guests</p>
                    <p class="font-semibold">${stats.guests}</p>
                  </div>
                  <div>
                    <p class="text-muted-foreground">Total Bookings</p>
                    <p class="font-semibold">${stats.bookings}</p>
                  </div>
                  <div>
                    <p class="text-muted-foreground">Total Invoices</p>
                    <p class="font-semibold">${stats.invoices}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Data Management -->
        <div class="hotel-card">
          <div class="p-6 border-b border-border">
            <h3 class="text-lg font-semibold flex items-center gap-2">
              <i class="fas fa-database text-accent"></i>
              Data Management
            </h3>
            <p class="text-sm text-muted-foreground">Backup, restore, and manage your system data</p>
          </div>
          <div class="p-6">
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div class="space-y-3">
                <h4 class="font-medium">Export Data</h4>
                <p class="text-sm text-muted-foreground">
                  Download a complete backup of all your data
                </p>
                <button class="btn btn-outline w-full" onclick="Settings.exportAllData()">
                  <i class="fas fa-download mr-2"></i>
                  Export All Data
                </button>
              </div>

              <div class="space-y-3">
                <h4 class="font-medium">Import Data</h4>
                <p class="text-sm text-muted-foreground">
                  Restore data from a previously exported backup
                </p>
                <div class="relative">
                  <input
                    type="file"
                    accept=".json"
                    onchange="Settings.importData(event)"
                    class="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    id="importFileInput"
                  >
                  <button class="btn btn-outline w-full">
                    <i class="fas fa-upload mr-2"></i>
                    Import Data
                  </button>
                </div>
              </div>

              <div class="space-y-3">
                <h4 class="font-medium">Clear All Data</h4>
                <p class="text-sm text-muted-foreground">
                  Permanently delete all system data
                </p>
                <button 
                  class="btn btn-outline w-full text-destructive hover:bg-destructive hover:text-destructive-foreground"
                  onclick="Settings.clearAllData()"
                >
                  <i class="fas fa-trash mr-2"></i>
                  Clear All Data
                </button>
              </div>
            </div>

            <div class="mt-6 p-4 bg-muted/20 rounded-lg">
              <h4 class="font-medium mb-2">Important Notes:</h4>
              <ul class="text-sm text-muted-foreground space-y-1">
                <li>• All data is stored locally in your browser's storage</li>
                <li>• Export your data regularly to prevent data loss</li>
                <li>• Clearing browser data will remove all hotel information</li>
                <li>• Imported data will overwrite existing data completely</li>
              </ul>
            </div>
          </div>
        </div>

        <!-- System Information -->
        <div class="hotel-card">
          <div class="p-6 border-b border-border">
            <h3 class="text-lg font-semibold flex items-center gap-2">
              <i class="fas fa-info-circle text-accent"></i>
              System Information
            </h3>
          </div>
          <div class="p-6">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
              <div>
                <h4 class="font-medium mb-2">Technology Stack</h4>
                <ul class="space-y-1 text-muted-foreground">
                  <li>• HTML5 + JavaScript</li>
                  <li>• Tailwind CSS</li>
                  <li>• LocalStorage API</li>
                  <li>• Font Awesome Icons</li>
                </ul>
              </div>
              <div>
                <h4 class="font-medium mb-2">Features</h4>
                <ul class="space-y-1 text-muted-foreground">
                  <li>• Room Management</li>
                  <li>• Booking System</li>
                  <li>• Guest Database</li>
                  <li>• Billing & Invoicing</li>
                  <li>• Data Export/Import</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  },
  
  init: function() {
    // Initialize settings page
  },
  
  getDataStats: function() {
    return {
      rooms: roomStorage.getAll().length,
      guests: guestStorage.getAll().length,
      bookings: bookingStorage.getAll().length,
      invoices: invoiceStorage.getAll().length,
    };
  },
  
  exportAllData: function() {
    const data = {
      rooms: roomStorage.getAll(),
      guests: guestStorage.getAll(),
      bookings: bookingStorage.getAll(),
      invoices: invoiceStorage.getAll(),
      exportedAt: new Date().toISOString(),
    };

    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `hotel-data-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);

    Toast.show('All data exported successfully!', 'success');
  },
  
  importData: function(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        
        // Validate data structure
        if (!data.rooms || !data.guests || !data.bookings || !data.invoices) {
          throw new Error('Invalid data format');
        }

        // Import data
        roomStorage.save(data.rooms);
        guestStorage.save(data.guests);
        bookingStorage.save(data.bookings);
        invoiceStorage.save(data.invoices);

        Toast.show('Data imported successfully! Please refresh the page.', 'success');
        
        // Refresh current page after a delay
        setTimeout(() => {
          window.app.refreshCurrentPage();
        }, 1000);
        
      } catch (error) {
        Toast.show('Failed to import data. Please check the file format.', 'error');
      }
    };
    reader.readAsText(file);

    // Clear the input value to allow importing the same file again
    event.target.value = '';
  },
  
  clearAllData: function() {
    confirmDialog(
      'Are you sure you want to clear ALL data? This will permanently delete all rooms, guests, bookings, and invoices. This action cannot be undone.',
      () => {
        confirmDialog(
          'This will permanently delete all your hotel data. Are you absolutely sure you want to continue?',
          () => {
            roomStorage.save([]);
            guestStorage.save([]);
            bookingStorage.save([]);
            invoiceStorage.save([]);

            Toast.show('All data cleared successfully!', 'success');
            
            // Refresh current page after a delay
            setTimeout(() => {
              window.app.refreshCurrentPage();
            }, 1000);
          }
        );
      }
    );
  }
};