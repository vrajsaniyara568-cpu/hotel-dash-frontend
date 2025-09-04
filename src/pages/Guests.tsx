import { useState, useEffect } from "react";
import { Plus, Search, Edit, Trash2, User, Mail, Phone, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { guestStorage, bookingStorage, roomStorage } from "@/lib/storage";
import type { Guest, Booking } from "@/types/hotel";
import { useToast } from "@/hooks/use-toast";

export default function Guests() {
  const [guests, setGuests] = useState<Guest[]>([]);
  const [filteredGuests, setFilteredGuests] = useState<Guest[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingGuest, setEditingGuest] = useState<Guest | null>(null);
  const { toast } = useToast();

  // Form state
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    idNumber: '',
    preferences: [] as string[],
  });

  const availablePreferences = [
    'Non-smoking room', 'High floor', 'Ocean view', 'City view', 
    'Quiet room', 'Late check-out', 'Early check-in', 'Extra pillows',
    'Room service', 'Housekeeping preference', 'Vegetarian meals', 'Pet-friendly'
  ];

  useEffect(() => {
    loadGuests();
  }, []);

  useEffect(() => {
    filterGuests();
  }, [guests, searchTerm]);

  const loadGuests = () => {
    const allGuests = guestStorage.getAll();
    setGuests(allGuests);
  };

  const filterGuests = () => {
    let filtered = guests;

    if (searchTerm) {
      filtered = filtered.filter(guest => 
        `${guest.firstName} ${guest.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        guest.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        guest.phone.includes(searchTerm)
      );
    }

    setFilteredGuests(filtered);
  };

  const resetForm = () => {
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      address: '',
      idNumber: '',
      preferences: [],
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.phone) {
      toast({
        title: "Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    // Check for duplicate email (excluding current guest if editing)
    const existingGuest = guestStorage.findByEmail(formData.email);
    if (existingGuest && (!editingGuest || existingGuest.id !== editingGuest.id)) {
      toast({
        title: "Error",
        description: "A guest with this email already exists.",
        variant: "destructive",
      });
      return;
    }
    
    if (editingGuest) {
      // Update existing guest
      const updatedGuest: Guest = {
        ...editingGuest,
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        idNumber: formData.idNumber,
        preferences: formData.preferences,
        updatedAt: new Date(),
      };

      guestStorage.update(editingGuest.id, updatedGuest);
      toast({
        title: "Success",
        description: "Guest updated successfully!",
      });
    } else {
      // Create new guest
      const newGuest: Guest = {
        id: crypto.randomUUID(),
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        idNumber: formData.idNumber,
        preferences: formData.preferences,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      guestStorage.add(newGuest);
      toast({
        title: "Success",
        description: "Guest added successfully!",
      });
    }

    resetForm();
    setEditingGuest(null);
    setIsAddDialogOpen(false);
    loadGuests();
  };

  const handleEdit = (guest: Guest) => {
    setEditingGuest(guest);
    setFormData({
      firstName: guest.firstName,
      lastName: guest.lastName,
      email: guest.email,
      phone: guest.phone,
      address: guest.address || '',
      idNumber: guest.idNumber || '',
      preferences: guest.preferences || [],
    });
    setIsAddDialogOpen(true);
  };

  const handleDelete = (guest: Guest) => {
    // Check if guest has active bookings
    const guestBookings = bookingStorage.findByGuestId(guest.id);
    const activeBookings = guestBookings.filter(b => b.status === 'active' || b.status === 'checked-in');

    if (activeBookings.length > 0) {
      toast({
        title: "Cannot delete guest",
        description: "This guest has active bookings. Please complete or cancel them first.",
        variant: "destructive",
      });
      return;
    }

    if (window.confirm(`Are you sure you want to delete ${guest.firstName} ${guest.lastName}?`)) {
      guestStorage.delete(guest.id);
      loadGuests();
      toast({
        title: "Success",
        description: "Guest deleted successfully!",
      });
    }
  };

  const handlePreferenceToggle = (preference: string) => {
    setFormData(prev => ({
      ...prev,
      preferences: prev.preferences.includes(preference)
        ? prev.preferences.filter(p => p !== preference)
        : [...prev.preferences, preference]
    }));
  };

  const getGuestBookings = (guestId: string): Booking[] => {
    return bookingStorage.findByGuestId(guestId);
  };

  const getGuestStats = (guestId: string) => {
    const bookings = getGuestBookings(guestId);
    const totalBookings = bookings.length;
    const completedStays = bookings.filter(b => b.status === 'checked-out').length;
    const totalSpent = bookings.reduce((sum, b) => sum + (b.status === 'checked-out' ? b.totalAmount : 0), 0);
    const currentBooking = bookings.find(b => b.status === 'checked-in');

    return {
      totalBookings,
      completedStays,
      totalSpent,
      currentBooking,
    };
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gradient">Guest Management</h1>
          <p className="text-muted-foreground">Manage guest information and preferences</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
          setIsAddDialogOpen(open);
          if (!open) {
            resetForm();
            setEditingGuest(null);
          }
        }}>
          <DialogTrigger asChild>
            <Button className="luxury-gradient">
              <Plus className="w-4 h-4 mr-2" />
              Add Guest
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingGuest ? 'Edit Guest' : 'Add New Guest'}
              </DialogTitle>
              <DialogDescription>
                {editingGuest ? 'Update guest information' : 'Add a new guest to your system'}
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">First Name *</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                    placeholder="John"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name *</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                    placeholder="Doe"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="john.doe@email.com"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone *</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="+1-555-0123"
                    required
                  />
                </div>
                <div className="col-span-2">
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                    placeholder="123 Main St, City, State"
                  />
                </div>
                <div className="col-span-2">
                  <Label htmlFor="idNumber">ID Number</Label>
                  <Input
                    id="idNumber"
                    value={formData.idNumber}
                    onChange={(e) => setFormData(prev => ({ ...prev, idNumber: e.target.value }))}
                    placeholder="Driver's license or passport number"
                  />
                </div>
              </div>

              <div>
                <Label>Preferences</Label>
                <div className="grid grid-cols-2 gap-2 mt-2 max-h-40 overflow-y-auto">
                  {availablePreferences.map((preference) => (
                    <label key={preference} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.preferences.includes(preference)}
                        onChange={() => handlePreferenceToggle(preference)}
                        className="rounded border-border"
                      />
                      <span className="text-sm">{preference}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="luxury-gradient">
                  {editingGuest ? 'Update Guest' : 'Add Guest'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="flex gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search guests by name, email, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </div>

      {/* Guests Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredGuests.map((guest) => {
          const stats = getGuestStats(guest.id);
          return (
            <Card key={guest.id} className="hotel-card">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <User className="w-5 h-5" />
                    {guest.firstName} {guest.lastName}
                  </CardTitle>
                  {stats.currentBooking && (
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                      Current Guest
                    </span>
                  )}
                </div>
                <CardDescription>
                  Member since {new Date(guest.createdAt).toLocaleDateString()}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <span className="truncate">{guest.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <span>{guest.phone}</span>
                  </div>
                  {guest.address && (
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="w-4 h-4 text-muted-foreground" />
                      <span className="truncate">{guest.address}</span>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-2 bg-muted rounded">
                    <p className="text-lg font-semibold">{stats.totalBookings}</p>
                    <p className="text-xs text-muted-foreground">Bookings</p>
                  </div>
                  <div className="p-2 bg-muted rounded">
                    <p className="text-lg font-semibold">{stats.completedStays}</p>
                    <p className="text-xs text-muted-foreground">Stays</p>
                  </div>
                  <div className="p-2 bg-muted rounded">
                    <p className="text-lg font-semibold">${stats.totalSpent}</p>
                    <p className="text-xs text-muted-foreground">Spent</p>
                  </div>
                </div>

                {guest.preferences && guest.preferences.length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-1">Preferences</p>
                    <div className="flex flex-wrap gap-1">
                      {guest.preferences.slice(0, 2).map((pref) => (
                        <span key={pref} className="text-xs bg-secondary text-secondary-foreground px-2 py-1 rounded">
                          {pref}
                        </span>
                      ))}
                      {guest.preferences.length > 2 && (
                        <span className="text-xs bg-secondary text-secondary-foreground px-2 py-1 rounded">
                          +{guest.preferences.length - 2} more
                        </span>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(guest)}
                    className="flex-1"
                  >
                    <Edit className="w-4 h-4 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(guest)}
                    className="flex-1 text-destructive hover:text-destructive-foreground hover:bg-destructive"
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredGuests.length === 0 && (
        <div className="text-center py-12">
          <User className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No guests found</h3>
          <p className="text-muted-foreground">
            {guests.length === 0 
              ? "Start by adding your first guest to the system."
              : "Try adjusting your search criteria."
            }
          </p>
        </div>
      )}
    </div>
  );
}