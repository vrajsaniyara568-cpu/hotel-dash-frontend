import { useState, useEffect } from "react";
import { Plus, Search, Filter, Edit, Trash2, Calendar, User, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { bookingStorage, guestStorage, roomStorage } from "@/lib/storage";
import type { Booking, BookingStatus, Guest, Room } from "@/types/hotel";
import { useToast } from "@/hooks/use-toast";

export default function Bookings() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>([]);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [availableRooms, setAvailableRooms] = useState<Room[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<BookingStatus | "all">("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const { toast } = useToast();

  // Form state
  const [formData, setFormData] = useState({
    guestId: '',
    roomId: '',
    checkIn: '',
    checkOut: '',
    specialRequests: '',
    status: 'active' as BookingStatus,
  });

  const bookingStatuses: { value: BookingStatus; label: string; variant: string }[] = [
    { value: 'active', label: 'Active', variant: 'bg-blue-100 text-blue-800' },
    { value: 'checked-in', label: 'Checked In', variant: 'bg-green-100 text-green-800' },
    { value: 'checked-out', label: 'Checked Out', variant: 'bg-gray-100 text-gray-800' },
    { value: 'cancelled', label: 'Cancelled', variant: 'bg-red-100 text-red-800' },
  ];

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterBookings();
  }, [bookings, searchTerm, statusFilter]);

  const loadData = () => {
    const allBookings = bookingStorage.getAll();
    const allGuests = guestStorage.getAll();
    const allRooms = roomStorage.getAll();
    
    setBookings(allBookings);
    setGuests(allGuests);
    setAvailableRooms(allRooms.filter(room => room.status === 'available'));
  };

  const filterBookings = () => {
    let filtered = bookings;

    if (searchTerm) {
      filtered = filtered.filter(booking => {
        const guest = guests.find(g => g.id === booking.guestId);
        const room = roomStorage.findById(booking.roomId);
        const guestName = guest ? `${guest.firstName} ${guest.lastName}` : '';
        const roomNumber = room?.number || '';
        
        return guestName.toLowerCase().includes(searchTerm.toLowerCase()) ||
               roomNumber.toLowerCase().includes(searchTerm.toLowerCase());
      });
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter(booking => booking.status === statusFilter);
    }

    setFilteredBookings(filtered);
  };

  const resetForm = () => {
    setFormData({
      guestId: '',
      roomId: '',
      checkIn: '',
      checkOut: '',
      specialRequests: '',
      status: 'active',
    });
  };

  const calculateTotalAmount = (checkIn: Date, checkOut: Date, roomId: string): number => {
    const room = roomStorage.findById(roomId);
    if (!room) return 0;

    const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
    return nights * room.pricePerNight;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.guestId || !formData.roomId || !formData.checkIn || !formData.checkOut) {
      toast({
        title: "Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    const checkInDate = new Date(formData.checkIn);
    const checkOutDate = new Date(formData.checkOut);

    if (checkInDate >= checkOutDate) {
      toast({
        title: "Error",
        description: "Check-out date must be after check-in date.",
        variant: "destructive",
      });
      return;
    }

    const totalAmount = calculateTotalAmount(checkInDate, checkOutDate, formData.roomId);
    
    if (editingBooking) {
      // Update existing booking
      const updatedBooking: Booking = {
        ...editingBooking,
        guestId: formData.guestId,
        roomId: formData.roomId,
        checkIn: checkInDate,
        checkOut: checkOutDate,
        status: formData.status,
        specialRequests: formData.specialRequests,
        totalAmount,
        updatedAt: new Date(),
      };

      bookingStorage.update(editingBooking.id, updatedBooking);
      toast({
        title: "Success",
        description: "Booking updated successfully!",
      });
    } else {
      // Create new booking
      const newBooking: Booking = {
        id: crypto.randomUUID(),
        guestId: formData.guestId,
        roomId: formData.roomId,
        checkIn: checkInDate,
        checkOut: checkOutDate,
        status: formData.status,
        totalAmount,
        paidAmount: 0,
        specialRequests: formData.specialRequests,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      bookingStorage.add(newBooking);
      
      // Update room status to occupied if booking is active or checked-in
      if (formData.status === 'active' || formData.status === 'checked-in') {
        roomStorage.update(formData.roomId, { status: 'occupied' });
      }

      toast({
        title: "Success",
        description: "Booking created successfully!",
      });
    }

    resetForm();
    setEditingBooking(null);
    setIsAddDialogOpen(false);
    loadData();
  };

  const handleEdit = (booking: Booking) => {
    setEditingBooking(booking);
    setFormData({
      guestId: booking.guestId,
      roomId: booking.roomId,
      checkIn: booking.checkIn.toISOString().split('T')[0],
      checkOut: booking.checkOut.toISOString().split('T')[0],
      specialRequests: booking.specialRequests || '',
      status: booking.status,
    });
    setIsAddDialogOpen(true);
  };

  const handleDelete = (booking: Booking) => {
    const guest = guests.find(g => g.id === booking.guestId);
    const guestName = guest ? `${guest.firstName} ${guest.lastName}` : 'Unknown Guest';
    
    if (window.confirm(`Are you sure you want to delete the booking for ${guestName}?`)) {
      bookingStorage.delete(booking.id);
      
      // Update room status back to available if booking was active
      if (booking.status === 'active' || booking.status === 'checked-in') {
        roomStorage.update(booking.roomId, { status: 'available' });
      }
      
      loadData();
      toast({
        title: "Success",
        description: "Booking deleted successfully!",
      });
    }
  };

  const handleCheckIn = (booking: Booking) => {
    bookingStorage.update(booking.id, { 
      status: 'checked-in',
      updatedAt: new Date() 
    });
    roomStorage.update(booking.roomId, { status: 'occupied' });
    loadData();
    toast({
      title: "Success",
      description: "Guest checked in successfully!",
    });
  };

  const handleCheckOut = (booking: Booking) => {
    bookingStorage.update(booking.id, { 
      status: 'checked-out',
      updatedAt: new Date() 
    });
    roomStorage.update(booking.roomId, { status: 'available' });
    loadData();
    toast({
      title: "Success",
      description: "Guest checked out successfully!",
    });
  };

  const getStatusBadgeClass = (status: BookingStatus) => {
    const statusInfo = bookingStatuses.find(s => s.value === status);
    return statusInfo?.variant || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gradient">Booking Management</h1>
          <p className="text-muted-foreground">Manage hotel reservations and guest stays</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
          setIsAddDialogOpen(open);
          if (!open) {
            resetForm();
            setEditingBooking(null);
          }
        }}>
          <DialogTrigger asChild>
            <Button className="luxury-gradient">
              <Plus className="w-4 h-4 mr-2" />
              New Booking
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingBooking ? 'Edit Booking' : 'Create New Booking'}
              </DialogTitle>
              <DialogDescription>
                {editingBooking ? 'Update booking details' : 'Create a new room reservation'}
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="guest">Guest *</Label>
                  <Select value={formData.guestId} onValueChange={(value) => 
                    setFormData(prev => ({ ...prev, guestId: value }))
                  }>
                    <SelectTrigger>
                      <SelectValue placeholder="Select guest" />
                    </SelectTrigger>
                    <SelectContent>
                      {guests.map((guest) => (
                        <SelectItem key={guest.id} value={guest.id}>
                          {guest.firstName} {guest.lastName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="room">Room *</Label>
                  <Select value={formData.roomId} onValueChange={(value) => 
                    setFormData(prev => ({ ...prev, roomId: value }))
                  }>
                    <SelectTrigger>
                      <SelectValue placeholder="Select room" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableRooms.map((room) => (
                        <SelectItem key={room.id} value={room.id}>
                          Room {room.number} - {room.type} (${room.pricePerNight}/night)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="checkIn">Check-in Date *</Label>
                  <Input
                    id="checkIn"
                    type="date"
                    value={formData.checkIn}
                    onChange={(e) => setFormData(prev => ({ ...prev, checkIn: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="checkOut">Check-out Date *</Label>
                  <Input
                    id="checkOut"
                    type="date"
                    value={formData.checkOut}
                    onChange={(e) => setFormData(prev => ({ ...prev, checkOut: e.target.value }))}
                    required
                  />
                </div>
                <div className="col-span-2">
                  <Label htmlFor="status">Status</Label>
                  <Select value={formData.status} onValueChange={(value: BookingStatus) => 
                    setFormData(prev => ({ ...prev, status: value }))
                  }>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {bookingStatuses.map((status) => (
                        <SelectItem key={status.value} value={status.value}>
                          {status.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="specialRequests">Special Requests</Label>
                <Textarea
                  id="specialRequests"
                  value={formData.specialRequests}
                  onChange={(e) => setFormData(prev => ({ ...prev, specialRequests: e.target.value }))}
                  placeholder="Any special requests or notes..."
                />
              </div>

              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="luxury-gradient">
                  {editingBooking ? 'Update Booking' : 'Create Booking'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters and Search */}
      <div className="flex gap-4 flex-wrap">
        <div className="flex-1 min-w-64">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search by guest name or room number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <Select value={statusFilter} onValueChange={(value: BookingStatus | "all") => setStatusFilter(value)}>
          <SelectTrigger className="w-40">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            {bookingStatuses.map((status) => (
              <SelectItem key={status.value} value={status.value}>
                {status.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Bookings List */}
      <div className="space-y-4">
        {filteredBookings.map((booking) => {
          const guest = guests.find(g => g.id === booking.guestId);
          const room = roomStorage.findById(booking.roomId);
          const nights = Math.ceil((new Date(booking.checkOut).getTime() - new Date(booking.checkIn).getTime()) / (1000 * 60 * 60 * 24));

          return (
            <Card key={booking.id} className="hotel-card">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <User className="w-5 h-5" />
                        {guest ? `${guest.firstName} ${guest.lastName}` : 'Unknown Guest'}
                      </CardTitle>
                      <CardDescription>
                        Room {room?.number} • {nights} nights • Total: ${booking.totalAmount}
                      </CardDescription>
                    </div>
                  </div>
                  <Badge className={getStatusBadgeClass(booking.status)}>
                    {booking.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Check-in</p>
                    <p className="font-medium">{new Date(booking.checkIn).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Check-out</p>
                    <p className="font-medium">{new Date(booking.checkOut).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Room Type</p>
                    <p className="font-medium capitalize">{room?.type}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Contact</p>
                    <p className="font-medium">{guest?.email}</p>
                  </div>
                </div>

                {booking.specialRequests && (
                  <div className="mb-4">
                    <p className="text-sm text-muted-foreground mb-1">Special Requests</p>
                    <p className="text-sm bg-muted p-2 rounded">{booking.specialRequests}</p>
                  </div>
                )}

                <div className="flex gap-2 flex-wrap">
                  {booking.status === 'active' && (
                    <Button
                      size="sm"
                      onClick={() => handleCheckIn(booking)}
                      className="bg-success hover:bg-success/90"
                    >
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Check In
                    </Button>
                  )}
                  {booking.status === 'checked-in' && (
                    <Button
                      size="sm"
                      onClick={() => handleCheckOut(booking)}
                      className="bg-accent hover:bg-accent/90"
                    >
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Check Out
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(booking)}
                  >
                    <Edit className="w-4 h-4 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(booking)}
                    className="text-destructive hover:text-destructive-foreground hover:bg-destructive"
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredBookings.length === 0 && (
        <div className="text-center py-12">
          <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No bookings found</h3>
          <p className="text-muted-foreground">
            {bookings.length === 0 
              ? "Start by creating your first booking."
              : "Try adjusting your search filters."
            }
          </p>
        </div>
      )}
    </div>
  );
}