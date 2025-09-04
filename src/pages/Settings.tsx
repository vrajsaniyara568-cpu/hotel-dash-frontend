import { Settings as SettingsIcon, Hotel, Database, Download, Upload, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { roomStorage, guestStorage, bookingStorage, invoiceStorage } from "@/lib/storage";
import { useToast } from "@/hooks/use-toast";

export default function Settings() {
  const { toast } = useToast();

  const exportAllData = () => {
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

    toast({
      title: "Success",
      description: "All data exported successfully!",
    });
  };

  const importData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        
        // Validate data structure
        if (!data.rooms || !data.guests || !data.bookings || !data.invoices) {
          throw new Error('Invalid data format');
        }

        // Import data
        roomStorage.save(data.rooms);
        guestStorage.save(data.guests);
        bookingStorage.save(data.bookings);
        invoiceStorage.save(data.invoices);

        toast({
          title: "Success",
          description: "Data imported successfully! Please refresh the page.",
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to import data. Please check the file format.",
          variant: "destructive",
        });
      }
    };
    reader.readAsText(file);

    // Clear the input value to allow importing the same file again
    event.target.value = '';
  };

  const clearAllData = () => {
    if (window.confirm('Are you sure you want to clear ALL data? This action cannot be undone.')) {
      if (window.confirm('This will permanently delete all rooms, guests, bookings, and invoices. Are you absolutely sure?')) {
        roomStorage.save([]);
        guestStorage.save([]);
        bookingStorage.save([]);
        invoiceStorage.save([]);

        toast({
          title: "Success",
          description: "All data cleared successfully!",
        });
      }
    }
  };

  const getDataStats = () => {
    return {
      rooms: roomStorage.getAll().length,
      guests: guestStorage.getAll().length,
      bookings: bookingStorage.getAll().length,
      invoices: invoiceStorage.getAll().length,
    };
  };

  const stats = getDataStats();

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gradient">Settings</h1>
        <p className="text-muted-foreground">Manage your hotel management system settings</p>
      </div>

      {/* Hotel Information */}
      <Card className="hotel-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Hotel className="w-5 h-5" />
            Hotel Information
          </CardTitle>
          <CardDescription>Basic information about your hotel</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-lg">LuxeStay Hotel</h3>
              <p className="text-muted-foreground">123 Luxury Avenue</p>
              <p className="text-muted-foreground">City, State 12345</p>
              <p className="text-muted-foreground">Phone: +1-555-HOTEL</p>
            </div>
            <div>
              <h4 className="font-medium mb-2">System Statistics</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Total Rooms</p>
                  <p className="font-semibold">{stats.rooms}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Total Guests</p>
                  <p className="font-semibold">{stats.guests}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Total Bookings</p>
                  <p className="font-semibold">{stats.bookings}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Total Invoices</p>
                  <p className="font-semibold">{stats.invoices}</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Management */}
      <Card className="hotel-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            Data Management
          </CardTitle>
          <CardDescription>Backup, restore, and manage your system data</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <h4 className="font-medium">Export Data</h4>
              <p className="text-sm text-muted-foreground">
                Download a complete backup of all your data
              </p>
              <Button onClick={exportAllData} className="w-full" variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Export All Data
              </Button>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium">Import Data</h4>
              <p className="text-sm text-muted-foreground">
                Restore data from a previously exported backup
              </p>
              <div className="relative">
                <input
                  type="file"
                  accept=".json"
                  onChange={importData}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <Button variant="outline" className="w-full">
                  <Upload className="w-4 h-4 mr-2" />
                  Import Data
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium">Clear All Data</h4>
              <p className="text-sm text-muted-foreground">
                Permanently delete all system data
              </p>
              <Button 
                onClick={clearAllData} 
                variant="outline" 
                className="w-full text-destructive hover:text-destructive-foreground hover:bg-destructive"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Clear All Data
              </Button>
            </div>
          </div>

          <div className="bg-muted/50 p-4 rounded-lg">
            <h4 className="font-medium mb-2">Important Notes:</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• All data is stored locally in your browser's storage</li>
              <li>• Export your data regularly to prevent data loss</li>
              <li>• Clearing browser data will remove all hotel information</li>
              <li>• Imported data will overwrite existing data completely</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* System Information */}
      <Card className="hotel-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <SettingsIcon className="w-5 h-5" />
            System Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
            <div>
              <h4 className="font-medium mb-2">Technology Stack</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• React + TypeScript</li>
                <li>• Tailwind CSS</li>
                <li>• LocalStorage API</li>
                <li>• Shadcn/ui Components</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">Features</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Room Management</li>
                <li>• Booking System</li>
                <li>• Guest Database</li>
                <li>• Billing & Invoicing</li>
                <li>• Data Export/Import</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}