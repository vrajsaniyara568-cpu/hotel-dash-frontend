import { useState, useEffect } from "react";
import { Plus, Search, Filter, Edit, Trash2, Bed, Users, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { roomStorage } from "@/lib/storage";
import type { Room, RoomType, RoomStatus } from "@/types/hotel";
import { useToast } from "@/hooks/use-toast";

const roomTypes: { value: RoomType; label: string; capacity: number }[] = [
  { value: 'single', label: 'Single Room', capacity: 1 },
  { value: 'double', label: 'Double Room', capacity: 2 },
  { value: 'suite', label: 'Suite', capacity: 4 },
  { value: 'deluxe', label: 'Deluxe Room', capacity: 2 },
  { value: 'presidential', label: 'Presidential Suite', capacity: 6 },
];

const roomStatuses: { value: RoomStatus; label: string; variant: string }[] = [
  { value: 'available', label: 'Available', variant: 'status-available' },
  { value: 'occupied', label: 'Occupied', variant: 'status-occupied' },
  { value: 'maintenance', label: 'Maintenance', variant: 'status-maintenance' },
  { value: 'cleaning', label: 'Cleaning', variant: 'status-maintenance' },
];

export default function Rooms() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [filteredRooms, setFilteredRooms] = useState<Room[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<RoomStatus | "all">("all");
  const [typeFilter, setTypeFilter] = useState<RoomType | "all">("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const { toast } = useToast();

  // Form state
  const [formData, setFormData] = useState({
    number: '',
    type: 'single' as RoomType,
    pricePerNight: '',
    status: 'available' as RoomStatus,
    description: '',
    amenities: [] as string[],
  });

  const availableAmenities = [
    'WiFi', 'TV', 'Air Conditioning', 'Mini Bar', 'Balcony', 
    'Kitchenette', 'Safe', 'Room Service', 'Ocean View', 'City View'
  ];

  useEffect(() => {
    loadRooms();
  }, []);

  useEffect(() => {
    filterRooms();
  }, [rooms, searchTerm, statusFilter, typeFilter]);

  const loadRooms = () => {
    const allRooms = roomStorage.getAll();
    setRooms(allRooms);
  };

  const filterRooms = () => {
    let filtered = rooms;

    if (searchTerm) {
      filtered = filtered.filter(room => 
        room.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        room.type.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter(room => room.status === statusFilter);
    }

    if (typeFilter !== "all") {
      filtered = filtered.filter(room => room.type === typeFilter);
    }

    setFilteredRooms(filtered);
  };

  const resetForm = () => {
    setFormData({
      number: '',
      type: 'single',
      pricePerNight: '',
      status: 'available',
      description: '',
      amenities: [],
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.number || !formData.pricePerNight) {
      toast({
        title: "Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    const typeInfo = roomTypes.find(t => t.value === formData.type);
    
    if (editingRoom) {
      // Update existing room
      const updatedRoom: Room = {
        ...editingRoom,
        number: formData.number,
        type: formData.type,
        pricePerNight: parseFloat(formData.pricePerNight),
        status: formData.status,
        capacity: typeInfo?.capacity || 1,
        description: formData.description,
        amenities: formData.amenities,
        updatedAt: new Date(),
      };

      roomStorage.update(editingRoom.id, updatedRoom);
      toast({
        title: "Success",
        description: "Room updated successfully!",
      });
    } else {
      // Create new room
      const newRoom: Room = {
        id: crypto.randomUUID(),
        number: formData.number,
        type: formData.type,
        pricePerNight: parseFloat(formData.pricePerNight),
        status: formData.status,
        capacity: typeInfo?.capacity || 1,
        description: formData.description,
        amenities: formData.amenities,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      roomStorage.add(newRoom);
      toast({
        title: "Success",
        description: "Room added successfully!",
      });
    }

    resetForm();
    setEditingRoom(null);
    setIsAddDialogOpen(false);
    loadRooms();
  };

  const handleEdit = (room: Room) => {
    setEditingRoom(room);
    setFormData({
      number: room.number,
      type: room.type,
      pricePerNight: room.pricePerNight.toString(),
      status: room.status,
      description: room.description || '',
      amenities: room.amenities,
    });
    setIsAddDialogOpen(true);
  };

  const handleDelete = (room: Room) => {
    if (window.confirm(`Are you sure you want to delete room ${room.number}?`)) {
      roomStorage.delete(room.id);
      loadRooms();
      toast({
        title: "Success",
        description: "Room deleted successfully!",
      });
    }
  };

  const handleAmenityToggle = (amenity: string) => {
    setFormData(prev => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter(a => a !== amenity)
        : [...prev.amenities, amenity]
    }));
  };

  const getStatusBadgeClass = (status: RoomStatus) => {
    const statusInfo = roomStatuses.find(s => s.value === status);
    return statusInfo?.variant || 'status-available';
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gradient">Room Management</h1>
          <p className="text-muted-foreground">Manage hotel rooms and their availability</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
          setIsAddDialogOpen(open);
          if (!open) {
            resetForm();
            setEditingRoom(null);
          }
        }}>
          <DialogTrigger asChild>
            <Button className="luxury-gradient">
              <Plus className="w-4 h-4 mr-2" />
              Add Room
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingRoom ? 'Edit Room' : 'Add New Room'}
              </DialogTitle>
              <DialogDescription>
                {editingRoom ? 'Update room details' : 'Add a new room to your hotel inventory'}
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="number">Room Number *</Label>
                  <Input
                    id="number"
                    value={formData.number}
                    onChange={(e) => setFormData(prev => ({ ...prev, number: e.target.value }))}
                    placeholder="e.g., 101"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="type">Room Type *</Label>
                  <Select value={formData.type} onValueChange={(value: RoomType) => 
                    setFormData(prev => ({ ...prev, type: value }))
                  }>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {roomTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label} (Max {type.capacity} guests)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="price">Price per Night *</Label>
                  <Input
                    id="price"
                    type="number"
                    value={formData.pricePerNight}
                    onChange={(e) => setFormData(prev => ({ ...prev, pricePerNight: e.target.value }))}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select value={formData.status} onValueChange={(value: RoomStatus) => 
                    setFormData(prev => ({ ...prev, status: value }))
                  }>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {roomStatuses.map((status) => (
                        <SelectItem key={status.value} value={status.value}>
                          {status.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Room description..."
                />
              </div>

              <div>
                <Label>Amenities</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {availableAmenities.map((amenity) => (
                    <label key={amenity} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.amenities.includes(amenity)}
                        onChange={() => handleAmenityToggle(amenity)}
                        className="rounded border-border"
                      />
                      <span className="text-sm">{amenity}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="luxury-gradient">
                  {editingRoom ? 'Update Room' : 'Add Room'}
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
              placeholder="Search rooms..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <Select value={statusFilter} onValueChange={(value: RoomStatus | "all") => setStatusFilter(value)}>
          <SelectTrigger className="w-40">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            {roomStatuses.map((status) => (
              <SelectItem key={status.value} value={status.value}>
                {status.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={(value: RoomType | "all") => setTypeFilter(value)}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {roomTypes.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Rooms Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filteredRooms.map((room) => (
          <Card key={room.id} className="hotel-card">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl">Room {room.number}</CardTitle>
                <Badge className={getStatusBadgeClass(room.status)}>
                  {room.status}
                </Badge>
              </div>
              <CardDescription className="capitalize">
                {room.type.replace(/([A-Z])/g, ' $1')} Room
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="w-4 h-4" />
                  <span>Max {room.capacity} guests</span>
                </div>
                <div className="flex items-center gap-1 font-semibold">
                  <DollarSign className="w-4 h-4" />
                  <span>{room.pricePerNight}/night</span>
                </div>
              </div>
              
              {room.description && (
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {room.description}
                </p>
              )}

              {room.amenities.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {room.amenities.slice(0, 3).map((amenity) => (
                    <Badge key={amenity} variant="secondary" className="text-xs">
                      {amenity}
                    </Badge>
                  ))}
                  {room.amenities.length > 3 && (
                    <Badge variant="secondary" className="text-xs">
                      +{room.amenities.length - 3} more
                    </Badge>
                  )}
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEdit(room)}
                  className="flex-1"
                >
                  <Edit className="w-4 h-4 mr-1" />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDelete(room)}
                  className="flex-1 text-destructive hover:text-destructive-foreground hover:bg-destructive"
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredRooms.length === 0 && (
        <div className="text-center py-12">
          <Bed className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No rooms found</h3>
          <p className="text-muted-foreground">
            {rooms.length === 0 
              ? "Start by adding your first room to the system."
              : "Try adjusting your search filters."
            }
          </p>
        </div>
      )}
    </div>
  );
}