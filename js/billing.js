// Billing page functionality

const Billing = {
  searchTerm: '',
  filterStatus: 'all',
  
  render: function() {
    const invoices = this.getFilteredInvoices();
    const stats = this.calculateStats();
    
    return `
      <div class="space-y-6 animate-fade-in">
        <!-- Header -->
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-3xl font-bold text-gradient">Billing & Invoicing</h1>
            <p class="text-muted-foreground">Manage invoices and financial records</p>
          </div>
          <button class="btn btn-primary" onclick="Billing.generateReport()">
            <i class="fas fa-file-download mr-2"></i>
            Generate Report
          </button>
        </div>

        <!-- Revenue Stats -->
        <div class="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          ${createStatCard('Total Revenue', formatCurrency(stats.totalRevenue), 'All time earnings', 'fas fa-dollar-sign')}
          ${createStatCard('Monthly Revenue', formatCurrency(stats.monthlyRevenue), 'This month', 'fas fa-chart-line')}
          ${createStatCard('Pending Invoices', stats.pendingInvoices, 'Awaiting payment', 'fas fa-clock')}
          ${createStatCard('Paid Invoices', stats.paidInvoices, 'Completed payments', 'fas fa-check-circle')}
        </div>

        <!-- Filters -->
        <div class="hotel-card">
          <div class="p-6">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              ${createSearchBox('Search invoices...', 'Billing.handleSearch')}
              
              <select class="form-select" onchange="Billing.handleStatusFilter(this.value)">
                <option value="all">All Status</option>
                <option value="paid">Paid</option>
                <option value="pending">Pending</option>
                <option value="overdue">Overdue</option>
              </select>
            </div>
          </div>
        </div>

        <!-- Invoices Table -->
        <div class="hotel-card">
          <div class="p-6">
            ${this.renderInvoicesTable(invoices)}
          </div>
        </div>
      </div>
    `;
  },
  
  renderInvoicesTable: function(invoices) {
    const columns = [
      { key: 'id', label: 'Invoice ID', render: (value) => `#${value.slice(-6)}` },
      { 
        key: 'bookingId', 
        label: 'Booking', 
        render: (value) => {
          const booking = bookingStorage.findById(value);
          return booking ? `#${booking.id.slice(-6)}` : 'Unknown';
        }
      },
      { 
        key: 'bookingId', 
        label: 'Guest', 
        render: (value) => {
          const booking = bookingStorage.findById(value);
          if (booking) {
            const guest = guestStorage.findById(booking.guestId);
            return guest ? `${guest.firstName} ${guest.lastName}` : 'Unknown';
          }
          return 'Unknown';
        }
      },
      { key: 'amount', label: 'Amount', render: (value) => formatCurrency(value) },
      { key: 'status', label: 'Status', render: (value) => createStatusBadge(value) },
      { key: 'createdAt', label: 'Date', render: (value) => formatDate(value) }
    ];
    
    const actions = [
      { label: 'View', onclick: 'Billing.viewInvoice' },
      { label: 'Print', onclick: 'Billing.printInvoice' },
      { label: 'Delete', onclick: 'Billing.deleteInvoice' }
    ];
    
    return createTable(invoices, columns, actions);
  },
  
  init: function() {
    // Initialize billing page
  },
  
  calculateStats: function() {
    const invoices = invoiceStorage.getAll();
    const currentMonth = new Date();
    currentMonth.setDate(1);
    currentMonth.setHours(0, 0, 0, 0);
    
    const totalRevenue = invoices
      .filter(i => i.status === 'paid')
      .reduce((sum, i) => sum + i.amount, 0);
    
    const monthlyRevenue = invoices
      .filter(i => {
        const createdDate = new Date(i.createdAt);
        return createdDate >= currentMonth && i.status === 'paid';
      })
      .reduce((sum, i) => sum + i.amount, 0);
    
    const pendingInvoices = invoices.filter(i => i.status === 'pending').length;
    const paidInvoices = invoices.filter(i => i.status === 'paid').length;
    
    return {
      totalRevenue,
      monthlyRevenue,
      pendingInvoices,
      paidInvoices
    };
  },
  
  getFilteredInvoices: function() {
    let invoices = invoiceStorage.getAll();
    
    // Search filter
    if (this.searchTerm) {
      invoices = invoices.filter(invoice => {
        const booking = bookingStorage.findById(invoice.bookingId);
        let searchText = invoice.id;
        
        if (booking) {
          const guest = guestStorage.findById(booking.guestId);
          if (guest) {
            searchText += ` ${guest.firstName} ${guest.lastName}`;
          }
          searchText += ` ${booking.id}`;
        }
        
        return searchText.toLowerCase().includes(this.searchTerm.toLowerCase());
      });
    }
    
    // Status filter
    if (this.filterStatus !== 'all') {
      invoices = invoices.filter(invoice => invoice.status === this.filterStatus);
    }
    
    return invoices.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  },
  
  handleSearch: function(term) {
    this.searchTerm = term;
    window.app.refreshCurrentPage();
  },
  
  handleStatusFilter: function(status) {
    this.filterStatus = status;
    window.app.refreshCurrentPage();
  },
  
  viewInvoice: function(invoiceId) {
    const invoice = invoiceStorage.findById(invoiceId);
    const booking = bookingStorage.findById(invoice.bookingId);
    const guest = booking ? guestStorage.findById(booking.guestId) : null;
    const room = booking ? roomStorage.findById(booking.roomId) : null;
    
    if (!invoice) return;
    
    const nights = booking ? Math.ceil((new Date(booking.checkOut) - new Date(booking.checkIn)) / (1000 * 60 * 60 * 24)) : 0;
    
    const content = `
      <div class="space-y-6">
        <div class="text-center border-b border-border pb-4">
          <h3 class="text-xl font-bold">INVOICE</h3>
          <p class="text-muted-foreground">LuxeStay Hotel Management</p>
          <p class="text-sm text-muted-foreground">123 Luxury Avenue, City, State 12345</p>
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 class="font-medium mb-3">Bill To:</h4>
            <div class="space-y-1 text-sm">
              <p class="font-medium">${guest ? `${guest.firstName} ${guest.lastName}` : 'Unknown Guest'}</p>
              <p class="text-muted-foreground">${guest?.email || 'No email'}</p>
              <p class="text-muted-foreground">${guest?.phone || 'No phone'}</p>
              <p class="text-muted-foreground">${guest?.address || 'No address'}</p>
            </div>
          </div>
          
          <div class="text-right">
            <div class="space-y-1 text-sm">
              <p><span class="text-muted-foreground">Invoice #:</span> ${invoice.id.slice(-8).toUpperCase()}</p>
              <p><span class="text-muted-foreground">Date:</span> ${formatDate(invoice.createdAt)}</p>
              <p><span class="text-muted-foreground">Status:</span> ${createStatusBadge(invoice.status)}</p>
            </div>
          </div>
        </div>
        
        <div class="border border-border rounded-lg overflow-hidden">
          <table class="w-full">
            <thead class="bg-muted/50">
              <tr>
                <th class="px-4 py-3 text-left text-sm font-medium">Description</th>
                <th class="px-4 py-3 text-right text-sm font-medium">Quantity</th>
                <th class="px-4 py-3 text-right text-sm font-medium">Rate</th>
                <th class="px-4 py-3 text-right text-sm font-medium">Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td class="px-4 py-3">
                  <div>
                    <p class="font-medium">Room ${room?.number || 'Unknown'} - ${room?.type || 'Unknown'}</p>
                    <p class="text-sm text-muted-foreground">
                      ${booking ? `${formatDate(booking.checkIn)} to ${formatDate(booking.checkOut)}` : 'Unknown dates'}
                    </p>
                  </div>
                </td>
                <td class="px-4 py-3 text-right">${nights} nights</td>
                <td class="px-4 py-3 text-right">${room ? formatCurrency(room.pricePerNight) : '$0'}</td>
                <td class="px-4 py-3 text-right font-medium">${formatCurrency(invoice.amount)}</td>
              </tr>
            </tbody>
            <tfoot class="bg-muted/20">
              <tr>
                <td colspan="3" class="px-4 py-3 text-right font-medium">Total:</td>
                <td class="px-4 py-3 text-right font-bold text-lg">${formatCurrency(invoice.amount)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
        
        <div class="text-center text-sm text-muted-foreground">
          <p>Thank you for staying with LuxeStay Hotel!</p>
        </div>
      </div>
    `;
    
    const actions = `
      <button class="btn btn-outline" onclick="Modal.close()">Close</button>
      <button class="btn btn-primary" onclick="Billing.printInvoice('${invoice.id}')">Print Invoice</button>
    `;
    
    Modal.show('Invoice Details', content, actions);
  },
  
  printInvoice: function(invoiceId) {
    const invoice = invoiceStorage.findById(invoiceId);
    const booking = bookingStorage.findById(invoice.bookingId);
    const guest = booking ? guestStorage.findById(booking.guestId) : null;
    const room = booking ? roomStorage.findById(booking.roomId) : null;
    
    if (!invoice) return;
    
    const nights = booking ? Math.ceil((new Date(booking.checkOut) - new Date(booking.checkIn)) / (1000 * 60 * 60 * 24)) : 0;
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Invoice #${invoice.id.slice(-8).toUpperCase()}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px; }
          .invoice-details { display: flex; justify-content: space-between; margin-bottom: 30px; }
          .bill-to h4 { margin-bottom: 10px; }
          .invoice-info { text-align: right; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
          th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
          th { background-color: #f5f5f5; font-weight: bold; }
          .text-right { text-align: right; }
          .total-row { background-color: #f9f9f9; font-weight: bold; }
          .footer { text-align: center; margin-top: 30px; font-style: italic; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>INVOICE</h1>
          <h2>LuxeStay Hotel Management</h2>
          <p>123 Luxury Avenue, City, State 12345</p>
        </div>
        
        <div class="invoice-details">
          <div class="bill-to">
            <h4>Bill To:</h4>
            <p><strong>${guest ? `${guest.firstName} ${guest.lastName}` : 'Unknown Guest'}</strong></p>
            <p>${guest?.email || 'No email'}</p>
            <p>${guest?.phone || 'No phone'}</p>
            <p>${guest?.address || 'No address'}</p>
          </div>
          
          <div class="invoice-info">
            <p><strong>Invoice #:</strong> ${invoice.id.slice(-8).toUpperCase()}</p>
            <p><strong>Date:</strong> ${formatDate(invoice.createdAt)}</p>
            <p><strong>Status:</strong> ${invoice.status.toUpperCase()}</p>
          </div>
        </div>
        
        <table>
          <thead>
            <tr>
              <th>Description</th>
              <th class="text-right">Quantity</th>
              <th class="text-right">Rate</th>
              <th class="text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <strong>Room ${room?.number || 'Unknown'} - ${room?.type || 'Unknown'}</strong><br>
                <small>${booking ? `${formatDate(booking.checkIn)} to ${formatDate(booking.checkOut)}` : 'Unknown dates'}</small>
              </td>
              <td class="text-right">${nights} nights</td>
              <td class="text-right">${room ? formatCurrency(room.pricePerNight) : '$0'}</td>
              <td class="text-right">${formatCurrency(invoice.amount)}</td>
            </tr>
            <tr class="total-row">
              <td colspan="3" class="text-right"><strong>Total:</strong></td>
              <td class="text-right"><strong>${formatCurrency(invoice.amount)}</strong></td>
            </tr>
          </tbody>
        </table>
        
        <div class="footer">
          <p>Thank you for staying with LuxeStay Hotel!</p>
        </div>
      </body>
      </html>
    `);
    
    printWindow.document.close();
    printWindow.print();
  },
  
  deleteInvoice: function(invoiceId) {
    const invoice = invoiceStorage.findById(invoiceId);
    if (!invoice) return;
    
    confirmDialog(
      'Are you sure you want to delete this invoice? This action cannot be undone.',
      () => {
        invoiceStorage.delete(invoiceId);
        Toast.show('Invoice deleted successfully', 'success');
        window.app.refreshCurrentPage();
      }
    );
  },
  
  generateReport: function() {
    const invoices = invoiceStorage.getAll();
    const bookings = bookingStorage.getAll();
    const guests = guestStorage.getAll();
    const rooms = roomStorage.getAll();
    
    // Calculate various metrics
    const totalRevenue = invoices.filter(i => i.status === 'paid').reduce((sum, i) => sum + i.amount, 0);
    const totalBookings = bookings.length;
    const totalGuests = guests.length;
    const occupancyRate = Math.round((rooms.filter(r => r.status === 'occupied').length / rooms.length) * 100);
    
    // Generate CSV content
    const csvContent = [
      ['LuxeStay Hotel - Financial Report'],
      ['Generated on:', new Date().toLocaleDateString()],
      [''],
      ['Summary Statistics'],
      ['Total Revenue:', `$${totalRevenue.toFixed(2)}`],
      ['Total Bookings:', totalBookings],
      ['Total Guests:', totalGuests],
      ['Current Occupancy Rate:', `${occupancyRate}%`],
      [''],
      ['Invoice Details'],
      ['Invoice ID', 'Booking ID', 'Guest Name', 'Amount', 'Status', 'Date'],
      ...invoices.map(invoice => {
        const booking = bookingStorage.findById(invoice.bookingId);
        const guest = booking ? guestStorage.findById(booking.guestId) : null;
        return [
          `#${invoice.id.slice(-6)}`,
          booking ? `#${booking.id.slice(-6)}` : 'Unknown',
          guest ? `${guest.firstName} ${guest.lastName}` : 'Unknown',
          `$${invoice.amount.toFixed(2)}`,
          invoice.status,
          formatDate(invoice.createdAt)
        ];
      })
    ];
    
    // Convert to CSV string
    const csv = csvContent.map(row => row.join(',')).join('\n');
    
    // Download CSV
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `hotel-financial-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    
    Toast.show('Financial report generated successfully', 'success');
  }
};