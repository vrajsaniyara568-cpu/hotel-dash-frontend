import { useState, useEffect } from "react";
import { 
  Users, 
  Bed, 
  Calendar, 
  DollarSign,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { roomStorage, guestStorage, bookingStorage } from "@/lib/storage";
import type { DashboardStats } from "@/types/hotel";

function StatCard({ 
  title, 
  value, 
  description, 
  icon: Icon, 
  trend,
  className = ""
}: {
  title: string;
  value: string | number;
  description: string;
  icon: any;
  trend?: string;
  className?: string;
}) {
  return (
    <Card className={`hotel-card animate-fade-in ${className}`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className="h-5 w-5 text-accent" />
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold text-foreground">{value}</div>
        <p className="text-xs text-muted-foreground mt-1">
          {trend && (
            <span className="text-success flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              {trend}
            </span>
          )}
          {description}
        </p>
      </CardContent>
    </Card>
  );
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalRooms: 0,
    availableRooms: 0,
    occupiedRooms: 0,
    maintenanceRooms: 0,
    totalGuests: 0,
    activeBookings: 0,
    todayCheckIns: 0,
    todayCheckOuts: 0,
    totalRevenue: 0,
    monthlyRevenue: 0,
    occupancyRate: 0,
  });

  useEffect(() => {
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

    setStats({
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
    });
  }, []);

  const recentBookings = bookingStorage.getAll()
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  const upcomingCheckIns = bookingStorage.getAll()
    .filter(b => {
      const checkIn = new Date(b.checkIn);
      const today = new Date();
      return checkIn >= today && b.status === 'active';
    })
    .sort((a, b) => new Date(a.checkIn).getTime() - new Date(b.checkIn).getTime())
    .slice(0, 5);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-gradient">Hotel Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Welcome back! Here's what's happening at your hotel today.
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm text-muted-foreground">
            {new Date().toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Rooms"
          value={stats.totalRooms}
          description="Available inventory"
          icon={Bed}
        />
        <StatCard
          title="Occupancy Rate"
          value={`${stats.occupancyRate}%`}
          description="Current occupancy"
          icon={TrendingUp}
          trend="+5.2% from yesterday"
        />
        <StatCard
          title="Active Bookings"
          value={stats.activeBookings}
          description="Current reservations"
          icon={Calendar}
        />
        <StatCard
          title="Monthly Revenue"
          value={`$${stats.monthlyRevenue.toLocaleString()}`}
          description="This month's earnings"
          icon={DollarSign}
          trend="+12.3% from last month"
        />
      </div>

      {/* Secondary Stats */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Available Rooms"
          value={stats.availableRooms}
          description="Ready for booking"
          icon={CheckCircle}
          className="border-success/20"
        />
        <StatCard
          title="Occupied Rooms"
          value={stats.occupiedRooms}
          description="Currently booked"
          icon={Users}
          className="border-primary/20"
        />
        <StatCard
          title="Today's Check-ins"
          value={stats.todayCheckIns}
          description="Expected arrivals"
          icon={Clock}
          className="border-accent/20"
        />
        <StatCard
          title="Today's Check-outs"
          value={stats.todayCheckOuts}
          description="Expected departures"
          icon={AlertCircle}
          className="border-warning/20"
        />
      </div>

      {/* Recent Activity & Upcoming */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Bookings */}
        <Card className="hotel-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-accent" />
              Recent Bookings
            </CardTitle>
            <CardDescription>Latest reservations made</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentBookings.length > 0 ? (
                recentBookings.map((booking) => {
                  const guest = guestStorage.findById(booking.guestId);
                  const room = roomStorage.findById(booking.roomId);
                  return (
                    <div key={booking.id} className="flex items-center justify-between p-3 border border-border/50 rounded-lg hover:bg-muted/50 transition-colors">
                      <div>
                        <p className="font-medium">{guest ? `${guest.firstName} ${guest.lastName}` : 'Unknown Guest'}</p>
                        <p className="text-sm text-muted-foreground">Room {room?.number} • {booking.status}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">${booking.totalAmount}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(booking.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-muted-foreground text-center py-4">No recent bookings</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Check-ins */}
        <Card className="hotel-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-accent" />
              Upcoming Check-ins
            </CardTitle>
            <CardDescription>Expected arrivals</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {upcomingCheckIns.length > 0 ? (
                upcomingCheckIns.map((booking) => {
                  const guest = guestStorage.findById(booking.guestId);
                  const room = roomStorage.findById(booking.roomId);
                  return (
                    <div key={booking.id} className="flex items-center justify-between p-3 border border-border/50 rounded-lg hover:bg-muted/50 transition-colors">
                      <div>
                        <p className="font-medium">{guest ? `${guest.firstName} ${guest.lastName}` : 'Unknown Guest'}</p>
                        <p className="text-sm text-muted-foreground">Room {room?.number}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">
                          {new Date(booking.checkIn).toLocaleDateString()}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {Math.ceil((new Date(booking.checkOut).getTime() - new Date(booking.checkIn).getTime()) / (1000 * 60 * 60 * 24))} nights
                        </p>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-muted-foreground text-center py-4">No upcoming check-ins</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}