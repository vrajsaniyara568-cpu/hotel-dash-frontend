import { useState, useEffect } from "react";
import { Search, Filter, Printer, Download, Receipt, Calendar, User, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { bookingStorage, guestStorage, roomStorage, invoiceStorage } from "@/lib/storage";
import type { Invoice, Booking, Guest, Room } from "@/types/hotel";
import { useToast } from "@/hooks/use-toast";

export default function Billing() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [filteredInvoices, setFilteredInvoices] = useState<Invoice[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "paid" | "unpaid">("all");
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isInvoiceDialogOpen, setIsInvoiceDialogOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterInvoices();
  }, [invoices, searchTerm, statusFilter]);

  const loadData = () => {
    const allBookings = bookingStorage.getAll();
    const allInvoices = invoiceStorage.getAll();
    
    // Generate invoices for completed bookings that don't have invoices yet
    const completedBookings = allBookings.filter(b => b.status === 'checked-out');
    
    completedBookings.forEach(booking => {
      const existingInvoice = allInvoices.find(inv => inv.bookingId === booking.id);
      if (!existingInvoice) {
        const guest = guestStorage.findById(booking.guestId);
        const room = roomStorage.findById(booking.roomId);
        
        if (guest && room) {
          const nights = Math.ceil((new Date(booking.checkOut).getTime() - new Date(booking.checkIn).getTime()) / (1000 * 60 * 60 * 24));
          const subtotal = nights * room.pricePerNight;
          const taxes = subtotal * 0.1; // 10% tax rate
          const total = subtotal + taxes;

          const newInvoice: Invoice = {
            id: crypto.randomUUID(),
            bookingId: booking.id,
            guestId: booking.guestId,
            roomNumber: room.number,
            checkIn: booking.checkIn,
            checkOut: booking.checkOut,
            nights,
            roomRate: room.pricePerNight,
            subtotal,
            taxes,
            total,
            paid: booking.paidAmount >= total,
            createdAt: new Date(),
          };

          invoiceStorage.add(newInvoice);
        }
      }
    });
    
    setBookings(allBookings);
    setInvoices(invoiceStorage.getAll());
  };

  const filterInvoices = () => {
    let filtered = invoices;

    if (searchTerm) {
      filtered = filtered.filter(invoice => {
        const guest = guestStorage.findById(invoice.guestId);
        const guestName = guest ? `${guest.firstName} ${guest.lastName}` : '';
        return guestName.toLowerCase().includes(searchTerm.toLowerCase()) ||
               invoice.roomNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
               invoice.id.toLowerCase().includes(searchTerm.toLowerCase());
      });
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter(invoice => 
        statusFilter === "paid" ? invoice.paid : !invoice.paid
      );
    }

    // Sort by creation date, newest first
    filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    setFilteredInvoices(filtered);
  };

  const handleMarkAsPaid = (invoice: Invoice) => {
    invoiceStorage.update(invoice.id, { paid: true });
    
    // Update booking paid amount
    const booking = bookings.find(b => b.id === invoice.bookingId);
    if (booking) {
      bookingStorage.update(booking.id, { paidAmount: invoice.total });
    }
    
    loadData();
    toast({
      title: "Success",
      description: "Invoice marked as paid!",
    });
  };

  const handlePrintInvoice = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setIsInvoiceDialogOpen(true);
  };

  const printInvoice = () => {
    window.print();
  };

  const exportData = (format: 'csv' | 'json') => {
    const dataToExport = filteredInvoices.map(invoice => {
      const guest = guestStorage.findById(invoice.guestId);
      return {
        invoiceId: invoice.id,
        guestName: guest ? `${guest.firstName} ${guest.lastName}` : 'Unknown',
        guestEmail: guest?.email || '',
        roomNumber: invoice.roomNumber,
        checkIn: invoice.checkIn.toISOString().split('T')[0],
        checkOut: invoice.checkOut.toISOString().split('T')[0],
        nights: invoice.nights,
        roomRate: invoice.roomRate,
        subtotal: invoice.subtotal,
        taxes: invoice.taxes,
        total: invoice.total,
        paid: invoice.paid,
        createdAt: invoice.createdAt.toISOString().split('T')[0],
      };
    });

    if (format === 'csv') {
      const csv = [
        Object.keys(dataToExport[0]).join(','),
        ...dataToExport.map(row => Object.values(row).join(','))
      ].join('\n');
      
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoices-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
    } else {
      const json = JSON.stringify(dataToExport, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoices-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
    }

    toast({
      title: "Success",
      description: `Data exported as ${format.toUpperCase()}!`,
    });
  };

  const totalRevenue = filteredInvoices.reduce((sum, inv) => sum + inv.total, 0);
  const paidRevenue = filteredInvoices.filter(inv => inv.paid).reduce((sum, inv) => sum + inv.total, 0);
  const unpaidRevenue = totalRevenue - paidRevenue;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gradient">Billing & Invoices</h1>
          <p className="text-muted-foreground">Manage payments and generate invoices</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => exportData('csv')}
          >
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
          <Button 
            variant="outline" 
            onClick={() => exportData('json')}
          >
            <Download className="w-4 h-4 mr-2" />
            Export JSON
          </Button>
        </div>
      </div>

      {/* Revenue Summary */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="hotel-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Revenue
            </CardTitle>
            <DollarSign className="h-5 w-5 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">${totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              From {filteredInvoices.length} invoices
            </p>
          </CardContent>
        </Card>
        
        <Card className="hotel-card border-success/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Paid Revenue
            </CardTitle>
            <DollarSign className="h-5 w-5 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-success">${paidRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {filteredInvoices.filter(inv => inv.paid).length} paid invoices
            </p>
          </CardContent>
        </Card>

        <Card className="hotel-card border-warning/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Outstanding
            </CardTitle>
            <DollarSign className="h-5 w-5 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-warning">${unpaidRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {filteredInvoices.filter(inv => !inv.paid).length} unpaid invoices
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <div className="flex gap-4 flex-wrap">
        <div className="flex-1 min-w-64">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search by guest name, room number, or invoice ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <Select value={statusFilter} onValueChange={(value: "all" | "paid" | "unpaid") => setStatusFilter(value)}>
          <SelectTrigger className="w-40">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
            <SelectItem value="unpaid">Unpaid</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Invoices List */}
      <div className="space-y-4">
        {filteredInvoices.map((invoice) => {
          const guest = guestStorage.findById(invoice.guestId);
          
          return (
            <Card key={invoice.id} className="hotel-card">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Receipt className="w-5 h-5" />
                        Invoice #{invoice.id.slice(-8).toUpperCase()}
                      </CardTitle>
                      <CardDescription>
                        {guest ? `${guest.firstName} ${guest.lastName}` : 'Unknown Guest'} • Room {invoice.roomNumber}
                      </CardDescription>
                    </div>
                  </div>
                  <Badge className={invoice.paid ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'}>
                    {invoice.paid ? 'Paid' : 'Unpaid'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Check-in</p>
                    <p className="font-medium">{new Date(invoice.checkIn).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Check-out</p>
                    <p className="font-medium">{new Date(invoice.checkOut).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Nights</p>
                    <p className="font-medium">{invoice.nights}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Rate/Night</p>
                    <p className="font-medium">${invoice.roomRate}</p>
                  </div>
                </div>

                <div className="bg-muted/50 p-4 rounded-lg mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <span>Subtotal ({invoice.nights} nights × ${invoice.roomRate})</span>
                    <span>${invoice.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <span>Taxes (10%)</span>
                    <span>${invoice.taxes.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center font-bold text-lg border-t border-border pt-2">
                    <span>Total</span>
                    <span>${invoice.total.toFixed(2)}</span>
                  </div>
                </div>

                <div className="flex gap-2 flex-wrap">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePrintInvoice(invoice)}
                  >
                    <Printer className="w-4 h-4 mr-1" />
                    View Invoice
                  </Button>
                  {!invoice.paid && (
                    <Button
                      size="sm"
                      onClick={() => handleMarkAsPaid(invoice)}
                      className="bg-success hover:bg-success/90"
                    >
                      Mark as Paid
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredInvoices.length === 0 && (
        <div className="text-center py-12">
          <Receipt className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No invoices found</h3>
          <p className="text-muted-foreground">
            {invoices.length === 0 
              ? "Invoices will be automatically generated for completed bookings."
              : "Try adjusting your search filters."
            }
          </p>
        </div>
      )}

      {/* Invoice Modal */}
      <Dialog open={isInvoiceDialogOpen} onOpenChange={setIsInvoiceDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader className="print:hidden">
            <DialogTitle>Invoice Preview</DialogTitle>
            <DialogDescription>
              <div className="flex gap-2 mt-2">
                <Button size="sm" onClick={printInvoice}>
                  <Printer className="w-4 h-4 mr-1" />
                  Print
                </Button>
              </div>
            </DialogDescription>
          </DialogHeader>
          
          {selectedInvoice && (
            <div className="print:shadow-none">
              {/* Invoice Content */}
              <div className="space-y-6 p-6 bg-white text-black">
                {/* Header */}
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-2xl font-bold text-primary">LuxeStay Hotel</h2>
                    <p className="text-muted-foreground">123 Luxury Avenue, City, State 12345</p>
                    <p className="text-muted-foreground">Phone: +1-555-HOTEL</p>
                  </div>
                  <div className="text-right">
                    <h3 className="text-xl font-bold">INVOICE</h3>
                    <p>#{selectedInvoice.id.slice(-8).toUpperCase()}</p>
                    <p>{new Date(selectedInvoice.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>

                {/* Bill To */}
                <div>
                  <h4 className="font-semibold mb-2">Bill To:</h4>
                  <div className="text-sm">
                    {(() => {
                      const guest = guestStorage.findById(selectedInvoice.guestId);
                      return guest ? (
                        <>
                          <p>{guest.firstName} {guest.lastName}</p>
                          <p>{guest.email}</p>
                          <p>{guest.phone}</p>
                          {guest.address && <p>{guest.address}</p>}
                        </>
                      ) : (
                        <p>Guest information not available</p>
                      );
                    })()}
                  </div>
                </div>

                {/* Stay Details */}
                <div>
                  <h4 className="font-semibold mb-2">Stay Details:</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p><span className="font-medium">Room:</span> {selectedInvoice.roomNumber}</p>
                      <p><span className="font-medium">Check-in:</span> {new Date(selectedInvoice.checkIn).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p><span className="font-medium">Nights:</span> {selectedInvoice.nights}</p>
                      <p><span className="font-medium">Check-out:</span> {new Date(selectedInvoice.checkOut).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>

                {/* Charges */}
                <div className="border border-border rounded-lg p-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Room charge ({selectedInvoice.nights} nights × ${selectedInvoice.roomRate})</span>
                      <span>${selectedInvoice.subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Taxes (10%)</span>
                      <span>${selectedInvoice.taxes.toFixed(2)}</span>
                    </div>
                    <div className="border-t border-border pt-2">
                      <div className="flex justify-between font-bold text-lg">
                        <span>Total Amount</span>
                        <span>${selectedInvoice.total.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Payment Status */}
                <div className="text-center">
                  <div className={`inline-block px-4 py-2 rounded-lg ${
                    selectedInvoice.paid 
                      ? 'bg-success/10 text-success' 
                      : 'bg-warning/10 text-warning'
                  }`}>
                    {selectedInvoice.paid ? 'PAID' : 'PAYMENT DUE'}
                  </div>
                </div>

                {/* Footer */}
                <div className="text-center text-sm text-muted-foreground">
                  <p>Thank you for staying with LuxeStay Hotel!</p>
                  <p>We hope you enjoyed your stay and look forward to welcoming you again.</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}